# F46 · Imágenes para estados e historias: propuesta y requisitos

**Estado:** aprobado por Jack (4 nov 2026). En Semilla llevan "Hecho con Dizi"; estilos para todos los planes; medición con `share_events`. **Va después de F41b**; puede ir en paralelo con F45. **Planes:** todos.
**Por qué:** es la función que más diferencia a Catalogito y la que más ayuda a la retención: la dueña tiene algo nuevo que compartir cada día, y cada imagen lleva a su catálogo. En Semilla, además, cada imagen promociona a Dizi.

## Alcance v1
- Desde un producto, crear una **imagen lista para estados de WhatsApp e historias**: foto, nombre, precio (y la oferta real si la hay), logo, nombre de la tienda y el enlace o QR del producto.
- **2 tamaños:** historia (1080×1920) y cuadrada (1080×1080).
- **6 estilos bien hechos** que usan los colores de la tienda. Mejor pocos y muy buenos que 96 genéricos.
- **Compartir** directo (WhatsApp, Instagram) desde el celular o **descargar**.
- **Todo se genera en el celular**, como Catalogito: sin costo de servidor.

**Fuera de la v1:** collage de varios productos, lista de precios en imagen, PDF nuevo, subir tu propio fondo hecho en Canva, programar publicaciones. Quedan para una v2 si la v1 se usa.

## Requisitos funcionales
| Id | Requisito |
|---|---|
| RF-46.1 | En Productos, cada producto tiene el botón **"Crear imagen"**, que abre un editor con la vista previa. |
| RF-46.2 | El editor permite elegir tamaño (Historia o Cuadrada) y uno de **6 estilos**. La vista previa se actualiza al instante. |
| RF-46.3 | La imagen incluye: la foto del producto (sin deformarla), el nombre, el precio, el logo y el nombre de la tienda. Si el producto está en oferta, muestra el precio anterior tachado y la etiqueta "-X%" calculada con `discount.ts` (F40), **solo con precios reales**. |
| RF-46.4 | La imagen incluye un **QR** y un enlace corto al producto (`/t/<slug>?p=<id>`), para que la clienta lo abra y pida. |
| RF-46.5 | En **Semilla**, la imagen lleva "Hecho con Dizi" pequeño y legible, que no tapa el producto. En los planes de pago, sin marca Dizi. |
| RF-46.6 | **Compartir:** en el celular, botón "Compartir" que abre WhatsApp, Instagram u otra app con la imagen. Si el navegador no puede compartir archivos, el botón dice "Descargar" y guarda la imagen. |
| RF-46.7 | Los 6 estilos usan el color de marca y la tipografía de la tienda; cada uno se ve bien con fotos verticales, cuadradas y horizontales (sin cortar el producto). |
| RF-46.8 | Se cuenta cuántas imágenes crea cada tienda por semana, para medir la retención (ver `diseno.md`). |

## Requisitos no funcionales
- **RNF-46.1 Nada más cambia:** el catálogo público no cambia en nada.
- **RNF-46.2 Calidad:** la imagen final sale nítida a 1080 px de ancho, usando la foto original de 1600 px (F38) y no la miniatura.
- **RNF-46.3 Rendimiento:** la vista previa aparece en menos de 2 segundos en un Android de gama media; el código del editor se carga solo cuando se abre (no pesa en el resto del panel).
- **RNF-46.4 Honestidad:** nada de urgencia falsa ("últimas unidades", contadores); solo datos reales del producto.
- **RNF-46.5 Celular primero.**

## Escenarios
- **E1** Dado un producto con foto, cuando toco "Crear imagen" y elijo Historia, entonces veo la vista previa en 1080×1920 con foto, nombre, precio, logo y QR.
- **E2** Dado un producto en oferta (S/ 129.90 → S/ 89.90), entonces la imagen muestra S/ 129.90 tachado, S/ 89.90 y "-30%".
- **E3** Dado un producto sin oferta, entonces no aparece ningún precio tachado ni etiqueta.
- **E4** Dado una tienda Semilla, entonces la imagen lleva "Hecho con Dizi"; dado una tienda Pro, no lo lleva.
- **E5** Dado el QR de la imagen, cuando lo escaneo, entonces abre el catálogo con ese producto abierto.
- **E6** Dado Android Chrome, cuando toco "Compartir", entonces se abre el menú para compartir con la imagen; dado un navegador sin esa función, el botón descarga la imagen.
- **E7** Dado una foto horizontal, una cuadrada y una vertical, entonces en los 6 estilos el producto se ve completo, sin cortarse.
- **E8** Dado que creo 3 imágenes, entonces el contador semanal de la tienda suma 3.

## Requisito previo (Jack, en Bunny)
Las fotos de Bunny (`dizifotos.b-cdn.net`) hoy no envían el encabezado CORS. Sin él, el navegador no deja exportar una imagen que use esas fotos. **Jack activa "Add CORS headers"** en la zona `dizifotos` de Bunny (para `webp`, `jpg`, `png`). Claude lo verifica antes de implementar.

## Decisiones de Jack (4 nov)
1. ✅ Medición con una tabla `share_events` (requiere migración con su OK).
2. ✅ Los 6 estilos para todos los planes; Semilla solo se diferencia por la marca Dizi.
