-- Migración para personalización de fondo en el Bio-Link (Color e Imagen)
alter table public.stores 
add column if not exists bio_bg_image text,
add column if not exists bio_bg_color text;
