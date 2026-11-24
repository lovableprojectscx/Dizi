-- ==============================================================================
-- Migración: F57 - Sin Plan Gratis (Prueba Pro -> Elegir Plan -> Catálogo en Pausa)
-- Archivo: supabase/migrations/20261123180000_f57_sin_plan_gratis.sql
-- Fecha: 2026-11-23 (Actualizada con ajustes F57.1 / F57.2)
--
-- NOTA: Preparado SOLO como archivo (NO APLICAR A PRODUCCIÓN HASTA OK DE JACK).
--
-- Componentes:
--   1. Tabla public.app_config con RLS (lectura pública, escritura super_admin/service_role).
--      Claves iniciales: pausa_activa = false, pausa_desde = null, semilla_fin = null.
--      Trigger automático: fija pausa_desde = now() la primera vez que se activa pausa_activa.
--   2. Función public.store_access_state(p_store_id text) -> 'activa' | 'gracia' | 'pausa'.
--      - Semilla NUNCA pasa a pausa directamente (devuelve 'activa' siempre hasta que el sunset la migre).
--      - Tiendas pagadas que vencieron antes de pausa_desde (Milance, Giosathi) NO se pausan (devuelven 'activa').
--      - Con pausa_activa = false devuelve 'activa' para todas (idéntico a hoy).
--   3. Función public.effective_product_limit(p_store_id text) conservando la regla de hoy (vencida > 3 días -> 20).
--   4. Función public.get_public_store(store_slug text, ...) actualizada para devolver payload reducido en pausa.
--   5. Función public.apply_semilla_sunset() (idempotente, hora Lima, migra Semilla y vencidas pre-pausa).
--      REVOKE EXECUTE a PUBLIC y anon.
--   6. Registro diario con pg_cron (~06:00 Lima = 11:00 UTC).
--   7. Script de reversión completo al final.
-- ==============================================================================

-- 1. Tabla public.app_config y políticas RLS
CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública (necesaria para RPCs públicas y clientes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'app_config' AND policyname = 'app_config_read_public'
  ) THEN
    CREATE POLICY "app_config_read_public"
      ON public.app_config FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- Política de modificación exclusiva para super_admin y service_role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'app_config' AND policyname = 'app_config_write_super'
  ) THEN
    CREATE POLICY "app_config_write_super"
      ON public.app_config FOR ALL
      TO public
      USING (
        current_user IN ('postgres', 'service_role')
        OR COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'super_admin'
      )
      WITH CHECK (
        current_user IN ('postgres', 'service_role')
        OR COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'super_admin'
      );
  END IF;
END $$;

-- Claves iniciales: pausa_activa = false, pausa_desde = null, semilla_fin = null
INSERT INTO public.app_config (key, value)
VALUES 
  ('pausa_activa', 'false'::jsonb),
  ('pausa_desde', 'null'::jsonb),
  ('semilla_fin', 'null'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Trigger automático para fijar pausa_desde la primera vez que se enciende pausa_activa
CREATE OR REPLACE FUNCTION public.handle_app_config_pausa_desde()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_existing_desde jsonb;
BEGIN
  IF NEW.key = 'pausa_activa' AND (NEW.value = 'true'::jsonb OR (NEW.value #>> '{}') = 'true') THEN
    SELECT value INTO v_existing_desde FROM public.app_config WHERE key = 'pausa_desde';
    IF v_existing_desde IS NULL OR v_existing_desde = 'null'::jsonb THEN
      INSERT INTO public.app_config (key, value, updated_at)
      VALUES ('pausa_desde', to_jsonb(now()), now())
      ON CONFLICT (key) DO UPDATE
      SET value = to_jsonb(now()), updated_at = now()
      WHERE public.app_config.value IS NULL OR public.app_config.value = 'null'::jsonb;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_app_config_pausa_desde ON public.app_config;
CREATE TRIGGER trg_app_config_pausa_desde
  AFTER INSERT OR UPDATE ON public.app_config
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_app_config_pausa_desde();

-- 2. Función public.store_access_state(p_store_id text)
CREATE OR REPLACE FUNCTION public.store_access_state(p_store_id text)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_store public.stores%ROWTYPE;
  v_pausa_activa boolean := false;
  v_pausa_desde timestamptz := NULL;
  v_raw_val jsonb;
  v_now timestamptz;
BEGIN
  SELECT * INTO v_store FROM public.stores WHERE id = p_store_id;
  IF NOT FOUND THEN
    RETURN 'pausa';
  END IF;

  -- 1. Excepciones que nunca entran en pausa
  -- (a) Demos (*-demo)
  IF v_store.slug LIKE '%-demo' THEN
    RETURN 'activa';
  END IF;
  -- (b) Auditorías y pruebas continuas (zz-*)
  IF v_store.slug LIKE 'zz-%' THEN
    RETURN 'activa';
  END IF;
  -- (c) Cuentas internas con plan ilimitado sin vencimiento
  IF v_store.plan = 'ilimitado' AND v_store.plan_expires_at IS NULL THEN
    RETURN 'activa';
  END IF;

  -- 2. Regla Semilla (F57.2): Una Semilla NUNCA pasa a 'pausa' directamente
  -- La pausa solo llega después de que apply_semilla_sunset la convierte en prueba y esa prueba vence + 3 días.
  IF v_store.plan = 'semilla' THEN
    RETURN 'activa';
  END IF;

  -- 3. Leer configuración desde public.app_config
  BEGIN
    SELECT value INTO v_raw_val FROM public.app_config WHERE key = 'pausa_activa';
    IF v_raw_val IS NOT NULL THEN
      IF jsonb_typeof(v_raw_val) = 'boolean' THEN
        v_pausa_activa := (v_raw_val)::boolean;
      ELSE
        v_pausa_activa := (v_raw_val #>> '{}') = 'true';
      END IF;
    END IF;

    SELECT value INTO v_raw_val FROM public.app_config WHERE key = 'pausa_desde';
    IF v_raw_val IS NOT NULL AND jsonb_typeof(v_raw_val) != 'null' THEN
      BEGIN
        v_pausa_desde := (v_raw_val #>> '{}')::timestamptz;
      EXCEPTION WHEN OTHERS THEN
        v_pausa_desde := NULL;
      END;
    END IF;
  EXCEPTION WHEN undefined_table THEN
    v_pausa_activa := false;
    v_pausa_desde := NULL;
  END;

  -- 4. Si el interruptor general está apagado (false), todo es idéntico a hoy (activa)
  IF NOT v_pausa_activa THEN
    RETURN 'activa';
  END IF;

  -- 5. Tiendas sin fecha de expiración
  IF v_store.plan_expires_at IS NULL THEN
    RETURN 'activa';
  END IF;

  -- 6. Tiendas pagadas que vencieron ANTES de pausa_desde (Milance, Giosathi, etc.)
  -- Si plan <> 'semilla' y (plan_expires_at + 3 días) < pausa_desde -> 'activa' (régimen anterior: como Semilla efectiva)
  IF v_pausa_desde IS NOT NULL AND (v_store.plan_expires_at + interval '3 days') < v_pausa_desde THEN
    RETURN 'activa';
  END IF;

  -- 7. Régimen nuevo (con pausa_activa = true):
  -- Evaluación con tolerancia de 3 días (período de gracia)
  v_now := now();
  IF v_now <= v_store.plan_expires_at THEN
    RETURN 'activa';
  ELSIF v_now <= (v_store.plan_expires_at + interval '3 days') THEN
    RETURN 'gracia';
  ELSE
    RETURN 'pausa';
  END IF;
END;
$function$;

COMMENT ON FUNCTION public.store_access_state(text) IS
  'Calcula el estado de acceso comercial de una tienda: activa, gracia o pausa. F57: Semilla siempre activa hasta sunset, vencidas pre-pausa no se pausan.';

-- 3. Función public.effective_product_limit(p_store_id text)
-- Conserva SIEMPRE la regla de hoy (vencida > 3 días -> 20), con o sin interruptor.
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

COMMENT ON FUNCTION public.effective_product_limit(text) IS
  'Calcula el límite máximo de productos permitidos según el plan y periodo de gracia (3 días). Vencida > 3 días retorna 20.';

-- 4. Recrear public.get_public_store con soporte de catálogo en pausa
CREATE OR REPLACE FUNCTION public.get_public_store(store_slug text, page_limit integer DEFAULT 36, page_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  store_row record;
  store_plan text;
  effective_limit int;
  effective_model text;
  effective_banner text;
  total_prod_count int;
  actual_limit int;
  effective_main_active boolean;
  max_extra_sellers int;
  v_access_state text;
  result jsonb;
BEGIN
  SELECT * INTO store_row FROM stores WHERE slug = store_slug AND active = true LIMIT 1;
  IF store_row IS NULL THEN
    RETURN NULL;
  END IF;

  -- F57: Evaluar estado de acceso comercial
  v_access_state := public.store_access_state(store_row.id);

  -- Si la tienda está en 'pausa', retornar payload mínimo para la página en pausa
  IF v_access_state = 'pausa' THEN
    result := jsonb_build_object(
      'id', store_row.id,
      'name', store_row.name,
      'slug', store_row.slug,
      'phone', store_row.phone,
      'country_code', store_row.country_code,
      'country_iso', store_row.country_iso,
      'logo', store_row.logo,
      'brand_color', store_row.brand_color,
      'active', store_row.active,
      'is_published', store_row.is_published,
      'plan', store_row.plan,
      'paused', true,
      'categories', '[]'::jsonb,
      'products', '[]'::jsonb,
      'total_products_count', 0,
      'price_range', jsonb_build_object('min', 0, 'max', 0)
    );
    RETURN result;
  END IF;

  -- Calcular plan efectivo (criterio unificado de producción: fase1c_blindaje)
  IF store_row.plan = 'semilla' THEN
    store_plan := 'semilla';
  ELSIF store_row.plan_expires_at IS NOT NULL AND now() > store_row.plan_expires_at + interval '3 days' THEN
    store_plan := 'semilla';
  ELSE
    store_plan := store_row.plan;
  END IF;

  IF store_plan = 'semilla' THEN
    effective_limit := 20;
  ELSIF store_plan = 'emprendedor' THEN
    effective_limit := 100;
  ELSIF store_plan = 'pro' THEN
    effective_limit := 300;
  ELSIF store_plan = 'ilimitado' THEN
    effective_limit := 1000;
  ELSE
    effective_limit := 1000;
  END IF;

  -- Regla F39b: Plan bajado o vencido: si el plan solo permite 1, el catálogo usa el principal
  IF store_plan IN ('semilla', 'emprendedor') THEN
    effective_main_active := true;
    max_extra_sellers := 0;
  ELSIF store_plan = 'ilimitado' THEN
    effective_main_active := COALESCE(store_row.main_seller_active, true);
    IF effective_main_active THEN
      max_extra_sellers := 4;
    ELSE
      max_extra_sellers := 5;
    END IF;
  ELSIF store_plan = 'pro' THEN
    effective_main_active := COALESCE(store_row.main_seller_active, true);
    IF effective_main_active THEN
      max_extra_sellers := 2;
    ELSE
      max_extra_sellers := 3;
    END IF;
  ELSE
    effective_main_active := true;
    max_extra_sellers := 0;
  END IF;

  IF store_row.model IS NOT NULL AND store_row.model LIKE '%_premium' AND store_plan = 'semilla' THEN
    effective_model := replace(store_row.model, '_premium', '_general');
  ELSE
    effective_model := store_row.model;
  END IF;

  IF store_plan = 'semilla' THEN
    effective_banner := NULL;
  ELSE
    effective_banner := store_row.banner_image;
  END IF;

  SELECT count(*) INTO total_prod_count
  FROM products
  WHERE store_id = store_row.id AND visible = true;

  actual_limit := LEAST(page_limit, effective_limit);

  result := jsonb_build_object(
    'id', store_row.id,
    'name', store_row.name,
    'slug', store_row.slug,
    'phone', store_row.phone,
    'country_code', store_row.country_code,
    'country_iso', store_row.country_iso,
    'logo', store_row.logo,
    'brand_color', store_row.brand_color,
    'bg_color', store_row.bg_color,
    'text_color', store_row.text_color,
    'banners', CASE WHEN store_plan = 'semilla' THEN '[]'::jsonb ELSE COALESCE(store_row.banners, '[]'::jsonb) END,
    'banner_image', effective_banner,
    'banner_title', CASE WHEN store_plan = 'semilla' THEN NULL ELSE store_row.banner_title END,
    'banner_style', store_row.banner_style,
    'niche', store_row.niche,
    'catalog_typography', store_row.catalog_typography,
    'card_style', store_row.card_style,
    'card_bg', store_row.card_bg,
    'accent_color', store_row.accent_color,
    'border_radius', store_row.border_radius,
    'img_shape', store_row.img_shape,
    'photo_format', store_row.photo_format,
    'is_dark', store_row.is_dark,
    'active', store_row.active,
    'is_published', store_row.is_published,
    'plan', store_plan,
    'show_dizi_branding', CASE
      WHEN store_plan = 'semilla' THEN true
      WHEN store_plan = 'emprendedor' THEN true
      ELSE COALESCE(store_row.show_dizi_branding, false)
    END,
    'model', effective_model,
    'price_filter_enabled', COALESCE(store_row.price_filter_enabled, false),
    'libro_reclamaciones_activo', COALESCE(store_row.libro_reclamaciones_activo, false),
    'empresa_ruc', store_row.empresa_ruc,
    'empresa_razon_social', store_row.empresa_razon_social,
    'empresa_direccion', store_row.empresa_direccion,
    'description', store_row.description,
    'bio_logo', store_row.bio_logo,
    'bio_banner', store_row.bio_banner,
    'bio_tagline', store_row.bio_tagline,
    'bio_description', store_row.bio_description,
    'bio_show_phone', store_row.bio_show_phone,
    'bio_show_social', store_row.bio_show_social,
    'bio_show_address', store_row.bio_show_address,
    'bio_show_hours', store_row.bio_show_hours,
    'social_facebook', store_row.social_facebook,
    'social_instagram', store_row.social_instagram,
    'social_tiktok', store_row.social_tiktok,
    'store_hours', store_row.store_hours,
    'location_lat', store_row.location_lat,
    'location_lng', store_row.location_lng,
    'location_address', store_row.location_address,
    'main_seller_name', store_row.main_seller_name,
    'main_seller_active', effective_main_active,
    'show_featured', COALESCE(store_row.show_featured, false),
    'featured_title', COALESCE(store_row.featured_title, 'Destacados'),
    'show_discount_pct', CASE WHEN store_plan = 'semilla' THEN false ELSE COALESCE(store_row.show_discount_pct, false) END,
    'order_link_enabled', CASE
      WHEN store_plan IN ('pro', 'ilimitado') THEN COALESCE(store_row.order_link_enabled, false)
      ELSE false
    END,
    'header_style', COALESCE(store_row.header_style, 'clasico'),
    'cover_image', store_row.cover_image,
    'cover_layout', COALESCE(store_row.cover_layout, 'ancho_completo'),
    'profile_tags', COALESCE(store_row.profile_tags, '[]'::jsonb),
    'paused', false,
    'categories', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'sort_order', c.sort_order,
          'product_count', (
            SELECT count(*)
            FROM products p
            WHERE p.category_id = c.id
              AND p.store_id = store_row.id
              AND p.visible = true
          )
        ) ORDER BY c.sort_order ASC
      )
      FROM categories c
      WHERE c.store_id = store_row.id
    ), '[]'::jsonb),
    'sellers', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', vs.id,
          'name', vs.name,
          'phone', vs.phone,
          'active', vs.active,
          'sort_order', vs.sort_order
        ) ORDER BY vs.sort_order ASC
      )
      FROM (
        SELECT * FROM store_sellers
        WHERE store_id = store_row.id AND active = true
        ORDER BY sort_order ASC
        LIMIT max_extra_sellers
      ) vs
    ), '[]'::jsonb),
    'total_products_count', total_prod_count,
    'products', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'price', p.price,
          'original_price', p.original_price,
          'image', p.image,
          'category_id', p.category_id,
          'sort_order', p.sort_order,
          'visible', p.visible,
          'is_on_sale', p.is_on_sale,
          'description', p.description,
          'is_sample', p.is_sample,
          'is_featured', p.is_featured,
          'wholesale_enabled', p.wholesale_enabled,
          'wholesale_min_qty', p.wholesale_min_qty,
          'wholesale_price', p.wholesale_price,
          'has_variations', p.has_variations,
          'variations', p.variations
        ) ORDER BY p.sort_order ASC, p.created_at ASC
      )
      FROM (
        SELECT * FROM products
        WHERE store_id = store_row.id AND visible = true
        ORDER BY sort_order ASC, created_at ASC
        LIMIT actual_limit
        OFFSET page_offset
      ) p
    ), '[]'::jsonb),
    'price_range', jsonb_build_object(
      'min', COALESCE((
        SELECT floor(min(p.price))
        FROM products p
        WHERE p.store_id = store_row.id AND p.visible = true
      ), 0),
      'max', COALESCE((
        SELECT ceil(max(p.price))
        FROM products p
        WHERE p.store_id = store_row.id AND p.visible = true
      ), 0)
    )
  );

  RETURN result;
END;
$function$;

-- 5. Función public.apply_semilla_sunset()
-- Idempotente, hora Lima, convierte Semilla y tiendas pagadas vencidas pre-pausa a pro/trial/+7 días
CREATE OR REPLACE FUNCTION public.apply_semilla_sunset()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_semilla_fin date := NULL;
  v_pausa_desde timestamptz := NULL;
  v_today_lima date;
  v_raw_val jsonb;
  v_migrated_ids text[] := '{}';
  v_migrated_count integer := 0;
  v_new_expiry timestamptz;
BEGIN
  -- 1. Leer semilla_fin y pausa_desde desde public.app_config
  BEGIN
    SELECT value INTO v_raw_val FROM public.app_config WHERE key = 'semilla_fin';
    IF v_raw_val IS NOT NULL AND jsonb_typeof(v_raw_val) != 'null' THEN
      BEGIN
        v_semilla_fin := (v_raw_val #>> '{}')::date;
      EXCEPTION WHEN OTHERS THEN
        v_semilla_fin := NULL;
      END;
    END IF;

    SELECT value INTO v_raw_val FROM public.app_config WHERE key = 'pausa_desde';
    IF v_raw_val IS NOT NULL AND jsonb_typeof(v_raw_val) != 'null' THEN
      BEGIN
        v_pausa_desde := (v_raw_val #>> '{}')::timestamptz;
      EXCEPTION WHEN OTHERS THEN
        v_pausa_desde := NULL;
      END;
    END IF;
  EXCEPTION WHEN undefined_table THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tabla public.app_config no existe');
  END;

  -- 2. Si semilla_fin es NULL, no hay transición
  IF v_semilla_fin IS NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'migrated_count', 0,
      'reason', 'semilla_fin no configurada (NULL); no se aplica transición'
    );
  END IF;

  -- 3. Evaluar con fecha oficial de Lima
  v_today_lima := (now() AT TIME ZONE 'America/Lima')::date;
  IF v_today_lima < v_semilla_fin THEN
    RETURN jsonb_build_object(
      'success', true,
      'migrated_count', 0,
      'reason', format('Fecha actual de Lima (%s) es anterior a semilla_fin (%s)', v_today_lima, v_semilla_fin)
    );
  END IF;

  -- 4. Expiración calculada a 7 días en UTC timestamptz
  v_new_expiry := now() + interval '7 days';

  -- 5. Migrar tiendas Semilla y tiendas pagadas vencidas antes de pausa_desde
  WITH targets AS (
    SELECT id FROM public.stores
    WHERE (
      plan = 'semilla'
      OR (plan <> 'semilla' AND v_pausa_desde IS NOT NULL AND (plan_expires_at + interval '3 days') < v_pausa_desde)
    )
    AND slug NOT LIKE '%-demo'
    AND slug NOT LIKE 'zz-%'
    AND NOT (plan = 'ilimitado' AND plan_expires_at IS NULL)
  ),
  updated AS (
    UPDATE public.stores s
    SET
      plan = 'pro',
      subscription_status = 'trial',
      plan_expires_at = v_new_expiry,
      updated_at = now()
    FROM targets t
    WHERE s.id = t.id
    RETURNING s.id
  )
  SELECT array_agg(id), count(*) INTO v_migrated_ids, v_migrated_count FROM updated;

  RETURN jsonb_build_object(
    'success', true,
    'migrated_count', COALESCE(v_migrated_count, 0),
    'migrated_ids', COALESCE(v_migrated_ids, '{}'::text[]),
    'new_plan', 'pro',
    'new_status', 'trial',
    'plan_expires_at', v_new_expiry
  );
END;
$function$;

COMMENT ON FUNCTION public.apply_semilla_sunset() IS
  'Aplica la transición de Semilla y vencidas pre-pausa a prueba Pro de 7 días. Idempotente. Solo actúa si semilla_fin ya pasó en hora Lima.';

-- Seguridad: REVOKE EXECUTE a PUBLIC y anon
REVOKE EXECUTE ON FUNCTION public.apply_semilla_sunset() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_semilla_sunset() TO service_role, postgres;

-- 6. Programación automática con pg_cron (~06:00 AM Lima = 11:00 UTC)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
      BEGIN
        PERFORM cron.unschedule('dizi_semilla_sunset_daily');
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
      PERFORM cron.schedule(
        'dizi_semilla_sunset_daily',
        '0 11 * * *', -- Diario a las 06:00 AM Lima (UTC-5 -> 11:00 UTC)
        'SELECT public.apply_semilla_sunset();'
      );
    END IF;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron no programado automáticamente en este entorno: %', SQLERRM;
END $$;

-- ==============================================================================
-- SCRIPT DE REVERSIÓN (DESHACER MIGRACIÓN F57)
-- ==============================================================================
/*
-- 1. Desprogramar cron job
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
    BEGIN
      PERFORM cron.unschedule('dizi_semilla_sunset_daily');
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END $$;

-- 2. Eliminar trigger y función de pausa_desde
DROP TRIGGER IF EXISTS trg_app_config_pausa_desde ON public.app_config;
DROP FUNCTION IF EXISTS public.handle_app_config_pausa_desde();

-- 3. Eliminar funciones creadas
DROP FUNCTION IF EXISTS public.apply_semilla_sunset();
DROP FUNCTION IF EXISTS public.store_access_state(text);

-- 4. Eliminar tabla public.app_config
DROP TABLE IF EXISTS public.app_config;

-- 5. Restaurar public.effective_product_limit a su versión anterior
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

-- 6. Restaurar public.get_public_store a la versión de fix_price_filter_bounds_and_rpc
-- (omitiendo la verificación v_access_state = 'pausa').
*/
