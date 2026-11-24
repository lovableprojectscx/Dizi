-- Migración: 20261125120000_f57_2_coherencia.sql
-- F57.2 · Coherencia de funciones de suscripción e inicialización
-- 
-- Cambios:
-- 1. cancel_subscription: ya no degrada a 'semilla'; conserva el plan contratado,
--    registra subscription_status = 'cancelled', cancelled_at = NOW(), cancel_reason = p_reason
--    y vence la vigencia inmediatamente fuera de gracia: plan_expires_at = NOW() - INTERVAL '3 days'.
-- 2. initialize_store (rama superadmin): tiendas creadas sin plan ya no nacen en semilla,
--    sino que reciben plan Pro con prueba de 7 días (idéntico al registro de usuario).
-- 3. activate_subscription (sobrecargas de 4 y 6 parámetros) y activate_subscription_with_invite:
--    rechazan la asignación o canje de plan 'semilla' si la fecha actual en hora de Lima
--    es mayor o igual a app_config.semilla_fin.
--
-- NOTA DE PASO 1: Este archivo NO se aplica en producción en el Paso 1. Se deja preparado para el Paso 2 con OK de Jack.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. cancel_subscription
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.cancel_subscription(p_store_id text, p_reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Verificar que el ejecutor sea service_role o un usuario autenticado con rol super_admin en app_metadata
  IF auth.role() != 'service_role' AND COALESCE((auth.jwt()->'app_metadata'->>'role'), '') != 'super_admin' THEN
    RAISE EXCEPTION 'No autorizado. Solo super administradores pueden realizar esta acción.';
  END IF;

  UPDATE public.stores
  SET
    subscription_status = 'cancelled',
    cancelled_at        = NOW(),
    cancel_reason       = p_reason,
    plan_expires_at     = NOW() - INTERVAL '3 days'
  WHERE id = p_store_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.cancel_subscription(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_subscription(text, text) TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. initialize_store
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.initialize_store(
  p_id text,
  p_slug text,
  p_name text,
  p_phone text,
  p_country_code text,
  p_plan text,
  p_owner_id uuid,
  p_model text,
  p_niche text,
  p_category_id text,
  p_country_iso text DEFAULT 'PE'::text
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_plan text;
  v_requested_plan text;
  v_is_super boolean;
BEGIN
  -- 1. Exigir que auth.uid() coincida con p_owner_id, o que quien llama sea super_admin
  v_is_super := (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text);

  IF auth.uid() IS NULL OR (auth.uid() != p_owner_id AND NOT v_is_super) THEN
    RAISE EXCEPTION 'No autorizado. Solo el dueño autenticado o un super_admin pueden inicializar la tienda.';
  END IF;

  -- 2. Si es super_admin, se respeta el plan solicitado o nace Pro con 7 días de prueba (RF-57.2.8).
  --    Si no es super_admin, la tienda nace con 7 días de prueba Pro (F55).
  IF v_is_super THEN
    v_plan := COALESCE(p_plan, 'pro');
    v_requested_plan := NULL;

    IF v_plan = 'semilla' THEN
      INSERT INTO public.stores (
        id, slug, name, phone, country_code, country_iso, plan, requested_plan, terms_accepted_at, owner_id, model, active, is_published
      ) VALUES (
        p_id, p_slug, p_name, p_phone, p_country_code, COALESCE(p_country_iso, 'PE'), v_plan, v_requested_plan, now(), p_owner_id, p_model, true, true
      );
    ELSE
      INSERT INTO public.stores (
        id, slug, name, phone, country_code, country_iso, plan, subscription_status, plan_expires_at, show_dizi_branding, requested_plan, terms_accepted_at, owner_id, model, active, is_published
      ) VALUES (
        p_id, p_slug, p_name, p_phone, p_country_code, COALESCE(p_country_iso, 'PE'), v_plan, 'trial', now() + interval '7 days', NULL, v_requested_plan, now(), p_owner_id, p_model, true, true
      );
    END IF;
  ELSE
    v_plan := 'pro';
    v_requested_plan := CASE WHEN p_plan IS NOT NULL AND p_plan != 'semilla' THEN p_plan ELSE NULL END;

    -- 3b. Insertar tienda con prueba Pro de 7 días (F55)
    INSERT INTO public.stores (
      id, slug, name, phone, country_code, country_iso, plan, subscription_status, plan_expires_at, show_dizi_branding, requested_plan, terms_accepted_at, owner_id, model, active, is_published
    ) VALUES (
      p_id, p_slug, p_name, p_phone, p_country_code, COALESCE(p_country_iso, 'PE'), 'pro', 'trial', now() + interval '7 days', NULL, v_requested_plan, now(), p_owner_id, p_model, true, true
    );
  END IF;

  -- 4. Insertar categoría inicial
  INSERT INTO public.categories (
    id, store_id, name
  ) VALUES (
    p_category_id, p_id, 'General'
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.initialize_store(text, text, text, text, text, text, uuid, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.initialize_store(text, text, text, text, text, text, uuid, text, text, text, text) TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. activate_subscription (4 parámetros)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.activate_subscription(
  p_store_id text,
  p_plan text,
  p_duration_months integer DEFAULT 1,
  p_custom_price numeric DEFAULT NULL::numeric
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_expires_at TIMESTAMPTZ;
  v_referred_price NUMERIC;
  v_semilla_fin DATE;
BEGIN
  -- Verificar autorización
  IF auth.role() != 'service_role' AND COALESCE((auth.jwt()->'app_metadata'->>'role'), '') != 'super_admin' THEN
    RAISE EXCEPTION 'No autorizado. Solo super administradores pueden realizar esta acción.';
  END IF;

  -- Si el plan es semilla (gratis), verificar que no haya expirado según semilla_fin en hora Lima
  IF p_plan = 'semilla' THEN
    SELECT NULLIF(TRIM(BOTH '"' FROM (value::text)), '')::date
      INTO v_semilla_fin
      FROM public.app_config
     WHERE key = 'semilla_fin';

    IF v_semilla_fin IS NOT NULL AND (now() AT TIME ZONE 'America/Lima')::date >= v_semilla_fin THEN
      RAISE EXCEPTION 'El plan Semilla ya no está disponible desde el %', v_semilla_fin;
    END IF;

    UPDATE public.stores
    SET
      plan                 = p_plan,
      plan_expires_at      = NULL,
      subscription_status  = 'trial',
      plan_duration_months = NULL,
      custom_price         = NULL
    WHERE id = p_store_id;
  ELSE
    v_expires_at := NOW() + (p_duration_months || ' months')::INTERVAL;
    UPDATE public.stores
    SET
      plan                 = p_plan,
      plan_expires_at      = v_expires_at,
      subscription_status  = 'active',
      plan_duration_months = p_duration_months,
      custom_price         = p_custom_price,
      cancelled_at         = NULL,
      cancel_reason        = NULL
    WHERE id = p_store_id;

    -- AUTOMATIZACIÓN DE REFERIDOS:
    v_referred_price := COALESCE(p_custom_price, public.get_plan_price(p_plan));
    IF v_referred_price > 0 THEN
      PERFORM public.process_referral_reward(p_store_id, p_plan, v_referred_price);
    END IF;
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.activate_subscription(text, text, integer, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_subscription(text, text, integer, numeric) TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. activate_subscription (6 parámetros)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.activate_subscription(
  p_store_id text,
  p_plan text,
  p_duration_months integer DEFAULT 1,
  p_custom_price numeric DEFAULT NULL::numeric,
  p_keep_expiration boolean DEFAULT false,
  p_manual_expiration timestamp with time zone DEFAULT NULL::timestamp with time zone
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_expires_at TIMESTAMPTZ;
  v_semilla_fin DATE;
BEGIN
  -- Verificar autorización de Superadmin o service_role
  IF auth.role() != 'service_role' AND COALESCE((auth.jwt()->'app_metadata'->>'role'), '') != 'super_admin' THEN
    RAISE EXCEPTION 'No autorizado. Solo super administradores pueden realizar esta acción.';
  END IF;

  -- Si el plan es semilla (gratis), verificar que no haya expirado según semilla_fin en hora Lima
  IF p_plan = 'semilla' THEN
    SELECT NULLIF(TRIM(BOTH '"' FROM (value::text)), '')::date
      INTO v_semilla_fin
      FROM public.app_config
     WHERE key = 'semilla_fin';

    IF v_semilla_fin IS NOT NULL AND (now() AT TIME ZONE 'America/Lima')::date >= v_semilla_fin THEN
      RAISE EXCEPTION 'El plan Semilla ya no está disponible desde el %', v_semilla_fin;
    END IF;

    UPDATE public.stores
    SET
      plan                 = p_plan,
      plan_expires_at      = NULL,
      subscription_status  = 'trial',
      plan_duration_months = NULL,
      custom_price         = NULL
    WHERE id = p_store_id;
  ELSE
    IF p_manual_expiration IS NOT NULL THEN
      UPDATE public.stores
      SET
        plan                 = p_plan,
        plan_expires_at      = p_manual_expiration,
        subscription_status  = 'active',
        custom_price         = p_custom_price,
        cancelled_at         = NULL,
        cancel_reason        = NULL
      WHERE id = p_store_id;
    ELSIF p_keep_expiration THEN
      UPDATE public.stores
      SET
        plan                 = p_plan,
        subscription_status  = 'active',
        custom_price         = p_custom_price,
        cancelled_at         = NULL,
        cancel_reason        = NULL
      WHERE id = p_store_id;
    ELSE
      v_expires_at := NOW() + (p_duration_months || ' months')::INTERVAL;
      UPDATE public.stores
      SET
        plan                 = p_plan,
        plan_expires_at      = v_expires_at,
        subscription_status  = 'active',
        plan_duration_months = p_duration_months,
        custom_price         = p_custom_price,
        cancelled_at         = NULL,
        cancel_reason        = NULL
      WHERE id = p_store_id;
    END IF;
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.activate_subscription(text, text, integer, numeric, boolean, timestamp with time zone) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_subscription(text, text, integer, numeric, boolean, timestamp with time zone) TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. activate_subscription_with_invite
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.activate_subscription_with_invite(p_store_id text, p_invite_token text)
 RETURNS TABLE(plan text, duration_value integer, duration_unit text, custom_price numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_invite RECORD;
  v_expires_at TIMESTAMPTZ;
  v_subscription_status TEXT;
  v_plan_duration_months INT;
  v_store_owner_id UUID;
  v_is_super BOOLEAN;
  v_semilla_fin DATE;
BEGIN
  -- Validar permisos: rol de service_role o super_admin tienen acceso total; de lo contrario, debe ser el dueño autenticado
  v_is_super := (COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'super_admin');
  
  IF (SELECT auth.role()) = 'service_role' OR v_is_super THEN
    NULL;
  ELSE
    SELECT owner_id INTO v_store_owner_id FROM public.stores WHERE id = p_store_id;
    IF (SELECT auth.uid()) IS NULL OR v_store_owner_id IS NULL OR (SELECT auth.uid()) != v_store_owner_id THEN
      RAISE EXCEPTION 'No autorizado. Solo el dueño de la tienda o un super_admin pueden canjear una invitación.' USING ERRCODE = '42501';
    END IF;
  END IF;

  -- 1. Buscar y bloquear la fila del invite para evitar condiciones de carrera
  SELECT * INTO v_invite
  FROM public.invites
  WHERE token = p_invite_token AND used = false AND expires_at > NOW()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El enlace de invitación no es válido o ya fue utilizado.';
  END IF;

  -- 2. Marcar el invite como usado
  UPDATE public.invites
  SET used = true
  WHERE token = p_invite_token;

  -- 3. Activar la suscripción de la tienda
  IF v_invite.plan = 'semilla' THEN
    SELECT NULLIF(TRIM(BOTH '"' FROM (value::text)), '')::date
      INTO v_semilla_fin
      FROM public.app_config
     WHERE key = 'semilla_fin';

    IF v_semilla_fin IS NOT NULL AND (now() AT TIME ZONE 'America/Lima')::date >= v_semilla_fin THEN
      RAISE EXCEPTION 'El plan Semilla ya no está disponible desde el %', v_semilla_fin;
    END IF;

    UPDATE public.stores
    SET
      plan                 = v_invite.plan,
      plan_expires_at      = NULL,
      subscription_status  = 'trial',
      plan_duration_months = NULL,
      custom_price         = NULL
    WHERE id = p_store_id;
  ELSE
    IF v_invite.duration_unit = 'days' THEN
      v_expires_at := NOW() + (v_invite.duration_value || ' days')::INTERVAL;
      v_subscription_status := 'trial';
      v_plan_duration_months := 0;
    ELSE
      v_expires_at := NOW() + (v_invite.duration_value || ' months')::INTERVAL;
      v_subscription_status := 'active';
      v_plan_duration_months := v_invite.duration_value;
    END IF;

    UPDATE public.stores
    SET
      plan                 = v_invite.plan,
      plan_expires_at      = v_expires_at,
      subscription_status  = v_subscription_status,
      plan_duration_months = v_plan_duration_months,
      custom_price         = v_invite.custom_price,
      cancelled_at         = NULL,
      cancel_reason        = NULL
    WHERE id = p_store_id;
  END IF;

  RETURN QUERY 
  SELECT 
    v_invite.plan::TEXT, 
    v_invite.duration_value::INT, 
    v_invite.duration_unit::TEXT, 
    v_invite.custom_price::NUMERIC;
END;
$function$;

REVOKE ALL ON FUNCTION public.activate_subscription_with_invite(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_subscription_with_invite(text, text) TO authenticated, service_role;

-- ═════════════════════════════════════════════════════════════════════════════
-- REVERSIÓN EXACTA (ROLLBACK) — Ejecutar solo si es necesario revertir
-- ═════════════════════════════════════════════════════════════════════════════
/*
CREATE OR REPLACE FUNCTION public.cancel_subscription(p_store_id text, p_reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.role() != 'service_role' AND COALESCE((auth.jwt()->'app_metadata'->>'role'), '') != 'super_admin' THEN
    RAISE EXCEPTION 'No autorizado. Solo super administradores pueden realizar esta acción.';
  END IF;

  UPDATE public.stores
  SET
    plan                = 'semilla',
    subscription_status = 'cancelled',
    cancelled_at        = NOW(),
    cancel_reason       = p_reason,
    plan_expires_at     = NOW()
  WHERE id = p_store_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.initialize_store(p_id text, p_slug text, p_name text, p_phone text, p_country_code text, p_plan text, p_owner_id uuid, p_model text, p_niche text, p_category_id text, p_country_iso text DEFAULT 'PE'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_plan text;
  v_requested_plan text;
  v_is_super boolean;
BEGIN
  v_is_super := (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text);

  IF auth.uid() IS NULL OR (auth.uid() != p_owner_id AND NOT v_is_super) THEN
    RAISE EXCEPTION 'No autorizado. Solo el dueño autenticado o un super_admin pueden inicializar la tienda.';
  END IF;

  IF v_is_super THEN
    v_plan := COALESCE(p_plan, 'semilla');
    v_requested_plan := NULL;

    INSERT INTO public.stores (
      id, slug, name, phone, country_code, country_iso, plan, requested_plan, terms_accepted_at, owner_id, model, active, is_published
    ) VALUES (
      p_id, p_slug, p_name, p_phone, p_country_code, COALESCE(p_country_iso, 'PE'), v_plan, v_requested_plan, now(), p_owner_id, p_model, true, true
    );
  ELSE
    v_plan := 'pro';
    v_requested_plan := CASE WHEN p_plan IS NOT NULL AND p_plan != 'semilla' THEN p_plan ELSE NULL END;

    INSERT INTO public.stores (
      id, slug, name, phone, country_code, country_iso, plan, subscription_status, plan_expires_at, show_dizi_branding, requested_plan, terms_accepted_at, owner_id, model, active, is_published
    ) VALUES (
      p_id, p_slug, p_name, p_phone, p_country_code, COALESCE(p_country_iso, 'PE'), 'pro', 'trial', now() + interval '7 days', NULL, v_requested_plan, now(), p_owner_id, p_model, true, true
    );
  END IF;

  INSERT INTO public.categories (
    id, store_id, name
  ) VALUES (
    p_category_id, p_id, 'General'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.activate_subscription(p_store_id text, p_plan text, p_duration_months integer DEFAULT 1, p_custom_price numeric DEFAULT NULL::numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_expires_at TIMESTAMPTZ;
  v_referred_price NUMERIC;
BEGIN
  IF auth.role() != 'service_role' AND COALESCE((auth.jwt()->'app_metadata'->>'role'), '') != 'super_admin' THEN
    RAISE EXCEPTION 'No autorizado. Solo super administradores pueden realizar esta acción.';
  END IF;

  IF p_plan = 'semilla' THEN
    UPDATE public.stores
    SET
      plan                 = p_plan,
      plan_expires_at      = NULL,
      subscription_status  = 'trial',
      plan_duration_months = NULL,
      custom_price         = NULL
    WHERE id = p_store_id;
  ELSE
    v_expires_at := NOW() + (p_duration_months || ' months')::INTERVAL;
    UPDATE public.stores
    SET
      plan                 = p_plan,
      plan_expires_at      = v_expires_at,
      subscription_status  = 'active',
      plan_duration_months = p_duration_months,
      custom_price         = p_custom_price,
      cancelled_at         = NULL,
      cancel_reason        = NULL
    WHERE id = p_store_id;

    v_referred_price := COALESCE(p_custom_price, public.get_plan_price(p_plan));
    IF v_referred_price > 0 THEN
      PERFORM public.process_referral_reward(p_store_id, p_plan, v_referred_price);
    END IF;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.activate_subscription(p_store_id text, p_plan text, p_duration_months integer DEFAULT 1, p_custom_price numeric DEFAULT NULL::numeric, p_keep_expiration boolean DEFAULT false, p_manual_expiration timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_expires_at TIMESTAMPTZ;
BEGIN
  IF auth.role() != 'service_role' AND COALESCE((auth.jwt()->'app_metadata'->>'role'), '') != 'super_admin' THEN
    RAISE EXCEPTION 'No autorizado. Solo super administradores pueden realizar esta acción.';
  END IF;

  IF p_plan = 'semilla' THEN
    UPDATE public.stores
    SET
      plan                 = p_plan,
      plan_expires_at      = NULL,
      subscription_status  = 'trial',
      plan_duration_months = NULL,
      custom_price         = NULL
    WHERE id = p_store_id;
  ELSE
    IF p_manual_expiration IS NOT NULL THEN
      UPDATE public.stores
      SET
        plan                 = p_plan,
        plan_expires_at      = p_manual_expiration,
        subscription_status  = 'active',
        custom_price         = p_custom_price,
        cancelled_at         = NULL,
        cancel_reason        = NULL
      WHERE id = p_store_id;
    ELSIF p_keep_expiration THEN
      UPDATE public.stores
      SET
        plan                 = p_plan,
        subscription_status  = 'active',
        custom_price         = p_custom_price,
        cancelled_at         = NULL,
        cancel_reason        = NULL
      WHERE id = p_store_id;
    ELSE
      v_expires_at := NOW() + (p_duration_months || ' months')::INTERVAL;
      UPDATE public.stores
      SET
        plan                 = p_plan,
        plan_expires_at      = v_expires_at,
        subscription_status  = 'active',
        plan_duration_months = p_duration_months,
        custom_price         = p_custom_price,
        cancelled_at         = NULL,
        cancel_reason        = NULL
      WHERE id = p_store_id;
    END IF;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.activate_subscription_with_invite(p_store_id text, p_invite_token text)
 RETURNS TABLE(plan text, duration_value integer, duration_unit text, custom_price numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_invite RECORD;
  v_expires_at TIMESTAMPTZ;
  v_subscription_status TEXT;
  v_plan_duration_months INT;
  v_store_owner_id UUID;
  v_is_super BOOLEAN;
BEGIN
  v_is_super := (COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'super_admin');
  
  IF (SELECT auth.role()) = 'service_role' OR v_is_super THEN
    NULL;
  ELSE
    SELECT owner_id INTO v_store_owner_id FROM public.stores WHERE id = p_store_id;
    IF (SELECT auth.uid()) IS NULL OR v_store_owner_id IS NULL OR (SELECT auth.uid()) != v_store_owner_id THEN
      RAISE EXCEPTION 'No autorizado. Solo el dueño de la tienda o un super_admin pueden canjear una invitación.' USING ERRCODE = '42501';
    END IF;
  END IF;

  SELECT * INTO v_invite
  FROM public.invites
  WHERE token = p_invite_token AND used = false AND expires_at > NOW()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El enlace de invitación no es válido o ya fue utilizado.';
  END IF;

  UPDATE public.invites
  SET used = true
  WHERE token = p_invite_token;

  IF v_invite.plan = 'semilla' THEN
    UPDATE public.stores
    SET
      plan                 = v_invite.plan,
      plan_expires_at      = NULL,
      subscription_status  = 'trial',
      plan_duration_months = NULL,
      custom_price         = NULL
    WHERE id = p_store_id;
  ELSE
    IF v_invite.duration_unit = 'days' THEN
      v_expires_at := NOW() + (v_invite.duration_value || ' days')::INTERVAL;
      v_subscription_status := 'trial';
      v_plan_duration_months := 0;
    ELSE
      v_expires_at := NOW() + (v_invite.duration_value || ' months')::INTERVAL;
      v_subscription_status := 'active';
      v_plan_duration_months := v_invite.duration_value;
    END IF;

    UPDATE public.stores
    SET
      plan                 = v_invite.plan,
      plan_expires_at      = v_expires_at,
      subscription_status  = v_subscription_status,
      plan_duration_months = v_plan_duration_months,
      custom_price         = v_invite.custom_price,
      cancelled_at         = NULL,
      cancel_reason        = NULL
    WHERE id = p_store_id;
  END IF;

  RETURN QUERY 
  SELECT 
    v_invite.plan::TEXT, 
    v_invite.duration_value::INT, 
    v_invite.duration_unit::TEXT, 
    v_invite.custom_price::NUMERIC;
END;
$function$;
*/
