# F57 · Diseño técnico (hipótesis hasta el Paso 0)

## Hechos verificados por Claude en producción (20–23 nov 2026)
- **El registro crea la tienda con la RPC `initialize_store`** (SECURITY DEFINER, dueño `postgres`). Por eso el trigger `protect_store_billing_columns` se salta (`current_user = postgres`). Desde F55 (`20261122120000`), la rama no-super crea Pro, `trial`, +7 días y `show_dizi_branding NULL`.
- **El plan efectivo se calcula en dos lugares que deben coincidir:**
  - Cliente: `getEffectivePlan` (`src/lib/types.ts`), con 3 días de gracia.
  - Base: `effective_product_limit(p_store_id)` y `get_public_store`, también con 3 días (`interval '3 days'`).
  - **F57 debe cambiar los dos a la vez.**
- **`claim_trial_rewards`** (F55) solo actúa con `plan='pro'`, `trial`, tiendas creadas desde el corte del 20 nov y vencimiento futuro. No se toca.
- **Ya existe una "suspensión por inactividad"** (`stores.active=false`, aviso rojo en `admin.tsx`), que libera el link. **F57 no debe liberar el link.** El Paso 0 decide si se reutiliza o si se crea un estado nuevo.

## Piezas
| Pieza | Responsabilidad |
|---|---|
| `public.app_config` (o la tabla de configuración que ya exista) | Claves `pausa_activa boolean` (empieza en `false`) y `semilla_fin date` (día S). RLS: lectura pública de esas claves y escritura solo para el super. |
| `public.store_access_state(p_store_id)` → text | Única fuente de verdad del estado (`activa`, `gracia` o `pausa`) según plan, `subscription_status`, `plan_expires_at`, excepciones (demo, internas, `zz-`) e interruptor. |
| `get_public_store` | Si el estado es `pausa`, devuelve un objeto reducido (nombre, logo, colores, WhatsApp principal, `paused: true`) sin productos ni categorías. |
| `effective_product_limit` | Coherente con el nuevo estado; la gracia sigue igual. |
| Transición de Semilla | Función idempotente `apply_semilla_sunset()` que, desde el día S, pasa las tiendas `plan='semilla'` (excepto las excepciones) a Pro `trial` +7 días y registra cuáles cambió. La ejecuta un cron de `pg_cron` diario o Jack desde el super; el Paso 0 propone cuál. |
| `src/lib/access-state.ts` | Espejo puro en TS de la tabla de casos (para el panel), con pruebas compartidas. |
| Página pública en pausa | En `/t/:slug` y en la bio. `noindex`. Botón "Escribir por WhatsApp" a la tienda. |
| Panel | Aviso fijo en pausa y en gracia; cuenta regresiva de transición para las Semilla. |
| Super | Columna de estado (`activa`, `gracia` o `pausa`) en la lista de tiendas e interruptor `pausa_activa`. |
| Textos | Landing (sin tarjeta Semilla), registro, celebración, Mi Plan, Ayuda y preguntas frecuentes. |

## Tabla de casos (la prueban TS y SQL por igual)
| # | Situación | Interruptor | Estado esperado |
|---|---|---|---|
| 1 | Plan pagado, vence en 10 días | on | activa |
| 2 | Plan pagado, venció hace 2 días | on | gracia |
| 3 | Plan pagado, venció hace 4 días | on | pausa |
| 4 | Prueba Pro vigente | on | activa |
| 5 | Prueba Pro vencida hace 4 días | on | pausa |
| 6 | Semilla, antes del día S | on | activa (como hoy) |
| 7 | Semilla después de S (ya pasada a prueba Pro por `apply_semilla_sunset`) | on | activa → sigue la regla de la prueba |
| 8 | Demo (`*-demo`) vencida | on | activa |
| 9 | `zz-*` vencida | on | activa |
| 10 | Caso 3 o 5 con el interruptor apagado | off | como hoy (Semilla efectiva, catálogo visible) |
| 11 | Reactivación: caso 3 + el super extiende el plan | on | activa al instante |

## Riesgos y cómo se cubren
- **Pausar por error a una tienda que paga:** el interruptor arranca apagado; antes de encenderlo, Claude verifica con lectura que las tiendas que pagan salen "activa"; el caso 1 está cubierto por pruebas.
- **El cliente y la base dicen cosas distintas:** una sola tabla de casos probada en los dos lados.
- **El link liberado por la suspensión vieja:** la pausa nunca toca el link.
- **SEO:** las páginas en pausa con `noindex`.

## Orden y dependencias
- Va antes de F56 (formulario de productos).
- Migración en dos pasos: (1) aplicar con el interruptor **apagado** → verificar → merge; (2) encender el interruptor después de la prueba con `zz-f57-pausa`.
