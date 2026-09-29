-- Migration: Add catalog_typography and card_style to stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS catalog_typography text DEFAULT 'sans';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS card_style text DEFAULT 'standard';

-- Update get_public_store RPC to return these columns plus banner_style and niche
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
    effective_limit := 7;
  ELSE
    effective_limit := 999999;
  END IF;

  -- Determinar el modelo efectivo (Semilla usa minimalista)
  IF store_row.plan = 'semilla' THEN
    effective_model := 'minimalista';
  ELSIF days_expired >= 15 THEN
    effective_model := 'minimalista';
  ELSE
    effective_model := COALESCE(store_row.model, 'minimalista');
  END IF;

  -- Construir el resultado en formato JSONB
  SELECT jsonb_build_object(
    'id', store_row.id,
    'slug', store_row.slug,
    'name', store_row.name,
    'phone', store_row.phone,
    'country_code', store_row.country_code,
    'logo', store_row.logo,
    'brand_color', store_row.brand_color,
    'bg_color', store_row.bg_color,
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
    'empresa_direccion', store_row.empresa_direccion,
    'plan_expires_at', store_row.plan_expires_at,
    'subscription_status', store_row.subscription_status,
    'cancelled_at', store_row.cancelled_at,
    'cancel_reason', store_row.cancel_reason,
    'plan_duration_months', store_row.plan_duration_months,
    'bio_description', store_row.bio_description,
    'location_lat', store_row.location_lat,
    'location_lng', store_row.location_lng,
    'location_address', store_row.location_address,
    'quick_links', (
      CASE 
        WHEN store_plan = 'semilla' THEN 
          COALESCE((SELECT jsonb_agg(value) FROM (SELECT value FROM jsonb_array_elements(COALESCE(store_row.quick_links, '[]'::jsonb)) LIMIT 5) t), '[]'::jsonb)
        ELSE 
          COALESCE(store_row.quick_links, '[]'::jsonb)
      END
    ),
    'bio_links_enabled', store_row.bio_links_enabled,
    'bio_logo', store_row.bio_logo,
    'bio_banner', store_row.bio_banner,
    'bio_theme', CASE WHEN store_plan = 'semilla' THEN 'default' ELSE COALESCE(store_row.bio_theme, 'default') END,
    'bio_button_style', CASE WHEN store_plan = 'semilla' THEN 'pill-solid' ELSE COALESCE(store_row.bio_button_style, 'pill-solid') END,
    'bio_button_color', CASE WHEN store_plan = 'semilla' THEN NULL ELSE store_row.bio_button_color END,
    'bio_button_text_color', CASE WHEN store_plan = 'semilla' THEN NULL ELSE store_row.bio_button_text_color END,
    'bio_bg_image', CASE WHEN store_plan = 'semilla' THEN NULL ELSE store_row.bio_bg_image END,
    'bio_bg_color', CASE WHEN store_plan = 'semilla' THEN NULL ELSE store_row.bio_bg_color END,
    'bio_typography', CASE WHEN store_plan = 'semilla' THEN 'sans' ELSE COALESCE(store_row.bio_typography, 'sans') END,
    'categories', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', id, 'name', name))
      FROM categories 
      WHERE store_id = store_row.id
    ), '[]'::jsonb),
    'products', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', id,
        'name', name,
        'price', price,
        'category_id', category_id,
        'image', image,
        'description', description,
        'is_on_sale', is_on_sale,
        'original_price', original_price,
        'visible', visible,
        'is_sample', is_sample
      ))
      FROM (
        SELECT * FROM products 
        WHERE store_id = store_row.id AND visible = true AND is_sample = false
        ORDER BY created_at DESC 
        LIMIT effective_limit
      ) p_sub
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
