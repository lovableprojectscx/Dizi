# Informe F58 · Paso 1 — Píxel de Meta en DIZI (sin base de datos)

**Rama:** `f58-pixel-meta` (worktree `D:\wt-f58` desde `master` `c3bc620`)
**Compare:** https://github.com/lovableprojectscx/Dizi/compare/master...f58-pixel-meta

## 1. Resumen
Se implementó el Píxel de Meta (`1453347423533488`, constante en código, sin `.env` ni cambios de base de datos) restringido exclusivamente a las páginas propias de DIZI en hosts productivos (`dizi.idenza.site` y `dizicatalogo.com` con y sin `www`), bloqueando `/t/*`, `/bio/*`, `/pedido/*`, `/admin*`, `/super*`, el modo prueba (`isPreviewTestMode()`) y sesiones `super_admin` (`getRoleSync()`). Se integraron `PageView` en `__root.tsx`, `Lead` y `CompleteRegistration` en `register.tsx`, las cabeceras CSP Report-Only en `vercel.json` y el aviso legal en `/privacidad`. Todas las pruebas unitarias del píxel (6/6) y los 10 escenarios Playwright en `movil-android` (E1–E10) pasaron.

## 2. Evidencia por punto

| Punto | Estado | Evidencia |
|---|---|---|
| 1. Rama, worktree y paquete openspec | HECHO | Worktree `D:\wt-f58` en rama `f58-pixel-meta` desde `c3bc620`. Paquete creado en `openspec/changes/f58-pixel-meta/{proposal.md,design.md,tasks.md}` (no existía carpeta previa de F58 en disco). |
| 2. `src/lib/meta-pixel.ts` + Vitest | HECHO | `META_PIXEL_ID = "1453347423533488"` (`src/lib/meta-pixel.ts:15`), `isPixelAllowedPath` (`:55-58`), `isPixelEnabledHost` (`:63-71`), `canTrackPixel` (`:76-85`), `ensureMetaPixelLoaded` carga `fbevents.js` una sola vez (`:90-136`), `trackPageView` (`:141-147`), `trackLead` (`:152-158`), `trackCompleteRegistration` (`:164-174`). Vitest: `src/lib/__tests__/meta-pixel.test.ts` (6/6 passed). |
| 3. `__root.tsx` (`PageView`) | HECHO | `src/routes/__root.tsx:187-194`: `useRouterState` + `lastTrackedPathRef` dispara `trackPageView(pathname)` en cada cambio de ruta permitida sin duplicar el primero. |
| 4. `register.tsx` (`Lead` y `CompleteRegistration`) | HECHO | `leadTrackedRef` en `goFromStep3` (`src/routes/register.tsx:343-354`) dispara `trackLead("/register")` una vez al pasar WhatsApp. `completeRegTrackedRef` (`src/routes/register.tsx:569-576`) dispara `trackCompleteRegistration(rubroDefaults.rubro.id, "/register")` una vez tras el éxito de `addStore` (`initialize_store`), sin enviar nombre, teléfono, correo ni slug. |
| 5. `vercel.json` CSP Report-Only | HECHO | `vercel.json:103`: agregados `https://connect.facebook.net` en `script-src` y `https://www.facebook.com` en `img-src` y `connect-src`. |
| 6. `/privacidad` (sección 7) | HECHO | `src/routes/privacidad.tsx:190-194`: agregado el texto exacto requerido en la sección `7. Cookies`. |
| 7. Playwright E1–E10 (`movil-android`) | HECHO | `tests/e2e/f58-pixel-meta.spec.ts`: 10/10 passed interceptando `connect.facebook.net` y `www.facebook.com` sin llamar a Meta y simulando `https://dizi.idenza.site`. Capturas verificadas: `capturas-f58/e6-registro-completo.png` y `capturas-f58/e10-privacidad.png`. |

### Escenarios Playwright (`tests/e2e/f58-pixel-meta.spec.ts --project=movil-android`)
- **E1:** `/` en host productivo carga `fbevents.js` 1 vez y dispara `PageView` 1 vez sin duplicar. (PASSED, 13.6s)
- **E2:** `/t/floreriademo` y `/bio/floreriademo` → 0 pedidos a Meta. (PASSED, 5.5s)
- **E3:** `/pedido/DEMO123` → 0 pedidos a Meta. (PASSED, 3.5s)
- **E4:** `/admin` (con sesión `store_owner` para no redirigir a `/login`) y `/super/login` → 0 pedidos a Meta. (PASSED, 7.1s)
- **E5:** `/register` al pasar paso 3 (WhatsApp) → `Lead` 1 vez, `CompleteRegistration` 0. (PASSED, 5.8s)
- **E6:** `/register` tras `initialize_store` exitoso (mock de Supabase) → `CompleteRegistration` 1 vez con `cd[content_category]=floreria`; ninguna URL de evento contiene teléfono, correo, nombre ni slug. (PASSED, 5.6s)
- **E7:** Navegación SPA `/` → `/privacidad` → `/` → 3 `PageView` y 1 sola carga de `fbevents.js`. (PASSED, 5.2s)
- **E8:** Host no productivo (`localhost`) → 0 pedidos a Meta. (PASSED, 4.6s)
- **E9:** Sesión `super_admin` (`getRoleSync`) en host productivo → 0 pedidos a Meta. (PASSED, 9.4s)
- **E10:** `/privacidad` muestra el texto exacto del aviso del píxel de Meta. (PASSED, 5.6s)

## 3. Resultados reales de verificaciones

### `npm run lint`
```text
> dizi@1.0.2 lint
> eslint .
```
Salida con código `0` (0 errores; solo advertencias preexistentes en otros archivos).

### `npx tsc --noEmit`
```text
> (.\node_modules\.bin\tsc.cmd --noEmit 2>&1 | Select-String -Pattern "error TS" | Measure-Object).Count
19
```
- Baseline en `master` (`c3bc620`): **19** errores.
- Después de los cambios: **19** errores (0 errores nuevos).

### `npx vitest run`
- Prueba específica de F58 (`.\node_modules\.bin\vitest.cmd run src/lib/__tests__/meta-pixel.test.ts`):
```text
 ✓ src/lib/__tests__/meta-pixel.test.ts (6 tests) 8ms

 Test Files  1 passed (1)
      Tests  6 passed (6)
```
- Suite completa con `VITE_SUPABASE_ANON_KEY="dummy-key-for-vitest-tests"` (sin leer `.env`):
```text
 Test Files  1 failed | 89 passed (90)
      Tests  2 failed | 914 passed (916)
```
Los 2 únicos fallos corresponden a `src/routes/__tests__/category-lazy-loading.test.ts` ("6. RPC en Vivo" y "7. RPC en Vivo"), que requieren una clave real de Supabase de `.env` (no leída ni copiada por regla del encargo).

### `npm run build`
```text
✓ built in 32.76s
```
Salida con código `0`.

### `npx playwright test tests/e2e/f58-pixel-meta.spec.ts --project=movil-android`
```text
  10 passed (1.5m)
```

## 4. Lo que no hice o no pude verificar
- Disparo real contra servidores de Meta o en `https://dizi.idenza.site` en vivo (corresponde a verificación post-merge en producción).
- Las 2 pruebas de RPC en vivo de `category-lazy-loading.test.ts` en Vitest no pudieron validarse contra Supabase real porque el worktree no usa `.env` por restricción del encargo.

## 5. Fuera de alcance
- 19 errores preexistentes de TypeScript y advertencias preexistentes de ESLint en archivos no tocados por F58.

---
**Compare:** https://github.com/lovableprojectscx/Dizi/compare/master...f58-pixel-meta
**PARADA.**
