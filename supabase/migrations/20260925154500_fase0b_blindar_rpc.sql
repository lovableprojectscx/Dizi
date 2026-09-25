-- Migración: 20260925154500_fase0b_blindar_rpc.sql
-- Fase 0b: Blindaje de funciones RPC críticas (initialize_store, process_referral_reward, degrade_expired_plans, increment_store_egress)
-- Añade SET search_path = public, pg_temp y control estricto de roles en las funciones.

-- 1. initialize_store: Exigir auth.uid() = p_owner_id o super_admin. Forzar plan = 'semilla' si no es super_admin.
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
  p_category_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan text;
  v_is_super boolean;
BEGIN
  -- 1. Exigir que auth.uid() coincida con p_owner_id, o que quien llama sea super_admin
  v_is_super := (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text);

  IF auth.uid() IS NULL OR (auth.uid() != p_owner_id AND NOT v_is_super) THEN
    RAISE EXCEPTION 'No autorizado. Solo el dueño autenticado o un super_admin pueden inicializar la tienda.';
  END IF;

  -- 2. Si no es super_admin, forzar plan = 'semilla' e ignorar p_plan
  IF v_is_super THEN
    v_plan := COALESCE(p_plan, 'semilla');
  ELSE
    v_plan := 'semilla';
  END IF;

  -- 3. Insertar tienda con v_plan
  INSERT INTO public.stores (
    id, slug, name, phone, country_code, plan, owner_id, model, active, is_published
  ) VALUES (
    p_id, p_slug, p_name, p_phone, p_country_code, v_plan, p_owner_id, p_model, true, true
  );

  -- 4. Insertar categoría inicial
  INSERT INTO public.categories (
    id, store_id, name
  ) VALUES (
    p_category_id, p_id, 'General'
  );

  -- 5. Insertar productos de ejemplo
  INSERT INTO public.products (
    id, store_id, category_id, name, price, image, description, is_on_sale, visible, is_sample
  ) VALUES 
  (
    'p_' || substr(md5(random()::text), 1, 8), p_id, p_category_id, 
    'Producto de Ejemplo 1', 49.90, 
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80', 
    'Esta es una descripción de ejemplo para tu primer producto. Puedes editarla o eliminarla desde el panel de administración.', 
    false, true, true
  ),
  (
    'p_' || substr(md5(random()::text), 1, 8), p_id, p_category_id, 
    'Producto en Oferta 2', 99.90, 
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80', 
    'Este es un producto de ejemplo con precio de oferta. Puedes configurar precios anteriores para mostrar descuentos.', 
    true, true, true
  ),
  (
    'p_' || substr(md5(random()::text), 1, 8), p_id, p_category_id, 
    'Producto de Ejemplo 3', 29.90, 
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80', 
    'Otro producto de muestra para decorar tu catálogo inicial.', 
    false, true, true
  );
END;
$$;

REVOKE ALL ON FUNCTION public.initialize_store(text, text, text, text, text, text, uuid, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.initialize_store(text, text, text, text, text, text, uuid, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.initialize_store(text, text, text, text, text, text, uuid, text, text, text) TO authenticated, service_role;

-- 2. process_referral_reward: Exigir super_admin o service_role
CREATE OR REPLACE FUNCTION public.process_referral_reward(p_referred_store_id text, p_referred_plan text, p_referred_price numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_referrer_slug TEXT;
  v_referred_slug TEXT;
  v_rewarded BOOLEAN;
  v_referrer_id TEXT;
  v_referrer_plan TEXT;
  v_referrer_expires TIMESTAMPTZ;
BEGIN
  -- Verificar autorización: solo service_role o super_admin
  IF auth.role() != 'service_role' AND COALESCE((auth.jwt()->'app_metadata'->>'role'), '') != 'super_admin' THEN
    RAISE EXCEPTION 'No autorizado. Solo super administradores o service_role pueden ejecutar esta acción.';
  END IF;

  -- 1. Obtener datos de la tienda referida
  SELECT referred_by, referral_rewarded, slug 
  INTO v_referrer_slug, v_rewarded, v_referred_slug
  FROM public.stores 
  WHERE id = p_referred_store_id;

  -- 2. Validaciones de salida temprana
  IF v_referrer_slug IS NULL OR v_referrer_slug = '' OR v_rewarded = TRUE OR v_referrer_slug = v_referred_slug THEN
    RETURN;
  END IF;

  -- 3. Buscar datos de la tienda referente por su slug
  SELECT id, plan, plan_expires_at
  INTO v_referrer_id, v_referrer_plan, v_referrer_expires
  FROM public.stores 
  WHERE slug = v_referrer_slug;

  IF v_referrer_id IS NULL THEN
    RETURN;
  END IF;

  -- 4. Procesar recompensa de TIEMPO para el REFERENTE (30 días de suscripción gratis)
  IF v_referrer_plan = 'semilla' THEN
    UPDATE public.stores
    SET 
      plan = p_referred_plan,
      subscription_status = 'active',
      plan_expires_at = NOW() + INTERVAL '30 days',
      plan_duration_months = 1,
      custom_price = NULL
    WHERE id = v_referrer_id;
  ELSE
    UPDATE public.stores
    SET plan_expires_at = COALESCE(
      CASE 
        WHEN plan_expires_at < NOW() THEN NOW() 
        ELSE plan_expires_at 
      END,
      NOW()
    ) + INTERVAL '30 days'
    WHERE id = v_referrer_id;
  END IF;

  -- 5. Procesar recompensa de TIEMPO para el REFERIDO (tienda recién activada)
  UPDATE public.stores
  SET plan_expires_at = COALESCE(
    CASE 
      WHEN plan_expires_at < NOW() THEN NOW() 
      ELSE plan_expires_at 
    END,
    NOW()
  ) + INTERVAL '30 days'
  WHERE id = p_referred_store_id;

  -- 6. Marcar la tienda referida como premiada para evitar doble asignación
  UPDATE public.stores 
  SET referral_rewarded = TRUE 
  WHERE id = p_referred_store_id;
END;
$$;

REVOKE ALL ON FUNCTION public.process_referral_reward(text, text, numeric) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_referral_reward(text, text, numeric) FROM anon;
GRANT EXECUTE ON FUNCTION public.process_referral_reward(text, text, numeric) TO authenticated, service_role;

-- 3. degrade_expired_plans: Exigir super_admin o service_role y REVOKE a anon y authenticated
CREATE OR REPLACE FUNCTION public.degrade_expired_plans()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INT;
BEGIN
  -- Verificar autorización: solo service_role o super_admin
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
$$;

REVOKE ALL ON FUNCTION public.degrade_expired_plans() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.degrade_expired_plans() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.degrade_expired_plans() TO service_role;

-- 4. increment_store_egress: REVOKE a anon y SET search_path
CREATE OR REPLACE FUNCTION public.increment_store_egress(p_store_id text, p_bytes bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.stores
  SET egress_bytes = COALESCE(egress_bytes, 0) + p_bytes
  WHERE id = p_store_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_store_egress(text, bigint) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_store_egress(text, bigint) FROM anon;
GRANT EXECUTE ON FUNCTION public.increment_store_egress(text, bigint) TO authenticated, service_role;

/*
-- SQL PARA REVERTIR ESTA MIGRACIÓN:
CREATE OR REPLACE FUNCTION public.initialize_store(p_id text, p_slug text, p_name text, p_phone text, p_country_code text, p_plan text, p_owner_id uuid, p_model text, p_niche text, p_category_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.stores (id, slug, name, phone, country_code, plan, owner_id, model, active, is_published)
  VALUES (p_id, p_slug, p_name, p_phone, p_country_code, p_plan, p_owner_id, p_model, true, true);
  INSERT INTO public.categories (id, store_id, name) VALUES (p_category_id, p_id, 'General');
  INSERT INTO public.products (id, store_id, category_id, name, price, image, description, is_on_sale, visible, is_sample) VALUES 
  ('p_' || substr(md5(random()::text), 1, 8), p_id, p_category_id, 'Producto de Ejemplo 1', 49.90, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80', 'Descripción', false, true, true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.initialize_store(text, text, text, text, text, text, uuid, text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.process_referral_reward(text, text, numeric) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.degrade_expired_plans() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_store_egress(text, bigint) TO anon, authenticated, service_role;
*/
