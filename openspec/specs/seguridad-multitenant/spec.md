# Spec: Seguridad Multi-tenant

## Propósito
Garantizar el aislamiento absoluto de datos entre comercios y prevenir la escalación de privilegios. Cubre RF-07 y RF-08.

## Requisitos

### Requisito: Aislamiento por RLS (RF-07)
Toda consulta a tablas críticas (`stores`, `products`, `complaints`) DEBE filtrarse en PostgreSQL mediante políticas Row Level Security basadas en `auth.uid()`.

#### Escenario: Acceso cruzado bloqueado
- **Dado** el comerciante A autenticado
- **Cuando** consulta productos del comercio B (incluso por API directa)
- **Entonces** recibe 0 filas, sin error de aplicación

### Requisito: Anti-escalación de roles (RF-08)
El trigger `trg_user_sync_role` DEBE sobrescribir cualquier intento de autoasignarse `super_admin` desde metadatos públicos.

#### Escenario: Rol inyectado degradado
- **Dado** un registro que envía `role = "super_admin"` en `raw_user_meta_data`
- **Cuando** la BD procesa el insert
- **Entonces** el rol queda forzado a `store_owner`

## Trazabilidad
Casos de prueba: CP-12, CP-13 · Código: migraciones `20260514000000_multitenant_rls.sql`, `20260611000000_security_mitigations.sql` · Ver también `docs/tecnica/SEGURIDAD.md`
