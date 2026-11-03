# F43 · Encuesta de calidad: arquitectura

> Hipótesis hasta el Paso 0. Todo nombre de función o columna se confirma contra producción y el código.

## Datos (una migración, archivo sin aplicar hasta el OK)
- Tabla `survey_responses`:
  - `id uuid pk default gen_random_uuid()`
  - `store_id` (mismo tipo que `stores.id`) `references stores(id) on delete cascade`
  - `survey_version text not null` (`'2026-11'`)
  - `plan_at_response text not null` (plan efectivo calculado en el servidor; `'semilla'` si estaba en prueba)
  - `answers jsonb not null`
  - `reward_code text not null unique`
  - `reward_status text not null default 'pendiente'` con check (`pendiente`, `aplicado`, `rechazado`)
  - `reward_applied_at timestamptz`, `created_at timestamptz not null default now()`
  - `unique (store_id, survey_version)`
- RLS prendida. Política de `select`: el dueño ve sus filas; super_admin ve todo. **Sin** políticas de `insert`, `update` ni `delete` para clientes: todo pasa por RPC.
- RPC `submit_survey(p_store_id, p_version, p_answers)`: valida dueño (mismo patrón que `activate_subscription_with_invite`), calcula el plan efectivo en SQL (misma regla que `getEffectivePlan`: 3 días de gracia), valida que `p_answers` tenga solo las claves del grupo y textos de 300 caracteres o menos, genera el código y devuelve la fila. Si ya existe, devuelve la existente.
- RPC `apply_survey_reward(p_response_id)` y `reject_survey_reward(p_response_id)`: solo super_admin; bloquean la fila (`for update`); Semilla → prueba de Emprendedor 15 días (reutilizar la lógica del trial rápido actual, de la definición de producción); pago → `plan_expires_at = greatest(plan_expires_at, now()) + 15 days` sin tocar `plan`.
- Todo `SECURITY DEFINER` + `SET search_path = public, pg_temp`. `REVOKE` también `FROM PUBLIC`. Al final, comentado, el SQL para revertir.

## Frontend
| Pieza | Archivo | Responsabilidad |
|---|---|---|
| Lógica pura | `src/lib/survey.ts` (nuevo) | `SURVEY_VERSION`, preguntas por grupo, `getSurveyGroup(store)` (usa `getEffectivePlan` y la regla de prueba), `validateAnswers(group, answers)`, `buildWhatsAppLink(code, slug)`. Sin React ni consultas. |
| Datos | `src/lib/store.ts` | `submitSurvey`, `getMySurveyResponse`, `listSurveyResponses`, `applySurveyReward`, `rejectSurveyReward` (llaman a los RPC) |
| Tarjeta | `src/routes/admin.dashboard.tsx` | Tarjeta de RF-43.1 |
| Encuesta | `src/routes/admin.encuesta.tsx` (nueva) | Formulario y pantalla final con código y botón de WhatsApp |
| Super | `src/routes/super.encuestas.tsx` (nueva) + enlace en el menú de `super.tsx` | Lista, filtros, detalle, aplicar o rechazar, CSV |

## Riesgos
- **Duplicados** (hb-one ×3, invitaya ×2, moda5 ×2): la vista del super muestra cuántas tiendas tiene el mismo dueño; Jack decide al aplicar.
- **Plan efectivo en dos lugares** (TS y SQL): la prueba E2 y E10 cubren que coincidan.
- **El trial rápido actual** se hace desde el navegador del super: el Paso 0 dice cómo, para no duplicar reglas.
- **No en paralelo** con otro encargo que toque `admin.dashboard.tsx`, `SubscriptionManager.tsx` o `super.tsx`.
