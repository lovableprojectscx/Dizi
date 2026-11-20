# F54 · Diseño técnico (hipótesis hasta el Paso 0)

## Datos
- **Sin cambios en la base.** No hay migración.
- **Se lee lo que ya carga el panel:**
  - `store.products`: `visible`, `image`, `isSample`, `sortOrder`, precio y oferta.
  - `store.views`, `store.whatsappClicks`, `store.plan`, `store.subscriptionStatus`, `store.planExpiresAt`.
  - La encuesta (`canStoreTakeSurvey`, `getMySurveyResponse`).
  - `isProductIncomplete` e `isStoreEligibleForCompletaTuTienda` / `isCompletaTuTiendaDismissed`.
- **No existe historial por día** (solo `share_events` y `signup_funnel_events`; verificado el 19 nov). Por eso los números van "en total".

## Piezas de frontend
| Archivo | Responsabilidad |
|---|---|
| `src/lib/panel-home.ts` (nuevo, puro) | `getNextStep(store, ctx)` → `{ principal, tambien[] }` con la prioridad de RF-54.3/54.4; `getMosaicProducts(store, 4)`; `getHeroProduct(store)` (RF-54.6). |
| `src/lib/promo-ideas.ts` (nuevo, puro) | La lista de fechas, el cálculo de fechas móviles (Día de la Madre, Día del Padre, Black Friday) y `getUpcomingIdeas(hoy, 45, 2)`. |
| `src/components/admin/PanelHero.tsx` (nuevo) | La franja índigo reutilizable (título, subtítulo, etiqueta, contenido a la derecha). La usan Inicio y Promociona. |
| `src/components/admin/ProductMosaic.tsx` (nuevo) | El mosaico de 1–4 fotos y su estado vacío. |
| `src/components/admin/NextStepCard.tsx` (nuevo) | La tarjeta única con "También pendiente". Reutiliza `CompletaTuTienda` en el caso (b). |
| `src/components/admin/StylePreviewStrip.tsx` (nuevo, diferido) | Las miniaturas en `<canvas>` con `drawShareImage` + `prepareShareImageData`, dibujadas al entrar en pantalla (`IntersectionObserver`). Debe resolver la misma carga de foto, logo, QR, fuentes y el respaldo a Supabase que hace hoy `ShareImageDialog` (extraer esa carga a una función compartida, no copiarla). |
| `src/components/admin/PromoIdeas.tsx` (nuevo) | Las tarjetas de ideas. |
| `src/components/admin/ShareImageDialog.tsx` | Solo agrega la prop opcional `initialStyle` (y opcionalmente `initialCaptionTemplate`). |
| `src/routes/admin.dashboard.tsx` | Reordenado según la propuesta. Se quitan los avisos apilados (pasan a `NextStepCard`) y la tarjeta "Plan actual". |
| `src/routes/admin.marketing.tsx` | Franja + miniaturas + ideas + cuadrícula. Se quita `ShareCatalogCard`. |

## "Ideas para vender" — borrador de textos (los decide Jack)
| Fecha | Regla | Título | Consejo | Estilo · plantilla |
|---|---|---|---|---|
| San Valentín | 14 feb | San Valentín | Publica tus regalos estrella con precio claro. | Marco de color · novedad |
| Día de la Mujer | 8 mar | Día de la Mujer | Arma un detalle listo para regalar y muéstralo. | Editorial · novedad |
| Día de la Madre | 2.º domingo de mayo | Día de la Madre | Es la fecha que más vende: publica una semana antes. | Etiqueta · novedad |
| Día del Padre | 3.er domingo de junio | Día del Padre | Muestra opciones por rango de precio. | Etiqueta · simple |
| Fiestas Patrias | 28 jul | Fiestas Patrias | Un producto en rojo y blanco llama la atención. | Marco de color · simple |
| Halloween / Canción Criolla | 31 oct | Fin de octubre | Aprovecha el feriado largo para recordar tu catálogo. | Editorial · simple |
| Black Friday | viernes después del 4.º jueves de noviembre | Black Friday | Si tienes oferta, este es el día de mostrarla. | Oferta (si no hay oferta: Etiqueta) · oferta |
| Navidad | 25 dic | Navidad | Publica tus regalos desde ya; la gente compra con anticipación. | Marco de color · novedad |
| (permanente) | — | Producto de la semana | Elige un producto y publícalo hoy en tus estados. | Etiqueta · simple |

## Riesgos
- **Miniaturas en `<canvas>`:**
  - Cada una carga la foto con CORS.
  - Si falla (Bunny / Supabase), se muestra la foto sin estilo y un aviso discreto, nunca un recuadro roto.
  - Se dibujan una sola vez y a tamaño chico.
- **El cálculo de fechas** debe usar la hora de Lima (`America/Lima`), no la UTC del navegador.
- **Contraste en modo oscuro:** la franja no puede ser `#6C67E8` con texto blanco chico. El Paso 0 propone el par de colores (sin colores nuevos fuera del manual) y la prueba lo comprueba.

## Paralelo
No puede ir en paralelo con otro encargo que toque `admin.dashboard.tsx`, `admin.marketing.tsx` o `ShareImageDialog.tsx`.
