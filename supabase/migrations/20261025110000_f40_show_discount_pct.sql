-- Migración: 20261025110000_f40_show_discount_pct.sql
-- Encargo: F40 - Porcentaje de descuento en las ofertas
-- Fecha: 25 de octubre de 2026
-- Objetivo:
-- 1. Agregar columna show_discount_pct a stores con default false para tiendas existentes
-- 2. Modificar default a true para que tiendas nuevas nazcan con el porcentaje activo
-- 3. Exponer show_discount_pct a través de la función pública get_public_store
-- NOTA: Archivo de migración (NO aplicar a producción hasta el merge y confirmación de Jack)

-- 1. Agregar columna show_discount_pct con default false (las existentes quedan en false)
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS show_discount_pct boolean NOT NULL DEFAULT false;

-- 2. Cambiar default a true para que tiendas futuras nazcan encendidas
ALTER TABLE public.stores
ALTER COLUMN show_discount_pct SET DEFAULT true;

-- 3. Actualizar función RPC get_public_store para devolver show_discount_pct
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

/*
-- ==============================================================================
-- SQL DE REVERSIÓN (Rollback manual en orden estricto):
-- 1. Restaurar función get_public_store previa (sin show_discount_pct)
-- 2. Eliminar columna show_discount_pct de la tabla stores
-- ==============================================================================

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

ALTER TABLE public.stores
DROP COLUMN IF EXISTS show_discount_pct;

*/
