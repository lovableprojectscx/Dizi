# F41 · Formato de fotos + Vitrina: diseño técnico

> Verificado contra master `e0d3524` en el Paso 0 (4 nov). Las líneas pueden moverse; confirmarlas otra vez al empezar.

## Datos
- `stores.photo_format text NULL DEFAULT NULL CHECK (photo_format IN ('square','portrait','contain'))`. Las 59 tiendas existentes quedan en `NULL`.
- **No se usa `img_shape`:** controla las esquinas (14 tiendas `rounded`, 4 `square`, `theme-presets.ts:13`) y es otro concepto.
- `get_public_store` devuelve `photo_format`. Se recrea **partiendo de `pg_get_functiondef` vivo** (ya trae `wholesale_enabled` y `wholesale_tiers` de F42), y la migración incluye el diff contra esa definición. Si `get_public_store_products` no devuelve datos de la tienda, no se toca.
- La escritura va por la política RLS existente de `stores` (solo el dueño). No hace falta un RPC nuevo.
- Migración `20261104xxxxxx_f41_photo_format.sql` con el rollback comentado. Es compatible hacia atrás: el código viejo ignora la columna.

## Frontend
| Pieza | Archivo | Responsabilidad |
|---|---|---|
| `getPhotoAspect(store, layout)` y `suggestPhotoFormat(niche)` | `src/lib/photo-format.ts` (nuevo) | Única fuente de verdad. `NULL` → `grid: "4/3"`, `bloom_general: "1/1"`; `square` → `1/1`; `portrait` → `3/4`; `contain` → `1/1` + `object-contain`. Otro layout → `null` (no cambia nada). `ropa` → `portrait`; el resto → `square`. |
| Tipos | `src/lib/types.ts` | `photoFormat?: "square" \| "portrait" \| "contain" \| null` en `Store`. `getImageSpec` (~752) usa `getPhotoAspect` en Grilla y Bloom y reconoce `nature`, `bloom_general`, `bloom_floral`, `bite` y `vitrina`. |
| Mapeo | `src/lib/store.ts` | `photo_format` ↔ `photoFormat` en la lectura de la tienda y en el guardado de Diseño. `addStore` lo guarda al registrarse. |
| Grilla | `PublicCatalog.tsx` ~8114 y ~1224 (publicidad) | Reemplazar `"4/3"` por `getPhotoAspect`; con `contain` usar `object-contain` y el fondo de la tarjeta. |
| Bloom Estándar | `PublicCatalog.tsx` ~1658, ~1676, ~7367, ~7783 | Reemplazar `aspect-square` por `getPhotoAspect`; lo mismo para `contain`. |
| Vitrina | `PublicCatalog.tsx` (bloque nuevo) + `src/lib/design-catalog.ts` (`DESIGN_SPECS` y `DESIGN_STRUCTURES`) | Layout `vitrina` según RF-41.7. Reutiliza los helpers de precio, oferta (`discount.ts`), por mayor (`wholesale.ts`) y carrito existentes; no duplica su lógica. |
| Lookbook | `design-catalog.ts` ~352 | `enSelector: false`. El layout sigue existiendo. |
| Selector | `src/routes/admin.diseno.tsx` | Componente `PhotoFormatSelector`, visible solo con `grid` o `bloom_general`, con las 3 tarjetas con dibujo, "Sugerido para tu rubro", el aviso de Completa y "Volver al original". |
| Registro | `src/routes/register.tsx` ~1061 | `photoFormat: suggestPhotoFormat(selectedNiche)`. Vitrina aparece en los modelos y Lookbook no. |

## Riesgos
- **El riesgo mayor es cambiar el aspecto de una tienda existente.** Se mitiga con `NULL` = el comportamiento de hoy, con pruebas unitarias de `getPhotoAspect` y con capturas idénticas antes y después.
- **Perder campos de F42 al recrear `get_public_store`.** Se parte de la definición viva y se adjunta el diff.
- Vitrina en el PDF: el PDF tiene su propio diseño y no cambia (RNF-41.1).
- **No puede ir en paralelo** con otro encargo que toque `PublicCatalog.tsx`, `admin.diseno.tsx`, `register.tsx` o `get_public_store`.
