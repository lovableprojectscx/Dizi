# Spec: Catálogo Público

## Propósito
Exponer el catálogo de cada comercio en una URL pública propia, sin autenticación, renderizando productos, categorías y la identidad visual configurada. Cubre RF-01 y RF-03.

## Requisitos

### Requisito: Publicación por slug (RF-01)
El sistema DEBE servir el catálogo en `/t/:slug` para tiendas publicadas (`is_published = true`), mostrando productos activos, categorías, logo y paleta de colores.

#### Escenario: Acceso exitoso
- **Dado** que la tienda "pasteleria-diana" existe y está publicada
- **Cuando** un visitante accede a `/t/pasteleria-diana`
- **Entonces** se muestran los productos activos, categorías, logo y colores configurados

#### Escenario: Catálogo despublicado
- **Dado** que la tienda tiene `is_published = false`
- **Cuando** un visitante accede a su URL pública
- **Entonces** se muestra 404 o el mensaje "catálogo temporalmente desactivo"

### Requisito: Formateo de precios en soles (RF-03)
Todo precio DEBE mostrarse con prefijo `S/` y dos decimales; sin precio definido DEBE mostrarse "A consultar".

#### Escenario: Precio con decimales
- **Dado** un producto con precio `15.5`
- **Cuando** se renderiza su tarjeta
- **Entonces** el precio se muestra como "S/ 15.50"

#### Escenario: Producto sin precio
- **Dado** un producto con precio `null`, `undefined` o `0`
- **Cuando** se despliega en el catálogo
- **Entonces** la tarjeta muestra "A consultar"

### Requisito: Preservación de Modelo Visual y Carrusel Multi-Banner Responsivo
El servidor DEBE entregar en `get_public_store` el modelo visual elegido por el dueño (`model`) y la lista completa de banners cargados concatenados por `|||` desde la columna `banners` o `banner_image`. El catálogo público DEBE renderizarlos con una relación de aspecto responsiva (`aspect-[16/7]` en móvil y `aspect-[21/7]` en PC) eliminando barras borrosas laterales (`blur-lg`), ofreciendo rotación automática cada 5 segundos y botones/puntos de navegación interactivos.

#### Escenario: Renderizado completo en PC y Móvil
- **Dado** que la tienda tiene configurado un modelo visual (ej. `bloom`, `bite`, `hero`, `spotlight`) con 2 o más banners cargados
- **Cuando** un visitante accede a la URL pública `/t/:slug`
- **Entonces** se renderiza la plantilla seleccionada, el carrusel de banners rota dinámicamente cada 5s, las imágenes cubren de borde a borde el 100% del contenedor sin franjas laterales borrosas y en PC se mantiene la barra lateral de categorías.

### Requisito: Caché Nativo de Catálogo e Inmunidad Egress vía GET y Service Worker
El cliente DEBE solicitar el RPC `get_public_store` utilizando el método HTTP `GET` (`{ get: true }`). El Service Worker DEBE interceptar esta solicitud y cachearla localmente con estrategia *Stale-While-Revalidate*, garantizando 0 bytes de egress a la base de datos en visitas recurrentes y carga instantánea. Las rutas públicas `/t/:slug` y `/bio/:slug` DEBEN implementar adicionalmente `staleTime: 5min` en el enrutador para eliminar llamadas redundantes en sesión.

### Requisito: Miniaturas Automáticas de Cuadrícula (Dual-Resolution WebP 400px vs 800px)
El sistema DEBE generar y subir automáticamente una miniatura optimizada de 400px (`_thumb.webp`, ~12KB–15KB) al momento de guardar o actualizar productos con imágenes en base64, preservando la imagen HD completa de 800px (`.webp`, ~35KB). Las vistas de cuadrícula del catálogo público DEBEN solicitar la miniatura `_thumb.webp` mediante `getThumbnailUrl()`, reservando la descarga de la imagen principal HD de 800px para cuando el visitante abra el modal de detalle del producto o el visor de zoom. En caso de ausencia de miniatura en productos heredados, el catálogo DEBE recuperar transparentemente la imagen principal mediante fallback en el evento `onError`.

## Trazabilidad
Casos de prueba: CP-01 a CP-04, CP-14, SW-01 a SW-04 · E2E-01 · Código: `src/routes/t.$slug.tsx`, `src/routes/bio.$slug.tsx`, `public/sw.js`, `src/lib/image-utils.ts`, `src/lib/store.ts`, `src/components/public/PublicCatalog.tsx`, RPC `get_public_store`, migración `20260804174500_fix_get_public_store_multi_banners.sql`


