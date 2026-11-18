# F53 · Diseño técnico (hipótesis hasta el Paso 0)

## Datos (migración `2026111xxxxxxx_f53_registro_slides.sql`)
1. `stores.signup_city text NULL` con `CHECK (signup_city IS NULL OR signup_city ~ '^[a-z-]{2,30}$')`. Valores de `src/lib/ciudades.ts` (por ejemplo `lima`, `arequipa`, `la-libertad`, `piura`, `cusco`, `lambayeque`, `junin`, `ayacucho`, `ica`, `otra`).
2. `signup_funnel_events.step`: el CHECK se amplía con `completo_nombre`, `completo_rubro`, `completo_whatsapp` y `completo_datos`, conservando los valores de F49 (`completo_negocio` se mantiene para los datos ya guardados).
3. Sin cambios en `get_public_store` ni en las políticas.
Respaldo antes de aplicar y reversión comentada.

## Frontend
| Pieza | Responsabilidad |
|---|---|
| `src/routes/register.tsx` | Orquesta las 6 pantallas: estado, avance, volver, teclado. La lógica de F49 (`handleRegister`, invitaciones, referidos, plan, origen, link) se reutiliza tal cual |
| `src/components/register/` (nuevo) | `SlideShell` (progreso, volver, título en dos tonos, ayuda inferior), `ChoiceCard` (ícono, título, descripción, círculo, estado elegido), `LivePreview` (celular con el catálogo), `Celebration` |
| `LivePreview` | Usa `PublicCatalog` en modo `isMockup` (como `admin.diseno.tsx:1879`) con una tienda en memoria; carga diferida (`lazy`) después de la pantalla 1. En celular se muestra a escala y recortada |
| `src/lib/rubros.ts` | Se agregan 3–4 productos de ejemplo por rubro (nombre, precio, imagen local de `public/images/demos/`) solo para la vista previa |
| `src/lib/ciudades.ts` (nuevo) | Lista de ciudades con valor y etiqueta |
| `src/lib/signup-funnel.ts` | Pasos nuevos; si la base todavía no los acepta, el error se ignora en silencio |
| `src/lib/store.ts` | `addStore` acepta `signupCity` con el mismo reintento sin columna de F49 |
| Estilos | Tokens existentes de `styles.css` (`--brand`, `--primary`, `--background`, `--font-heading`); ningún color nuevo |

## Riesgos
- `PublicCatalog` es muy grande: la vista previa debe cargar en diferido para no frenar la primera pantalla. El Paso 0 mide el peso.
- Más pantallas pueden aumentar el abandono: se mide por pantalla y se compara con F49.
- No puede ir en paralelo con otro encargo que toque `register.tsx` o `rubros.ts`.
