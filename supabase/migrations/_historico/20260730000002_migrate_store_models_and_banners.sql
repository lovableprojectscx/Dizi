-- Migración Módulo 5: Migración de Modelos y Banners en Stores
-- Idempotente y reversible mediante columnas de respaldo `legacy_model` y `legacy_niche`.

-- 1. Agregar columnas de respaldo y arreglo de banners si no existen
ALTER TABLE stores ADD COLUMN IF NOT EXISTS legacy_model text;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS legacy_niche text;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS banners text[] DEFAULT '{}';

-- 2. Respaldar valores originales antes de migrar (solo en la primera ejecución)
UPDATE stores 
SET 
  legacy_model = model,
  legacy_niche = niche
WHERE legacy_model IS NULL;

-- 3. Mapear modelos heredados a las 15 estructuras unificadas (idéntico a resolveStructureId de TypeScript)
UPDATE stores
SET model = CASE
  WHEN legacy_model = 'bloom' AND legacy_niche = 'floreria' THEN 'bloom_floral'
  WHEN legacy_model = 'bloom' THEN 'bloom_general'
  WHEN legacy_model IN ('minimalista', 'clasico', 'nature_mint', 'forest_deep') THEN 'grid'
  WHEN legacy_model IN ('vibrante', 'nocturno', 'sunset_glow') THEN 'overlay'
  WHEN legacy_model IN ('eco', 'elite') THEN 'hero'
  WHEN legacy_model = 'boutique' THEN 'spotlight'
  WHEN legacy_model = 'corporativo' THEN 'editorial'
  WHEN legacy_model = 'aurora' THEN 'tiles'
  WHEN legacy_model IN ('dark_fashion', 'luxury') THEN 'magazine'
  WHEN legacy_model = 'slash' THEN 'diagonal'
  WHEN legacy_model = 'arch_studio' THEN 'arch'
  WHEN legacy_model = 'portada' THEN 'banner_grid'
  WHEN legacy_model = 'bite' THEN 'bite'
  WHEN legacy_model = 'nature' THEN 'nature'
  WHEN legacy_model = 'lookbook' THEN 'lookbook'
  ELSE model
END
WHERE legacy_model IS NOT NULL;

-- 4. Convertir banner_image con separador '|||' al arreglo ordenado banners text[]
UPDATE stores
SET 
  banners = string_to_array(banner_image, '|||'),
  banner_image = split_part(banner_image, '|||', 1)
WHERE banner_image LIKE '%|||%';
