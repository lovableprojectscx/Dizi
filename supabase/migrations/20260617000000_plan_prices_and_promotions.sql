-- =============================================================================
-- MIGRACIÓN: Control de Promociones y Precios de Planes
-- Fecha: 2026-06-17
-- Descripción:
--   1. Crea la tabla 'plan_prices' para almacenar precios y promociones.
--   2. Habilita RLS en la tabla para lectura pública y edición exclusiva de superadmin.
--   3. Puebla la tabla con los 4 planes por defecto y sus precios actuales.
-- =============================================================================

-- ─── 1. CREACIÓN DE LA TABLA plan_prices ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.plan_prices (
  plan_id TEXT PRIMARY KEY CHECK (plan_id IN ('semilla', 'emprendedor', 'pro', 'ilimitado')),
  regular_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  promo_price NUMERIC(10,2),
  promo_active BOOLEAN NOT NULL DEFAULT false,
  promo_label TEXT,
  promo_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ─── 2. HABILITAR ROW LEVEL SECURITY (RLS) ──────────────────────────────────
ALTER TABLE public.plan_prices ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas previas si existen
DROP POLICY IF EXISTS "Lectura pública de precios" ON public.plan_prices;
DROP POLICY IF EXISTS "Escritura exclusiva para super_admins" ON public.plan_prices;

-- Permitir a cualquier usuario (autenticado o anónimo) leer los precios
CREATE POLICY "Lectura pública de precios" ON public.plan_prices
  FOR SELECT USING (true);

-- Permitir inserción/actualización/borrado solo a super_admins o service_role
CREATE POLICY "Escritura exclusiva para super_admins" ON public.plan_prices
  FOR ALL USING (
    auth.role() = 'service_role' 
    OR COALESCE((auth.jwt()->'app_metadata'->>'role'), '') = 'super_admin'
  );

-- ─── 3. SEED INITIAL DATA ───────────────────────────────────────────────────
INSERT INTO public.plan_prices (plan_id, regular_price, promo_price, promo_active, promo_label, promo_until) VALUES
  ('semilla', 0.00, NULL, false, NULL, NULL),
  ('emprendedor', 19.90, 9.90, true, 'Oferta de lanzamiento', NULL),
  ('pro', 29.90, 14.90, true, 'Precio especial', NULL),
  ('ilimitado', 49.90, 34.90, true, 'Ilimitado especial', NULL)
ON CONFLICT (plan_id) DO UPDATE SET
  regular_price = EXCLUDED.regular_price,
  promo_price = EXCLUDED.promo_price,
  promo_active = EXCLUDED.promo_active,
  promo_label = EXCLUDED.promo_label;
