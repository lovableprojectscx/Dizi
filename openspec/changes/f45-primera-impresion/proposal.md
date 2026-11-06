# F45 · Primera impresión: propuesta y requisitos

**Estado:** aprobado por Jack (4 nov 2026), con las recomendaciones de Claude: portada de marca en Semilla (opción B) y publicidad solo en el pie con menos de 4 productos. **Va después del merge de F41b.** **Planes:** todos (sobre todo Semilla).
**Por qué:** una tienda recién creada en DIZI se ve vacía (sin portada, 1 producto, la publicidad ocupando la mitad y espacio en blanco), y es justo cuando la dueña decide si se queda. Además le pedimos una portada que no mostramos: 15 de 42 tiendas Semilla subieron una que no se ve.

## Alcance v1
1. **Portada de marca automática** cuando la tienda no tiene portada con foto visible: logo, nombre, eslogan corto y fondo con el color de la marca. Para todos los planes y diseños.
2. **El asistente de inicio no pide lo que el plan no muestra.**
3. **Catálogo con pocos productos que no se vea vacío.**
4. **Publicidad de Dizi más liviana y en su lugar.**
5. **Paletas listas por rubro** en el registro.

**Fuera de la v1:** cambiar los diseños de las tarjetas (eso es F41/F41b), la landing (F47), el orden de los pasos del registro ("Producto primero"), y cualquier cambio de precios o planes.

## Requisitos funcionales
| Id | Requisito |
|---|---|
| RF-45.1 | Si la tienda no tiene portada con foto visible para su plan, el catálogo muestra la **portada de marca**: logo (o la inicial si no hay), nombre de la tienda y eslogan. El fondo usa el color de marca con un degradado suave y legible. Se adapta al diseño: en los diseños claros, fondo claro con acento del color; en los oscuros, fondo oscuro. |
| RF-45.2 | **Eslogan:** se usa `banner_tagline`. Si está vacío, un texto por rubro ("Moda que te queda", "Hecho con cariño, directo a tu mesa", etc., lista en `diseno.md`). La dueña lo edita en Diseño. |
| RF-45.3 | Si la tienda **sí** tiene portada con foto visible para su plan, todo queda igual que hoy. |
| RF-45.4 | **Asistente de inicio:** en Semilla, el paso 1 ya no pide "Banner de Portada". En su lugar muestra la portada de marca con el campo del eslogan y el texto "La portada con tu foto se activa desde el plan Emprendedor". En los planes de pago, igual que hoy. *(Decidido: opción B.)* |
| RF-45.5 | **Pocos productos:** con 1 a 3 productos visibles, la publicidad de Dizi no ocupa un lugar en la grilla; queda solo el pie "Crea tu catálogo gratis con Dizi". Desde 4 productos, igual que hoy. *(Decidido.)* |
| RF-45.6 | Con 1 a 3 productos, debajo de la grilla se muestra una franja de contacto: "¿Buscas algo más? Escríbenos" con el botón de WhatsApp, para que el catálogo corto no termine en blanco. |
| RF-45.7 | La imagen de la publicidad de Dizi se sirve a un tamaño acorde a la tarjeta (máximo 600 px de ancho) y no tarda en verse. |
| RF-45.8 | **Paletas por rubro en el registro:** además del color de marca, la dueña puede elegir entre 3 paletas sugeridas para su rubro (fondo, tarjeta y acento), tomadas de `theme-presets.ts`. Se ven en la vista previa antes de crear la tienda. |

## Requisitos no funcionales
- **RNF-45.1 Nada más cambia sin OK:** las tiendas con portada con foto visible se ven idénticas (capturas antes y después de `/t/catalogo`, `/t/onfeet`, `/t/jhoselynperu`, `/bio/milance`). Las tiendas **sin** portada visible sí cambian (ganan la portada de marca): Jack aprueba con la lista de esas tiendas y sus capturas antes y después, tienda por tienda, antes del merge.
- **RNF-45.2 Una sola fuente de verdad:** una sola función decide si se ve la portada con foto o la de marca (usa `getMaxAllowedBanners`); un solo componente `BrandCover`.
- **RNF-45.3 Celular primero:** la portada de marca no ocupa más de un tercio de la pantalla a 375 px; el texto nunca se sale de la pantalla.
- **RNF-45.4 Contraste:** texto de la portada con contraste AA sobre su fondo, para cualquier color de marca.
- **RNF-45.5 Sin migración** si basta `banner_tagline` (confirmar en el Paso 0).

## Escenarios
- **E1** Dado una tienda Semilla sin portada visible, entonces veo la portada de marca con su logo, nombre y eslogan.
- **E2** Dado una tienda sin eslogan y rubro `ropa`, entonces el eslogan es el texto de ese rubro.
- **E3** Dado una tienda Pro con portada con foto, entonces se ve igual que antes.
- **E4** Dado un color de marca muy claro (#ffffff) o muy oscuro (#000000), entonces el texto de la portada sigue legible.
- **E5** Dado el asistente en Semilla, entonces no aparece "Banner de Portada" y sí el eslogan.
- **E6** Dado una tienda Semilla con 1 producto, entonces no hay tarjeta de publicidad en la grilla y sí la franja de contacto y el pie de Dizi.
- **E7** Dado una tienda Semilla con 5 productos, entonces la publicidad sale como hoy.
- **E8** Dado el registro con rubro `comida`, entonces veo 3 paletas sugeridas y la vista previa cambia al elegir una.
- **E9** Dado cada diseño en el selector, entonces la portada de marca se ve bien a 375 y 1280 px (captura por diseño).

## Decisiones de Jack (4 nov)
1. ✅ Portada en Semilla: opción B (portada de marca).
2. ✅ Publicidad con menos de 4 productos: solo en el pie.
3. ✅ Eslóganes por rubro: los de `diseno.md`, ajustables después.
