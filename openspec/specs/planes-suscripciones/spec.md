# Spec: Planes y Suscripciones

## Propósito
Aplicar límites por plan y degradación automática con periodos de gracia al vencer la suscripción. Cubre RF-05 y RF-06.

## Requisitos

### Requisito: Límites por plan (RF-05)
Cada plan DEBE limitar la cantidad de productos activos (semilla = 20). Alcanzado el límite, agregar o reactivar productos se deniega con invitación al upgrade.

#### Escenario: Límite superado
- **Dado** una tienda semilla con 20 productos activos
- **Cuando** intenta agregar el N.º 21 o reactivar uno inactivo
- **Entonces** la operación se deniega y se muestra la invitación de upgrade

### Requisito: Degradación con gracia (RF-06)
Al vencer la suscripción se aplican dos periodos: 3 días de gracia de funciones (`GRACE_DAYS`) y 15 de diseño (`MODEL_GRACE_DAYS`).

#### Escenario: Dentro de la gracia de funciones
- **Dado** un plan Pro vencido hace 2 días
- **Cuando** se evalúa `getEffectivePlan`
- **Entonces** la tienda conserva todas las funciones del plan Pro

#### Escenario: Gracia superada
- **Dado** un plan vencido hace 4 días
- **Cuando** se evalúa el plan efectivo
- **Entonces** degrada a "semilla" (20 productos, etiqueta "Modo Limitado")

#### Escenario: Gracia visual
- **Dado** un plan vencido hace 10 días
- **Cuando** se carga el catálogo público
- **Entonces** conserva el diseño premium con límites semilla; al día 16 revierte a "minimalista"

## Trazabilidad
Casos de prueba: CP-06 a CP-09 · E2E-05 · Código: `src/lib/types.ts` (getEffectivePlan, getEffectiveProductLimit, getEffectiveModel)
