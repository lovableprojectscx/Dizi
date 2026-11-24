-- ==============================================================================
-- Migración: F57.1 - Aviso en el panel y grupo único de transición (semilla_sunset_targets)
-- Archivo: supabase/migrations/20261124120000_f57_1_sunset_targets.sql
-- Fecha: 2026-11-24
--
-- NOTA: Preparada SOLO como archivo en Paso 1 (NO APLICAR HASTA OK DE CLAUDE Y JACK).
--
-- Cambios:
--   1. Nueva función public.semilla_sunset_targets(p_s date) RETURNS SETOF text
--      - STABLE, SECURITY DEFINER, SET search_path = public, pg_temp.
--      - Devuelve los IDs de las tiendas que pasan a prueba Pro el día S:
--        plan = 'semilla' O (plan <> 'semilla' y venció + 3 días antes del inicio
--        del día S en hora Lima), excluyendo *-demo, zz-* e ilimitado sin vencimiento.
--      - EXECUTE restringido exclusivamente a postgres y service_role.
--   2. Recreación de public.apply_semilla_sunset() partiendo de pg_get_functiondef
--      de producción (2026-11-23), delegando la selección a semilla_sunset_targets(v_semilla_fin)
--      sin depender de pausa_desde.
--      - Conserva REVOKE EXECUTE a PUBLIC, anon y authenticated; GRANT a service_role.
--   3. Script de reversión comentado al final (restaura primero apply_semilla_sunset
--      a la definición exacta de producción y luego elimina semilla_sunset_targets).
-- ==============================================================================

-- 1. Función de selección única del grupo de transición el día S
CREATE OR REPLACE FUNCTION public.semilla_sunset_targets(p_s date)
RETURNS SETOF text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT s.id
  FROM public.stores s
  WHERE p_s IS NOT NULL
    AND (
      s.plan = 'semilla'
      OR (
        s.plan <> 'semilla'
        AND s.plan_expires_at IS NOT NULL
        AND (s.plan_expires_at + interval '3 days') < (p_s::timestamp AT TIME ZONE 'America/Lima')
      )
    )
    AND s.slug NOT LIKE '%-demo'
    AND s.slug NOT LIKE 'zz-%'
    AND NOT (s.plan = 'ilimitado' AND s.plan_expires_at IS NULL)
  ORDER BY s.id;
$function$;

COMMENT ON FUNCTION public.semilla_sunset_targets(date) IS
  'F57.1: Devuelve los IDs de tiendas en plan gratis efectivo al inicio del día S en Lima (Semilla o plan pagado vencido + 3 días antes de S), excluyendo *-demo, zz-* e ilimitado sin vencimiento.';

REVOKE EXECUTE ON FUNCTION public.semilla_sunset_targets(date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.semilla_sunset_targets(date) TO service_role;

-- 2. Función public.apply_semilla_sunset() usando public.semilla_sunset_targets(v_semilla_fin)
-- Basada en pg_get_functiondef de producción (2026-11-23), eliminando la dependencia de pausa_desde.
CREATE OR REPLACE FUNCTION public.apply_semilla_sunset()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_semilla_fin date := NULL;
  v_today_lima date;
  v_raw_val jsonb;
  v_migrated_ids text[] := '{}';
  v_migrated_count integer := 0;
  v_new_expiry timestamptz;
BEGIN
  -- 1. Leer semilla_fin desde public.app_config
  BEGIN
    SELECT value INTO v_raw_val FROM public.app_config WHERE key = 'semilla_fin';
    IF v_raw_val IS NOT NULL AND jsonb_typeof(v_raw_val) != 'null' THEN
      BEGIN
        v_semilla_fin := (v_raw_val #>> '{}')::date;
      EXCEPTION WHEN OTHERS THEN
        v_semilla_fin := NULL;
      END;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_semilla_fin := NULL;
  END;

  -- 2. Si semilla_fin es NULL, no hacer nada (idempotente y seguro)
  IF v_semilla_fin IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'semilla_fin_is_null',
      'migrated_count', 0
    );
  END IF;

  -- 3. Si la fecha actual en Lima es anterior a semilla_fin, no hacer nada
  v_today_lima := (now() AT TIME ZONE 'America/Lima')::date;
  IF v_today_lima < v_semilla_fin THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'semilla_fin_not_reached',
      'today_lima', v_today_lima,
      'semilla_fin', v_semilla_fin,
      'migrated_count', 0
    );
  END IF;

  -- 4. Nueva fecha de vencimiento: exactamente 7 días desde la ejecución (now() + 7 días)
  v_new_expiry := now() + interval '7 days';

  -- 5. Migrar el grupo único definido por public.semilla_sunset_targets(v_semilla_fin)
  WITH targets AS (
    SELECT target_id AS id
    FROM public.semilla_sunset_targets(v_semilla_fin) AS target_id
  ),
  updated AS (
    UPDATE public.stores s
    SET
      plan = 'pro',
      subscription_status = 'trial',
      plan_expires_at = v_new_expiry,
      updated_at = now()
    FROM targets t
    WHERE s.id = t.id
    RETURNING s.id
  )
  SELECT array_agg(id), count(*) INTO v_migrated_ids, v_migrated_count FROM updated;

  RETURN jsonb_build_object(
    'success', true,
    'migrated_count', COALESCE(v_migrated_count, 0),
    'migrated_ids', COALESCE(v_migrated_ids, '{}'::text[]),
    'new_plan', 'pro',
    'new_status', 'trial',
    'plan_expires_at', v_new_expiry
  );
END;
$function$;

COMMENT ON FUNCTION public.apply_semilla_sunset() IS
  'F57.1: Convierte las tiendas de semilla_sunset_targets(semilla_fin) a prueba Pro de 7 días. Idempotente y sin bucle posterior. Solo actúa si semilla_fin ya llegó en hora Lima.';

REVOKE EXECUTE ON FUNCTION public.apply_semilla_sunset() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_semilla_sunset() TO service_role;

-- ==============================================================================
-- SCRIPT DE REVERSIÓN (EN ORDEN: 1º RESTAURAR apply_semilla_sunset, 2º BORRAR semilla_sunset_targets)
-- ==============================================================================
/*
-- 1. Restaurar public.apply_semilla_sunset() a la definición exacta de producción previa a F57.1
CREATE OR REPLACE FUNCTION public.apply_semilla_sunset()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_semilla_fin date := NULL;
  v_pausa_desde timestamptz := NULL;
  v_today_lima date;
  v_raw_val jsonb;
  v_migrated_ids text[] := '{}';
  v_migrated_count integer := 0;
  v_new_expiry timestamptz;
BEGIN
  -- 1. Leer semilla_fin y pausa_desde desde public.app_config
  BEGIN
    SELECT value INTO v_raw_val FROM public.app_config WHERE key = 'semilla_fin';
    IF v_raw_val IS NOT NULL AND jsonb_typeof(v_raw_val) != 'null' THEN
      BEGIN
        v_semilla_fin := (v_raw_val #>> '{}')::date;
      EXCEPTION WHEN OTHERS THEN
        v_semilla_fin := NULL;
      END;
    END IF;

    SELECT value INTO v_raw_val FROM public.app_config WHERE key = 'pausa_desde';
    IF v_raw_val IS NOT NULL AND jsonb_typeof(v_raw_val) != 'null' THEN
      BEGIN
        v_pausa_desde := (v_raw_val #>> '{}')::timestamptz;
      EXCEPTION WHEN OTHERS THEN
        v_pausa_desde := NULL;
      END;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_semilla_fin := NULL;
    v_pausa_desde := NULL;
  END;

  -- 2. Si semilla_fin es NULL, no hacer nada (idempotente y seguro)
  IF v_semilla_fin IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'semilla_fin_is_null',
      'migrated_count', 0
    );
  END IF;

  -- 3. Si la fecha actual en Lima es anterior a semilla_fin, no hacer nada
  v_today_lima := (now() AT TIME ZONE 'America/Lima')::date;
  IF v_today_lima < v_semilla_fin THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'semilla_fin_not_reached',
      'today_lima', v_today_lima,
      'semilla_fin', v_semilla_fin,
      'migrated_count', 0
    );
  END IF;

  -- 4. Nueva fecha de vencimiento: exactamente 7 días desde la ejecución (now() + 7 días)
  v_new_expiry := now() + interval '7 days';

  -- 5. Migrar tiendas Semilla y tiendas pagadas vencidas antes de pausa_desde
  WITH targets AS (
    SELECT id FROM public.stores
    WHERE (
      plan = 'semilla'
      OR (plan <> 'semilla' AND v_pausa_desde IS NOT NULL AND (plan_expires_at + interval '3 days') < v_pausa_desde)
    )
    AND slug NOT LIKE '%-demo'
    AND slug NOT LIKE 'zz-%'
    AND NOT (plan = 'ilimitado' AND plan_expires_at IS NULL)
  ),
  updated AS (
    UPDATE public.stores s
    SET
      plan = 'pro',
      subscription_status = 'trial',
      plan_expires_at = v_new_expiry,
      updated_at = now()
    FROM targets t
    WHERE s.id = t.id
    RETURNING s.id
  )
  SELECT array_agg(id), count(*) INTO v_migrated_ids, v_migrated_count FROM updated;

  RETURN jsonb_build_object(
    'success', true,
    'migrated_count', COALESCE(v_migrated_count, 0),
    'migrated_ids', COALESCE(v_migrated_ids, '{}'::text[]),
    'new_plan', 'pro',
    'new_status', 'trial',
    'plan_expires_at', v_new_expiry
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.apply_semilla_sunset() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_semilla_sunset() TO service_role;

-- 2. Eliminar la función nueva de F57.1
DROP FUNCTION IF EXISTS public.semilla_sunset_targets(date);
*/
