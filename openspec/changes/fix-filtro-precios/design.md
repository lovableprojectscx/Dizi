# Fix Filtro de Precios — Diseño Técnico

## 1. Arquitectura de módulo puro (`src/lib/price-filter.ts`)
Para evitar duplicar reglas entre React (`PublicCatalog.tsx`), las rutas y los tests unitarios (Vitest), toda la lógica de cálculo de rango se centraliza en funciones puras sin efectos secundarios:

- `getProductFilterablePrices(product)`: devuelve los precios numéricos finitos `> 0` del producto considerando `product.price` (si es positivo) y cada `variation.price > 0` de `product.variations`. Productos `"A consultar"` retornan `[]`.
- `computePriceBounds(products, serverBounds?)`: si `serverBounds` trae `min >= 0` y `min < max` finitos (admitiendo ítems sub-unidad como `0.001`), los usa como universo real del catálogo completo aunque solo se hayan descargado 36 ítems iniciales; en caso contrario calcula `floor(min)` y `ceil(max)` sobre `products` en memoria.
- `normalizePriceRange(nextMin, nextMax, bounds)`: clampa `[nextMin, nextMax]` dentro de `[bounds.min, bounds.max]`, garantiza `min <= max`, y devuelve `null` si cubre todo `[bounds.min, bounds.max]` (volviendo automáticamente `isNarrowing = false`).
- `isPriceRangeActive(range, bounds)`: retorna `true` solo si `range !== null` y `(range[0] > bounds.min || range[1] < bounds.max)`.
- `matchesPriceRange(product, range, bounds)`: cuando el filtro está activo, excluye productos sin precios `> 0` ("A consultar") y retorna `true` si **al menos un precio filtrable** (base o variación) cae en `[range[0], range[1]]`.
- `formatPriceRangeLabel(range)`: genera `"S/ min – S/ max"` unificado para los chips de filtro activo en todos los diseños.
- `shouldFallbackToLegacyProductsRpc(error)`: detecta códigos PostgREST/PostgreSQL de sobrecarga ausente (`PGRST202`, `42883`, o mensajes equivalentes) para caer suavemente a la firma de 5 parámetros mientras no se haya aplicado la migración en producción.

## 2. Contrato de base de datos (`supabase/migrations/20261113120000_fix_price_filter_bounds_and_rpc.sql`)
Migración construida íntegramente sobre la definición real de producción (`pg_get_functiondef`):

1. **`public.get_public_store(store_slug text, page_limit integer DEFAULT 36, page_offset integer DEFAULT 0)`**
   - Conserva exactamente firma, lógica de planes (`effective_product_limit`), grace days y los 76 campos actuales JSONB.
   - Agrega `'price_bounds'` calculado con una subconsulta sobre los primeros `effective_limit` productos visibles no ejemplo (`LIMIT effective_limit`), tomando todos los precios positivos (`price > 0` o elementos `v->>'price'` en `variations` casteables a numérico `> 0`) y retornando `jsonb_build_object('min', FLOOR(MIN(val)), 'max', CEIL(MAX(val)))` o `NULL`.

2. **`public.get_public_store_products(p_store_slug text, p_page_offset integer DEFAULT 0, p_page_limit integer DEFAULT 24, p_category_id text DEFAULT NULL, p_search_query text DEFAULT NULL, p_min_price numeric DEFAULT NULL, p_max_price numeric DEFAULT NULL)`**
   - Mantiene los valores `DEFAULT NULL` para los nuevos parámetros `p_min_price` y `p_max_price` manteniendo compatibilidad total con llamadores de 3–5 argumentos.
   - Nota de firmas PostgreSQL: como `CREATE OR REPLACE` con diferente número de parámetros crea una sobrecarga en Postgres, primero hace `DROP FUNCTION IF EXISTS public.get_public_store_products(text, integer, integer, text, text);` dentro de la migración para dejar una única firma canónica de 7 parámetros con `DEFAULT`s, manteniendo `GRANT EXECUTE ON FUNCTION ... TO PUBLIC, anon, authenticated, service_role`.
   - En la cláusula `WHERE` de `v_results` (respetando `effective_limit`), cuando `p_min_price IS NOT NULL OR p_max_price IS NOT NULL`, exige que exista un precio positivo (el precio base `price > 0` o alguna variación `variations` con precio numérico `> 0`) que cumpla `>= COALESCE(p_min_price, 0)` y `<= COALESCE(p_max_price, 1e12)`. De ese modo los productos `"A consultar"` nunca aparecen mientras haya un límite activo.

3. **Zero-Egress y compatibilidad temporal pre-migración:**
   - En `t.$slug.{-$categoria}.tsx`, `pageLimit` se alinea de `24` a `36` conforme a `catalogo-publico/spec.md` y a `get_public_store`.
   - En `bio.$slug.tsx` se mantiene `page_limit: 6` por rendimiento y se mapea `priceBounds` opcional por paridad de tipos (`Store.priceBounds`).
   - En `PublicCatalog.tsx`, al activarse `priceRange` cuando aún faltan productos por cargar (`allProducts.length < totalProductsCount`), se dispara un efecto con debounce de 300 ms llamando a `get_public_store_products` con `p_min_price` / `p_max_price` y haciendo merge incremental en `allProducts` (con dedupe por `id`). Si PostgREST devuelve error `PGRST202` / `42883`, realiza fallback paginado con los 5 parámetros legacy respetando `totalProductsCount`.

## 3. UI/UX, Accesibilidad y Preservación de Diseños
- **`PriceRangeSlider` (`PublicCatalog.tsx`):**
  - Dos `<input type="range">` superpuestos sobre una pista común usando la técnica clásica `pointer-events-none` en el track + `pointer-events-auto` solo en los pulgares (`::-webkit-slider-thumb` y `::-moz-range-thumb`), con separación mínima manejable y ajuste dinámico de `z-index` cuando ambos extremos coinciden en el borde para evitar que un pulgar quede bloqueado detrás del otro.
  - Barra de rango activa coloreada con `--primary` (token de color de marca de cada tienda) y botones/controles usando `bg-card`, `bg-secondary`, `border-border`, `text-foreground` (eliminando `zinc-*` fijos para respetar temas oscuros y claros).
  - Controles `"Limpiar"` y botones de acciones con área táctil `>= 44 px` (`min-h-11` / `h-11`), `aria-label` descriptivos (`"Precio mínimo"`, `"Precio máximo"`) y valores numéricos accesibles (`min`, `max`, `value`).
- **Visibilidad por diseño:**
  - Desktop (`<aside>`): se reintegra `<PriceRangeSlider />` debajo del listado de categorías dentro de una tarjeta limpia solo cuando `hasPriceFilter === true`.
  - Móvil (`375 px`): se conserva el botón `"Filtros"` existente en encabezados/barras y se agrega únicamente cuando `hasPriceFilter === true` en `bite` (`grano-miga`) junto al buscador y en `lookbook`.
  - `isMockup`: se unifican las condiciones en el header estándar y `bloom` para que cuando `isMockup = true` también previsualice el botón `"Filtros"` si la tienda tiene precios filtrables.
  - Tiendas con `price_filter_enabled = false`: `hasPriceFilter` evalúa a `false` inmediatamente → **0 nodos adicionales y 0 px de desplazamiento**.
- **Limpieza de deuda en `PublicCatalog.tsx`:**
  - Retirar estado muerto `sortBy` y su rama muerta.
  - Retirar los 3 bloques inalcanzables `if (priceRange) return ...` dentro de `{!isNarrowing && (...)}` (`L5673`, `L6464`, `L7226`).
  - Corregir `renderResultsBar()` para que al existir `activePriceFilter` activo junto con categoría devuelva el conteo real de `rawFiltered.length` en vez del `activeCategoryObj.productCount` sin filtrar por precio.
  - Unificar etiqueta de chips de rango en los 3 lugares a `formatPriceRangeLabel(priceRange)`.
