-- banner_image: imagen de portada para el modelo "portada"
alter table stores add column if not exists banner_image text;

-- banner_title: título personalizado del banner de portada
alter table stores add column if not exists banner_title text;
