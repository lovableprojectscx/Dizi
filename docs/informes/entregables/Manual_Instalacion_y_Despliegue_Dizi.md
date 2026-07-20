# Anexo E: Manual de Usuario y Manual Técnico de Instalación y Despliegue — DIZI

Este documento constituye el **Manual Técnico de Instalación** y el **Manual de Usuario** del sistema **Dizi**, sirviendo como guía definitiva para administradores de sistemas, desarrolladores y usuarios finales.

---

# PARTE I: MANUAL TÉCNICO DE INSTALACIÓN Y DESPLIEGUE

Este manual detalla los pasos para configurar, levantar de forma local y desplegar en producción el sistema Dizi.

## 1. Prerrequisitos del Sistema

Antes de comenzar la instalación, asegúrate de tener instalados los siguientes componentes en tu máquina de desarrollo:

- **Node.js:** Versión v20.19.0 o superior (recomendado v22).
- **Bun:** (Opcional, pero recomendado por velocidad de ejecución) versión v1.3.10 o superior.
- **Supabase CLI:** Para la base de datos local y gestión de migraciones.
- **Git:** Para clonar y gestionar versiones del repositorio.

---

## 2. Configuración y Ejecución Local

### Paso 1: Clonar el Repositorio

Abre tu terminal y clona el código fuente oficial del proyecto:

```bash
git clone https://github.com/lovableprojectscx/Dizi.git
cd catalog-connect-main
```

### Paso 2: Instalar Dependencias

Instala los paquetes necesarios definidos en el `package.json` utilizando npm o bun:

```bash
npm install
# O si prefieres usar bun:
bun install
```

### Paso 3: Configurar las Variables de Entorno

Crea un archivo llamado `.env` en la raíz del proyecto y define las claves de conexión de Supabase:

```env
VITE_SUPABASE_URL=https://tu-proyecto-supabase.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-publica
```

_(Nota: Para desarrollo local con Supabase CLI, estas variables se imprimen en consola al iniciar el servicio)._

### Paso 4: Inicializar la Base de Datos Local

Asegúrate de tener Docker corriendo en tu sistema y ejecuta:

```bash
# Iniciar la instancia local de Supabase
supabase start
```

Este comando levantará los contenedores de Postgres, Auth, Storage y API REST locales, y aplicará automáticamente las **32 migraciones** presentes en la carpeta `supabase/migrations/`.

### Paso 5: Ejecutar el Servidor de Desarrollo

Inicia el entorno local de desarrollo con Vite:

```bash
npm run dev
# O con bun:
bun run dev
```

La aplicación estará disponible de forma local en: `http://localhost:5173`.

---

## 3. Ejecución de la Suite de Pruebas

Para garantizar que el sistema funciona correctamente tras la instalación, ejecuta las suites de pruebas automatizadas:

### Pruebas Unitarias y de Integración (Vitest)

```bash
# Ejecutar todas las pruebas una sola vez
npm run test

# Ejecutar en modo escucha (watch mode) ante cambios
npm run test:watch
```

### Pruebas de Interfaz de Usuario / Sistema (Playwright)

Asegúrate de que el servidor de desarrollo esté corriendo en local y ejecuta:

```bash
# Instalar los navegadores de Playwright la primera vez
npx playwright install

# Ejecutar las pruebas E2E
npx playwright test
```

---

## 4. Despliegue en Producción

### Frontend (Vercel)

La aplicación está configurada para integrarse y desplegarse automáticamente en Vercel.

1. Conecta tu repositorio de GitHub a tu cuenta de Vercel.
2. Configura las variables de entorno en el panel de configuración de Vercel (`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`).
3. El archivo `vercel.json` de la raíz del proyecto aplicará automáticamente las reglas de redirección (Rewrites) necesarias para el SEO dinámico de las rutas `/t/:slug` y `/bio/:slug`.

### Backend (Supabase Cloud)

Si deseas pasar de local a la nube de Supabase:

1. Crea un nuevo proyecto en Supabase Cloud.
2. Ejecuta el comando de envío de base de datos desde tu consola local:
   ```bash
   supabase db push
   ```
3. Esto aplicará de forma secuencial y limpia el esquema y las funciones del Libro de Reclamaciones e invitaciones en la base de datos cloud.

---

---

# PARTE II: MANUAL DE USUARIO (OPERACIÓN DEL SISTEMA)

Esta sección explica el flujo operativo de Dizi desde las perspectivas del Comerciante y del Consumidor Final.

## 1. Flujo de Registro y Creación de Tienda

Para crear una tienda en Dizi, el sistema requiere un token de invitación para controlar el uso del SaaS:

1. El usuario debe ingresar a la URL de registro provista de su token: `/register?token=TOKEN_VALIO`.
2. Completa los campos: **Nombre de Tienda**, **Slug** (identificador de URL), **Correo Electrónico** y **Contraseña**.
3. Haz clic en "Crear Tienda". Al procesar el token, la tienda se creará bajo el plan asignado a la invitación (ej: Plan Pro o Semilla).

---

## 2. Panel de Administración del Comerciante (`/admin`)

Una vez registrado, el comerciante accede al panel donde tiene las siguientes opciones:

- **Dashboard:** Muestra las estadísticas en tiempo real de visitas al catálogo público, visitas al Bio-Link y la cantidad de productos activos.
- **Productos:** Permite añadir nuevos artículos, subir su fotografía, definir la descripción, categoría y precio.
  - _Límites:_ Si estás en el plan Semilla gratuito, la plataforma te limitará a un máximo de 20 productos activos simultáneamente.
- **Diseño del Catálogo:** Permite cambiar la tipografía de la tienda y la paleta de colores de marca. Los usuarios con planes activos pueden seleccionar temas Premium adaptados a su rubro (como el tema "Bite" para restaurantes o "Bloom" para florerías).
- **Configuración del Negocio:** Permite actualizar el logotipo, banner de portada, dirección física y, fundamentalmente, el **número de WhatsApp** del comercio donde se recibirán los pedidos.
- **Libro de Reclamaciones:** Panel de auditoría de las quejas o reclamos interpuestos por clientes de forma pública. Desde aquí se escribe y firma la respuesta formal de la empresa.

---

## 3. Experiencia del Cliente / Consumidor Final

### Compra en el Catálogo Público (`/t/:slug`)

1. El cliente entra al enlace de la tienda (ej: `dizi.pe/t/pasteleria-diana`).
2. Navega por las categorías y agrega los productos deseados al carrito mediante el botón **"Añadir"**.
3. Al terminar, abre el carrito, completa sus datos (Nombre, Teléfono, Tipo de Entrega: Delivery o Recojo, Dirección y Notas).
4. Hace clic en **"Enviar Pedido por WhatsApp"**. El sistema le redireccionará automáticamente a la aplicación de WhatsApp del comerciante con el mensaje pre-escrito y detallado con su pedido.

### Registro de Reclamos

1. En el pie de página del catálogo público, el cliente hace clic en **"Libro de Reclamaciones"**.
2. Completa el formulario estructurado paso a paso:
   - **Paso 1:** Datos Personales del consumidor (Nombre, DNI, Domicilio, Email).
   - **Paso 2:** Detalles del Bien Contratado (Producto o Servicio) y descripción del Reclamo (insatisfacción con el producto) o Queja (malestar por la atención).
3. Envía el formulario. El sistema le generará inmediatamente un ticket digital de reclamo con su número correlativo único e inalterable (ej. `N° 0001-2026`) conforme a la ley peruana.
