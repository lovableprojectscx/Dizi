-- ============================================================
-- LIBRO DE RECLAMACIONES — Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Campo en tabla stores
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS libro_reclamaciones_activo BOOLEAN NOT NULL DEFAULT false;

-- 2. Tabla de reclamaciones
CREATE TABLE IF NOT EXISTS reclamaciones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  nombre        TEXT NOT NULL,
  dni           TEXT NOT NULL,
  tipo          TEXT NOT NULL CHECK (tipo IN ('queja', 'reclamo')),
  descripcion   TEXT NOT NULL,
  fecha         TIMESTAMPTZ NOT NULL DEFAULT now(),
  estado        TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_revision', 'resuelto'))
);

-- 3. RLS: cualquiera puede INSERT (clientes del catálogo público)
ALTER TABLE reclamaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera puede insertar reclamaciones"
  ON reclamaciones FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Solo el superadmin (authenticated) puede leer todas las reclamaciones
CREATE POLICY "Solo autenticados pueden leer reclamaciones"
  ON reclamaciones FOR SELECT
  TO authenticated
  USING (true);

-- Solo autenticados pueden actualizar el estado
CREATE POLICY "Solo autenticados pueden actualizar reclamaciones"
  ON reclamaciones FOR UPDATE
  TO authenticated
  USING (true);

-- 4. Índice para consultas por tienda
CREATE INDEX IF NOT EXISTS reclamaciones_tenant_id_idx ON reclamaciones(tenant_id);
CREATE INDEX IF NOT EXISTS reclamaciones_fecha_idx ON reclamaciones(fecha DESC);
