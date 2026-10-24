-- ==============================================================================
-- Migración F39b: Página Propia de Vendedores y Activación Flexible (WhatsApp Múltiple)
-- ==============================================================================
-- Decisiones de arquitectura (Jack 23-Oct):
-- 1. La sección Vendedores sale de admin.configuracion y pasa a su propia página (/admin/vendedores)
--    con interruptores grandes para activar/desactivar con un toque.
-- 2. Cualquier vendedor se puede apagar, incluido el principal, siempre que quede al menos uno activo (>= 1).
-- 3. El número principal (stores.phone) sigue siendo el oficial de la tienda para PDF, SEO y avisos.
-- 4. Prender el principal siempre está permitido, aunque la tienda quede por encima del límite (ej: tras bajar de plan).
-- 5. Criterio de plan efectivo y 3 días de gracia unificado con protect_store_billing_columns / effective_product_limit:
--    supabase/migrations/20260929160000_fase1c_blindaje.sql (Líneas 44 y 144).
-- ==============================================================================

-- 1. Agregar columna main_seller_active en stores
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS main_seller_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.stores.main_seller_active IS 
  'Indica si el vendedor principal (número oficial de la tienda) está activo para recibir chats de WhatsApp (F39b). Por defecto true.';

-- 2. Actualizar función y trigger de validación validate_store_sellers
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
  new_extra_active_count int := 0;
  old_extra_active_count int := 0;
  total_new_active int := 0;
  total_old_active int := 0;
  effective_plan text;
  max_sellers int;
BEGIN
  -- 1. Validar main_seller_active (no nulo, por defecto true)
  IF NEW.main_seller_active IS NULL THEN
    NEW.main_seller_active := true;
  END IF;

  -- 2. Validar main_seller_name si viene provisto
  IF NEW.main_seller_name IS NOT NULL THEN
    IF length(trim(NEW.main_seller_name)) < 1 OR length(NEW.main_seller_name) > 40 THEN
      RAISE EXCEPTION 'El nombre del vendedor principal debe tener entre 1 y 40 caracteres.' USING ERRCODE = '22023';
    END IF;
  END IF;

  -- 3. Solo validar sellers si cambian sellers, main_seller_name o main_seller_active
  IF TG_OP = 'UPDATE' 
     AND (NEW.sellers IS NOT DISTINCT FROM OLD.sellers) 
     AND (NEW.main_seller_active IS NOT DISTINCT FROM OLD.main_seller_active)
     AND (NEW.main_seller_name IS NOT DISTINCT FROM OLD.main_seller_name) THEN
    RETURN NEW;
  END IF;

  -- 4. Asegurar que sellers sea array jsonb
  IF jsonb_typeof(NEW.sellers) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'La columna sellers debe ser un arreglo JSON.' USING ERRCODE = '22023';
  END IF;

  -- 5. Validar estructura de cada vendedor extra y contar extras activos
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

    IF elem_phone IS NULL OR elem_phone !~ '^[0-9]{6,15}$' THEN
      RAISE EXCEPTION 'El teléfono del vendedor debe contener únicamente entre 6 y 15 dígitos.' USING ERRCODE = '22023';
    END IF;

    IF elem_iso IS NULL OR elem_iso !~ '^[A-Za-z]{2}$' THEN
      RAISE EXCEPTION 'El código de país (country_iso) del vendedor debe ser de 2 letras.' USING ERRCODE = '22023';
    END IF;

    IF jsonb_typeof(elem->'active') IS DISTINCT FROM 'boolean' THEN
      RAISE EXCEPTION 'El campo active del vendedor debe ser booleano.' USING ERRCODE = '22023';
    END IF;

    elem_active := (elem->>'active')::boolean;
    IF elem_active IS TRUE THEN
      new_extra_active_count := new_extra_active_count + 1;
    END IF;
  END LOOP;

  -- 6. Total de vendedores activos (principal si está activo + extras activos)
  total_new_active := (CASE WHEN NEW.main_seller_active IS TRUE THEN 1 ELSE 0 END) + new_extra_active_count;

  -- REGLA CRÍTICA 1: Debe quedar al menos un vendedor activo (se valida SIEMPRE, incluso en cambios que reducen activos)
  IF total_new_active < 1 THEN
    RAISE EXCEPTION 'Debe quedar al menos un vendedor activo.' USING ERRCODE = '22023';
  END IF;

  -- 7. Calcular plan efectivo (criterio unificado con protect_store_billing_columns / effective_product_limit:
  --    supabase/migrations/20260929160000_fase1c_blindaje.sql L44, L144)
  IF NEW.plan = 'semilla' THEN
    effective_plan := 'semilla';
  ELSIF NEW.plan_expires_at IS NOT NULL AND now() > NEW.plan_expires_at + interval '3 days' THEN
    effective_plan := 'semilla';
  ELSE
    effective_plan := NEW.plan;
  END IF;

  -- Límite total de vendedores (Semilla 1, Emprendedor 1, Pro 3, Ilimitado 5)
  IF effective_plan = 'ilimitado' THEN
    max_sellers := 5;
  ELSIF effective_plan = 'pro' THEN
    max_sellers := 3;
  ELSE
    max_sellers := 1;
  END IF;

  -- 8. Validaciones para UPDATE:
  IF TG_OP = 'UPDATE' THEN
    SELECT count(*) INTO old_extra_active_count
    FROM jsonb_array_elements(COALESCE(OLD.sellers, '[]'::jsonb)) old_elem
    WHERE (old_elem->>'active')::boolean IS TRUE;

    total_old_active := (CASE WHEN COALESCE(OLD.main_seller_active, true) IS TRUE THEN 1 ELSE 0 END) + old_extra_active_count;

    -- a) Nunca bloquear si la cantidad total de activos no aumenta
    IF total_new_active <= total_old_active THEN
      RETURN NEW;
    END IF;

    -- b) Prender el principal siempre está permitido, aunque la tienda quede por encima del límite
    --    (como pasa después de bajar de plan, ya que el catálogo lo resuelve con get_public_store)
    IF NEW.main_seller_active IS TRUE AND new_extra_active_count <= old_extra_active_count THEN
      RETURN NEW;
    END IF;
  END IF;

  -- REGLA CRÍTICA 2: Límite del plan efectivo (solo bloquea si se agregan o activan extras por encima del cupo)
  IF total_new_active > max_sellers THEN
    RAISE EXCEPTION 'El plan % solo permite hasta % vendedor(es) activo(s) en total.', effective_plan, max_sellers USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_store_sellers ON public.stores;
CREATE TRIGGER trg_validate_store_sellers
BEFORE INSERT OR UPDATE OF sellers, main_seller_name, main_seller_active ON public.stores
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
-- ALTER TABLE public.stores DROP COLUMN IF EXISTS main_seller_active;
-- (Para restaurar validate_store_sellers y get_public_store a la versión de F39,
-- ejecutar la definición de supabase/migrations/20261022160000_f39_vendedores.sql)
