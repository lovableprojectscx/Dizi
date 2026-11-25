# F58 · Diseño técnico

## 1. `src/lib/meta-pixel.ts`
- `META_PIXEL_ID = "1453347423533488"`.
- `ALLOWED_PIXEL_PATHS`: `Set` con `/`, `/register`, `/login`, `/ayuda`, `/novedades`, `/terminos`, `/privacidad`. Normaliza trailing slash (excepto `/`) y descarta query/hash antes de validar. Cualquier ruta `/t/*`, `/bio/*`, `/pedido/*`, `/admin*`, `/super*` u otra no listada devuelve `false`.
- `isPixelEnabledHost(hostname?)`: reutiliza `isProductionRegisterHost` (`dizi.idenza.site`, `www.dizi.idenza.site`, `dizicatalogo.com`, `www.dizicatalogo.com`).
- `canTrackPixel(pathname?)`: exige entorno browser, `isPixelEnabledHost()`, `!isPreviewTestMode()`, `getRoleSync() !== "super_admin"` y `isPixelAllowedPath(pathname)`.
- Carga perezosa: `ensurePixelLoaded()` crea el stub `window.fbq`, inyecta `<script async src="https://connect.facebook.net/en_US/fbevents.js">` una sola vez y ejecuta `fbq("init", META_PIXEL_ID)` una sola vez.
- Eventos:
  - `trackPageView(pathname?)` → `fbq("track", "PageView")`.
  - `trackLead(pathname?)` → `fbq("track", "Lead")`.
  - `trackCompleteRegistration(contentCategory?, pathname?)` → `fbq("track", "CompleteRegistration", { content_category })`.

## 2. Integración en rutas
- `src/routes/__root.tsx`: `useRouterState({ select: (s) => s.location.pathname })` + `useEffect` que llama `trackPageView(pathname)` evitando duplicar si `lastTrackedPathRef.current === pathname`.
- `src/routes/register.tsx`:
  - `leadTrackedRef` para disparar `trackLead("/register")` una sola vez en `goFromStep3`.
  - `completeRegTrackedRef` para disparar `trackCompleteRegistration(rubroDefaults.rubro.id, "/register")` una sola vez tras `addStore` (`initialize_store`) exitoso y antes de `setStep(6)`.
- `vercel.json`: actualizar `Content-Security-Policy-Report-Only`:
  - `script-src`: agregar `https://connect.facebook.net`.
  - `img-src`: agregar `https://www.facebook.com`.
  - `connect-src`: agregar `https://www.facebook.com`.
- `src/routes/privacidad.tsx`: agregar el texto en la sección 7 ("Cookies y medición").
