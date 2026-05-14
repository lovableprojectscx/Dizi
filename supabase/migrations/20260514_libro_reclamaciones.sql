-- ============================================================
-- LIBRO DE RECLAMACIONES v2 — Ejecutar en Supabase SQL Editor
-- ============================================================
 
-- 1. Campos de empresa en tabla stores
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS libro_reclamaciones_activo BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS empresa_ruc                TEXT,
  ADD COLUMN IF NOT EXISTS empresa_razon_social       TEXT,
  ADD COLUMN IF NOT EXISTS empresa_direccion          TEXT;
 
-- 2. Tabla de reclamaciones con número correlativo por tenant
CREATE TABLE IF NOT EXISTS reclamaciones (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           TEXT        NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  numero_correlativo  INTEGER     NOT NULL,
  nombre              TEXT        NOT NULL,
  dni                 TEXT        NOT NULL,
  tipo                TEXT        NOT NULL CHECK (tipo IN ('queja', 'reclamo')),
  descripcion         TEXT        NOT NULL,
  fecha               TIMESTAMPTZ NOT NULL DEFAULT now(),
  estado              TEXT        NOT NULL DEFAULT 'pendiente'
                        CHECK (estado IN ('pendiente', 'en_revision', 'resuelto')),
  -- Snapshot inmutable de datos de empresa al momento del registro
  empresa_nombre      TEXT,
  empresa_ruc         TEXT,
  empresa_direccion   TEXT,
  UNIQUE (tenant_id, numero_correlativo)
);
 
-- 3. Índices
CREATE INDEX IF NOT EXISTS reclamaciones_tenant_id_idx ON reclamaciones(tenant_id);
CREATE INDEX IF NOT EXISTS reclamaciones_fecha_idx     ON reclamaciones(fecha DESC);
 
-- 4. RPC para insertar con número correlativo automático por tenant
CREATE OR REPLACE FUNCTION insert_reclamacion(
  p_tenant_id   TEXT,
  p_nombre      TEXT,
  p_dni         TEXT,
  p_tipo        TEXT,
  p_descripcion TEXT
)
RETURNS TABLE (
  id                 UUID,
  numero_correlativo INTEGER,
  fecha              TIMESTAMPTZ,
  empresa_nombre     TEXT,
  empresa_ruc        TEXT,
  empresa_direccion  TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_num    INTEGER;
  v_emp_nombre  TEXT;
  v_emp_ruc     TEXT;
  v_emp_dir     TEXT;
  v_id          UUID;
  v_fecha       TIMESTAMPTZ;
  v_lock_key    BIGINT;
BEGIN
  -- Lock por tenant para garantizar correlativos únicos sin colisiones
  v_lock_key := hashtext(p_tenant_id);
  PERFORM pg_advisory_xact_lock(v_lock_key);
 
  -- Siguiente número correlativo para este tenant
  SELECT COALESCE(MAX(r.numero_correlativo), 0) + 1
    INTO v_next_num
    FROM reclamaciones r
   WHERE r.tenant_id = p_tenant_id;
 
  -- Obtener datos de la empresa (snapshot)
  SELECT
    COALESCE(s.empresa_razon_social, s.name),
    s.empresa_ruc,
    s.empresa_direccion
  INTO v_emp_nombre, v_emp_ruc, v_emp_dir
  FROM stores s
  WHERE s.id = p_tenant_id;
 
  -- Insertar
  INSERT INTO reclamaciones (
    tenant_id, numero_correlativo,
    nombre, dni, tipo, descripcion,
    empresa_nombre, empresa_ruc, empresa_direccion
  ) VALUES (
    p_tenant_id, v_next_num,
    p_nombre, p_dni, p_tipo, p_descripcion,
    v_emp_nombre, v_emp_ruc, v_emp_dir
  )
  RETURNING reclamaciones.id, reclamaciones.fecha
    INTO v_id, v_fecha;
 
  RETURN QUERY
    SELECT v_id, v_next_num, v_fecha, v_emp_nombre, v_emp_ruc, v_emp_dir;
END;
$$;
 
-- 5. RLS
ALTER TABLE reclamaciones ENABLE ROW LEVEL SECURITY;
 
-- Inserción solo via RPC (SECURITY DEFINER), pero también permitimos directo:
CREATE POLICY "anon_insert_reclamaciones"
  ON reclamaciones FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
 
-- Lectura solo para autenticados (dueño de tienda y superadmin)
CREATE POLICY "autenticados_select_reclamaciones"
  ON reclamaciones FOR SELECT
  TO authenticated
  USING (true);
 
-- Actualización de estado solo para autenticados
CREATE POLICY "autenticados_update_reclamaciones"
  ON reclamaciones FOR UPDATE
  TO authenticated
  USING (true);
 
-- 6. Permitir que la RPC sea ejecutada por anon
GRANT EXECUTE ON FUNCTION insert_reclamacion TO anon, authenticated;
