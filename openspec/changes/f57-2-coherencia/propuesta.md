# F57.2 · Coherencia: que todo el sistema diga lo mismo que F57

**Estado:** 📝 Propuesta (23 nov 2026; actualizada 24 nov con las decisiones de Jack: día S = 25 dic 2026 y cláusula de etapa de lanzamiento). Meta: en producción a más tardar el 1 dic 2026, para que los Términos nuevos estén publicados durante el aviso. Pedido de Jack: "estamos actualizando el sistema pero no la landing… todo actualizado, revísalo".
**Auditoría de origen:** `05-INFORMES/auditorias/AUDITORIA-coherencia-F57-2026-11-23.md` (Claude, contra master `128ca36` y producción).

## Por qué
F55 y F57 cambiaron la regla (no más plan gratis; prueba Pro de 7 días; pausa al vencer), pero quedan textos, datos para Google y acciones del super que siguen con la regla vieja. Además, después del 9 dic, asignar "Semilla" desde el super haría que el cron diario regale 7 días de Pro al día siguiente.

## Requisitos
| ID | Qué | Dónde (verificado) |
|---|---|---|
| RF-57.2.1 | Datos para Google: quitar la oferta "Plan Semilla, gratis para siempre"; agregar "Prueba 7 días de Pro gratis". | `index.html:115-121` |
| RF-57.2.2 | Landing: "desde el plan gratuito" → "desde tu prueba gratis"; comentario de cabecera sin Semilla. | `src/routes/index.tsx:425`, `:7` |
| RF-57.2.3 | Mi Plan: hoy dice "Tu catálogo se encuentra en pausa" a cualquier plan vencido (aunque el interruptor esté apagado o esté en gracia). Debe usar `getStoreAccessState`: gracia → "tienes 3 días…"; pausa → "en pausa"; vencido con interruptor apagado → "muestra hasta 20 productos". | `src/routes/admin.plan.tsx:34-56` |
| RF-57.2.4 | Términos (web y registro legal): §4 "Dizi funciona con un plan gratuito" → "con una prueba gratis de 7 días y planes de suscripción"; §5 "pasa al plan gratuito" → "pasa a 3 días de gracia y luego a pausa, sin borrar datos"; §7 "estando en plan gratuito o con la suscripción vencida" → "con la suscripción vencida o en pausa"; fecha de última actualización. | `src/routes/terminos.tsx:146,177-180,219,lastUpdated` y `06-LEGAL/Terminos-y-Condiciones-Dizi.md` |
| RF-57.2.5 | Ayuda (referidos): "Si estás en el plan gratuito, se te sube el plan" → "Si estás en prueba o con el plan vencido, se te activa ese mes". | `src/routes/ayuda.tsx:559` |
| RF-57.2.6 | Super, desde `semilla_fin`: no se puede asignar Semilla (renovar, cambiar plan, invitaciones). Antes de esa fecha sigue visible con la etiqueta "(hasta el 24 dic)". | `SubscriptionManager.tsx:723,852`, `InviteGenerator.tsx:12` |
| RF-57.2.7 | Cancelar suscripción (super): ya no pasa a Semilla; conserva el plan, `subscription_status='cancelled'`, `cancelled_at`, `cancel_reason` y `plan_expires_at = now() - 3 días` → en pausa si el interruptor está encendido y con 20 productos si no. Mismo cambio en la mutación local `store.ts:1150` y texto del diálogo `SubscriptionManager.tsx:1041`. Mi Plan muestra "Sin plan activo" si está cancelada o en pausa. | RPC `cancel_subscription`, `store.ts:279-280,1150` |
| RF-57.2.8 | Tienda creada por el super sin plan: ya no nace Semilla, nace Pro prueba 7 días (igual que el registro). | RPC `initialize_store` (rama super, `COALESCE(p_plan,'semilla')`) |
| RF-57.2.10 | Términos: nueva cláusula **Etapa de lanzamiento** en §4 (texto exacto abajo) y quitar la viñeta "Los precios promocionales de lanzamiento son temporales…" (queda cubierta). Mismo texto en `06-LEGAL/Terminos-y-Condiciones-Dizi.md`. | `terminos.tsx:161` |
| RF-57.2.11 | Super, liberar enlace (§7): `isStoreInactiveCandidate` (`super.tiendas.tsx:187-206`) pasa a: catálogo en pausa hace **90 días o más** (inicio de la pausa = el mayor entre vencimiento + 3 días y `pausa_desde`) y poca actividad (mismo umbral de visitas/clics). La insignia dice "En pausa 90d+". El botón "Liberar URL" (`SubscriptionManager.tsx:673-682`) queda deshabilitado si no cumple, mostrando los días en pausa. El mensaje de WhatsApp (`:358`) deja de decir "plan Semilla gratuito" y dice que el catálogo está en pausa. | Paso 0 F57.2 §5 |
| RF-57.2.12 | Textos del panel del comercio que dicen "Plan Semilla" o "plan gratuito" pasan a un texto neutro que sirve hoy (Semilla) y después (vencido o en pausa): "en tu plan actual" / "sin plan activo". Lista del Paso 0: `admin.link-bio.tsx:1323,1336,2100`, `admin.diseno.tsx:1590,1655,1665`, `admin.configuracion.tsx:520`, `admin.productos.tsx:2602`, `admin.tsx:270` ("…debido a inactividad." sin "en tu plan Semilla"). | Paso 0 F57.2 §3 |
| RF-57.2.13 | Base: `activate_subscription` (las 2 versiones) y `activate_subscription_with_invite` rechazan `semilla` cuando la fecha Lima ≥ `semilla_fin` (error claro). Defensa además de ocultarlo en el super. | RPC |
| RF-57.2.14 | Super, solo etiquetas: `super.tiendas.tsx:444` y `super.dashboard.tsx:142` → "Semilla (antiguo)"; `super.dashboard.tsx:505` sin "plan gratuito"; `SubscriptionManager.tsx:431` → "Sin vencimiento"; `super.referidos.tsx:172` sin "(Gratis)". | Paso 0 F57.2 §3 |
| RF-57.2.9 | Espejo de especificaciones del repo igual a `INFORMACIÓN NECESARIA` (planes-suscripciones y registro-invitaciones). | `openspec/specs/` |

| ID | No funcional |
|---|---|
| RNF-57.2.1 | **Ningún cambio visible en el catálogo público** de tiendas existentes. Los textos "Crea tu catálogo gratis" del catálogo y del mensaje de WhatsApp solo salen en tiendas Semilla y desaparecen solos el 9 dic: no se tocan. |
| RNF-57.2.2 | Las acciones del super que hoy funcionan siguen funcionando para planes de pago. |
| RNF-57.2.3 | Lo histórico no se reescribe (`novedades.tsx` mayo 2026). |

## Escenarios
1. `index.html` no contiene "gratis para siempre" ni una oferta "Plan Semilla" (prueba de texto).
2. Landing sin "plan gratuito" (prueba sobre `index.tsx`).
3. Mi Plan, interruptor apagado, vencido 5 días → "muestra hasta 20 productos", no "en pausa".
4. Mi Plan, interruptor encendido, vencido 1 día → mensaje de gracia.
5. Mi Plan, interruptor encendido, vencido 5 días (después de `pausa_desde`) → "en pausa".
6. `/terminos` sin "plan gratuito"; fecha actualizada.
7. `/ayuda` sin "plan gratuito".
8. Super, `semilla_fin` vacío o futuro → opción Semilla visible con "(hasta …)"; `semilla_fin` pasado → no aparece en renovar, cambiar plan ni invitaciones.
9. `cancel_subscription` (BEGIN…ROLLBACK, tienda `zz-audit-*`) → plan igual, `plan_expires_at` ≈ now()-3 días; `store_access_state` = activa con interruptor apagado.
10. `initialize_store` como super sin plan (BEGIN…ROLLBACK) → pro/trial/+7 días.
11. Catálogo público de 3 tiendas existentes (una Semilla, una Pro, una demo): md5 de `get_public_store` antes/después idéntico.
12. `diff` de `openspec/specs/planes-suscripciones` y `registro-invitaciones` contra `INFORMACIÓN NECESARIA/.../especificaciones-openspec/` = vacío.
13. Ningún texto del panel del comercio ni de las páginas públicas propias dice "plan gratuito", "gratis para siempre" ni "Plan Semilla" (prueba por búsqueda en `src/`, con lista blanca solo para lógica interna y super con "Semilla (antiguo)").
14. `activate_subscription` y `activate_subscription_with_invite` con `semilla` y `semilla_fin` pasado (BEGIN…ROLLBACK, `zz-audit-*`) → error; con `semilla_fin` futuro → funciona como hoy.
15. `isStoreInactiveCandidate` (Vitest): en pausa 89 días → no; 90 días con poca actividad → sí; 120 días con 10+ visitas → no; Semilla activa → no.
16. Cancelar en el super (Playwright con datos simulados): el diálogo ya no dice "Semilla"; Mi Plan de esa tienda dice "Sin plan activo".

## Textos exactos de los Términos (RF-57.2.4 y RF-57.2.10)

**§4, primer párrafo:**
> Dizi ofrece una prueba gratuita de 7 días del plan Pro y planes de suscripción mensual o anual. Los límites y precios vigentes se publican en la página de inicio.

**§4, nuevo bloque "Etapa de lanzamiento"** (después de "Cómo se cobra hoy"):
> **Etapa de lanzamiento.** Dizi se encuentra en etapa de lanzamiento y mejora continua. Por ello, los planes, sus funciones, límites y precios pueden ajustarse a medida que el servicio evoluciona. Cuando eso ocurra, nos comprometemos a: (i) avisarte cualquier cambio sustancial con al menos 30 días de anticipación, a través del panel de tu cuenta, WhatsApp o correo electrónico; (ii) respetar las condiciones de cualquier período que ya hayas pagado; y (iii) no eliminar tus productos, tu configuración ni tu información como consecuencia de un cambio de plan. Si un cambio no se ajusta a tus necesidades, puedes dejar de usar el servicio en cualquier momento.

**§5 completo:**
> Al registrarte recibes 7 días de prueba del plan Pro, sin costo y sin tarjeta, y puedes ganar días adicionales completando tu tienda. También podemos otorgar períodos de prueba mediante enlaces de invitación. Al terminar la prueba, si no se activa un plan de pago, tu catálogo cuenta con 3 días de gracia y luego pasa a pausa: deja de mostrarse al público, pero tus productos, enlaces y configuración se conservan y se reactivan al contratar un plan.
>
> **Cuentas del plan Semilla.** El plan gratuito Semilla deja de ofrecerse. Las cuentas que lo usan lo mantienen hasta el 24 de diciembre de 2026; el 25 de diciembre de 2026 reciben 7 días de prueba del plan Pro y, desde entonces, se aplica lo descrito en el párrafo anterior.

**§7, viñeta de inactividad** (reemplaza "estando en plan gratuito o con la suscripción vencida hace más de 15 días"):
> Un catálogo en pausa conserva su enlace personalizado por al menos 90 días. Pasado ese plazo, si no se ha contratado un plan y no hay actividad en la cuenta, podremos liberar el enlace, avisándote antes por WhatsApp. Tus productos y tu información no se eliminan.

**Fecha de "Última actualización":** el día del despliegue.

## Decisiones de Jack
- ✅ **Día S = 25 dic 2026** (24 nov): cumple los 30 días de aviso.
- ✅ **Cláusula de etapa de lanzamiento** (24 nov): planes pueden cambiar sin perjudicar a quien ya pagó ni borrar datos.
- ✅ **Enlace de un catálogo en pausa (§7)** (24 nov, Jack aceptó la recomendación: 90 días). F57 dijo "nada se borra y el enlace no se libera", pero §7 permite liberar el enlace de cuentas sin pagar e inactivas por 15 días. Recomendación de Claude: *"Un catálogo en pausa conserva su enlace por al menos 90 días. Pasado ese plazo, si no se contrata un plan y no hay actividad, podremos liberarlo, avisándote antes por WhatsApp."*
