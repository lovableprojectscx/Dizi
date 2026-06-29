# Evaluación y Ordenamiento del Panel Superadmin (Tiendas, Planes y Suscripciones)

> Documento de evaluación y diagnóstico. **No modifica el sistema.**
> Objetivo: ordenar el área de super, entender por qué se siente desordenada, y definir cuáles son los **cambios principales** que el admin debería poder hacer sobre una tienda — priorizados.
> Fecha: 28 de junio de 2026 · Estado: DIAGNÓSTICO / PROPUESTA

---

## 0. Resumen ejecutivo

El panel super **no está vacío ni incompleto** — al contrario, tiene muchas funciones (búsqueda, filtros avanzados, renovar, extender, prueba rápida, suspender, liberar URL, eliminar, impersonar). El problema no es *falta* de funciones, sino **falta de orden y de modelo mental claro**: las acciones están mezcladas dentro de una fila expandible, varias hacen cosas parecidas con nombres distintos, y la operación más común — **cambiar el plan de una tienda** — está atada a la lógica de renovación, que **siempre resetea la fecha de vencimiento desde hoy**.

Los tres dolores que reportaste se confirman en el código:

1. **"Hay muchas funciones / está desordenado"** → cierto. Hay 8 acciones por tienda sin jerarquía visual, todas al mismo nivel dentro del panel expandible. Ver § 2 y § 3.
2. **"No hay filtros para buscar tiendas"** → **parcialmente falso en el código actual**. Los filtros SÍ existen (búsqueda + 4 filtros avanzados), pero están **ocultos detrás de un botón "Filtros Avanzados"** y puede que tu versión desplegada sea anterior. Ver § 4.
3. **"No puedo cambiar el plan sin subirle un mes desde ese momento"** → **cierto y es el bug de diseño más importante**. No existe acción de "solo cambiar plan": la única vía recalcula el vencimiento. Ver § 5.

---

## 1. Documentos relacionados (lo que ya existe)

Antes de proponer nada, esto es lo que ya está documentado y sirve de base:

| Documento | Qué cubre | Relación con este informe |
|---|---|---|
| `docs/tecnica/DOCUMENTACION_PLANES.md` | Flujo de planes, invites, trial de 15 días, referidos | Base del funcionamiento actual de planes |
| `docs/tecnica/EVALUACION_GESTION_PLANES.md` | Propuesta para que el super edite/cree planes desde DB (no código) | Resuelve la **gestión de planes** (precio/promos) |
| `docs/tecnica/MODELADO_GESTION_PLANES.md` | Modelado técnico + seguridad + borrado de planes | Complemento del anterior |
| `docs/tecnica/ARQUITECTURA.md` (§ super) | Funcionalidades del panel super | Inventario técnico |
| `docs/informes/analisis_alertas_vencimiento_dizi.md` | Alertas de vencimiento e inactividad | Lógica de las alertas del panel |

> **Importante:** los documentos de "gestión de planes" resuelven *editar y crear planes* (precio, promos, niveles). **Este informe es distinto:** trata del **ordenamiento del panel y de las acciones sobre cada tienda** — sobre todo el cambio de plan y la renovación. Son complementarios, no el mismo problema.

---

## 2. Inventario real: qué puede hacer hoy el super sobre una tienda

Auditado en `src/components/admin/SubscriptionManager.tsx` (810 líneas) y `src/routes/super.tiendas.tsx` (632 líneas).

### 2.1 Acciones a nivel de listado (`super.tiendas.tsx`)

| Función | Estado | Notas |
|---|---|---|
| Buscar por nombre, slug, ID o teléfono | ✅ Existe | Barra de búsqueda siempre visible |
| Filtro por plan | ✅ Existe | Oculto tras "Filtros Avanzados" |
| Filtro por estado (activa/suspendida/vencida/inactiva 15d+) | ✅ Existe | Oculto tras "Filtros Avanzados" |
| Filtro por nicho/giro | ✅ Existe | Oculto tras "Filtros Avanzados" |
| Filtro por Libro de Reclamaciones | ✅ Existe | Oculto tras "Filtros Avanzados" |
| Alertas de vencimiento (próx. 7 días) | ✅ Existe | Banner ámbar automático |
| Alertas de inactividad (15d+ sin visitas) | ✅ Existe | Banner ámbar automático |
| Tarjetas de resumen (activas/suspendidas/con libro) | ✅ Existe | Cabecera de la página |
| Impersonar / "Acceder como" tienda | ✅ Existe | Botón directo en la fila |
| Vista responsive (tabla desktop + tarjetas móvil) | ✅ Existe | — |

### 2.2 Acciones dentro del panel expandible "Gestionar" (`SubscriptionManager`)

| Función | Qué hace | Problema de orden |
|---|---|---|
| **Renovar / Cambiar plan** | Asigna plan + duración (1–12 meses) + precio personalizado | ⚠️ Mezcla dos cosas distintas (ver § 5) |
| **Extender** | Suma meses al vencimiento actual | Se confunde con "Renovar" |
| **Cancelar suscripción** | Marca como cancelada con motivo | OK pero poco visible |
| **Suspender / Activar** | Apaga/enciende el catálogo público | OK |
| **Prueba Emprendedor (15d)** | Trial rápido de soporte | OK |
| **Prueba Pro (15d)** | Trial rápido de soporte | OK |
| **Pausar y liberar URL** | Suspende y libera el slug para reusarlo | Acción destructiva mezclada con el resto |
| **Eliminar tienda** | Borra la tienda (pide contraseña super) | Acción destructiva mezclada con el resto |
| **Enviar alerta por WhatsApp** | Mensaje pre-armado de inactividad | OK |

**Conclusión del inventario:** hay **8–9 acciones** apiladas en un mismo panel, sin separar las rutinarias (cambiar plan, renovar) de las destructivas (eliminar, liberar URL). De ahí la sensación de desorden.

---

## 3. Por qué se siente desordenado (diagnóstico de UX)

1. **Todo al mismo nivel.** Renovar, extender, suspender, eliminar y liberar URL están en el mismo bloque, con botones de peso visual parecido. No hay jerarquía: lo que se usa todos los días y lo que se usa una vez al año conviven mezclados.

2. **Acciones que se solapan conceptualmente.**
   - "Renovar" en realidad *cambia plan + fija duración*.
   - "Extender" *suma meses*.
   - "Prueba" *asigna trial*.
   Tres formas distintas de tocar la fecha/plan, sin un lugar único que diga "el estado de suscripción de esta tienda es X y aquí lo cambias".

3. **Acciones destructivas sin zona separada.** "Eliminar tienda" y "Pausar y liberar URL" deberían vivir en una "zona de peligro" visualmente aislada (como hace GitHub/Stripe), no junto a "Renovar".

4. **Filtros escondidos.** La búsqueda está visible, pero los 4 filtros potentes (plan, estado, nicho, libro) están detrás de un botón. Un super que no lo descubre **cree que no hay filtros** — exactamente lo que reportaste.

5. **El panel expandible compite con la tabla.** Al expandir una tienda aparece un bloque grande de controles dentro de la propia tabla, lo que rompe la lectura de la lista.

---

## 4. Sobre los filtros: existen, pero hay que decidir

Los filtros están implementados (`super.tiendas.tsx`, líneas 138–185 y 252–365):

- **Búsqueda libre:** nombre, slug, ID, teléfono (siempre visible).
- **Filtro Plan:** todos / semilla / emprendedor / pro / ilimitado.
- **Filtro Estado:** todos / activa / suspendida / vencida / inactiva (15d+).
- **Filtro Nicho:** general, comida, bisutería, ropa, tech, servicios, florería.
- **Filtro Libro:** con/sin libro de reclamaciones.
- **Botón "Restaurar Filtros".**

**Dos hipótesis de por qué sientes que no hay filtros:**

- **(a)** Tu build desplegado en `dizi.idenza.site` es anterior a esta versión del código → solución: re-desplegar.
- **(b)** Están ahí pero ocultos tras "Filtros Avanzados" y no son evidentes → solución de ordenamiento: dejar los filtros más usados (plan, estado) **siempre visibles** junto a la búsqueda, y dejar solo los secundarios (nicho, libro) bajo "Avanzados".

> **Acción sugerida:** verificar primero qué versión está desplegada antes de programar nada. Si es (a), el problema se resuelve con un deploy.

---

## 5. El problema central: cambiar de plan obliga a resetear el vencimiento

Este es el hallazgo más importante y el que más te afecta operativamente.

### 5.1 Qué pasa hoy (confirmado en código)

No existe una acción "cambiar solo el plan". La única forma de cambiar el plan de una tienda es el botón **Renovar / Cambiar plan**, que llama a `setPlan(storeId, plan, durationMonths)` en `src/lib/store.ts`. Esa función, y el RPC de Supabase detrás, hacen esto:

```sql
-- supabase/migrations/20260617010000_dynamic_invites_and_custom_prices.sql
v_expires_at := NOW() + (p_duration_months || ' months')::INTERVAL;
UPDATE public.stores
SET plan = p_plan,
    plan_expires_at = v_expires_at,   -- ← SIEMPRE se recalcula desde HOY
    plan_duration_months = p_duration_months,
    ...
```

```ts
// src/lib/store.ts — setPlan()
const months = plan === "semilla" ? null : (durationMonths ?? 1);  // mínimo 1
const expiresAt = (() => { const d = new Date(); d.setMonth(d.getMonth() + months); return d; })();
```

Y la UI (`SubscriptionManager.tsx`) solo ofrece duraciones de **1, 3, 6 o 12 meses** (`PLAN_DURATION_OPTIONS`). No hay opción "0 / mantener fecha".

### 5.2 Las consecuencias

- Si una tienda está en **Pro con 20 días restantes** y quieres pasarla a **Ilimitado**, al hacerlo el vencimiento se **reinicia a hoy + 1 mes** → el cliente **pierde los 20 días que le quedaban** (o se los regalas de más, según el caso).
- No puedes hacer una **corrección administrativa** (ej. "esta tienda debió ser Pro, no Emprendedor") sin alterar su fecha de cobro.
- "Renovar" y "Cambiar plan" son operaciones de negocio **distintas** pero comparten un solo botón y una sola lógica.

### 5.3 Qué debería existir (separación de conceptos)

| Operación | Qué debe hacer con la fecha | Cuándo se usa |
|---|---|---|
| **Cambiar plan** (nuevo) | Cambia el plan **conservando** `plan_expires_at` | Corrección / upgrade sin recobrar |
| **Renovar** | Fija plan + nueva fecha = hoy + N meses | Cliente paga un nuevo período |
| **Extender** | Suma N meses al vencimiento existente | Regalo / compensación / abono parcial |
| **Cambiar fecha manual** (nuevo, opcional) | Edita `plan_expires_at` a una fecha exacta | Ajuste fino administrativo |

El cambio técnico de fondo es pequeño: permitir que `activate_subscription` reciba un modo "mantener fecha" (o un `p_duration_months = NULL` que signifique "no toques el vencimiento"), y exponer ese caso en la UI como un botón **"Cambiar plan (sin alterar vencimiento)"** separado de "Renovar".

---

## 6. Cuáles son los CAMBIOS PRINCIPALES que el admin debería poder hacer

Esta es la lista madre de capacidades, agrupada por intención. Sirve para reorganizar el panel en bloques con sentido.

### Bloque A — Suscripción (lo más usado, debe estar arriba y claro)
1. **Cambiar plan** conservando el vencimiento *(falta — § 5)*.
2. **Renovar** (nuevo período desde hoy) *(existe)*.
3. **Extender** (sumar meses) *(existe)*.
4. **Asignar prueba 15 días** Emprendedor/Pro *(existe)*.
5. **Editar precio personalizado** de la tienda *(existe, dentro de Renovar)*.
6. **Ajustar fecha de vencimiento manual** *(falta — opcional, § 5.3)*.

### Bloque B — Estado de la tienda
7. **Suspender / Activar** catálogo *(existe)*.
8. **Cancelar suscripción** con motivo *(existe)*.

### Bloque C — Acceso y soporte
9. **Impersonar / Acceder como** la tienda *(existe)*.
10. **Enviar alerta por WhatsApp** *(existe)*.

### Bloque D — Zona de peligro (aislada visualmente)
11. **Pausar y liberar URL** (libera el slug) *(existe — mover aquí)*.
12. **Eliminar tienda** *(existe — mover aquí)*.

### Capacidades de gestión global (ya evaluadas en otros docs, no por tienda)
- **Editar/crear planes** (precio, promos, niveles) → ver `EVALUACION_GESTION_PLANES.md`.

---

## 7. Propuesta de ordenamiento (sin reescribir, solo reorganizar)

Prioridad de mayor impacto y menor riesgo a mayor esfuerzo:

**P1 — Verificar el deploy de filtros (riesgo nulo).**
Confirmar si la versión en producción ya trae los filtros de § 4. Si no, re-desplegar. Posiblemente resuelve el dolor "no hay filtros" sin tocar código.

**P2 — Separar "Cambiar plan" de "Renovar" (impacto alto, el dolor real).**
Añadir el modo "mantener vencimiento" en `activate_subscription` y un botón propio en la UI. Es el cambio que más te desbloquea operativamente (§ 5.3).

**P3 — Reagrupar el panel `SubscriptionManager` en 4 bloques (A/B/C/D).**
Es puramente visual: mover botones a secciones con título, y aislar la "zona de peligro" (eliminar / liberar URL). No cambia lógica, solo orden.

**P4 — Subir los filtros más usados (plan + estado) a la barra principal.**
Dejar nicho y libro bajo "Avanzados". Hace evidentes los filtros.

**P5 — (Opcional) Editar fecha de vencimiento manual.**
Para ajustes finos administrativos.

> Ninguno de estos cambios toca el modelo de negocio ni los precios. Son de **ordenamiento y corrección de la operación**, no de estrategia.

---

## 8. Cierre

El panel super tiene casi todo lo necesario; lo que falta es **orden** y **una corrección concreta**: que cambiar de plan no obligue a resetear el vencimiento. Reorganizando las acciones en cuatro bloques con una zona de peligro aislada, haciendo visibles los filtros que ya existen, y separando "Cambiar plan" de "Renovar", el área pasa de sentirse caótica a ser predecible — sin reescribir el sistema.

El siguiente entregable, cuando lo apruebes, sería el **plan de implementación de P2** (el SQL del modo "mantener vencimiento" + los cambios de UI archivo por archivo), ya que es el de mayor impacto.

---

*Documento de evaluación. No ejecuta cambios. Auditado contra el código en `src/routes/super.tiendas.tsx`, `src/components/admin/SubscriptionManager.tsx`, `src/lib/store.ts` y `supabase/migrations/20260617010000_dynamic_invites_and_custom_prices.sql`.*
