-- ==============================================================================
-- Migración Fase 3: Aceptación de Términos (G7) y Plan Solicitado (G9)
-- Fecha: 2026-09-30 12:00:00 UTC
-- ==============================================================================
-- 1. Agregar columna terms_accepted_at en public.stores (G7)
--    Tiendas existentes permanecen en NULL (no se inventan fechas).
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.stores.terms_accepted_at IS
  'Marca temporal (UTC) en que el usuario aceptó los Términos de Servicio y Política de Privacidad al registrarse.';

-- 2. Agregar columna requested_plan en public.stores (G9)
--    Almacena el plan comercial que el comercio seleccionó en /register?plan=<id> para seguimiento en /super/tiendas.
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS requested_plan TEXT DEFAULT NULL;

COMMENT ON COLUMN public.stores.requested_plan IS
  'Plan comercial solicitado por el usuario al registrarse (ej: emprendedor, pro, ilimitado). La tienda se inicializa en semilla y el cobro es manual.';

-- 3. Actualizar función RPC initialize_store con CREATE OR REPLACE (sin DROP)
--    - Mantiene exactamente la misma firma y tipos (11 parámetros).
--    - Registra terms_accepted_at = now() atómicamente.
--    - Registra requested_plan si p_plan != 'semilla' (para usuarios regulares, plan se fuerza a 'semilla').
--    - Reemplaza fotos de muestra por el placeholder neutro local /images/sin-foto.svg.
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

  -- 5. Insertar productos de ejemplo (placeholders locales sin fotos externas)
  INSERT INTO public.products (
    id, store_id, category_id, name, price, image, description, is_on_sale, visible, is_sample
  ) VALUES 
  (
    'p_' || substr(md5(random()::text), 1, 8), p_id, p_category_id, 
    'Producto de Ejemplo 1', 49.90, 
    '/images/sin-foto.svg', 
    'Esta es una descripción de ejemplo para tu primer producto. Puedes editarla o eliminarla desde el panel de administración.', 
    false, true, true
  ),
  (
    'p_' || substr(md5(random()::text), 1, 8), p_id, p_category_id, 
    'Producto en Oferta 2', 99.90, 
    '/images/sin-foto.svg', 
    'Este es un producto de ejemplo con precio de oferta. Puedes configurar precios anteriores para mostrar descuentos.', 
    true, true, true
  ),
  (
    'p_' || substr(md5(random()::text), 1, 8), p_id, p_category_id, 
    'Producto de Ejemplo 3', 29.90, 
    '/images/sin-foto.svg', 
    'Otro producto de muestra para decorar tu catálogo inicial.', 
    false, true, true
  );
END;
$function$;

-- 4. Permisos de ejecución
GRANT EXECUTE ON FUNCTION public.initialize_store(text, text, text, text, text, text, uuid, text, text, text, text) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.initialize_store(text, text, text, text, text, text, uuid, text, text, text, text) FROM PUBLIC, anon;

-- ==============================================================================
-- SQL PARA REVERTIR (Rollback)
-- ==============================================================================
-- ALTER TABLE public.stores DROP COLUMN IF EXISTS requested_plan;
-- ALTER TABLE public.stores DROP COLUMN IF EXISTS terms_accepted_at;
-- (Restaurar initialize_store a la versión de 20260928180000_telefonos_paises.sql)
