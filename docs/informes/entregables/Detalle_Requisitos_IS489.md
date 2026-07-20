# Especificación Detallada de Requisitos Funcionales (Format Given-When-Then)

Esta sección expande la tabla de requisitos funcionales del **Informe Final de Dizi**, proporcionando descripciones detalladas, actores y criterios de aceptación estructurados en formato **Given-When-Then (Gherkin)**. Esto asegura consistencia con el enfoque _spec-driven_ y la metodología Scrum descrita en el informe.

---

### **RF-01: Publicar catálogo público por slug**

- **Descripción:** El sistema debe permitir a cualquier visitante acceder a la tienda del comerciante a través de un identificador amigable o URL única (ejemplo: `dizi.idenza.site/t/mi-tienda`), renderizando dinámicamente los productos, las categorías y la configuración estética del comerciante sin requerir autenticación.
- **Actor:** Visitante Público / Cliente.
- **Precondición:** El comerciante ha configurado su catálogo y lo ha marcado como publicado (`is_published = true`).
- **Criterios de Aceptación:**
  - **Escenario 1 (Acceso exitoso al catálogo):**
    - **Dado** que un comerciante tiene una tienda registrada con el slug `"pasteleria-diana"` y está publicada.
    - **Cuando** un cliente accede a la URL `/t/pasteleria-diana`.
    - **Entonces** el sistema debe consultar a Supabase por el slug y mostrar los productos activos, sus respectivas categorías, el logo de la marca y la paleta de colores configurada.
  - **Escenario 2 (Acceso a catálogo despublicado):**
    - **Dado** que una tienda tiene configurado el estado de publicación como desactivo (`is_published = false`).
    - **Cuando** un visitante ingresa a su URL pública `/t/pasteleria-diana`.
    - **Entonces** el sistema debe redireccionar a una vista de error 404 o mostrar un mensaje indicando que el catálogo se encuentra temporalmente desactivo.

---

### **RF-02: Generación del enlace y mensaje de WhatsApp**

- **Descripción:** Permite procesar el carrito de compras del usuario y construir automáticamente una URL codificada (`wa.me`) con el desglose del pedido (productos, cantidades, total y notas de entrega), normalizando el teléfono del comercio.
- **Actor:** Visitante Público / Comprador.
- **Precondición:** El comprador tiene productos seleccionados en su carrito de compras.
- **Criterios de Aceptación:**
  - **Escenario 1 (Mensaje de pedido codificado):**
    - **Dado** que un comprador tiene en su carrito: 1x "Torta de Chocolate (S/ 45.00)" y 2x "Cupcake Red Velvet (S/ 12.00)".
    - **Cuando** llena sus datos personales (nombre: "Juan Pérez") y hace clic en "Pedir por WhatsApp".
    - **Entonces** el sistema debe construir la URL de WhatsApp codificando los caracteres especiales y espacios (ej: `Juan%20P%C3%A9rez`) para evitar enlaces rotos.
  - **Escenario 2 (Normalización del número telefónico):**
    - **Dado** que el comerciante configuró su teléfono con guiones y código de país (ej: `+51 988-777-666`).
    - **Cuando** el cliente envía su pedido.
    - **Entonces** el sistema debe limpiar la cadena eliminando símbolos y espacios, obteniendo exactamente `51988777666` para generar la URL `https://wa.me/51988777666`.

---

### **RF-03: Formateo de precios en Soles peruanos**

- **Descripción:** La plataforma debe formatear todos los precios de los productos mostrándolos con el prefijo `"S/"` y forzando dos decimales. En caso de que un producto no tenga un precio establecido, se debe mostrar la leyenda `"A consultar"`.
- **Actor:** Visitante Público / Administrador.
- **Criterios de Aceptación:**
  - **Escenario 1 (Precios con decimales):**
    - **Dado** que un producto tiene registrado el precio de `15.5` en la base de datos.
    - **Cuando** se visualiza la tarjeta del producto en el catálogo.
    - **Entonces** el precio debe formatearse exactamente como `"S/ 15.50"`.
  - **Escenario 2 (Producto sin precio definido):**
    - **Dado** que un producto tiene el precio en valor nulo (`null`), indefinido (`undefined`) o `0`.
    - **Cuando** se despliega en el catálogo público.
    - **Entonces** la tarjeta de producto debe mostrar la etiqueta `"A consultar"`.

---

### **RF-04: Registro por invitaciones válidas**

- **Descripción:** Para controlar el crecimiento orgánico y evitar abusos, la creación de nuevas tiendas debe estar restringida al uso de un token de invitación generado por el superadmin. Este token debe estar vigente, no haber sido usado previamente y estar asignado a un plan específico.
- **Actor:** Comerciante Nuevo.
- **Criterios de Aceptación:**
  - **Escenario 1 (Token válido):**
    - **Dado** que un usuario ingresa al registro `/register?token=TOKEN_PRO_ACTIVO` y el token es válido y no ha caducado.
    - **Cuando** el comerciante llena sus datos y confirma el registro.
    - **Entonces** el sistema debe dar de alta la tienda, asociar su cuenta al Plan Pro y marcar el token en base de datos como usado (`used = true`).
  - **Escenario 2 (Token vencido o usado):**
    - **Dado** que un usuario accede con `/register?token=TOKEN_EXPIRADO_O_USADO`.
    - **Cuando** se valida el token mediante la RPC `check_invite`.
    - **Entonces** el sistema debe bloquear el registro, ocultar el formulario y alertar al usuario con el mensaje `"Invitación inválida o expirada"`.

---

### **RF-05: Restricción de límites según el plan contratado**

- **Descripción:** Cada plan de Dizi tiene restricciones específicas sobre la cantidad máxima de productos que un comerciante puede tener visibles en su catálogo. El sistema debe bloquear la adición o activación de productos una vez alcanzado este umbral.
- **Actor:** Dueño de la Tienda (Administrador).
- **Criterios de Aceptación:**
  - **Escenario 1 (Superación de límite de productos):**
    - **Dado** que un comerciante se encuentra en el plan `"semilla"` (límite de 20 productos) y ya tiene 20 productos registrados y activos.
    - **Cuando** intenta agregar un producto número 21 o marcar un producto inactivo como activo.
    - **Entonces** el sistema debe denegar la operación en el formulario, mostrando una advertencia que le invite a adquirir un plan superior (Upgrade).

---

### **RF-06: Degradación automática y periodo de gracia**

- **Descripción:** Si la fecha de vencimiento de la suscripción de un comerciante expira, el sistema no debe cortar su servicio de inmediato. Se deben aplicar dos periodos de gracia diferenciados antes de aplicar degradaciones visuales o de límites.
- **Actor:** Sistema / Comerciante.
- **Criterios de Aceptación:**
  - **Escenario 1 (Periodo de gracia de funciones - 3 días):**
    - **Dado** que la suscripción de un comerciante en el plan Pro expiró hace 2 días (dentro del límite de `GRACE_DAYS = 3`).
    - **Cuando** el comerciante accede a su panel de administración o sus clientes entran al catálogo.
    - **Entonces** la tienda debe seguir funcionando con todas las características del plan Pro contratado.
  - **Escenario 2 (Expiración de gracia y degradación a Semilla):**
    - **Dado** que la suscripción expiró hace 4 días (superando el periodo de gracia).
    - **Cuando** el sistema evalúa el plan efectivo mediante `getEffectivePlan`.
    - **Entonces** el plan efectivo debe cambiar automáticamente a `"semilla"`, ocultando los productos sobrantes (manteniendo solo los primeros 20) y mostrando la etiqueta `"Modo Limitado"` en la tienda.
  - **Escenario 3 (Gracia de diseño visual - 15 días):**
    - **Dado** que el plan Pro expiró hace 10 días (superando los 3 días de funciones pero dentro del límite de `MODEL_GRACE_DAYS = 15`).
    - **Cuando** el cliente carga el catálogo público.
    - **Entonces** el catálogo debe seguir utilizando el modelo de diseño premium (ej. `"boutique"`) pero aplicando los límites de productos del plan semilla. A los 16 días, el diseño debe revertirse obligatoriamente al modelo `"minimalista"` de Semilla.

---

### **RF-07: Aislamiento de datos multi-tenant (RLS)**

- **Descripción:** Al ser un software SaaS multi-tienda, es crítico asegurar que ningún comerciante pueda acceder, modificar o eliminar la información (productos, configuraciones, reclamaciones) perteneciente a otro comercio.
- **Actor:** Sistema / Administrador.
- **Criterios de Aceptación:**
  - **Escenario 1 (Acceso no autorizado bloqueado por RLS):**
    - **Dado** que el comerciante A ha iniciado sesión con sus credenciales y tiene su propio `owner_id`.
    - **Cuando** el comerciante A intenta enviar una petición HTTP directa para leer los productos del comercio B (modificando parámetros en el navegador o consola).
    - **Entonces** las políticas de fila de PostgreSQL (Row Level Security) deben filtrar la consulta devolviendo 0 registros, garantizando el aislamiento absoluto de los datos.

---

### **RF-08: Prevención de escalación de privilegios**

- **Descripción:** La asignación de roles en la plataforma se gestiona en la tabla de usuarios de Supabase. El sistema debe evitar que un usuario manipule los metadatos públicos de su registro para autoasignarse el rol de superadministrador.
- **Actor:** Sistema / Atacante.
- **Criterios de Aceptación:**
  - **Escenario 1 (Degradación de rol en registro manipulado):**
    - **Dado** que un atacante intercepta la llamada de registro de usuario y envía el campo `role` con el valor `"super_admin"`.
    - **Cuando** la base de datos procesa el insert e inicia el disparador `trg_user_sync_role`.
    - **Entonces** el trigger debe sobrescribir forzosamente el rol asignándole `"store_owner"`, bloqueando el intento de acceso privilegiado al panel de control global.

---

### **RF-09: Gestión del Libro de Reclamaciones**

- **Descripción:** Cada tienda debe poder habilitar un Libro de Reclamaciones público e interactivo en su catálogo. Los consumidores deben poder registrar quejas o reclamos en un formulario paso a paso (Anexo I de INDECOPI) y obtener un ticket digital de confirmación. El comerciante debe poder visualizar y responder los reclamos en un plazo máximo de 15 días hábiles.
- **Actor:** Visitante Público / Propietario de Tienda.
- **Precondición:** El comerciante completó su configuración de RUC, Razón Social e inició la activación del libro en su panel.
- **Criterios de Aceptación:**
  - **Escenario 1 (Registro de reclamo exitoso):**
    - **Dado** que un cliente entra a una tienda con Libro de Reclamaciones activo.
    - **Cuando** hace clic en el enlace del pie de página, completa sus datos y describe su queja.
    - **Entonces** el sistema debe almacenar el reclamo, generar un correlativo único inalterable de establecimiento (ej. `N° 0001-2026`) y desplegar el ticket digital con opción a impresión.
  - **Escenario 2 (Auditoría del comerciante):**
    - **Dado** que un comerciante tiene reclamos pendientes en su panel de administración `/admin/reclamaciones`.
    - **Cuando** abre un caso, escribe la respuesta formal de la empresa y guarda.
    - **Entonces** el estado del caso debe actualizarse a `"resuelto"`, registrando automáticamente la fecha y hora de la respuesta.

---

### **RF-10: Configuración y personalización del Bio-Link**

- **Descripción:** Permite al comerciante crear una página de enlaces múltiples (Bio-Link) optimizada para redes sociales, con la posibilidad de añadir un mapa de ubicación, fondos y tipografías condicionados al nivel de su plan.
- **Actor:** Dueño de la Tienda.
- **Criterios de Aceptación:**
  - **Escenario 1 (Restricción de enlaces en plan gratuito):**
    - **Dado** que la tienda está en el plan Semilla (límite de 3 enlaces personalizados en Bio-Link).
    - **Cuando** el dueño intenta guardar un cuarto enlace rápido en su panel de edición.
    - **Entonces** el sistema debe bloquear el botón de guardar y mostrar una alerta solicitándole mejorar su plan para configurar enlaces ilimitados.
  - **Escenario 2 (Personalización en plan premium):**
    - **Dado** que la tienda tiene una suscripción premium activa (plan Pro).
    - **Cuando** el dueño selecciona una tipografía de estilo moderno, un color de fondo degradado personalizado y añade su mapa de ubicación geográfica (Leaflet).
    - **Entonces** el sistema debe guardar los datos y renderizar el Bio-Link público reflejando todas las características visuales elegidas.

---

# Especificación Detallada de Requisitos No Funcionales (ISO/IEC 25010)

Esta sección expande las características de calidad del producto de software **Dizi** según el estándar internacional de calidad **ISO/IEC 25010**, detallando las restricciones técnicas, métricas y criterios de aceptación arquitectónicos del sistema.

---

### **RNF-01: Seguridad (Confidencialidad, Integridad y Aislamiento)**

- **Subcaracterística ISO 25010:** Confidencialidad y Responsabilidad.
- **Descripción:** La plataforma debe garantizar el aislamiento completo de datos en un entorno multi-inquilino (multi-tenant). Además, debe mitigar riesgos de inyección de código y forzar el uso de canales cifrados de comunicación.
- **Criterios de Aceptación:**
  - **Aislamiento a nivel de fila (RLS):** Toda consulta a tablas críticas (`stores`, `products`, `reclamaciones`) debe estar filtrada en PostgreSQL mediante políticas RLS basadas en el `auth.uid()` del usuario autenticado. Ningún usuario puede invocar APIs REST que expongan datos de terceros.
  - **Transporte Seguro (HSTS):** El servidor de producción debe denegar conexiones no cifradas (HTTP) y forzar la redirección automática a HTTPS aplicando la cabecera HSTS (`Strict-Transport-Security`) con una directiva de duración mínima de 1 año (`max-age=31536000`).
  - **Políticas de Seguridad de Contenido (CSP):** Se debe inyectar la cabecera `Content-Security-Policy` para restringir la carga de scripts únicamente desde dominios autorizados (Supabase, Leaflet, Google Fonts), mitigando ataques de Cross-Site Scripting (XSS).

---

### **RNF-02: Rendimiento y Eficiencia Temporal**

- **Subcaracterística ISO 25010:** Comportamiento temporal y Utilización de recursos.
- **Descripción:** Dado que el catálogo digital es una herramienta de ventas directa, la velocidad de carga es crucial para la retención del cliente. Las vistas públicas deben estar optimizadas para redes móviles.
- **Criterios de Aceptación:**
  - **Tiempo de respuesta en 4G:** El catálogo público (`/t/:slug`) debe cargar completamente (Time to Interactive - TTI) en menos de **2.0 segundos** sobre una conexión de red móvil 4G estándar (simulado a 1.5 Mbps de descarga) con un retardo RTT promedio de 100ms.
  - **Optimización de imágenes en cliente:** El sistema no debe delegar el redimensionamiento de imágenes al servidor. El módulo de carga en el admin (`image-utils.ts`) debe convertir y comprimir localmente las imágenes a formato WebP (reduciendo las dimensiones proporcionales a un máximo de 2048px) antes de iniciar la petición de subida (Upload), ahorrando hasta un 80% de consumo de ancho de banda.
  - **Peso del Bundle:** El empaquetado del cliente (`npm run build`) debe realizar code-splitting y compresión gzip de manera que el bloque de código inicial JavaScript (index) transferido al navegador no supere los 600 kB.

---

### **RNF-03: Usabilidad y Compatibilidad (Enfoque Mobile-First)**

- **Subcaracterística ISO 25010:** Estética de la interfaz de usuario y Accesibilidad.
- **Descripción:** La interfaz del catálogo público debe estar optimizada para el consumo móvil inmediato, ya que la mayor parte de su tráfico proviene de enlaces compartidos en redes sociales (Instagram, TikTok) y chats de mensajería (WhatsApp).
- **Criterios de Aceptación:**
  - **Diseño Mobile-First Responsivo:** Todas las interfaces públicas deben adaptarse fluidamente a pantallas táctiles desde los **360px de ancho** hasta monitores de escritorio de alta resolución. No se permite desborde horizontal (scroll horizontal) en la visualización del catálogo.
  - **Objetivos táctiles ergonómicos:** Todos los elementos interactivos del móvil (botones de compra, pestañas de categorías, botones de redes sociales) deben tener un área mínima de contacto físico de **44 x 44 píxeles** (según las guías humanas de iOS/Android) para evitar errores de selección.
  - **Consistencia visual (Shadcn/ui):** Se debe utilizar la paleta de variables semánticas HSL y componentes unificados de Shadcn para asegurar que el cambio de temas estéticos no afecte la legibilidad del texto en modo oscuro o claro.

---

### **RNF-04: Mantenibilidad y Capacidad de Prueba**

- **Subcaracterística ISO 25010:** Modularidad, Analizabilidad y Capacidad de ser probado.
- **Descripción:** Para facilitar el crecimiento del software y la integración de nuevos desarrolladores al proyecto, la base de código debe ser autodocumentada, fuertemente tipada y extensible.
- **Criterios de Aceptación:**
  - **Tipado Estricto (TypeScript):** La compilación no debe permitir el uso de `any` en funciones críticas de negocio. Todo modelo de datos debe derivarse de la interfaz `Store` o `Product` extendida de la base de datos de Supabase.
  - **Compuerta de Calidad (Quality Gate):** El pipeline de integración continua (`ci.yml`) debe validar automáticamente mediante `eslint` que no existan advertencias de formateo (Prettier) y bloquear cualquier integración a la rama principal si la cobertura de las pruebas unitarias es menor al **80%** (validado por `scripts/check-coverage.js`).

---

### **RNF-05: Fiabilidad y Tolerancia a Fallos**

- **Subcaracterística ISO 25010:** Tolerancia a fallos y Capacidad de recuperación.
- **Descripción:** El sistema debe ser capaz de mitigar errores inesperados en tiempo de ejecución (fallos de conexión con Supabase, API de WhatsApp caída, imágenes rotas) y mantener el servicio operativo en la medida de lo posible (Degradación Graciosa).
- **Criterios de Aceptación:**
  - **Captura de excepciones global:** Los eventos globales de error (`error` y `unhandledrejection`) deben ser interceptados por el módulo `error-capture.ts` para ser almacenados en un buffer de memoria con un tiempo de vida (TTL) de 5 segundos, previniendo que la consola del navegador se sature de errores repetitivos.
  - **Página de contingencia amigable:** Si ocurre un error fatal que impida montar el árbol de React en el navegador, el sistema debe capturar el crash y desplegar la plantilla HTML estática de `error-page.ts`. Esta página debe mostrar un diseño estético con un botón intuitivo de recarga (`location.reload()`), evitando mostrar la pantalla en blanco al consumidor final.
