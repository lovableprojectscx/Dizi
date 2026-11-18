-- ==============================================================================
-- Migración: F49 - Registro simple, origen de llegada y embudo de registro
-- Archivo: supabase/migrations/20261117123000_f49_registro.sql
-- Fecha: 2026-11-17
--
-- NOTA IMPORTANTE: Archivo de migración preparado en Paso 0.
-- NO APLICAR A PRODUCCIÓN HASTA EL MERGE Y CONFIRMACIÓN ESCRITA DE JACK.
-- Respaldo previo recomendado antes de aplicar: esquema de `stores` y lista de políticas.
--
-- Contenido:
--   1. Columnas `signup_source` y `signup_utm` (NULL por defecto) en `public.stores`
--      con restricciones CHECK idempotentes.
--   2. Tabla `public.signup_funnel_events` para medición anónima de abandono por paso.
--   3. Índice por `created_at` en `public.signup_funnel_events`.
--   4. RLS activada en `public.signup_funnel_events`: solo INSERT para `anon` y
--      `authenticated`; solo SELECT para `super_admin`; sin UPDATE/DELETE público.
--   5. `get_public_store` no se modifica (el origen no es público).
--   6. Script de reversión comentado al final en orden inverso estricto.
-- ==============================================================================

-- 1. Columnas de origen en public.stores (tiendas existentes quedan con NULL)
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS signup_source text NULL;

ALTER TABLE public.stores
  DROP CONSTRAINT IF EXISTS stores_signup_source_check;

ALTER TABLE public.stores
  ADD CONSTRAINT stores_signup_source_check
  CHECK (
    signup_source IS NULL
    OR signup_source IN ('tiktok', 'facebook', 'instagram', 'recomendacion', 'otro')
  );

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS signup_utm text NULL;

ALTER TABLE public.stores
  DROP CONSTRAINT IF EXISTS stores_signup_utm_check;

ALTER TABLE public.stores
  ADD CONSTRAINT stores_signup_utm_check
  CHECK (
    signup_utm IS NULL
    OR signup_utm ~ '^[a-z0-9-]{1,40}$'
  );

-- 2. Tabla de eventos del embudo de registro (sin datos personales)
CREATE TABLE IF NOT EXISTS public.signup_funnel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL CHECK (length(session_id) BETWEEN 8 AND 64),
  step text NOT NULL CHECK (
    step IN ('vio_registro', 'completo_negocio', 'creo_cuenta', 'creo_producto', 'salto_producto')
  ),
  source text NULL CHECK (
    source IS NULL
    OR source ~ '^[a-z0-9-]{1,40}$'
  ),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Índice por created_at
CREATE INDEX IF NOT EXISTS idx_signup_funnel_events_created_at
  ON public.signup_funnel_events (created_at DESC);

-- 4. Row Level Security y permisos mínimos
ALTER TABLE public.signup_funnel_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "signup_funnel_events_anon_insert" ON public.signup_funnel_events;
CREATE POLICY "signup_funnel_events_anon_insert" ON public.signup_funnel_events
FOR INSERT TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS "signup_funnel_events_authenticated_insert" ON public.signup_funnel_events;
CREATE POLICY "signup_funnel_events_authenticated_insert" ON public.signup_funnel_events
FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "signup_funnel_events_superadmin_select" ON public.signup_funnel_events;
CREATE POLICY "signup_funnel_events_superadmin_select" ON public.signup_funnel_events
FOR SELECT TO authenticated
USING (
  COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text
);

REVOKE ALL ON TABLE public.signup_funnel_events FROM PUBLIC;
REVOKE ALL ON TABLE public.signup_funnel_events FROM anon;
REVOKE ALL ON TABLE public.signup_funnel_events FROM authenticated;
GRANT INSERT ON TABLE public.signup_funnel_events TO anon;
GRANT INSERT, SELECT ON TABLE public.signup_funnel_events TO authenticated;
GRANT ALL ON TABLE public.signup_funnel_events TO service_role;

-- ==============================================================================
-- SQL DE REVERSIÓN (EJECUTAR EN ORDEN INVERSO ESTRICTO EN CASO DE EMERGENCIA)
-- ==============================================================================
/*
REVOKE ALL ON TABLE public.signup_funnel_events FROM authenticated;
REVOKE ALL ON TABLE public.signup_funnel_events FROM anon;

DROP POLICY IF EXISTS "signup_funnel_events_superadmin_select" ON public.signup_funnel_events;
DROP POLICY IF EXISTS "signup_funnel_events_authenticated_insert" ON public.signup_funnel_events;
DROP POLICY IF EXISTS "signup_funnel_events_anon_insert" ON public.signup_funnel_events;

DROP INDEX IF EXISTS public.idx_signup_funnel_events_created_at;
DROP TABLE IF EXISTS public.signup_funnel_events;

ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_signup_utm_check;
ALTER TABLE public.stores DROP COLUMN IF EXISTS signup_utm;

ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_signup_source_check;
ALTER TABLE public.stores DROP COLUMN IF EXISTS signup_source;
*/
