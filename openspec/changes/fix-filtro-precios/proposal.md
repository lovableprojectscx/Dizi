# Fix Filtro de Precios: propuesta y requisitos

**Estado:** aprobado por Jack (`lo que recomiendes` → `continua`, 13 nov 2026) · Rama: `fix-filtro-precios` · Migración pendiente de OK post-merge antes de aplicar en producción.

## Problema diagnosticado
El interruptor **"Filtro de Precios"** (`stores.price_filter_enabled`) en `/admin/configuracion` figura encendido en 16 tiendas activas, pero presenta múltiples fallos y brechas en el catálogo público (`/t/:slug`), las especificaciones y las pruebas:

1. **PC sin control:** En escritorio (`>= lg`), el `<aside>` lateral (`PublicCatalog.tsx`) solo muestra categorías; el botón `"Filtros"` con el slider está oculto con `lg:hidden` y `<PriceRangeSlider />` fue removido del `<aside>` tras refactors de diseño, haciendo inaccesible el filtro por precio en PC.
2. **Solo filtra el primer lote en catálogos grandes:** `fetchStoreBySlug` descarga solo 24 productos (`page_limit = 24` frente a 36 de `catalogo-publico/spec.md`) y `get_public_store_products` carece de parámetros `p_min_price` / `p_max_price`. El rango `[priceMin, priceMax]` y el filtrado operan solo sobre `allProducts` en memoria.
3. **Diseños incompletos:** `bite` (`grano-miga`) no renderiza el botón `"Filtros"` en móvil ni recibe el filtro de precios en su barra; `isMockup = true` oculta el botón en `admin.diseno.tsx` (inconsistente con las vistas que sí lo muestran).
4. **Regresión UX slider mínimo-máximo:** El deslizador actual solo permite mover el extremo superior (`Desde S/ min hasta S/ val`) mientras la configuración prometía filtrar *por rango de precio* (`Desde` y `Hasta`). Además, los targets táctiles del slider (`16px`) y botones del drawer quedan por debajo de los `44×44 px` requeridos por `RNF-03`, y los estilos usan `zinc-*` fijos en lugar de tokens adaptativos al tema de cada tienda.
5. **Casos borde de precios y conteo:** Productos `"A consultar"` (`price <= 0` / `null` sin variaciones con precio > 0) permanecen visibles cuando el filtro está activo; variaciones con precios distintos solo se evalúan parcialmente; `renderResultsBar()` muestra el conteo de categoría usando `products.length` total en lugar del filtrado por precio; y existen bloques muertos (`sortBy` fijo en `"all"`, bloques resaltados de precio dentro de `{!isNarrowing && ...}`).

## Alcance
1. **Rango dual accesible:** Slider Min–Max (`Desde S/ min — Hasta S/ max`), normalizando a `priceRange = null` (`isNarrowing = false`) al devolver ambos extremos al rango completo. Targets táctiles `>= 44×44 px` (`RNF-03`) y estilo con tokens de tarjeta/marca del catálogo.
2. **Cobertura completa de catálogo + Zero-Egress:**
   - Alinear `fetchStoreBySlug` a `page_limit = 36` (`catalogo-publico/spec.md`).
   - Ampliar `get_public_store` con `price_bounds` (`{ min, max }` real en PostgreSQL considerando precio base y variaciones `> 0`) y ampliar `get_public_store_products` con `p_min_price` y `p_max_price`.
   - Mantener **retrocompatibilidad temporal en el cliente**: si el backend responde error de firma/función (`PGRST202` / `42883`) antes de aplicar la migración en producción, hacer fallback paginando lotes mediante la firma previa de 5 argumentos para no romper el catálogo tras el merge previo a la migración.
3. **Preservación UX/UI estricta (`0 px` en tiendas apagadas):**
   - Si `price_filter_enabled = false`, no se agrega ningún botón ni slider nuevo en ningún diseño ni viewport.
   - Con `price_filter_enabled = true`: `<PriceRangeSlider />` regresa al `<aside>` de PC; `"Filtros"` aparece en móvil en `bite` y `lookbook` únicamente cuando `hasPriceFilter === true`; `isMockup` mantiene coherencia visual.
4. **Limpieza técnica y documentación SDD:** Eliminar `sortBy` sin uso y ramas inalcanzables de `if (priceRange)` bajo `{!isNarrowing && ...}`, unificar texto del chip (`S/ min – S/ max`), actualizar `catalogo-publico/spec.md`, `no-funcionales/spec.md`, `REQUISITOS-FUNCIONALES.md`, `FUENTE-DE-VERDAD.md` y espejos en `INFORMACIÓN NECESARIA`.

## Requisitos funcionales del cambio
| ID | Requisito |
|---|---|
| RF-FP.1 | Con `stores.price_filter_enabled = false` o con menos de 2 precios filtrables distintos (`min === max` o catálogo vacío/todo "A consultar"), no se muestra el botón "Filtros" ni la sección "Rango de precio". |
| RF-FP.2 | Con `price_filter_enabled = true` y `min < max`, el slider dual permite ajustar mínimo y máximo dentro de `[priceMin, priceMax]` (tanto en PC `<aside>` como en Drawer móvil y modo `bite`), activando `isNarrowing = true` únicamente cuando el rango recorta el universo (`min > priceMin` o `max < priceMax`). Al regresar ambos extremos a `[priceMin, priceMax]` o pulsar "Limpiar" / "Quitar filtros", se restablece `priceRange = null` (`isNarrowing = false`). |
| RF-FP.3 | Productos "A consultar" (precio base `<= 0` o nulo sin variaciones positivas) quedan ocultos mientras `priceRange` esté activo (`isPriceRangeActive`). Si un producto tiene variaciones con precio positivo, coincide cuando su precio base (si `> 0`) o alguna variación positiva entra en `[min, max]`. |
| RF-FP.4 | En catálogos con más de 36 productos, al activar `priceRange`, el catálogo utiliza `store.priceBounds` como límites reales y consulta `get_public_store_products` en servidor con `p_min_price` y `p_max_price` (con debounce 300 ms y fallback automático a paginación de 5 parámetros si el RPC aún no fue migrado). |
| RF-FP.5 | `renderResultsBar()` muestra el conteo real coincidente incluso cuando hay categoría y rango de precio activos simultáneamente, y el chip de filtro activo muestra `"S/ min – S/ max"`. |

## Escenarios (E1–E7)
- **E1 — Tienda con filtro apagado (`price_filter_enabled = false`):** Ni móvil ni PC muestran el botón `"Filtros"` ni la tarjeta `"Rango de precio"`, manteniendo la vista idéntica (`0 px` de cambio).
- **E2 — Escritorio (1280 px) con filtro encendido:** El `<aside>` lateral muestra `"Rango de precio"` con slider dual funcional (`Desde` y `Hasta`); mover el rango activa el modo resultados, filtra productos y muestra chip `"S/ min – S/ max"` limpiable.
- **E3 — Móvil (375 px) en diseño estándar (`bloom_general`) con Drawer:** Botón `"Filtros"` visible (con objetivo táctil `>= 44×44 px`), abre el Drawer inferior con slider dual (`min` y `max`) accesible (`aria-label` claros y `min-h-11` en controles) y aplica el rango cerrando o actualizando en vivo sin scroll horizontal.
- **E4 — Diseño `bite` (`grano-miga`) en móvil (375 px) con filtro encendido:** Aparece el botón compacto `"Filtros"` junto al buscador únicamente cuando `hasPriceFilter === true`, abre el Drawer y filtra productos correctamente.
- **E5 — Variaciones y "A consultar":** Al activar un rango, un producto "A consultar" desaparece aunque antes fuera visible; un producto cuya única coincidencia está en una variación dentro de `[min, max]` sí aparece; al devolver ambos extremos al total, `priceRange` se normaliza a `null` y vuelven los "A consultar" y la portada.
- **E6 — Catálogo grande (>36 productos) + compatibilidad RPC:** `get_public_store` entrega `price_bounds` completos y la búsqueda por rango consulta el servidor encontrando un producto en la posición >36; además, si la RPC de 7 params responde `PGRST202`, el cliente recarga por lotes con la firma de 5 params y aplica el filtro sin error visible.
- **E7 — Categoría + rango de precio simultáneos:** Al filtrar por categoría y luego aplicar un rango de precio, el contador de la barra de resultados refleja exactamente las coincidencias reales de la intersección, y los chips permiten limpiar categoría o precio de forma independiente.
