-- =========================================================================================
-- MIGRACIÓN: Optimización de imágenes de muestra y limpieza de Base64
-- Fecha: 2026-05-27
-- Descripción: Reemplaza las imágenes base64 de initialize_store por URLs ligeras de Unsplash
--              y limpia registros antiguos con base64 para evitar bloat en consultas SELECT.
-- =========================================================================================

-- 1. Actualizar initialize_store para usar URLs públicas ligeras en productos de muestra
CREATE OR REPLACE FUNCTION initialize_store(
  p_id uuid,
  p_slug text,
  p_name text,
  p_phone text,
  p_country_code text,
  p_plan text,
  p_owner_id uuid,
  p_model text,
  p_niche text,
  p_category_id uuid
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

  -- Insertar productos de ejemplo con URLs de Unsplash (pesan pocos bytes de texto)
  INSERT INTO public.products (
    id, store_id, category_id, name, price, image, description, is_on_sale, visible, is_sample
  ) VALUES 
  (
    gen_random_uuid(), p_id, p_category_id, 
    'Producto de Ejemplo 1', 49.90, 
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80', 
    'Esta es una descripción de ejemplo para tu primer producto. Puedes editarla o eliminarla desde el panel de administración.', 
    false, true, true
  ),
  (
    gen_random_uuid(), p_id, p_category_id, 
    'Producto en Oferta 2', 99.90, 
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80', 
    'Este es un producto de ejemplo con precio de oferta. Puedes configurar precios anteriores para mostrar descuentos.', 
    true, true, true
  ),
  (
    gen_random_uuid(), p_id, p_category_id, 
    'Producto de Ejemplo 3', 29.90, 
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80', 
    'Otro producto de muestra para decorar tu catálogo inicial.', 
    false, true, true
  );
END;
$$;

-- 2. Limpieza de URLs Base64 pesadas de productos existentes (caída a imagen de stock por defecto)
UPDATE public.products 
SET image = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80' 
WHERE image LIKE 'data:image/%';

-- 3. Limpieza de URLs Base64 de tiendas existentes (caída a NULL para usar iniciales/estilos por defecto)
UPDATE public.stores
SET logo = NULL
WHERE logo LIKE 'data:image/%';

UPDATE public.stores
SET banner_image = NULL
WHERE banner_image LIKE 'data:image/%';

UPDATE public.stores
SET bio_logo = NULL
WHERE bio_logo LIKE 'data:image/%';

UPDATE public.stores
SET bio_banner = NULL
WHERE bio_banner LIKE 'data:image/%';

UPDATE public.stores
SET bio_bg_image = NULL
WHERE bio_bg_image LIKE 'data:image/%';
