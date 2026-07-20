# Informe de Auditoría: Alertas de Vencimiento y Publicidad en Plan Semilla (Dizi)

Este informe presenta un análisis detallado sobre cómo están implementados actualmente los avisos de vencimiento de suscripción y los anuncios de Dizi para tiendas en el **Plan Semilla** o con suscripciones vencidas.

---

## ⚙️ 1. Lógica y Reglas de Suscripción en Dizi

El sistema de Dizi maneja el vencimiento de planes pagos (_Emprendedor_, _Pro_, _Ilimitado_) y la transición al plan gratuito (_Semilla_) utilizando dos períodos diferenciados:

| Parámetro              | Días    | Descripción                                                                                                                                                               |
| :--------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`GRACE_DAYS`**       | 3 días  | Período de gracia para las **funciones**. El cliente mantiene los límites de su plan pago durante 3 días tras el vencimiento.                                             |
| **`MODEL_GRACE_DAYS`** | 15 días | Período de gracia para el **diseño visual**. El cliente mantiene su plantilla premium seleccionada durante 15 días antes de revertirse al modelo Semilla (`minimalista`). |

---

## 🚨 2. Ubicación y Condiciones de los Avisos (Banners)

Los avisos se dividen en dos zonas: el **Panel de Administración** (visible solo para el dueño) y el **Catálogo Público** (visible para clientes y el dueño).

### A. En el Panel de Administración (Admin)

1. **Pestaña "Mi Plan" (`/admin/plan`)**:
   - **Condición**: El plan es de pago (`isPaid === true`) y los días restantes son negativos (`days < 0`).
   - **Texto**: _"Tu suscripción ha vencido. Tu plan venció el [Fecha]. Ahora tienes las funciones del plan Semilla. Para renovar, contacta con soporte."_
   - **Acción**: Botón destacado _"Renovar ahora por WhatsApp"_.

2. **Pestaña "Productos" (`/admin/productos`)**:
   - **Condición**: Suscripción vencida **Y** cantidad de productos visibles configurados mayor a 7 (el límite de Semilla).
   - **Texto**: _"X producto(s) oculto(s) en tu catálogo público. Tu suscripción venció. El plan Semilla permite hasta 7 productos visibles."_
   - **Acción**: Botón _"Renovar plan por WhatsApp"_.
   - **Detalle**: Si la tienda tiene 7 o menos productos, **no se muestra este aviso** porque ningún producto está siendo ocultado.

---

### B. En el Catálogo Público (`/t/:slug` y `/bio/:slug`)

Existen tres banners definidos en [PublicCatalog.tsx](file:///c:/Users/JACK%20FRANKLIN/Desktop/Proyectos%20Idenza/Catalogo%20Dinamico%20SAAS/catalog-connect-main/src/components/public/PublicCatalog.tsx#L1502-L1523):

1. **Banner de Modo Limitado (Público)**:
   - **Condición**: La suscripción ha vencido (`isExpired === true`).
   - **Texto**: _"Catálogo en modo limitado — mostrando 7 productos"_.
   - **Visibilidad**: Visible para todo el público al entrar a la tienda.

2. **Banner de Gracia de Diseño (Privado/Preview)**:
   - **Condición**: Quedan días de gracia de diseño (`modelDaysLeft > 0`) **Y** la tienda está despublicada (`!store.isPublished`).
   - **Texto**: _"Estas usando el modelo [Nombre] de tu plan anterior. En X dias cambiara automaticamente al modelo Semilla."_

3. **Banner de Diseño Revertido (Privado/Preview)**:
   - **Condición**: Expiró la gracia de diseño (`modelDaysLeft === 0`) **Y** la tienda está despublicada (`!store.isPublished`).
   - **Texto**: _"Tu suscripcion vencio. El catalogo ahora usa el modelo Semilla. Renueva tu plan para recuperar tu diseno original."_

> [!IMPORTANT]
> Los banners de diseño (2 y 3) contienen la condición `!store.isPublished`. Dado que las tiendas en producción se registran con `is_published: true` en la base de datos, estos avisos **no son visibles en el enlace público habitual** del comercio para no perjudicar la estética de su tienda frente a sus clientes.

---

## 📢 3. Anuncio y Limitaciones en el Plan Semilla

Cuando una tienda está configurada de forma activa en el **Plan Semilla** (gratuito) o ha revertido a este por vencimiento, se aplican los siguientes elementos:

1. **El Anuncio Flotante ("Crea tu catálogo con Dizi")**:
   - **Condición**: Tienda en plan `"semilla"` **Y** el modo de visualización es Bio-Link (`mode === "bio"` en `/bio/:slug`).
   - **Comportamiento**: Renderiza un botón flotante y elegante en la parte inferior central: `"Crea tu catálogo gratis con Dizi"`.
   - **Limitación**: **No se muestra** si el cliente accede a través del catálogo de productos estándar (`/t/:slug`).

2. **Restricciones de Marca en Bio-Link**:
   - **Límite de Enlaces**: Máximo 5 enlaces rápidos personalizados (los oficiales de Instagram, Facebook, TikTok, etc., no suman al límite).
   - **Colores de Botones**: Fuerza a los enlaces rápidos a usar el color y tipografía base de la plataforma, ignorando los colores personalizados configurados en el panel para forzar la estética estándar de Dizi.

---

## 🕵️ 4. ¿Por qué no estás viendo los avisos en tus pruebas actuales?

Si estás haciendo pruebas y no ves los avisos o anuncios, lo más probable es que sea por una de estas razones:

1. **Tu Tienda de Prueba está en "Plan Semilla" Activo**:
   - El Plan Semilla es gratuito e ilimitado en el tiempo. Si la tienda tiene `plan: "semilla"` y `plan_expires_at: null`, **nunca** mostrará advertencias de vencimiento de suscripción porque técnicamente no ha vencido nada.
   - _Solución para probar_: Edita la base de datos de tu tienda de prueba y cambia su plan a `plan: "emprendedor"` con un `plan_expires_at` en el pasado (ej. `2026-06-01`).

2. **Tienes 7 o menos productos**:
   - Si la tienda de prueba tiene pocos productos creados, no se supera el límite del plan Semilla (7 productos), por lo que el banner de _"X productos ocultos"_ en la sección de administración no se activará.
   - _Solución para probar_: Registra 8 o más productos en el catálogo de prueba.

3. **Estás probando en el Catálogo de Productos en lugar de Bio-Link**:
   - El anuncio flotante de Dizi (`"Crea tu catálogo gratis con Dizi"`) está programado **únicamente** para el formato Bio-Link (`/bio/:slug`). Si entras a `/t/:slug`, no lo verás.
   - _Solución para probar_: Asegúrate de navegar al enlace `/bio/tu-tienda-slug`.

4. **La Tienda está Publicada (`is_published: true`)**:
   - Los banners de aviso de plantilla premium (Amber/Red) están protegidos con `!store.isPublished` para que los clientes del comercio no vean advertencias administrativas de cobro.
   - _Solución para probar_: Cambia temporalmente `is_published` a `false` en la tabla `stores` para la tienda que deseas evaluar.
