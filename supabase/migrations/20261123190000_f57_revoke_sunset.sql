-- ==============================================================================
-- MIGRACIÓN: 20261123190000_f57_revoke_sunset.sql
-- DESCRIPCIÓN: Revocar permisos de ejecución a authenticated en apply_semilla_sunset()
-- FECHA: 2026-11-23
-- ==============================================================================

REVOKE EXECUTE ON FUNCTION public.apply_semilla_sunset() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_semilla_sunset() TO service_role;

-- ==============================================================================
-- SCRIPT DE REVERSIÓN
-- ==============================================================================
/*
GRANT EXECUTE ON FUNCTION public.apply_semilla_sunset() TO authenticated;
*/
