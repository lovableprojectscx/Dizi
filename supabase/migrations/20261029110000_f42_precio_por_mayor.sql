-- Migración: 20261029110000_f42_precio_por_mayor.sql
-- Encargo: F42 - Precio por mayor
-- Fecha: 29 de octubre de 2026
-- Objetivo:
-- 1. Agregar columna wholesale_tiers a products (jsonb not null default '[]'::jsonb)
-- 2. Agregar columna wholesale_enabled a stores (boolean not null default false)
-- 3. Crear función y trigger de validación trg_validate_wholesale_tiers en products
-- 4. Actualizar get_public_store para devolver wholesale_enabled resuelto por plan y wholesale_tiers en productos
-- 5. Actualizar get_public_store_products para devolver wholesale_tiers en productos
-- NOTA: Archivo de migración (NO aplicar a producción hasta el merge y confirmación de Jack)

-- 1. Agregar columna wholesale_tiers a products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS wholesale_tiers jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2. Agregar columna wholesale_enabled a stores
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS wholesale_enabled boolean NOT NULL DEFAULT false;

-- 3. Trigger de validación de niveles por mayor en el servidor
CREATE OR REPLACE FUNCTION public.validate_wholesale_tiers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  tier_count int;
  i int;
  elem jsonb;
  min_q int;
  tier_p numeric;
  prev_min_q int := 0;
  prev_tier_p numeric := null;
  var_elem jsonb;
  var_price numeric;
BEGIN
  -- Si wholesale_tiers es nulo o vacío, asignar default '[]' y permitir
  IF NEW.wholesale_tiers IS NULL THEN
    NEW.wholesale_tiers := '[]'::jsonb;
  END IF;

  IF jsonb_typeof(NEW.wholesale_tiers) != 'array' THEN
    RAISE EXCEPTION 'El campo wholesale_tiers debe ser un array JSONB.';
  END IF;

  tier_count := jsonb_array_length(NEW.wholesale_tiers);

  -- Si no tiene niveles, es válido (sin tiers)
  IF tier_count = 0 THEN
    RETURN NEW;
  END IF;

  -- Máximo 3 niveles
  IF tier_count > 3 THEN
    RAISE EXCEPTION 'El producto no puede tener más de 3 niveles de precio por mayor.';
  END IF;

  -- El producto debe tener un precio base válido
  IF NEW.price IS NULL OR NEW.price <= 0 THEN
    RAISE EXCEPTION 'El producto debe tener un precio base mayor a 0 para configurar precios por mayor.';
  END IF;

  -- Variaciones con precios distintos: no permitido si hay tiers
  IF NEW.variations IS NOT NULL AND jsonb_typeof(NEW.variations) = 'array' THEN
    FOR var_elem IN SELECT * FROM jsonb_array_elements(NEW.variations) LOOP
      IF var_elem->>'price' IS NOT NULL AND var_elem->>'price' != '' THEN
        var_price := (var_elem->>'price')::numeric;
        IF var_price IS NOT NULL AND var_price != NEW.price THEN
          RAISE EXCEPTION 'No se puede activar precio por mayor en productos con variaciones a distinto precio.';
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Validar cada nivel
  FOR i IN 0..(tier_count - 1) LOOP
    elem := NEW.wholesale_tiers->i;

    IF elem->>'min_qty' IS NULL OR elem->>'price' IS NULL THEN
      RAISE EXCEPTION 'Cada nivel debe incluir "min_qty" y "price".';
    END IF;

    min_q := (elem->>'min_qty')::int;
    tier_p := (elem->>'price')::numeric;

    -- N >= 2
    IF min_q < 2 THEN
      RAISE EXCEPTION 'La cantidad mínima de cada nivel debe ser al menos 2 unidades.';
    END IF;

    -- Precio > 0 y menor al precio del producto
    IF tier_p <= 0 THEN
      RAISE EXCEPTION 'El precio por mayor debe ser mayor a 0.';
    END IF;

    IF tier_p >= NEW.price THEN
      RAISE EXCEPTION 'El precio por mayor (%) debe ser menor al precio regular del producto (%).', tier_p, NEW.price;
    END IF;

    -- Los N deben ser estrictamente crecientes
    IF i > 0 AND min_q <= prev_min_q THEN
      RAISE EXCEPTION 'Las cantidades mínimas deben ser crecientes de un nivel al siguiente.';
    END IF;

    -- Los precios deben ser estrictamente decrecientes
    IF i > 0 AND tier_p >= prev_tier_p THEN
      RAISE EXCEPTION 'Los precios por mayor deben ser decrecientes de un nivel al siguiente.';
    END IF;

    prev_min_q := min_q;
    prev_tier_p := tier_p;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_wholesale_tiers ON public.products;
CREATE TRIGGER trg_validate_wholesale_tiers
BEFORE INSERT OR UPDATE OF wholesale_tiers, price, variations
ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.validate_wholesale_tiers();

-- 4. Actualizar get_public_store para devolver wholesale_enabled y wholesale_tiers
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
BEGIN
  SELECT * INTO store_row FROM stores WHERE slug = store_slug AND active = true LIMIT 1;
  IF store_row IS NULL THEN
    RETURN NULL;
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
    'banner_tagline', store_row.banner_tagline,
    'banner_bottom_tag', store_row.banner_bottom_tag,
    'show_dizi_branding', store_row.show_dizi_branding,
    'show_featured', COALESCE(store_row.show_featured, true),
    'show_discount_pct', COALESCE(store_row.show_discount_pct, false),
    'wholesale_enabled', CASE WHEN store_plan = 'semilla' THEN false ELSE COALESCE(store_row.wholesale_enabled, false) END,
    'promo_bar_enabled', store_row.promo_bar_enabled,
    'promo_bar_text', store_row.promo_bar_text,
    'promo_bar_action_type', store_row.promo_bar_action_type,
    'promo_bar_action_value', store_row.promo_bar_action_value,
    'promo_bar_bg_color', store_row.promo_bar_bg_color,
    'promo_bar_text_color', store_row.promo_bar_text_color,
    'promo_bar_is_marquee', store_row.promo_bar_is_marquee,
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

-- 5. Actualizar get_public_store_products para devolver wholesale_tiers
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
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
    'wholesale_tiers', COALESCE(p.wholesale_tiers, '[]'::jsonb),
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
$function$;

GRANT EXECUTE ON FUNCTION public.get_public_store(text, integer, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_store_products(text, integer, integer, text, text) TO anon, authenticated, service_role;

/*
-- ============================================================================
-- SQL PARA REVERTIR ESTA MIGRACIÓN (EJECUTAR EN ESTE ORDEN EXACTO EN CASO DE REVERSIÓN)
-- ============================================================================

-- 1. Restaurar funciones get_public_store y get_public_store_products a su versión previa (sin wholesale)
-- (Definiciones canónicas de Fase 40 registradas en producción)

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
BEGIN
  SELECT * INTO store_row FROM stores WHERE slug = store_slug AND active = true LIMIT 1;
  IF store_row IS NULL THEN
    RETURN NULL;
  END IF;

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
    'banner_tagline', store_row.banner_tagline,
    'banner_bottom_tag', store_row.banner_bottom_tag,
    'show_dizi_branding', store_row.show_dizi_branding,
    'show_featured', COALESCE(store_row.show_featured, true),
    'show_discount_pct', COALESCE(store_row.show_discount_pct, false),
    'promo_bar_enabled', store_row.promo_bar_enabled,
    'promo_bar_text', store_row.promo_bar_text,
    'promo_bar_action_type', store_row.promo_bar_action_type,
    'promo_bar_action_value', store_row.promo_bar_action_value,
    'promo_bar_bg_color', store_row.promo_bar_bg_color,
    'promo_bar_text_color', store_row.promo_bar_text_color,
    'promo_bar_is_marquee', store_row.promo_bar_is_marquee,
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
 SET search_path TO 'public', 'pg_temp'
AS $function$
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

  v_effective_limit := public.effective_product_limit(v_store_row.id);

  v_page_offset := GREATEST(COALESCE(p_page_offset, 0), 0);
  v_page_limit := GREATEST(COALESCE(p_page_limit, 24), 0);

  IF v_page_offset >= v_effective_limit THEN
    RETURN '[]'::jsonb;
  END IF;

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
$function$;

-- 2. Eliminar trigger y función de validación
DROP TRIGGER IF EXISTS trg_validate_wholesale_tiers ON public.products;
DROP FUNCTION IF EXISTS public.validate_wholesale_tiers();

-- 3. Eliminar columnas agregadas
ALTER TABLE public.products
DROP COLUMN IF EXISTS wholesale_tiers;

ALTER TABLE public.stores
DROP COLUMN IF EXISTS wholesale_enabled;

*/
