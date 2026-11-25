# F58 · Píxel de Meta en las páginas de DIZI

**Estado:** 📝 Propuesta (24 nov 2026). Pedido de Jack: "ya pixel, porque ya están activas las ads".
**Por qué:** la campaña de Tráfico solo mide clics. Sin píxel, Meta no sabe quién se registró y no puede optimizar ni decirnos qué anuncio trae tiendas reales. Hoy medimos a mano con `utm_source=meta` en el super.

## Verificado por Claude (24 nov)
- La cuenta publicitaria **Dizi** (negocio DIZI) **no tiene ningún píxel** creado.
- El código no tiene ningún píxel ni analítica externa.
- `vercel.json:102` tiene una CSP en modo *Report-Only*: hay que permitir `connect.facebook.net` (script) y `www.facebook.com` (img/connect) para no llenar el reporte de errores.
- El registro tiene modo prueba fuera de producción (`register.tsx:156`, `isPreviewTestMode`).

## Alcance v1
- Píxel **solo** en páginas propias de DIZI: `/`, `/register`, `/login`, `/ayuda`, `/novedades`, `/terminos`, `/privacidad`.
- **Nunca** en `/t/*`, `/bio/*`, `/pedido/*` (catálogos de las tiendas y pedidos de sus clientes), ni en `/admin/*` ni `/super/*`.
- Eventos: `PageView` en cada cambio de ruta permitida (la web es de una sola página), `Lead` al terminar la pantalla de WhatsApp del registro (opcional, ver decisión), `CompleteRegistration` cuando la tienda se crea de verdad (después de `initialize_store` sin error).
- **No** se dispara nada en modo prueba, en `localhost`, en previews de Vercel ni si la persona es super.
- **Sin datos personales** al píxel: ni nombre, ni teléfono, ni correo, ni slug. Solo el evento y, como parámetro, el rubro (`content_category`) y el plan pedido si vino `?plan=`.
- El ID del píxel es público (aparece en la página): va en una constante en `src/lib/meta-pixel.ts`, no en `.env`.
- Aviso en `/privacidad`: usamos el píxel de Meta solo en las páginas de DIZI, para medir anuncios; nunca en los catálogos de las tiendas.

## Requisitos
| ID | Requisito |
|---|---|
| RF-58.1 | `meta-pixel.ts`: `isPixelAllowedPath(path)`, `isPixelEnabledHost(host)` (solo `dizi.idenza.site` y `dizicatalogo.com`), `trackPageView`, `trackCompleteRegistration(params)`. Puras donde se pueda. |
| RF-58.2 | El script de Meta se carga **solo** la primera vez que se entra a una ruta permitida en un host permitido; nunca se carga en catálogos. |
| RF-58.3 | `PageView` en cada navegación entre rutas permitidas (sin duplicar el primero). |
| RF-58.4 | `CompleteRegistration` una sola vez por tienda creada, después del éxito de `initialize_store`; nunca en modo prueba. |
| RF-58.5 | CSP (Report-Only) actualizada con los dominios de Meta. |
| RF-58.6 | Texto en `/privacidad`. |

| ID | No funcional |
|---|---|
| RNF-58.1 | **Los catálogos públicos no cargan nada de Meta** (prueba de red en `/t/<demo>`). |
| RNF-58.2 | Sin datos personales en los eventos. |
| RNF-58.3 | Si Meta está bloqueado (bloqueador de anuncios), la web funciona igual. |
| RNF-58.4 | La landing no se vuelve más lenta de forma visible (el script carga después de lo principal). |

## Escenarios
1. `/` en host de producción → carga `fbevents.js` y envía 1 `PageView`.
2. `/t/zapatillas-demo` → **0** pedidos a `facebook.net` / `facebook.com`.
3. `/bio/<demo>` y `/pedido/<código>` → 0 pedidos a Meta.
4. `/admin` y `/super` → 0 pedidos a Meta.
5. Navegar `/` → `/register` → 2 `PageView`, script cargado una vez.
6. Registro completo en producción simulada → 1 `CompleteRegistration` con `content_category` y sin teléfono/correo/nombre en la URL del evento.
7. Registro en modo prueba / localhost / preview → 0 eventos.
8. Script bloqueado (la ruta de Meta responde error) → la landing y el registro funcionan.
9. `/privacidad` muestra el texto del píxel.
10. CSP Report-Only incluye los dominios de Meta.

## Decisiones de Jack (25 nov)
- ✅ Píxel **DIZI web**, ID `1453347423533488`, creado por Jack el 25 nov en el negocio DIZI (conectado a la cuenta publicitaria Dizi 1467890521911435). Activo, sin eventos todavía.
- ✅ Evento `Lead` al terminar la pantalla de WhatsApp del registro (`goFromStep3`), además de `PageView` y `CompleteRegistration`.

## Decisiones abiertas (resueltas arriba)
- **Crear el píxel:** lo puede crear Claude desde la cuenta Dizi (con tu OK) o tú en el Administrador de eventos. Se llamaría "DIZI web".
- **¿Evento `Lead`** al llegar a la pantalla de WhatsApp del registro? Ayuda a Meta a optimizar con pocos registros. Recomendación: sí.
