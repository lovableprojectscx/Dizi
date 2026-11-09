# F46 · Imágenes para estados: diseño técnico (hipótesis hasta el Paso 0; base master `4a0296d`, ya con F41b, F42.1, F42.2 y F42.3)

## Cómo se genera
- **En el navegador, con `<canvas>`**, dibujando cada estilo a mano (posiciones, textos y foto), como Catalogito (`designs.js`). No se usa `html2canvas` para la imagen final: con canvas directo el resultado es exacto y nítido a 1080 px.
- **Foto:** se carga la original de 1600 px desde Bunny con `crossOrigin="anonymous"`. Requiere CORS en Bunny (ver propuesta). Si la foto falla, se muestra un aviso y no se genera una imagen rota.
- **QR:** librería `qrcode` (ya está en `package.json`), apuntando a `https://dizi.idenza.site/t/<slug>?p=<id>`. El catálogo ya abre el producto con `?p=` (`PublicCatalog.tsx:2936`).
- **Exportar:** `canvas.toBlob('image/png')`. **Compartir:** `navigator.share({ files: [file] })` cuando `navigator.canShare({ files })` es true; si no, descarga.
- **Tipografía:** las fuentes de la tienda (ya cargadas en el panel); se espera `document.fonts.ready` antes de dibujar.

## Piezas
| Pieza | Archivo | Responsabilidad |
|---|---|---|
| Estilos | `src/lib/share-image/styles.ts` (nuevo) | Los 6 estilos: cada uno es una función `draw(ctx, data, size)`. Sin dependencias del DOM, para probarlos. |
| Datos | `src/lib/share-image/data.ts` (nuevo) | Arma lo que va en la imagen desde el producto y la tienda: precio y oferta con `discount.ts`, marca Dizi según el plan (`getEffectivePlan`), enlace. |
| Editor | `src/components/admin/ShareImageDialog.tsx` (nuevo, carga diferida) | Vista previa, tamaño, estilo, compartir y descargar. |
| Botón | `src/routes/admin.productos.tsx` | "Crear imagen" en cada producto. |
| Medición | tabla `share_events (id, store_id, product_id, style, size, created_at)` con RLS: insertar y leer solo el dueño | RF-46.8. Requiere migración; se puede dejar para el final si Jack prefiere. |

## Los 6 estilos (a validar con mockups en el Paso 0)
1. **Limpio:** foto grande arriba, banda inferior con nombre y precio.
2. **Marco:** foto con margen y marco del color de marca; datos abajo.
3. **Etiqueta:** foto a sangre y precio en una etiqueta grande, tipo vitrina.
4. **Editorial:** tipografía grande, foto vertical a un lado (ideal para moda).
5. **Oferta:** pensado para ofertas: "-X%" grande y precio anterior tachado (solo si la oferta es real; si no, este estilo no aparece).
6. **Minimal oscuro:** fondo oscuro, foto centrada (ideal para tecnología y perfumes).

## Riesgos
- **CORS en Bunny:** sin él no hay imágenes. Es lo primero.
- **iPhone:** Safari limita el tamaño del canvas y comparte archivos distinto; probar en iOS (o en el emulador) antes del merge.
- **Fotos de poca calidad** de las clientas: los estilos no deben ampliar la foto más de su tamaño real.
- No toca `PublicCatalog.tsx`: puede ir en paralelo con F45.
