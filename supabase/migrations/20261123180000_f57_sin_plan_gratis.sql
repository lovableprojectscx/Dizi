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

-- 4. Recrear public.get_public_store con soporte de catálogo en pausa (partiendo de producción real)
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
  result jsonb;
  v_access_state text;
BEGIN
  SELECT * INTO store_row FROM stores WHERE slug = store_slug AND active = true LIMIT 1;
  IF store_row IS NULL THEN
    RETURN NULL;
  END IF;

  -- F57: Evaluar estado de acceso comercial
  v_access_state := public.store_access_state(store_row.id);
  IF v_access_state = 'pausa' THEN
    RETURN jsonb_build_object(
      'id', store_row.id,
      'name', store_row.name,
      'slug', store_row.slug,
      'phone', store_row.phone,
      'country_code', store_row.country_code,
      'country_iso', COALESCE(store_row.country_iso, 'PE'),
      'logo', store_row.logo,
      'brand_color', store_row.brand_color,
      'bg_color', store_row.bg_color,
      'text_color', store_row.text_color,
      'active', store_row.active,
      'is_published', store_row.is_published,
      'plan', store_row.plan,
      'paused', true,
      'products', '[]'::jsonb,
      'categories', '[]'::jsonb,
      'total_products_count', 0
    );
  END IF;

  -- Calcular plan efectivo (criterio unificado con protect_store_billing_columns / effective_product_limit:
  -- supabase/migrations/20260929160000_fase1c_blindaje.sql L44, L144)
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
  -- aunque esté apagado. La tienda nunca se queda sin WhatsApp y no se borra nada guardado.
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

  effective_model := COALESCE(store_row.model, 'minimalista');

  IF store_row.banners IS NOT NULL AND array_length(store_row.banners, 1) > 0 THEN
    effective_banner := array_to_string(store_row.banners, '|||');
  ELSE
    effective_banner := store_row.banner_image;
  END IF;

  SELECT LEAST(count(*), effective_limit) INTO total_prod_count
  FROM products
  WHERE store_id = store_row.id AND visible = true AND COALESCE(is_sample, false) = false;

  actual_limit := LEAST(COALESCE(page_limit, 36), effective_limit);

  SELECT jsonb_build_object(
    'id', store_row.id,
    'slug', store_row.slug,
    'name', store_row.name,
    'main_seller_name', store_row.main_seller_name,
    'main_seller_active', effective_main_active,
    'phone', store_row.phone,
    'country_code', store_row.country_code,
    'country_iso', COALESCE(store_row.country_iso, 'PE'),
    'logo', store_row.logo,
    'brand_color', store_row.brand_color,
    'bg_color', store_row.bg_color,
    'text_color', store_row.text_color,
    'card_bg', store_row.card_bg,
    'accent_color', store_row.accent_color,
    'border_radius', store_row.border_radius,
    'img_shape', store_row.img_shape,
    'photo_format', store_row.photo_format,
    'header_style', COALESCE(store_row.header_style, 'standard'),
    'is_dark', store_row.is_dark,
    'banner_image', effective_banner,
    'banner_title', store_row.banner_title,
    'banner_style', COALESCE(store_row.banner_style, 'direct'),
    'niche', COALESCE(store_row.niche, 'general'),
    'catalog_typography', COALESCE(store_row.catalog_typography, 'sans'),
    'card_style', COALESCE(store_row.card_style, 'standard'),
    'plan', store_plan,
    'model', effective_model,
    'active', store_row.active,
    'is_published', store_row.is_published,
    'created_at', store_row.created_at,
    'whatsapp_clicks', COALESCE(store_row.whatsapp_clicks, 0),
    'views', COALESCE(store_row.views, 0),
    'price_filter_enabled', store_row.price_filter_enabled,
    'libro_reclamaciones_activo', store_row.libro_reclamaciones_activo,
    'empresa_ruc', store_row.empresa_ruc,
    'empresa_razon_social', store_row.empresa_razon_social,
    'empresa_direccion', store_row.empresa_direccion,
    'total_products_count', COALESCE(total_prod_count, 0)
  ) || jsonb_build_object(
    'plan_expires_at', store_row.plan_expires_at,
    'subscription_status', store_row.subscription_status,
    'cancelled_at', store_row.cancelled_at,
    'cancel_reason', store_row.cancel_reason,
    'plan_duration_months', store_row.plan_duration_months,
    'bio_description', store_row.bio_description,
    'bio_links_enabled', COALESCE(store_row.bio_links_enabled, false),
    'bio_banner', store_row.bio_banner,
    'bio_logo', store_row.bio_logo,
    'bio_theme', store_row.bio_theme,
    'bio_typography', store_row.bio_typography,
    'bio_show_catalog_button', store_row.bio_show_catalog_button,
    'bio_button_style', store_row.bio_button_style,
    'bio_button_color', store_row.bio_button_color,
    'bio_button_text_color', store_row.bio_button_text_color,
    'bio_bg_image', store_row.bio_bg_image,
    'bio_bg_color', store_row.bio_bg_color,
    'quick_links', (
      CASE WHEN store_plan = 'semilla' THEN
          COALESCE((SELECT jsonb_agg(value) FROM (SELECT value FROM jsonb_array_elements(COALESCE(store_row.quick_links, '[]'::jsonb)) LIMIT 3) t), '[]'::jsonb)
      ELSE
          COALESCE(store_row.quick_links, '[]'::jsonb)
      END
    ),
    'sellers', (
      CASE
        WHEN max_extra_sellers <= 0 THEN '[]'::jsonb
        ELSE COALESCE((
          SELECT jsonb_agg(elem.val)
          FROM (
            SELECT val
            FROM jsonb_array_elements(COALESCE(store_row.sellers, '[]'::jsonb)) WITH ORDINALITY AS t(val, ord)
            WHERE (val->>'active')::boolean IS TRUE
            ORDER BY ord ASC
            LIMIT max_extra_sellers
          ) elem
        ), '[]'::jsonb)
      END
    ),
    'location_lat', store_row.location_lat,
    'location_lng', store_row.location_lng,
    'location_address', store_row.location_address,
    'profile_tags', COALESCE(store_row.profile_tags, '[]'::jsonb),
    'banner_tagline', store_row.banner_tagline,
    'banner_bottom_tag', store_row.banner_bottom_tag,
    'show_dizi_branding', store_row.show_dizi_branding,
    'show_featured', COALESCE(store_row.show_featured, true),
    'show_discount_pct', COALESCE(store_row.show_discount_pct, false),
    'wholesale_enabled', CASE WHEN store_plan = 'semilla' THEN false ELSE COALESCE(store_row.wholesale_enabled, false) END,
    'order_link_enabled', CASE WHEN store_plan IN ('pro', 'ilimitado') THEN COALESCE(store_row.order_link_enabled, false) ELSE false END,
    'promo_bar_enabled', store_row.promo_bar_enabled,
    'promo_bar_text', store_row.promo_bar_text,
    'promo_bar_action_type', store_row.promo_bar_action_type,
    'promo_bar_action_value', store_row.promo_bar_action_value,
    'promo_bar_bg_color', store_row.promo_bar_bg_color,
    'promo_bar_text_color', store_row.promo_bar_text_color,
    'promo_bar_is_marquee', store_row.promo_bar_is_marquee,
    'price_bounds', (
      WITH bounded_prods AS (
        SELECT price, variations
        FROM products
        WHERE store_id = store_row.id AND visible = true AND COALESCE(is_sample, false) = false
        ORDER BY sort_order ASC NULLS LAST, created_at DESC
        LIMIT effective_limit
      ),
      price_vals AS (
        SELECT price::numeric AS val
        FROM bounded_prods
        WHERE price IS NOT NULL AND price > 0
        UNION ALL
        SELECT TRIM(v->>'price')::numeric AS val
        FROM bounded_prods
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE WHEN jsonb_typeof(variations) = 'array' THEN variations ELSE '[]'::jsonb END
        ) v
        WHERE (v->>'price') ~ '^\s*[0-9]+(\.[0-9]+)?\s*$'
          AND TRIM(v->>'price')::numeric > 0
      )
      SELECT CASE
        WHEN MIN(val) IS NOT NULL AND MAX(val) IS NOT NULL
          THEN jsonb_build_object('min', FLOOR(MIN(val)), 'max', CEIL(MAX(val)))
        ELSE NULL
      END
      FROM price_vals
    ),
    'categories', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'product_count', (
          SELECT count(*)::int FROM products p
          WHERE p.store_id = store_row.id AND p.category_id = c.id AND p.visible = true AND COALESCE(p.is_sample, false) = false
        )
      )), '[]'::jsonb)
      FROM categories c
      WHERE c.store_id = store_row.id
    ),
    'products', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', id,
        'name', name,
        'price', price,
        'category_id', category_id,
        'image', image,
        'description', description,
        'is_on_sale', is_on_sale,
        'original_price', original_price,
        'visible', visible,
        'is_sample', is_sample,
        'sort_order', sort_order,
        'variations', COALESCE(variations, '[]'::jsonb),
        'wholesale_tiers', COALESCE(wholesale_tiers, '[]'::jsonb),
        'created_at', created_at
      )), '[]'::jsonb)
      FROM (
        SELECT * FROM products
        WHERE store_id = store_row.id AND visible = true AND COALESCE(is_sample, false) = false
        ORDER BY sort_order ASC NULLS LAST, created_at DESC
        LIMIT actual_limit
        OFFSET COALESCE(page_offset, 0)
      ) p
    )
  ) INTO result;

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
