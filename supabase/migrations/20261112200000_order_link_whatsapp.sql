-- ==============================================================================
-- Migración: Link de Pedido en WhatsApp (Configuración + Tabla orders + RPCs)
-- Archivo: supabase/migrations/20261112200000_order_link_whatsapp.sql
-- Fecha: 2026-11-12
-- Estado: SOLO ARCHIVO (NO APLICAR EN PRODUCCIÓN HASTA MERGE Y OK DE JACK)
--
-- Contenido:
--   1. Columna public.stores.order_link_enabled (boolean NOT NULL DEFAULT false)
--   2. Tabla public.orders con RLS habilitado (solo SELECT dueño / super_admin)
--   3. RPC public.create_public_order (SECURITY DEFINER, validada en servidor, plan Pro/Ilimitado)
--   4. RPC public.get_public_order (SECURITY DEFINER, lectura pública por código único)
--   5. Recreación de public.get_public_store desde producción exponiendo order_link_enabled
--   6. Script de reversión comentado en orden estricto al final
-- ==============================================================================

-- 1. Columna en public.stores (apagada por defecto para no alterar tiendas existentes)
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS order_link_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.stores.order_link_enabled IS
  'Activa la generación automática de un link web con el detalle visual del pedido al enviarlo por WhatsApp (planes Pro e Ilimitado).';

-- 2. Tabla public.orders
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  store_id text NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  seller_name text,
  seller_phone text,
  items jsonb NOT NULL CHECK (jsonb_typeof(items) = 'array' AND jsonb_array_length(items) BETWEEN 1 AND 100),
  subtotal_regular numeric,
  wholesale_savings numeric NOT NULL DEFAULT 0 CHECK (wholesale_savings >= 0),
  total numeric,
  has_quote_items boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_store_created
  ON public.orders(store_id, created_at DESC);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_owner_select" ON public.orders;
CREATE POLICY "orders_owner_select" ON public.orders
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = orders.store_id
      AND stores.owner_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "orders_superadmin_select" ON public.orders;
CREATE POLICY "orders_superadmin_select" ON public.orders
FOR SELECT TO authenticated
USING (
  COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'super_admin'
);

REVOKE ALL ON public.orders FROM PUBLIC;
REVOKE ALL ON public.orders FROM anon;
REVOKE ALL ON public.orders FROM authenticated;
GRANT SELECT ON public.orders TO authenticated;

-- 3. RPC: Crear pedido público con validación estricta de tienda, plan y productos
CREATE OR REPLACE FUNCTION public.create_public_order(
  p_store_id text,
  p_items jsonb,
  p_seller_name text DEFAULT NULL,
  p_seller_phone text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  store_row public.stores%ROWTYPE;
  store_plan text;
  v_store_wholesale boolean;
  v_elem jsonb;
  v_product_id text;
  v_variation_id text;
  v_qty int;
  v_total_prod_qty int;
  prod_row public.products%ROWTYPE;
  v_var_elem jsonb;
  v_variation_name text;
  v_var_price numeric;
  v_var_image text;
  v_regular_price numeric;
  v_unit_price numeric;
  v_is_wholesale boolean;
  v_has_disparate_vars boolean;
  v_best_tier_price numeric;
  v_line_total numeric;
  v_clean_items jsonb := '[]'::jsonb;
  v_total_sum numeric := 0;
  v_regular_sum numeric := 0;
  v_has_quote_items boolean := false;
  v_wholesale_savings numeric := 0;
  v_final_total numeric;
  v_final_regular numeric;
  v_clean_seller_name text;
  v_clean_seller_phone text;
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_bytes bytea;
  v_code text;
  v_idx int;
  v_attempts int := 0;
  v_order_id uuid;
  v_created_at timestamptz;
  i int;
BEGIN
  IF p_store_id IS NULL OR length(trim(p_store_id)) = 0 THEN
    RAISE EXCEPTION 'Identificador de tienda requerido.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO store_row
  FROM public.stores
  WHERE id = p_store_id
    AND active = true
    AND is_published = true
  LIMIT 1;

  IF store_row.id IS NULL THEN
    RAISE EXCEPTION 'Tienda no disponible.' USING ERRCODE = 'P0002';
  END IF;

  -- Plan efectivo con regla unificada de 3 días de gracia
  IF store_row.plan = 'semilla' THEN
    store_plan := 'semilla';
  ELSIF store_row.plan_expires_at IS NOT NULL AND now() > store_row.plan_expires_at + interval '3 days' THEN
    store_plan := 'semilla';
  ELSE
    store_plan := store_row.plan;
  END IF;

  IF store_plan NOT IN ('pro', 'ilimitado') OR COALESCE(store_row.order_link_enabled, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'El link de pedido no está habilitado para esta tienda.' USING ERRCODE = '42501';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) != 'array' OR jsonb_array_length(p_items) < 1 OR jsonb_array_length(p_items) > 100 THEN
    RAISE EXCEPTION 'El pedido debe contener entre 1 y 100 artículos.' USING ERRCODE = '22023';
  END IF;

  v_store_wholesale := (store_plan != 'semilla') AND COALESCE(store_row.wholesale_enabled, false);

  -- Primera pasada: validar estructura básica y cantidades de cada línea
  FOR v_elem IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    IF jsonb_typeof(v_elem) != 'object' THEN
      RAISE EXCEPTION 'Cada artículo debe ser un objeto válido.' USING ERRCODE = '22023';
    END IF;
    v_product_id := NULLIF(trim(COALESCE(v_elem->>'product_id', '')), '');
    IF v_product_id IS NULL THEN
      RAISE EXCEPTION 'Falta product_id en un artículo del pedido.' USING ERRCODE = '22023';
    END IF;
    BEGIN
      v_qty := (v_elem->>'qty')::int;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Cantidad inválida en el pedido.' USING ERRCODE = '22023';
    END;
    IF v_qty IS NULL OR v_qty < 1 OR v_qty > 9999 THEN
      RAISE EXCEPTION 'La cantidad por artículo debe estar entre 1 y 9999.' USING ERRCODE = '22023';
    END IF;
  END LOOP;

  -- Segunda pasada: validar pertenencia a la tienda, resolver variaciones y precios reales
  FOR v_elem IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := trim(v_elem->>'product_id');
    v_qty := (v_elem->>'qty')::int;
    v_variation_id := NULLIF(trim(COALESCE(v_elem->>'variation_id', '')), '');

    SELECT * INTO prod_row
    FROM public.products
    WHERE id = v_product_id
      AND store_id = store_row.id
      AND visible = true
      AND COALESCE(is_sample, false) = false
    LIMIT 1;

    IF prod_row.id IS NULL THEN
      RAISE EXCEPTION 'Producto no disponible en esta tienda: %', v_product_id USING ERRCODE = '22023';
    END IF;

    SELECT COALESCE(SUM((it->>'qty')::int), 0)::int INTO v_total_prod_qty
    FROM jsonb_array_elements(p_items) it
    WHERE trim(COALESCE(it->>'product_id', '')) = v_product_id;

    v_variation_name := NULL;
    v_var_price := NULL;
    v_var_image := NULL;
    v_var_elem := NULL;

    IF v_variation_id IS NOT NULL AND prod_row.variations IS NOT NULL AND jsonb_typeof(prod_row.variations) = 'array' THEN
      SELECT ve INTO v_var_elem
      FROM jsonb_array_elements(prod_row.variations) ve
      WHERE ve->>'id' = v_variation_id
      LIMIT 1;

      IF v_var_elem IS NOT NULL THEN
        v_variation_name := NULLIF(left(trim(COALESCE(v_var_elem->>'name', '')), 120), '');
        IF v_var_elem->>'price' IS NOT NULL AND trim(v_var_elem->>'price') != '' THEN
          v_var_price := (v_var_elem->>'price')::numeric;
        END IF;
        v_var_image := NULLIF(trim(COALESCE(v_var_elem->>'image', '')), '');
      END IF;
    END IF;

    v_regular_price := COALESCE(v_var_price, prod_row.price);
    IF v_regular_price IS NOT NULL AND v_regular_price <= 0 THEN
      v_regular_price := NULL;
    END IF;

    v_unit_price := v_regular_price;
    v_is_wholesale := false;

    IF v_regular_price IS NOT NULL AND v_regular_price > 0 AND v_store_wholesale THEN
      SELECT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(COALESCE(prod_row.variations, '[]'::jsonb)) ve
        WHERE ve->>'price' IS NOT NULL
          AND trim(ve->>'price') != ''
          AND (ve->>'price')::numeric != COALESCE(prod_row.price, 0)
      ) INTO v_has_disparate_vars;

      IF NOT v_has_disparate_vars
         AND prod_row.price IS NOT NULL
         AND prod_row.price > 0
         AND prod_row.wholesale_tiers IS NOT NULL
         AND jsonb_typeof(prod_row.wholesale_tiers) = 'array' THEN
        SELECT (t->>'price')::numeric INTO v_best_tier_price
        FROM jsonb_array_elements(prod_row.wholesale_tiers) t
        WHERE (t->>'min_qty')::int >= 2
          AND (t->>'price')::numeric > 0
          AND (t->>'price')::numeric < prod_row.price
          AND v_total_prod_qty >= (t->>'min_qty')::int
        ORDER BY (t->>'price')::numeric ASC
        LIMIT 1;

        IF v_best_tier_price IS NOT NULL AND v_best_tier_price < v_regular_price THEN
          v_unit_price := v_best_tier_price;
          v_is_wholesale := true;
        END IF;
      END IF;
    END IF;

    IF v_unit_price IS NOT NULL AND v_unit_price > 0 THEN
      v_line_total := round(v_unit_price * v_qty, 2);
      v_total_sum := v_total_sum + (v_unit_price * v_qty);
      v_regular_sum := v_regular_sum + (COALESCE(v_regular_price, v_unit_price) * v_qty);
    ELSE
      v_line_total := NULL;
      v_has_quote_items := true;
    END IF;

    v_clean_items := v_clean_items || jsonb_build_array(
      jsonb_build_object(
        'product_id', prod_row.id,
        'name', left(prod_row.name, 200),
        'image', COALESCE(v_var_image, prod_row.image, ''),
        'variation_id', v_variation_id,
        'variation_name', v_variation_name,
        'qty', v_qty,
        'regular_price', v_regular_price,
        'unit_price', v_unit_price,
        'line_total', v_line_total,
        'is_wholesale', v_is_wholesale
      )
    );
  END LOOP;

  v_wholesale_savings := GREATEST(0, round(v_regular_sum - v_total_sum, 2));
  v_final_total := CASE WHEN v_total_sum > 0 THEN round(v_total_sum, 2) ELSE NULL END;
  v_final_regular := CASE WHEN v_regular_sum > 0 THEN round(v_regular_sum, 2) ELSE NULL END;

  v_clean_seller_name := NULLIF(left(trim(COALESCE(p_seller_name, '')), 60), '');
  v_clean_seller_phone := NULLIF(left(regexp_replace(COALESCE(p_seller_phone, ''), '[^0-9]', '', 'g'), 20), '');

  -- Generar código único corto no predecible (10 chars base32 sin caracteres ambiguos)
  LOOP
    v_attempts := v_attempts + 1;
    v_bytes := extensions.gen_random_bytes(10);
    v_code := '';
    FOR i IN 0..9 LOOP
      v_idx := (get_byte(v_bytes, i) % 32) + 1;
      v_code := v_code || substr(v_alphabet, v_idx, 1);
    END LOOP;

    BEGIN
      INSERT INTO public.orders (
        code,
        store_id,
        seller_name,
        seller_phone,
        items,
        subtotal_regular,
        wholesale_savings,
        total,
        has_quote_items
      ) VALUES (
        v_code,
        store_row.id,
        v_clean_seller_name,
        v_clean_seller_phone,
        v_clean_items,
        v_final_regular,
        v_wholesale_savings,
        v_final_total,
        v_has_quote_items
      )
      RETURNING id, created_at INTO v_order_id, v_created_at;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempts >= 5 THEN
        RAISE;
      END IF;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'id', v_order_id,
    'code', v_code,
    'created_at', v_created_at
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.create_public_order(text, jsonb, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_order(text, jsonb, text, text) TO anon, authenticated;

-- 4. RPC: Leer pedido público por código único (sin exponer listado)
CREATE OR REPLACE FUNCTION public.get_public_order(order_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_clean_code text;
  v_result jsonb;
BEGIN
  v_clean_code := upper(trim(COALESCE(order_code, '')));
  IF length(v_clean_code) < 6 OR length(v_clean_code) > 32 OR v_clean_code !~ '^[A-Z0-9_-]+$' THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', o.id,
    'code', o.code,
    'store_id', o.store_id,
    'store_slug', s.slug,
    'store_name', s.name,
    'store_logo', s.logo,
    'store_phone', s.phone,
    'brand_color', s.brand_color,
    'seller_name', o.seller_name,
    'seller_phone', o.seller_phone,
    'items', o.items,
    'subtotal_regular', o.subtotal_regular,
    'wholesale_savings', o.wholesale_savings,
    'total', o.total,
    'has_quote_items', o.has_quote_items,
    'created_at', o.created_at
  )
  INTO v_result
  FROM public.orders o
  JOIN public.stores s ON s.id = o.store_id
  WHERE o.code = v_clean_code
    AND s.active = true
  LIMIT 1;

  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_public_order(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_order(text) TO anon, authenticated;

-- 5. Recrear public.get_public_store desde producción agregando order_link_enabled
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
-- SQL PARA REVERTIR (EN ORDEN ESTRICTO DE REVERSIÓN)
-- ==============================================================================
-- -- 1. Restaurar public.get_public_store sin 'order_link_enabled' (ver 20261110140000_f50_store_header_style.sql)
-- -- 2. Eliminar funciones RPC de pedidos
-- DROP FUNCTION IF EXISTS public.get_public_order(text);
-- DROP FUNCTION IF EXISTS public.create_public_order(text, jsonb, text, text);
-- -- 3. Eliminar políticas, índice y tabla public.orders
-- DROP POLICY IF EXISTS "orders_superadmin_select" ON public.orders;
-- DROP POLICY IF EXISTS "orders_owner_select" ON public.orders;
-- DROP INDEX IF EXISTS public.idx_orders_store_created;
-- DROP TABLE IF EXISTS public.orders;
-- -- 4. Eliminar columna order_link_enabled de public.stores
-- ALTER TABLE public.stores DROP COLUMN IF EXISTS order_link_enabled;
