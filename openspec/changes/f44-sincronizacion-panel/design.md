# F44 · Sincronización segura del panel: arquitectura (hipótesis hasta el Paso 0)

## Datos (migración como archivo)
- `products.version integer not null default 1`
- `products.updated_at timestamptz not null default now()`
- Función `bump_product_version()` (plpgsql, `SECURITY INVOKER`, `SET search_path = public, pg_temp`): `NEW.version := OLD.version + 1; NEW.updated_at := now();`
- Trigger `trg_bump_product_version BEFORE UPDATE ON products FOR EACH ROW`.
- Las RLS no cambian. `get_public_store` y `get_public_store_products` no cambian (no exponen `version`).
- El SQL para revertir, comentado y en orden: primero el trigger y la función, después las columnas.
- **Cuidado con el orden de los triggers:** existen `trg_check_product_limit`, `trg_validate_wholesale_tiers`, `trg_cleanup_sample_products` y `trg_products_touch_store`. Verifica que el nuevo no los altere.

## Frontend
| Pieza | Archivo | Cambio |
|---|---|---|
| Carga | `src/routes/admin.tsx:106-110` | `fetchData(true)` en segundo plano al montar; escuchar `visibilitychange` (más de 60 s → consultar de nuevo) |
| Persistencia | `src/lib/store.ts` `partializeAppState` (~1680) + `persist` | Se **mantiene** la caché para pintar al instante (SWR). Subir la versión de `persist` (`version: 1` + `migrate` que descarta lo anterior). Indicador sutil "Actualizando…" mientras revalida. Flush de los debounce pendientes de `swapProductsOrder` antes de cada revalidación (riesgo 2 del Paso 0). |
| Lectura al editar | `admin.productos.tsx` `openEdit` (~2116) + función nueva `fetchProductFresh(id)` en `store.ts` | `select(*)` del producto antes de abrir el formulario |
| Guardado | `store.ts` `upsertProduct` (~1200) | Existente → `diffProduct(original, editado)` → `.update(cambios).eq("id").eq("version", v).select("version")`; si son 0 filas → conflicto. Nuevo → `insert`. Sin reintento silencioso. |
| Orden | `store.ts` `swapProductsOrder` (~1394) | Solo `sort_order` (+ `version`) |
| Visibilidad | `store.ts` `toggleProductVisible` (~1360) | Agregar la condición de `version` |
| Lógica pura | `src/lib/product-sync.ts` (nuevo) | `diffProduct`, `toDbPatch` y `isConflict`, con Vitest |
| Tipos | `types.ts` | `Product.version?`, `Product.updatedAt?`; `mapStoreFromDB` los lee |

## Riesgos
- **Panel más lento** al dejar de guardar en el navegador → medir (RNF-44.3). Plan B: guardar en el navegador solo para pintar rápido, pero **siempre** consultar la base antes de permitir guardar.
- **Otros lugares que escriben** `products` (carga rápida, edición masiva, `createStore`): revisarlos en el Paso 0.
- **No va en paralelo con F41** (los dos tocan `admin.productos.tsx` y `store.ts`).
