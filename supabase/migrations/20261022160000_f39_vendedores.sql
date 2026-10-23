-- ==============================================================================
-- Migración: F39 - Soporte para Varios Vendedores (WhatsApp Múltiple)
-- Archivo: supabase/migrations/20261022160000_f39_vendedores.sql
-- Fecha: 2026-10-22
-- Descripción:
--   1. Añade columna sellers a public.stores (jsonb default '[]'::jsonb).
--   2. Trigger BEFORE INSERT OR UPDATE OF sellers para validar estructura y límites
--      por plan (Semilla 1, Emprendedor 1, Pro 3, Ilimitado 5 contando el principal).
--      Nunca bloquea desactivar o borrar vendedores.
--   3. Actualiza get_public_store para devolver 'sellers' activos recortados al
--      límite del plan efectivo menos 1 (por el principal), preservando el orden
--      mediante jsonb_array_elements(...) WITH ORDINALITY.
-- ==============================================================================

-- 1. Añadir columnas sellers y main_seller_name
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS sellers jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS main_seller_name text;

-- 2. Función y Trigger de Validación en el Servidor
CREATE OR REPLACE FUNCTION public.validate_store_sellers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  elem jsonb;
  elem_id text;
  elem_name text;
  elem_phone text;
  elem_iso text;
  elem_active boolean;
  new_active_count int := 0;
  old_active_count int := 0;
  days_expired int;
  effective_plan text;
  max_sellers int;
BEGIN
  -- Validar main_seller_name si viene provisto (opcional, 1 a 40 caracteres)
  IF NEW.main_seller_name IS NOT NULL THEN
    IF length(trim(NEW.main_seller_name)) < 1 OR length(NEW.main_seller_name) > 40 THEN
      RAISE EXCEPTION 'El nombre del vendedor principal debe tener entre 1 y 40 caracteres.' USING ERRCODE = '22023';
    END IF;
  END IF;

  -- Solo validar sellers cuando se inserte o cuando sellers cambie de valor
  IF TG_OP = 'UPDATE' AND (NEW.sellers IS NOT DISTINCT FROM OLD.sellers) THEN
    RETURN NEW;
  END IF;

  -- Asegurar que sea un array jsonb
  IF jsonb_typeof(NEW.sellers) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'La columna sellers debe ser un arreglo JSON.' USING ERRCODE = '22023';
  END IF;

  -- Validar estructura de cada elemento
  FOR elem IN SELECT * FROM jsonb_array_elements(NEW.sellers) LOOP
    IF jsonb_typeof(elem) IS DISTINCT FROM 'object' THEN
      RAISE EXCEPTION 'Cada elemento de sellers debe ser un objeto.' USING ERRCODE = '22023';
    END IF;

    elem_id := elem->>'id';
    elem_name := elem->>'name';
    elem_phone := elem->>'phone';
    elem_iso := elem->>'country_iso';

    IF elem_id IS NULL OR length(trim(elem_id)) = 0 THEN
      RAISE EXCEPTION 'Cada vendedor debe tener un id válido.' USING ERRCODE = '22023';
    END IF;

    IF elem_name IS NULL OR length(trim(elem_name)) < 1 OR length(elem_name) > 40 THEN
      RAISE EXCEPTION 'El nombre del vendedor debe tener entre 1 y 40 caracteres.' USING ERRCODE = '22023';
    END IF;

    -- Teléfono: solo dígitos, 6 a 15 caracteres
    IF elem_phone IS NULL OR elem_phone !~ '^[0-9]{6,15}$' THEN
      RAISE EXCEPTION 'El teléfono del vendedor debe contener únicamente entre 6 y 15 dígitos.' USING ERRCODE = '22023';
    END IF;

    -- Código de país (ISO 3166-1 alfa-2): 2 letras
    IF elem_iso IS NULL OR elem_iso !~ '^[A-Za-z]{2}$' THEN
      RAISE EXCEPTION 'El código de país (country_iso) del vendedor debe ser de 2 letras.' USING ERRCODE = '22023';
    END IF;

    -- Campo active: booleano estricto
    IF jsonb_typeof(elem->'active') IS DISTINCT FROM 'boolean' THEN
      RAISE EXCEPTION 'El campo active del vendedor debe ser booleano.' USING ERRCODE = '22023';
    END IF;

    elem_active := (elem->>'active')::boolean;
    IF elem_active IS TRUE THEN
      new_active_count := new_active_count + 1;
    END IF;
  END LOOP;

  -- Calcular plan efectivo (con regla de vencimiento y 3 días de gracia)
  IF NEW.plan_expires_at IS NOT NULL AND NEW.plan_expires_at < now() THEN
    days_expired := date_part('day', now() - NEW.plan_expires_at)::int;
  ELSE
    days_expired := -1;
  END IF;

  IF NEW.plan = 'semilla' THEN
    effective_plan := 'semilla';
  ELSIF days_expired > 3 THEN
    effective_plan := 'semilla';
  ELSE
    effective_plan := NEW.plan;
  END IF;

  -- Límite total de vendedores (contando el principal: Semilla 1, Emprendedor 1, Pro 3, Ilimitado 5)
  IF effective_plan = 'ilimitado' THEN
    max_sellers := 5;
  ELSIF effective_plan = 'pro' THEN
    max_sellers := 3;
  ELSE
    max_sellers := 1;
  END IF;

  -- Si es UPDATE, contar los activos anteriores
  IF TG_OP = 'UPDATE' THEN
    SELECT count(*) INTO old_active_count
    FROM jsonb_array_elements(COALESCE(OLD.sellers, '[]'::jsonb)) old_elem
    WHERE (old_elem->>'active')::boolean IS TRUE;

    -- Nunca bloquear desactivar o borrar vendedores (si la cantidad de activos no aumenta)
    IF new_active_count <= old_active_count THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Validar límite: nuevos activos extra + 1 (principal) no puede exceder max_sellers
  IF (new_active_count + 1) > max_sellers THEN
    RAISE EXCEPTION 'El plan % solo permite hasta % vendedor(es) activo(s) en total (contando el principal).', effective_plan, max_sellers USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_store_sellers ON public.stores;
CREATE TRIGGER trg_validate_store_sellers
BEFORE INSERT OR UPDATE OF sellers, main_seller_name ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.validate_store_sellers();

-- 3. Actualizar función RPC get_public_store
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
  max_extra_sellers int;
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

  -- Límite de vendedores extra (contando el principal: Semilla 1, Emprendedor 1, Pro 3, Ilimitado 5)
  IF store_plan = 'ilimitado' THEN
    max_extra_sellers := 4;
  ELSIF store_plan = 'pro' THEN
    max_extra_sellers := 2;
  ELSE
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

GRANT EXECUTE ON FUNCTION public.get_public_store(text, integer, integer) TO anon, authenticated, service_role;

-- ==============================================================================
-- SQL de Reversión (Rollback comentado):
-- ==============================================================================
-- DROP TRIGGER IF EXISTS trg_validate_store_sellers ON public.stores;
-- DROP FUNCTION IF EXISTS public.validate_store_sellers();
-- ALTER TABLE public.stores DROP COLUMN IF EXISTS sellers;
-- ALTER TABLE public.stores DROP COLUMN IF EXISTS main_seller_name;
-- (Recrear get_public_store sin el bloque 'sellers')
