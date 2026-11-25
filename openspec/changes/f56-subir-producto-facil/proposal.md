# F56 · Subir un producto fácil

**Estado:** 📝 Propuesta (24 nov 2026). Pedido de Jack (20 nov, con captura del formulario): "el registro está hermoso, botones grandes y simple, pero al ya registrarte se vuelve difícil".
**Planes:** todos. **Celular primero.**

## Por qué (datos verificados por Claude, 24 nov)
- **El precio arranca bloqueado.** En `SingleProductDialog` (`admin.productos.tsx:534`) el producto nuevo empieza con `priceInput = ""`, y "A consultar" se marca solo cuando el precio está vacío (`:1024`). Resultado: el casillero sale **marcado** y el campo de precio **deshabilitado** (`:1044`). Para poner un precio hay que desmarcar primero.
- En 60 días: **265 de 553 productos (48 %) sin precio**, en 12 de 36 tiendas. Ojo: **jhoselynperu pone 115 de 115 sin precio** (parece a propósito) y Adornia y Milance la mitad. Sin jhoselynperu, 150 de 438 (34 %). O sea: el problema es real, pero **"A consultar" también es una forma de vender que hay que respetar**.
- El formulario muestra todo junto: foto, nombre, destacar, precio, oferta, categoría, descripción, variaciones, por mayor. El registro (F53) es una pregunta por pantalla.
- Las 6 tiendas nuevas desde el 20 nov: solo 2 llegaron a 3 productos con foto (premio F55).

## Alcance v1
- **Producto nuevo:** el precio sale **habilitado y vacío**, con el cursor listo; "A consultar" **sin marcar**. Marcarlo sigue siendo un toque.
- **Producto existente sin precio:** se abre igual que hoy ("A consultar" marcado). No se cambia nada guardado.
- **Lo esencial primero:** foto → nombre → precio → categoría. Todo lo demás (descripción, precio antes/oferta, destacar, variaciones y tallas, precio por mayor) va en un bloque **"Más opciones"** cerrado al crear y **abierto al editar** si el producto ya usa alguna de esas cosas.
- **Ejemplo del rubro** en el nombre (`rubros.ts`, `ejemploProducto`): una florería ve "Ej. Ramo de 12 rosas rojas", no "Ej. iPhone 15 Pro Max".
- **Guardar sin precio avisa una vez:** si el precio está vacío y "A consultar" no está marcado → "¿Lo dejas como 'A consultar'?" con [Poner precio] [Sí, a consultar].
- **Carga masiva por fotos** (`:3054`): antes de guardar, si hay productos sin precio, un aviso: "N productos se verán como 'A consultar'" con [Revisar] [Guardar igual].
- **Medición:** `% de productos nuevos con precio` y `productos creados en las primeras 24 h` (por tienda nueva), en solo lectura desde la base.

**Fuera de v1:** formulario por pasos (wizard), fotos con IA (F48), cambiar productos guardados, catálogo público.

## Experiencia (UX/UI) — lo más importante de F56
**Prioridad de Jack (24 nov): que no sea difícil para la gente.** Referencia visual: las pantallas del registro F53 (botones grandes, una idea a la vez, mucho aire). Se trabaja con capturas del registro y esta especificación escrita, **sin mockups HTML**.

**Lo que se ve hoy (captura de Jack, tienda Camin, 24 nov) y por qué confunde:**
1. "A consultar" viene marcado y el precio dice "S/ A consultar" en gris: parece que no se puede poner precio.
2. El ejemplo del nombre es "Ej. iPhone 15 Pro Max 256GB" aunque la tienda no venda celulares.
3. "¿Este producto está en oferta?" aparece **antes** del precio: se pregunta por la oferta antes de saber el precio.
4. Títulos en MAYÚSCULAS chicas y grises ("IMAGEN DEL PRODUCTO", "NOMBRE DEL PRODUCTO"): cuestan leer en celular.
5. Ruido técnico: "Formatos JPG, PNG, WebP con compresión automática" (dos veces), "Ver proporción", "Pegar enlace de imagen (avanzado)", "Cuadrada 1:1".
6. "Guardar producto" está apagado sin decir qué falta.
7. Subtítulo "Configura los detalles del artículo para publicarlo en tu catálogo digital" no ayuda.

**Cómo debe quedar (orden en celular, de arriba a abajo):**
1. Título: **"Agregar producto"** (editar: "Editar producto"). Sin subtítulo.
2. **Foto**: recuadro grande con ícono de cámara y texto "Toca para subir una foto". Debajo, en chico: "Se ve mejor cuadrada". Nada más. ("Pegar enlace" y "Ver proporción" pasan a "Más opciones").
3. **¿Cómo se llama?** — campo grande, ejemplo del rubro (RF-56.4).
4. **¿Cuánto cuesta?** — campo grande con "S/" fijo y teclado numérico. Debajo, un enlace de texto: "No quiero mostrar el precio" (= A consultar). Si se toca, el campo se reemplaza por una etiqueta "Precio a consultar · Cambiar".
5. **Categoría** — selector con "+ Nueva" al lado.
6. **"Más opciones"** (cerrado al crear) — dentro, en este orden: Descripción · Oferta (precio antes) · Destacar · Tallas, colores y variaciones · Precio por mayor (si el plan lo permite) · Pegar enlace de imagen.
7. Botón fijo abajo, ancho completo: **"Guardar producto"**. Si falta algo, el botón **sí se puede tocar** y marca en rojo el campo que falta con un texto corto ("Falta el nombre"), en vez de quedar apagado sin explicación.

**En PC:** dos columnas como hoy (foto a la izquierda; nombre, precio, categoría y "Más opciones" a la derecha), con el mismo orden y textos.

**Reglas visuales:**
- Títulos de campo en frase normal ("¿Cuánto cuesta?"), 15–16 px, color de texto principal, no gris en mayúsculas.
- Campos de al menos 48 px de alto y letra de 16 px (evita que el celular haga zoom al escribir).
- Botones y zonas táctiles de al menos 44 px.
- Coral solo en el botón principal; índigo para textos y enlaces; Sora en títulos, Inter en el resto (manual de marca).
- Un solo mensaje de ayuda por campo, como máximo una línea.
- Después de guardar: aviso corto "Producto agregado ✓" y un botón **"Agregar otro"** que reabre el formulario vacío con la misma categoría (para quien sube varios seguidos).

| ID | Requisito de experiencia |
|---|---|
| RF-56.8 | Orden, textos y tamaños de esta sección, en celular y PC. |
| RF-56.9 | Guardar nunca queda apagado sin explicación: marca el campo que falta. |
| RF-56.10 | "Agregar otro" después de guardar, con la categoría anterior ya elegida. |

**Escenarios de experiencia (además de 1–13):**
14. Pixel 7 con el teclado abierto en "¿Cuánto cuesta?": el teclado es numérico y el campo queda visible.
15. Tocar Guardar sin nombre → el campo nombre en rojo con "Falta el nombre" y foco en él.
16. Guardar → "Producto agregado ✓" → "Agregar otro" abre vacío con la misma categoría.
17. Todos los campos miden ≥ 48 px, letra ≥ 16 px; botones ≥ 44 px (medido en la prueba).
18. Prueba de 3 personas (la hace Jack, sin explicarles nada): agregar un producto con foto y precio desde el celular en menos de 1 minuto. Se anota cuánto tardó y dónde dudó.

## Requisitos
| ID | Requisito |
|---|---|
| RF-56.1 | Producto nuevo: precio habilitado y vacío; "A consultar" sin marcar; el foco pasa al precio después del nombre. |
| RF-56.2 | Producto existente: el estado de "A consultar" sale de lo guardado (`price` null → marcado). |
| RF-56.3 | Bloque "Más opciones" cerrado al crear; al editar se abre solo si el producto tiene descripción, oferta, destacado, variaciones o precio por mayor. Muestra un contador ("3 opciones usadas"). |
| RF-56.4 | Placeholder del nombre según `store.niche` con la función existente de `rubros.ts`. |
| RF-56.5 | Guardar con precio vacío y "A consultar" sin marcar → confirmación en la misma ventana (no `confirm()` del navegador). |
| RF-56.6 | Carga masiva: aviso con el número de productos sin precio antes de guardar. |
| RF-56.7 | Mismo comportamiento en el producto de bienvenida (`welcomeMode`) y en Completar productos (`CompleteProductsDialog`, `:1273`) si aplica. |

| ID | No funcional |
|---|---|
| RNF-56.1 | **Nada más cambia:** ningún producto guardado cambia; el catálogo público es idéntico (md5 de `get_public_store` antes/después en 3 tiendas). |
| RNF-56.2 | No se pierde ninguna función: todo lo que hoy se puede editar sigue al alcance (dentro de "Más opciones"). |
| RNF-56.3 | Celular primero (Pixel 7): lo esencial entra sin scroll con el teclado cerrado. |
| RNF-56.4 | Sin migraciones de base. |

## Escenarios (cada uno es una prueba con su número)
1. Nuevo producto → precio habilitado, vacío, "A consultar" sin marcar.
2. Escribir precio 25 y guardar → `price = 25`.
3. Marcar "A consultar" y guardar → `price = null`, sin preguntar.
4. Precio vacío, "A consultar" sin marcar, Guardar → aparece la confirmación; "Sí, a consultar" guarda `null`; "Poner precio" vuelve al campo.
5. Editar producto existente sin precio → "A consultar" marcado, campo deshabilitado (como hoy).
6. Editar producto con oferta y variaciones → "Más opciones" abierto y contador "2 opciones usadas".
7. Nuevo producto → "Más opciones" cerrado; al abrirlo están descripción, oferta, destacar, variaciones y por mayor (por mayor solo si el plan lo permite, como hoy).
8. Tienda florería → placeholder "Ej. Ramo de 12 rosas rojas"; tienda sin rubro → ejemplo general.
9. Carga masiva con 3 fotos, 2 sin precio → aviso "2 productos se verán como 'A consultar'"; Revisar no guarda.
10. Producto de bienvenida (`welcomeMode`) → mismas reglas 1–4.
11. Pixel 7: foto, nombre, precio, categoría y Guardar visibles sin scroll con el teclado cerrado (captura).
12. Catálogo público de 3 tiendas existentes idéntico antes/después (md5, solo lectura).
13. Lo que ya existía sigue: subir foto, variaciones con tallas, precio por mayor y destacar guardan igual que hoy (pruebas existentes en verde).

## Decisiones abiertas para Jack
- **Una pantalla con "Más opciones" (recomendado) o un formulario por pasos.** Con el orden de arriba, la pantalla ya se lee como pasos: foto → nombre → precio → categoría. Recomiendo una pantalla: quien sube muchos productos (jhoselynperu, Adornia) pierde tiempo con pasos; el que recién empieza ve solo 4 cosas.
- **¿Avisar a jhoselynperu/Adornia?** No cambia nada de lo suyo, pero al crear productos nuevos ahora tendrán que marcar "A consultar" a mano.
