-- ==============================================================================
-- Migración: F52 - Agregar columna source a public.share_events
-- Archivo: supabase/migrations/20261113160000_f52_share_events_source.sql
-- Fecha: 2026-11-13
--
-- NOTA IMPORTANTE: Archivo de migración preparado para Paso 0.
-- NO APLICAR A PRODUCCIÓN HASTA EL OK ESCRITO DE JACK Y PREVIO AL MERGE.
--
-- Contenido:
--   1. Agrega la columna `source` (text) a `public.share_events`
--      con valor por defecto 'productos'.
--   2. Restricción CHECK para garantizar únicamente valores ('productos', 'marketing').
--   3. Script de reversión comentado al final.
-- ==============================================================================

-- 1. Agregar columna source si no existe
ALTER TABLE public.share_events
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'productos';

-- 2. Asegurar restricción CHECK idempotente
ALTER TABLE public.share_events
  DROP CONSTRAINT IF EXISTS share_events_source_check;

ALTER TABLE public.share_events
  ADD CONSTRAINT share_events_source_check
  CHECK (source IN ('productos', 'marketing'));

-- ==============================================================================
-- SCRIPT DE REVERSIÓN (EN CASO DE NECESIDAD)
-- ==============================================================================
-- ALTER TABLE public.share_events DROP CONSTRAINT IF EXISTS share_events_source_check;
-- ALTER TABLE public.share_events DROP COLUMN IF EXISTS source;
