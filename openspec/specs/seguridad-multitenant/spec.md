# Spec: Seguridad Multi-tenant

> Corregido el 29 sep 2026. Estado real en `04-TECNICA/FUENTE-DE-VERDAD.md` y `SEGURIDAD.md` §0.

## Propósito
Garantizar el aislamiento absoluto de datos entre comercios y prevenir la escalación de privilegios. Cubre RF-07 y RF-08.

## Requisitos

### Requisito: Aislamiento por RLS (RF-07)
Toda consulta a tablas críticas (`stores`, `products`, `categories`, `reclamaciones`, `invites` y el bucket `images`) DEBE filtrarse en PostgreSQL mediante políticas Row Level Security basadas en `auth.uid()`.

#### Escenario: Acceso cruzado bloqueado
- **Dado** el comerciante A autenticado
- **Cuando** intenta modificar o borrar datos o fotos del comercio B (incluso por API directa)
- **Entonces** la base lo rechaza (0 filas afectadas o error de permisos)
- **Nota:** los productos y datos de tiendas **publicadas** son públicos por diseño y se pueden leer

### Requisito: Anti-escalación de roles (RF-08)
El trigger `trg_user_sync_role` DEBE sobrescribir cualquier intento de autoasignarse `super_admin` desde metadatos públicos.

#### Escenario: Rol inyectado degradado
- **Dado** un registro que envía `role = "super_admin"` en `raw_user_meta_data`
- **Cuando** la BD procesa el insert
- **Entonces** el rol queda forzado a `store_owner`

## Trazabilidad
Casos de prueba: CP-12, CP-13 · Código: migraciones `20260514000000_multitenant_rls.sql`, `20260611000000_security_mitigations.sql` · Ver también `docs/tecnica/SEGURIDAD.md`
