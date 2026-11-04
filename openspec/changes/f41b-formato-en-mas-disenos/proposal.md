# F41b · Formato de fotos en más diseños: propuesta y requisitos

**Estado:** aprobado por Jack (4 nov 2026). Paso 0 visual hecho (`04-TECNICA/encargos/INFORME-F41b-Paso0-Evaluacion-2026-11-04.md`, capturas en `capturas-f41b/`), revisado por Claude. **Planes:** todos.
**Por qué:** Jack quiere que cada tienda elija el formato que le guste con el diseño que le guste, no solo en Grilla y Bloom. El Paso 0 mostró que Cuadrada y Vertical quedan bien en todos los diseños, pero "Completa" rompe los diseños con texto sobre la foto o con forma propia. Es la misma práctica de Shopify (Dawn: un ajuste de proporción para toda la tienda, entre las opciones que el tema soporta).
**Base:** F41 (`F41-formato-fotos-vitrina/`), en producción desde el 4 nov. La columna `stores.photo_format` ya existe: **no hace falta migración**.

## Matriz aprobada
| Diseño | Como hoy (NULL) | Cuadrada | Vertical | Completa |
|---|---|---|---|---|
| Grilla | 4:3 | ✅ | ✅ | ✅ |
| Bloom Estándar | 1:1 | ✅ | ✅ | ✅ |
| Diagonal | 4:3 | ✅ | ✅ | ❌ |
| Overlay | 3:4 | ✅ | ✅ | ❌ |
| Arch | 3:4 | ✅ | ✅ | ❌ |
| Nature | 1:1 | ✅ | ✅ | ❌ |
| Bite | 1:1 | ✅ | ✅ | ✅ |
| Vitrina | 3:4 | ✅ | ✅ | ✅ |

Cualquier otro diseño (Bloom Floral, Lookbook, diseños ocultos o históricos) ignora el formato, igual que hoy.

## Requisitos funcionales
| Id | Requisito |
|---|---|
| RF-41b.1 | Los formatos permitidos de cada diseño se declaran **una sola vez**, en la ficha del diseño (`DESIGN_SPECS`, campo nuevo `formatosFoto`), según la matriz. |
| RF-41b.2 | En Diseño, el selector de formato aparece en todos los diseños de la matriz y **solo muestra las opciones permitidas** para el diseño elegido (en Diagonal, Overlay, Arch y Nature: 2 tarjetas). |
| RF-41b.3 | **Protección al cambiar de diseño:** si el formato guardado no está permitido en el diseño actual (ej. tenía "Completa" en Grilla y cambia a Overlay), el catálogo usa la proporción de "como hoy" de ese diseño. No se borra el valor guardado: si vuelve a Grilla, recupera "Completa". El selector lo muestra como "Ahora: como siempre". |
| RF-41b.4 | Con `photo_format = NULL`, cada diseño se ve **exactamente como hoy** (tabla, columna "Como hoy"). |
| RF-41b.5 | El registro de tiendas nuevas sigue guardando el formato del rubro (F41, RF-41.6). Si ese formato no está permitido en el diseño elegido, aplica RF-41b.3. |
| RF-41b.6 | La recomendación de tamaño de foto del panel (`getImageSpec`) sigue la proporción efectiva de cada diseño (con su formato o con su "como hoy"). |

## Requisitos no funcionales
- **RNF-41b.1 Nada más cambia:** ninguna tienda existente cambia de aspecto. Capturas antes y después idénticas de `/t/catalogo`, `/t/onfeet`, `/t/urbana-drop-demo` (Diagonal), `/t/nova-setup` (Overlay), `/t/aura` (Arch), `/t/jhoselynperu` (Nature), `/t/restaurante-demo` (Bite) y `/bio/milance`.
- **RNF-41b.2 Una sola fuente de verdad:** la matriz vive solo en `DESIGN_SPECS`; `getPhotoAspect`, el selector y `getImageSpec` la leen de ahí. Nada de listas repetidas.
- **RNF-41b.3 Sin migración ni cambios en la base.**
- **RNF-41b.4 Celular primero:** el selector con 2 opciones también va en una fila y no ocupa más de media pantalla.

## Escenarios (cada uno es una prueba con su número)
- **E1** Dado cada diseño de la matriz con `photo_format = NULL`, entonces la proporción es la de "Como hoy".
- **E2** Dado Diagonal, Overlay, Arch o Nature con `square` o `portrait`, entonces sus tarjetas usan 1:1 o 3:4.
- **E3** Dado Diagonal, Overlay, Arch o Nature con `contain` guardado, entonces se ven como con NULL (RF-41b.3).
- **E4** Dado Bite o Vitrina con `contain`, entonces la foto se ve completa, sin recorte.
- **E5** Dado el selector en Diagonal, Overlay, Arch o Nature, entonces veo solo Cuadrada y Vertical. En Grilla, Bloom, Bite y Vitrina veo las 3.
- **E6** Dado una tienda con `contain` en Grilla, cuando cambia a Overlay, entonces su catálogo se ve como Overlay de hoy. Cuando vuelve a Grilla, se ve en Completa.
- **E7** Dado Bloom Floral, Lookbook u otro diseño fuera de la matriz con cualquier formato, entonces se ve igual que con NULL.
- **E8** Dado cada diseño de la matriz y cada formato permitido, entonces `getImageSpec` recomienda la misma proporción que se dibuja.

## Fuera de alcance
Punto focal por producto (arriba, centro, abajo) → posible F41c. Formato por categoría o por producto.

## Decisiones abiertas
Ninguna.
