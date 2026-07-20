# Spec: Registro por Invitaciones

## Propósito
Controlar el alta de tiendas mediante tokens de invitación emitidos por el superadmin. Cubre RF-04.

## Requisitos

### Requisito: Token válido, vigente y de un solo uso (RF-04)
El registro DEBE exigir un token vigente, no usado y asociado a un plan; al completarse, el token se marca `used = true`. La validación se hace de forma "ciega" vía RPC `check_invite` (SECURITY DEFINER).

#### Escenario: Token válido
- **Dado** un acceso a `/register?token=TOKEN_PRO_ACTIVO` con token vigente
- **Cuando** el comerciante completa el registro
- **Entonces** se crea la tienda asociada al Plan Pro y el token queda usado

#### Escenario: Token vencido o usado
- **Dado** un acceso con token expirado o ya utilizado
- **Cuando** `check_invite` lo valida
- **Entonces** el registro se bloquea con "Invitación inválida o expirada"

## Trazabilidad
Casos de prueba: CP-10, CP-11 · E2E-02 · Código: `src/routes/register.tsx`, migración `20260617020000_secure_invites_lookup.sql`
