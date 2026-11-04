# F41b · Formato en más diseños: diseño técnico

> Basado en master `6cb6a78` (F41 ya fusionado). En la rama local `f41b-formato-todos-los-disenos` ya están conectadas las proporciones en Overlay (~L4105), Diagonal (~L5397), Arch (~L5520), Bite (~L5857, ~L6622), Nature (~L6900, ~L6946) y Vitrina (~L8209) de `PublicCatalog.tsx` (informe del Paso 0). Hay que confirmar esas líneas al rebasar sobre master.

## Datos
Sin cambios. Se usa `stores.photo_format` de F41.

## Piezas
| Pieza | Archivo | Responsabilidad |
|---|---|---|
| Matriz | `src/lib/design-catalog.ts` → `DESIGN_SPECS[id].formatosFoto?: PhotoFormat[]` y `DESIGN_SPECS[id].proporcionBase` ("4/3", "3/4" o "1/1") | Única fuente de la matriz y de la proporción de "como hoy". Sin `formatosFoto`, el diseño no es flexible. |
| Resolución | `src/lib/photo-format.ts` | `getPhotoAspect(store, layout)` resuelve el **id oficial** del diseño (`getDesignSpec(model, niche).id`), lee `formatosFoto` y `proporcionBase` y aplica RF-41b.3. `isFlexiblePhotoLayout` y la función `getDefaultAspectForLayout` del Paso 0 se reemplazan por la lectura de la ficha, para no tener dos listas. |
| Catálogo | `src/components/public/PublicCatalog.tsx` | Las tarjetas de los 8 diseños usan `photoAspect`. "Completa" solo donde está permitida, con el fondo de la tarjeta del tema. |
| Selector | `src/routes/admin.diseno.tsx` | Muestra las opciones de `formatosFoto` del diseño elegido; 2 o 3 tarjetas en una fila; "Sugerido para tu rubro" solo si la sugerencia está entre las permitidas. |
| Recomendación | `src/lib/types.ts` → `getImageSpec` | Usa `getPhotoAspect`. |
| Pruebas | `src/lib/__tests__/photo-format.test.ts` y Playwright | E1–E8 sobre el código real. |

## Riesgos
- **Cambiar sin querer una tienda existente.** Se mitiga con NULL = "como hoy" sacado de la ficha, pruebas por diseño y capturas antes/después de las 8 tiendas de control.
- **Resolver el diseño por `cfg.layout` en vez del id oficial** haría que diseños históricos que comparten layout (por ejemplo `elite`, que dibuja como Grilla pero es oficialmente Banner Grid) recibieran el formato. Por eso se usa el id oficial.
- No puede ir en paralelo con otro encargo que toque `PublicCatalog.tsx`, `admin.diseno.tsx` o `design-catalog.ts`.
