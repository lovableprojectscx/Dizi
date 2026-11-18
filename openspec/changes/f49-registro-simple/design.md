# F49 · Diseño técnico (hipótesis hasta el Paso 0)

## Datos (una migración, `supabase/migrations/2026111xxxxxxx_f49_registro.sql`)
1. `stores.signup_source text NULL` con `CHECK (signup_source IS NULL OR signup_source IN ('tiktok','facebook','instagram','recomendacion','otro'))`.
2. `stores.signup_utm text NULL` con `CHECK (signup_utm IS NULL OR signup_utm ~ '^[a-z0-9-]{1,40}$')`.
3. Tabla `signup_funnel_events`:
   - `id uuid PK default gen_random_uuid()`, `session_id text NOT NULL CHECK (length(session_id) BETWEEN 8 AND 64)`, `step text NOT NULL CHECK (step IN ('vio_registro','completo_negocio','creo_cuenta','creo_producto','salto_producto'))`, `source text NULL` (mismo CHECK que `signup_utm`), `created_at timestamptz default now()`.
   - RLS activada. Política `anon_insert` y `authenticated_insert` solo INSERT. Política `superadmin_select` con el patrón JWT (`app_metadata.role = 'super_admin'`). Sin UPDATE ni DELETE para nadie salvo service_role.
   - Índice por `created_at`.
4. No se cambia `get_public_store` (el origen no es público).
5. Las tiendas existentes quedan con NULL: no cambia nada para ellas.
Respaldo antes de aplicar: esquema de `stores` y lista de políticas. Reversión comentada al final del archivo.

## Rubros (fuente única: `src/lib/rubros.ts`, nuevo)
| Botón | `niche` guardado | Notas |
|---|---|---|
| Florería | `floreria` | `PublicCatalog.tsx` ya tiene estilos para `floreria` (17 referencias): el Paso 0 dice qué cambia para una tienda nueva con ese valor |
| Ropa y moda | `ropa` | existe hoy |
| Calzado | `calzado` | nuevo, se comporta como `general` |
| Accesorios y joyería | `bisuteria` | existe hoy |
| Belleza | `belleza` | nuevo |
| Hogar y decoración | `hogar` | nuevo |
| Comida | `comida` | existe hoy |
| Postres y pastelería | `pasteleria` | nuevo |
| Tecnología | `tech` | existe hoy (ojo: hay 1 tienda con `tecnologia`) |
| Regalos | `regalos` | nuevo, existe en demos |
| Servicios | `servicios` | existe hoy |
| Otro | `general` | |
Cada rubro define: diseño por defecto, paleta por defecto, formato de foto sugerido, emoji/ícono del botón. **Regla:** un valor nuevo sin estilos propios se ve igual que `general`. El Paso 0 lista con archivo:línea todo lo que lee `niche` (catálogo, portada de marca, eslogan por defecto, paletas, formato de foto) para confirmarlo.

## Piezas de frontend
| Archivo | Responsabilidad |
|---|---|
| `src/lib/rubros.ts` (nuevo) | Lista de rubros, valor `niche`, diseño, paleta y formato por defecto |
| `src/lib/slug.ts` (o el helper existente) | Nombre → link (sin tildes, minúsculas, guiones, máx. 40) |
| `src/lib/signup-funnel.ts` (nuevo) | `session_id` en sessionStorage y `logFunnelStep(step)` no bloqueante (si falla, no se muestra nada) |
| `src/routes/register.tsx` | 2 pantallas, botones de rubro, link automático, "¿Cómo nos conociste?", lectura de `?origen=` / `utm_source`, sin paso Diseño; conserva `?invite=`, `?ref=`, `?plan=` |
| `src/lib/showcase.ts` / `register.tsx:1827` | Título "Mira cómo se ven las tiendas en Dizi" |
| `src/lib/store.ts` | `addStore` acepta `signupSource` y `signupUtm`; si la columna no existe aún, reintenta sin ellas (revisar `error`, no `catch`) |
| `src/routes/admin.productos.tsx` | Parámetro de bienvenida que abre el formulario de producto con mensaje y "Lo hago después" |
| `src/components/admin/OnboardingWizard.tsx` / `admin.tsx:191` | No se muestra a tiendas creadas desde F49 (criterio en el Paso 0: fecha de creación o marca) |
| `src/components/admin/CompletaTuTienda.tsx` (nuevo) en `admin.dashboard.tsx` | 5 tareas con estado real (logo, portada, diseño cambiado o confirmado, Link en Bio, 3 productos); se cierra y se recuerda |
| `src/routes/super.tiendas.tsx` | Columna "Origen" |

## Riesgos
- `register.tsx` tiene 2192 líneas: cambiar solo lo necesario.
- El valor `floreria` activa estilos especiales en el catálogo: hay que mirar una tienda nueva florería con captura antes del merge.
- No puede ir en paralelo con otro encargo que toque `register.tsx`, `admin.tsx` o `admin.dashboard.tsx`.
- La tabla del embudo acepta inserts anónimos: valores cerrados por CHECK y sin lectura pública.
