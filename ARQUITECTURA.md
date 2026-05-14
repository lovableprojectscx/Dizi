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
| Imágenes | Conversión a WebP en el cliente (`image-utils.ts`) |

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
│   └── whatsapp.ts       ← Construcción de URLs de WhatsApp y formatPrice
│
├── routes/
│   ├── index.tsx              ← Landing page pública (/)
│   ├── login.tsx              ← Login cliente (/login)
│   ├── register.tsx           ← Registro con invite token (/register)
│   ├── t.$slug.tsx            ← Catálogo público (/t/:slug)
│   ├── admin.tsx              ← Layout del panel admin (/admin)
│   ├── admin.dashboard.tsx    ← Dashboard con métricas
│   ├── admin.productos.tsx    ← Gestión de productos
│   ├── admin.categorias.tsx   ← Gestión de categorías
│   ├── admin.diseno.tsx       ← Selector de modelo visual y colores
│   ├── admin.configuracion.tsx← Datos del negocio (nombre, WhatsApp, logo, slug)
│   ├── admin.plan.tsx         ← Vista del plan actual y vencimiento
│   ├── super.tsx              ← Layout superadmin (/super)
│   ├── super.login.tsx        ← Login superadmin (/super/login)
│   ├── super.dashboard.tsx    ← Dashboard global de tiendas
│   └── super.tiendas.tsx      ← Gestión de todas las tiendas
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

---

## 6. Sistema de Invites (Registro)

### Flujo completo
1. Superadmin crea un invite en `/super/tiendas` → `InviteGenerator.tsx`
2. El invite tiene: `plan`, `duration_months`, `notes`, `expires_at` (auto: 30 días)
3. Se genera el link: `https://dizi.pe/register?invite=TOKEN`
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

## 9. Catálogo Público (`PublicCatalog.tsx`)

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

## 10. Gestión de Productos (`admin.productos.tsx`)

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

## 11. Subida de Imágenes

### Flujo técnico
1. El usuario selecciona o arrastra una imagen (máx 10 MB)
2. `convertImageToWebP()` en `image-utils.ts` la convierte a WebP en el cliente usando Canvas API
3. Se guarda como Data URL directamente en la columna de la tabla en Supabase (no en Storage)

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

## 12. Configuración del Negocio (`admin.configuracion.tsx`)

| Campo | Descripción |
|---|---|
| Nombre comercial | Aparece en el header del catálogo y mensajes de WhatsApp |
| WhatsApp | Código de país + número. Abre `wa.me/` al hacer checkout |
| Link del catálogo | Slug único. Disponibilidad verificada en tiempo real contra Supabase |
| Logo | Imagen circular en el header. Se guarda como WebP en base de datos |
| Filtro de precios | Toggle para activar slider de precio en el catálogo público |

---

## 13. Estado Global Zustand (`src/lib/store.ts`)

### `useApp` — store principal

| Acción | Descripción |
|---|---|
| `fetchData()` | Carga todas las tiendas (con categorías y productos) desde Supabase |
| `setCurrentStore(id)` | Cambia la tienda activa en el panel admin |
| `updateStore(id, patch)` | Actualiza campos de la tienda en Supabase + estado local |
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

## 14. Panel Superadmin (`/super`)

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

## 15. Reglas Importantes — NO romper

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

### Panel de banner en diseño
El panel para subir imagen de portada **solo debe mostrarse** cuando `selectedModel === "elite" || selectedModel === "portada"`. Agregar otros modelos que usen banner requiere actualizar esta condición en `admin.diseno.tsx`.

---

## 16. Flujo Completo: Nuevo Cliente

```
1. Superadmin crea invite en /super/tiendas
   → plan: emprendedor, duration: 3 meses
   → Link: https://dizi.pe/register?invite=abc123

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

4. Catálogo público disponible en:
   https://dizi.pe/t/[slug-elegido]
```

---

*Fin del documento. Mantener actualizado ante cambios estructurales.*
