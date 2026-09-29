-- Migración para Bio-Link y Ubicación Geográfica
alter table public.stores 
add column if not exists bio_description text,
add column if not exists location_lat double precision,
add column if not exists location_lng double precision,
add column if not exists location_address text,
add column if not exists quick_links jsonb default '[]'::jsonb,
add column if not exists bio_links_enabled boolean default false,
add column if not exists bio_logo text,
add column if not exists bio_banner text,
add column if not exists bio_theme text,
add column if not exists bio_button_style text,
add column if not exists bio_button_color text,
add column if not exists bio_button_text_color text;

