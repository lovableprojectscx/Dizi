# Modelado de Gestión de Planes — Funciones, Habilitaciones, Seguridad y Borrado

> Complemento de `EVALUACION_GESTION_PLANES.md`.
> Aquí está: cómo trabajaba **antes**, cómo trabajará **ahora**, qué funciones se habilitan, el plan de **ciberseguridad**, y la respuesta al caso crítico: **¿qué pasa si borro un plan que alguien está usando?**
> Fecha: junio 2026 · Estado: PROPUESTA (no ejecuta cambios)

---

## 1. Antes vs. Ahora (resumen)

| Aspecto | ANTES (hoy) | AHORA (propuesto) |
|---|---|---|
| Dónde vive un plan | Constante en código (`PLANS` en `types.ts`) | Fila en tabla `plans` de Supabase |
| Cambiar un precio | Editar código + re-desplegar | Editarlo desde `/super/planes`, al instante |
| Crear un plan nuevo | Imposible sin programar | Formulario en el panel del super |
| Promo (ej. S/ 9.90) | Indistinguible del precio normal | Campo `price` + `regular_price` + `promo_until` |
| Quién puede tocar planes | Cualquiera con acceso al repo | Solo `super_admin` (validado en DB) |
| Riesgo si el plan no existe | Pantalla en blanco (crash) | Fallback automático a "semilla", nunca crashea |
| Diseños que desbloquea | Por nivel fijo en código | Por `level` del plan (editable) |

---

## 2. Modelado de funciones — cómo trabaja cada una

### 2.1 Lectura de un plan (la más usada)

**ANTES**
```ts
// Indexación directa. Si el plan no existe → undefined → crash
const precio = PLANS[store.plan].price;
const limite = PLANS[store.plan].productLimit;
```

**AHORA**
```ts
// getPlan() SIEMPRE devuelve un plan válido (cae a semilla si no encuentra)
const plan   = getPlan(store.plan);   // nunca undefined
const precio = plan.price;
const limite = plan.productLimit;
```
- **Qué hace:** busca el plan en la cache cargada desde DB. Si por cualquier razón el `id` no está (plan borrado, dato viejo, error de red), devuelve el plan **semilla** como red de seguridad.
- **Por qué importa:** elimina de raíz el riesgo #1 (crash por plan inexistente).

### 2.2 Carga de planes al iniciar

**ANTES:** no existe — los planes están en el bundle de JS.
**AHORA:** al arrancar la app (junto a `fetchData()` en el store Zustand) se llama al RPC `get_plans()` y se guardan en memoria. Si la llamada falla, se usan los **4 default hardcodeados como fallback** (no como fuente principal, sino como respaldo).

### 2.3 Crear / editar un plan (nuevo)

| Función | Quién la usa | Qué hace |
|---|---|---|
| `upsert_plan(...)` (RPC) | Super (UI `/super/planes`) | Crea o actualiza un plan. Valida rol super_admin. |
| `set_plan_active(id, bool)` (RPC) | Super | Oculta/muestra un plan sin borrarlo |
| `delete_plan(id)` (RPC) | Super | Borra **solo** planes no-default y sin tiendas activas (ver § 5) |

### 2.4 Asignar plan a una tienda

**ANTES:** `activate_subscription(p_store_id, p_plan, p_months)` recibía el plan como texto y lo aceptaba sin validar contra una lista real.
**AHORA:** la misma función **valida que `p_plan` exista** en la tabla `plans` y esté activo, antes de asignarlo. Si no existe, lanza excepción (no deja a la tienda en estado inválido).

### 2.5 Desbloqueo de diseños

**ANTES:** `PLAN_LEVELS[plan]` (mapa fijo) comparado con `modelo.planLevel`.
**AHORA:** se lee `getPlan(plan).level` (editable desde el panel) comparado con `modelo.planLevel`. La escalera de diseños no cambia; solo el origen del número.

---

## 3. Qué se habilita (capacidades nuevas del super)

En `/super/planes` (nueva sección), el super podrá:

1. **Ver** todos los planes con su precio, límite, nivel, estado (activo/oculto) y cuántas tiendas lo usan.
2. **Editar** precio, nombre visible, promo (`regular_price`, `promo_label`, `promo_until`) y duración sugerida — **incluido** en los 4 default.
3. **Crear** planes nuevos (nombre, precio, límite, nivel 0–3, duración, orden).
4. **Activar/desactivar** un plan (ocultarlo de nuevas asignaciones sin afectar a quien ya lo tiene).
5. **Borrar** únicamente planes propios (no-default) y solo si nadie los usa (ver § 5).

**Lo que NO se habilita (a propósito, por seguridad/estabilidad):**
- Borrar o renombrar el `id` de los 4 default.
- Bajar el `level` de un default (rompería el desbloqueo de diseños de tiendas existentes).
- Cobrar dinero dentro de la app (sigue sin pasarela; el cobro es por WhatsApp).

---

## 4. Plan de Ciberseguridad

> Regla de oro: **reusar el patrón de seguridad que el proyecto YA tiene**, no inventar uno nuevo. El sistema ya valida `super_admin` vía `app_metadata` con RLS y triggers (migración `20260611000000_security_mitigations.sql`). Los planes deben seguir exactamente ese modelo.

### 4.1 Modelo de autorización existente (en el que nos apoyamos)
- El rol vive en `auth.users.raw_app_meta_data->>'role'` (no en `user_metadata`, que el usuario puede manipular).
- Un **trigger** impide la auto-promoción a `super_admin` (un cliente no puede ascenderse solo).
- Los RPCs sensibles validan internamente:
  ```sql
  IF auth.role() != 'service_role'
     AND COALESCE((auth.jwt()->'app_metadata'->>'role'), '') != 'super_admin' THEN
    RAISE EXCEPTION 'No autorizado...';
  END IF;
  ```
- El login del super (`super.login.tsx`) verifica el rol y cierra sesión si no es `super_admin`.

### 4.2 Controles que se aplican a la gestión de planes

| Control | Cómo |
|---|---|
| **Escritura solo super_admin** | `upsert_plan`, `delete_plan`, `set_plan_active` con `SECURITY DEFINER` + chequeo de rol idéntico al de § 4.1. RLS en la tabla `plans` que bloquea INSERT/UPDATE/DELETE a no-super. |
| **Lectura pública controlada** | `get_plans()` devuelve solo planes `is_active = true` y solo campos públicos (nada interno). |
| **No confiar en el frontend** | Aunque la UI oculte el botón "borrar" en los default, la **DB** también lo impide. La validación nunca depende solo del cliente. |
| **Validación de entrada** | Precio ≥ 0, `product_limit` ≥ 0, `level` entre 0 y 3, `id` con formato seguro (slug `[a-z0-9_]`). Evita datos basura o inyección de valores raros. |
| **Inmutabilidad de defaults** | Columna `is_default`; la DB rechaza DELETE y el cambio de `id`/`level` sobre filas default. |
| **Auditoría** | Registrar quién y cuándo cambió un plan (campos `updated_by`, `updated_at`, o tabla `plans_audit`). Permite rastrear un cambio de precio indebido. |
| **Integridad referencial** | La columna `stores.plan` apunta a un plan existente; el borrado se controla (§ 5) para no dejar tiendas "huérfanas". |
| **Defensa en profundidad** | Aunque algo se escape, `getPlan()` con fallback evita que un plan inválido tumbe la experiencia del cliente. |

### 4.3 Amenazas consideradas
- **Escalada de privilegios** (cliente intenta editar planes): bloqueado por rol en DB + trigger anti-promoción.
- **Manipulación de precio desde el navegador**: imposible, el precio se valida y persiste server-side; el cliente solo lee.
- **Plan huérfano / estado inconsistente**: cubierto por § 5 y por `getPlan()` fallback.
- **Datos cacheados viejos** (Zustand `persist`): recargar planes desde DB al iniciar y versionar la clave de persistencia.

---

## 5. ⚠️ Caso crítico: ¿qué pasa si borro un plan que alguien está usando?

Este es el escenario que rompe sistemas. Lo modelamos con tres capas de protección.

### 5.1 El problema
Si una tienda tiene `plan = "plan_navidad"` y borras esa fila, sin protección pasaría:
- `getPlan("plan_navidad")` no encuentra nada → (antes) **crash**; (ahora) cae a semilla, pero **la tienda perdería silenciosamente su plan pagado**. Inaceptable: el cliente pagó.

### 5.2 La solución propuesta — "no se borra de verdad si está en uso"

**Capa 1 — Bloqueo de borrado en uso (lo principal).**
`delete_plan(id)` primero cuenta cuántas tiendas usan ese plan:
```
SELECT COUNT(*) FROM stores WHERE plan = id;
```
- Si **> 0** → la DB **rechaza el borrado** y devuelve: *"No se puede borrar: N tiendas usan este plan. Desactívalo o migra esas tiendas primero."*
- Si **= 0** y no es default → se borra.

**Capa 2 — Soft delete / desactivar en vez de borrar.**
La opción recomendada para el día a día no es borrar, es **desactivar** (`is_active = false`):
- El plan **desaparece de las opciones** para nuevas tiendas e invites.
- Las tiendas que ya lo tienen **lo conservan tal cual** (precio, límite, nivel) hasta que venzan o las migres.
- Reversible: lo puedes reactivar.

**Capa 3 — Red de seguridad final (`getPlan()` fallback).**
Si aun así, por un error, una tienda quedara apuntando a un plan inexistente, `getPlan()` devuelve semilla y la app **sigue funcionando** (no pantalla en blanco). Es el último colchón, no la solución principal.

### 5.3 Flujo recomendado para "retirar" un plan sin dañar a nadie
```
1. Desactivar el plan (is_active = false)  → deja de ofrecerse a nuevos
2. (Opcional) Migrar las tiendas que lo usan a otro plan equivalente
   usando activate_subscription/setPlan
3. Cuando 0 tiendas lo usen → recién ahí permitir delete_plan()
```

### 5.4 Tabla resumen del comportamiento al borrar

| Situación | Resultado |
|---|---|
| Plan default (semilla/emprendedor/pro/ilimitado) | ❌ No se puede borrar nunca |
| Plan custom con tiendas usándolo | ❌ Borrado bloqueado; sugiere desactivar o migrar |
| Plan custom sin tiendas | ✅ Se borra |
| Quieres "quitarlo" pero hay tiendas | ✅ Desactívalo (soft delete): nadie nuevo lo toma, los actuales lo mantienen |
| Error/dato viejo deja una tienda sin plan válido | 🛟 `getPlan()` cae a semilla; la app no crashea (caso límite, no deseado) |

---

## 6. Cierre

El modelo mantiene tus 4 planes intactos, te da control total del precio y de planes nuevos desde el panel, **reutiliza el sistema de seguridad que ya tienes** (super_admin + app_metadata + RLS) en vez de abrir huecos nuevos, y resuelve el caso del borrado con la regla simple: **un plan en uso no se borra, se desactiva**; y si todo falla, la app degrada a semilla en lugar de romperse.

Siguiente entregable, cuando apruebes: el **plan de implementación detallado de la Fase 1** (SQL de la tabla `plans`, los RPCs con su chequeo de rol, y los cambios archivo por archivo).

---

*Documento de modelado. No ejecuta cambios.*
