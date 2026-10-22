-- Migración: Actualizar modelos de tienda a sus identificadores oficiales (Grupo Seguro)
-- Encargo N2: Nombres oficiales de diseño sin alterar el comportamiento visual.
--
-- Verificación de equivalencia técnica:
-- - minimalista  -> grid        (mismo layout "grid", misma config MODEL_CONFIGS["minimalista"])
-- - arch_studio  -> arch        (mismo layout "arch", misma config MODEL_CONFIGS["arch_studio"])
-- - vibrante     -> overlay     (mismo layout "overlay", misma config MODEL_CONFIGS["vibrante"])
-- - dark_fashion -> magazine    (mismo layout "magazine", misma config MODEL_CONFIGS["dark_fashion"], mismo gradiente)
-- - eco          -> hero        (mismo layout "hero", misma config MODEL_CONFIGS["eco"])
-- - elite        -> banner_grid (mismo layout "banner_grid", misma config MODEL_CONFIGS["elite"])

UPDATE stores SET model = CASE model
  WHEN 'minimalista' THEN 'grid'
  WHEN 'arch_studio' THEN 'arch'
  WHEN 'vibrante' THEN 'overlay'
  WHEN 'dark_fashion' THEN 'magazine'
  WHEN 'eco' THEN 'hero'
  WHEN 'elite' THEN 'banner_grid'
END
WHERE model IN ('minimalista', 'arch_studio', 'vibrante', 'dark_fashion', 'eco', 'elite');

-- ============================================================================
-- SQL DE REVERSA (Rollback comentado):
-- ============================================================================
-- UPDATE stores SET model = CASE model
--   WHEN 'grid' THEN 'minimalista'
--   WHEN 'arch' THEN 'arch_studio'
--   WHEN 'overlay' THEN 'vibrante'
--   WHEN 'magazine' THEN 'dark_fashion'
--   WHEN 'hero' THEN 'eco'
--   WHEN 'banner_grid' THEN 'elite'
-- END
-- WHERE model IN ('grid', 'arch', 'overlay', 'magazine', 'hero', 'banner_grid');
