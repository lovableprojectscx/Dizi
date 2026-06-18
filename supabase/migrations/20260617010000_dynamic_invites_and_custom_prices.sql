-- =============================================================================
-- MIGRACIÓN: Enlaces Dinámicos y Precios Personalizados
-- Fecha: 2026-06-17
-- Descripción:
--   1. Elimina la tabla 'plan_prices' (se vuelve a precios públicos estáticos).
--   2. Agrega columnas de duración dinámica y precio personalizado a 'invites' y 'stores'.
--   3. Redefine 'activate_subscription' y 'activate_subscription_with_invite'.
-- =============================================================================

-- ─── 1. LIMPIEZA DE TABLA Y FUNCIONES PREVIAS ────────────────────────────────
DROP TABLE IF EXISTS public.plan_prices CASCADE;
DROP FUNCTION IF EXISTS public.activate_subscription(text,text,integer);
DROP FUNCTION IF EXISTS public.activate_subscription(text,text,integer,numeric);
DROP FUNCTION IF EXISTS public.activate_subscription_with_invite(text,text);

-- ─── 2. ACTUALIZACIÓN DE TABLA invites ────────────────────────────────────────
ALTER TABLE public.invites
  ADD COLUMN IF NOT EXISTS custom_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS duration_value INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS duration_unit TEXT NOT NULL DEFAULT 'months' CHECK (duration_unit IN ('days', 'months'));

-- Migrar datos de invitaciones antiguas
UPDATE public.invites
SET 
  duration_value = CASE WHEN duration_months = 0 THEN 15 ELSE duration_months END,
  duration_unit = CASE WHEN duration_months = 0 THEN 'days' ELSE 'months' END
WHERE duration_value = 1;

-- ─── 3. ACTUALIZACIÓN DE TABLA stores ─────────────────────────────────────────
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS custom_price NUMERIC(10,2);

-- ─── 4. REDEFINICIÓN DE FUNCIONES ────────────────────────────────────────────

-- 4.1 activate_subscription con soporte para precio personalizado
CREATE OR REPLACE FUNCTION public.activate_subscription(
  p_store_id    TEXT,
  p_plan        TEXT,
  p_duration_months INT DEFAULT 1,
  p_custom_price NUMERIC DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Verificar autorización
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
      plan_duration_months = NULL,
      custom_price         = NULL
    WHERE id = p_store_id;
  ELSE
    v_expires_at := NOW() + (p_duration_months || ' months')::INTERVAL;
    UPDATE public.stores
    SET
      plan                 = p_plan,
      plan_expires_at      = v_expires_at,
      subscription_status  = 'active',
      plan_duration_months = p_duration_months,
      custom_price         = p_custom_price,
      cancelled_at         = NULL,
      cancel_reason        = NULL
    WHERE id = p_store_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.2 activate_subscription_with_invite con soporte para duración dinámica y precio copiado
CREATE OR REPLACE FUNCTION public.activate_subscription_with_invite(
  p_store_id TEXT, 
  p_invite_token TEXT
)
RETURNS TABLE(plan text, duration_value integer, duration_unit text, custom_price numeric)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invite RECORD;
  v_expires_at TIMESTAMPTZ;
  v_subscription_status TEXT;
  v_plan_duration_months INT;
BEGIN
  -- 1. Buscar y bloquear la fila del invite para evitar condiciones de carrera
  SELECT * INTO v_invite
  FROM public.invites
  WHERE token = p_invite_token AND used = false AND expires_at > NOW()
  FOR UPDATE;

  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'El enlace de invitación no es válido o ya fue utilizado.';
  END IF;

  -- 2. Marcar el invite como usado
  UPDATE public.invites
  SET used = true
  WHERE token = p_invite_token;

  -- 3. Activar la suscripción de la tienda
  IF v_invite.plan = 'semilla' THEN
    UPDATE public.stores
    SET
      plan                 = v_invite.plan,
      plan_expires_at      = NULL,
      subscription_status  = 'trial',
      plan_duration_months = NULL,
      custom_price         = NULL
    WHERE id = p_store_id;
  ELSE
    -- Calcular expiración y estado según la unidad
    IF v_invite.duration_unit = 'days' THEN
      v_expires_at := NOW() + (v_invite.duration_value || ' days')::INTERVAL;
      v_subscription_status := 'trial';
      v_plan_duration_months := 0;
    ELSE
      v_expires_at := NOW() + (v_invite.duration_value || ' months')::INTERVAL;
      v_subscription_status := 'active';
      v_plan_duration_months := v_invite.duration_value;
    END IF;

    UPDATE public.stores
    SET
      plan                 = v_invite.plan,
      plan_expires_at      = v_expires_at,
      subscription_status  = v_subscription_status,
      plan_duration_months = v_plan_duration_months,
      custom_price         = v_invite.custom_price,
      cancelled_at         = NULL,
      cancel_reason        = NULL
    WHERE id = p_store_id;
  END IF;

  RETURN QUERY 
  SELECT 
    v_invite.plan::TEXT, 
    v_invite.duration_value::INT, 
    v_invite.duration_unit::TEXT, 
    v_invite.custom_price::NUMERIC;
END;
$$;
