-- Migración: 20260925145500_fase0_eliminar_allow_all.sql
-- Fase 0 Seguridad Urgente: Paso 4
-- Elimina las 4 políticas permisivas Allow_All y crea la función segura check_slug_available.

-- 1. Crear función SECURITY DEFINER para verificar disponibilidad de slug
CREATE OR REPLACE FUNCTION public.check_slug_available(p_slug text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_slug IS NULL OR length(trim(p_slug)) < 3 THEN
    RETURN false;
  END IF;

  RETURN NOT EXISTS (
    SELECT 1 FROM public.stores WHERE lower(slug) = lower(trim(p_slug))
  );
END;
$$;

-- Permisos de ejecución para la función de validación de slug
REVOKE ALL ON FUNCTION public.check_slug_available(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_slug_available(text) TO anon, authenticated, service_role;

-- 2. Eliminar las 4 políticas Allow_All
DROP POLICY IF EXISTS "Allow_All_stores" ON public.stores;
DROP POLICY IF EXISTS "Allow_All_products" ON public.products;
DROP POLICY IF EXISTS "Allow_All_categories" ON public.categories;
DROP POLICY IF EXISTS "Allow_All_invites" ON public.invites;

/*
-- SQL PARA REVERTIR ESTA MIGRACIÓN:
CREATE POLICY "Allow_All_stores" ON public.stores FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow_All_products" ON public.products FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow_All_categories" ON public.categories FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow_All_invites" ON public.invites FOR ALL TO public USING (true) WITH CHECK (true);
DROP FUNCTION IF EXISTS public.check_slug_available(text);
*/
