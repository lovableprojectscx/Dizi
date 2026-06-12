-- =============================================================================
-- MIGRACIÓN: Mejoras de Seguridad y Ciberseguridad (Suscripciones, Invites y Roles)
-- Fecha: 2026-06-11
-- Descripción:
--   1. Asegura funciones de suscripción para que solo super_admins o service_role puedan ejecutarlas.
--   2. Restringe RLS en la tabla 'invites' y 'reclamaciones' para que solo super_admins o service_role puedan editarlas.
--   3. Implementa sincronización y blindaje de roles en 'auth.users' mediante trigger.
--   4. Migra roles existentes de user_metadata a app_metadata.
-- =============================================================================

-- ─── 1. SINCRONIZACIÓN Y PROTECCIÓN DE ROLES EN auth.users ───────────────────

CREATE OR REPLACE FUNCTION public.handle_user_sync_role()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Si se intenta registrar con rol 'super_admin' en user_metadata, forzar a 'store_owner'
    IF COALESCE(NEW.raw_user_meta_data->>'role', '') = 'super_admin' THEN
      NEW.raw_user_meta_data := NEW.raw_user_meta_data || jsonb_build_object('role', 'store_owner');
    END IF;
    NEW.raw_app_meta_data := NEW.raw_app_meta_data || jsonb_build_object('role', COALESCE(NEW.raw_user_meta_data->>'role', 'store_owner'));
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Bloquear auto-promoción si un cliente intenta cambiar su propio user_metadata a 'super_admin'
    IF NEW.raw_user_meta_data->>'role' = 'super_admin' 
       AND (OLD.raw_user_meta_data->>'role' IS NULL OR OLD.raw_user_meta_data->>'role' != 'super_admin') 
       AND COALESCE(OLD.raw_app_meta_data->>'role', '') != 'super_admin' 
       AND COALESCE(NEW.raw_app_meta_data->>'role', '') != 'super_admin' THEN
      NEW.raw_user_meta_data := NEW.raw_user_meta_data || jsonb_build_object('role', 'store_owner');
    END IF;
    
    -- Sincronizar el app_metadata con el user_metadata si el usuario no es super_admin
    -- Pero si en NEW.raw_app_meta_data ya viene 'super_admin' (por actualización administrativa), respetarlo
    IF COALESCE(NEW.raw_app_meta_data->>'role', '') != 'super_admin' AND COALESCE(OLD.raw_app_meta_data->>'role', '') != 'super_admin' THEN
      NEW.raw_app_meta_data := NEW.raw_app_meta_data || jsonb_build_object('role', COALESCE(NEW.raw_user_meta_data->>'role', 'store_owner'));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger en auth.users
DROP TRIGGER IF EXISTS trg_user_sync_role ON auth.users;
CREATE TRIGGER trg_user_sync_role
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_sync_role();


-- ─── 2. MIGRACIÓN DE ROLES EXISTENTES A app_metadata ─────────────────────────

UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', raw_user_meta_data->>'role')
WHERE raw_user_meta_data->>'role' IS NOT NULL;


-- ─── 3. ASEGURAR RLS EN LA TABLA invites ─────────────────────────────────────

-- Eliminar políticas públicas permisivas antiguas y las que usan user_metadata
DROP POLICY IF EXISTS "Inserción pública de invites" ON public.invites;
DROP POLICY IF EXISTS "Actualización pública de invites" ON public.invites;
DROP POLICY IF EXISTS "invites_superadmin_insert" ON public.invites;
DROP POLICY IF EXISTS "invites_superadmin_update" ON public.invites;
DROP POLICY IF EXISTS "invites_superadmin_delete" ON public.invites;

-- Crear políticas restrictivas basadas en el rol de app_metadata o service_role
CREATE POLICY "Permitir inserción a super admins" ON public.invites
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR COALESCE((auth.jwt()->'app_metadata'->>'role'), '') = 'super_admin'
  );

CREATE POLICY "Permitir actualización a super admins" ON public.invites
  FOR UPDATE USING (
    auth.role() = 'service_role' OR COALESCE((auth.jwt()->'app_metadata'->>'role'), '') = 'super_admin'
  );

CREATE POLICY "Permitir eliminación a super admins" ON public.invites
  FOR DELETE USING (
    auth.role() = 'service_role' OR COALESCE((auth.jwt()->'app_metadata'->>'role'), '') = 'super_admin'
  );

CREATE POLICY "Permitir lectura a super admins" ON public.invites
  FOR SELECT TO authenticated
  USING (
    COALESCE((auth.jwt()->'app_metadata'->>'role'), '') = 'super_admin'
  );


-- ─── 4. ASEGURAR RLS EN LA TABLA reclamaciones ───────────────────────────────

-- Eliminar políticas antiguas que usan user_metadata
DROP POLICY IF EXISTS "reclamaciones_owner_select" ON public.reclamaciones;
DROP POLICY IF EXISTS "reclamaciones_owner_update" ON public.reclamaciones;
DROP POLICY IF EXISTS "reclamaciones_owner_delete" ON public.reclamaciones;

-- Crear nuevas políticas basadas en app_metadata
CREATE POLICY "reclamaciones_owner_select" ON public.reclamaciones
  FOR SELECT TO authenticated
  USING (
    COALESCE((auth.jwt()->'app_metadata'->>'role'), '') = 'super_admin'
    OR EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = reclamaciones.tenant_id AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "reclamaciones_owner_update" ON public.reclamaciones
  FOR UPDATE TO authenticated
  USING (
    COALESCE((auth.jwt()->'app_metadata'->>'role'), '') = 'super_admin'
    OR EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = reclamaciones.tenant_id AND stores.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    COALESCE((auth.jwt()->'app_metadata'->>'role'), '') = 'super_admin'
    OR EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = reclamaciones.tenant_id AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "reclamaciones_owner_delete" ON public.reclamaciones
  FOR DELETE TO authenticated
  USING (
    COALESCE((auth.jwt()->'app_metadata'->>'role'), '') = 'super_admin'
    OR EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = reclamaciones.tenant_id AND stores.owner_id = auth.uid()
    )
  );


-- ─── 5. ASEGURAR FUNCIONES DE SUSCRIPCIÓN (ACCESO RESTRINGIDO) ───────────────

-- Redefinir activate_subscription con verificación de rol
CREATE OR REPLACE FUNCTION public.activate_subscription(
  p_store_id    TEXT,
  p_plan        TEXT,
  p_duration_months INT DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Verificar que el ejecutor sea service_role o un usuario autenticado con rol super_admin en app_metadata
  IF auth.role() != 'service_role' AND COALESCE((auth.jwt()->'app_metadata'->>'role'), '') != 'super_admin' THEN
    RAISE EXCEPTION 'No autorizado. Solo super administradores pueden realizar esta acción.';
  END IF;

  -- Si el plan es semilla (gratis), no se establece expiración
  IF p_plan = 'semilla' THEN
    UPDATE public.stores
    SET
      plan                 = p_plan,
      plan_expires_at      = NULL,
      subscription_status  = 'trial',
      plan_duration_months = NULL
    WHERE id = p_store_id;
  ELSE
    v_expires_at := NOW() + (p_duration_months || ' months')::INTERVAL;
    UPDATE public.stores
    SET
      plan                 = p_plan,
      plan_expires_at      = v_expires_at,
      subscription_status  = 'active',
      plan_duration_months = p_duration_months,
      cancelled_at         = NULL,
      cancel_reason        = NULL
    WHERE id = p_store_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Redefinir cancel_subscription con verificación de rol
CREATE OR REPLACE FUNCTION public.cancel_subscription(
  p_store_id    TEXT,
  p_reason      TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Verificar que el ejecutor sea service_role o un usuario autenticado con rol super_admin en app_metadata
  IF auth.role() != 'service_role' AND COALESCE((auth.jwt()->'app_metadata'->>'role'), '') != 'super_admin' THEN
    RAISE EXCEPTION 'No autorizado. Solo super administradores pueden realizar esta acción.';
  END IF;

  UPDATE public.stores
  SET
    plan                = 'semilla',
    subscription_status = 'cancelled',
    cancelled_at        = NOW(),
    cancel_reason       = p_reason,
    plan_expires_at     = NOW()  -- vence inmediatamente
  WHERE id = p_store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Redefinir extend_subscription con verificación de rol
CREATE OR REPLACE FUNCTION public.extend_subscription(
  p_store_id        TEXT,
  p_months_to_add   INT DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  v_current_expires TIMESTAMPTZ;
BEGIN
  -- Verificar que el ejecutor sea service_role o un usuario autenticado con rol super_admin en app_metadata
  IF auth.role() != 'service_role' AND COALESCE((auth.jwt()->'app_metadata'->>'role'), '') != 'super_admin' THEN
    RAISE EXCEPTION 'No autorizado. Solo super administradores pueden realizar esta acción.';
  END IF;

  SELECT plan_expires_at INTO v_current_expires FROM public.stores WHERE id = p_store_id;

  -- Si ya expiró, extiende desde ahora; si no, extiende desde la fecha actual
  UPDATE public.stores
  SET
    plan_expires_at     = GREATEST(v_current_expires, NOW()) + (p_months_to_add || ' months')::INTERVAL,
    subscription_status = 'active',
    cancelled_at        = NULL,
    cancel_reason       = NULL
  WHERE id = p_store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
