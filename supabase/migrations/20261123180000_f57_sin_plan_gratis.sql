-- ==============================================================================
-- Migración: F57 - Sin Plan Gratis (Prueba Pro -> Elegir Plan -> Catálogo en Pausa)
-- Archivo: supabase/migrations/20261123180000_f57_sin_plan_gratis.sql
-- Fecha: 2026-11-23
--
-- NOTA: Preparado SOLO como archivo (NO APLICAR A PRODUCCIÓN HASTA OK DE JACK).
--
-- Componentes:
--   1. Tabla public.app_config con RLS (lectura pública, escritura super_admin/service_role).
--      Claves iniciales: pausa_activa = false (seguridad) y semilla_fin = null.
--   2. Función public.store_access_state(p_store_id text) -> 'activa' | 'gracia' | 'pausa'.
--   3. Función public.apply_semilla_sunset() (idempotente, solo si semilla_fin no es null y ya pasó).
--   4. Función public.effective_product_limit(p_store_id text) coherente con el nuevo estado.
--   5. Función public.get_public_store(store_slug text, ...) actualizada para devolver payload reducido en pausa.
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

-- Claves iniciales: pausa_activa = false e inicialización de semilla_fin en null
INSERT INTO public.app_config (key, value)
VALUES 
  ('pausa_activa', 'false'::jsonb),
  ('semilla_fin', 'null'::jsonb)
ON CONFLICT (key) DO NOTHING;

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
  v_semilla_fin date := NULL;
  v_raw_val jsonb;
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

  -- 2. Leer configuración desde public.app_config
  BEGIN
    SELECT value INTO v_raw_val FROM public.app_config WHERE key = 'pausa_activa';
    IF v_raw_val IS NOT NULL THEN
      IF jsonb_typeof(v_raw_val) = 'boolean' THEN
        v_pausa_activa := (v_raw_val)::boolean;
      ELSE
        v_pausa_activa := (v_raw_val #>> '{}') = 'true';
      END IF;
    END IF;

    SELECT value INTO v_raw_val FROM public.app_config WHERE key = 'semilla_fin';
    IF v_raw_val IS NOT NULL AND jsonb_typeof(v_raw_val) != 'null' THEN
      BEGIN
        v_semilla_fin := (v_raw_val #>> '{}')::date;
      EXCEPTION WHEN OTHERS THEN
        v_semilla_fin := NULL;
      END;
    END IF;
  EXCEPTION WHEN undefined_table THEN
    v_pausa_activa := false;
    v_semilla_fin := NULL;
  END;

  -- 3. Si el interruptor general de pausa está apagado, nadie entra en pausa
  IF v_pausa_activa IS NOT TRUE THEN
    IF v_store.plan = 'semilla' THEN
      RETURN 'activa';
    ELSIF v_store.plan_expires_at IS NULL OR now() <= v_store.plan_expires_at THEN
      RETURN 'activa';
    ELSIF now() <= v_store.plan_expires_at + interval '3 days' THEN
      RETURN 'gracia';
    ELSE
      RETURN 'activa';
    END IF;
  END IF;

  -- 4. Interruptor encendido (regla F57):
  -- (a) Tiendas en Plan Semilla
  IF v_store.plan = 'semilla' THEN
    -- Si semilla_fin es null, no hay transición activa para Semilla: se mantiene activa
    IF v_semilla_fin IS NULL THEN
      RETURN 'activa';
    ELSIF CURRENT_DATE < v_semilla_fin THEN
      RETURN 'activa';
    ELSE
      RETURN 'pausa';
    END IF;
  END IF;

  -- (b) Tiendas con planes de pago o prueba Pro (plan != 'semilla')
  IF v_store.plan_expires_at IS NULL THEN
    RETURN 'activa';
  END IF;

  IF now() <= v_store.plan_expires_at THEN
    RETURN 'activa';
  END IF;

  IF now() <= v_store.plan_expires_at + interval '3 days' THEN
    RETURN 'gracia';
  END IF;

  RETURN 'pausa';
END;
$function$;

-- 3. Función public.apply_semilla_sunset()
CREATE OR REPLACE FUNCTION public.apply_semilla_sunset()
RETURNS TABLE(store_id text, store_slug text, old_plan text, new_plan text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_semilla_fin date := NULL;
  v_raw_val jsonb;
  v_is_super boolean;
BEGIN
  -- Validar que quien ejecuta sea super_admin, service_role o postgres
  v_is_super := (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text);
  IF current_user NOT IN ('postgres', 'supabase_admin', 'service_role')
     AND (SELECT auth.role()) != 'service_role'
     AND NOT v_is_super THEN
    RAISE EXCEPTION 'No autorizado. Solo super administradores pueden ejecutar la transición de Semilla.' USING ERRCODE = '42501';
  END IF;

  -- Leer semilla_fin de app_config
  BEGIN
    SELECT value INTO v_raw_val FROM public.app_config WHERE key = 'semilla_fin';
    IF v_raw_val IS NOT NULL AND jsonb_typeof(v_raw_val) != 'null' THEN
      v_semilla_fin := (v_raw_val #>> '{}')::date;
    END IF;
  EXCEPTION WHEN undefined_table THEN
    v_semilla_fin := NULL;
  END;

  -- Solo actúa si semilla_fin no es NULL y la fecha actual ya la alcanzó o superó
  IF v_semilla_fin IS NULL OR CURRENT_DATE < v_semilla_fin THEN
    RETURN;
  END IF;

  -- Migrar tiendas Semilla a Pro trial de 7 días, excluyendo demos, zz-* e internas
  RETURN QUERY
  WITH updated AS (
    UPDATE public.stores
    SET
      plan = 'pro',
      subscription_status = 'trial',
      plan_expires_at = now() + interval '7 days',
      show_dizi_branding = NULL
    WHERE plan = 'semilla'
      AND slug NOT LIKE '%-demo'
      AND slug NOT LIKE 'zz-%'
      AND NOT (plan = 'ilimitado' AND plan_expires_at IS NULL)
    RETURNING id, slug, 'semilla'::text AS prev_plan, 'pro'::text AS current_plan
  )
  SELECT id, slug, prev_plan, current_plan FROM updated;
END;
$function$;

-- 4. Función public.effective_product_limit(p_store_id text)
CREATE OR REPLACE FUNCTION public.effective_product_limit(p_store_id text)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_plan text;
  v_state text;
BEGIN
  SELECT plan INTO v_plan
  FROM public.stores
  WHERE id = p_store_id;

  IF NOT FOUND THEN
    RETURN 20;
  END IF;

  v_plan := COALESCE(v_plan, 'semilla');

  IF v_plan = 'semilla' THEN
    RETURN 20;
  END IF;

  -- Obtener estado de acceso dinámico
  v_state := public.store_access_state(p_store_id);

  IF v_state = 'pausa' THEN
    RETURN 20;
  END IF;

  RETURN CASE v_plan
    WHEN 'ilimitado' THEN 1000
    WHEN 'pro' THEN 300
    WHEN 'emprendedor' THEN 100
    ELSE 20
  END;
END;
$function$;

-- 5. Función public.get_public_store(store_slug text, ...)
CREATE OR REPLACE FUNCTION public.get_public_store(store_slug text, page_limit integer DEFAULT 36, page_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  store_row record;
  store_plan text;
  v_access_state text;
  effective_limit int;
  effective_model text;
  effective_banner text;
  total_prod_count int;
  actual_limit int;
  effective_main_active boolean;
  max_extra_sellers int;
  result jsonb;
BEGIN
  SELECT * INTO store_row FROM stores WHERE slug = store_slug AND active = true LIMIT 1;
  IF store_row IS NULL THEN
    RETURN NULL;
  END IF;

  -- Evaluar estado de acceso de la tienda
  v_access_state := public.store_access_state(store_row.id);

  -- Si la tienda se encuentra en pausa comercial, devolver respuesta reducida
  IF v_access_state = 'pausa' THEN
    SELECT jsonb_build_object(
      'id', store_row.id,
      'slug', store_row.slug,
      'name', store_row.name,
      'main_seller_name', store_row.main_seller_name,
      'main_seller_active', true,
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
      'banner_image', NULL,
      'banner_title', NULL,
      'banner_style', COALESCE(store_row.banner_style, 'direct'),
      'niche', COALESCE(store_row.niche, 'general'),
      'catalog_typography', COALESCE(store_row.catalog_typography, 'sans'),
      'card_style', COALESCE(store_row.card_style, 'standard'),
      'plan', store_row.plan,
      'model', COALESCE(store_row.model, 'minimalista'),
      'active', store_row.active,
      'is_published', store_row.is_published,
      'created_at', store_row.created_at,
      'paused', true,
      'whatsapp_clicks', COALESCE(store_row.whatsapp_clicks, 0),
      'views', COALESCE(store_row.views, 0),
      'total_products_count', 0,
      'show_dizi_branding', true,
      'show_featured', false,
      'wholesale_enabled', false,
      'order_link_enabled', false,
      'promo_bar_enabled', false,
      'price_bounds', NULL,
      'categories', '[]'::jsonb,
      'products', '[]'::jsonb,
      'sellers', '[]'::jsonb,
      'quick_links', '[]'::jsonb,
      'profile_tags', '[]'::jsonb
    ) INTO result;
    RETURN result;
  END IF;

  -- Tienda activa o en gracia: calcular plan efectivo
  IF store_row.plan = 'semilla' THEN
    store_plan := 'semilla';
  ELSIF v_access_state = 'gracia' THEN
    store_plan := store_row.plan;
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

  -- Regla de vendedores según plan
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
    'paused', false,
    'whatsapp_clicks', COALESCE(store_row.whatsapp_clicks, 0),
    'views', COALESCE(store_row.views, 0),
    'price_filter_enabled', store_row.price_filter_enabled,
    'libro_reclamaciones_activo', store_row.libro_reclamaciones_activo,
    'empresa_ruc', store_row.empresa_ruc,
    'empresa_razon_social', store_row.empresa_razon_social,
    'empresa_direccion', store_row.empresa_direccion,
    'total_products_count', COALESCE(total_prod_count, 0),
    'bio_title', store_row.bio_title,
    'bio_description', store_row.bio_description,
    'bio_theme', store_row.bio_theme,
    'bio_typography', store_row.bio_typography,
    'bio_links_enabled', store_row.bio_links_enabled,
    'bio_logo', store_row.bio_logo,
    'bio_banner', store_row.bio_banner,
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

-- ==============================================================================
-- SCRIPT DE REVERSIÓN (EJECUTAR SOLO SI SE REQUIERE VOLVER ATRÁS)
-- ==============================================================================
/*
-- 1. Restaurar effective_product_limit a su versión anterior
CREATE OR REPLACE FUNCTION public.effective_product_limit(p_store_id text)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$;

-- 2. Restaurar get_public_store a la versión previa (20261113120000)
-- (ver archivo supabase/migrations/20261113120000_fix_price_filter_bounds_and_rpc.sql)

-- 3. Eliminar funciones nuevas de F57
DROP FUNCTION IF EXISTS public.apply_semilla_sunset();
DROP FUNCTION IF EXISTS public.store_access_state(text);

-- 4. Eliminar políticas y tabla app_config
DROP POLICY IF EXISTS "app_config_write_super" ON public.app_config;
DROP POLICY IF EXISTS "app_config_read_public" ON public.app_config;
DROP TABLE IF EXISTS public.app_config;
*/
