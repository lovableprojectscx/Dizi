-- =============================================================================
-- MIGRACIÓN: Sistema de Suscripciones con Duración y Cancelación
-- Fecha: 2026-05-13
-- Descripción: Agrega control de tiempo de suscripción, cancelación y expiración
-- =============================================================================

-- ─── 1. TABLA invites ────────────────────────────────────────────────────────

-- duration_months: cuántos meses dura la suscripción vinculada a este invite
ALTER TABLE invites
  ADD COLUMN IF NOT EXISTS duration_months INT NOT NULL DEFAULT 1;

-- expires_at: cuándo expira el INVITE (el link). Calculado automáticamente.
-- Nota: si ya existe la columna, esta línea no falla gracias al IF NOT EXISTS
ALTER TABLE invites
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- notes: notas internas del super admin sobre este invite
ALTER TABLE invites
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Recalcular expires_at para filas existentes que no lo tengan
UPDATE invites
SET expires_at = created_at + INTERVAL '30 days'
WHERE expires_at IS NULL;

-- Trigger para calcular expires_at automáticamente al insertar
CREATE OR REPLACE FUNCTION set_invite_expires_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    -- El invite (el link) expira en 30 días por defecto, independientemente de la duración del plan
    NEW.expires_at := NOW() + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invite_expires_at ON invites;
CREATE TRIGGER trg_invite_expires_at
  BEFORE INSERT ON invites
  FOR EACH ROW
  EXECUTE FUNCTION set_invite_expires_at();


-- ─── 2. TABLA stores ─────────────────────────────────────────────────────────

-- plan_expires_at: cuándo vence el plan activo de la tienda
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

-- subscription_status: estado actual de la suscripción
-- Valores: 'active' | 'expired' | 'cancelled' | 'trial'
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'trial';

-- cancelled_at: timestamp de cuándo se canceló (para auditoría)
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- cancel_reason: motivo de cancelación (para análisis interno)
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- plan_duration_months: duración del plan asignado manualmente (para renovaciones manuales)
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS plan_duration_months INT DEFAULT 1;

-- Constraint para validar los valores de subscription_status
ALTER TABLE stores
  DROP CONSTRAINT IF EXISTS chk_subscription_status;
ALTER TABLE stores
  ADD CONSTRAINT chk_subscription_status
  CHECK (subscription_status IN ('active', 'expired', 'cancelled', 'trial'));


-- ─── 3. ÍNDICES ───────────────────────────────────────────────────────────────

-- Para consultas de vencimiento próximo (cron y alertas)
CREATE INDEX IF NOT EXISTS idx_stores_plan_expires_at
  ON stores (plan_expires_at)
  WHERE subscription_status = 'active';

-- Para filtrar tiendas por status rápidamente
CREATE INDEX IF NOT EXISTS idx_stores_subscription_status
  ON stores (subscription_status);


-- ─── 4. FUNCIÓN: Activar suscripción al usar invite ──────────────────────────

CREATE OR REPLACE FUNCTION activate_subscription(
  p_store_id    TEXT,
  p_plan        TEXT,
  p_duration_months INT DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Si el plan es semilla (gratis), no se establece expiración
  IF p_plan = 'semilla' THEN
    UPDATE stores
    SET
      plan                 = p_plan,
      plan_expires_at      = NULL,
      subscription_status  = 'trial',
      plan_duration_months = NULL
    WHERE id = p_store_id;
  ELSE
    v_expires_at := NOW() + (p_duration_months || ' months')::INTERVAL;
    UPDATE stores
    SET
      plan                 = p_plan,
      plan_expires_at      = v_expires_at,
      subscription_status  = 'active',
      plan_duration_months = p_duration_months,
      cancelled_at         = NULL,
      cancel_reason        = NULL
    WHERE id = p_store_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 5. FUNCIÓN: Cancelar suscripción ────────────────────────────────────────

CREATE OR REPLACE FUNCTION cancel_subscription(
  p_store_id    TEXT,
  p_reason      TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE stores
  SET
    plan                = 'semilla',
    subscription_status = 'cancelled',
    cancelled_at        = NOW(),
    cancel_reason       = p_reason,
    plan_expires_at     = NOW()  -- vence inmediatamente
  WHERE id = p_store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 6. FUNCIÓN: Extender suscripción ────────────────────────────────────────

CREATE OR REPLACE FUNCTION extend_subscription(
  p_store_id        TEXT,
  p_months_to_add   INT DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  v_current_expires TIMESTAMPTZ;
BEGIN
  SELECT plan_expires_at INTO v_current_expires FROM stores WHERE id = p_store_id;

  -- Si ya expiró, extiende desde ahora; si no, extiende desde la fecha actual
  UPDATE stores
  SET
    plan_expires_at     = GREATEST(v_current_expires, NOW()) + (p_months_to_add || ' months')::INTERVAL,
    subscription_status = 'active',
    cancelled_at        = NULL,
    cancel_reason       = NULL
  WHERE id = p_store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 7. CRON: Degradar planes expirados (requiere pg_cron) ───────────────────
-- Ejecutar en Supabase Dashboard > Database > Extensions: habilitar pg_cron
-- Luego ejecutar el siguiente bloque manualmente una vez:

/*
SELECT cron.schedule(
  'degrade-expired-plans',   -- nombre del job
  '0 6 * * *',               -- todos los días a las 6:00 AM UTC
  $$
    UPDATE stores
    SET
      plan                = 'semilla',
      subscription_status = 'expired'
    WHERE
      subscription_status = 'active'
      AND plan_expires_at IS NOT NULL
      AND plan_expires_at < NOW();
  $$
);
*/

-- Alternativa si pg_cron no está disponible: función que puede llamarse
-- manualmente o desde un Edge Function de Supabase con trigger scheduled.
CREATE OR REPLACE FUNCTION degrade_expired_plans()
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 8. VISTA ÚTIL: Tiendas con suscripción próxima a vencer ─────────────────

CREATE OR REPLACE VIEW v_expiring_subscriptions AS
SELECT
  s.id,
  s.name,
  s.plan,
  s.plan_expires_at,
  s.subscription_status,
  EXTRACT(DAY FROM (s.plan_expires_at - NOW())) AS days_until_expiry
FROM stores s
WHERE
  s.subscription_status = 'active'
  AND s.plan_expires_at IS NOT NULL
  AND s.plan_expires_at < NOW() + INTERVAL '7 days'
ORDER BY s.plan_expires_at ASC;
