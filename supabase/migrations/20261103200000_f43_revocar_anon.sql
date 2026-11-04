-- ==============================================================================
-- Migración: F43 - Revocar permisos EXECUTE a anon en funciones de encuesta
-- Archivo: supabase/migrations/20261103200000_f43_revocar_anon.sql
-- Fecha: 2026-11-03
--
-- Contenido:
--   1. Revocar EXECUTE en los 3 RPC a anon.
--   2. Revocar EXECUTE en la función auxiliar generate_survey_reward_code a anon y authenticated.
--   3. SQL de reversión comentado al final.
-- ==============================================================================

REVOKE EXECUTE ON FUNCTION public.submit_survey(text, text, jsonb),
                           public.apply_survey_reward(uuid),
                           public.reject_survey_reward(uuid)
FROM anon;

REVOKE EXECUTE ON FUNCTION public.generate_survey_reward_code()
FROM anon, authenticated;

-- ==============================================================================
-- SQL DE REVERSIÓN (EJECUTAR EN CASO DE ROLLBACK)
-- ==============================================================================
/*
GRANT EXECUTE ON FUNCTION public.generate_survey_reward_code() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_survey(text, text, jsonb),
                          public.apply_survey_reward(uuid),
                          public.reject_survey_reward(uuid)
TO anon;
*/
