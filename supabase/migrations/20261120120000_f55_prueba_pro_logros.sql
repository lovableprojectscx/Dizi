-- ==============================================================================
-- Migración: F55 - Prueba Pro 7 días + Logros (store_rewards) + Imagen Catálogo
-- Archivo: supabase/migrations/20261120120000_f55_prueba_pro_logros.sql
-- Fecha: 2026-11-20
--
-- NOTA IMPORTANTE: Archivo de migración preparado para Paso 1.
-- NO APLICAR A PRODUCCIÓN HASTA EL OK ESCRITO DE JACK Y PREVIO AL MERGE.
--
-- Contenido:
--   1. Actualiza `protect_store_billing_columns()`:
--      - En INSERT: plan = 'pro', plan_expires_at = now() + 7 días,
--        subscription_status = 'trial', show_dizi_branding = NULL.
--      - En UPDATE: permanece 100% idéntico.
--   2. Tabla `public.store_rewards` con UNIQUE(store_id, milestone) y RLS.
--   3. RPC `public.claim_trial_rewards(p_store_id text)`:
--      - SECURITY DEFINER, search_path = public, pg_temp.
--      - Evalúa 3 logros: 'productos_3' (+3d), 'compartir' (+2d), 'marca' (+2d).
--      - Valida dueño, estado de prueba vigente, tope +7 días y evita duplicados.
--   4. Amplía los CHECKs de `public.share_events` (source y style) para 'catalogo'.
--   5. Script de reversión comentado al final.
-- ==============================================================================

-- 1. Actualizar protect_store_billing_columns() (solo rama INSERT)
CREATE OR REPLACE FUNCTION public.protect_store_billing_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Super admin y roles del sistema tienen acceso total
  IF current_user IN ('postgres', 'supabase_admin', 'service_role')
     OR (COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'super_admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.plan := 'pro';
    NEW.plan_expires_at := now() + interval '7 days';
    NEW.subscription_status := 'trial';
    NEW.custom_price := NULL;
    NEW.plan_duration_months := NULL;
    NEW.cancelled_at := NULL;
    NEW.views := 0;
    NEW.whatsapp_clicks := 0;
    NEW.referral_rewarded := false;
    NEW.egress_bytes := 0;
    NEW.show_dizi_branding := NULL;
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
$function$;

-- 2. Tabla store_rewards con RLS
CREATE TABLE IF NOT EXISTS public.store_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id text NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  milestone text NOT NULL CHECK (milestone IN ('productos_3', 'compartir', 'marca')),
  days integer NOT NULL CHECK (days BETWEEN 1 AND 7),
  granted_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_rewards_store_milestone_key UNIQUE (store_id, milestone)
);

CREATE INDEX IF NOT EXISTS idx_store_rewards_store_id ON public.store_rewards(store_id);

ALTER TABLE public.store_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS store_rewards_owner_select ON public.store_rewards;
CREATE POLICY store_rewards_owner_select ON public.store_rewards
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = store_rewards.store_id
        AND stores.owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS store_rewards_superadmin_select ON public.store_rewards;
CREATE POLICY store_rewards_superadmin_select ON public.store_rewards
  FOR SELECT TO authenticated
  USING (
    COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'super_admin'
  );

-- Sin políticas de INSERT, UPDATE o DELETE para clientes (solo via RPC SECURITY DEFINER o superadmin)

-- 3. RPC claim_trial_rewards
CREATE OR REPLACE FUNCTION public.claim_trial_rewards(p_store_id text)
 RETURNS TABLE(milestone text, days integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_store RECORD;
  v_is_super BOOLEAN;
  v_has_prod3 BOOLEAN := false;
  v_has_share BOOLEAN := false;
  v_has_marca BOOLEAN := false;
  v_total_granted INT := 0;
  v_max_additional INT := 0;
  v_days_to_add INT := 0;
  v_granted_prod3 BOOLEAN := false;
  v_granted_share BOOLEAN := false;
  v_granted_marca BOOLEAN := false;
BEGIN
  -- Validar que la tienda exista
  SELECT * INTO v_store FROM public.stores WHERE id = p_store_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tienda no encontrada.' USING ERRCODE = 'P0002';
  END IF;

  -- Validar permisos: super_admin o dueño autenticado
  v_is_super := (COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'super_admin');
  IF (SELECT auth.role()) = 'service_role' OR v_is_super THEN
    NULL;
  ELSE
    IF (SELECT auth.uid()) IS NULL OR (SELECT auth.uid()) != v_store.owner_id THEN
      RAISE EXCEPTION 'No autorizado. Solo la dueña de la tienda puede reclamar logros.' USING ERRCODE = '42501';
    END IF;
  END IF;

  -- Validar que esté en período de prueba activo y vigente
  IF v_store.subscription_status != 'trial' OR v_store.plan != 'pro' THEN
    RETURN;
  END IF;

  IF v_store.plan_expires_at IS NULL OR v_store.plan_expires_at <= now() THEN
    RETURN;
  END IF;

  -- Consultar logros ya otorgados
  SELECT 
    COALESCE(sum(sr.days), 0),
    bool_or(sr.milestone = 'productos_3'),
    bool_or(sr.milestone = 'compartir'),
    bool_or(sr.milestone = 'marca')
  INTO 
    v_total_granted,
    v_granted_prod3,
    v_granted_share,
    v_granted_marca
  FROM public.store_rewards sr
  WHERE sr.store_id = p_store_id;

  v_total_granted := COALESCE(v_total_granted, 0);
  v_granted_prod3 := COALESCE(v_granted_prod3, false);
  v_granted_share := COALESCE(v_granted_share, false);
  v_granted_marca := COALESCE(v_granted_marca, false);

  -- Si ya alcanzó el tope de 7 días adicionales, salir
  IF v_total_granted >= 7 THEN
    RETURN;
  END IF;

  v_max_additional := 7 - v_total_granted;

  -- Evaluar 1: Sube 3 productos con foto (+3 días)
  IF NOT v_granted_prod3 THEN
    SELECT (count(*) >= 3) INTO v_has_prod3
    FROM public.products p
    WHERE p.store_id = p_store_id
      AND p.visible = true
      AND COALESCE(p.image, '') <> ''
      AND NOT COALESCE(p.is_sample, false);

    IF v_has_prod3 THEN
      v_days_to_add := LEAST(3, v_max_additional);
      IF v_days_to_add > 0 THEN
        INSERT INTO public.store_rewards(store_id, milestone, days)
        VALUES (p_store_id, 'productos_3', v_days_to_add)
        ON CONFLICT ON CONSTRAINT store_rewards_store_milestone_key DO NOTHING;

        milestone := 'productos_3';
        days := v_days_to_add;
        v_total_granted := v_total_granted + v_days_to_add;
        v_max_additional := 7 - v_total_granted;
        RETURN NEXT;
      END IF;
    END IF;
  END IF;

  -- Evaluar 2: Comparte tu tienda (+2 días)
  IF NOT v_granted_share AND v_max_additional > 0 THEN
    SELECT EXISTS (
      SELECT 1 FROM public.share_events se WHERE se.store_id = p_store_id
    ) INTO v_has_share;

    IF v_has_share THEN
      v_days_to_add := LEAST(2, v_max_additional);
      IF v_days_to_add > 0 THEN
        INSERT INTO public.store_rewards(store_id, milestone, days)
        VALUES (p_store_id, 'compartir', v_days_to_add)
        ON CONFLICT ON CONSTRAINT store_rewards_store_milestone_key DO NOTHING;

        milestone := 'compartir';
        days := v_days_to_add;
        v_total_granted := v_total_granted + v_days_to_add;
        v_max_additional := 7 - v_total_granted;
        RETURN NEXT;
      END IF;
    END IF;
  END IF;

  -- Evaluar 3: Ponle tu marca (+2 días: logo + [portada o eslogan])
  IF NOT v_granted_marca AND v_max_additional > 0 THEN
    v_has_marca := (
      v_store.logo IS NOT NULL AND trim(v_store.logo) <> ''
      AND (
        (v_store.banners IS NOT NULL AND array_length(v_store.banners, 1) > 0)
        OR (v_store.banner_image IS NOT NULL AND trim(v_store.banner_image) <> '')
        OR (v_store.banner_tagline IS NOT NULL AND trim(v_store.banner_tagline) <> '')
        OR (v_store.banner_title IS NOT NULL AND trim(v_store.banner_title) <> '')
      )
    );

    IF v_has_marca THEN
      v_days_to_add := LEAST(2, v_max_additional);
      IF v_days_to_add > 0 THEN
        INSERT INTO public.store_rewards(store_id, milestone, days)
        VALUES (p_store_id, 'marca', v_days_to_add)
        ON CONFLICT ON CONSTRAINT store_rewards_store_milestone_key DO NOTHING;

        milestone := 'marca';
        days := v_days_to_add;
        v_total_granted := v_total_granted + v_days_to_add;
        v_max_additional := 7 - v_total_granted;
        RETURN NEXT;
      END IF;
    END IF;
  END IF;

  -- Si se otorgaron días nuevos, extender plan_expires_at de la tienda
  IF v_total_granted > 0 THEN
    -- Recalcular extensión exacta según la suma real de store_rewards
    SELECT COALESCE(sum(sr.days), 0) INTO v_days_to_add
    FROM public.store_rewards sr
    WHERE sr.store_id = p_store_id;

    -- Se calcula desde la fecha de expiración base de la tienda (created_at + 7 días)
    -- para garantizar idempotencia exacta frente a reintentos o llamadas concurrentes
    UPDATE public.stores
    SET plan_expires_at = (v_store.created_at + interval '7 days') + (v_days_to_add || ' days')::interval
    WHERE id = p_store_id;
  END IF;

  RETURN;
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_trial_rewards(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_trial_rewards(text) TO authenticated;

-- 4. Ampliar restricciones CHECK en share_events para 'catalogo'
ALTER TABLE public.share_events
  DROP CONSTRAINT IF EXISTS share_events_source_check;

ALTER TABLE public.share_events
  ADD CONSTRAINT share_events_source_check
  CHECK (source IN ('productos', 'marketing', 'catalogo'));

ALTER TABLE public.share_events
  DROP CONSTRAINT IF EXISTS share_events_style_check;

ALTER TABLE public.share_events
  ADD CONSTRAINT share_events_style_check
  CHECK (style IN ('etiqueta', 'editorial', 'marco-color', 'oferta', 'catalogo'));


-- ==============================================================================
-- SCRIPT DE REVERSIÓN (EN CASO DE NECESIDAD - EN ORDEN INVERSO)
-- ==============================================================================
-- 1. Restaurar CHECKs de share_events:
-- ALTER TABLE public.share_events DROP CONSTRAINT IF EXISTS share_events_style_check;
-- ALTER TABLE public.share_events ADD CONSTRAINT share_events_style_check
--   CHECK (style IN ('etiqueta', 'editorial', 'marco-color', 'oferta'));
-- ALTER TABLE public.share_events DROP CONSTRAINT IF EXISTS share_events_source_check;
-- ALTER TABLE public.share_events ADD CONSTRAINT share_events_source_check
--   CHECK (source IN ('productos', 'marketing'));
--
-- 2. Eliminar RPC claim_trial_rewards:
-- DROP FUNCTION IF EXISTS public.claim_trial_rewards(text);
--
-- 3. Eliminar tabla store_rewards:
-- DROP TABLE IF EXISTS public.store_rewards;
--
-- 4. Restaurar protect_store_billing_columns() a su versión previa (INSERT -> semilla):
-- CREATE OR REPLACE FUNCTION public.protect_store_billing_columns()
--  RETURNS trigger
--  LANGUAGE plpgsql
--  SET search_path TO 'public', 'pg_temp'
-- AS $function$
-- BEGIN
--   IF current_user IN ('postgres', 'supabase_admin', 'service_role')
--      OR (COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'super_admin') THEN
--     RETURN NEW;
--   END IF;
--   IF TG_OP = 'INSERT' THEN
--     NEW.plan := 'semilla';
--     NEW.plan_expires_at := NULL;
--     NEW.subscription_status := 'trial';
--     NEW.custom_price := NULL;
--     NEW.plan_duration_months := NULL;
--     NEW.cancelled_at := NULL;
--     NEW.views := 0;
--     NEW.whatsapp_clicks := 0;
--     NEW.referral_rewarded := false;
--     NEW.egress_bytes := 0;
--     NEW.show_dizi_branding := true;
--     RETURN NEW;
--   END IF;
--   ... (resto igual)
-- END;
-- $function$;
