# F55 · Prueba Pro de 7 días + premios por avanzar + imagen de "¡Ya tenemos catálogo!"

**Estado:** 🟢 Prioridad (Jack, 20 nov 2026, 13:11): se retoma antes de terminar el rediseño. Decisiones del 20 nov aplicadas: prueba de **7 días** + logros (hasta 14), sin logro de visitas, con imagen automática del catálogo.

## Por qué
- **52 de 64 tiendas reales están en Semilla.** Solo 16 de ellas (31 %) tienen 3 productos o más. Pagan 8 (12,5 %).
- **Hoy nadie prueba lo que se paga:** la tienda nace en Semilla y nunca ve banners, el catálogo sin sello, los precios por mayor ni el link de pedido.
- **Los premios actuales no empujan a avanzar:**
  - La encuesta tiene 3 respuestas y no filtra por antigüedad.
  - Los referidos son 3, con 0 premios entregados, y el premio es manual.
  - "Completa tu tienda" no da nada a cambio.
- **Jack propuso quitar el plan gratis por una prueba de 7 días.** Claude recomendó no apagar catálogos, porque los Semilla son publicidad gratis ("Hecho con Dizi") y 7 días es poco para una microemprendedora. La alternativa: empezar en Pro y caer a Semilla, con premios por avanzar.

## Dato que decide la duración (20 nov, producción, tiendas creadas desde el 1 ago, sin demos)
- 56 tiendas: 46 subieron al menos 1 producto y 20 llegaron a 3.
- **De esas 20, 18 llegaron a 3 productos en el primer día** y 19 en los primeros 3 días. Entre el día 3 y el 14 no llegó ninguna más.
- **40 de las 46 dejaron de subir productos después del primer día.**
- Conclusión: todo se decide en las primeras 24–72 h. Una prueba larga no aporta nada; conviene una prueba corta con urgencia que **se alarga solo para quien avanza**. Por eso: **7 días base + hasta 7 días de premio = máximo 14**.

## Qué cambia
1. **Prueba Pro al registrarse:** toda tienda nueva nace en **Pro con 7 días de prueba**. Así ve DIZI completo desde el primer día.
2. **Al terminar la prueba tiene los mismos 3 días de gracia que hoy** (decisión tras el Paso 0): 3 días después de que termina la prueba pasa a **Semilla**. El catálogo sigue en línea, con el sello y con sus límites. Las tiendas que pagan conservan sus 3 días de gracia como hoy.
3. **Premios por avanzar (logros).** Mientras dura la prueba, el servidor comprueba cada logro y suma días una sola vez por logro:
   | Logro | Cómo se comprueba | Premio |
   |---|---|---|
   | Sube 3 productos con foto | 3 o más productos visibles, con imagen y sin `is_sample` | +3 días |
   | Comparte tu tienda | 1 o más filas en `share_events` de la tienda | +2 días |
   | Ponle tu marca | logo + (banner o eslogan) | +2 días |
   - Tope: +7 días (la prueba llega como máximo a 14 días).
   - **Visitas no cuentan** como logro (la dueña puede inflarlas recargando su propia página).
4. **Se ve en el panel:**
   - **Inicio (F54):** la etiqueta dice "Prueba Pro · quedan N días".
   - **"Completa tu tienda"** muestra al lado de cada tarea su premio ("+3 días").
   - Al ganar un logro aparece un aviso: "¡Ganaste 3 días más de Pro!".
5. **Encuesta (próximas versiones):** solo pueden verla y responderla las tiendas con **14 días o más** desde que se crearon **y 3 productos o más**. La versión actual (cierra el 30 nov) no se toca.
6. **Imagen "¡Ya tenemos catálogo!" (automática):**
   - Al llegar a 3 productos con foto aparece en Inicio la tarjeta "Tu imagen de catálogo está lista", con la imagen ya armada.
   - La imagen es un collage con sus 4 primeros productos, el logo o la inicial, el nombre, el titular **"¡Ya tenemos nuestro catálogo! 🎉"**, "Míralo aquí 👇" con el link corto y un QR. Viene en formato historia y cuadrado y lleva el sello si es Semilla.
   - Botones "Compartir" (Web Share con la imagen + el texto con el link) y "Descargar", más un texto listo para copiar: "¡Ya tenemos nuestro catálogo! 🎉 Mira todos nuestros productos y pide por WhatsApp aquí: {link}".
   - También queda en Promociona, arriba, como "Comparte tu catálogo completo".
   - Compartirla registra `share_events` con `source='catalogo'` y cuenta para el logro "Comparte tu tienda".
7. **Textos de venta:**
   - Landing (CTA del hero y tarjeta Semilla): "Empieza con 7 días de Pro gratis".
   - Celebración del registro (F53): "Tienes 7 días de Pro gratis. Gana hasta 7 días más completando tu tienda".

## Requisitos funcionales
| RF | Descripción |
|---|---|
| RF-55.1 | En el INSERT de una tienda hecho por un usuario normal, el trigger `protect_store_billing_columns` asigna `plan='pro'`, `subscription_status='trial'` y `plan_expires_at = now() + 7 días`. Lo demás sigue igual (contadores en 0, etc.). |
| RF-55.2 | Las invitaciones (`?invite=`) y cualquier flujo de super admin siguen funcionando igual. Si una invitación asigna otro plan, ese plan manda sobre la prueba. |
| RF-55.3 | **Cambiado tras el Paso 0 (20 nov):** la prueba usa los **mismos 3 días de gracia** que los planes pagados. La base (`effective_product_limit`, `get_public_store`) ya aplica 3 días a todos sin distinguir la prueba; cambiar eso tocaría `get_public_store`, que es crítica. Así hay una sola regla en el cliente y en la base. `getEffectivePlan` no cambia. |
| RF-55.4 | Las tiendas existentes no cambian (ni su plan, ni su vencimiento, ni su estado). |
| RF-55.5 | Tabla `store_rewards (store_id, milestone, days, granted_at)` con UNIQUE(store_id, milestone). RLS: la dueña solo lee las suyas y el super admin lee todas. Nadie escribe directo. |
| RF-55.6 | RPC `claim_trial_rewards(p_store_id)` SECURITY DEFINER: comprueba que quien llama es la dueña, que la tienda está en prueba y no vencida, evalúa los 3 logros en la base, inserta los que falten y extiende `plan_expires_at` respetando el tope de +7 días. Devuelve los logros recién ganados. Si se llama varias veces, no duplica nada. |
| RF-55.7 | El panel llama a `claim_trial_rewards` al entrar a Inicio y después de guardar un producto, compartir o guardar logo o portada. Si gana algo, muestra un aviso y refresca la tienda. |
| RF-55.8 | `CompletaTuTienda` y `NextStepCard` muestran el premio de cada tarea y si ya lo ganó. |
| RF-55.9 | Regla de encuesta para próximas versiones: `canStoreTakeSurvey` exige 14 días o más desde `createdAt` y 3 productos reales o más. Se aplica cuando cambie `SURVEY_VERSION`; la versión `2026-11` no se toca. |
| RF-55.10 | Textos de la landing y de la celebración (punto 6). |
| RF-55.11 | Métricas: consulta guardada en `diseno.md` para medir los indicadores cada semana. |
| RF-55.12 | Nuevo estilo de imagen `catalogo` en `src/lib/share-image/` (collage de 1 a 4 productos; con 1–2 se adapta sin huecos), reutilizando la carga de recursos (`assets.ts`), el encabezado y el sello. Formatos historia y cuadrada. |
| RF-55.13 | Tarjeta "Tu imagen de catálogo está lista" en Inicio cuando hay 3 o más productos con foto. Se puede cerrar y queda en Promociona. Compartir/Descargar + texto con link. |
| RF-55.14 | `share_events.source` acepta `'catalogo'` (amplía el CHECK) y `product_id` puede ser NULL en ese caso (Paso 0: verificar). |

## Requisitos no funcionales
- **RNF-55.1 Seguridad:** plan, vencimiento y premios solo los cambia el servidor. La dueña no puede darse días con una llamada directa (hay prueba que lo comprueba).
- **RNF-55.2 Nada más cambia:** catálogos de tiendas existentes, precios, límites de cada plan, flujo de pago e invitaciones.
- **RNF-55.3 Celular primero.**
- **RNF-55.4 Hora de Lima** en todo cálculo de días que se muestre.

## Escenarios (cada uno es una prueba)
1. **Dado** un registro nuevo sin invitación, **entonces** la tienda queda en Pro, prueba, vence en 7 días, y el panel muestra "Prueba Pro · quedan 7 días".
2. **Dado** un registro con invitación a Emprendedor, **entonces** queda el plan de la invitación, no la prueba Pro.
3. **Dado** una tienda en prueba con 3 productos con foto, **cuando** se llama a `claim_trial_rewards`, **entonces** gana +3 días una vez; una segunda llamada no suma nada.
4. **Dado** 2 productos con foto y 1 sin foto, **entonces** no gana el logro de productos.
5. **Dado** una fila en `share_events`, **entonces** gana +2 días.
6. **Dado** logo + eslogan, **entonces** gana +2 días.
7. **Dado** los 3 logros, **entonces** el total es +7 días (14 en total) y no hay forma de pasar ese tope.
8. **Dado** una dueña que intenta `update stores set plan_expires_at=…` o un `insert` en `store_rewards`, **entonces** se rechaza.
9. **Dado** la prueba vencida hace 4 días, **entonces** `getEffectivePlan` y `effective_product_limit` devuelven Semilla (20) y el catálogo sigue en línea con el sello; vencida hace 2 días, sigue en Pro.
10. **Dado** una tienda pagada vencida hace 2 días, **entonces** sigue con su plan (gracia de 3 días, como hoy).
11. **Dado** una tienda en prueba vencida, **cuando** se llama a `claim_trial_rewards`, **entonces** no gana nada.
12. **Dado** una tienda de otra dueña, **cuando** se llama a `claim_trial_rewards` con ese id, **entonces** se rechaza.
13. **Dado** una tienda creada antes del despliegue, **entonces** nada cambia.
14. **Dado** una tienda con 10 días y 5 productos, **entonces** no puede responder la encuesta de una versión nueva; con 14 días o más y 3 productos o más, sí.
16. **Dado** una tienda con 3 productos con foto, **cuando** abre Inicio, **entonces** ve la tarjeta con la imagen del catálogo armada con sus productos, nombre, titular, link y QR; al compartir se registra `source='catalogo'` y gana el logro "Comparte tu tienda".
17. **Dado** una tienda con 2 productos con foto, **entonces** no aparece la tarjeta de imagen de catálogo.
18. **Dado** 4 estilos de producto + `catalogo` × formatos con y sin sello, **entonces** ningún elemento se cruza con el sello (misma prueba del fix del sello).
15. **Dado** la landing y la celebración, **entonces** dicen "7 días de Pro gratis".

## Indicadores (cada semana, desde el día del despliegue)
| Indicador | Línea base | Meta a 30 días |
|---|---|---|
| Tiendas nuevas con 3 productos o más a los 7 días | se mide en el Paso 0 (cohorte oct–nov) | 50 % |
| Tiendas nuevas que comparten algo en su primera semana | ~0 % | 25 % |
| Pruebas que terminan pagando | 12,5 % (total histórico) | 15 % |
| Respuestas de encuesta entre las tiendas elegibles | 6 % | 25 % (próxima versión) |

## Decisiones tomadas por defecto (Jack puede cambiarlas antes del Paso 1)
1. Prueba de **7 días + hasta 7 de premio** (por los datos del primer día).
2. Semilla se queda en **20 productos** para todos (una sola regla; se revisa con datos en 30 días).
3. Solo tiendas **nuevas**; las 52 en Semilla siguen igual.
4. Prueba **con los 3 días de gracia de siempre** (cambiado tras el Paso 0: la base ya los aplica a todos).
5. Premios: **+3 / +2 / +2**, tope +7. Sin logro de visitas.
6. Imagen automática del catálogo incluida en F55.

## Fuera de F55
- Premio automático de referidos y su nuevo lugar en el panel.
- Cobro en línea.
- Recordatorios por WhatsApp o correo de que termina la prueba.
- Una nueva encuesta (solo se deja lista la regla).
