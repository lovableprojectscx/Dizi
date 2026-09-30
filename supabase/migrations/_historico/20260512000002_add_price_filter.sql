-- Activar/desactivar filtro de precios por tienda
alter table stores
  add column if not exists price_filter_enabled boolean not null default false;
