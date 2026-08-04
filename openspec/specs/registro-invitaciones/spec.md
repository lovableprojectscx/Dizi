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

### Requisito: Selección de Modelo de Catálogo sin Restricción por Plan
Durante el registro en 3 pasos, el comerciante DEBE poder seleccionar libremente cualquiera de los modelos de diseño visuales (Minimalista, Clásico, Vibrante, Eco Hero, Nature Mint, Nocturno, Elite +, Boutique, Bite, Hero, Spotlight, etc.) sin bloqueos por nivel de plan.

#### Escenario: Elección libre de diseño en Plan Semilla o Superior
- **Dado** que un usuario se registra en cualquier plan (Semilla, Emprendedor, Pro, Ilimitado)
- **Cuando** llega al Paso 2 (Diseño)
- **Entonces** todos los modelos se muestran 100% desbloqueados para su libre elección

## Trazabilidad
Casos de prueba: CP-10, CP-11 · E2E-02 · Código: `src/routes/register.tsx`, `src/routes/admin.diseno.tsx`, migración `20260804153500_fix_get_public_store_allow_all_models.sql`
