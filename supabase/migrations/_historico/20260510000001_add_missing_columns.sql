-- Agrega columnas que pueden faltar en producción si la migración inicial
-- no se aplicó correctamente o la tabla fue creada manualmente.

-- model: el diseño visual seleccionado
alter table stores add column if not exists model text default 'minimalista';

-- brand_color: color de acento personalizado
alter table stores add column if not exists brand_color text;

-- bg_color: color de fondo personalizado (nuevo)
alter table stores add column if not exists bg_color text;

-- owner_id: para vincular tienda a usuario auth
alter table stores add column if not exists owner_id uuid;

-- whatsapp_clicks: contador de clics en el botón de WhatsApp
alter table stores add column if not exists whatsapp_clicks integer default 0;

-- niche: rubro del negocio
alter table stores add column if not exists niche text;
