-- Migración: 20260929180000_fase2_eliminar_funciones_sin_uso.sql
-- Fase 2 Orden Técnico: D6.1
-- Elimina funciones obsoletas sin uso: degrade_expired_plans() e increment_store_egress(text, bigint).
-- Ninguna de estas funciones es llamada por la aplicación ni por triggers de la base.
-- El cálculo de vencimiento y plan efectivo se realiza dinámicamente en servidor y cliente.

BEGIN;

-- 1. Eliminar degrade_expired_plans
DROP FUNCTION IF EXISTS public.degrade_expired_plans();

-- 2. Eliminar increment_store_egress
DROP FUNCTION IF EXISTS public.increment_store_egress(text, bigint);

COMMIT;

/*
-- SQL PARA REVERTIR ESTA MIGRACIÓN:

CREATE OR REPLACE FUNCTION public.degrade_expired_plans()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_count INT;
BEGIN
  IF auth.role() != 'service_role' AND COALESCE((auth.jwt()->'app_metadata'->>'role'), '') != 'super_admin' THEN
    RAISE EXCEPTION 'No autorizado. Solo super administradores o service_role pueden ejecutar esta acción.';
  END IF;

  UPDATE stores
  SET
    plan                = 'semilla',
    subscription_status = 'expired'
  WHERE
    subscription_status = 'active'
    AND plan_expires_at IS NOT NULL
    AND plan_expires_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.degrade_expired_plans() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.degrade_expired_plans() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.degrade_expired_plans() TO service_role;

CREATE OR REPLACE FUNCTION public.increment_store_egress(p_store_id text, p_bytes bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  UPDATE public.stores
  SET egress_bytes = COALESCE(egress_bytes, 0) + p_bytes
  WHERE id = p_store_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.increment_store_egress(text, bigint) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_store_egress(text, bigint) FROM anon;
GRANT EXECUTE ON FUNCTION public.increment_store_egress(text, bigint) TO authenticated, service_role;
*/
