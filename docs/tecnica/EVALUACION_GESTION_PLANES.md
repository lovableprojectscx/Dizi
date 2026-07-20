# Evaluación: Gestión de Planes desde el Superadmin

> Documento de evaluación previo al desarrollo. **No modifica el sistema.**
> Objetivo: que el área de super pueda crear y administrar planes (precio, tiempo, límite, nivel de diseños y promos) **manteniendo fijos los 4 planes predeterminados**.
> Fecha: junio 2026 · Estado: PROPUESTA / decisión de diseño

---

## 1. Qué se quiere lograr

- El superadmin puede **editar** los planes existentes (sobre todo el **precio**, para manejar la promo de S/ 9.90 sin tocar código ni re-desplegar).
- El superadmin puede **crear planes nuevos** con: nombre, precio, duración/tiempo, límite de productos y nivel de diseños que desbloquea.
- Los **4 planes predeterminados** (semilla, emprendedor, pro, ilimitado) **se quedan**: no se pueden borrar ni cambiar su identificador. Su precio sí se podrá editar.
- Decisión tomada: el modelo de beneficios será **por nivel** (no "a la carta") en esta primera versión. Ver § 4.

---

## 2. Por qué es un cambio crítico (el problema de fondo)

Hoy un plan **no es un dato editable, es código fijo**. Cambiar eso toca el núcleo del sistema porque hay tres acoplamientos duros:

### 2.1 El tipo `PlanId` es un union cerrado

```ts
// src/lib/types.ts
export type PlanId = "semilla" | "emprendedor" | "pro" | "ilimitado";
```

La columna `plan` de cada tienda, los `invites` y los RPCs de Supabase dependen de este tipo. Un plan con un identificador nuevo **no existe** para TypeScript ni para la validación hasta que se cambie este modelo.

### 2.2 Los precios y límites se leen por indexación directa

```ts
PLANS[store.plan].price; // admin.plan.tsx, SubscriptionManager.tsx
PLANS[getEffectivePlan(store)].productLimit; // getEffectiveProductLimit()
PLANS[store.plan].name; // admin.dashboard, super.tiendas, etc.
```

Si una tienda tuviera un plan que **no está** en el objeto `PLANS`, esa línea lanza `undefined` y **rompe la pantalla** (página en blanco en `/admin/plan` y en el panel del super). Este es el riesgo #1 a mitigar.

### 2.3 Los diseños se desbloquean por NIVEL, no por plan

Cada modelo de diseño tiene un `planLevel` (0–3) y cada plan tiene un nivel:

```ts
// src/routes/admin.diseno.tsx
const PLAN_LEVELS: Record<PlanId, number> = {
  semilla: 0,
  emprendedor: 1,
  pro: 3,
  ilimitado: 3,
};
// Un modelo se muestra si:  PLAN_LEVELS[plan] >= modelo.planLevel
```

Es una **escalera**: un plan ve los diseños de su nivel y todos los de abajo. Por eso la primera versión usa "nivel" como concepto central: **encaja con lo que el código ya entiende** y evita reescribir cómo se desbloquea cada feature.

---

## 3. Inventario: todo lo que toca un "plan" hoy

| Archivo                                        | Qué hace con el plan                      | Cómo lo usa                         |
| ---------------------------------------------- | ----------------------------------------- | ----------------------------------- |
| `src/lib/types.ts`                             | Define `PlanId`, `Plan`, `PLANS`, helpers | Fuente de verdad (constante)        |
| `src/routes/admin.plan.tsx`                    | Tarjetas de plan del cliente              | `PLANS[p].name/price/productLimit`  |
| `src/components/admin/SubscriptionManager.tsx` | "Precio total estimado" (super)           | `PLANS[renewPlan].price × meses`    |
| `src/routes/admin.dashboard.tsx`               | Muestra nombre/límite del plan            | `PLANS[store.plan]`                 |
| `src/routes/super.tiendas.tsx`                 | Badge del plan por tienda                 | `PLANS[s.plan].name`                |
| `src/routes/admin.diseno.tsx`                  | Desbloqueo de diseños por nivel           | `PLAN_LEVELS[plan]` vs `planLevel`  |
| `src/components/public/PublicCatalog.tsx`      | Modelo efectivo / degradación             | `getEffectiveModel()`               |
| `src/routes/register.tsx`                      | Plan asignado al registrarse              | `invitePlan as PlanId`              |
| `src/routes/index.tsx` (landing)               | Precios de marketing                      | **Strings a mano** (no usa `PLANS`) |
| `supabase` RPC `activate_subscription`         | Activa/renueva, valida `p_plan`           | Recibe el plan como TEXT            |
| `supabase` RPC `get_public_store`              | Datos públicos por slug                   | Restringe features por `store_plan` |

> Nota crítica: la **landing** NO lee `PLANS`. Por decisión previa, la landing se mantiene editada a mano (es marketing). Lo que el super gestione se reflejará en **`/admin/plan` (cliente)** y en el **panel del super**.

> Nota importante: la app **no cobra** dentro del sistema (no hay pasarela). El precio es informativo y para el cálculo estimado de renovación; el cobro real se coordina por WhatsApp. Esto **reduce** el riesgo del cambio (no afecta transacciones reales).

---

## 4. Diseño propuesto: "Planes por nivel" (Opción A)

### 4.1 Concepto

Un plan pasa de ser una constante a ser una **fila en base de datos** con estos campos:

| Campo                     | Tipo                   | Descripción                                                               |
| ------------------------- | ---------------------- | ------------------------------------------------------------------------- |
| `id`                      | text PK                | Identificador (`semilla`, `emprendedor`… o uno nuevo tipo `plan_navidad`) |
| `name`                    | text                   | Nombre visible                                                            |
| `price`                   | numeric                | Precio mensual actual (aquí vive la promo)                                |
| `regular_price`           | numeric (opcional)     | Precio "de lista" para mostrar tachado junto a la promo                   |
| `product_limit`           | int                    | Límite de productos (`-1` o muy alto = ilimitado)                         |
| `level`                   | int (0–3)              | Nivel de diseños que desbloquea (la "escalera")                           |
| `duration_default_months` | int                    | Duración sugerida al asignarlo (puede ser 0 = prueba)                     |
| `is_default`              | bool                   | `true` en los 4 fijos → **no se pueden borrar**                           |
| `is_active`               | bool                   | Permite ocultar un plan sin borrarlo                                      |
| `sort_order`              | int                    | Orden en las vistas                                                       |
| `promo_label`             | text (opcional)        | Etiqueta tipo "Promo lanzamiento"                                         |
| `promo_until`             | timestamptz (opcional) | Fin de la promo (informativo / para apagarla)                             |

### 4.2 Cómo se protegen los 4 predeterminados

- Se insertan con `is_default = true`.
- La UI del super **oculta el botón borrar** y **bloquea el cambio de `id` y de `level`** en esos 4 (puede editar precio, nombre visible, promo).
- En base de datos, una política/validación impide `DELETE` sobre filas `is_default = true`.

### 4.3 Cómo encaja con los diseños (sin reescribir el desbloqueo)

El plan nuevo solo necesita un `level` (0–3). El sistema de diseños ya funciona con niveles, así que un plan nuevo de `level = 2` desbloquea automáticamente los mismos diseños que hoy ve "pro/ilimitado" hasta ese nivel. **No hay que tocar los `planLevel` de cada modelo.**

---

## 5. Mapa de cambios necesarios (qué se tocaría y por qué)

> Esto es el alcance del desarrollo (fase de construcción), listado para dimensionar — todavía NO se ejecuta.

### 5.1 Base de datos (Supabase)

1. Nueva tabla `plans` con los campos de § 4.1.
2. Seed con los 4 planes actuales (`is_default = true`) usando exactamente los valores de hoy.
3. RPC `get_plans()` — lectura pública (para que `/admin/plan` y la landing-si-se-quisiera lean precios).
4. RPC `upsert_plan(...)` y `set_plan_active(...)` — **solo super_admin** (mismo patrón de RLS que `invites`/`reclamaciones` de la migración `20260611000000_security_mitigations.sql`).
5. Bloqueo de `DELETE` sobre `is_default = true`.
6. `activate_subscription` debe **validar contra la tabla** `plans` en vez de una lista fija.

### 5.2 Frontend — capa de datos

1. `types.ts`: cambiar `PlanId` de union cerrado a `string`, y convertir `PLANS` de constante a **cache cargada desde DB** (con los 4 default como _fallback_ de seguridad si la red falla → evita el crash del § 2.2).
2. Crear un acceso seguro `getPlan(id)` que **nunca** devuelva `undefined` (cae al default semilla si no encuentra). Esto blinda todas las pantallas.
3. Cargar los planes al iniciar (en el store Zustand, junto a `fetchData()`).

### 5.3 Frontend — UI del superadmin

1. Nueva sección en `/super` (ej. `/super/planes`) con tabla de planes + crear/editar.
2. Formulario: nombre, precio, regular_price, product_limit, level, duración, promo_label, promo_until, activo.
3. Candados visuales en los 4 default (no borrar, id/level fijos).

### 5.4 Frontend — consumo

- Reemplazar `PLANS[x]` por `getPlan(x)` en: `admin.plan.tsx`, `SubscriptionManager.tsx`, `admin.dashboard.tsx`, `super.tiendas.tsx`.
- `admin.diseno.tsx`: leer el `level` del plan desde el dato cargado en vez de `PLAN_LEVELS` fijo.

---

## 6. Riesgos y mitigaciones

| Riesgo                                                                | Severidad | Mitigación                                                                              |
| --------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------- |
| Una tienda queda con un plan inexistente → pantalla en blanco (§ 2.2) | **Alta**  | `getPlan()` con fallback a semilla; nunca indexar directo                               |
| Cambiar `PlanId` a `string` rompe el tipado en cascada                | Media     | Hacerlo en un solo commit, compilar TypeScript y corregir todos los usos antes de subir |
| Borrar/renombrar un default por error                                 | Media     | `is_default` + bloqueo en DB y en UI                                                    |
| Diseños no se desbloquean para un plan nuevo                          | Media     | Usar `level` (escalera existente); probar con un plan de prueba nivel 2                 |
| Precio cambia pero la landing no (queda desalineada)                  | Baja      | Documentado: la landing es manual; checklist al cambiar precios                         |
| RPC de escritura expuesto a no-super                                  | **Alta**  | RLS solo super_admin (patrón ya existente en el proyecto)                               |
| Datos viejos en `localStorage` (Zustand persist)                      | Baja      | Versionar la clave de persistencia o recargar planes desde DB al iniciar                |

---

## 7. Plan por fases (recomendado)

**Fase 0 — Preparación (sin riesgo)**

- Crear tabla `plans` + seed de los 4 default + RPC `get_plans()` de solo lectura.
- La app sigue usando la constante; solo se valida que la tabla refleje exactamente lo de hoy.

**Fase 1 — Lectura dinámica + precio editable (el caso de la promo)**

- `getPlan()` con fallback; reemplazar `PLANS[x]` por `getPlan(x)` en las 4 pantallas.
- UI del super para **editar** planes (empezando por precio/promo de los default).
- Resultado: ya puedes manejar la promo de S/ 9.90 desde el panel, sin re-desplegar.

**Fase 2 — Crear planes nuevos**

- Formulario completo de creación (nombre, nivel, límite, duración, activo/orden).
- Validación de `activate_subscription` contra la tabla.
- Pruebas con un plan nuevo de prueba antes de exponerlo.

**Fase 3 (opcional, futuro) — Beneficios "a la carta"**

- Si más adelante quieres marcar diseños/módulos individuales por plan (en vez de por nivel), se evalúa aparte: es un refactor mayor de cómo cada feature pregunta por permisos.

---

## 8. Recomendación final

Avanzar en orden: **Fase 0 → 1 → 2**, validando TypeScript y probando cada fase en un plan de prueba antes de tocar tiendas reales. La Fase 1 ya resuelve tu necesidad concreta (gestionar la promo del 9.90 desde super) con riesgo controlado. Mantener la regla de oro: **ninguna pantalla debe indexar `PLANS` directo** — todo pasa por `getPlan()` con fallback, para que un plan inesperado nunca tumbe la app.

Los 4 planes predeterminados se conservan intactos como `is_default`, editables en precio pero no borrables ni renombrables — exactamente lo que pediste.

---

_Documento de evaluación. No ejecuta cambios. Al aprobar, se redacta el plan de implementación detallado por fase._
