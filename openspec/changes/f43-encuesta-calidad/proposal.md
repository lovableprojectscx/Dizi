# F43 · Encuesta de calidad dentro de DIZI: propuesta y requisitos

**Estado:** aprobado por Jack (3 nov 2026) · **Planes:** Semilla, Emprendedor y Pro (Ilimitado no: hoy son demos o tiendas de Jack)
**Por qué:** hay que decidir si Semilla se queda y a qué precio. Faltan dos datos que solo dan los clientes: si los que pagan empezaron gratis y cuánto pagarían los de Semilla. La encuesta va dentro del panel para que cada respuesta quede ligada a su tienda y se responda una sola vez.

## Alcance v1
- Encuesta de 7 preguntas en `/admin`, distinta según el plan efectivo de la tienda.
- Al terminar, la tienda recibe un **código de premio** y un botón para mandarlo por WhatsApp a DIZI.
- **El premio lo aplica Jack a mano** desde el panel super (no hay canje automático en la v1).
  - Semilla: 15 días de prueba de Emprendedor (botón "Trial Emprendedor" que ya existe).
  - Emprendedor y Pro: 15 días más de su plan actual (extensión por días, nueva).
- Vista en `/super` para ver las respuestas, aplicar el premio y exportar a CSV.
- **Fuera de la v1:** canje automático del código, encuestas editables desde el super, varias encuestas a la vez.

## Preguntas (versión `2026-11`)
Lo que la base ya sabe (plan, productos, fecha de registro, diseño) no se pregunta.

**Para todos (1 a 3)**
1. ¿Cómo conociste DIZI? (TikTok / Facebook / recomendación / Idenza / otro)
2. ¿Te llegan pedidos de clientes desde tu catálogo? (casi todos mis pedidos / algunos / pocos / ninguno)
3. Del 0 al 10, ¿recomendarías DIZI a otro negocio?

**Semilla (4 a 7)**
4. ¿Para qué creaste tu catálogo? (vender por WhatsApp / link en bio / solo probar / otro)
5. ¿Qué te frena para cargar más productos? (tiempo / es difícil / no sé cómo / no lo necesito / otro)
6. ¿Qué tendría que tener DIZI para que pagues un plan? (texto corto)
7. ¿Cuánto pagarías al mes por tu catálogo? (nada / S/ 10 / S/ 20 / S/ 40 o más)

**Emprendedor (4 a 7)**
4. ¿Empezaste con el plan gratis antes de pagar? (sí / no)
5. ¿Qué te hizo decidir pagar? (más productos / quitar la marca DIZI / PDF / banner / precio por mayor / otro)
6. ¿Qué te haría pasar a Pro? (cintillo de anuncios / 3 banners / varios vendedores / más productos / nada)
7. ¿Te interesa pagar el año completo con 25% de descuento? (sí / no)

**Pro (4 a 7)**
4. ¿Empezaste con el plan gratis antes de pagar? (sí / no)
5. ¿Qué funciones de Pro usas? (cintillo / varios banners / varios vendedores / más productos / ninguna en especial) · varias respuestas
6. ¿Piensas renovar? (sí / tal vez / no) + texto corto opcional "¿por qué?"
7. ¿Te interesa pagar el año completo con 25% de descuento? (sí / no)

## Requisitos funcionales
| ID | Requisito |
|---|---|
| RF-43.1 | El dashboard de `/admin` muestra una tarjeta "Responde 7 preguntas y gana 15 días" a las tiendas que pueden responder y aún no respondieron la versión vigente. Lleva a `/admin/encuesta`. |
| RF-43.2 | El grupo de preguntas se elige por el plan efectivo (`getEffectivePlan`). Una tienda en prueba (`subscription_status = 'trial'` y plan distinto de Semilla) responde las de **Semilla**, porque todavía no pagó. Ilimitado no ve la encuesta. |
| RF-43.3 | Todas las preguntas son obligatorias salvo el "¿por qué?" de Pro. Los textos tienen máximo 300 caracteres. No se piden datos personales. |
| RF-43.4 | Se guarda una sola respuesta por tienda y versión. Si ya respondió, `/admin/encuesta` muestra su código y el botón de WhatsApp, sin volver a preguntar. |
| RF-43.5 | Al guardar, el **servidor** genera el código (formato `DZ-` + 6 caracteres sin letras confusas) y guarda el plan efectivo del momento. El navegador no elige ni el código ni el plan. |
| RF-43.6 | La pantalla final muestra el código, el premio que corresponde ("15 días de Emprendedor" o "15 días más de tu plan") y el botón "Enviar por WhatsApp" con el mensaje: `Hola, terminé la encuesta de DIZI. Mi código es DZ-XXXXXX (tienda: <slug>).` |
| RF-43.7 | `/super/encuestas` lista las respuestas: tienda, plan al responder, fecha, código, estado del premio (pendiente / aplicado / rechazado), cuántas tiendas tiene el mismo dueño, y las 7 respuestas. Filtro por plan y por estado. Búsqueda por código. |
| RF-43.8 | Desde esa vista, "Aplicar premio": en Semilla activa la prueba de 15 días de Emprendedor con la misma lógica del botón actual; en Emprendedor o Pro extiende 15 días el plan actual sin cambiar el plan. Luego marca el premio como aplicado, con fecha. "Rechazar" lo marca como rechazado (por ejemplo, cuenta duplicada). |
| RF-43.9 | Un premio aplicado o rechazado no se puede volver a aplicar. |
| RF-43.10 | `/super/encuestas` exporta todas las respuestas a CSV (una columna por pregunta), sin correos ni teléfonos. |
| RF-43.11 | La encuesta solo se muestra a tiendas **reales** en Semilla, Emprendedor y Pro: las demo quedan fuera (el Paso 0 dice cómo se distingue una demo). |
| RF-43.12 | La versión `2026-11` cierra el **30 nov 2026 a las 23:59 (America/Lima)**. La fecha vive en `src/lib/survey.ts` (`SURVEY_CLOSES_AT`) y el servidor la valida. Después del cierre no se muestra la tarjeta, `/admin/encuesta` dice que la encuesta terminó (si ya respondió, sigue viendo su código) y el RPC de guardar rechaza. Aplicar premios sigue permitido después del cierre. |

## Requisitos no funcionales
- **RNF-43.1 Sin cambios para nadie más:** el catálogo público, el Bio, el PDF y el mensaje de pedido quedan idénticos. Solo cambian el dashboard de `/admin` (la tarjeta) y las dos rutas nuevas.
- **RNF-43.2 Una sola fuente de verdad:** las preguntas, sus opciones y la versión viven en `src/lib/survey.ts`. El servidor valida contra la misma lista de claves.
- **RNF-43.3 Seguridad:** guardar y aplicar premios solo por RPC con `SECURITY DEFINER` y `SET search_path = public, pg_temp`. Guardar: solo el dueño de la tienda. Aplicar o rechazar: solo super_admin. RLS en la tabla: el dueño ve solo su fila; nadie la edita directo.
- **RNF-43.4 Celular primero:** la encuesta se ve bien en `movil-android`, una pregunta por pantalla o todas en una columna, botones grandes.
- **RNF-43.5 Rendimiento:** el dashboard hace como máximo una consulta extra para saber si mostrar la tarjeta.

## Escenarios de aceptación (Dado / Cuando / Entonces) → cada uno es una prueba
1. **Semilla ve sus preguntas.** Dada una tienda `zz-audit` en Semilla, cuando abre `/admin/encuesta`, entonces ve las preguntas 1 a 3 y las 4 a 7 de Semilla.
2. **Prueba = Semilla.** Dada una tienda en prueba de Emprendedor, entonces ve las preguntas de Semilla.
3. **Pro ve las suyas.** Dada una tienda Pro activa, entonces ve las 4 a 7 de Pro.
4. **Ilimitado no la ve.** Dada una tienda Ilimitado, entonces no hay tarjeta en el dashboard y `/admin/encuesta` dice que no aplica.
5. **Obligatorias.** Cuando falta una respuesta obligatoria, entonces no se envía y se marca cuál falta.
6. **Código del servidor.** Cuando envía, entonces se guarda una fila con el plan efectivo y un código `DZ-XXXXXX` único, y la pantalla muestra ese código y el enlace de WhatsApp con el mensaje exacto de RF-43.6.
7. **Una sola vez.** Dada una tienda que ya respondió, cuando vuelve a entrar o llama al RPC de nuevo, entonces no se crea otra fila y ve el mismo código.
8. **Ajena no.** Dado un usuario que no es dueño de la tienda, cuando llama al RPC de guardar con ese `store_id`, entonces se rechaza.
9. **Premio Semilla.** Dada una respuesta pendiente de una tienda Semilla, cuando el super aplica el premio, entonces la tienda queda en Emprendedor en prueba hasta hoy + 15 días y el premio en "aplicado".
10. **Premio de pago.** Dada una respuesta pendiente de una tienda Pro que vence el día X, cuando el super aplica el premio, entonces sigue en Pro y vence el día X + 15. Si ya estaba vencida, vence hoy + 15.
11. **Sin doble premio.** Dado un premio aplicado o rechazado, cuando se intenta aplicar otra vez, entonces se rechaza.
12. **Solo super.** Cuando un dueño llama al RPC de aplicar premio, entonces se rechaza.
13. **CSV.** Cuando el super exporta, entonces el CSV trae una fila por respuesta y no trae correos ni teléfonos.
14. **Nada más cambia.** Dado el catálogo de una tienda `zz-audit`, entonces la captura antes y después del cambio es igual.
15. **Cierre.** Dada la fecha de cierre ya pasada, cuando una tienda sin respuesta abre el panel, entonces no ve la tarjeta y el RPC de guardar se rechaza; una tienda con respuesta sigue viendo su código.
16. **Demo fuera.** Dada una tienda demo, entonces no ve la tarjeta.

## Decisiones de Jack (3 nov 2026)
- **A quién se muestra:** todas las tiendas reales en Semilla, Emprendedor y Pro, sin las demo. Las cuentas vacías o duplicadas pueden responder; Jack decide el premio al aplicarlo.
- **WhatsApp del botón:** +51 925 176 472 (el de la hoja de precios). Si ya hay una constante con ese número en el código, se usa esa.
- **Cierre:** 30 nov 2026, 23:59 hora de Lima. Se puede extender cambiando `SURVEY_CLOSES_AT`.
