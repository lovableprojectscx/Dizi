# Spec: Planes y Suscripciones

## Propósito
Aplicar límites por plan y degradación comercial automática con periodo de gracia al vencer la suscripción, manteniendo el diseño visual libre e intacto. Cubre RF-05, RF-06 y las reglas comerciales de F39, F40 y F42.

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
  - Se restringe a 1 solo vendedor activo (vendedor principal).
  - Se desactivan los precios por mayor en el catálogo y carrito.
  - **El diseño visual configurado por el comercio se mantiene idéntico e intacto.**

### Requisito: Límites de Vendedores por Plan (F39, F39b)
El sistema DEBE limitar la cantidad máxima de vendedores activos simultáneos (`getMaxSellers`) según el plan efectivo de la tienda:
- **Semilla**: 1 vendedor (únicamente el vendedor principal).
- **Emprendedor**: 1 vendedor (únicamente el vendedor principal).
- **Catálogo Pro**: hasta **3 vendedores** (1 principal + hasta 2 adicionales si el principal está activo, o 3 adicionales si el principal está inactivo).
- **Ilimitado**: hasta **5 vendedores** (1 principal + hasta 4 adicionales si el principal está activo, o 5 adicionales si el principal está inactivo).
Si una tienda baja de plan a Semilla o vence su suscripción superando el periodo de gracia, el servidor y cliente fuerzan `effective_main_active := true` y `max_extra_sellers := 0`, garantizando que la tienda nunca se quede sin WhatsApp de contacto y sin borrar los vendedores guardados.

#### Escenario: Configuración de vendedores en Plan Pro
- **Dado** que una tienda tiene plan Pro activo
- **Cuando** la dueña administra su equipo en `/admin/vendedores`
- **Entonces** puede mantener hasta 3 vendedores activos simultáneamente.

#### Escenario: Degradación de vendedores en plan vencido o Semilla
- **Dado** que una tienda en plan Pro con vendedores adicionales activos vence su suscripción y supera los 3 días de gracia
- **Cuando** un cliente visita su catálogo o pulsa un botón de contacto
- **Entonces** el sistema canaliza la comunicación únicamente hacia el vendedor principal, ignorando los secundarios sin eliminarlos de la base de datos.

### Requisito: Módulo de Porcentaje de Descuento en Todos los Planes (F40)
El módulo de visualización de porcentaje de descuento (`stores.show_discount_pct`) DEBE estar disponible para **todos los planes** (Semilla, Emprendedor, Pro e Ilimitado). No experimenta degradación ni bloqueo por plan o expiración de suscripción.

#### Escenario: Uso de % de descuento en Plan Semilla
- **Dado** que una tienda se encuentra en plan Semilla
- **Cuando** activa el interruptor "Mostrar % de descuento en ofertas" en Diseño → Módulos
- **Entonces** los productos en oferta con descuento ≥ 5% muestran la insignia "-X%" y el texto "Ahorras S/ X" en catálogo y detalle.

### Requisito: Módulo de Precios por Mayor por Plan (F42)
El módulo de precios por mayor (`stores.wholesale_enabled` y `products.wholesale_tiers`) DEBE estar disponible exclusivamente para tiendas con plan efectivo **Emprendedor, Catálogo Pro o Ilimitado**.
- En el plan **Semilla**, el interruptor en Diseño → Módulos DEBE mostrarse inhabilitado con la indicación "Disponible en Emprendedor".
- Si el plan de la tienda vence y supera los 3 días de gracia, o si la tienda opera en plan Semilla con niveles guardados previamente, el catálogo público, el detalle, el carrito, el enlace de WhatsApp y el PDF DEBEN ignorar los precios por mayor y cobrar el precio regular, preservando íntegros los niveles en la base de datos.

#### Escenario: Disponibilidad en Plan Emprendedor o superior
- **Dado** que una tienda cuenta con plan Emprendedor, Pro o Ilimitado
- **Cuando** ingresa a Diseño → Módulos
- **Entonces** el interruptor de "Precios por mayor" está habilitado y permite activarse para cargar escalas en sus productos.

#### Escenario: Bloqueo en Plan Semilla
- **Dado** que una tienda tiene plan Semilla
- **Cuando** la dueña visita Diseño → Módulos
- **Entonces** el interruptor de precios por mayor se visualiza deshabilitado con el mensaje indicando que requiere plan Emprendedor o superior.

#### Escenario: Plan vencido con escalas configuradas
- **Dado** que una tienda Pro con precios por mayor activos vence y supera los 3 días de gracia
- **Cuando** un comprador añade al carrito la cantidad mínima de un nivel mayorista
- **Entonces** el catálogo cobra el precio regular normal, no aplica el nivel por mayor y no muestra mensajes de ahorro.

## Trazabilidad
Casos de prueba: CP-06 a CP-09 · E2E-05 · `src/lib/__tests__/grace-period-features.test.ts` · `src/lib/__tests__/sellers.test.ts` · `src/lib/__tests__/discount.test.ts` · `src/lib/__tests__/wholesale.test.ts` · Código: `src/lib/types.ts` (`PLANS`, `getEffectivePlan`, `getEffectiveProductLimit`, `getMaxSellers`, `getEffectiveModel`), `src/lib/sellers.ts`, `src/lib/discount.ts`, `src/lib/wholesale.ts`, RPC `get_public_store`.
