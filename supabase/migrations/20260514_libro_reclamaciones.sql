-- ============================================================
-- LIBRO DE RECLAMACIONES v3 — Conforme a normativa vigente
-- ============================================================
 
-- 0. Limpieza profunda
DROP TABLE IF EXISTS reclamaciones CASCADE;
DROP FUNCTION IF EXISTS insert_reclamacion(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS insert_reclamacion(TEXT, TEXT, TEXT, TEXT, TEXT);
 
-- 1. Campos de empresa en tabla stores ──────────────────────
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS libro_reclamaciones_activo  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS empresa_ruc                 TEXT,
  ADD COLUMN IF NOT EXISTS empresa_razon_social        TEXT,
  ADD COLUMN IF NOT EXISTS empresa_direccion           TEXT;
 
-- 2. Tabla reclamaciones (v3 — Conformidad Legal) ───────────
CREATE TABLE IF NOT EXISTS reclamaciones (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             TEXT        NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  numero_correlativo    INTEGER     NOT NULL,
  fecha                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  estado                TEXT        NOT NULL DEFAULT 'pendiente'
                          CHECK (estado IN ('pendiente', 'en_revision', 'resuelto')),
  fecha_respuesta       TIMESTAMPTZ,
  respuesta_proveedor   TEXT,
  empresa_nombre        TEXT        NOT NULL,
  empresa_ruc           TEXT,
  empresa_direccion     TEXT,
  empresa_url           TEXT,
  consumidor_nombre     TEXT        NOT NULL,
  consumidor_tipo_doc   TEXT        NOT NULL DEFAULT 'DNI'
                          CHECK (consumidor_tipo_doc IN ('DNI','CE','Pasaporte','RUC')),
  consumidor_num_doc    TEXT        NOT NULL,
  consumidor_domicilio  TEXT,
  consumidor_telefono   TEXT,
  consumidor_email      TEXT,
  es_menor_edad         BOOLEAN     NOT NULL DEFAULT false,
  tutor_nombre          TEXT,
  tutor_num_doc         TEXT,
  bien_descripcion      TEXT,
  bien_monto            NUMERIC(10,2),
  tipo                  TEXT        NOT NULL CHECK (tipo IN ('queja', 'reclamo')),
  descripcion           TEXT        NOT NULL,
  pedido_consumidor     TEXT,
  UNIQUE (tenant_id, numero_correlativo)
);
 
-- 3. Índices
CREATE INDEX IF NOT EXISTS reclamaciones_tenant_id_idx  ON reclamaciones(tenant_id);
CREATE INDEX IF NOT EXISTS reclamaciones_fecha_idx      ON reclamaciones(fecha DESC);
CREATE INDEX IF NOT EXISTS reclamaciones_estado_idx     ON reclamaciones(estado);
 
-- 4. RPC: inserción con correlativo por tenant
CREATE OR REPLACE FUNCTION insert_reclamacion(
  p_tenant_id           TEXT,
  p_consumidor_nombre   TEXT,
  p_consumidor_tipo_doc TEXT,
  p_consumidor_num_doc  TEXT,
  p_consumidor_domicilio TEXT,
  p_consumidor_telefono TEXT,
  p_consumidor_email    TEXT,
  p_es_menor_edad       BOOLEAN,
  p_tutor_nombre        TEXT,
  p_tutor_num_doc       TEXT,
  p_bien_descripcion    TEXT,
  p_bien_monto          NUMERIC,
  p_tipo                TEXT,
  p_descripcion         TEXT,
  p_pedido_consumidor   TEXT
)
RETURNS TABLE (
  id                    UUID,
  numero_correlativo    INTEGER,
  fecha                 TIMESTAMPTZ,
  empresa_nombre        TEXT,
  empresa_ruc        TEXT,
  empresa_direccion  TEXT,
  empresa_url           TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_num      INTEGER;
  v_emp_nombre    TEXT;
  v_emp_ruc       TEXT;
  v_emp_dir       TEXT;
  v_emp_url       TEXT;
  v_id            UUID;
  v_fecha         TIMESTAMPTZ;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_tenant_id));
 
  SELECT COALESCE(MAX(r.numero_correlativo), 0) + 1
    INTO v_next_num
    FROM reclamaciones r
   WHERE r.tenant_id = p_tenant_id;
 
  SELECT
    COALESCE(s.empresa_razon_social, s.name),
    s.empresa_ruc,
    s.empresa_direccion,
    concat('dizi.pe/t/', s.slug)
  INTO v_emp_nombre, v_emp_ruc, v_emp_dir, v_emp_url
  FROM stores s
  WHERE s.id = p_tenant_id;
 
  INSERT INTO reclamaciones (
    tenant_id, numero_correlativo,
    empresa_nombre, empresa_ruc, empresa_direccion, empresa_url,
    consumidor_nombre, consumidor_tipo_doc, consumidor_num_doc,
    consumidor_domicilio, consumidor_telefono, consumidor_email,
    es_menor_edad, tutor_nombre, tutor_num_doc,
    bien_descripcion, bien_monto,
    tipo, descripcion, pedido_consumidor
  ) VALUES (
    p_tenant_id, v_next_num,
    v_emp_nombre, v_emp_ruc, v_emp_dir, v_emp_url,
    p_consumidor_nombre, p_consumidor_tipo_doc, p_consumidor_num_doc,
    p_consumidor_domicilio, p_consumidor_telefono, p_consumidor_email,
    p_es_menor_edad, p_tutor_nombre, p_tutor_num_doc,
    p_bien_descripcion, p_bien_monto,
    p_tipo, p_descripcion, p_pedido_consumidor
  )
  RETURNING reclamaciones.id, reclamaciones.fecha
    INTO v_id, v_fecha;
 
  RETURN QUERY
    SELECT v_id, v_next_num, v_fecha, v_emp_nombre, v_emp_ruc, v_emp_dir, v_emp_url;
END;
$$;
 
-- 5. RLS
ALTER TABLE reclamaciones ENABLE ROW LEVEL SECURITY;
 
CREATE POLICY "anon_insert_reclamaciones"
  ON reclamaciones FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
 
CREATE POLICY "autenticados_select_reclamaciones"
  ON reclamaciones FOR SELECT
  TO authenticated
  USING (true);
 
CREATE POLICY "autenticados_update_reclamaciones"
  ON reclamaciones FOR UPDATE
  TO authenticated
  USING (true);
 
-- 6. Permisos RPC
GRANT EXECUTE ON FUNCTION insert_reclamacion TO anon, authenticated;
