# Branding y Apariencia — Auditoría UX y Propuesta de Simplificación

**Fecha:** 02 de Julio, 2026
**Motivo:** Consulta real de un cliente ("Ya modifiqué en apariencia pero no se actualiza") + revisión de coherencia del flujo de logo/banner solicitada por el equipo.

---

## 1. Estado actual — dónde vive cada elemento de marca

El modelo de datos es correcto: **cada asset tiene una única fuente de verdad** en la tabla `stores`. Lo que está fragmentado es la **UI de edición**, repartida en 4 pantallas:

| Elemento                                 | Campo BD                                       | Dónde se edita                                                                                                                        | Dónde se muestra                                                                  |
| ---------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Logo del negocio**                     | `logo`                                         | **Solo Configuración** ([admin.configuracion.tsx](../../src/routes/admin.configuracion.tsx))                                          | Header del catálogo público, PDF export, OG image (fallback), Bio-Link (fallback) |
| **Banner de portada**                    | `banner_image`, `banner_title`, `banner_style` | **Diseño Estándar** (tab "Portada & Banners", solo plantillas `elite`/`portada`) **y también Diseño Premium** (carrusel multi-banner) | Portada del catálogo público + OG image de WhatsApp/Facebook                      |
| **Foto de perfil Bio**                   | `bio_logo`                                     | Link en Bio (con botón "Usar logo de mi tienda")                                                                                      | Página `/bio/:slug`                                                               |
| **Portada Bio**                          | `bio_banner`                                   | Link en Bio (con botón de sincronizar con banner)                                                                                     | Página `/bio/:slug`                                                               |
| Colores / tipografía / estilo de tarjeta | `brand_color`, `bg_color`, `text_color`, etc.  | Diseño Estándar y Diseño Premium                                                                                                      | Catálogo público                                                                  |

### Reglas de visibilidad que afectan lo que el cliente ve

1. **Límite de banners por plan** ([PublicCatalog.tsx](../../src/components/public/PublicCatalog.tsx), `activeBanners`): Semilla = **0 banners**, Emprendedor = 1, Pro = 3, Ilimitado = 5. Un banner guardado puede simplemente **no mostrarse** en el catálogo público.
2. **Soporte por plantilla** (Diseño Estándar): el tab "Portada & Banners" solo funciona con plantillas `elite` o `portada`.
3. **Degradación por vencimiento** (`getEffectiveModel` en [types.ts](../../src/lib/types.ts)): pasados 15 días de gracia tras vencer el plan, el catálogo público fuerza el modelo Semilla — las personalizaciones premium dejan de verse aunque sigan guardadas.

---

## 2. Diagnóstico: "Ya modifiqué en apariencia pero no se actualiza"

Las dos flechas del cliente en la captura señalan **dos assets distintos que se editan en pantallas distintas**:

- Flecha 1 (logo circular del header) → es `store.logo` → se cambia en **Configuración**, no en Diseño.
- Flecha 2 (imagen de banner "We Home") → es `banner_image` → se cambia en **Diseño → Portada & Banners**.

Causas probables del "no se actualiza", en orden de frecuencia esperada:

1. **Editó en la pantalla equivocada.** El usuario asocia "apariencia" con Diseño; el logo del header no está ahí. O subió el logo en Link en Bio (`bio_logo`), que solo afecta la página Bio, no el catálogo.
2. **No pulsó Guardar.** En Configuración, subir el logo solo carga una vista previa local (toast: "Logo cargado. Haz clic en Guardar para confirmar"). Es una trampa común: el usuario ve el logo en pantalla y cree que ya quedó.
3. **El plan oculta el cambio.** Un usuario Semilla (o con plan vencido +15 días) puede guardar banner/diseño premium y el catálogo público lo ignora silenciosamente. El editor dice "Los cambios se reflejan en tiempo real", lo cual es engañoso en este caso.
4. **Caché de imagen** (menos probable): las URLs ya llevan cache-buster `?t=`, así que solo aplicaría a apps con caché agresivo (WebView de TikTok/WhatsApp) mostrando la imagen anterior un rato.

> **Respuesta corta para soporte:** "El logo redondo de arriba se cambia en **Configuración → Logo del Negocio** (y recuerda pulsar **Guardar**). La imagen grande de portada se cambia en **Diseño → pestaña Portada & Banners**. Si después de guardar no lo ves, abre tu catálogo en una ventana de incógnito para descartar el caché del teléfono."

---

## 3. Evaluación profesional de la fragmentación

**Lo que está bien y no hay que tocar:**

- Una sola fuente de verdad por asset en BD. No hay datos duplicados; no se necesita migración.
- El patrón del Bio-Link es correcto: override opcional (`bio_logo`) con fallback automático al logo de la tienda (`bioLogo || store.logo`) y botón de sincronizar. Es el modelo a imitar, no a eliminar.
- Separar "identidad del negocio" (Configuración) de "diseño del catálogo" (Diseño) es una arquitectura de información defendible.

**Lo que sí es incoherente:**

- **I-1. El logo es invisible desde Diseño.** Todo lo visual del catálogo vive en Diseño _excepto_ el logo del header. Es la fuente directa de tickets como el de ayer.
- **I-2. El banner se edita en dos páginas** (Diseño Estándar y Diseño Premium) con comportamientos distintos (imagen única vs. carrusel) escribiendo los mismos campos. Duplicación de código y de concepto.
- **I-3. Guardado silenciosamente inútil.** El editor permite guardar personalizaciones que el plan/plantilla nunca mostrará en público, sin avisar.
- **I-4. Naming ambiguo.** El sidebar dice "Diseño Estándar" y "Diseño Premium" bajo el grupo "Canales y Apariencia"; el cliente dice "apariencia" y no sabe a cuál entrar.

---

## 4. Propuesta

**Recomendación: NO construir una página nueva de "Centro de Marca".** Movería el problema en vez de resolverlo (el usuario seguiría sin saber si el logo está en Marca, Diseño o Configuración) y añade una quinta pantalla. La fragmentación se resuelve con exposición cruzada del mismo campo.

### Fase A — Quick wins (bajo riesgo, ~1 día)

1. **Uploader de logo dentro de Diseño** (Estándar y Premium): un bloque "Logo del negocio" en la pestaña _Estilo_ o _Ajustes_ que lee/escribe el mismo `store.logo`. Sin campo nuevo, sin migración. Resuelve I-1 directamente.
2. **Enlaces cruzados:** en Configuración, junto al logo, un texto "¿Buscas la imagen de portada? Está en **Diseño → Portada & Banners**" (y viceversa).
3. **Aviso de visibilidad (resuelve I-3):** si `plan === 'semilla'` o la plantilla activa no soporta banner, mostrar un aviso persistente en el editor: "Guardaremos tu banner, pero tu plan/plantilla actual no lo muestra en el catálogo público". Lo mismo cuando `shouldUseSemillaModel()` es true (plan vencido).
4. **Tooltip/preview de "Guardar pendiente":** al subir logo en Configuración, marcar visualmente el botón Guardar (badge "cambios sin guardar") para eliminar la causa #2 del diagnóstico.

### Fase B — Mediano plazo (opcional)

5. **Fusionar Diseño Estándar y Diseño Premium en una sola página** con las plantillas agrupadas por plan (la UI de tabs por nivel ya existe en Premium). Elimina I-2 e I-4: quedaría un solo "Diseño" en el sidebar.
6. Renombrar en el sidebar: "Diseño" (catálogo) / "Link en Bio" / "Configuración" — sin la palabra suelta "Apariencia" en el grupo, o usarla como nombre único de la página fusionada.

### Qué NO hacer

- No unificar `bio_logo` con `logo` en un solo campo: perder el override rompería a los clientes que usan una foto de perfil distinta en su Bio.
- No mover el banner a Configuración: es parte del diseño del catálogo y depende de la plantilla.

---

## 5. FAQ para soporte al cliente

**¿Cómo cambio el logo redondo que sale arriba del catálogo?**
Configuración → tarjeta "Logo del Negocio" → clic en el círculo → subir imagen (cuadrada, ideal 500×500) → **Guardar**.

**¿Cómo cambio la imagen grande de portada (banner)?**
Diseño → pestaña "Portada & Banners" → subir imagen horizontal. Requiere una plantilla que soporte portada (Elite o Portada con Banner) y un plan de pago (Semilla no muestra banners).

**Cambié el logo pero mi Bio-Link sigue mostrando el anterior.**
El Bio-Link tiene su propia foto de perfil. En Link en Bio, usa el botón "Usar logo de mi tienda" para sincronizarla.

**Guardé y sigo viendo lo antiguo en mi celular.**
Abre el catálogo en ventana de incógnito o borra caché del navegador. Si lo compartes por WhatsApp, la miniatura (OG image) puede tardar en refrescarse porque WhatsApp cachea las vistas previas hasta ~24 h.
