# F42 · Precio por mayor: arquitectura

## Datos
- `products.wholesale_tiers jsonb not null default '[]'` → `[{ "min_qty": 3, "price": 28 }, { "min_qty": 12, "price": 24 }]`.
  Se elige un jsonb y no columnas porque son hasta 3 niveles, y así ninguna tabla nueva ni join.
- `stores.wholesale_enabled boolean not null default false`.
- **Trigger `trg_validate_wholesale_tiers`** (BEFORE INSERT/UPDATE OF `wholesale_tiers`, `price`, `variations`): valida el formato, máx. 3 niveles, `min_qty` ≥ 2 y creciente, `price` > 0 y decreciente, `price` < `products.price`, `products.price` no null, y las variaciones sin precios distintos.
- **Funciones públicas:** `get_public_store` devuelve `wholesale_enabled` **ya resuelto por el plan efectivo** (false si Semilla o vencido); las funciones o consultas que devuelven productos agregan `wholesale_tiers`. Se recrean desde la definición de producción, cambiando solo eso.

## Frontend
| Pieza | Archivo | Responsabilidad |
|---|---|---|
| Lógica pura | `src/lib/wholesale.ts` (nuevo) | `getTiers(product, store)`, `getUnitPrice(product, totalQty, store)`, `getNextTier(...)`, `validateTiers(...)`. Sin React ni consultas. |
| Tipos | `types.ts`, `store.ts` (map + upsert) | `Product.wholesaleTiers`, `Store.wholesaleEnabled` |
| Carrito | `PublicCatalog.tsx` (`cartLines`/`total`/`sendOrder`) | Agrupa la cantidad por `productId` → `getUnitPrice`. **No** guarda el precio en `CartItem`. |
| Detalle | `PublicCatalog.tsx` (modal) | `<WholesaleTable>` (componente nuevo, `components/public/WholesaleTable.tsx`) |
| Tarjeta | `PublicCatalog.tsx` | `<WholesaleHint>` ("Precio x mayor"), un solo componente que se reutiliza en todos los diseños |
| Carrito UI | `PublicCatalog.tsx` | `<WholesaleProgress>`: barra + "Agrega N más" / "aplicado ✅" + "Ahorraste" |
| PDF | `CatalogPdfExport.tsx` | Los niveles bajo el precio |
| Panel | `admin.diseno.tsx` (Módulos), `admin.productos.tsx` | Interruptor; sección plegada `<WholesaleEditor>` con simulador y `validateTiers` |

## Flujo del precio (carrito)
`cart` → agrupar la cantidad por `productId` → para cada línea: `unit = getUnitPrice(product, qtyDelProducto, store)` → `subtotal = unit × qty` → `ahorro = (precioNormal − unit) × qty` → total y mensaje.

## Riesgos
- **15 diseños:** solo se toca la línea de texto de la tarjeta, con un componente común. Sin etiquetas sobre la foto.
- **El carrito ya guardado en el navegador:** como no se guarda el precio por mayor, no hay que migrar nada.
- **Choque con F41** (también toca `PublicCatalog.tsx` y `admin.diseno.tsx`): F42 y F41 **no** van en paralelo.
