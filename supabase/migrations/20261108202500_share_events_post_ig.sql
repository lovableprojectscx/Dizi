-- ==============================================================================
-- Migración: Actualizar restricción CHECK de size en public.share_events
-- Fecha: 2026-11-08 20:25:00
-- Descripción: Permite el nuevo formato 'post-ig' (1080×1350) además de 'historia' y 'cuadrada'.
-- ==============================================================================

ALTER TABLE public.share_events
  DROP CONSTRAINT IF EXISTS share_events_size_check;

ALTER TABLE public.share_events
  ADD CONSTRAINT share_events_size_check
  CHECK (size IN ('historia', 'cuadrada', 'post-ig'));
