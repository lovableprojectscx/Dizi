# Informe de Ciberseguridad — DIZI SaaS

Fecha: 2026-06-11
Sistema: Catálogo Digital Multi-tenant (React + TypeScript + Supabase)

---

## ✅ APLICADO HOY (sin riesgo, ya en `vercel.json`)

Se añadieron 3 cabeceras de seguridad al bloque global de `vercel.json`. Son
puramente aditivas y reversibles (respaldo en `vercel.json.bak`).

| Cabecera | Qué protege |
|----------|-------------|
| `Content-Security-Policy` | Mitiga XSS e inyección de recursos. Solo permite los orígenes que DIZI ya usa: Supabase, Unsplash, WhatsApp (wa.me), Leaflet/OpenStreetMap, Google Fonts y unpkg. |
| `Strict-Transport-Security` (HSTS) | Fuerza HTTPS durante 2 años, evita downgrade a HTTP y ataques man-in-the-middle. |
| `Permissions-Policy` | Desactiva cámara, micrófono y pagos; deja geolocalización solo para el propio sitio (necesaria para el mapa del bio-link). |

### CSP — orígenes permitidos (verificados contra el código)
- `script-src`: incluye `'unsafe-inline'` y `'unsafe-eval'` porque la SPA (Vite) y los
  scripts inline de `index.html` los requieren. Sin esto, la app no carga.
- `img-src`: Supabase Storage, Unsplash, tiles de OpenStreetMap, unpkg (íconos Leaflet).
- `connect-src`: Supabase (REST + Realtime websocket) y Nominatim (geocoding del mapa).
- `form-action`: permite el envío a `https://wa.me` (pedidos por WhatsApp).

> ⚠️ Tras desplegar, abre la consola del navegador en producción y revisa si hay
> errores `Refused to load ... because it violates CSP`. Si aparece algún dominio
> legítimo bloqueado, agrégalo a la directiva correspondiente. Para una transición
> sin riesgo puedes usar primero `Content-Security-Policy-Report-Only` (solo reporta,
> no bloquea) y, cuando confirmes que no hay falsos positivos, cambiarlo a
> `Content-Security-Policy`.

### Cómo revertir
```bash
cp vercel.json.bak vercel.json
```

---

## ⏳ RECOMENDADAS (riesgo medio — requieren prueba antes de aplicar)

Estas son vulnerabilidades reales pero tocan SQL/auth. No las apliqué para no
arriesgar el panel super admin ni el alta de tiendas. Aquí queda el parche listo.

### 1. Funciones de suscripción sin control de acceso — SEVERIDAD ALTA

`activate_subscription`, `cancel_subscription` y `extend_subscription`
(`20260513_subscription_management.sql`) son `SECURITY DEFINER` pero **no validan
quién las llama** ni revocan el permiso de ejecución a usuarios normales. Un usuario
autenticado podría llamar `extend_subscription('store_id_de_otro')` y regalarse plan
premium, o cancelar la suscripción de otro comercio.

**Mitigación (nueva migración SQL):**
```sql
-- Revocar ejecución a clientes; solo el service_role (super admin server-side) podrá llamarlas
REVOKE EXECUTE ON FUNCTION activate_subscription(text, text, int) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION cancel_subscription(text, text)        FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION extend_subscription(text, int)         FROM anon, authenticated;
-- Ajusta las firmas a las reales si difieren.
```
> Prueba antes: confirma que el panel super admin llama estas funciones vía
> service_role (Edge Function) y no con la anon key del navegador. Si hoy las llama
> con anon key, primero hay que mover esa lógica a una Edge Function, si no se romperá
> la gestión de planes.

### 2. Tabla `invites` con RLS abierta — SEVERIDAD MEDIA

En `20260512000001_add_invites_table.sql` las políticas son `insert with check (true)`
y `update using (true)`: cualquier anónimo puede crear invites o marcarlos como usados.

**Mitigación:**
```sql
DROP POLICY "Inserción pública de invites"   ON invites;
DROP POLICY "Actualización pública de invites" ON invites;
-- Mantener solo lectura pública por token (necesaria para validar el registro).
-- Crear/usar invites debe hacerse vía Edge Function con service_role.
```
> Prueba antes: el alta de tiendas valida el invite (SELECT) — eso sigue funcionando.
> Pero si el super admin **crea** invites con anon key desde el navegador, hay que
> mover esa creación a una Edge Function antes de aplicar el DROP.

### 3. Rol `super_admin` en `user_metadata` — SEVERIDAD MEDIA

`getUserRole` (`src/lib/auth.ts`) lee el rol desde `user_metadata`, que el propio
usuario **puede modificar** con `supabase.auth.updateUser()`. En teoría un usuario
podría auto-asignarse `super_admin`.

**Mitigación:**
1. Mover el rol a `app_metadata` (solo editable por service_role):
   ```sql
   -- Ejecutar una vez por el super admin, vía service_role
   UPDATE auth.users
   SET raw_app_meta_data = raw_app_meta_data || '{"role":"super_admin"}'
   WHERE email = 'TU_SUPERADMIN@dominio.com';
   ```
2. Cambiar `getUserRole` para leer de `app_metadata`:
   ```ts
   const meta = user.app_metadata as { role?: string } | undefined;
   ```
> Prueba antes: tras el cambio, cierra sesión y vuelve a entrar con el super admin
> para que el token recoja el nuevo `app_metadata`. Verifica que `/super/dashboard`
> sigue accesible.

> Nota importante: aunque `getUserRole` se usa para el ruteo del frontend, las
> políticas RLS del lado servidor (`auth.uid() = owner_id`) **no dependen de este rol**,
> así que el aislamiento de datos entre tenants no se ve afectado por este punto.

---

## Resumen de prioridad

1. **#1 (funciones de suscripción)** — la más crítica; corregir cuando puedas mover
   la lógica a Edge Function.
2. **#3 (rol en app_metadata)** — escalada de privilegios; rápida de probar.
3. **#2 (invites)** — depende del mismo patrón de Edge Function que #1.
4. **CSP/HSTS** — ✅ ya aplicado.
