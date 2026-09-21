# Guía de Desarrollo de Dizi (DIZI SaaS Platform)

Esta guía documenta la configuración del entorno local, arquitectura del código, convenciones de desarrollo, variables de entorno, esquema de persistencia en Supabase y los flujos de compilación y despliegue en producción.

---

## 1. Requisitos Previos del Sistema

- **Node.js**: Versión `18.x` o `20.x` (LTS recomendada).
- **Gestor de Paquetes**: `npm` (v9+) o `pnpm`.
- **Git**: Sistema de control de versiones.
- **Proyecto Supabase**: Base de datos PostgreSQL con extensiones de autenticación y buckets de Storage configurados.

---

## 2. Variables de Entorno

Crea un archivo `.env` o `.env.local` en la raíz del proyecto basándote en las siguientes variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
VITE_SUPABASE_ANON_KEY="tu-anon-key-publica"

# Opcional: Entornos de administración o scripts backend
SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key-privada"
```

> [!IMPORTANT]
> Nunca expongas `SUPABASE_SERVICE_ROLE_KEY` en el bundle del cliente. Solo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` son accesibles en el navegador gracias al prefijo `VITE_`.

---

## 3. Instalación y Ejecución Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/lovableprojectscx/Dizi.git
   cd Dizi
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible localmente en `http://localhost:3000` (o el puerto asignado por Vite).

4. **Verificación de tipos TypeScript:**
   ```bash
   npx tsc --noEmit
   ```

5. **Ejecución de pruebas unitarias:**
   ```bash
   npm test
   ```

---

## 4. Estructura del Proyecto

```
catalog-connect-main/
├── docs/                       # Documentación técnica y funcional modular
│   ├── ARCHITECTURE.md         # Arquitectura global y flujo de datos
│   ├── DEVELOPMENT_GUIDE.md    # Esta guía para desarrolladores
│   └── modules/
│       ├── public-catalog.md   # Módulo del catálogo y link-bio público
│       ├── admin-panel.md      # Módulo del panel de administración
│       └── super-admin.md      # Módulo de control Super Administrador
├── public/                     # Archivos estáticos y Service Worker (sw.js)
├── src/
│   ├── components/             # Componentes de React desacoplados por dominio
│   │   ├── admin/              # Componentes de administración (Sidebar, Wizard, etc.)
│   │   ├── public/             # Componentes del catálogo público (PDF, Modal Zoom, etc.)
│   │   └── ui/                 # Componentes de diseño atómicos (Radix UI / Tailwind)
│   ├── hooks/                  # React Hooks personalizados (use-mobile.tsx, etc.)
│   ├── lib/                    # Núcleo de lógica y servicios de infraestructura
│   │   ├── auth.ts             # Lógica de autenticación Supabase y control RBAC
│   │   ├── design-catalog.ts   # Modelos y paletas predefinidas de diseño
│   │   ├── image-utils.ts      # Utilidades de compresión y recorte de imágenes
│   │   ├── store.ts            # Estado global reactivo con Zustand y sincronización
│   │   ├── supabase.ts         # Inicialización del cliente Supabase
│   │   ├── types.ts            # Definiciones de TypeScript canónicas
│   │   └── utils.ts            # Utilidades generales (cn, hexLuminance)
│   ├── routes/                 # Rutas basadas en archivos de TanStack Router
│   │   ├── __root.tsx          # Componente raíz de la jerarquía de rutas
│   │   ├── index.tsx           # Landing page institucional
│   │   ├── login.tsx           # Inicio de sesión de comercios
│   │   ├── register.tsx        # Registro y onboarding guiado
│   │   ├── t.$slug.tsx         # Catálogo público interactivo
│   │   ├── bio.$slug.tsx       # Link en Bio público
│   │   ├── admin.tsx           # Layout con navegación del comercio
│   │   ├── super.tsx           # Layout con navegación Super Administrador
│   │   └── ...                 # Subrutas administrativas
│   ├── main.tsx                # Entrada cliente y registro de Service Worker
│   ├── router.tsx              # Instanciador del router TanStack y QueryClient
│   └── server.ts               # Entrada servidor SSR (Nitro/H3)
└── vite.config.ts              # Configuración del bundler Vite y plugins
```

---

## 5. Arquitectura de Estado y Modelo de Datos

### 5.1. Estado Híbrido (Zustand + Supabase + LocalStorage)
- **Modo Tienda Pública (`/t/$slug`)**:
  - Aplica estrategia **Zero-Egress**. Antes de descargar el objeto completo de la tienda con todos sus productos, se realiza un micro-query a Supabase consultando el campo `updated_at`.
  - Si el timestamp coincide con la versión guardada en `localStorage`, la interfaz se hidrata instantáneamente sin consumir cuota de transferencia.
- **Modo Administración (`/admin/*`)**:
  - `useApp` centraliza las mutaciones de la tienda activa.
  - Al guardar cualquier cambio (productos, diseño, configuración), se persiste en Supabase y se invoca `invalidateStorePublicCache(store.slug)` para refrescar de inmediato las vistas públicas de los clientes.

### 5.2. Tablas Principales de Supabase

| Tabla | Propósito | Clave Foránea |
|---|---|---|
| `stores` | Registra comercios, slug, diseño, plan, coordenadas de delivery y enlaces. | `user_id` -> `auth.users.id` |
| `categories` | Categorías de catálogo organizadas por comercio. | `store_id` -> `stores.id` |
| `products` | Catálogo de ítems, precios, variantes, stock e imágenes. | `store_id` -> `stores.id`, `category_id` -> `categories.id` |
| `claims` | Registro legal de hojas de reclamaciones según normativa INDECOPI. | `store_id` -> `stores.id` |
| `invites` | Tokens promocionales canjeables generados por Super Admin. | `used_by` -> `stores.id` |
| `plan_promotions` | Descuentos y ofertas activas en suscripciones. | N/A |

### 5.3. Funciones Almacenadas (RPC)
- `increment_views(store_id uuid)`: Incrementa atómicamente el contador de visitas públicas.
- `increment_whatsapp_clicks(store_id uuid)`: Incrementa las intenciones de compra dirigidas a WhatsApp.
- `check_slug_available(p_slug text, p_store_id uuid)`: Verifica la disponibilidad única de un slug en tiempo real.

---

## 6. Compresión y Procesamiento de Imágenes

Para garantizar que el catálogo se abra en menos de un segundo en conexiones 3G/4G móviles peruanas y optimizar los costos de almacenamiento en Supabase Storage:
- Toda imagen subida por el usuario en `ImageUploadGuided.tsx` es procesada en el navegador antes de enviarse.
- Mediante un elemento `<canvas>` HTML5 off-screen se comprime y convierte a formato WebP o JPEG con una resolución máxima de 1200px y calidad del 85%.
- Si la imagen original pesa varios megabytes, se reduce a ~80-150 KB sin degradación visual perceptible.

---

## 7. Despliegue en Producción

### 7.1. Compilación
Ejecuta el script de construcción de Vite / TanStack Start:
```bash
npm run build
```
Esto genera los artefactos optimizados en la carpeta `.output/` o `dist/`.

### 7.2. Servidor de Producción (Node.js / Nitro)
El archivo `src/server.ts` gestiona la ejecución en el backend:
1. Valida el dominio entrante mediante redirección HTTP 301 forzada a `https://dizi.idenza.site` para peticiones de producción provenientes de hostnames no autorizados.
2. Atiende las rutas SSR e hidrata la aplicación cliente.
3. Cuenta con un interceptor de errores catastróficos (`normalizeCatastrophicSsrResponse`) que evita pantallas en blanco o JSONs de fallo no formateados en el navegador del cliente.

### 7.3. Service Worker y Políticas de Caché
El archivo `public/sw.js` almacena en caché las imágenes de Supabase Storage (`supabase.co/storage/v1/object/public/`) bajo una estrategia **Cache-First** con actualización en segundo plano, maximizando la fluidez de navegación en catálogos extensos.
