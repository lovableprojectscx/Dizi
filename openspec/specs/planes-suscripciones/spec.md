# Spec: Planes y Suscripciones

## Propósito
Aplicar límites por plan y degradación comercial automática con periodo de gracia al vencer la suscripción, manteniendo el diseño visual libre e intacto. Cubre RF-05 y RF-06.

## Requisitos

### Requisito: Estructura Tarifaria y Límites por Plan (RF-05)
Cada plan DEBE definir su precio mensual, tarifa anual (con 25% de ahorro) y el límite máximo de productos activos:
- **Semilla**: Gratis (S/ 0) — Límite de **20 productos**.
- **Emprendedor**: S/ 19.90 /mes — S/ 179 /año (Ahorras S/ 60) — Límite de **100 productos**.
- **Catálogo Pro**: S/ 39.90 /mes — S/ 359 /año (Ahorras S/ 120) — Límite de **300 productos**.
- **Ilimitado**: S/ 69.90 /mes — S/ 629 /año (Ahorras S/ 210) — Límite de **1,000 productos**.
Alcanzado el límite del plan activo o efectivo, la creación o reactivación de productos se deniega con invitación al upgrade.

### Requisito: Servicio Opcional de Configuración Asistida
El sistema DEBE ofrecer como servicio opcional llave en mano la **Configuración Asistida Dizi por S/ 79 (Pago Único)**, que incluye la carga de hasta 30 productos, banner de portada, categorías, perfil de Link en Bio y capacitación de 20 minutos por WhatsApp o Meet.

### Requisito: Toggle de Facturación Mensual / Anual en Landing Page
La Landing Page pública (`https://dizi.idenza.site`) DEBE incluir un selector interactivo **Mensual / Anual (Ahorra hasta 25%)**. Al activar el modo Anual, las tarjetas de precios DEBEN proyectar la tarifa anual total y mostrar el costo mensual equivalente reducido calculado dinámicamente (`annualPrice / 12`).

#### Escenario: Cambio a Facturación Anual
- **Dado** que un visitante se encuentra en la sección de precios de la Landing Page
- **Cuando** activa el selector de facturación Anual
- **Entonces** la tarjeta del Plan Emprendedor muestra "S/ 179 /año (S/ 14.92/m)", Catálogo Pro muestra "S/ 359 /año (S/ 29.92/m)" e Ilimitado muestra "S/ 629 /año (S/ 52.42/m)".

### Requisito: Tolerancia de 3 Días de Gracia y Cálculo Dinámico (RF-06)
Al vencer la fecha de suscripción (`plan_expires_at`), el sistema aplica un único periodo de tolerancia de **3 días de gracia** (`GRACE_DAYS = 3`).
- **El plan guardado en base de datos (`stores.plan`) NO cambia:** el plan efectivo se calcula dinámicamente en tiempo de ejecución (`getEffectivePlan(store)`).
- **Diseño libre e intacto (decisión de Jack, 30 sep 2026):** Todos los 15 diseños y temas están disponibles en todos los planes y **nunca se degradan ni se pierden al vencer**. El modelo visual (`store.model`) se conserva siempre.

#### Escenario: Dentro del periodo de gracia
- **Dado** un plan Pro vencido hace 2 días (menor o igual a 3 días de vencimiento)
- **Cuando** se evalúa `getEffectivePlan(store)`
- **Entonces** la tienda conserva todas las funciones y límites comerciales del plan Pro.

#### Escenario: Gracia superada (degradación comercial a Semilla)
- **Dado** un plan Pro vencido hace 4 o más días
- **Cuando** se evalúa `getEffectivePlan(store)`
- **Entonces** el plan efectivo degrada comercialmente a "semilla":
  - Muestra un máximo de 20 productos visibles.
  - Vuelve la marca de agua de Dizi y la publicidad nativa en el catálogo.
  - Se bloquea la exportación de catálogo en PDF.
  - Link en Bio restringe a 3 enlaces visibles y estilos básicos.
  - Se limitan las portadas a 0 banners rotativos.
  - **El diseño visual configurado por el comercio se mantiene idéntico e intacto.**

## Trazabilidad
Casos de prueba: CP-06 a CP-09 · E2E-05 · `src/lib/__tests__/grace-period-features.test.ts` · Código: `src/lib/types.ts` (getEffectivePlan, getEffectiveProductLimit, getEffectiveModel).
