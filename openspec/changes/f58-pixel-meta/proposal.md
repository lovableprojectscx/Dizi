# F58 · Píxel de Meta en páginas de DIZI (sin base de datos)

**Estado:** Aprobado Paso 0 → Paso 1 (construcción).
**Decisiones de Jack:**
- ID del píxel (público, no es secreto): `1453347423533488` como constante en `src/lib/meta-pixel.ts` (NO en `.env`).
- Eventos: `PageView`, `Lead` y `CompleteRegistration`.
- Sin cambios de base de datos ni migraciones.

## Alcance
1. Módulo `src/lib/meta-pixel.ts` con allowlist estricta de rutas (`isPixelAllowedPath`), allowlist de hosts productivos (`isPixelEnabledHost`), carga perezosa de `fbevents.js` una sola vez, y funciones `trackPageView`, `trackLead`, `trackCompleteRegistration`.
2. Bloqueo total si `isPreviewTestMode()` es `true` o si `getRoleSync() === "super_admin"`.
3. `__root.tsx`: disparar `PageView` en cada cambio de ruta permitida sin duplicar la primera carga.
4. `register.tsx`:
   - `Lead` en `goFromStep3` (al pasar la pantalla de WhatsApp), una sola vez.
   - `CompleteRegistration` después del éxito real de `initialize_store`, una sola vez, con `content_category = rubro`. Nunca enviar nombre, teléfono, correo ni slug.
5. `vercel.json` CSP Report-Only: agregar `https://connect.facebook.net` en `script-src` y `https://www.facebook.com` en `img-src` y `connect-src`.
6. `/privacidad`: informar el uso del píxel de Meta solo en páginas de DIZI y sin envío de datos personales.

## Escenarios (1–10)
1. **E1:** `/` en host de producción carga `fbevents.js` una vez y dispara `PageView` sin duplicar.
2. **E2:** `/t/<demo>` y `/bio/<demo>` en host de producción → 0 pedidos a Meta.
3. **E3:** `/pedido/<x>` en host de producción → 0 pedidos a Meta.
4. **E4:** `/admin` y `/super` en host de producción → 0 pedidos a Meta.
5. **E5:** `/register` al pasar paso 3 (WhatsApp) → `Lead` una sola vez, sin datos personales.
6. **E6:** `/register` tras `initialize_store` exitoso → `CompleteRegistration` una sola vez con `content_category = rubro`, sin teléfono, correo, nombre ni slug en la URL del evento.
7. **E7:** Navegación SPA entre rutas permitidas → `PageView` por cada cambio sin recargar `fbevents.js`.
8. **E8:** Host no productivo (`localhost` / preview) → `isPreviewTestMode()` → 0 pedidos a Meta.
9. **E9:** Sesión con rol `super_admin` → 0 pedidos a Meta incluso en rutas permitidas.
10. **E10:** `/privacidad` muestra el aviso del píxel de Meta con el texto requerido.
