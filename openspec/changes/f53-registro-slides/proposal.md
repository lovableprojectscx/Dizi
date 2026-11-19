# F53 · Registro en slides con vista previa en vivo (fase 1 de "Panel con más vida")

**Estado:** ✅ Aprobada por Jack (18 nov 2026) · **Planes:** todos · **Base:** F49 en producción (`e528b45`), recorrido de Claude, referencias de Jack (registro de Higgsfield) y manual de marca (`01-MARCA/dizi-identidad-visual-informe-interno.md`).

## Por qué
F49 dejó el registro corto y funcional (2 pasos), pero sigue siendo **un formulario en una tarjeta**: etiquetas chicas en mayúsculas, todos los campos a la vista y, en escritorio, el 70 % de la pantalla vacía. Jack lo ve poco profesional frente a registros como el de Higgsfield. Además, el panel usa la marca a medias: casi todo es coral sobre crema y el índigo principal casi no aparece; el manual advierte que el texto blanco chico sobre coral no pasa contraste AA.

**Idea central (el toque de DIZI):** en vez del video de stock de Higgsfield, **la clienta ve su propia tienda armándose mientras responde**. Es el arquetipo de marca (el Mago: de fotos sueltas a vitrina profesional) contado en vivo, y vende el producto antes de crear la cuenta.

## Qué tomamos de la referencia y qué no
| Tomamos | No tomamos |
|---|---|
| Una pregunta por pantalla, título grande en dos tonos | Video de stock (pesa en datos móviles y no dice nada a la clienta) |
| Tarjetas con ícono que se responden con un toque y avanzan solas | Fondo oscuro (DIZI es crema y cálido) |
| Progreso siempre visible ("Paso 2 de 5", barra) y flecha para volver | Preguntas de segmentación que no usamos |
| Pantalla partida en escritorio | |
| Una línea abajo que explica para qué se pregunta | |

## Recorrido nuevo
| # | Pantalla | Respuesta | Qué cambia en la vista previa |
|---|---|---|---|
| 1 | "¿Cómo se llama tu negocio?" | Escribe | Aparece su nombre y su inicial como logo |
| 2 | "¿Qué vendes?" | Toca una de las 12 tarjetas de rubro; avanza sola | Cambian el diseño, los colores y los productos de ejemplo del rubro |
| 3 | "¿A qué WhatsApp te escriben tus clientes?" | Escribe (con la validación de hoy) | Aparece el botón "Pedir por WhatsApp" |
| 4 | "Dos datos rápidos" | Toca "¿En qué ciudad vendes?" y "¿Cómo nos conociste?"; ambos opcionales, con "Saltar" | — |
| 5 | "Crea tu cuenta" | Correo, contraseña, link ya completado (editable) y términos → "Crear mi catálogo" | — |
| 6 | "¡Florería María ya está en línea! 🎉" | — | Su catálogo, con "Sube tu primer producto" (va a `/admin/productos?bienvenida=1`) y "Compartir mi link" |

- **Celular:** arriba, la flecha para volver, "Paso N de 5" y la barra; debajo, una vista previa compacta (el encabezado de su tienda y 2 productos, a escala) y la pregunta. Las tarjetas ocupan todo el ancho.
- **Escritorio:** pantalla partida; a la izquierda un celular con su catálogo en vivo, a la derecha la pregunta.
- Con `?invite=`, `?plan=`, `?ref=` y `?origen=` todo funciona igual que en F49.

## Reglas de marca (del manual, obligatorias)
- **Colores:** fondo crema `#FAF7F2`; **índigo `#312E81`** para títulos, progreso de fondo, borde de la tarjeta elegida y texto principal; **coral `#FF5C39` solo para la acción** (botón principal, barra de progreso avanzada, el momento de celebración). Nada de colores nuevos.
- **Contraste:** el texto blanco sobre coral solo va en 18 px negrita o más; en otro caso, el texto va en índigo oscuro.
- **Tipografía:** títulos en **Sora** SemiBold/Bold de 28–36 px, en dos tonos (índigo y índigo al 55 %); cuerpo e interfaz en **Inter**, nunca menos de 16 px; leyendas de 13 px. Sin mayúsculas sostenidas en los títulos.
- **Íconos:** de línea, un solo trazo, en índigo, del mismo set que ya usa el panel (lucide). Sin ilustraciones 3D ni personajes.
- **Tono:** tuteo cálido y profesional, español peruano neutro ("Tu negocio ya se ve como lo que es").
- **Movimiento:** transiciones cortas (200–300 ms) entre pantallas, respetando `prefers-reduced-motion`.

## Alcance
- Las 6 pantallas, la vista previa en vivo, la ciudad, la celebración y la medición por pantalla.
- Productos de ejemplo por rubro para la vista previa (solo visuales, nunca se guardan en la tienda).
- **Fuera de F53:** Inicio y Promociona (fase 2), el resto del panel (fase 3), entrar con Google, video.

## Requisitos funcionales
| RF | Descripción |
|---|---|
| RF-53.1 | El registro tiene las 6 pantallas de la tabla, una pregunta por pantalla, con progreso y flecha para volver sin perder lo escrito |
| RF-53.2 | Las tarjetas de rubro, ciudad y origen avanzan con un toque; teclado: Enter avanza y las flechas recorren las tarjetas |
| RF-53.3 | La vista previa se actualiza en vivo con el nombre, el rubro (diseño, paleta y productos de ejemplo) y el WhatsApp |
| RF-53.4 | "¿En qué ciudad vendes?" es opcional; se guarda en `stores.signup_city`. Si el país no es Perú, no se muestra |
| RF-53.5 | La pantalla 6 celebra con el nombre de la tienda y ofrece "Sube tu primer producto" y "Compartir mi link" (copiar y WhatsApp) |
| RF-53.6 | El embudo registra cada pantalla: `vio_registro`, `completo_nombre`, `completo_rubro`, `completo_whatsapp`, `completo_datos`, `creo_cuenta`, `creo_producto`, `salto_producto` |
| RF-53.7 | Se conservan todas las reglas de F49: link automático y verificado, términos, invitaciones, referidos, plan pedido, origen y reintento sin columnas nuevas |

## Requisitos no funcionales
- RNF-53.1 Nada más cambia: las tiendas existentes, sus catálogos y el panel quedan igual.
- RNF-53.2 Celular primero: botones y tarjetas de 48 px mínimo; la pregunta y el botón siempre visibles con el teclado abierto.
- RNF-53.3 Rendimiento: la vista previa carga después de la primera pantalla y no bloquea escribir; la página del registro no puede pesar más de 150 KB gzip por encima de la de hoy (medido en el build).
- RNF-53.4 Accesibilidad: contraste AA en todo el texto, foco visible y navegable con teclado.
- RNF-53.5 Una sola fuente de verdad: rubros, ciudades y productos de ejemplo en `src/lib/`.
- RNF-53.6 Primero la migración y después el merge.

## Escenarios (cada uno es una prueba)
1. Dado el celular, cuando completo las 6 pantallas, entonces se crea la cuenta y veo la celebración con el nombre de mi tienda.
2. Dado que escribo "Florería María", entonces la vista previa muestra ese nombre y la inicial "F".
3. Dado que toco Florería, entonces avanza solo y la vista previa cambia al diseño y los colores de Florería, con productos de ejemplo de flores.
4. Dado que vuelvo atrás desde la pantalla 4, entonces mis respuestas siguen ahí.
5. Dado que toco "Saltar" en "Dos datos rápidos", entonces la tienda queda con ciudad y origen vacíos y el registro sigue.
6. Dado país distinto de Perú, entonces no se pregunta la ciudad.
7. Dado `?origen=tiktok`, `?ref=`, `?invite=` y `?plan=`, entonces se comportan igual que en F49.
8. Dado el escritorio a 1280 px, entonces veo la pantalla partida con el celular en vivo.
9. Dada la pantalla 6, cuando toco "Sube tu primer producto", entonces llego al formulario de bienvenida de F49.
10. Dado un recorrido, entonces el embudo registra cada pantalla, sin datos personales.
11. Dado `prefers-reduced-motion`, entonces no hay animaciones de deslizamiento.
12. Dado el texto sobre coral, entonces cumple el contraste de la regla de marca (prueba automática de contraste).

## Cómo medimos
Línea base: los datos de F49 durante al menos 7 días antes del merge de F53. Comparamos el porcentaje que llega a "creo_cuenta" desde "vio_registro", y el porcentaje con 1 o más productos a las 24 h. Si F53 no mejora el primero, se revisa o se vuelve a F49.

## Decisiones de Jack (18 nov)
- Vista previa en vivo en lugar de video. ✅
- Pregunta de ciudad, opcional. ✅
- Usar el brand kit tal como dice el manual. ✅

## Validación con Jack antes de producción (decisión de Jack, 18 nov)
Nada pasa a producción sin la certificación de Jack.
1. El prototipo es el **registro real en la rama**, publicado en el **enlace Preview de Vercel** de la rama. No hay mockups HTML.
2. **Modo prueba en Preview:** si `import.meta.env.VITE_VERCEL_ENV === 'preview'` (o con `?prueba=1` en local), "Crear mi catálogo" **no llama a `signUp` ni a `addStore`**: simula la creación y pasa a la celebración. Tampoco escribe en `signup_funnel_events`. Un aviso pequeño, "Modo prueba: no se crea ninguna cuenta", queda visible en esas pantallas. En producción no existe.
3. Jack prueba en su celular y en la PC y deja sus comentarios; Antigravity ajusta en la misma rama y se repite el ciclo.
4. Cuando Jack escribe "certificado", y con al menos 7 días de datos de F49: respaldo, migración con OK y merge.
5. Escenario 13: dado el entorno Preview, cuando toco "Crear mi catálogo", entonces no se crea cuenta ni tienda y veo la celebración con el aviso de modo prueba.
