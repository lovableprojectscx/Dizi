-- Migración: 20260928180000_telefonos_paises.sql
-- Fase 1A: Soporte para teléfonos internacionales y códigos ISO de los 21 países en DIZI
-- Fecha: 2026-09-28

-- 1. Agregar columna country_iso a stores (default 'PE', NOT NULL)
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS country_iso text NOT NULL DEFAULT 'PE';

-- 2. Restricción mínima de formato para filas nuevas o editadas (NOT VALID para no bloquear filas preexistentes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stores_phone_format'
  ) THEN
    ALTER TABLE public.stores
      ADD CONSTRAINT stores_phone_format CHECK (phone ~ '^[1-9][0-9]{7,14}$') NOT VALID;
  END IF;
END $$;

-- 3. Actualizar initialize_store partiendo de la versión viva de Fase 0b
-- Conserva el blindaje de seguridad: auth.uid() = p_owner_id, verificación super_admin,
-- forzado a plan 'semilla' para usuarios estándar, y search_path = public, pg_temp.
DROP FUNCTION IF EXISTS public.initialize_store(text, text, text, text, text, text, uuid, text, text, text);

CREATE OR REPLACE FUNCTION public.initialize_store(
  p_id text,
  p_slug text,
  p_name text,
  p_phone text,
  p_country_code text,
  p_plan text,
  p_owner_id uuid,
  p_model text,
  p_niche text,
  p_category_id text,
  p_country_iso text DEFAULT 'PE'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_plan text;
  v_is_super boolean;
BEGIN
  -- 1. Exigir que auth.uid() coincida con p_owner_id, o que quien llama sea super_admin
  v_is_super := (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text);

  IF auth.uid() IS NULL OR (auth.uid() != p_owner_id AND NOT v_is_super) THEN
    RAISE EXCEPTION 'No autorizado. Solo el dueño autenticado o un super_admin pueden inicializar la tienda.';
  END IF;

  -- 2. Si no es super_admin, forzar plan = 'semilla' e ignorar p_plan
  IF v_is_super THEN
    v_plan := COALESCE(p_plan, 'semilla');
  ELSE
    v_plan := 'semilla';
  END IF;

  -- 3. Insertar tienda con v_plan y country_iso
  INSERT INTO public.stores (
    id, slug, name, phone, country_code, country_iso, plan, owner_id, model, active, is_published
  ) VALUES (
    p_id, p_slug, p_name, p_phone, p_country_code, COALESCE(p_country_iso, 'PE'), v_plan, p_owner_id, p_model, true, true
  );

  -- 4. Insertar categoría inicial
  INSERT INTO public.categories (
    id, store_id, name
  ) VALUES (
    p_category_id, p_id, 'General'
  );

  -- 5. Insertar productos de ejemplo
  INSERT INTO public.products (
    id, store_id, category_id, name, price, image, description, is_on_sale, visible, is_sample
  ) VALUES 
  (
    'p_' || substr(md5(random()::text), 1, 8), p_id, p_category_id, 
    'Producto de Ejemplo 1', 49.90, 
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80', 
    'Esta es una descripción de ejemplo para tu primer producto. Puedes editarla o eliminarla desde el panel de administración.', 
    false, true, true
  ),
  (
    'p_' || substr(md5(random()::text), 1, 8), p_id, p_category_id, 
    'Producto en Oferta 2', 99.90, 
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80', 
    'Este es un producto de ejemplo con precio de oferta. Puedes configurar precios anteriores para mostrar descuentos.', 
    true, true, true
  ),
  (
    'p_' || substr(md5(random()::text), 1, 8), p_id, p_category_id, 
    'Producto de Ejemplo 3', 29.90, 
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80', 
    'Otro producto de muestra para decorar tu catálogo inicial.', 
    false, true, true
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.initialize_store(text, text, text, text, text, text, uuid, text, text, text, text) TO authenticated, service_role;

-- 4. Actualizar get_public_store para devolver country_iso
CREATE OR REPLACE FUNCTION public.get_public_store(store_slug text, page_limit integer DEFAULT 36, page_offset integer DEFAULT 0)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  store_row record;
  store_plan text;
  days_expired int;
  effective_limit int;
  effective_model text;
  effective_banner text;
  total_prod_count int;
  actual_limit int;
  result jsonb;
BEGIN
  SELECT * INTO store_row FROM stores WHERE slug = store_slug AND active = true LIMIT 1;
  IF store_row IS NULL THEN
    RETURN NULL;
  END IF;

  IF store_row.plan_expires_at IS NOT NULL AND store_row.plan_expires_at < now() THEN
    days_expired := date_part('day', now() - store_row.plan_expires_at)::int;
  ELSE
    days_expired := -1;
  END IF;

  IF store_row.plan = 'semilla' THEN
    store_plan := 'semilla';
  ELSIF days_expired > 3 THEN
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

  effective_model := COALESCE(store_row.model, 'minimalista');

  IF store_row.banners IS NOT NULL AND array_length(store_row.banners, 1) > 0 THEN
    effective_banner := array_to_string(store_row.banners, '|||');
  ELSE
    effective_banner := store_row.banner_image;
  END IF;

  SELECT LEAST(count(*), effective_limit) INTO total_prod_count
  FROM products
  WHERE store_id = store_row.id AND visible = true;

  actual_limit := LEAST(COALESCE(page_limit, 36), effective_limit);

  SELECT jsonb_build_object(
    'id', store_row.id,
    'slug', store_row.slug,
    'name', store_row.name,
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
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'product_count', (
          SELECT count(*)::int FROM products p 
          WHERE p.store_id = store_row.id AND p.category_id = c.id AND p.visible = true
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
        WHERE store_id = store_row.id AND visible = true
        ORDER BY sort_order ASC NULLS LAST, created_at DESC
        LIMIT actual_limit
        OFFSET COALESCE(page_offset, 0)
      ) p
    )
  ) INTO result;

  RETURN result;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_public_store(text, integer, integer) TO anon, authenticated, service_role;

-- ==============================================================================
-- REVERSIÓN:
-- ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_phone_format;
-- ALTER TABLE public.stores DROP COLUMN IF EXISTS country_iso;
-- DROP FUNCTION IF EXISTS public.initialize_store(text, text, text, text, text, text, uuid, text, text, text, text);
-- (Restaurar initialize_store de 10 parámetros y get_public_store anterior sin country_iso de Fase 0b)
-- ==============================================================================
