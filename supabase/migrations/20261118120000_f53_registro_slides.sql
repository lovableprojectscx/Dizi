-- ==============================================================================
-- Migración: F53 - Registro en slides con ciudad opcional y embudo por pantalla
-- Archivo: supabase/migrations/20261118120000_f53_registro_slides.sql
-- Fecha: 2026-11-18
--
-- NOTA IMPORTANTE: Archivo de migración preparado en Paso 1.
-- NO APLICAR A PRODUCCIÓN HASTA EL MERGE Y CONFIRMACIÓN ESCRITA DE JACK.
--
-- Contenido:
--   1. Columna `signup_city` (text NULL) en `public.stores` con CHECK idempotente.
--   2. Ampliación del CHECK de `public.signup_funnel_events.step` con los nuevos
--      pasos del flujo en slides, conservando `completo_negocio`.
--   3. `get_public_store` y políticas RLS sin cambios.
--   4. SQL de reversión comentado al final en orden inverso estricto.
-- ==============================================================================

-- 1. Columna signup_city en public.stores (opcional, tiendas existentes quedan en NULL)
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS signup_city text NULL;

ALTER TABLE public.stores
  DROP CONSTRAINT IF EXISTS stores_signup_city_check;

ALTER TABLE public.stores
  ADD CONSTRAINT stores_signup_city_check
  CHECK (
    signup_city IS NULL
    OR signup_city ~ '^[a-z-]{2,30}$'
  );

-- 2. Ampliar CHECK de public.signup_funnel_events.step conservando valores de F49
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'signup_funnel_events'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%step%'
  LOOP
    EXECUTE format('ALTER TABLE public.signup_funnel_events DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.signup_funnel_events
  ADD CONSTRAINT signup_funnel_events_step_check
  CHECK (
    step IN (
      'vio_registro',
      'completo_negocio',
      'completo_nombre',
      'completo_rubro',
      'completo_whatsapp',
      'completo_datos',
      'creo_cuenta',
      'creo_producto',
      'salto_producto'
    )
  );

-- ==============================================================================
-- SQL DE REVERSIÓN (EJECUTAR EN ORDEN INVERSO ESTRICTO EN CASO DE EMERGENCIA)
-- ==============================================================================
/*
ALTER TABLE public.signup_funnel_events
  DROP CONSTRAINT IF EXISTS signup_funnel_events_step_check;

-- Nota: antes de restaurar la restricción anterior, limpiar o remapear filas con
-- 'completo_nombre', 'completo_rubro', 'completo_whatsapp' o 'completo_datos'.
ALTER TABLE public.signup_funnel_events
  ADD CONSTRAINT signup_funnel_events_step_check
  CHECK (
    step IN ('vio_registro', 'completo_negocio', 'creo_cuenta', 'creo_producto', 'salto_producto')
  );

ALTER TABLE public.stores
  DROP CONSTRAINT IF EXISTS stores_signup_city_check;

ALTER TABLE public.stores
  DROP COLUMN IF EXISTS signup_city;
*/
