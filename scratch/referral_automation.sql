-- ─── AUTOMATIZACIÓN Y SEGURIDAD DEL PROGRAMA DE REFERIDOS ───
-- Este script realiza:
-- 1. Agregado de las columnas `referral_rewarded` y `referral_credit` en la tabla `stores`.
-- 2. Creación de la función helper `get_plan_price` para mapear precios estándar.
-- 3. Creación de la función `process_referral_reward` para la asignación proporcional y segura de recompensas.
-- 4. Redefinición de `activate_subscription` para integrar la recompensa automática al activar planes.

-- 1. Actualizar esquema de base de datos
ALTER TABLE public.stores 
  ADD COLUMN IF NOT EXISTS referral_rewarded BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS referral_credit NUMERIC(10,2) DEFAULT 0.00;

-- 2. Función helper para obtener precio de plan
CREATE OR REPLACE FUNCTION public.get_plan_price(p_plan TEXT)
RETURNS NUMERIC AS $$
BEGIN
  RETURN CASE p_plan
    WHEN 'emprendedor' THEN 9.90
    WHEN 'pro' THEN 14.90
    WHEN 'ilimitado' THEN 34.90
    ELSE 0.00
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Función principal de procesamiento de recompensa
CREATE OR REPLACE FUNCTION public.process_referral_reward(
  p_referred_store_id TEXT,
  p_referred_plan TEXT,
  p_referred_price NUMERIC
)
RETURNS VOID AS $$
DECLARE
  v_referrer_slug TEXT;
  v_referred_slug TEXT;
  v_rewarded BOOLEAN;
  v_referrer_id TEXT;
  v_referrer_plan TEXT;
  v_referrer_expires TIMESTAMPTZ;
  v_referrer_custom_price NUMERIC;
  v_referrer_price NUMERIC;
  v_days_to_extend INT;
  v_reward_value NUMERIC;
BEGIN
  -- 1. Obtener datos de la tienda referida
  SELECT referred_by, referral_rewarded, slug 
  INTO v_referrer_slug, v_rewarded, v_referred_slug
  FROM public.stores 
  WHERE id = p_referred_store_id;

  -- 2. Validaciones de salida temprana
  -- - No tiene referente
  -- - Ya fue premiado antes
  -- - Es una auto-referencia (intento de fraude)
  IF v_referrer_slug IS NULL OR v_referrer_slug = '' OR v_rewarded = TRUE OR v_referrer_slug = v_referred_slug THEN
    RETURN;
  END IF;

  -- 3. Buscar datos de la tienda referente por su slug
  SELECT id, plan, plan_expires_at, custom_price
  INTO v_referrer_id, v_referrer_plan, v_referrer_expires, v_referrer_custom_price
  FROM public.stores 
  WHERE slug = v_referrer_slug;

  -- Si el referente no existe, no procesamos nada
  IF v_referrer_id IS NULL THEN
    RETURN;
  END IF;

  -- 4. Determinar precio base del referente (custom_price tiene prioridad sobre el plan)
  IF v_referrer_custom_price IS NOT NULL AND v_referrer_custom_price > 0 THEN
    v_referrer_price := v_referrer_custom_price;
  ELSE
    v_referrer_price := public.get_plan_price(v_referrer_plan);
  END IF;

  -- 5. Procesar recompensa proporcional
  -- Caso A: Referente en plan Semilla (Gratis) o precio 0 -> Acumula crédito en soles para futuro upgrade
  IF v_referrer_plan = 'semilla' OR v_referrer_price = 0 THEN
    v_reward_value := p_referred_price;
    UPDATE public.stores
    SET referral_credit = COALESCE(referral_credit, 0) + v_reward_value
    WHERE id = v_referrer_id;
    
  -- Caso B: Referente en plan de pago -> Extensión proporcional en días
  ELSE
    -- Fórmula: días = 30 * precio_referido / precio_referente (máximo 30 días)
    v_days_to_extend := LEAST(30, ROUND(30.0 * (p_referred_price / v_referrer_price))::INT);
    
    IF v_days_to_extend > 0 THEN
      UPDATE public.stores
      SET plan_expires_at = COALESCE(
        CASE 
          WHEN plan_expires_at < NOW() THEN NOW() 
          ELSE plan_expires_at 
        END,
        NOW()
      ) + (v_days_to_extend || ' days')::INTERVAL
      WHERE id = v_referrer_id;
    END IF;
  END IF;

  -- 6. Marcar la tienda referida como premiada para evitar doble asignación
  UPDATE public.stores 
  SET referral_rewarded = TRUE 
  WHERE id = p_referred_store_id;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Redefinición de activate_subscription con llamada automática a recompensa
CREATE OR REPLACE FUNCTION public.activate_subscription(
  p_store_id    TEXT,
  p_plan        TEXT,
  p_duration_months INT DEFAULT 1,
  p_custom_price NUMERIC DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_expires_at TIMESTAMPTZ;
  v_referred_price NUMERIC;
BEGIN
  -- Verificar autorización
  IF auth.role() != 'service_role' AND COALESCE((auth.jwt()->'app_metadata'->>'role'), '') != 'super_admin' THEN
    RAISE EXCEPTION 'No autorizado. Solo super administradores pueden realizar esta acción.';
  END IF;

  -- Si el plan es semilla (gratis), no se establece expiración
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

    -- AUTOMATIZACIÓN DE REFERIDOS:
    -- Calcular precio efectivo pagado por el referido
    v_referred_price := COALESCE(p_custom_price, public.get_plan_price(p_plan));
    
    -- Procesar la recompensa proporcional al referente
    IF v_referred_price > 0 THEN
      PERFORM public.process_referral_reward(p_store_id, p_plan, v_referred_price);
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
