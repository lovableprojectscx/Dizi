-- Migración Módulo 5: Migración de Modelos y Novedades de Banners en Stores
-- Idempotente y reversible mediante columnas de respaldo `legacy_model` y `legacy_niche`.

-- 1. Agregar columnas de respaldo si no existen
ALTER TABLE stores ADD COLUMN IF NOT EXISTS legacy_model text;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS legacy_niche text;

-- 2. Respaldar valores originales antes de migrar
UPDATE stores 
SET 
  legacy_model = model,
  legacy_niche = niche
WHERE legacy_model IS NULL;

-- 3. Mapear modelos heredados a las 15 estructuras unificadas
UPDATE stores
SET model = CASE
  WHEN legacy_model = 'bloom' AND legacy_niche = 'floreria' THEN 'bloom_floral'
  WHEN legacy_model = 'bloom' THEN 'bloom_general'
  WHEN legacy_model = 'boutique' THEN 'boutique'
  WHEN legacy_model = 'clasico' THEN 'hero'
  WHEN legacy_model = 'forest_deep' THEN 'tiles'
  WHEN legacy_model = 'vibe' THEN 'spotlight'
  WHEN legacy_model = 'editorial' THEN 'editorial'
  WHEN legacy_model = 'diagonal' THEN 'diagonal'
  WHEN legacy_model = 'arch_studio' THEN 'arch'
  WHEN legacy_model = 'portada' THEN 'banner_grid'
  WHEN legacy_model = 'bite' THEN 'bite'
  WHEN legacy_model = 'nature' THEN 'nature'
  WHEN legacy_model = 'lookbook' THEN 'lookbook'
  WHEN legacy_model = 'dark_fashion' THEN 'tiles'
  WHEN legacy_model = 'vibrante' THEN 'spotlight'
  WHEN legacy_model = 'eco' THEN 'nature'
  WHEN legacy_model = 'corporativo' THEN 'hero'
  WHEN legacy_model = 'aurora' THEN 'overlay'
  WHEN legacy_model = 'slash' THEN 'diagonal'
  WHEN legacy_model = 'minimalista' THEN 'grid'
  ELSE model
END
WHERE legacy_model IS NOT NULL;
