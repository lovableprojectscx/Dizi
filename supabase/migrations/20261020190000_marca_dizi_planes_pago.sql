-- ==============================================================================
-- Migración: Ocultar Marca "Creado con Dizi" por defecto en Planes de Pago
-- Archivo: supabase/migrations/20261020190000_marca_dizi_planes_pago.sql
-- Fecha: 2026-10-20
-- Descripción:
--   1. Crea la función reset_branding_on_upgrade() y el trigger
--      trg_reset_branding_on_upgrade BEFORE UPDATE OF plan ON public.stores.
--      Cuando una tienda pasa de 'semilla' a un plan de pago y show_dizi_branding
--      es TRUE (valor asignado por defecto en la creación), se reinicia a NULL
--      para que el frontend aplique la marca blanca por defecto (?? false).
--   2. Actualiza retroactivamente las tiendas en planes de pago que tenían
--      show_dizi_branding = true explícito a NULL.
-- ==============================================================================

-- 1. Función y Trigger para reiniciar branding en upgrade de plan
CREATE OR REPLACE FUNCTION public.reset_branding_on_upgrade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.plan = 'semilla' AND NEW.plan <> 'semilla' AND NEW.show_dizi_branding IS TRUE THEN
    NEW.show_dizi_branding := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reset_branding_on_upgrade ON public.stores;
CREATE TRIGGER trg_reset_branding_on_upgrade
BEFORE UPDATE OF plan ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.reset_branding_on_upgrade();

-- 2. Backfill retroactivo para tiendas existentes en planes de pago
UPDATE public.stores
SET show_dizi_branding = NULL
WHERE plan <> 'semilla' AND show_dizi_branding IS TRUE;

-- ==============================================================================
-- SQL de reversión (comentado):
-- DROP TRIGGER IF EXISTS trg_reset_branding_on_upgrade ON public.stores;
-- DROP FUNCTION IF EXISTS public.reset_branding_on_upgrade();
-- UPDATE public.stores SET show_dizi_branding = true WHERE plan <> 'semilla' AND show_dizi_branding IS NULL;
-- ==============================================================================
