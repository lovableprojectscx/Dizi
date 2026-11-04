# F41 · Formato de fotos por tienda + diseño Vitrina: propuesta y requisitos

**Estado:** aprobado por Jack (27 oct y 4 nov 2026) · Paso 0 hecho y verificado por Claude (4 nov) · **Planes:** todos
**Por qué:** las fotos se recortan según el diseño y el dueño no lo controla. Grilla dibuja en **4:3 horizontal** (`PublicCatalog.tsx:8114`), así que una prenda o un producto vertical sale cortado arriba y abajo. **9 de las 11 tiendas en Grilla son Semilla**: es la primera impresión de la mayoría de las tiendas gratis y una causa probable de abandono después de subir la primera foto. Además, el panel dice "Cuadrada 1:1" para todos los diseños (`getImageSpec`, `types.ts:752`), lo que no coincide con lo que se ve.

## Alcance v1
1. Formato de fotos por tienda, uno para todo el catálogo, solo en los diseños flexibles **Grilla** y **Bloom Estándar**.
2. Tiendas nuevas: el formato queda puesto según su rubro al registrarse.
3. Diseño nuevo **Vitrina** (tipo GAP), con foto vertical fija.
4. Lookbook fuera del selector.
5. Arreglar la recomendación de tamaño de foto del panel.

**Fuera de la v1:** elegir qué parte de la foto se ve (arriba, centro o abajo); formato por producto o por categoría; recortar la foto al subirla; avisar a las tiendas existentes para que cambien; íconos con más personalidad en el encabezado.

## Requisitos funcionales
| Id | Requisito |
|---|---|
| RF-41.1 | La tienda tiene un **formato de fotos**: Cuadrada (1:1), Vertical (3:4) o Completa (sin recorte, `object-contain` con el fondo de la tarjeta). Sin formato elegido (`NULL`) se ve **exactamente como hoy**: Grilla en 4:3 y Bloom Estándar en 1:1. |
| RF-41.2 | El formato solo cambia **Grilla** y **Bloom Estándar** (sus tarjetas, sus destacados y la tarjeta de publicidad de Dizi dentro de la grilla). Los demás diseños lo ignoran. |
| RF-41.3 | En **Diseño**, cuando el diseño activo es Grilla o Bloom Estándar, aparece el selector con 3 dibujos de ejemplo, **sin números**. El que corresponde al rubro de la tienda lleva "Sugerido para tu rubro". En otro diseño, el selector no aparece. |
| RF-41.4 | Al elegir **Completa** se muestra el aviso: "Para que se vea profesional, usa fotos del mismo tamaño". |
| RF-41.5 | Si la tienda nunca eligió formato, el selector muestra "Ahora: como siempre" sin ninguna opción marcada. Si ya eligió uno, aparece el enlace **"Volver al original"**, que deja el formato en `NULL`. |
| RF-41.6 | **Tiendas nuevas:** al registrarse se guarda el formato sugerido por su rubro: `ropa` → Vertical; `comida`, `bisuteria`, `tech`, `servicios` y `general` → Cuadrada. Se guarda aunque el diseño elegido no sea flexible, para que valga si después cambia a Grilla o Bloom. |
| RF-41.7 | **Vitrina** (id `vitrina`), en el selector y en el registro, con el rubro sugerido "Moda / Ropa": foto 3:4 fija que ocupa toda la tarjeta, sin bordes, sombras ni radio grande; debajo, solo el nombre (peso normal) y el precio, sin descripción; carrito como ícono pequeño sobre la foto (abajo a la derecha); oferta con precio tachado, precio en rojo y la etiqueta "-X%" de F40 si la tienda la tiene prendida; 2 columnas en celular y 4 en PC, con poco espacio entre las fotos; usa los colores y la tipografía del tema. El formato de fotos no la cambia. |
| RF-41.8 | **Lookbook** sale del selector y del registro (`enSelector: false`). Hoy 0 tiendas lo usan; si alguna lo tuviera, seguiría viéndose igual. |
| RF-41.9 | La recomendación de tamaño de foto del panel (`getImageSpec`) dice la verdad para cada diseño, incluidos `nature`, `bloom_general`, `bloom_floral`, `bite` y `vitrina`, y en Grilla y Bloom sigue el formato elegido. |

## Requisitos no funcionales
- **RNF-41.1 Nada más cambia:** con `photo_format = NULL`, el catálogo de todas las tiendas existentes se ve **idéntico**: capturas antes y después iguales de `/t/catalogo`, `/t/jhoselynperu`, `/t/onfeet`, `/bio/milance` y una tienda de cada diseño en uso. El PDF, el detalle del producto, el carrito y los pedidos no cambian.
- **RNF-41.2 Una sola fuente de verdad:** una sola función, `getPhotoAspect(store, layout)`, decide la proporción. Nada de valores escritos a mano en Grilla y Bloom.
- **RNF-41.3 Seguridad:** la columna tiene un `CHECK` (`square`, `portrait`, `contain` o `NULL`). `get_public_store` se recrea partiendo de la definición viva en producción (`pg_get_functiondef`), que ya trae F42, y con `SECURITY DEFINER` y `SET search_path = public, pg_temp` como hoy.
- **RNF-41.4 Celular primero:** el selector y Vitrina se diseñan y prueban primero a 375 px.
- **RNF-41.5 Rendimiento:** no se suben ni se generan fotos nuevas. Se usa la misma imagen y miniatura que hoy (F38).

## Escenarios (cada uno es una prueba con su número)
- **E1** Dado una tienda en Grilla sin formato, cuando abro su catálogo, entonces las fotos se ven en 4:3, igual que antes (captura idéntica de `/t/catalogo`).
- **E2** Dado una tienda en Bloom Estándar sin formato, cuando abro su catálogo, entonces las fotos se ven 1:1, igual que antes (captura idéntica de `/t/onfeet`).
- **E3** Dado una tienda en Grilla, cuando elijo Cuadrada, Vertical o Completa, entonces sus tarjetas y la tarjeta de publicidad se ven en 1:1, 3:4 o sin recorte, respectivamente.
- **E4** Dado una tienda en Bloom Estándar, cuando elijo cada formato, entonces sus tarjetas y sus destacados usan esa proporción.
- **E5** Dado una tienda en Arch (o cualquier diseño que no sea flexible) con `photo_format = 'portrait'`, cuando abro su catálogo, entonces se ve igual que con `NULL`.
- **E6** Dado un registro nuevo con rubro `ropa`, entonces la tienda queda con `photo_format = 'portrait'`. Con `comida`, `bisuteria`, `tech`, `servicios` o `general`, queda con `'square'`.
- **E7** Dado el panel de Diseño, cuando el diseño es Grilla o Bloom Estándar, entonces veo el selector con la sugerencia del rubro. Cuando es otro diseño, no lo veo. Al elegir Completa, veo el aviso.
- **E8** Dado una tienda que eligió Vertical, cuando toco "Volver al original", entonces `photo_format` queda en `NULL` y el catálogo vuelve a verse como en E1 o E2.
- **E9** Dado una tienda con Vitrina, cuando abro su catálogo a 375 y 1280 px, entonces veo 2 y 4 columnas, foto 3:4, sin descripción, el carrito sobre la foto y, en oferta, el precio tachado, el precio en rojo y "-X%" (si F40 está prendido).
- **E10** Dado el selector de diseños y el registro, entonces Lookbook no aparece y Vitrina sí.
- **E11** Dado cada diseño, cuando subo una foto de producto, entonces la recomendación de tamaño coincide con la proporción que dibuja el catálogo.

## Decisiones de Jack
- 27 oct: 3 formatos con dibujo y sin números; solo en Grilla y Bloom Estándar; Vitrina con 3:4 fijo; Lookbook fuera del selector.
- 4 nov: **las tiendas nuevas arrancan con el formato de su rubro**; las existentes siguen igual hasta que elijan un formato.

## Decisiones abiertas (para Jack)
1. **¿Vitrina para todos los planes?** Recomendación de Claude: sí, incluida Semilla, porque ataca justo el abandono de las tiendas de ropa.
2. **Las 9 tiendas Semilla en Grilla:** ¿se les sugiere cambiar de formato (mensaje o aviso en el panel)? Queda fuera de F41 y se decide con el diagnóstico de Semilla.
