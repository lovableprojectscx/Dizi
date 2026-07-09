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

## Trazabilidad
Casos de prueba: `src/components/public/__tests__/CatalogPdfExport.test.ts` · Código: `src/components/public/CatalogPdfExport.tsx`
