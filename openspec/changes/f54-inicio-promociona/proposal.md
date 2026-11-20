# F54 · Inicio y Promociona con más vida (fase 2 de "Panel con más vida")

**Estado:** 📝 Propuesta (19 nov 2026), pendiente de OK de Jack · **Planes:** todos · **Base:** master `d226210` (F53 en producción), recorrido de Claude por `/admin/dashboard` y `/admin/marketing` en producción y manual de marca (`01-MARCA/dizi-identidad-visual-informe-interno.md`).

## Por qué
- **Todo pesa igual.** Inicio y Promociona son tarjetas blancas sobre crema, una debajo de otra. Nada dice "empieza por aquí". Jack lo ve monótono.
- **Inicio no muestra la tienda:** no hay ni una foto de los productos; solo avisos, un link y números.
- **Los avisos se apilan arriba:** productos incompletos (ámbar), encuesta (verde, fuera de la marca) y "Tu catálogo está listo".
- **Los números no dicen desde cuándo.** "Plan actual" ocupa una tarjeta y no aporta.
- **Promociona parece la lista de Productos:** son filas de texto con "Crear", sin mostrar qué imagen vas a obtener.
- **El dato:** Promociona lleva **0 usos reales** desde que salió (`share_events` con `source='marketing'` = 0; en todo DIZI hay 1 sola imagen compartida, desde Productos).
- **"Comparte"** (`ShareCatalogCard`) está repetido igual en las dos pantallas.
- **Navidad está a 5 semanas.** Es el mejor momento para que las tiendas promocionen.

## Idea central
- **Inicio = "tu tienda hoy".** Ves tu tienda (tus fotos), sabes qué hacer ahora (un solo paso) y la compartes.
- **Promociona = "estudio".** Ves tu mejor producto ya convertido en historia, en cada estilo, y lo creas con un toque.

## Recorrido nuevo
### Inicio (`/admin/dashboard`), de arriba abajo
1. **Franja de bienvenida (índigo):** "Hola, {nombre de la tienda}", el plan como etiqueta (en prueba: "Prueba · quedan N días") y, a la derecha (abajo en celular), un **mosaico con 4 fotos reales** de sus productos y el botón "Ver mi catálogo". Sin productos con foto, el mosaico se reemplaza por un espacio vacío con "Aquí aparecerán tus productos".
2. **Tarjeta "Tu siguiente paso":** una sola, según la prioridad de RF-54.3. Debajo, como máximo 2 enlaces chicos "También pendiente: …".
3. **"Comparte tu negocio":** el `ShareCatalogCard` de hoy, sin cambios de lógica.
4. **Números:** 3 tarjetas (Productos activos, Visitas, Clics a WhatsApp) con la etiqueta "en total" y sin la tarjeta "Plan actual".

### Promociona (`/admin/marketing`), de arriba abajo
1. **Franja (índigo):** "Promociona", con el texto "Convierte tus productos en historias y estados que venden".
2. **"Así se ve tu producto":** el producto elegido (RF-54.6) dibujado en miniatura con cada estilo disponible (3 o 4). Al tocar un estilo se abre el creador de hoy con ese estilo ya elegido. Hay un enlace "Usar otro producto" que baja a la cuadrícula.
3. **"Ideas para vender":** hasta 2 tarjetas de fechas próximas (por ejemplo "Navidad · en 36 días") con un consejo de una línea y el botón "Crear para {fecha}". El botón abre el creador con el producto de arriba y el estilo sugerido.
4. **Elige un producto:** cuadrícula de fotos grandes (2 columnas en celular, 4 en escritorio) con nombre y precio debajo, y el buscador de hoy. Al tocar la foto se abre el creador.
5. **Sin "Comparte tu catálogo"** (queda solo en Inicio).

## Requisitos funcionales
| RF | Descripción |
|---|---|
| RF-54.1 | Franja de bienvenida en Inicio: saludo con el nombre, etiqueta de plan/prueba (reemplaza la tarjeta "Plan actual") y "Ver mi catálogo" (abre el catálogo público en otra pestaña). |
| RF-54.2 | Mosaico de hasta 4 fotos reales: productos visibles, con foto, sin `isSample`, ordenados como en el catálogo (`sortOrder`). Con 1–3 fotos, el mosaico se adapta sin huecos. Con 0, se muestra el estado vacío. |
| RF-54.3 | Una sola tarjeta "Tu siguiente paso". Orden de prioridad: (a) sin productos → "Agrega tu primer producto"; (b) tienda elegible para `CompletaTuTienda` (F49) y no descartada → se muestra `CompletaTuTienda` en ese lugar; (c) productos incompletos → "Completa N productos"; (d) prueba con 3 días o menos → "Elige tu plan"; (e) encuesta disponible → "Responde 7 preguntas y gana 15 días"; (f) si no hay nada pendiente → "Crea una imagen para tus estados" (va a Promociona). |
| RF-54.4 | "También pendiente": como máximo 2 enlaces de texto con los siguientes casos de la lista (c)–(e) que apliquen. |
| RF-54.5 | Números: 3 tarjetas con la etiqueta "en total"; se quita "Plan actual". Los valores salen de los mismos campos de hoy (`views`, `whatsappClicks`, productos visibles/límite). |
| RF-54.6 | Producto para "Así se ve tu producto": el primero visible, con foto y sin `isSample` según `sortOrder`. Si ese producto no tiene precio de oferta, no se muestra el estilo "Oferta" (misma regla que el creador de hoy). |
| RF-54.7 | Las miniaturas se dibujan con la misma función del creador (`drawShareImage`), sin código de dibujo nuevo, y solo cuando la sección es visible. |
| RF-54.8 | `ShareImageDialog` acepta un estilo inicial opcional. Sin él, se comporta exactamente como hoy. |
| RF-54.9 | "Ideas para vender": lista fija de fechas comerciales de Perú en un archivo de lógica pura. Se muestran las 2 más cercanas dentro de los próximos 45 días; si no hay ninguna, se muestra 1 idea permanente ("Producto de la semana"). Cada idea tiene título, consejo, estilo sugerido y plantilla de texto (`CaptionTemplate` existente). |
| RF-54.10 | Cuadrícula de productos con foto grande; los productos sin foto muestran el ícono de hoy. Se conserva el buscador. |
| RF-54.11 | Las imágenes creadas desde Promociona se siguen registrando con `source='marketing'`, y desde Productos con `'productos'`. |
| RF-54.12 | Estados de Promociona sin productos: se conserva el de hoy (RF-52.4), con la franja nueva arriba. |

## Requisitos no funcionales
- **RNF-54.1 Nada más cambia:** ni el catálogo público, ni Productos, ni el creador (salvo el estilo inicial opcional), ni la base de datos, ni el registro.
- **RNF-54.2 Una sola fuente de verdad:** la prioridad del siguiente paso, la elección del producto y las fechas viven en funciones puras con prueba; la UI solo las muestra.
- **RNF-54.3 Marca (obligatorio):**
  - **Índigo** (`--brand`, `#312E81`) en las franjas, con texto crema.
  - **Coral** (`--primary`, `#FF5C39`) solo en el botón principal de cada pantalla.
  - La encuesta y los avisos dejan el verde y el ámbar. Usan índigo, y el ámbar solo como borde de alerta en "productos incompletos".
  - **Sora** en los títulos, **Inter** de 16 px o más en el cuerpo y 13 px en las leyendas.
  - **Ojo:** en el código, `bg-primary` es coral, no índigo.
- **RNF-54.4 Contraste AA (4,5:1)** en todo texto, en modo claro y oscuro (en oscuro `--brand` es `#6C67E8` y el texto blanco chico sobre él no pasa). Se comprueba con una prueba.
- **RNF-54.5 Celular primero (375 px)**, sin desplazamiento horizontal.
- **RNF-54.6 Peso:** las miniaturas y las ideas se cargan en diferido; el chunk de `/admin/marketing` no crece más de 15 KB gzip.
- **RNF-54.7 Movimiento:** como mucho transiciones de 200–300 ms, respetando `prefers-reduced-motion`.

## Escenarios (cada uno es una prueba)
1. **Dado** una tienda con 6 productos con foto, **cuando** abre Inicio, **entonces** ve "Hola, {nombre}" y un mosaico con las 4 primeras fotos según `sortOrder`.
2. **Dado** una tienda sin productos, **cuando** abre Inicio, **entonces** el siguiente paso es "Agrega tu primer producto" y el mosaico muestra el estado vacío.
3. **Dado** una tienda elegible para `CompletaTuTienda`, **entonces** esa tarjeta ocupa el lugar del siguiente paso y no aparece ninguna otra tarjeta de paso.
4. **Dado** 3 productos incompletos y la encuesta disponible, **entonces** el paso es "Completa 3 productos" y "También pendiente" muestra la encuesta.
5. **Dado** una prueba con 2 días restantes y nada más pendiente, **entonces** el paso es "Elige tu plan" y la etiqueta dice "Prueba · quedan 2 días".
6. **Dado** nada pendiente, **entonces** el paso es "Crea una imagen para tus estados" y lleva a `/admin/marketing`.
7. **Dado** Inicio, **entonces** hay 3 tarjetas de números con "en total" y no existe "Plan actual".
8. **Dado** un producto principal sin oferta, **cuando** abre Promociona, **entonces** ve 3 miniaturas (Etiqueta, Editorial, Marco de color); con oferta, ve 4.
9. **Dado** Promociona, **cuando** toca la miniatura "Editorial", **entonces** el creador se abre con ese producto y "Editorial" ya elegido; al exportar se registra `source='marketing'`.
10. **Dado** la fecha 19 nov 2026, **entonces** "Ideas para vender" muestra Black Friday (27 nov) y Navidad (25 dic), en ese orden. **Dado** el 10 ago 2026 (sin fechas en 45 días), **entonces** muestra "Producto de la semana".
11. **Dado** Promociona, **entonces** no aparece "Comparte tu catálogo", y en Inicio sigue apareciendo.
12. **Dado** el creador abierto desde Productos, **entonces** abre en "Etiqueta" como hoy y registra `source='productos'`.
13. **Dado** el modo oscuro, **entonces** todos los textos de las franjas y las tarjetas pasan 4,5:1.
14. **Dado** 375 px, **entonces** ni Inicio ni Promociona tienen desplazamiento horizontal y el mosaico, las miniaturas y la cuadrícula se ven completos.

## Validación con Jack antes de producción
Igual que F53: rama → Preview de Vercel → **Claude lo prueba entero** (celular y escritorio, en una tienda `zz-audit-*` o demo) → Jack solo mira y escribe "certificado" → merge. Sin migración.

## Fuera de F54
- Visitas y clics por semana (necesitan guardar eventos por día: sería un F aparte con migración).
- Rediseñar el creador por dentro, Productos, Diseño y el resto del panel (fase 3), plantillas nuevas de imagen, IA de imágenes.

## Decisiones tomadas (20 nov)
1. **Textos de "Ideas para vender":** se usan los textos del borrador de `diseno.md` tal cual.
2. **"Comparte tu negocio":** queda solo en Inicio; se quita de Promociona.
3. **Números por semana:** fuera de F54 (para un F aparte con migración).
4. **Encuesta:** solo cambia a colores de marca dentro de `NextStepCard` (cierra el 30 nov por código, sin tocar esa lógica).
5. **Estilo "Oferta" en miniaturas:** `StylePreviewStrip` muestra "Oferta" solo si `shareData.isOnSale` es verdadero (el creador mantiene su regla actual).
6. **Contraste y tokens:** texto sobre coral en `#1E1B4B` (`--color-dizi-ink`), franja en `#312E81` + crema en claro y oscuro, usando tokens de `src/styles.css`.
7. **Móvil (375 px):** números en una sola tarjeta con los 3 valores en fila separados por líneas (3 tarjetas a ≥ 640 px); miniaturas en carrusel horizontal con snap (fila de 3–4 a 1280 px).
