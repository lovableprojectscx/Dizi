# F45 · Primera impresión: diseño técnico (hipótesis hasta el Paso 0; base master `4a0296d`, ya con F41b, F42.1, F42.2 y F42.3)

## Datos
- Usar `stores.banner_tagline` para el eslogan (ya existe y ya sale en `get_public_store`). Confirmar en el Paso 0 si cada diseño lo usa hoy y dónde.
- Sin migración, salvo que el Paso 0 muestre que hace falta un campo nuevo.

## Piezas
| Pieza | Archivo | Responsabilidad |
|---|---|---|
| Decisión de portada | `src/lib/brand-cover.ts` (nuevo) | `shouldShowBrandCover(store)`: true si `getMaxAllowedBanners(store) === 0` o si no hay banners. `getDefaultTagline(niche)`. Cálculo de colores con contraste AA a partir del color de marca. |
| `BrandCover` | `src/components/public/BrandCover.tsx` (nuevo) | La portada de marca, con variantes clara y oscura según el diseño. |
| Catálogo | `PublicCatalog.tsx` (el bloque de portada de cada diseño) | Usa `BrandCover` donde hoy no se dibuja nada. |
| Publicidad | `PublicCatalog.tsx` (`DiziNativeAdCard` y su ubicación, ~L1129 y las llamadas en cada diseño) | Regla de pocos productos (RF-45.5). |
| Imagen de publicidad | `public/images/dizi_ad_brand_3d.webp` | Versión de 600 px (RF-45.7). |
| Franja de contacto | `PublicCatalog.tsx` | RF-45.6. |
| Asistente | `src/components/admin/OnboardingWizard.tsx:424-449` | RF-45.4. |
| Registro | `src/routes/register.tsx` (~L1540) + `src/lib/theme-presets.ts` | Paletas por rubro (RF-45.8). |

## Eslóganes por rubro (propuesta para que Jack ajuste)
| Rubro | Eslogan |
|---|---|
| `ropa` | Moda que te queda, directo a tu WhatsApp |
| `comida` | Hecho con cariño, listo para pedir |
| `bisuteria` | Detalles que brillan contigo |
| `tech` | Tecnología con garantía, a un mensaje |
| `servicios` | Reserva tu cita en un toque |
| `floreria` | Flores y detalles para cada ocasión |
| `general` | Mira nuestro catálogo y pide por WhatsApp |

## Consulta de la línea base (repetir al medir)
```sql
SELECT count(*) total,
  count(*) FILTER (WHERE n >= 5) con_5_o_mas,
  count(*) FILTER (WHERE clicks > 0) con_clics
FROM (
  SELECT s.id,
    (SELECT count(*) FROM products p WHERE p.store_id = s.id AND COALESCE(p.is_sample, false) = false) n,
    COALESCE(s.whatsapp_clicks, 0) clicks
  FROM stores s
  WHERE s.plan = 'semilla' AND s.slug NOT LIKE '%demo%' AND s.slug NOT LIKE 'zz-%'
) t;
```

## Riesgos
- **Cambia el aspecto de tiendas existentes sin portada visible** (todas las Semilla y algunas de pago sin banner). Por eso RNF-45.1: lista y capturas antes y después para el OK de Jack antes del merge.
- La portada en los diseños con estilo fijo (Nature, Bite, Arch, etc.) puede chocar con su encabezado propio: el Paso 0 revisa diseño por diseño.
- No puede ir en paralelo con otro encargo que toque `PublicCatalog.tsx` (F41b), `register.tsx` u `OnboardingWizard.tsx` ("Producto primero").
