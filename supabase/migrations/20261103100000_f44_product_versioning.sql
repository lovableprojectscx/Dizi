-- ============================================================================
-- Migración F44: Control de versiones optimista y timestamp para products
-- Descripción: Agrega las columnas version y updated_at a la tabla products,
-- junto con el disparador BEFORE UPDATE que incrementa version automáticamente.
-- ============================================================================

-- 1. Agregar columnas version y updated_at a la tabla products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now());

-- 2. Función disparadora para incrementar version y actualizar updated_at
CREATE OR REPLACE FUNCTION bump_product_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.version := OLD.version + 1;
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- 3. Disparador BEFORE UPDATE sobre products
DROP TRIGGER IF EXISTS trg_bump_product_version ON products;
CREATE TRIGGER trg_bump_product_version
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION bump_product_version();

-- Comentarios de documentación en catálogo PostgreSQL
COMMENT ON COLUMN products.version IS 'Versión incremental del producto para control de concurrencia optimista (F44).';
COMMENT ON COLUMN products.updated_at IS 'Fecha y hora de última modificación del producto (F44).';
COMMENT ON FUNCTION bump_product_version() IS 'Incrementa NEW.version y actualiza NEW.updated_at en cada UPDATE de products (F44).';

-- ============================================================================
-- SQL PARA REVERTIR (en orden inverso estricto, para ejecutar solo en caso de rollback):
-- ============================================================================
-- DROP TRIGGER IF EXISTS trg_bump_product_version ON products;
-- DROP FUNCTION IF EXISTS bump_product_version();
-- ALTER TABLE products DROP COLUMN IF EXISTS updated_at;
-- ALTER TABLE products DROP COLUMN IF EXISTS version;
