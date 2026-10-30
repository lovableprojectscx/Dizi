# Spec: Catálogo Público

## Propósito
Exponer el catálogo de cada comercio en una URL pública propia, sin autenticación, renderizando productos, categorías y la identidad visual configurada con soporte para navegación directa por categoría, modo resultados, imágenes en alta definición HD, visualización de porcentaje de descuento en ofertas y escalas de precios por volumen. Cubre RF-01, RF-03, RF-35, RF-36, RF-37, RF-38, RF-40 y RF-42.

## Requisitos

### Requisito: Publicación por slug (RF-01)
El sistema DEBE servir el catálogo en `/t/:slug` para tiendas publicadas (`is_published = true`), mostrando productos activos, categorías, logo y paleta de colores.

#### Escenario: Acceso exitoso
- **Dado** que la tienda "pasteleria-diana" existe y está publicada
- **Cuando** un visitante accede a `/t/pasteleria-diana`
- **Entonces** se muestran los productos activos, categorías, logo y colores configurados.

#### Escenario: Catálogo despublicado
- **Dado** que la tienda tiene `is_published = false`
- **Cuando** un visitante accede a su URL pública
- **Entonces** se muestra 404 o el mensaje "catálogo temporalmente desactivo".

### Requisito: Formateo de precios en soles (RF-03)
Todo precio DEBE mostrarse con prefijo `S/` y dos decimales; sin precio definido DEBE mostrarse "A consultar".

#### Escenario: Precio con decimales
- **Dado** un producto con precio `15.5`
- **Cuando** se renderiza su tarjeta
- **Entonces** el precio se muestra como "S/ 15.50".

#### Escenario: Producto sin precio
- **Dado** un producto con precio `null`, `undefined` o `0`
- **Cuando** se despliega en el catálogo
- **Entonces** la tarjeta muestra "A consultar".

### Requisito: Navegación y Enlace Directo por Categoría (RF-35, RF-36)
El sistema DEBE soportar enlaces amigables por categoría en la ruta `/t/:slug/<categoria>`, normalizando el nombre a slug sin diacríticos ni emojis mediante `category-link.ts`. Asimismo, DEBE mantener compatibilidad retroactiva con el parámetro query `?c=<categoria>`, resolviendo la categoría activa sin recargas y actualizando la meta-etiqueta OpenGraph (`api/seo.ts`).

#### Escenario: Acceso directo por ruta limpia de categoría
- **Dado** que la tienda `jhoselynperu` tiene la categoría "Polos Algodón"
- **Cuando** un comprador entra directamente a la URL `/t/jhoselynperu/polos-algodon`
- **Entonces** el catálogo activa y filtra automáticamente dicha categoría sin pantalla en blanco.

#### Escenario: Compatibilidad con query param legacy
- **Dado** un enlace compartido con formato `/t/catalogo?c=flores-follajes`
- **Cuando** el usuario ingresa al catálogo
- **Entonces** el sistema resuelve la categoría correspondiente y filtra sus productos.

### Requisito: Modo Resultados al Filtrar (RF-37)
Al realizar una búsqueda (`searchQuery`), seleccionar una categoría (`activeCat !== "all"`) o aplicar un filtro de precios (`priceRange`), el catálogo público en sus 15 diseños DEBE ocultar el carrusel de banners y la sección de productos destacados, mostrando en su lugar una barra de resultados con el conteo de coincidencias y la opción de limpiar filtros. En caso de no existir resultados, DEBE desplegar un estado vacío con botón "Ver todo" y botón de contacto por WhatsApp.

#### Escenario: Activación del modo resultados
- **Dado** un catálogo con carrusel de banners y productos destacados visibles
- **Cuando** el visitante busca un producto o hace clic en una categoría
- **Entonces** la portada y los destacados se ocultan para destacar de forma inmediata los productos resultantes.

### Requisito: Imágenes en Alta Calidad y Miniaturas Duales (RF-38)
El procesamiento de imágenes en cliente Canvas (`src/lib/image-utils.ts`) DEBE aplicar los siguientes presets (`IMAGE_PRESETS`):
- **Producto HD:** Dimensión máxima 1600 px, calidad WebP 0.80.
- **Miniatura de cuadrícula:** Dimensión máxima 600 px, calidad WebP 0.78 (`_thumb.webp`).
- **Banner de portada:** Dimensión máxima 1920 px, calidad WebP 0.80.
- **Logo:** Dimensión máxima 512 px, calidad WebP 0.90.
Si la imagen original es menor a la dimensión máxima, no debe agrandarse. Las cuadrículas del catálogo solicitan la miniatura de 600 px (`getThumbnailUrl`), reservando la descarga de 1600 px para el modal de detalle y zoom.

#### Escenario: Descarga optimizada en grilla vs modal
- **Dado** un producto con imagen HD y miniatura complementaria
- **Cuando** el visitante navega por el catálogo
- **Entonces** las tarjetas descargan la miniatura ligera de 600 px (`_thumb.webp`), y solo al abrir el modal de detalle se carga la versión HD de 1600 px.

### Requisito: Módulo de Porcentaje de Descuento en Ofertas (RF-40)
Cuando la tienda active `stores.show_discount_pct = true` en Diseño → Módulos, los productos con `is_on_sale = true` y precio original mayor al precio regular con descuento ≥ 5% DEBEN sustituir la insignia "Oferta" por la insignia dinámica `"-X%"` calculada con `Math.floor(((originalPrice - price) / originalPrice) * 100)`. El modal de detalle DEBE exhibir `"Ahorras S/ X.XX"`. Si el descuento es menor al 5% o el módulo está apagado, se muestra la insignia tradicional "Oferta".

#### Escenario: Insignia de porcentaje y ahorro en detalle
- **Dado** un producto con precio original S/ 50 y precio oferta S/ 35 en una tienda con módulo activo
- **Cuando** se visualiza en el catálogo público
- **Entonces** la tarjeta muestra la insignia "-30%" y el modal de detalle resalta "Ahorras S/ 15.00".

### Requisito: Módulo de Precios por Mayor y Escalas por Volumen (RF-42)
El catálogo público DEBE soportar escalas de precios por volumen (hasta 3 niveles) cuando la tienda active el módulo (`stores.wholesale_enabled = true`) y el plan comercial lo permita (Emprendedor, Pro, Ilimitado).

#### Escenario 1: Apagado = hoy (comportamiento estándar sin alteración)
- **Dado** que la tienda tiene el interruptor de precios por mayor apagado (`wholesale_enabled = false`)
- **Cuando** un comprador consulta productos o añade 3 o más unidades al carrito
- **Entonces** la tarjeta, el modal de detalle, el carrito y el mensaje de WhatsApp son idénticos al catálogo estándar sin mostrar avisos de precio por mayor.

#### Escenario 2: Suma de variaciones (tallas y colores suman juntos)
- **Dado** un producto con precio base S/ 35 y escala mayorista "desde 3 unidades a S/ 28 c/u"
- **Cuando** el cliente añade al carrito 2 unidades en talla M y 1 unidad en talla L (total 3 unidades del mismo producto)
- **Entonces** cada unidad se factura a S/ 28, el subtotal de la línea es S/ 84 y el pie del carrito desglosa un ahorro de S/ 21.

#### Escenario 3: Sugerencia de progreso ("Falta poco")
- **Dado** el mismo producto con escala desde 3 unidades a S/ 28 c/u
- **Cuando** el cliente añade 2 unidades al carrito
- **Entonces** el carrito muestra el aviso "Agrega 1 más y pagas S/ 28 c/u" y calcula el total al precio base regular (S/ 35).

#### Escenario 4: Aplicación del mejor nivel alcanzado
- **Dado** un producto con niveles "desde 3 u. a S/ 28" y "desde 12 u. a S/ 24"
- **Cuando** el carrito alcanza 12 o más unidades acumuladas
- **Entonces** se aplica la tarifa mayorista más beneficiosa (S/ 24 c/u) y se recalcula el ahorro correspondiente.

#### Escenario 5: Oferta contra mayor (gana el menor precio)
- **Dado** un producto con oferta especial vigente de S/ 26 y un nivel mayorista de "desde 3 u. a S/ 28"
- **Cuando** el comprador añade 3 unidades al carrito
- **Entonces** se cobra el precio menor (S/ 26 de la oferta) y no se muestra la etiqueta de precio por mayor aplicado ni se duplican descuentos.

#### Escenario 6: Degradación en Plan Semilla o vencido
- **Dado** una tienda con plan efectivo Semilla o cuya suscripción vencida superó los 3 días de gracia
- **Cuando** los clientes navegan por el catálogo público
- **Entonces** el catálogo ignora completamente las escalas mayoristas guardadas y opera exclusivamente con precios regulares.

#### Escenario 7: Validación de niveles en servidor y panel
- **Dado** un intento de configurar un nivel mayorista con precio unitario mayor o igual al precio regular del producto
- **Cuando** se intenta guardar en el formulario o en la base de datos
- **Entonces** la operación es rechazada con mensaje de error explicativo y el trigger `trg_validate_wholesale_tiers` bloquea el guardado.

#### Escenario 8: Restricción en productos con precios de variación dispares
- **Dado** un producto cuyas variaciones poseen precios distintos entre sí
- **Cuando** la dueña abre la sección de precios por mayor en el panel de productos
- **Entonces** la sección se muestra deshabilitada, explicando que no es posible aplicar precios por mayor en productos con variaciones a distinto precio.

### Requisito: Preservación de Modelo Visual y Carrusel Multi-Banner Responsivo
El servidor DEBE entregar en `get_public_store` el modelo visual elegido por el dueño (`model`) y la lista completa de banners cargados concatenados por `|||` desde la columna `banners` o `banner_image`. El catálogo público DEBE renderizarlos con una relación de aspecto responsiva (`aspect-[16/7]` en móvil y `aspect-[21/7]` en PC) eliminando barras borrosas laterales (`blur-lg`), ofreciendo rotación automática cada 5 segundos y botones/puntos de navegación interactivos.

### Requisito: Caché Nativo de Catálogo y Zero-Egress en SessionStorage
Las rutas públicas `/t/:slug` y `/bio/:slug` DEBEN implementar almacenamiento en `sessionStorage` (`dizi_store_cache_<slug>`, TTL 5 min) y `staleTime: 5min` en el enrutador para eliminar llamadas redundantes en sesión, garantizando 0 bytes de egress en navegación interna o recargas. El Service Worker DEBE interceptar peticiones GET de imágenes y cachearlas con *Stale-While-Revalidate*.

### Requisito: Paginación Inicial Lazy Loading (36 items) y Carga Bajo Demanda por Categoría
El RPC `get_public_store` DEBE limitar la entrega inicial a los primeros 36 productos de la tienda. Al seleccionar cualquier categoría específica, el sistema DEBE evaluar si existen productos en memoria; de no ser así, DEBE consultar `get_public_store_products` enviando `p_category_id` y desplegar de inmediato los productos sin pantallas vacías.

### Requisito: Conteo Real de Productos en Categorías de Base de Datos
El RPC `get_public_store` DEBE calcular y entregar en el array `categories` el campo `product_count` real por cada categoría activa desde PostgreSQL, asegurando que la barra lateral y los botones de navegación muestren el número exacto de productos disponibles sin requerir la descarga de todo el catálogo.

### Requisito: Búsqueda Global en Servidor con Debounce
Al ingresar un término de búsqueda de 2 o más caracteres, el catálogo DEBE ejecutar una consulta debounce (300 ms) hacia `get_public_store_products` con `p_search_query` utilizando ILIKE en PostgreSQL.

## Trazabilidad
Casos de prueba: CP-01 a CP-04, CP-14, SW-01 a SW-04, E2E-LL-01 a E2E-LL-08 · Vitest: `category-lazy-loading.test.ts`, `lazy-load-egress.test.ts`, `category-link.test.ts`, `discount.test.ts`, `wholesale.test.ts`, `image-utils.test.ts` · Código: `src/routes/t.$slug.tsx`, `src/routes/t.$slug.{-$categoria}.tsx`, `src/routes/bio.$slug.tsx`, `src/lib/category-link.ts`, `src/lib/image-utils.ts`, `src/lib/discount.ts`, `src/lib/wholesale.ts`, `src/components/public/PublicCatalog.tsx`, `src/components/public/WholesaleHint.tsx`, `src/components/public/WholesaleTable.tsx`, `src/components/public/WholesaleProgress.tsx`, RPC `get_public_store`, `get_public_store_products`.
