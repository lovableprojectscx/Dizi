-- 1. Tabla de Tiendas
create table stores (
  id text default gen_random_uuid()::text primary key,
  slug text unique not null,
  name text not null,
  phone text,
  country_code text default '51',
  logo text,
  plan text default 'semilla',
  model text default 'minimalista',
  brand_color text,
  active boolean default true,
  is_published boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabla de Categorías
create table categories (
  id text default gen_random_uuid()::text primary key,
  store_id text references stores(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabla de Productos
create table products (
  id text default gen_random_uuid()::text primary key,
  store_id text references stores(id) on delete cascade not null,
  category_id text references categories(id) on delete set null,
  name text not null,
  price numeric not null,
  original_price numeric,
  image text,
  description text,
  is_on_sale boolean default false,
  visible boolean default true,
  is_sample boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS (Seguridad)
alter table stores enable row level security;
alter table categories enable row level security;
alter table products enable row level security;

-- Políticas de lectura pública
create policy "Lectura pública de tiendas" on stores for select using (true);
create policy "Lectura pública de categorías" on categories for select using (true);
create policy "Lectura pública de productos" on products for select using (true);

-- Políticas de edición (por ahora simplificadas, en el futuro se vincularán al auth.uid())
create policy "Edición pública de tiendas" on stores for update using (true);
create policy "Edición pública de categorías" on categories for all using (true);
create policy "Edición pública de productos" on products for all using (true);
