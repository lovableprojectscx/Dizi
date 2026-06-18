# Guía y Documentación de Diseños Premium en Dizi

Este documento detalla la estructura visual exacta, componentes de interfaz y parámetros de personalización disponibles para cada uno de los 5 diseños premium en Dizi. Esta información sirve como referencia técnica y comercial para evaluar futuros cambios y optimizaciones en el área de diseño.

---

## Resumen de Plantillas y Flexibilidad

| Plantilla | Rubro / Nicho | Tipo de Diseño | Ajustes de Diseño (Avanzados) | Tipografía | Estilo del Corte de Portada | Estilo de Tarjetas |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Estándar Premium** | General / Multirubro | Adaptativo / Flexible | **Desbloqueado (Completo)** | Configurable (Sans, Serif, Rounded, Modern) | Configurable (Directo, Con Margen, Curvado) | Configurable (Estándar, Curvado, Plano, Elevado) |
| **Lookbook Editorial** | General / Multirubro | Curado de Alta Costura | **Bloqueado (Fijo)** | Fijo (Playfair Serif) | Fijo (Directo / Full-width) | Fijo (Plano / Recto sin sombra) |
| **Bite Burger** | Hamburguesería | Curado Temático / Dark | **Bloqueado (Fijo)** | Fijo (Inter Sans-serif) | Fijo (Con Margen / Framed) | Fijo (Estándar / Recto) |
| **Bloom Floral** | Florería Boutique | Curado Orgánico / Pastel | **Bloqueado (Fijo)** | Fijo (Playfair Serif) | Fijo (Curvado / Curved) | Fijo (Curvado tipo Pétalo) |
| **Eco Nature** | Florería Boutique | Curado Natural / Botánico | **Bloqueado (Fijo)** | Fijo (Playfair Serif) | Fijo (Curvado / Curved) | Fijo (Curvado orgánico cápsula) |

---

## Detalle por Plantilla Premium

### 1. Estándar Premium (`bloom` en General)
Diseño multipropósito limpio y moderno optimizado para catálogos comerciales multirubro que necesitan flexibilidad de marca.

* **Componentes de Interfaz**:
  * Carrusel de banners superiores adaptable.
  * Sección destacada con deslizamiento horizontal (Spotlight Carousel).
  * Grilla de productos simétrica.
  * Buscador flotante inteligente y selector de categorías tradicional.
* **Qué se puede modificar**:
  * **Pestaña Estilo & Plantilla**: Selección de plantilla y rubro.
  * **Pestaña Paleta de Colores**: Color de acento de marca y color de fondo de página.
  * **Pestaña Portada & Banners**: Lista de imágenes (hasta 3 o 5), título del banner (tagline superior e inferior no aplican en este diseño).
  * **Pestaña Ajustes de Diseño (Desbloqueado)**:
    * *Corte del Banner*: Directo (borde recto full-width), Con Margen (recuadro flotante) o Curvado.
    * *Tipografía*: Inter (Sans), Playfair (Serif), Quicksand (Rounded) u Outfit (Modern).
    * *Tarjetas de Producto*: Estándar (esquinas suaves con sombra), Curvado (esquinas muy redondas), Plano (borde fino sin sombra) o Elevado (sin borde con sombra de aire).

---

### 2. Lookbook Editorial (`lookbook` en General)
Inspirado en catálogos de lujo y revistas de moda. Presenta productos como una galería fotográfica editorial limpia y refinada.

* **Componentes de Interfaz**:
  * Banners cinematográficos a pantalla completa sin cortes laterales.
  * Indexación numérica gigante a la izquierda de cada producto.
  * Tipografía Serif estilizada y ausencia total de emojis en botones.
  * Botón de compra discreto integrado al pie de cada foto.
* **Qué se puede modificar**:
  * **Pestaña Estilo & Plantilla**: Selección del diseño.
  * **Pestaña Paleta de Colores**: Color de acento y de fondo.
  * **Pestaña Portada & Banners**: Imágenes de banners, **Título del Banner**, **Superetiqueta / Tagline Superior** (ej: *"COLECCIÓN EXCLUSIVA"*), y **Etiqueta Inferior / Botón de Acción** (ej: *"Ver Catálogo"*).
* **Parámetros Bloqueos (Fijos)**:
  * Pestaña *Ajustes de Diseño* bloqueada con candado.
  * Estilo del banner fijado a "Directo" (recto y extendido).
  * Tipografía fijada a "Serif" de alto contraste.
  * Estilo de tarjetas de producto fijada a "Plano" (rectángulos de arte limpios sin bordes curvos).

---

### 3. Bite Burger (`bite` en Hamburguesería)
Diseño inmersivo en modo oscuro optimizado para restaurantes, cafeterías, gastrobars y ambientes de comida artesanal.

* **Componentes de Interfaz**:
  * Interfaz en modo oscuro profundo (`bg-zinc-950`).
  * Selector de categorías con iconos vectoriales de alimentos predefinidos.
  * Carrusel de destacados inteligente: Si no hay productos con la etiqueta `#destacado`, se autocompleta dinámicamente con productos en oferta (`isOnSale`) o los 4 primeros de la tienda, ajustando su título entre *"Ofertas Especiales"*, *"Te Recomendamos"* o *"Destacados de la Casa"*.
  * Tarjetas de producto anchas y robustas con efectos de resplandor sutiles.
* **Qué se puede modificar**:
  * **Pestaña Estilo & Plantilla**: Selección del diseño.
  * **Pestaña Paleta de Colores**: Color de acento (sugeridos: tonos fuego/cálidos) y color de fondo.
  * **Pestaña Portada & Banners**: Imágenes de banners.
* **Parámetros Bloqueos (Fijos)**:
  * Pestaña *Ajustes de Diseño* bloqueada con candado.
  * Estilo del banner fijado a "Con Margen" (Framed).
  * Tipografía de impacto fijada a "Inter Sans-serif".
  * Estilo de tarjetas fijado a "Estándar" (recto robusto).

---

### 4. Bloom Floral (`bloom` en Florería)
Diseño boutique ligero y elegante para floristerías, florerías boutique, viveros y regalerías que requieren una estética romántica y delicada.

* **Componentes de Interfaz**:
  * Fondos de agua botánicos rotados con SVGs de hojas en baja opacidad.
  * Carrusel superior curvado con forma de pétalo orgánico.
  * Selector de categorías temático con iconos botánicos.
  * Tarjetas de producto asimétricas emulando curvas florales.
* **Qué se puede modificar**:
  * **Pestaña Estilo & Plantilla**: Selección del diseño.
  * **Pestaña Paleta de Colores**: Color de acento (sugeridos: rosados/follajes) y color de fondo (sugerido: crema suave).
  * **Pestaña Portada & Banners**: Imágenes de banners, **Título del Banner** (subtítulo principal), **Superetiqueta / Tagline Superior** (ej: *"Arreglos Florales Frescos"*) y **Etiqueta Inferior** (ej: *"Pide por WhatsApp"*).
* **Parámetros Bloqueos (Fijos)**:
  * Pestaña *Ajustes de Diseño* bloqueada con candado.
  * Estilo del banner fijado a "Curvado" (curved).
  * Tipografía romántica fijada a "Serif".
  * Estilo de tarjetas fijado a "Curvado" orgánico asimétrico.

---

### 5. Eco Nature (`nature` en Florería)
Diseño ecológico e innovador inspirado en la sostenibilidad, botánica de interiores y marcas orgánicas limpias.

* **Componentes de Interfaz**:
  * Banners con líneas curvadas fluidas.
  * Fuerte presencia de verdes salvia y tonos tierra.
  * Tarjetas de producto con bordes ultra redondeados en forma de cápsula orgánica.
  * Cabecera flotante editorial que contiene el título del banner, subtítulos y botones redondeados.
* **Qué se puede modificar**:
  * **Pestaña Estilo & Plantilla**: Selección del diseño.
  * **Pestaña Paleta de Colores**: Color de acento (sugerido: verde follaje) y color de fondo (sugerido: crema/blanco suave).
  * **Pestaña Portada & Banners**: Imágenes de banners, **Título del Banner**, **Superetiqueta / Tagline Superior** (ej: *"Cuidado Natural & Sostenible"*) y **Etiqueta Inferior** (ej: *"Conoce Más"*).
* **Parámetros Bloqueos (Fijos)**:
  * Pestaña *Ajustes de Diseño* bloqueada con candado.
  * Estilo del banner fijado a "Curvado" (curved).
  * Tipografía editorial fijada a "Serif".
  * Estilo de tarjetas de producto fijada a "Curvado orgánico cápsula".
