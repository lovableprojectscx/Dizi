-- ==============================================================================
-- Migración: F46 - Tabla de medición de eventos de compartir imagen (share_events)
-- Archivo: supabase/migrations/20261108000000_create_share_events.sql
-- Fecha: 2026-11-08
--
-- NOTA IMPORTANTE: Archivo de migración (NO APLICAR A PRODUCCIÓN HASTA EL MERGE
-- Y CONFIRMACIÓN ESCRITA DE JACK).
--
-- Contenido:
--   1. Tabla public.share_events (id, store_id, product_id, style, size, created_at)
--   2. Índices de optimización para conteo semanal por store_id y fecha
--   3. Row Level Security (RLS) habilitado con políticas para dueño y super_admin
--   4. Script de reversión comentado al final en orden estricto
-- ==============================================================================

-- 1. Crear tabla share_events
CREATE TABLE IF NOT EXISTS public.share_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id text NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id text REFERENCES public.products(id) ON DELETE SET NULL,
  style text NOT NULL CHECK (style IN ('etiqueta', 'editorial', 'marco-color', 'oferta')),
  size text NOT NULL CHECK (size IN ('historia', 'cuadrada')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Índices de optimización
CREATE INDEX IF NOT EXISTS idx_share_events_store_created
  ON public.share_events(store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_share_events_product
  ON public.share_events(product_id);

-- 3. Habilitar RLS
ALTER TABLE public.share_events ENABLE ROW LEVEL SECURITY;

-- 3.1 Política INSERT: el dueño de la tienda puede registrar eventos de compartir
DROP POLICY IF EXISTS "share_events_owner_insert" ON public.share_events;
CREATE POLICY "share_events_owner_insert" ON public.share_events
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = share_events.store_id
      AND stores.owner_id = (SELECT auth.uid())
  )
  AND (
    share_events.product_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = share_events.product_id
        AND p.store_id = share_events.store_id
    )
  )
);

-- 3.2 Política SELECT: el dueño de la tienda puede consultar sus propios eventos
DROP POLICY IF EXISTS "share_events_owner_select" ON public.share_events;
CREATE POLICY "share_events_owner_select" ON public.share_events
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = share_events.store_id
      AND stores.owner_id = (SELECT auth.uid())
  )
);

-- 3.3 Política SELECT: super_admin para métricas globales
DROP POLICY IF EXISTS "share_events_superadmin_select" ON public.share_events;
CREATE POLICY "share_events_superadmin_select" ON public.share_events
FOR SELECT TO authenticated
USING (
  COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'super_admin'
);

-- Permisos mínimos
REVOKE ALL ON public.share_events FROM PUBLIC;
GRANT SELECT, INSERT ON public.share_events TO authenticated;

-- ==============================================================================
-- SCRIPT DE REVERSIÓN (EN CASO DE NECESIDAD - EJECUTAR EN ORDEN INVERSO)
-- ==============================================================================
-- DROP POLICY IF EXISTS "share_events_superadmin_select" ON public.share_events;
-- DROP POLICY IF EXISTS "share_events_owner_select" ON public.share_events;
-- DROP POLICY IF EXISTS "share_events_owner_insert" ON public.share_events;
-- DROP INDEX IF EXISTS public.idx_share_events_product;
-- DROP INDEX IF EXISTS public.idx_share_events_store_created;
-- DROP TABLE IF EXISTS public.share_events;
