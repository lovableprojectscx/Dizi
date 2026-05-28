# Dizi — Arquitectura y Funcionalidades del Sistema

> Documento de referencia técnica. Actualizar cada vez que se agregue o modifique una funcionalidad importante.
> Última revisión: mayo 2026

---

## 1. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Routing | TanStack Router (file-based) |
| Estado global | Zustand con `persist` middleware |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage) |
| Estilos | Tailwind CSS v3 + shadcn/ui |
| Notificaciones | Sonner (toasts) |
| Imágenes | Conversión a WebP en el cliente (`image-utils.ts`) + upload a Supabase Storage (bio/reclamaciones) |
| Mapas | Leaflet (selector de ubicación en Bio-Link) |
| PDF | jsPDF + html2canvas (exportación de catálogo) |

---

## 2. Estructura de Archivos Clave

```
src/
├── lib/
│   ├── types.ts          ← Tipos, constantes, helpers de negocio
│   ├── store.ts          ← Estado global Zustand + llamadas a Supabase
│   ├── supabase.ts       ← Cliente Supabase
│   ├── auth.ts           ← Lógica de autenticación
│   ├── image-utils.ts    ← Conversión de imágenes a WebP
│   ├── whatsapp.ts       ← Construcción de URLs de WhatsApp y formatPrice
│   ├── error-capture.ts  ← Captura de errores globales
│   ├── error-page.ts     ← Página de error genérica
│   ├── mock-data.ts      ← Datos de ejemplo para desarrollo
│   └── utils.ts          ← Utilidades generales (cn, etc.)
│
├── routes/
│   ├── __root.tsx              ← Root layout: QueryClient, Toaster, meta tags globales
│   ├── index.tsx               ← Landing page pública (/)
│   ├── login.tsx               ← Login cliente (/login)
│   ├── register.tsx            ← Registro con invite token (/register)
│   ├── novedades.tsx           ← Novedades y FAQ públicos (/novedades)
│   ├── t.$slug.tsx             ← Catálogo público (/t/:slug)
│   ├── bio.$slug.tsx           ← Bio-Link público (/bio/:slug)  ← NUEVO
│   ├── admin.tsx               ← Layout del panel admin (/admin)
│   ├── admin.index.tsx         ← Redirect al dashboard dentro de /admin
│   ├── admin.dashboard.tsx     ← Dashboard con métricas
│   ├── admin.productos.tsx     ← Gestión de productos
│   ├── admin.categorias.tsx    ← Gestión de categorías
│   ├── admin.diseno.tsx        ← Selector de modelo visual y colores
│   ├── admin.configuracion.tsx ← Datos del negocio (nombre, WhatsApp, logo, slug)
│   ├── admin.plan.tsx          ← Vista del plan actual y vencimiento
│   ├── admin.link-bio.tsx      ← Editor del Bio-Link (/admin/link-bio)  ← NUEVO
│   ├── admin.reclamaciones.tsx ← Libro de Reclamaciones (/admin/reclamaciones)  ← NUEVO
│   ├── super.tsx               ← Layout superadmin (/super)
│   ├── super.index.tsx         ← Redirect dentro de /super
│   ├── super.login.tsx         ← Login superadmin (/super/login)
│   ├── super.dashboard.tsx     ← Dashboard global de tiendas
│   └── super.tiendas.tsx       ← Gestión de todas las tiendas
│
├── components/
│   ├── InviteGenerator.tsx            ← Generador de invite links (superadmin)
│   ├── admin/
│   │   ├── AdminSidebar.tsx           ← Sidebar del panel cliente
│   │   ├── ImageUploadGuided.tsx      ← Subida de imagen con guía de proporción
│   │   └── SubscriptionManager.tsx    ← Panel de gestión de suscripción por tienda
│   └── public/
│       ├── PublicCatalog.tsx          ← Catálogo público completo
│       └── CatalogPdfExport.tsx       ← Exportación a PDF
│
└── supabase/
    └── migrations/
        └── 20260513_subscription_management.sql ← Migración de suscripciones

supabase_libro_reclamaciones.sql  ← Migración del Libro de Reclamaciones (raíz del proyecto)
```

---

## 3. Tablas en Supabase

### `stores`
Cada tienda del sistema.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | Identificador único |
| `slug` | text unique | URL del catálogo público (`/t/:slug`) |
| `name` | text | Nombre comercial |
| `phone` | text | Teléfono completo con código de país |
| `country_code` | text | Código de país (ej: "51") |
| `logo` | text | Data URL de la imagen en WebP |
| `model` | text | ID del modelo de diseño activo |
| `brand_color` | text | Color de acento personalizado (hex) |
| `bg_color` | text | Color de fondo personalizado (hex) |
| `banner_image` | text | Data URL del banner de portada |
| `banner_title` | text | Título del banner de portada |
| `plan` | text | `semilla / emprendedor / pro / ilimitado` |
| `plan_expires_at` | timestamptz | Fecha de vencimiento del plan |
| `subscription_status` | text | `trial / active / expired / cancelled` |
| `plan_duration_months` | int | Duración contratada en meses |
| `cancelled_at` | timestamptz | Fecha de cancelación |
| `cancel_reason` | text | Motivo de cancelación |
| `price_filter_enabled` | bool | Activa el slider de precio en el catálogo |
| `active` | bool | Si la tienda está activa |
| `is_published` | bool | Si el catálogo es visible al público |
| `whatsapp_clicks` | int | Contador de clics en WhatsApp |
| `owner_id` | uuid | FK al usuario Supabase Auth |
| `created_at` | timestamptz | Fecha de creación |
| `libro_reclamaciones_activo` | bool | Si el Libro de Reclamaciones está habilitado ← NUEVO |
| `empresa_ruc` | text | RUC de la empresa (para reclamaciones) ← NUEVO |
| `empresa_razon_social` | text | Razón social legal (para reclamaciones) ← NUEVO |
| `empresa_direccion` | text | Dirección de la empresa (para reclamaciones) ← NUEVO |
| `bio_description` | text | Descripción del Bio-Link ← NUEVO |
| `bio_links_enabled` | bool | Si el Bio-Link está habilitado ← NUEVO |
| `bio_logo` | text | URL (Storage) del logo del Bio-Link ← NUEVO |
| `bio_banner` | text | URL (Storage) del banner del Bio-Link ← NUEVO |
| `bio_theme` | text | Tema visual del Bio-Link (`default`, etc.) ← NUEVO |
| `bio_button_style` | text | Estilo de botones (`pill-solid`, `rounded-full`, etc.) ← NUEVO |
| `bio_button_color` | text | Color de fondo de botones (hex) ← NUEVO |
| `bio_button_text_color` | text | Color de texto de botones (hex) ← NUEVO |
| `bio_bg_image` | text | URL (Storage) de imagen de fondo del Bio-Link ← NUEVO |
| `bio_bg_color` | text | Color de fondo del Bio-Link (hex) ← NUEVO |
| `location_lat` | float | Latitud de la ubicación del negocio ← NUEVO |
| `location_lng` | float | Longitud de la ubicación del negocio ← NUEVO |
| `location_address` | text | Dirección legible de la ubicación ← NUEVO |
| `quick_links` | jsonb | Array de `QuickLink[]` (links del Bio-Link) ← NUEVO |

### `categories`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | Identificador único |
| `store_id` | uuid FK | Tienda dueña |
| `name` | text | Nombre de la categoría |

### `products`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | Identificador único |
| `store_id` | uuid FK | Tienda dueña |
| `category_id` | uuid FK | Categoría asignada |
| `name` | text | Nombre del producto |
| `price` | numeric | Precio actual (precio oferta si `is_on_sale`) |
| `original_price` | numeric | Precio original (solo si `is_on_sale`) |
| `image` | text | Data URL en WebP |
| `description` | text | Descripción opcional |
| `is_on_sale` | bool | Si está en oferta |
| `visible` | bool | Si aparece en el catálogo público |
| `is_sample` | bool | Producto de ejemplo (se eliminan al crear el primero real) |

### `reclamaciones` ← NUEVA TABLA
Tabla del Libro de Reclamaciones, conforme a normativa peruana vigente.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | Identificador único |
| `tenant_id` | text FK → stores.id | Tienda a la que pertenece |
| `numero_correlativo` | int | Número único por tienda (auto-incremental por RPC) |
| `fecha` | timestamptz | Fecha/hora de registro |
| `estado` | text | `pendiente / en_revision / resuelto` |
| `fecha_respuesta` | timestamptz | Cuándo se respondió |
| `respuesta_proveedor` | text | Respuesta del proveedor al consumidor |
| `empresa_nombre` | text | Nombre de la empresa al momento del registro |
| `empresa_ruc` | text | RUC registrado en la tienda |
| `empresa_direccion` | text | Dirección registrada en la tienda |
| `empresa_url` | text | URL del catálogo público |
| `consumidor_nombre` | text | Nombre del reclamante |
| `consumidor_tipo_doc` | text | `DNI / CE / Pasaporte / RUC` |
| `consumidor_num_doc` | text | Número del documento |
| `consumidor_domicilio` | text | Dirección del consumidor |
| `consumidor_telefono` | text | Teléfono del consumidor |
| `consumidor_email` | text | Email del consumidor |
| `es_menor_edad` | bool | Si el reclamante es menor de edad |
| `tutor_nombre` | text | Nombre del tutor (si menor) |
| `tutor_num_doc` | text | Documento del tutor |
| `bien_descripcion` | text | Descripción del bien o servicio |
| `bien_monto` | numeric | Monto del bien o servicio |
| `tipo` | text | `queja / reclamo` |
| `descripcion` | text | Descripción del problema |
| `pedido_consumidor` | text | Qué solicita el consumidor |

### `invites`
| Columna | Tipo | Descripción |
|---|---|---|
| `token` | text PK | Token único del link de invitación |
| `plan` | text | Plan que otorga al registrarse |
| `duration_months` | int | Duración de la suscripción en meses |
| `used` | bool | Si ya fue usado |
| `expires_at` | timestamptz | Cuándo vence el invite (auto-calculado) |
| `notes` | text | Notas internas del superadmin |
| `created_at` | timestamptz | Fecha de creación |

---

## 4. RPCs de Supabase (Funciones PostgreSQL)

| RPC | Parámetros | Descripción |
|---|---|---|
| `initialize_store` | `p_store_id, p_owner_id, p_plan, p_slug` | Inicializa una tienda nueva con categorías y productos de ejemplo |
| `activate_subscription` | `p_store_id, p_plan, p_duration_months` | Activa o renueva suscripción, calcula `plan_expires_at` |
| `cancel_subscription` | `p_store_id, p_reason?` | Marca la suscripción como cancelada |
| `extend_subscription` | `p_store_id, p_months` | Extiende el vencimiento sumando meses |
| `degrade_expired_plans` | ninguno | Degradar tiendas vencidas a semilla (para pg_cron) |
| `increment_whatsapp_clicks` | `store_id_param` | Incrementa el contador de clics |
| `get_public_store` | `store_slug` | Devuelve los datos públicos de una tienda por slug (usado en `/bio/:slug`) ← NUEVO |
| `insert_reclamacion` | Ver detalle § 17 | Inserta una reclamación con número correlativo atómico ← NUEVO |

---

## 5. Sistema de Planes

### Definición de planes (`src/lib/types.ts`)

```
semilla      → 7 productos,   gratis
emprendedor  → 50 productos,  S/ 14.90/mes
pro          → 200 productos, S/ 19.90/mes
ilimitado    → ∞ productos,   S/ 34.90/mes
```

### Ciclo de vida de una suscripción

```
[registro con invite]
        ↓
  status: "trial"  (plan semilla sin expiración)
  o
  status: "active" (plan pagado con plan_expires_at calculado)
        ↓
  [plan_expires_at llega]
        ↓
  status: "expired"
        ↓ (3 días de gracia = GRACE_DAYS)
  getEffectivePlan() devuelve "semilla"
  → Productos excedentes ocultos del catálogo público
  → Modelo de diseño: se mantiene 15 días más (MODEL_GRACE_DAYS)
        ↓ (día 16 desde vencimiento)
  getEffectiveModel() devuelve "minimalista" (SEMILLA_MODEL)
  → Modelo degradado automáticamente
```

### Helpers de negocio (`src/lib/types.ts`)

| Función | Retorna | Descripción |
|---|---|---|
| `daysSinceExpiry(store)` | `number \| null` | Días desde que venció el plan |
| `daysUntilExpiry(store)` | `number \| null` | Días restantes hasta vencimiento |
| `getEffectivePlan(store)` | `PlanId` | Plan real aplicado (considera gracia de 3 días) |
| `getEffectiveProductLimit(store)` | `number` | Límite de productos del plan efectivo |
| `isSubscriptionExpired(store)` | `boolean` | Si venció (sin considerar gracia) |
| `modelGraceDaysLeft(store)` | `number \| null` | Días restantes del período de gracia del modelo (15 días) |
| `shouldUseSemillaModel(store)` | `boolean` | Si ya pasaron los 15 días y el modelo debe degradarse |
| `getEffectiveModel(store)` | `string` | Modelo CSS que debe usarse actualmente |
| `isPlanActive(store)` | `boolean` | Si el plan está activo y vigente (sin gracia) |
| `formatDate(iso)` | `string` | Formatea fecha ISO a "13 may. 2026" |
| `getBioLinksLimit(store)` | `number` | Límite de links del Bio-Link (5 en semilla, ∞ en planes pagados) ← NUEVO |
| `canUsePremiumBioFeatures(store)` | `boolean` | Si puede usar fondos e imágenes en Bio-Link (falso en semilla) ← NUEVO |

---

## 6. Sistema de Invites (Registro)

### Flujo completo
1. Superadmin crea un invite en `/super/tiendas` → `InviteGenerator.tsx`
2. El invite tiene: `plan`, `duration_months`, `notes`, `expires_at` (auto: 30 días)
3. Se genera el link: `https://dizi.idenza.site/register?invite=TOKEN`
4. El cliente accede, el sistema valida el token contra Supabase
5. Al completar el registro → `markInviteUsed(token, storeId)`:
   - Marca el invite como `used: true`
   - Llama a RPC `activate_subscription` si el plan no es semilla
   - La tienda nace con `subscriptionStatus: "active"` y `planExpiresAt` calculado
6. El cliente es redirigido a `/admin`

### Archivos implicados
- `src/components/InviteGenerator.tsx` — UI de creación de invites
- `src/routes/register.tsx` — Página de registro con validación del token
- `src/lib/store.ts` → `addInvite()`, `markInviteUsed()`

---

## 7. Sistema de Suscripciones (Superadmin)

Accesible desde `/super/tiendas` → expandir fila de tienda → `SubscriptionManager`.

### Acciones disponibles
| Acción | Función en store | Descripción |
|---|---|---|
| Cambiar plan | `setPlan(storeId, plan, months)` | Cambia plan y reinicia período |
| Renovar/Extender | `extendSubscription(storeId, months)` | Suma meses al vencimiento actual |
| Cancelar | `cancelSubscription(storeId, reason?)` | Degrada a semilla, guarda motivo |

### Semáforo de vencimiento en tabla (`super.tiendas.tsx`)
- 🟢 Verde: > 7 días
- 🟡 Amarillo: ≤ 7 días
- 🔴 Rojo: vencido
- ⚪ Gris: plan semilla (sin vencimiento)

---

## 8. Modelos de Diseño

### Estructura de un modelo (`admin.diseno.tsx`)
Cada modelo tiene:
- `id` — identificador único
- `layout` — tipo de layout visual
- `planLevel` — 0=semilla, 1=emprendedor, 2=pro, 3=ilimitado
- `bg`, `cardBg`, `primaryColor`, `textColor`, `accentColor`, `borderRadius`
- `isDark` — si es tema oscuro
- `bgLocked` — si el fondo no se puede personalizar

### Layouts disponibles y proporciones de imagen recomendadas

| Layout | Proporción | Pixeles sugeridos | Modelos que lo usan |
|---|---|---|---|
| `grid` | 1:1 cuadrada | 1000×1000 | minimalista, clasico, nature_mint, forest_deep, elite |
| `overlay` | 3:4 vertical | 900×1200 | vibrante, nocturno, sunset_glow |
| `hero` | 1:1 cuadrada | 1000×1000 | eco |
| `editorial` | 4:3 horizontal | 1200×900 | corporativo, luxury, boutique |
| `magazine` | 21:9 panorámica | 2100×900 | dark_fashion |
| `tiles` | 2:3 vertical | 800×1200 | aurora |
| `spotlight` | 3:4 vertical | 900×1200 | boutique |
| `diagonal` | 1:1 cuadrada | 1000×1000 | slash |
| `arch` | 1:1 cuadrada | 1000×1000 | arch_studio |
| `banner_grid` | 16:7 panorámica | 1600×700 | portada |

### Modelos por plan

**Semilla (gratis):** minimalista, clasico
**Emprendedor:** nature_mint, vibrante, eco
**Pro:** nocturno, elite, boutique, corporativo, aurora
**Ilimitado:** luxury, dark_fashion, slash, arch_studio, portada, sunset_glow, forest_deep

### Panel de imagen de portada (banner)
Solo visible cuando el modelo seleccionado es `"elite"` o `"portada"`.
Guarda `bannerImage` (WebP) y `bannerTitle` en la tabla `stores`.
Dimensiones recomendadas: **1920 × 700 px mínimo, ratio 16:7**.

---

## 9. Catálogo Público (`/t/:slug` → `PublicCatalog.tsx`)

### Comportamiento según estado de suscripción

| Estado | Productos visibles | Modelo de diseño | Banners |
|---|---|---|---|
| Plan activo | Todos los visibles | El seleccionado | Ninguno |
| Expirado < 3 días (gracia) | Todos | El seleccionado | Aviso de renovación (solo dueño) |
| Expirado 3–15 días | Solo los primeros 7 | El seleccionado | Aviso modelo cambiará (solo dueño) |
| Expirado > 15 días | Solo los primeros 7 | Minimalista (degradado) | Aviso modelo degradado (solo dueño) |

### Filtros disponibles
- Búsqueda por texto (nombre del producto)
- Filtro por categoría (tabs)
- Slider de precio máximo (si `priceFilterEnabled: true` en configuración)

### Carrito de compras
- Estado persistido por tienda en `localStorage` (Zustand persist)
- Se acumula entre sesiones
- Checkout vía WhatsApp: construye el mensaje con los productos y abre `wa.me/...`

---

## 10. Bio-Link (`/bio/:slug` y `/admin/link-bio`) ← NUEVO MÓDULO

El Bio-Link es una página pública tipo "link in bio" asociada a cada tienda. Es independiente del catálogo.

### URL pública
`https://dizi.idenza.site/bio/[slug]`

### Qué muestra al público
- Logo y banner propios del Bio-Link (distintos al logo del catálogo)
- Nombre del negocio y descripción personalizada
- Botones de links rápidos (`QuickLink[]`) con colores configurables por botón
- Mapa interactivo con la ubicación del negocio (Leaflet)
- Botón "Ver Catálogo" que enlaza a `/t/[slug]`

### Editor del Bio-Link (`/admin/link-bio`)
El dueño puede configurar:
- **Logo del Bio** — imagen circular, spec 400×400 px, guardada en Supabase Storage
- **Banner del Bio** — imagen de fondo superior, guardada en Supabase Storage
- **Descripción** — texto libre debajo del nombre
- **Links rápidos** — hasta 5 en plan semilla, ilimitados en planes pagados
  - Cada link tiene: label, URL, bgColor, textColor
- **Ubicación** — mapa Leaflet donde el dueño pincha para seleccionar coordenadas; se guarda `locationLat`, `locationLng`, `locationAddress`
- **Tema visual** — selección de tema de color del Bio-Link
- **Estilo de botones** — pill-solid, rounded-full, etc.
- **Color de botones** — color global de fondo y texto (sobreescribible por link)
- **Imagen de fondo** — solo en planes pagados (`canUsePremiumBioFeatures`)
- **Color de fondo** — color sólido del fondo

### Restricciones por plan
| Característica | Semilla | Emprendedor+ |
|---|---|---|
| Links rápidos | Máx 5 | Ilimitados |
| Imagen de fondo | ❌ | ✅ |
| Color de fondo personalizado | ❌ | ✅ |
| Banner del Bio | ❌ | ✅ |

### Columnas en `stores` usadas por Bio-Link
`bio_description`, `bio_links_enabled`, `bio_logo`, `bio_banner`, `bio_theme`, `bio_button_style`, `bio_button_color`, `bio_button_text_color`, `bio_bg_image`, `bio_bg_color`, `location_lat`, `location_lng`, `location_address`, `quick_links`

### Almacenamiento de imágenes del Bio
A diferencia del catálogo (que guarda imágenes como Data URL en la columna DB), el Bio-Link sube las imágenes a **Supabase Storage**:
- `[storeId]/bio_logo.webp`
- `[storeId]/bio_banner.webp`
- `[storeId]/bio_bg.webp`

El `store.ts` detecta si el campo es `data:` base64 y lo sube automáticamente en `updateStore()`.

### Tipo `QuickLink` (`src/lib/types.ts`)
```ts
interface QuickLink {
  label: string;
  url: string;
  bgColor?: string;
  textColor?: string;
}
```

---

## 11. Libro de Reclamaciones (`/admin/reclamaciones` y catálogo público) ← NUEVO MÓDULO

Sistema de reclamaciones conforme a normativa peruana. Los consumidores presentan quejas/reclamos directamente desde el catálogo público de la tienda.

### Flujo completo
```
1. Dueño activa el Libro en /admin/configuracion
   → libroReclamacionesActivo = true
   → Configura RUC, razón social y dirección de empresa

2. Consumidor abre el catálogo público /t/[slug]
   → Ve el botón "Libro de Reclamaciones" (si activo)
   → Completa el formulario de 4 secciones (ver campos en tabla `reclamaciones`)

3. Al enviar, se llama RPC insert_reclamacion()
   → Número correlativo generado atómicamente (advisory lock por tenant)
   → Los datos de empresa se copian automáticamente desde `stores`
   → El consumidor recibe el número de su reclamación

4. Dueño gestiona desde /admin/reclamaciones
   → Ve listado de reclamaciones con estado (pendiente / en revisión / resuelto)
   → Puede cambiar estado y agregar respuesta
   → La respuesta queda registrada con fecha
```

### RPC `insert_reclamacion`
Función PostgreSQL con `SECURITY DEFINER` y `pg_advisory_xact_lock` para garantizar que el `numero_correlativo` sea único por tienda sin condiciones de carrera.

Retorna: `id`, `numero_correlativo`, `fecha`, `empresa_nombre`, `empresa_ruc`, `empresa_direccion`, `empresa_url`

### Políticas RLS de `reclamaciones`
- `anon_insert_reclamaciones` — cualquier visitante puede insertar (para el formulario público)
- `autenticados_select_reclamaciones` — solo usuarios autenticados pueden leer
- `autenticados_update_reclamaciones` — solo usuarios autenticados pueden actualizar (cambiar estado/respuesta)

### Archivo de migración
`supabase_libro_reclamaciones.sql` en la raíz del proyecto.

---

## 12. Gestión de Productos (`admin.productos.tsx`)

### Campos de un producto
- Nombre (requerido)
- Precio (requerido, > 0)
- Categoría (requerida)
- Imagen (opcional, guiada por proporción del modelo activo)
- Descripción (opcional)
- En oferta: activa precio original + precio oferta
- Visible: switch para mostrar/ocultar en catálogo

### Creación de categoría inline
Dentro del modal de producto, el selector de categoría tiene un botón `+` que abre un input inline para crear una categoría nueva sin salir del formulario. Al confirmar, la categoría se crea en Supabase y se selecciona automáticamente.

### Lógica de productos de ejemplo (`isSample`)
- Toda tienda nueva nace con productos de ejemplo (`isSample: true`)
- Al crear el primer producto real, todos los de ejemplo se eliminan automáticamente de la vista local
- Los productos de ejemplo no cuentan para el límite del plan

### Límite por plan
- `reachedLimit` = cantidad de productos reales (`!isSample`) >= límite efectivo del plan
- Si se alcanza el límite, el botón "Nuevo Producto" se deshabilita con candado
- Si la suscripción venció: los productos que excedan el límite de semilla (7) se ocultan del catálogo público pero NO se eliminan

---

## 13. Subida de Imágenes

### Flujo técnico — Catálogo (productos, logo, banner)
1. El usuario selecciona o arrastra una imagen (máx 10 MB)
2. `convertImageToWebP()` en `image-utils.ts` la convierte a WebP en el cliente usando Canvas API
3. Se guarda como Data URL directamente en la columna de la tabla en Supabase (no en Storage)

### Flujo técnico — Bio-Link (logo, banner, fondo)
1. El usuario selecciona la imagen
2. Se convierte a WebP en el cliente
3. `updateStore()` en `store.ts` detecta el prefijo `data:` y llama a `uploadBase64ToStorage()`
4. Se sube a Supabase Storage bajo la clave `[storeId]/bio_logo.webp` (o `bio_banner.webp` / `bio_bg.webp`)
5. En la columna de la DB se guarda la URL pública del Storage (no el base64)

### Componente `ImageUploadGuided` (`admin/ImageUploadGuided.tsx`)
- Muestra el área de carga con la proporción exacta del modelo activo (CSS `paddingBottom` trick)
- Detecta automáticamente si la imagen subida no coincide con la proporción recomendada
- Estados: `ok` (verde ✓) / `warning` (ámbar ⚠ con mensaje específico)
- Badge siempre visible con la proporción recomendada
- Link a squoosh.app para redimensionar

### Guía en pantalla de diseño
Cada tarjeta de modelo en `/admin/diseno` muestra un badge inferior con la proporción recomendada para sus productos.

### Guía del banner
En el panel de imagen de portada (`/admin/diseno`, visible para modelos `elite` y `portada`) se muestra:
- Proporción: Panorámica 16:7
- Mínimo: 1920 × 700 px

### Guía del logo
En `/admin/configuracion`, el logo muestra:
- Forma: circular en el catálogo
- Proporción: cuadrada 1:1, 500 × 500 px mínimo

---

## 14. Configuración del Negocio (`admin.configuracion.tsx`)

| Campo | Descripción |
|---|---|
| Nombre comercial | Aparece en el header del catálogo y mensajes de WhatsApp |
| WhatsApp | Código de país + número. Abre `wa.me/` al hacer checkout |
| Link del catálogo | Slug único. Disponibilidad verificada en tiempo real contra Supabase |
| Logo | Imagen circular en el header. Se guarda como WebP en base de datos |
| Filtro de precios | Toggle para activar slider de precio en el catálogo público |
| Libro de Reclamaciones | Toggle para activar/desactivar. Requiere RUC, razón social y dirección ← NUEVO |
| RUC / Razón Social / Dirección | Datos legales para el encabezado de cada reclamación ← NUEVO |

---

## 15. Estado Global Zustand (`src/lib/store.ts`)

### `useApp` — store principal

| Acción | Descripción |
|---|---|
| `fetchData()` | Carga todas las tiendas (con categorías y productos) desde Supabase |
| `setCurrentStore(id)` | Cambia la tienda activa en el panel admin |
| `updateStore(id, patch)` | Actualiza campos de la tienda en Supabase + estado local. Sube imágenes del Bio a Storage automáticamente |
| `addStore(store)` | Agrega una tienda nueva al estado local (post-registro) |
| `addInvite(invite)` | Crea un invite en Supabase |
| `markInviteUsed(token, storeId?)` | Marca invite como usado y activa la suscripción |
| `cancelSubscription(storeId, reason?)` | Cancela suscripción vía RPC |
| `extendSubscription(storeId, months)` | Extiende vencimiento sumando meses |
| `setPlan(storeId, plan, months?)` | Cambia el plan (semilla o pagado con RPC) |
| `upsertProduct(storeId, product)` | Crea o edita producto en Supabase |
| `deleteProduct(storeId, productId)` | Elimina producto de Supabase |
| `toggleProductVisible(storeId, productId)` | Alterna visibilidad del producto |
| `upsertCategory(storeId, cat)` | Crea o edita categoría en Supabase |
| `deleteCategory(storeId, catId)` | Elimina categoría de Supabase |
| `toggleStoreActive(storeId)` | Activa/desactiva tienda (superadmin) |
| `startImpersonation(storeId)` | Modo soporte: superadmin accede como cliente |
| `stopImpersonation()` | Sale del modo soporte |
| `incWhatsappClicks(storeId)` | Incrementa contador de clics de WhatsApp |

### `useCart` — carrito de compras
Persistido en `localStorage` bajo la clave `dizi-carts-v1`.

| Acción | Descripción |
|---|---|
| `add(storeId, productId)` | Agrega 1 unidad al carrito |
| `setQty(storeId, productId, qty)` | Ajusta cantidad (0 = elimina) |
| `remove(storeId, productId)` | Elimina producto del carrito |
| `clear(storeId)` | Vacía el carrito de la tienda |

### Persistencia
- Clave localStorage: `dizi-catalogos-v1`
- Persiste: `stores`, `currentStoreId`, `impersonatedBy`

---

## 16. Panel Superadmin (`/super`)

### Acceso
- Login independiente en `/super/login` (contraseña hardcodeada en `super.login.tsx`)
- Layout propio sin relación con el panel cliente

### Funcionalidades

**Dashboard (`/super/dashboard`)**
- Métricas globales: total de tiendas, tiendas activas, clics de WhatsApp

**Tiendas (`/super/tiendas`)**
- Tabla de todas las tiendas ordenadas por urgencia de vencimiento
- Alerta si alguna tienda vence en ≤ 7 días
- Columna "Vencimiento" con semáforo de colores
- Acciones por tienda: activar/desactivar, modo soporte (impersonación)
- Panel expandible por tienda: `SubscriptionManager` con todas las acciones de suscripción
- `InviteGenerator`: crear invite links con plan, duración y notas

---

## 17. Reglas Importantes — NO romper

### Truncación de archivos
El `Edit` tool puede truncar archivos grandes con caracteres especiales. Siempre verificar con:
```bash
python3 -c "
with open('archivo.tsx','rb') as f: c=f.read()
print('Size:', len(c))
print('Last 80:', repr(c[-80:]))
"
```
Si está truncado, restaurar usando Python3 con `rfind()` del marcador de truncación.

### Tipos TypeScript críticos
- `ModelDef.layout` en `admin.diseno.tsx` **debe incluir `"banner_grid"`** — sin este tipo, el modelo "Portada con Banner" falla silenciosamente.
- `ModelConfig.layout` en `PublicCatalog.tsx` también debe incluir `"banner_grid"`.

### Lógica de gracia — no cambiar sin actualizar todos los consumidores
Las constantes `GRACE_DAYS = 3` y `MODEL_GRACE_DAYS = 15` en `types.ts` son usadas por:
- `getEffectivePlan()` → `admin.productos.tsx`, `PublicCatalog.tsx`
- `getEffectiveModel()` → `PublicCatalog.tsx`
- `modelGraceDaysLeft()` → `PublicCatalog.tsx`

### Productos de ejemplo
La limpieza de samples (`isSample`) ocurre en `upsertProduct()` en `store.ts`. Si se toca esa lógica, verificar que los samples desaparezcan al crear el primer producto real.

### Catálogo público — visible sin autenticación
La ruta `/t/:slug` no tiene guard de autenticación. Es pública. El modo soporte (banner "Viendo como...") se detecta por `impersonatedBy !== null` en el store.

### Bio-Link público — visible sin autenticación
La ruta `/bio/:slug` tampoco tiene guard. Es pública. Usa RPC `get_public_store` (no el store de Zustand).

### Panel de banner en diseño
El panel para subir imagen de portada **solo debe mostrarse** cuando `selectedModel === "elite" || selectedModel === "portada"`. Agregar otros modelos que usen banner requiere actualizar esta condición en `admin.diseno.tsx`.

### Libro de Reclamaciones — RPC atómico
El número correlativo se genera con `pg_advisory_xact_lock(hashtext(p_tenant_id))`. No intentar generarlo en el frontend ni con `MAX() + 1` sin el lock — generará duplicados bajo carga concurrente.

### Imágenes del Bio — Storage vs Data URL
- Productos, logo del catálogo, banner del catálogo → **Data URL en columna DB**
- Bio logo, bio banner, bio bg → **URL de Supabase Storage**

No mezclar estos enfoques. El `updateStore()` en `store.ts` maneja ambos casos automáticamente detectando el prefijo `data:`.

---

## 18. Flujo Completo: Nuevo Cliente

```
1. Superadmin crea invite en /super/tiendas
   → plan: emprendedor, duration: 3 meses
   → Link: https://dizi.idenza.site/register?invite=abc123

2. Cliente abre el link
   → register.tsx valida el token en Supabase
   → Cliente completa: nombre del negocio, teléfono, email, contraseña
   → Se llama initialize_store() RPC → crea tienda con samples
   → Se llama markInviteUsed() → activa suscripción por 3 meses
   → Redirect a /admin

3. Cliente en /admin
   → Ve sus productos de ejemplo
   → Va a /admin/diseno → elige modelo
   → Va a /admin/configuracion → configura nombre, WhatsApp, logo, slug
   → Va a /admin/productos → crea sus productos (se borran los samples)
   → Va a /admin/categorias → gestiona categorías
   → Va a /admin/link-bio → configura su Bio-Link (links, mapa, diseño)
   → Va a /admin/configuracion → activa Libro de Reclamaciones (opcional)

4. URLs públicas disponibles:
   Catálogo:          https://dizi.idenza.site/t/[slug]
   Bio-Link:          https://dizi.idenza.site/bio/[slug]
   Reclamaciones:     botón en el catálogo público (si activo)
```

---

*Fin del documento. Mantener actualizado ante cambios estructurales.*
