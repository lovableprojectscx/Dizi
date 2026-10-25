-- Migración: 20261025100000_hotfix_rls_productos_ocultos.sql
-- Hotfix de seguridad RLS: Ocultar productos no visibles a consultas públicas (anon / public)
-- Fecha: 25 de octubre de 2026
-- Objetivo: Restringir 'products_public_select' para que clientes anónimos solo puedan
-- leer productos con visible = true en tiendas activas y publicadas, permitiendo al dueño
-- autenticado (owner_id = auth.uid()) leer tanto productos visibles como ocultos.

DROP POLICY IF EXISTS "products_public_select" ON public.products;

CREATE POLICY "products_public_select" ON public.products
FOR SELECT TO public
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = products.store_id
      AND (
        (stores.active = true AND stores.is_published = true AND products.visible = true)
        OR stores.owner_id = (SELECT auth.uid())
      )
  )
);

/*
-- ==============================================================================
-- SQL de Reversión (Rollback manual en caso de emergencia):
-- ==============================================================================
DROP POLICY IF EXISTS "products_public_select" ON public.products;

CREATE POLICY "products_public_select" ON public.products
FOR SELECT TO public
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = products.store_id
      AND (
        ((stores.active = true) AND (stores.is_published = true))
        OR (stores.owner_id = (SELECT auth.uid()))
      )
  )
);
*/
