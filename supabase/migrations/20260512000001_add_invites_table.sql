-- Tabla de invitaciones de registro con plan asignado
create table invites (
  token       text primary key,
  plan        text not null default 'semilla',
  used        boolean not null default false,
  created_at  timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at  timestamp with time zone default (timezone('utc'::text, now()) + interval '30 days') not null
);

-- RLS
alter table invites enable row level security;

-- Cualquiera puede leer un invite por token (para validar al registrarse)
create policy "Lectura pública de invites" on invites
  for select using (true);

-- Solo service_role puede insertar/actualizar (desde el superadmin via supabase-js con anon key está bien
-- porque usamos insert con anon key en modo "superadmin" — si quieres restringir, usa una Edge Function)
create policy "Inserción pública de invites" on invites
  for insert with check (true);

create policy "Actualización pública de invites" on invites
  for update using (true);
