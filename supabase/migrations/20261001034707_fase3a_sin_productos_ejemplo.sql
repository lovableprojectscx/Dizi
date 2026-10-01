-- ==============================================================================
-- Migración Fase 3A: Tiendas nuevas sin productos de ejemplo
-- Fecha: 2026-09-30 21:35:00 UTC
-- ==============================================================================
-- 1. Actualizar función RPC initialize_store con CREATE OR REPLACE (sin DROP)
--    - Mantiene exactamente la misma firma y tipos (11 parámetros).
--    - Mantiene SECURITY DEFINER y search_path = public, pg_temp.
--    - Mantiene validación de auth.uid() y rol super_admin.
--    - Mantiene inserción en stores con requested_plan y terms_accepted_at = now().
--    - Mantiene inserción de categoría inicial 'General'.
--    - ELIMINA la inserción del paso 5 (los 3 productos de ejemplo).

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
  p_country_iso text DEFAULT 'PE'::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_plan text;
  v_requested_plan text;
  v_is_super boolean;
BEGIN
  -- 1. Exigir que auth.uid() coincida con p_owner_id, o que quien llama sea super_admin
  v_is_super := (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text);

  IF auth.uid() IS NULL OR (auth.uid() != p_owner_id AND NOT v_is_super) THEN
    RAISE EXCEPTION 'No autorizado. Solo el dueño autenticado o un super_admin pueden inicializar la tienda.';
  END IF;

  -- 2. Si no es super_admin, forzar plan = 'semilla' y registrar el plan solicitado en requested_plan
  IF v_is_super THEN
    v_plan := COALESCE(p_plan, 'semilla');
    v_requested_plan := NULL;
  ELSE
    v_plan := 'semilla';
    v_requested_plan := CASE WHEN p_plan IS NOT NULL AND p_plan != 'semilla' THEN p_plan ELSE NULL END;
  END IF;

  -- 3. Insertar tienda con v_plan, country_iso, terms_accepted_at y requested_plan
  INSERT INTO public.stores (
    id, slug, name, phone, country_code, country_iso, plan, requested_plan, terms_accepted_at, owner_id, model, active, is_published
  ) VALUES (
    p_id, p_slug, p_name, p_phone, p_country_code, COALESCE(p_country_iso, 'PE'), v_plan, v_requested_plan, now(), p_owner_id, p_model, true, true
  );

  -- 4. Insertar categoría inicial
  INSERT INTO public.categories (
    id, store_id, name
  ) VALUES (
    p_category_id, p_id, 'General'
  );

  -- 5. Eliminado en Fase 3A: las tiendas nuevas ya no reciben productos de ejemplo.
END;
$function$;

-- Permisos estrictos: solo authenticated, postgres y service_role. NUNCA anon ni PUBLIC.
REVOKE EXECUTE ON FUNCTION public.initialize_store(text, text, text, text, text, text, uuid, text, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.initialize_store(text, text, text, text, text, text, uuid, text, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.initialize_store(text, text, text, text, text, text, uuid, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.initialize_store(text, text, text, text, text, text, uuid, text, text, text, text) TO service_role;

/*
-- ==============================================================================
-- SQL de Reversión (Rollback manual en caso de emergencia):
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.initialize_store(
  p_id text, p_slug text, p_name text, p_phone text, p_country_code text,
  p_plan text, p_owner_id uuid, p_model text, p_niche text, p_category_id text,
  p_country_iso text DEFAULT 'PE'::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_plan text;
  v_requested_plan text;
  v_is_super boolean;
BEGIN
  v_is_super := (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text);
  IF auth.uid() IS NULL OR (auth.uid() != p_owner_id AND NOT v_is_super) THEN
    RAISE EXCEPTION 'No autorizado.';
  END IF;
  IF v_is_super THEN
    v_plan := COALESCE(p_plan, 'semilla');
    v_requested_plan := NULL;
  ELSE
    v_plan := 'semilla';
    v_requested_plan := CASE WHEN p_plan IS NOT NULL AND p_plan != 'semilla' THEN p_plan ELSE NULL END;
  END IF;
  INSERT INTO public.stores (id, slug, name, phone, country_code, country_iso, plan, requested_plan, terms_accepted_at, owner_id, model, active, is_published)
  VALUES (p_id, p_slug, p_name, p_phone, p_country_code, COALESCE(p_country_iso, 'PE'), v_plan, v_requested_plan, now(), p_owner_id, p_model, true, true);
  INSERT INTO public.categories (id, store_id, name) VALUES (p_category_id, p_id, 'General');
  INSERT INTO public.products (id, store_id, category_id, name, price, image, description, is_on_sale, visible, is_sample) VALUES 
  ('p_' || substr(md5(random()::text), 1, 8), p_id, p_category_id, 'Producto de Ejemplo 1', 49.90, '/images/sin-foto.svg', 'Descripción ejemplo 1', false, true, true),
  ('p_' || substr(md5(random()::text), 1, 8), p_id, p_category_id, 'Producto en Oferta 2', 99.90, '/images/sin-foto.svg', 'Descripción ejemplo 2', true, true, true),
  ('p_' || substr(md5(random()::text), 1, 8), p_id, p_category_id, 'Producto de Ejemplo 3', 29.90, '/images/sin-foto.svg', 'Descripción ejemplo 3', false, true, true);
END;
$function$;
*/
