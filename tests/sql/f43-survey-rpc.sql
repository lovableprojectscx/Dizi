-- ==============================================================================
-- PRUEBAS DE INTEGRACIÓN SQL: F43 - Encuesta de Calidad (RPC y RLS)
-- Archivo: tests/sql/f43-survey-rpc.sql
-- Ejecución: Dentro de una transacción atómica BEGIN ... ROLLBACK en Supabase
-- Sin claves ni credenciales sensibles.
--
-- Escenarios cubiertos:
--   E8: Rechazo de envío por usuario ajeno (error 42501).
--   E8b: Rechazo de envío cuando store.owner_id es NULL (error 42501 via IS DISTINCT FROM).
--   E3b: Rechazo de envío con versión de encuesta no admitida (error 22023).
--   E7: Envío exitoso por dueño, generación de código DZ-XXXXXX e idempotencia (1 sola fila).
--   E9: Super admin aplica premio a tienda Semilla: 4 campos exactos de setTrialPlan (emprendedor, trial, 15d, 0m).
--   E10: Super admin aplica premio a tienda Pro: conserva plan pro y extiende vigencia 15 días adicionales.
--   E11: Super admin intenta re-aplicar premio ya aplicado: rechazo (error 22023).
--   E11b: Super admin rechaza premio pendiente y luego intenta aplicarlo: rechazo (error 22023).
--   E12: Usuario regular intenta invocar apply_survey_reward: rechazo de autorización (error 42501).
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. DDL DE LA MIGRACIÓN F43 (Commit 27f1df9)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id text NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  survey_version text NOT NULL,
  plan_at_response text NOT NULL,
  answers jsonb NOT NULL,
  reward_code text NOT NULL UNIQUE,
  reward_status text NOT NULL DEFAULT 'pendiente' CHECK (reward_status IN ('pendiente', 'aplicado', 'rechazado')),
  reward_applied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_survey_responses_store_version UNIQUE (store_id, survey_version)
);

CREATE INDEX IF NOT EXISTS idx_survey_responses_store_version
  ON public.survey_responses(store_id, survey_version);

CREATE INDEX IF NOT EXISTS idx_survey_responses_reward_status
  ON public.survey_responses(reward_status);

CREATE INDEX IF NOT EXISTS idx_survey_responses_reward_code
  ON public.survey_responses(reward_code);

ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "survey_responses_owner_select" ON public.survey_responses
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = survey_responses.store_id
      AND stores.owner_id = (SELECT auth.uid())
  )
);

CREATE POLICY "survey_responses_superadmin_select" ON public.survey_responses
FOR SELECT TO authenticated
USING (
  COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text
);

CREATE OR REPLACE FUNCTION public.generate_survey_reward_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  res text := 'DZ-';
  i integer;
  code_exists boolean;
BEGIN
  LOOP
    res := 'DZ-';
    FOR i IN 1..6 LOOP
      res := res || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM public.survey_responses WHERE reward_code = res) INTO code_exists;
    IF NOT code_exists THEN
      RETURN res;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_survey(
  p_store_id text,
  p_version text,
  p_answers jsonb
)
RETURNS public.survey_responses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_store public.stores%ROWTYPE;
  v_is_super boolean;
  v_effective_plan text;
  v_reward_code text;
  v_result public.survey_responses%ROWTYPE;
  v_key text;
  v_val jsonb;
BEGIN
  -- 1. Validar autenticación
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado.' USING ERRCODE = '42501';
  END IF;

  v_is_super := (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text);

  -- 1b. Validar versión de encuesta admitida (F43 v1: 2026-11)
  IF p_version IS DISTINCT FROM '2026-11' THEN
    RAISE EXCEPTION 'Versión de encuesta no válida.' USING ERRCODE = '22023';
  END IF;

  -- 2. Validar que la tienda exista
  SELECT * INTO v_store FROM public.stores WHERE id = p_store_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tienda no encontrada.' USING ERRCODE = '02000';
  END IF;

  -- 3. Validar permisos: solo el dueño de la tienda o super_admin (maneja owner_id NULL con IS DISTINCT FROM)
  IF (v_store.owner_id IS DISTINCT FROM auth.uid()) AND NOT v_is_super THEN
    RAISE EXCEPTION 'No autorizado. Solo el dueño de la tienda puede enviar la encuesta.' USING ERRCODE = '42501';
  END IF;

  -- 4. Si ya existe respuesta para esta tienda y versión, devolverla (idempotencia)
  SELECT * INTO v_result
  FROM public.survey_responses
  WHERE store_id = p_store_id AND survey_version = p_version;

  IF FOUND THEN
    RETURN v_result;
  END IF;

  -- 5. Validar fecha de cierre (America/Lima: 2026-11-30 23:59:59-05)
  IF now() > '2026-11-30 23:59:59-05'::timestamptz THEN
    RAISE EXCEPTION 'La encuesta ha finalizado.' USING ERRCODE = '22023';
  END IF;

  -- 6. Validar tiendas demo o ilimitado (quedan fuera)
  IF v_store.plan = 'ilimitado' OR v_store.slug LIKE '%-demo' THEN
    RAISE EXCEPTION 'Las tiendas demo o con plan ilimitado no participan en la encuesta.' USING ERRCODE = '22023';
  END IF;

  -- 7. Calcular plan efectivo al momento de responder
  -- Regla: Si está en trial (no pagado), o es semilla, o superó 3 días de gracia -> 'semilla'
  IF v_store.plan = 'semilla' OR v_store.subscription_status = 'trial' THEN
    v_effective_plan := 'semilla';
  ELSIF v_store.plan_expires_at IS NOT NULL AND v_store.plan_expires_at < (now() - interval '3 days') THEN
    v_effective_plan := 'semilla';
  ELSE
    v_effective_plan := v_store.plan;
  END IF;

  -- 8. Validar respuestas (jsonb object, claves obligatorias q1..q7, longitud <= 300)
  IF p_answers IS NULL OR jsonb_typeof(p_answers) != 'object' THEN
    RAISE EXCEPTION 'El formato de respuestas debe ser un objeto JSON.' USING ERRCODE = '22023';
  END IF;

  -- Claves obligatorias para todos: q1, q2, q3, q4, q5, q6, q7
  IF NOT (p_answers ? 'q1' AND p_answers ? 'q2' AND p_answers ? 'q3' AND
          p_answers ? 'q4' AND p_answers ? 'q5' AND p_answers ? 'q6' AND p_answers ? 'q7') THEN
    RAISE EXCEPTION 'Faltan preguntas obligatorias por responder.' USING ERRCODE = '22023';
  END IF;

  -- Validar que ningún valor supere 300 caracteres
  FOR v_key, v_val IN SELECT * FROM jsonb_each(p_answers) LOOP
    IF jsonb_typeof(v_val) = 'string' AND length(v_val #>> '{}') > 300 THEN
      RAISE EXCEPTION 'La respuesta a la pregunta % supera los 300 caracteres permitidos.', v_key USING ERRCODE = '22023';
    END IF;
  END LOOP;

  -- 9. Generar código de premio
  v_reward_code := public.generate_survey_reward_code();

  -- 10. Insertar y retornar
  INSERT INTO public.survey_responses (
    store_id,
    survey_version,
    plan_at_response,
    answers,
    reward_code,
    reward_status
  ) VALUES (
    p_store_id,
    p_version,
    v_effective_plan,
    p_answers,
    v_reward_code,
    'pendiente'
  )
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_survey_reward(
  p_response_id uuid
)
RETURNS public.survey_responses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_super boolean;
  v_resp public.survey_responses%ROWTYPE;
  v_store public.stores%ROWTYPE;
BEGIN
  -- 1. Verificar autorización: solo super_admin o service_role
  v_is_super := (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text);
  IF auth.role() != 'service_role' AND NOT v_is_super THEN
    RAISE EXCEPTION 'No autorizado. Solo un super administrador puede aplicar premios de encuestas.' USING ERRCODE = '42501';
  END IF;

  -- 2. Bloquear y leer la fila de survey_responses
  SELECT * INTO v_resp
  FROM public.survey_responses
  WHERE id = p_response_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Respuesta de encuesta no encontrada.' USING ERRCODE = '02000';
  END IF;

  -- 3. Verificar estado pendiente
  IF v_resp.reward_status != 'pendiente' THEN
    RAISE EXCEPTION 'El premio ya fue procesado (%): no se puede volver a aplicar.', v_resp.reward_status USING ERRCODE = '22023';
  END IF;

  -- 4. Bloquear y leer la tienda
  SELECT * INTO v_store
  FROM public.stores
  WHERE id = v_resp.store_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tienda asociada no encontrada.' USING ERRCODE = '02000';
  END IF;

  -- 5. Aplicar recompensa según el plan al responder (RF-43.8 y Corrección 5 de Jack)
  -- Para Semilla: mismos 4 campos que setTrialPlan (store.ts:1013)
  IF v_resp.plan_at_response = 'semilla' THEN
    UPDATE public.stores
    SET
      plan = 'emprendedor',
      plan_expires_at = now() + interval '15 days',
      subscription_status = 'trial',
      plan_duration_months = 0
    WHERE id = v_resp.store_id;
  ELSE
    -- Para Emprendedor o Pro: extiende 15 días el plan actual sin cambiar de plan
    UPDATE public.stores
    SET
      plan_expires_at = GREATEST(COALESCE(plan_expires_at, now()), now()) + interval '15 days'
    WHERE id = v_resp.store_id;
  END IF;

  -- 6. Actualizar survey_responses a aplicado con fecha
  UPDATE public.survey_responses
  SET
    reward_status = 'aplicado',
    reward_applied_at = now()
  WHERE id = p_response_id
  RETURNING * INTO v_resp;

  RETURN v_resp;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_survey_reward(
  p_response_id uuid
)
RETURNS public.survey_responses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_super boolean;
  v_resp public.survey_responses%ROWTYPE;
BEGIN
  -- 1. Verificar autorización: solo super_admin o service_role
  v_is_super := (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text);
  IF auth.role() != 'service_role' AND NOT v_is_super THEN
    RAISE EXCEPTION 'No autorizado. Solo un super administrador puede rechazar premios de encuestas.' USING ERRCODE = '42501';
  END IF;

  -- 2. Bloquear y leer la fila
  SELECT * INTO v_resp
  FROM public.survey_responses
  WHERE id = p_response_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Respuesta de encuesta no encontrada.' USING ERRCODE = '02000';
  END IF;

  -- 3. Verificar estado pendiente
  IF v_resp.reward_status != 'pendiente' THEN
    RAISE EXCEPTION 'El premio ya fue procesado (%): no se puede volver a rechazar.', v_resp.reward_status USING ERRCODE = '22023';
  END IF;

  -- 4. Actualizar a rechazado
  UPDATE public.survey_responses
  SET reward_status = 'rechazado'
  WHERE id = p_response_id
  RETURNING * INTO v_resp;

  RETURN v_resp;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_survey_reward_code() FROM PUBLIC;

REVOKE ALL ON FUNCTION public.submit_survey(text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_survey(text, text, jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.apply_survey_reward(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_survey_reward(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.reject_survey_reward(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reject_survey_reward(uuid) TO authenticated;

-- ------------------------------------------------------------------------------
-- 2. SEMBRAR TIENDAS ZZ-AUDIT Y REGISTRO DE PRUEBAS
-- ------------------------------------------------------------------------------

CREATE TEMP TABLE test_log (
  scenario text,
  status text,
  detail text
);

INSERT INTO public.stores (
  id, slug, name, phone, country_code, plan, owner_id, active, is_published, subscription_status
) VALUES (
  'zz-audit-f43-store-semilla', 'zz-audit-f43-store-semilla', 'Tienda Semilla Test', '999111001', '51',
  'semilla', '11111111-1111-1111-1111-111111111111'::uuid, true, true, 'trial'
);

INSERT INTO public.stores (
  id, slug, name, phone, country_code, plan, owner_id, active, is_published, subscription_status, plan_expires_at
) VALUES (
  'zz-audit-f43-store-pro', 'zz-audit-f43-store-pro', 'Tienda Pro Test', '999111002', '51',
  'pro', '22222222-2222-2222-2222-222222222222'::uuid, true, true, 'active', now() + interval '30 days'
);

INSERT INTO public.stores (
  id, slug, name, phone, country_code, plan, owner_id, active, is_published, subscription_status
) VALUES (
  'zz-audit-f43-store-nullowner', 'zz-audit-f43-store-nullowner', 'Tienda Null Owner Test', '999111003', '51',
  'semilla', NULL, true, true, 'trial'
);

-- ------------------------------------------------------------------------------
-- 3. EJECUTAR PRUEBAS ESCENARIO POR ESCENARIO
-- ------------------------------------------------------------------------------

DO $$
DECLARE
  v_resp public.survey_responses%ROWTYPE;
  v_resp2 public.survey_responses%ROWTYPE;
  v_resp_pro public.survey_responses%ROWTYPE;
  v_resp_rej public.survey_responses%ROWTYPE;
  v_st public.stores%ROWTYPE;
  v_answers_semilla jsonb := '{"q1":"TikTok","q2":"algunos","q3":"10","q4":"vender por WhatsApp","q5":"tiempo","q6":"mejor soporte","q7":"S/ 20"}'::jsonb;
  v_answers_pro jsonb := '{"q1":"Facebook","q2":"casi todos mis pedidos","q3":"9","q4":"sí","q5":["cintillo","más productos"],"q6":"sí","q7":"sí"}'::jsonb;
BEGIN
  -- ----------------------------------------------------------------------------
  -- E8: Ajena no (Intruso intenta enviar respuesta en tienda ajena)
  -- ----------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', '33333333-3333-3333-3333-333333333333',
    'role', 'authenticated',
    'app_metadata', json_build_object('role', 'authenticated')
  )::text, true);

  BEGIN
    PERFORM public.submit_survey('zz-audit-f43-store-semilla', '2026-11', v_answers_semilla);
    INSERT INTO test_log VALUES ('E8', 'FALLO', 'No rechazó llamada de usuario ajeno');
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE = '42501' THEN
      INSERT INTO test_log VALUES ('E8', 'PASO', 'Rechazado con 42501: ' || SQLERRM);
    ELSE
      INSERT INTO test_log VALUES ('E8', 'FALLO', 'Error inesperado: ' || SQLSTATE || ' ' || SQLERRM);
    END IF;
  END;

  -- ----------------------------------------------------------------------------
  -- E8b: Tienda con owner_id NULL rechaza usuario regular (IS DISTINCT FROM)
  -- ----------------------------------------------------------------------------
  BEGIN
    PERFORM public.submit_survey('zz-audit-f43-store-nullowner', '2026-11', v_answers_semilla);
    INSERT INTO test_log VALUES ('E8b (owner NULL)', 'FALLO', 'No rechazó usuario en tienda con owner_id NULL');
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE = '42501' THEN
      INSERT INTO test_log VALUES ('E8b (owner NULL)', 'PASO', 'Rechazado con 42501: ' || SQLERRM);
    ELSE
      INSERT INTO test_log VALUES ('E8b (owner NULL)', 'FALLO', 'Error inesperado: ' || SQLSTATE || ' ' || SQLERRM);
    END IF;
  END;

  -- ----------------------------------------------------------------------------
  -- E3b: Versión inválida rechaza llamada (p_version IS DISTINCT FROM '2026-11')
  -- ----------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', '11111111-1111-1111-1111-111111111111',
    'role', 'authenticated',
    'app_metadata', json_build_object('role', 'authenticated')
  )::text, true);

  BEGIN
    PERFORM public.submit_survey('zz-audit-f43-store-semilla', '2025-01', v_answers_semilla);
    INSERT INTO test_log VALUES ('E3b (version invalida)', 'FALLO', 'No rechazó versión 2025-01');
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%Versión de encuesta no válida%' THEN
      INSERT INTO test_log VALUES ('E3b (version invalida)', 'PASO', 'Rechazado correctamente: ' || SQLERRM);
    ELSE
      INSERT INTO test_log VALUES ('E3b (version invalida)', 'FALLO', 'Error inesperado: ' || SQLERRM);
    END IF;
  END;

  -- ----------------------------------------------------------------------------
  -- E7: Una sola vez e Idempotencia (submit_survey devuelve fila existente)
  -- ----------------------------------------------------------------------------
  v_resp := public.submit_survey('zz-audit-f43-store-semilla', '2026-11', v_answers_semilla);
  v_resp2 := public.submit_survey('zz-audit-f43-store-semilla', '2026-11', v_answers_semilla);

  IF v_resp.reward_code IS NOT NULL
     AND v_resp.reward_code LIKE 'DZ-%'
     AND v_resp.reward_code = v_resp2.reward_code
     AND (SELECT count(*) FROM public.survey_responses WHERE store_id = 'zz-audit-f43-store-semilla') = 1 THEN
    INSERT INTO test_log VALUES ('E7 (Una sola vez)', 'PASO', 'Código generado: ' || v_resp.reward_code || ' (idempotente sin duplicar fila)');
  ELSE
    INSERT INTO test_log VALUES ('E7 (Una sola vez)', 'FALLO', 'Códigos no coinciden o duplicó fila');
  END IF;

  -- ----------------------------------------------------------------------------
  -- E9: Premio Semilla (Super Admin aplica premio: 4 campos de setTrialPlan)
  -- ----------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', '99999999-9999-9999-9999-999999999999',
    'role', 'authenticated',
    'app_metadata', json_build_object('role', 'super_admin')
  )::text, true);

  v_resp := public.apply_survey_reward(v_resp.id);

  SELECT * INTO v_st FROM public.stores WHERE id = 'zz-audit-f43-store-semilla';

  IF v_resp.reward_status = 'aplicado'
     AND v_resp.reward_applied_at IS NOT NULL
     AND v_st.plan = 'emprendedor'
     AND v_st.subscription_status = 'trial'
     AND v_st.plan_duration_months = 0
     AND v_st.plan_expires_at > (now() + interval '14 days') THEN
    INSERT INTO test_log VALUES ('E9 (Premio Semilla)', 'PASO', 'Tienda Semilla quedó en emprendedor trial por 15 días con los 4 campos exactos');
  ELSE
    INSERT INTO test_log VALUES ('E9 (Premio Semilla)', 'FALLO', 'Campos de la tienda no coinciden con setTrialPlan');
  END IF;

  -- ----------------------------------------------------------------------------
  -- E10: Premio de pago (Super Admin aplica premio: extiende 15 días a Pro)
  -- ----------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', '22222222-2222-2222-2222-222222222222',
    'role', 'authenticated',
    'app_metadata', json_build_object('role', 'authenticated')
  )::text, true);

  v_resp_pro := public.submit_survey('zz-audit-f43-store-pro', '2026-11', v_answers_pro);

  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', '99999999-9999-9999-9999-999999999999',
    'role', 'authenticated',
    'app_metadata', json_build_object('role', 'super_admin')
  )::text, true);

  v_resp_pro := public.apply_survey_reward(v_resp_pro.id);
  SELECT * INTO v_st FROM public.stores WHERE id = 'zz-audit-f43-store-pro';

  -- El vencimiento original era hoy + 30 días, con +15 días debe ser > hoy + 44 días
  IF v_resp_pro.reward_status = 'aplicado'
     AND v_st.plan = 'pro'
     AND v_st.plan_expires_at > (now() + interval '44 days') THEN
    INSERT INTO test_log VALUES ('E10 (Premio Pago)', 'PASO', 'Tienda Pro mantiene plan pro y vigencia extendida 15 días');
  ELSE
    INSERT INTO test_log VALUES ('E10 (Premio Pago)', 'FALLO', 'No extendió 15 días la vigencia de Pro');
  END IF;

  -- ----------------------------------------------------------------------------
  -- E11: Sin doble premio (rechaza re-aplicar premio ya aplicado)
  -- ----------------------------------------------------------------------------
  BEGIN
    PERFORM public.apply_survey_reward(v_resp.id);
    INSERT INTO test_log VALUES ('E11 (Sin doble premio)', 'FALLO', 'Permitió re-aplicar premio');
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%no se puede volver a aplicar%' THEN
      INSERT INTO test_log VALUES ('E11 (Sin doble premio)', 'PASO', 'Rechazado correctamente: ' || SQLERRM);
    ELSE
      INSERT INTO test_log VALUES ('E11 (Sin doble premio)', 'FALLO', 'Error inesperado: ' || SQLERRM);
    END IF;
  END;

  -- ----------------------------------------------------------------------------
  -- E11b: Rechazado no aplica (rechazar respuesta pendiente y verificar bloqueo)
  -- ----------------------------------------------------------------------------
  INSERT INTO public.survey_responses (
    store_id, survey_version, plan_at_response, answers, reward_code, reward_status
  ) VALUES (
    'zz-audit-f43-store-nullowner', '2026-11', 'semilla', v_answers_semilla, 'DZ-REJ001', 'pendiente'
  ) RETURNING * INTO v_resp_rej;

  v_resp_rej := public.reject_survey_reward(v_resp_rej.id);

  BEGIN
    PERFORM public.apply_survey_reward(v_resp_rej.id);
    INSERT INTO test_log VALUES ('E11b (Rechazado no aplica)', 'FALLO', 'Permitió aplicar premio rechazado');
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%no se puede volver a aplicar%' THEN
      INSERT INTO test_log VALUES ('E11b (Rechazado no aplica)', 'PASO', 'Rechazado correctamente: ' || SQLERRM);
    ELSE
      INSERT INTO test_log VALUES ('E11b (Rechazado no aplica)', 'FALLO', 'Error inesperado: ' || SQLERRM);
    END IF;
  END;

  -- ----------------------------------------------------------------------------
  -- E12: Solo super admin puede aplicar o rechazar
  -- ----------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', '11111111-1111-1111-1111-111111111111',
    'role', 'authenticated',
    'app_metadata', json_build_object('role', 'authenticated')
  )::text, true);

  BEGIN
    PERFORM public.apply_survey_reward(v_resp.id);
    INSERT INTO test_log VALUES ('E12 (Solo super)', 'FALLO', 'Permitió llamar apply_survey_reward a usuario regular');
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE = '42501' THEN
      INSERT INTO test_log VALUES ('E12 (Solo super)', 'PASO', 'Rechazado con 42501: ' || SQLERRM);
    ELSE
      INSERT INTO test_log VALUES ('E12 (Solo super)', 'FALLO', 'Error inesperado: ' || SQLSTATE || ' ' || SQLERRM);
    END IF;
  END;
END $$;

-- ------------------------------------------------------------------------------
-- 4. CONSULTAR RESULTADOS DE PRUEBAS
-- ------------------------------------------------------------------------------
SELECT * FROM test_log;

-- ------------------------------------------------------------------------------
-- 5. REVERTIR TRANSACCIÓN (CERO IMPACTO EN PRODUCCIÓN)
-- ------------------------------------------------------------------------------
ROLLBACK;
