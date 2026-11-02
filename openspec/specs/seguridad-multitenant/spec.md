# Spec: Seguridad Multi-tenant

> Corregido el 29 sep 2026. Actualizado el 29 oct 2026 con el hotfix RLS de productos ocultos (PR #15). Estado real en `04-TECNICA/FUENTE-DE-VERDAD.md` y `SEGURIDAD.md` §0.

## Propósito
Garantizar el aislamiento absoluto de datos entre comercios, prevenir la escalación de privilegios y resguardar la privacidad de productos ocultos o en borrador frente a accesos anónimos. Cubre RF-07, RF-08 y la política de privacidad de catálogo.

## Requisitos

### Requisito: Aislamiento por RLS (RF-07)
Toda consulta a tablas críticas (`stores`, `products`, `categories`, `reclamaciones`, `invites` y el bucket `images`) DEBE filtrarse en PostgreSQL mediante políticas Row Level Security basadas en `auth.uid()`.

#### Escenario: Acceso cruzado bloqueado
- **Dado** el comerciante A autenticado
- **Cuando** intenta modificar o borrar datos o fotos del comercio B (incluso por API directa)
- **Entonces** la base lo rechaza (0 filas afectadas o error de permisos).

### Requisito: Restricción de Productos Ocultos a Clientes Públicos (Hotfix RLS)
La política de lectura pública `products_public_select` en PostgreSQL DEBE exigir estrictamente que `products.visible = true` para consultas públicas o de usuarios anónimos (`role = 'anon'`).
- Los clientes anónimos que consulten la tabla `products` de forma directa o vía API pública solo pueden leer productos de tiendas activas y publicadas que tengan `visible = true`.
- Los productos ocultos (`visible = false`) solo pueden ser leídos y gestionados por el dueño autenticado de la tienda (`stores.owner_id = auth.uid()`).

#### Escenario: Consulta anónima de productos ocultos
- **Dado** una tienda pública con 10 productos visibles y 3 productos ocultos
- **Cuando** un cliente anónimo consulta la tabla `products` con la clave pública anon
- **Entonces** la base de datos retorna únicamente los 10 productos con `visible = true`, bloqueando el acceso a los 3 productos ocultos (0 filas retornadas para estos).

#### Escenario: Acceso del dueño a su inventario completo
- **Dado** el dueño autenticado de la tienda
- **Cuando** consulta su lista de productos en el panel `/admin/productos`
- **Entonces** la política RLS le entrega tanto los productos visibles como los ocultos para su edición.

### Requisito: Anti-escalación de roles (RF-08)
El trigger `trg_user_sync_role` DEBE sobrescribir cualquier intento de autoasignarse `super_admin` desde metadatos públicos.

#### Escenario: Rol inyectado degradado
- **Dado** un registro que envía `role = "super_admin"` en `raw_user_meta_data`
- **Cuando** la BD procesa el insert
- **Entonces** el rol queda forzado a `store_owner`.

## Trazabilidad
Casos de prueba: CP-12, CP-13 · Vitest: `hotfix-rls-productos-ocultos.test.ts`, `security.test.ts` · Código: migraciones `20260514000000_multitenant_rls.sql`, `20260611000000_security_mitigations.sql`, `20261025100000_hotfix_rls_productos_ocultos.sql`.
