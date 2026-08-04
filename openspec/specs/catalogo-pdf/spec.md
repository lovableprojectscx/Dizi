# Spec: Catálogo en PDF

## Propósito
Permitir a los clientes y administradores descargar el catálogo de productos completo en formato PDF con diseño profesional, respetando el tema visual seleccionado y optimizando la velocidad y seguridad de carga de las imágenes. Además, incluye interactividad avanzada mediante índice de categorías y botones de pedido a WhatsApp.

## Requisitos

### Requisito: Descarga con Diseños/Temas Premium
El sistema DEBE permitir descargar el catálogo en PDF aplicando uno de los 5 temas visuales disponibles: Elegante, Premium Dark, Cálido Rústico, Nórdico Orgánico o Moderno.

#### Escenario: Renderizado del Logo circular
- **Dado** que el tema seleccionado es "Cálido Rústico" o "Premium Dark"
- **Cuando** se inicia la generación del PDF
- **Entonces** el logo del comercio se recorta circularmente en el Canvas y se dibuja con bordes transparentes para evitar esquinas cuadradas toscas.

#### Escenario: Renderizado de tarjetas de producto con recorte
- **Dado** un producto con imagen rectangular u original
- **Cuando** se dibuja en el PDF según las dimensiones del tema (vertical/horizontal)
- **Entonces** la imagen se recorta proporcionalmente al centro (`object-fit: cover`) para evitar cualquier distorsión o estiramiento.

### Requisito: Descargas de Imágenes Seguras y Robustas (CORS y Sesión)
La descarga de recursos para el PDF DEBE ser robusta frente a restricciones de CORS de CDNs externas y debe admitir autenticación automática para buckets privados.

#### Escenario: Descarga de imágenes de Supabase como Soporte/Super-admin
- **Dado** que el súper-administrador está actuando como soporte de la tienda
- **Cuando** descarga el PDF del catálogo
- **Entonces** las peticiones de imágenes del bucket se realizan mediante el SDK de Supabase, adjuntando las cabeceras de autorización de la sesión activa de soporte.

#### Escenario: Descarga de imágenes externas (ej. Unsplash) con CORS
- **Dado** una imagen externa que rechaza peticiones de tipo `fetch` directo
- **Cuando** falla la descarga por HTTP
- **Entonces** el sistema realiza un fallback a carga nativa de imagen con `crossOrigin = "anonymous"` para procesarla a través del Canvas.

### Requisito: Interactividad en el PDF (Índice y Pedidos)
El PDF generado DEBE ser interactivo y actuar como un folleto digital dinámico.

#### Escenario: Índice de categorías
- **Dado** un catálogo con múltiples categorías
- **Cuando** se descarga el PDF
- **Entonces** la página 2 contiene un índice con guías de puntos que asocian cada categoría con su número de página, y al hacer clic sobre cualquier categoría se navega automáticamente a su página.

#### Escenario: Botones de pedido directo a WhatsApp
- **Dado** que el comercio tiene un teléfono configurado
- **Cuando** se visualiza un producto en el PDF
- **Entonces** se dibuja un botón verde "PEDIR" al lado del precio con un hipervínculo que abre WhatsApp con el número del comercio y un mensaje pre-redactado consultando por dicho producto.

### Requisito: Restricción por Plan de Suscripcion
La función de Exportación de Catálogo en PDF DEBE estar desbloqueada y disponible para todos los comercios en planes de paga (`emprendedor`, `pro`, `ilimitado`). En el plan `semilla` (Gratuito), la función DEBE mostrarse bloqueada con una invitación a actualizar al Plan Emprendedor (S/ 19.90/mes) o superior.

#### Escenario: Acceso desde plan de paga (Emprendedor, Pro, Ilimitado)
- **Dado** que la tienda se encuentra en plan `emprendedor`, `pro` o `ilimitado`
- **Cuando** el usuario hace clic en "Descargar PDF" o "Exportar Catálogo en PDF"
- **Entonces** se despliega el selector de 5 temas visuales y se permite generar y descargar el archivo PDF sin restricciones.

#### Escenario: Intento de acceso desde Plan Semilla
- **Dado** que la tienda se encuentra en plan `semilla`
- **Cuando** el usuario intenta acceder a la exportación en PDF
- **Entonces** se despliega el modal informativo indicando "Función Exclusiva para Planes de Paga" con enlace directo al módulo de actualización de plan (`/admin/plan`).

## Trazabilidad
Casos de prueba: `src/components/public/__tests__/CatalogPdfExport.test.ts` · Código: `src/components/public/CatalogPdfExport.tsx`, `src/routes/admin.diseno.tsx`, `src/routes/admin.plan.tsx`
