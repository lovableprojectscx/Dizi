-- =============================================================================
-- MIGRACIÓN: Configuración de Políticas de RLS en storage.objects para Bucket 'images'
-- Fecha: 2026-07-22
-- Descripción:
--   1. Permite acceso de lectura público a las imágenes para cualquier visitante.
--   2. Permite a usuarios autenticados subir, modificar y borrar imágenes del bucket 'images'.
-- =============================================================================

-- Asegurar RLS activo en storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Permitir lectura pública a cualquier usuario (anon y authenticated)
CREATE POLICY "Public Read Access" ON storage.objects 
  FOR SELECT TO public USING (bucket_id = 'images');

-- 2. Permitir inserción a usuarios autenticados
CREATE POLICY "Authenticated Insert Access" ON storage.objects 
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'images');

-- 3. Permitir actualización a usuarios autenticados
CREATE POLICY "Authenticated Update Access" ON storage.objects 
  FOR UPDATE TO authenticated USING (bucket_id = 'images') WITH CHECK (bucket_id = 'images');

-- 4. Permitir eliminación a usuarios autenticados
CREATE POLICY "Authenticated Delete Access" ON storage.objects 
  FOR DELETE TO authenticated USING (bucket_id = 'images');
