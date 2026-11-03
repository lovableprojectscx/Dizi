-- ==============================================================================
-- Migración: F43 - Encuesta de Calidad dentro de DIZI (versión 2026-11)
-- Archivo: supabase/migrations/20261103093000_f43_encuesta_calidad.sql
-- Fecha: 2026-11-03
--
-- NOTA IMPORTANTE: Archivo de migración (NO aplicar a producción hasta el merge
-- y confirmación escrita de Jack).
--
-- Contenido:
--   1. Tabla public.survey_responses con clave foránea a stores(id) ON DELETE CASCADE.
--   2. Índices de optimización para búsqueda por store_id + version, código y estado.
--   3. Row Level Security (RLS) habilitado con políticas SELECT para dueño y super_admin.
--   4. Función generadora de código DZ-XXXXXX sin caracteres ambiguos.
--   5. RPC submit_survey (SECURITY DEFINER) para guardar respuestas de forma idempotente.
--   6. RPC apply_survey_reward (SECURITY DEFINER) para super_admin con actualización de 4 campos en Semilla.
--   7. RPC reject_survey_reward (SECURITY DEFINER) para super_admin.
--   8. Permisos mínimos necesarios (REVOKE PUBLIC / GRANT authenticated).
--   9. Script de reversión comentado al final.
-- ==============================================================================

-- 1. Crear tabla survey_responses
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

-- 2. Índices de optimización
CREATE INDEX IF NOT EXISTS idx_survey_responses_store_version
  ON public.survey_responses(store_id, survey_version);

CREATE INDEX IF NOT EXISTS idx_survey_responses_reward_status
  ON public.survey_responses(reward_status);

CREATE INDEX IF NOT EXISTS idx_survey_responses_reward_code
  ON public.survey_responses(reward_code);

-- 3. Habilitar RLS y definir políticas de solo lectura
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "survey_responses_owner_select" ON public.survey_responses;
CREATE POLICY "survey_responses_owner_select" ON public.survey_responses
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = survey_responses.store_id
      AND stores.owner_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "survey_responses_superadmin_select" ON public.survey_responses;
CREATE POLICY "survey_responses_superadmin_select" ON public.survey_responses
FOR SELECT TO authenticated
USING (
  COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text
);

-- 4. Generador de código único DZ-XXXXXX (alfabeto sin 0, O, 1, I, L)
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

-- 5. RPC submit_survey
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

  -- 2. Validar que la tienda exista
  SELECT * INTO v_store FROM public.stores WHERE id = p_store_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tienda no encontrada.' USING ERRCODE = '02000';
  END IF;

  -- 3. Validar permisos: solo el dueño de la tienda o super_admin
  IF v_store.owner_id != auth.uid() AND NOT v_is_super THEN
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

-- 6. RPC apply_survey_reward
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

-- 7. RPC reject_survey_reward
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

-- 8. Permisos de funciones (seguridad estricta)
REVOKE ALL ON FUNCTION public.generate_survey_reward_code() FROM PUBLIC;

REVOKE ALL ON FUNCTION public.submit_survey(text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_survey(text, text, jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.apply_survey_reward(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_survey_reward(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.reject_survey_reward(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reject_survey_reward(uuid) TO authenticated;

-- ==============================================================================
-- SQL DE REVERSIÓN (EJECUTAR EN CASO DE ROLLBACK Y EN ORDEN INVERSO ESTRICTO)
-- ==============================================================================
/*
REVOKE EXECUTE ON FUNCTION public.reject_survey_reward(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_survey_reward(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_survey(text, text, jsonb) FROM authenticated;

DROP FUNCTION IF EXISTS public.reject_survey_reward(uuid);
DROP FUNCTION IF EXISTS public.apply_survey_reward(uuid);
DROP FUNCTION IF EXISTS public.submit_survey(text, text, jsonb);
DROP FUNCTION IF EXISTS public.generate_survey_reward_code();

DROP POLICY IF EXISTS "survey_responses_superadmin_select" ON public.survey_responses;
DROP POLICY IF EXISTS "survey_responses_owner_select" ON public.survey_responses;

DROP TABLE IF EXISTS public.survey_responses CASCADE;
*/
