-- MIGRACIÓN: Ajustes de diagnóstico de Superadmin
-- Redefinir la función RPC activate_subscription para soportar:
--   1. p_keep_expiration BOOLEAN (mantener la fecha de expiración actual)
--   2. p_manual_expiration TIMESTAMPTZ (establecer una fecha de expiración específica)

-- Eliminar las firmas anteriores para evitar colisiones
DROP FUNCTION IF EXISTS public.activate_subscription(text,text,integer,numeric);
DROP FUNCTION IF EXISTS public.activate_subscription(text,text,integer,numeric,boolean);
DROP FUNCTION IF EXISTS public.activate_subscription(text,text,integer,numeric,boolean,timestamptz);

CREATE OR REPLACE FUNCTION public.activate_subscription(
  p_store_id          TEXT,
  p_plan              TEXT,
  p_duration_months   INT DEFAULT 1,
  p_custom_price      NUMERIC DEFAULT NULL,
  p_keep_expiration   BOOLEAN DEFAULT FALSE,
  p_manual_expiration TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Verificar autorización de Superadmin o service_role
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
    -- Determinar la nueva fecha de vencimiento
    IF p_manual_expiration IS NOT NULL THEN
      -- Se establece una fecha manual explícita
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
      -- Se mantiene la fecha de vencimiento actual de la tienda
      UPDATE public.stores
      SET
        plan                 = p_plan,
        subscription_status  = 'active',
        custom_price         = p_custom_price,
        cancelled_at         = NULL,
        cancel_reason        = NULL
      WHERE id = p_store_id;
    ELSE
      -- Se extiende sumando meses desde NOW()
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
