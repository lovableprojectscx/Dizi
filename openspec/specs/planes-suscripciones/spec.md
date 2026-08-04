# Spec: Planes y Suscripciones

## Propósito
Aplicar límites por plan y degradación automática con periodos de gracia al vencer la suscripción. Cubre RF-05 y RF-06.

## Requisitos

### Requisito: Estructura Tarifaria y Límites por Plan (RF-05)
Cada plan DEBE definir su precio mensual, tarifa anual (con 25% de ahorro) y el límite máximo de productos activos:
- **Semilla**: Gratis (S/ 0) — Límite de **20 productos**.
- **Emprendedor**: S/ 19.90 /mes — S/ 179 /año (Ahorras S/ 60) — Límite de **100 productos**.
- **Catálogo Pro**: S/ 39.90 /mes — S/ 359 /año (Ahorras S/ 120) — Límite de **300 productos**.
- **Ilimitado**: S/ 69.90 /mes — S/ 629 /año (Ahorras S/ 210) — Límite de **1,000 productos**.
Alcanzado el límite del plan activo o efectivo, la creación o reactivación de productos se deniega con invitación al upgrade.

#### Escenario: Límite superado en Plan Emprendedor
- **Dado** una tienda Emprendedor con 100 productos activos
- **Cuando** intenta agregar el N.º 101 o reactivar uno inactivo
- **Entonces** la operación se deniega y se muestra la invitación de upgrade a Catálogo Pro (300 productos)

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
