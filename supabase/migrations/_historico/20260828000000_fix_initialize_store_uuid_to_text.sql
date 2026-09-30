-- =========================================================================================
-- MIGRACIÓN: Corrección de tipo de datos en initialize_store (UUID -> TEXT)
-- Fecha: 2026-08-28
-- Descripción: Cambia los parámetros p_id y p_category_id de uuid a text para aceptar
--              los IDs generados por el cliente (ej: s_xxxxxx, c_xxxxxx).
-- =========================================================================================

-- 1. Eliminar versiones anteriores con firma de tipo uuid
DROP FUNCTION IF EXISTS public.initialize_store(uuid, text, text, text, text, text, uuid, text, text, uuid);
DROP FUNCTION IF EXISTS public.initialize_store(text, text, text, text, text, text, uuid, text, text, text);

-- 2. Crear initialize_store con p_id y p_category_id como TEXT
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
AS $$
BEGIN
  -- Insertar tienda
  INSERT INTO public.stores (
    id, slug, name, phone, country_code, plan, owner_id, model, active, is_published
  ) VALUES (
    p_id, p_slug, p_name, p_phone, p_country_code, p_plan, p_owner_id, p_model, true, true
  );

  -- Insertar categoría inicial
  INSERT INTO public.categories (
    id, store_id, name
  ) VALUES (
    p_category_id, p_id, 'General'
  );

  -- Insertar productos de ejemplo con URLs de Unsplash ligeras
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
