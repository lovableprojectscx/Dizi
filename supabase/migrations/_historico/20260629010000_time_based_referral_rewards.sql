-- ─── SISTEMA DE REFERIDOS BASADO EN TIEMPO (EXTENSIÓN DE SUSCRIPCIÓN) ───
-- Limpieza y redefinición para otorgar 30 días de premium gratis a referente y referido.

-- 1. Eliminar columna obsoleta de créditos en dinero
ALTER TABLE public.stores DROP COLUMN IF EXISTS referral_credit;

-- 2. Redefinir la función principal de procesamiento de recompensa
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
  SELECT id, plan, plan_expires_at
  INTO v_referrer_id, v_referrer_plan, v_referrer_expires
  FROM public.stores 
  WHERE slug = v_referrer_slug;

  -- Si el referente no existe, no procesamos nada
  IF v_referrer_id IS NULL THEN
    RETURN;
  END IF;

  -- 4. Procesar recompensa de TIEMPO para el REFERENTE (30 días de suscripción gratis)
  IF v_referrer_plan = 'semilla' THEN
    -- Si el referente estaba en plan Semilla (gratuito), se le hace un upgrade al plan del referido por 30 días
    UPDATE public.stores
    SET 
      plan = p_referred_plan,
      subscription_status = 'active',
      plan_expires_at = NOW() + INTERVAL '30 days',
      plan_duration_months = 1,
      custom_price = NULL
    WHERE id = v_referrer_id;
  ELSE
    -- Si ya tenía un plan de pago, se le extienden 30 días adicionales a su expiración actual
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
  -- Se le extienden 30 días adicionales a la vigencia del plan que acaba de adquirir
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Redefinir la función de activación de suscripciones
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
    
    -- Procesar la recompensa de tiempo si el plan adquirido es de pago
    IF v_referred_price > 0 THEN
      PERFORM public.process_referral_reward(p_store_id, p_plan, v_referred_price);
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
