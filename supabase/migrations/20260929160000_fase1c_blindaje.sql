-- ==============================================================================
-- Migración FASE 1C: Blindaje de planes, límites de productos, Storage y RLS
-- Fecha: 2026-09-29
-- Descripción:
--   C1: Trigger para proteger columnas de facturación en 'stores'.
--   C1: Validación de permisos en 'activate_subscription_with_invite'.
--   C2: Restricción de Storage a dueños de tienda por carpeta {storeId}/...,
--       límite de 5MB y tipos MIME de imagen permitidos.
--   C3: Función 'effective_product_limit' y trigger 'trg_check_product_limit'.
--   C4: 'get_public_store_products' con tope total de catálogo y respeto de gracia.
--   C5: search_path = public, pg_temp en 11 funciones SECURITY DEFINER.
--   C6: v_expiring_subscriptions con security_invoker = true, índices foráneos
--       faltantes y optimización de 22 políticas RLS para evitar initplan por fila.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- C3.1: Función para calcular el límite de productos efectivo según plan y vigencia
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.effective_product_limit(p_store_id text)
RETURNS integer
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan text;
  v_expires_at timestamptz;
BEGIN
  SELECT plan, plan_expires_at INTO v_plan, v_expires_at
  FROM public.stores
  WHERE id = p_store_id;

  IF NOT FOUND THEN
    RETURN 20;
  END IF;

  v_plan := COALESCE(v_plan, 'semilla');

  IF v_plan = 'semilla' THEN
    RETURN 20;
  END IF;

  -- Periodo de tolerancia: si plan_expires_at venció hace más de 3 días, degradar a semilla (20)
  IF v_expires_at IS NOT NULL AND now() > v_expires_at + interval '3 days' THEN
    RETURN 20;
  END IF;

  RETURN CASE v_plan
    WHEN 'ilimitado' THEN 1000
    WHEN 'pro' THEN 300
    WHEN 'emprendedor' THEN 100
    ELSE 20
  END;
END;
$$;

COMMENT ON FUNCTION public.effective_product_limit(text) IS 'Calcula el límite máximo de productos permitidos según el plan y periodo de gracia (3 días).';

-- ------------------------------------------------------------------------------
-- C1.1: Trigger para proteger columnas de facturación en 'stores'
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_store_billing_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Super admin y roles del sistema tienen acceso total
  IF current_user IN ('postgres', 'supabase_admin', 'service_role')
     OR (COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'super_admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.plan := 'semilla';
    NEW.plan_expires_at := NULL;
    NEW.subscription_status := 'trial';
    NEW.custom_price := NULL;
    NEW.plan_duration_months := NULL;
    NEW.cancelled_at := NULL;
    NEW.views := 0;
    NEW.whatsapp_clicks := 0;
    NEW.referral_rewarded := false;
    NEW.egress_bytes := 0;
    NEW.show_dizi_branding := true;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.plan IS DISTINCT FROM OLD.plan THEN
      RAISE EXCEPTION 'columna protegida: plan' USING ERRCODE = '42501';
    END IF;
    IF NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at THEN
      RAISE EXCEPTION 'columna protegida: plan_expires_at' USING ERRCODE = '42501';
    END IF;
    IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN
      RAISE EXCEPTION 'columna protegida: subscription_status' USING ERRCODE = '42501';
    END IF;
    IF NEW.custom_price IS DISTINCT FROM OLD.custom_price THEN
      RAISE EXCEPTION 'columna protegida: custom_price' USING ERRCODE = '42501';
    END IF;
    IF NEW.plan_duration_months IS DISTINCT FROM OLD.plan_duration_months THEN
      RAISE EXCEPTION 'columna protegida: plan_duration_months' USING ERRCODE = '42501';
    END IF;
    IF NEW.cancelled_at IS DISTINCT FROM OLD.cancelled_at THEN
      RAISE EXCEPTION 'columna protegida: cancelled_at' USING ERRCODE = '42501';
    END IF;
    IF NEW.views IS DISTINCT FROM OLD.views THEN
      RAISE EXCEPTION 'columna protegida: views' USING ERRCODE = '42501';
    END IF;
    IF NEW.whatsapp_clicks IS DISTINCT FROM OLD.whatsapp_clicks THEN
      RAISE EXCEPTION 'columna protegida: whatsapp_clicks' USING ERRCODE = '42501';
    END IF;
    IF NEW.referral_rewarded IS DISTINCT FROM OLD.referral_rewarded THEN
      RAISE EXCEPTION 'columna protegida: referral_rewarded' USING ERRCODE = '42501';
    END IF;
    IF NEW.egress_bytes IS DISTINCT FROM OLD.egress_bytes THEN
      RAISE EXCEPTION 'columna protegida: egress_bytes' USING ERRCODE = '42501';
    END IF;
    IF NEW.legacy_model IS DISTINCT FROM OLD.legacy_model THEN
      RAISE EXCEPTION 'columna protegida: legacy_model' USING ERRCODE = '42501';
    END IF;
    IF NEW.legacy_niche IS DISTINCT FROM OLD.legacy_niche THEN
      RAISE EXCEPTION 'columna protegida: legacy_niche' USING ERRCODE = '42501';
    END IF;
    IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
      RAISE EXCEPTION 'columna protegida: owner_id' USING ERRCODE = '42501';
    END IF;
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'columna protegida: id' USING ERRCODE = '42501';
    END IF;

    -- referred_by: solo se permite asignar si antes era NULL y la tienda fue creada en los últimos 10 minutos
    IF NEW.referred_by IS DISTINCT FROM OLD.referred_by THEN
      IF OLD.referred_by IS NOT NULL OR OLD.created_at < (now() - interval '10 minutes') THEN
        RAISE EXCEPTION 'columna protegida: referred_by' USING ERRCODE = '42501';
      END IF;
    END IF;

    -- show_dizi_branding: solo falla si el valor cambia a false en plan semilla o degradado
    IF NEW.show_dizi_branding IS FALSE 
       AND OLD.show_dizi_branding IS DISTINCT FROM NEW.show_dizi_branding 
       AND (OLD.plan = 'semilla' OR public.effective_product_limit(OLD.id) <= 20) THEN
      RAISE EXCEPTION 'columna protegida: show_dizi_branding' USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_store_billing_columns ON public.stores;
CREATE TRIGGER trg_protect_store_billing_columns
BEFORE INSERT OR UPDATE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.protect_store_billing_columns();

-- ------------------------------------------------------------------------------
-- C1.3: Blindaje de 'activate_subscription_with_invite' con validación de dueño
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.activate_subscription_with_invite(p_store_id text, p_invite_token text)
RETURNS TABLE(plan text, duration_value integer, duration_unit text, custom_price numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_invite RECORD;
  v_expires_at TIMESTAMPTZ;
  v_subscription_status TEXT;
  v_plan_duration_months INT;
  v_store_owner_id UUID;
  v_is_super BOOLEAN;
BEGIN
  -- Validar permisos: rol de service_role o super_admin tienen acceso total; de lo contrario, debe ser el dueño autenticado
  v_is_super := (COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'super_admin');
  
  IF (SELECT auth.role()) = 'service_role' OR v_is_super THEN
    NULL;
  ELSE
    SELECT owner_id INTO v_store_owner_id FROM public.stores WHERE id = p_store_id;
    IF (SELECT auth.uid()) IS NULL OR v_store_owner_id IS NULL OR (SELECT auth.uid()) != v_store_owner_id THEN
      RAISE EXCEPTION 'No autorizado. Solo el dueño de la tienda o un super_admin pueden canjear una invitación.' USING ERRCODE = '42501';
    END IF;
  END IF;

  -- 1. Buscar y bloquear la fila del invite para evitar condiciones de carrera
  SELECT * INTO v_invite
  FROM public.invites
  WHERE token = p_invite_token AND used = false AND expires_at > NOW()
  FOR UPDATE;

  IF NOT FOUND THEN
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

REVOKE EXECUTE ON FUNCTION public.activate_subscription_with_invite(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_subscription_with_invite(text, text) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- C2: Blindaje de Storage bucket 'images' y políticas de objetos
-- ------------------------------------------------------------------------------
UPDATE storage.buckets
SET 
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/gif']::text[]
WHERE id = 'images';

DROP POLICY IF EXISTS "Public Insert Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Access" ON storage.objects;

CREATE POLICY "images_authenticated_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT id FROM public.stores WHERE owner_id = (SELECT auth.uid())
    )
    OR (COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'super_admin')
  )
);

CREATE POLICY "images_authenticated_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT id FROM public.stores WHERE owner_id = (SELECT auth.uid())
    )
    OR (COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'super_admin')
  )
)
WITH CHECK (
  bucket_id = 'images'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT id FROM public.stores WHERE owner_id = (SELECT auth.uid())
    )
    OR (COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'super_admin')
  )
);

CREATE POLICY "images_authenticated_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT id FROM public.stores WHERE owner_id = (SELECT auth.uid())
    )
    OR (COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'super_admin')
  )
);

-- ------------------------------------------------------------------------------
-- C3.2: Trigger para limitar productos visibles según plan
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_product_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_limit integer;
  v_count integer;
BEGIN
  -- Super admin y roles de sistema tienen acceso total
  IF current_user IN ('postgres', 'supabase_admin', 'service_role')
     OR (COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'super_admin') THEN
    RETURN NEW;
  END IF;

  -- Si el producto es oculto o es producto de ejemplo, no cuenta contra el límite
  IF NEW.visible IS NOT TRUE OR COALESCE(NEW.is_sample, false) = true THEN
    RETURN NEW;
  END IF;

  -- En UPDATE, si el producto ya era visible y real en la misma tienda, no incrementa el conteo
  IF TG_OP = 'UPDATE' THEN
    IF OLD.visible IS TRUE AND COALESCE(OLD.is_sample, false) = false AND OLD.store_id = NEW.store_id THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Calcular límite efectivo de la tienda
  v_limit := public.effective_product_limit(NEW.store_id);

  -- Contar productos visibles y reales actuales
  SELECT count(*) INTO v_count
  FROM public.products
  WHERE store_id = NEW.store_id
    AND visible = true
    AND COALESCE(is_sample, false) = false
    AND (TG_OP = 'INSERT' OR id != NEW.id);

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'Límite de productos alcanzado para tu plan (% de %). Oculta productos o mejora tu plan.', v_count, v_limit USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_product_limit ON public.products;
CREATE TRIGGER trg_check_product_limit
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.check_product_limit();

-- ------------------------------------------------------------------------------
-- C4: 'get_public_store_products' con tope total de catálogo y respeto de vigencia
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_public_store_products(
  p_store_slug text, 
  p_page_offset integer DEFAULT 0, 
  p_page_limit integer DEFAULT 24, 
  p_category_id text DEFAULT NULL::text, 
  p_search_query text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_store_row record;
  v_effective_limit int;
  v_page_offset int;
  v_page_limit int;
  v_fetch_limit int;
  result jsonb;
BEGIN
  SELECT id INTO v_store_row FROM stores WHERE slug = p_store_slug AND active = true LIMIT 1;
  IF v_store_row IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  -- Calcular límite efectivo considerando días de gracia
  v_effective_limit := public.effective_product_limit(v_store_row.id);

  v_page_offset := GREATEST(COALESCE(p_page_offset, 0), 0);
  v_page_limit := GREATEST(COALESCE(p_page_limit, 24), 0);

  -- Si el offset ya superó el total permitido, retornar array vacío
  IF v_page_offset >= v_effective_limit THEN
    RETURN '[]'::jsonb;
  END IF;

  -- El límite de la página no puede superar los productos restantes hasta el tope del plan
  v_fetch_limit := LEAST(v_page_limit, v_effective_limit - v_page_offset);

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'price', p.price,
    'category_id', p.category_id,
    'image', p.image,
    'description', p.description,
    'is_on_sale', p.is_on_sale,
    'original_price', p.original_price,
    'visible', p.visible,
    'is_sample', p.is_sample,
    'sort_order', p.sort_order,
    'variations', COALESCE(p.variations, '[]'::jsonb),
    'created_at', p.created_at
  )), '[]'::jsonb) INTO result
  FROM (
    SELECT * FROM products
    WHERE store_id = v_store_row.id 
      AND visible = true
      AND COALESCE(is_sample, false) = false
      AND (p_category_id IS NULL OR p_category_id = '' OR p_category_id = 'all' OR products.category_id = p_category_id)
      AND (
        p_search_query IS NULL 
        OR p_search_query = '' 
        OR products.name ILIKE '%' || p_search_query || '%'
        OR COALESCE(products.description, '') ILIKE '%' || p_search_query || '%'
      )
    ORDER BY sort_order ASC NULLS LAST, created_at DESC
    LIMIT v_fetch_limit
    OFFSET v_page_offset
  ) p;

  RETURN result;
END;
$$;

-- ------------------------------------------------------------------------------
-- C5: search_path fijo en funciones SECURITY DEFINER
-- ------------------------------------------------------------------------------
ALTER FUNCTION public.extend_subscription(text, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_user_sync_role() SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_whatsapp_clicks(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_views(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.cancel_subscription(text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.insert_reclamacion(text, text, text, text, text, text, text, boolean, text, text, text, numeric, text, text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.check_invite(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.activate_subscription(text, text, integer, numeric) SET search_path = public, pg_temp;
ALTER FUNCTION public.activate_subscription(text, text, integer, numeric, boolean, timestamp with time zone) SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_store_touch_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.set_invite_expires_at() SET search_path = public, pg_temp;

-- ------------------------------------------------------------------------------
-- C6.1: Vista v_expiring_subscriptions con security_invoker = true
-- ------------------------------------------------------------------------------
ALTER VIEW public.v_expiring_subscriptions SET (security_invoker = true);

-- ------------------------------------------------------------------------------
-- C6.3: Índices de claves foráneas faltantes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON public.categories (store_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);

-- ------------------------------------------------------------------------------
-- C6.2: Limpieza de políticas duplicadas en reclamaciones
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "reclamaciones_owner_all" ON public.reclamaciones;

-- ------------------------------------------------------------------------------
-- C6.1: Optimización de políticas RLS (InitPlan con SELECT auth...)
-- ------------------------------------------------------------------------------

-- reclamaciones
DROP POLICY IF EXISTS "reclamaciones_owner_select" ON public.reclamaciones;
CREATE POLICY "reclamaciones_owner_select" ON public.reclamaciones
FOR SELECT TO authenticated
USING (
  (COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text)
  OR (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = reclamaciones.tenant_id AND stores.owner_id = (SELECT auth.uid())))
);

DROP POLICY IF EXISTS "reclamaciones_owner_update" ON public.reclamaciones;
CREATE POLICY "reclamaciones_owner_update" ON public.reclamaciones
FOR UPDATE TO authenticated
USING (
  (COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text)
  OR (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = reclamaciones.tenant_id AND stores.owner_id = (SELECT auth.uid())))
)
WITH CHECK (
  (COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text)
  OR (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = reclamaciones.tenant_id AND stores.owner_id = (SELECT auth.uid())))
);

DROP POLICY IF EXISTS "reclamaciones_owner_delete" ON public.reclamaciones;
CREATE POLICY "reclamaciones_owner_delete" ON public.reclamaciones
FOR DELETE TO authenticated
USING (
  (COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text)
  OR (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = reclamaciones.tenant_id AND stores.owner_id = (SELECT auth.uid())))
);

-- stores
DROP POLICY IF EXISTS "stores_owner_select" ON public.stores;
CREATE POLICY "stores_owner_select" ON public.stores
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = owner_id);

DROP POLICY IF EXISTS "stores_owner_insert" ON public.stores;
CREATE POLICY "stores_owner_insert" ON public.stores
FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = owner_id);

DROP POLICY IF EXISTS "stores_owner_update" ON public.stores;
CREATE POLICY "stores_owner_update" ON public.stores
FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = owner_id)
WITH CHECK ((SELECT auth.uid()) = owner_id);

DROP POLICY IF EXISTS "stores_owner_delete" ON public.stores;
CREATE POLICY "stores_owner_delete" ON public.stores
FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = owner_id);

DROP POLICY IF EXISTS "stores_superadmin_select" ON public.stores;
CREATE POLICY "stores_superadmin_select" ON public.stores
FOR SELECT TO authenticated
USING (COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text);

DROP POLICY IF EXISTS "stores_superadmin_insert" ON public.stores;
CREATE POLICY "stores_superadmin_insert" ON public.stores
FOR INSERT TO authenticated
WITH CHECK (COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text);

DROP POLICY IF EXISTS "stores_superadmin_update" ON public.stores;
CREATE POLICY "stores_superadmin_update" ON public.stores
FOR UPDATE TO authenticated
USING (COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text)
WITH CHECK (COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text);

DROP POLICY IF EXISTS "stores_superadmin_delete" ON public.stores;
CREATE POLICY "stores_superadmin_delete" ON public.stores
FOR DELETE TO authenticated
USING (COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text);

-- categories
DROP POLICY IF EXISTS "categories_owner_all" ON public.categories;
CREATE POLICY "categories_owner_all" ON public.categories
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = categories.store_id AND stores.owner_id = (SELECT auth.uid())))
WITH CHECK (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = categories.store_id AND stores.owner_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "categories_public_select" ON public.categories;
CREATE POLICY "categories_public_select" ON public.categories
FOR SELECT TO public
USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = categories.store_id AND (((stores.active = true) AND (stores.is_published = true)) OR (stores.owner_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "categories_superadmin_all" ON public.categories;
CREATE POLICY "categories_superadmin_all" ON public.categories
FOR ALL TO authenticated
USING (COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text)
WITH CHECK (COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text);

-- products
DROP POLICY IF EXISTS "products_owner_all" ON public.products;
CREATE POLICY "products_owner_all" ON public.products
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = products.store_id AND stores.owner_id = (SELECT auth.uid())))
WITH CHECK (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = products.store_id AND stores.owner_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "products_public_select" ON public.products;
CREATE POLICY "products_public_select" ON public.products
FOR SELECT TO public
USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = products.store_id AND (((stores.active = true) AND (stores.is_published = true)) OR (stores.owner_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "products_superadmin_all" ON public.products;
CREATE POLICY "products_superadmin_all" ON public.products
FOR ALL TO authenticated
USING (COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text)
WITH CHECK (COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text);

-- invites
DROP POLICY IF EXISTS "Permitir inserción a super admins" ON public.invites;
CREATE POLICY "Permitir inserción a super admins" ON public.invites
FOR INSERT TO public
WITH CHECK (((SELECT auth.role()) = 'service_role'::text) OR (COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text));

DROP POLICY IF EXISTS "Permitir actualización a super admins" ON public.invites;
CREATE POLICY "Permitir actualización a super admins" ON public.invites
FOR UPDATE TO public
USING (((SELECT auth.role()) = 'service_role'::text) OR (COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text));

DROP POLICY IF EXISTS "Permitir eliminación a super admins" ON public.invites;
CREATE POLICY "Permitir eliminación a super admins" ON public.invites
FOR DELETE TO public
USING (((SELECT auth.role()) = 'service_role'::text) OR (COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text));

DROP POLICY IF EXISTS "Permitir lectura a super admins" ON public.invites;
CREATE POLICY "Permitir lectura a super admins" ON public.invites
FOR SELECT TO authenticated
USING (COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text);


-- ==============================================================================
-- SQL DE REVERSIÓN (ROLLBACK MANUAL SI FUESE NECESARIO)
-- ==============================================================================
/*
-- 1. Triggers
DROP TRIGGER IF EXISTS trg_protect_store_billing_columns ON public.stores;
DROP FUNCTION IF EXISTS public.protect_store_billing_columns();
DROP TRIGGER IF EXISTS trg_check_product_limit ON public.products;
DROP FUNCTION IF EXISTS public.check_product_limit();
DROP FUNCTION IF EXISTS public.effective_product_limit(text);

-- 2. Storage
DROP POLICY IF EXISTS "images_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "images_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "images_authenticated_delete" ON storage.objects;
CREATE POLICY "Public Insert Access" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'images'::text);
CREATE POLICY "Authenticated Insert Access" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'images'::text);
CREATE POLICY "Authenticated Update Access" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'images'::text) WITH CHECK (bucket_id = 'images'::text);
CREATE POLICY "Authenticated Delete Access" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'images'::text);
UPDATE storage.buckets SET file_size_limit = 10485760, allowed_mime_types = NULL WHERE id = 'images';

-- 3. Índices
DROP INDEX IF EXISTS idx_categories_store_id;
DROP INDEX IF EXISTS idx_products_category_id;

-- 4. Vista
ALTER VIEW public.v_expiring_subscriptions RESET (security_invoker);
*/
