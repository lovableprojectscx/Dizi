-- Migration: Store updated_at tracking and automatic touch triggers

-- 1. Añadir columna updated_at a stores si no existe
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Asegurar que stores existentes tengan un timestamp válido
UPDATE public.stores SET updated_at = NOW() WHERE updated_at IS NULL;

-- 3. Crear función de trigger para actualizar updated_at en stores
CREATE OR REPLACE FUNCTION public.handle_store_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'stores' THEN
    NEW.updated_at = NOW();
    RETURN NEW;
  ELSIF TG_TABLE_NAME = 'products' THEN
    IF TG_OP = 'DELETE' THEN
      UPDATE public.stores SET updated_at = NOW() WHERE id = OLD.store_id;
      RETURN OLD;
    ELSE
      UPDATE public.stores SET updated_at = NOW() WHERE id = NEW.store_id;
      RETURN NEW;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Triggers automáticos en stores y products
DROP TRIGGER IF EXISTS trg_stores_touch_updated_at ON public.stores;
CREATE TRIGGER trg_stores_touch_updated_at
BEFORE UPDATE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.handle_store_touch_updated_at();

DROP TRIGGER IF EXISTS trg_products_touch_store ON public.products;
CREATE TRIGGER trg_products_touch_store
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.handle_store_touch_updated_at();
