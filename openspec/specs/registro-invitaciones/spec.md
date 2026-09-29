# Spec: Registro e Invitaciones

> Corregido el 29 sep 2026 contra el código real (`src/routes/register.tsx`). Ver `REQUISITOS-FUNCIONALES.md` F10.

## Propósito
Permitir que cualquier negocio cree su tienda gratis, y que el superadmin regale planes con links de invitación.

## Requisitos

### Requisito: Registro abierto (F10)
Cualquier persona DEBE poder registrarse en `/register` sin invitación, en 3 pasos (negocio, diseño, cuenta), eligiendo país
(21 países), un slug libre (`check_slug_available`) y cualquier diseño. La tienda se crea con la RPC `initialize_store`
en plan Semilla con 3 productos de ejemplo.

#### Escenario: Registro sin invitación
- **Dado** un visitante en `/register`
- **Cuando** completa los 3 pasos
- **Entonces** se crea su tienda en plan Semilla y entra a `/admin`

### Requisito: Invitación opcional de un solo uso
Con `?invite=<token>` el registro DEBE validar el token con `check_invite` y, al crear la tienda, aplicar el plan, la duración
y el precio del token con `activate_subscription_with_invite`, que solo acepta al dueño de la tienda (o super admin) y marca
el token `used = true`.

#### Escenario: Invitación válida
- **Dado** un acceso a `/register?invite=TOKEN` vigente y no usado
- **Cuando** el comerciante completa el registro
- **Entonces** su tienda queda con el plan del token y el token queda usado

#### Escenario: Invitación vencida o usada
- **Dado** un token vencido o ya usado
- **Cuando** `check_invite` lo valida
- **Entonces** el registro sigue como registro normal (Semilla) **sin avisar al usuario** (solo `console.warn`, `register.tsx:733`). Mejora pendiente: mostrar "Invitación inválida o expirada"

### Requisito: Referidos
Con `?ref=<slug>` la tienda nueva guarda `referred_by`; la recompensa la entrega el superadmin (`process_referral_reward`).

### Requisito: Selección de diseño sin restricción por plan
Todos los diseños están disponibles en todos los planes, en el registro y después.

## Trazabilidad
Código: `src/routes/register.tsx`, `src/lib/store.ts` (`addStore`), `src/routes/super.promociones.tsx` · Pruebas: `tests/e2e/registro-paises.spec.ts`, `tests/e2e/user-journey-b6.spec.ts`
