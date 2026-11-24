-- ==============================================================================
-- scripts/verify-f57-2-base.sql
-- Pruebas de base de datos F57.2 (Escenarios 9, 10 y 14)
-- IMPORTANTE: Para ejecutar en PASO 2 tras aplicar la migración 20261125120000_f57_2_coherencia.sql
-- Usa BEGIN ... ROLLBACK para no dejar ningún registro permanente ni tienda residual.
-- ==============================================================================

BEGIN;

DO $$
DECLARE
  v_test_user_id uuid := '00000000-0000-0000-0000-000000005702'::uuid;
  v_store_id text;
  v_plan text;
  v_expires_at timestamptz;
  v_sub_status text;
  v_token text;
  v_error_caught boolean;
  v_now timestamptz := now();
BEGIN
  RAISE NOTICE 'Iniciando pruebas de base F57.2 (Escenarios 9, 10, 14)...';

  -- Simular sesión de super_admin para cumplir auth.jwt() en initialize_store y activate_subscription
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', v_test_user_id::text,
      'role', 'authenticated',
      'app_metadata', json_build_object('role', 'super_admin')
    )::text,
    true
  );

  -- --------------------------------------------------------------------------
  -- Escenario 9: cancel_subscription
  -- --------------------------------------------------------------------------
  RAISE NOTICE '--- Probando Escenario 9: cancel_subscription ---';
  v_store_id := gen_random_uuid()::text;
  INSERT INTO public.stores (
    id, user_id, owner_id, slug, name, phone, country_code, country_iso,
    plan, subscription_status, plan_expires_at, active, is_published
  ) VALUES (
    v_store_id, v_test_user_id, v_test_user_id, 'zz-audit-f57-2-cancel', 'Audit F57.2 Cancel',
    '999999999', '51', 'PE', 'pro', 'active', v_now + interval '30 days', true, true
  );

  -- Ejecutar cancel_subscription
  PERFORM public.cancel_subscription(v_store_id::uuid);

  -- Verificar que el plan se mantiene (no degrada a semilla) y vence hace 3 días
  SELECT plan, plan_expires_at, subscription_status
    INTO v_plan, v_expires_at, v_sub_status
    FROM public.stores WHERE id = v_store_id;

  IF v_plan <> 'pro' THEN
    RAISE EXCEPTION 'Escenario 9 FALLÓ: plan esperado "pro", obtenido "%"', v_plan;
  END IF;

  IF v_expires_at > (v_now - interval '2 days 23 hours') OR v_expires_at < (v_now - interval '3 days 1 hour') THEN
    RAISE EXCEPTION 'Escenario 9 FALLÓ: plan_expires_at no está ~3 días en el pasado: %', v_expires_at;
  END IF;

  RAISE NOTICE 'Escenario 9 OK: plan=% (conservado), plan_expires_at=%', v_plan, v_expires_at;

  -- --------------------------------------------------------------------------
  -- Escenario 10: initialize_store (superadmin)
  -- --------------------------------------------------------------------------
  RAISE NOTICE '--- Probando Escenario 10: initialize_store (superadmin) ---';

  -- (a) Superadmin sin plan especificado -> pro / trial / +7 días (RF-57.2.8)
  v_store_id := gen_random_uuid()::text;
  PERFORM public.initialize_store(
    p_id := v_store_id,
    p_slug := 'zz-audit-f57-2-init-null',
    p_name := 'Audit F57.2 Init Null',
    p_phone := '988888888',
    p_country_code := '51',
    p_country_iso := 'PE',
    p_owner_id := v_test_user_id,
    p_category_id := gen_random_uuid()::text,
    p_model := 'minimalista',
    p_plan := NULL
  );

  SELECT plan, subscription_status, plan_expires_at
    INTO v_plan, v_sub_status, v_expires_at
    FROM public.stores WHERE id = v_store_id;

  IF v_plan <> 'pro' THEN
    RAISE EXCEPTION 'Escenario 10.a FALLÓ: plan esperado "pro", obtenido "%"', v_plan;
  END IF;
  IF v_sub_status <> 'trial' THEN
    RAISE EXCEPTION 'Escenario 10.a FALLÓ: subscription_status esperado "trial", obtenido "%"', v_sub_status;
  END IF;
  IF v_expires_at < (v_now + interval '6 days 23 hours') OR v_expires_at > (v_now + interval '7 days 1 hour') THEN
    RAISE EXCEPTION 'Escenario 10.a FALLÓ: plan_expires_at no tiene ~7 días de prueba: %', v_expires_at;
  END IF;
  RAISE NOTICE 'Escenario 10.a OK: super sin plan -> pro/trial/+7d';

  -- (b) Superadmin con 'ilimitado' -> sin vencimiento, exactamente como hoy en producción
  v_store_id := gen_random_uuid()::text;
  PERFORM public.initialize_store(
    p_id := v_store_id,
    p_slug := 'zz-audit-f57-2-init-ilimitado',
    p_name := 'Audit F57.2 Init Ilimitado',
    p_phone := '988888888',
    p_country_code := '51',
    p_country_iso := 'PE',
    p_owner_id := v_test_user_id,
    p_category_id := gen_random_uuid()::text,
    p_model := 'minimalista',
    p_plan := 'ilimitado'
  );

  SELECT plan, subscription_status, plan_expires_at
    INTO v_plan, v_sub_status, v_expires_at
    FROM public.stores WHERE id = v_store_id;

  IF v_plan <> 'ilimitado' THEN
    RAISE EXCEPTION 'Escenario 10.b FALLÓ: plan esperado "ilimitado", obtenido "%"', v_plan;
  END IF;
  IF v_sub_status IS NOT NULL THEN
    RAISE EXCEPTION 'Escenario 10.b FALLÓ: subscription_status debió ser NULL, obtenido "%"', v_sub_status;
  END IF;
  IF v_expires_at IS NOT NULL THEN
    RAISE EXCEPTION 'Escenario 10.b FALLÓ: plan_expires_at debió ser NULL, obtenido "%"', v_expires_at;
  END IF;
  RAISE NOTICE 'Escenario 10.b OK: super con ilimitado -> sin vencimiento (igual que hoy)';

  -- (c) Superadmin con 'semilla' y semilla_fin pasado (dentro de la transacción) -> error
  INSERT INTO public.app_config (key, value)
    VALUES ('semilla_fin', '"2026-01-01"')
    ON CONFLICT (key) DO UPDATE SET value = '"2026-01-01"';

  v_error_caught := false;
  BEGIN
    PERFORM public.initialize_store(
      p_id := gen_random_uuid()::text,
      p_slug := 'zz-audit-f57-2-init-semilla-err',
      p_name := 'Audit F57.2 Init Semilla Err',
      p_phone := '988888888',
      p_country_code := '51',
      p_country_iso := 'PE',
      p_owner_id := v_test_user_id,
      p_category_id := gen_random_uuid()::text,
      p_model := 'minimalista',
      p_plan := 'semilla'
    );
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
    RAISE NOTICE 'Capturado error esperado en initialize_store con semilla_fin pasado: %', SQLERRM;
  END;

  IF NOT v_error_caught THEN
    RAISE EXCEPTION 'Escenario 10.c FALLÓ: initialize_store con semilla y semilla_fin pasado debió lanzar error.';
  END IF;
  RAISE NOTICE 'Escenario 10.c OK: super con semilla y semilla_fin pasado lanza error.';

  -- --------------------------------------------------------------------------
  -- Escenario 14: activate_subscription y activate_subscription_with_invite con semilla
  -- --------------------------------------------------------------------------
  RAISE NOTICE '--- Probando Escenario 14: activate_subscription y semilla_fin ---';

  -- A. Con semilla_fin en el pasado
  -- A.1 Probar activate_subscription con semilla y fecha pasada -> debe fallar
  v_error_caught := false;
  BEGIN
    PERFORM public.activate_subscription(
      p_store_id := v_store_id,
      p_plan := 'semilla',
      p_duration_months := 1
    );
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
    RAISE NOTICE 'Capturado error esperado en activate_subscription: %', SQLERRM;
  END;
  IF NOT v_error_caught THEN
    RAISE EXCEPTION 'Escenario 14.A.1 FALLÓ: activate_subscription con semilla_fin pasado debió lanzar error.';
  END IF;

  -- A.2 Probar activate_subscription_with_invite con token semilla y fecha pasada -> debe fallar
  v_token := 'zz-audit-token-' || substr(md5(random()::text), 1, 8);
  INSERT INTO public.invitation_links (
    token, plan, days_granted, max_uses, uses_count, is_active, created_by
  ) VALUES (
    v_token, 'semilla', 30, 5, 0, true, v_test_user_id
  );

  v_error_caught := false;
  BEGIN
    PERFORM public.activate_subscription_with_invite(v_token, v_store_id::uuid);
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
    RAISE NOTICE 'Capturado error esperado en activate_subscription_with_invite: %', SQLERRM;
  END;
  IF NOT v_error_caught THEN
    RAISE EXCEPTION 'Escenario 14.A.2 FALLÓ: activate_subscription_with_invite con semilla_fin pasado debió lanzar error.';
  END IF;

  -- B. Con semilla_fin en el futuro (ej. 2026-12-25)
  INSERT INTO public.app_config (key, value)
    VALUES ('semilla_fin', '"2026-12-25"')
    ON CONFLICT (key) DO UPDATE SET value = '"2026-12-25"';

  -- B.1 Probar activate_subscription con semilla_fin futuro -> debe funcionar
  PERFORM public.activate_subscription(
    p_store_id := v_store_id,
    p_plan := 'semilla',
    p_duration_months := 1
  );
  SELECT plan INTO v_plan FROM public.stores WHERE id = v_store_id;
  IF v_plan <> 'semilla' THEN
    RAISE EXCEPTION 'Escenario 14.B.1 FALLÓ: plan esperado "semilla", obtenido "%"', v_plan;
  END IF;
  RAISE NOTICE 'Escenario 14.B.1 OK: activate_subscription funcionó con semilla_fin futuro.';

  -- B.2 Probar activate_subscription_with_invite con semilla_fin futuro -> debe funcionar
  PERFORM public.activate_subscription_with_invite(v_token, v_store_id::uuid);
  SELECT plan INTO v_plan FROM public.stores WHERE id = v_store_id;
  IF v_plan <> 'semilla' THEN
    RAISE EXCEPTION 'Escenario 14.B.2 FALLÓ: plan esperado "semilla", obtenido "%"', v_plan;
  END IF;
  RAISE NOTICE 'Escenario 14.B.2 OK: activate_subscription_with_invite funcionó con semilla_fin futuro.';

  RAISE NOTICE 'TODOS LOS ESCENARIOS DE BASE (9, 10, 14) COMPLETADOS CON ÉXITO.';
END $$;

ROLLBACK;
