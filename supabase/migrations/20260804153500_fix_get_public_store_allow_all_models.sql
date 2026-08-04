-- Migration: Fix get_public_store RPC to preserve the store's selected design model across all plans
-- Date: 2026-08-04

CREATE OR REPLACE FUNCTION get_public_store(store_slug text)
RETURNS jsonb
SECURITY DEFINER
AS $$
DECLARE
  store_row record;
  store_plan text;
  days_expired int;
  effective_limit int;
  effective_model text;
  result jsonb;
BEGIN
  -- Obtener la tienda activa
  SELECT * INTO store_row FROM stores WHERE slug = store_slug AND active = true LIMIT 1;
  IF store_row IS NULL THEN
    RETURN NULL;
  END IF;

  -- Calcular días transcurridos desde el vencimiento del plan
  IF store_row.plan_expires_at IS NOT NULL AND store_row.plan_expires_at < now() THEN
    days_expired := date_part('day', now() - store_row.plan_expires_at)::int;
  ELSE
    days_expired := -1;
  END IF;

  -- Determinar el plan efectivo (Semilla si venció hace más del período de gracia de 3 días)
  IF store_row.plan = 'semilla' THEN
    store_plan := 'semilla';
  ELSIF days_expired > 3 THEN
    store_plan := 'semilla';
  ELSE
    store_plan := store_row.plan;
  END IF;

  -- Determinar el límite de productos del plan efectivo
  IF store_plan = 'semilla' THEN
    effective_limit := 20;
  ELSE
    effective_limit := 999999;
  END IF;

  -- El modelo de diseño elegido por el dueño SIEMPRE se respeta en todos los planes
  effective_model := COALESCE(store_row.model, 'minimalista');

  -- Construir el resultado dividiendo en dos jsonb_build_object para no superar el límite de 100 argumentos
  SELECT jsonb_build_object(
    'id', store_row.id,
    'slug', store_row.slug,
    'name', store_row.name,
    'phone', store_row.phone,
    'country_code', store_row.country_code,
    'logo', store_row.logo,
    'brand_color', store_row.brand_color,
    'bg_color', store_row.bg_color,
    'text_color', store_row.text_color,
    'banner_image', store_row.banner_image,
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
    'empresa_direccion', store_row.empresa_direccion
  ) || jsonb_build_object(
    'plan_expires_at', store_row.plan_expires_at,
    'subscription_status', store_row.subscription_status,
    'cancelled_at', store_row.cancelled_at,
    'cancel_reason', store_row.cancel_reason,
    'plan_duration_months', store_row.plan_duration_months,
    'bio_description', store_row.bio_description,
    'location_lat', store_row.location_lat,
    'location_lng', store_row.location_lng,
    'location_address', store_row.location_address,
    'banner_tagline', store_row.banner_tagline,
    'banner_bottom_tag', store_row.banner_bottom_tag,
    'show_dizi_branding', store_row.show_dizi_branding,
    'promo_bar_enabled', store_row.promo_bar_enabled,
    'promo_bar_text', store_row.promo_bar_text,
    'promo_bar_action_type', store_row.promo_bar_action_type,
    'promo_bar_action_value', store_row.promo_bar_action_value,
    'promo_bar_bg_color', store_row.promo_bar_bg_color,
    'promo_bar_text_color', store_row.promo_bar_text_color,
    'promo_bar_is_marquee', store_row.promo_bar_is_marquee,
    'categories', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'name', name)), '[]'::jsonb)
      FROM categories
      WHERE store_id = store_row.id
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
        'created_at', created_at
      )), '[]'::jsonb)
      FROM (
        SELECT * FROM products
        WHERE store_id = store_row.id AND visible = true
        ORDER BY sort_order ASC NULLS LAST, created_at DESC
        LIMIT effective_limit
      ) p
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;
