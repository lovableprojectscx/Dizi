-- =============================================================================
-- MIGRACIÓN: RLS de Superadmin para tiendas, categorías y productos
-- Fecha: 2026-06-17
-- Descripción: Permite a los usuarios con rol 'super_admin' en su app_metadata
--              gestionar y modificar cualquier registro de tiendas, categorías
--              y productos para posibilitar soporte, cambios de plan y eliminación.
-- =============================================================================

-- ─── 1. POLÍTICAS PARA LA TABLA stores ───────────────────────────────────────

DROP POLICY IF EXISTS "stores_superadmin_select" ON public.stores;
CREATE POLICY "stores_superadmin_select" ON public.stores
  FOR SELECT TO authenticated
  USING (COALESCE((auth.jwt()->'app_metadata'->>'role'), '') = 'super_admin');

DROP POLICY IF EXISTS "stores_superadmin_insert" ON public.stores;
CREATE POLICY "stores_superadmin_insert" ON public.stores
  FOR INSERT TO authenticated
  WITH CHECK (COALESCE((auth.jwt()->'app_metadata'->>'role'), '') = 'super_admin');

DROP POLICY IF EXISTS "stores_superadmin_update" ON public.stores;
CREATE POLICY "stores_superadmin_update" ON public.stores
  FOR UPDATE TO authenticated
  USING (COALESCE((auth.jwt()->'app_metadata'->>'role'), '') = 'super_admin')
  WITH CHECK (COALESCE((auth.jwt()->'app_metadata'->>'role'), '') = 'super_admin');

DROP POLICY IF EXISTS "stores_superadmin_delete" ON public.stores;
CREATE POLICY "stores_superadmin_delete" ON public.stores
  FOR DELETE TO authenticated
  USING (COALESCE((auth.jwt()->'app_metadata'->>'role'), '') = 'super_admin');


-- ─── 2. POLÍTICAS PARA LA TABLA categories ───────────────────────────────────

DROP POLICY IF EXISTS "categories_superadmin_all" ON public.categories;
CREATE POLICY "categories_superadmin_all" ON public.categories
  FOR ALL TO authenticated
  USING (COALESCE((auth.jwt()->'app_metadata'->>'role'), '') = 'super_admin')
  WITH CHECK (COALESCE((auth.jwt()->'app_metadata'->>'role'), '') = 'super_admin');


-- ─── 3. POLÍTICAS PARA LA TABLA products ─────────────────────────────────────

DROP POLICY IF EXISTS "products_superadmin_all" ON public.products;
CREATE POLICY "products_superadmin_all" ON public.products
  FOR ALL TO authenticated
  USING (COALESCE((auth.jwt()->'app_metadata'->>'role'), '') = 'super_admin')
  WITH CHECK (COALESCE((auth.jwt()->'app_metadata'->>'role'), '') = 'super_admin');
