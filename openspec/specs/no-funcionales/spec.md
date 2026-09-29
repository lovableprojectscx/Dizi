# Spec: Requisitos No Funcionales (ISO/IEC 25010)

## Propósito
Definir las características de calidad del producto con métricas verificables. Cubre RNF-01 a RNF-05.

> **Estado real (29 sep 2026):** son **objetivos**, no todos se cumplen. RNF-01: las cabeceras CSP/HSTS están en
> `vercel.json` pero no llegan al navegador (Fase 2). RNF-02: LCP móvil medido 11–13 s (Fase 3). RNF-04: `ci.yml`
> escucha la rama `main` y se trabaja en `master`, así que no corre (Fase 2). RNF-05: se cumple (`error-capture.ts`, `error-page.ts`)
> y se reforzó con reintentos ante fallos de Supabase (Fase 1B, B7).

## Requisitos

### RNF-01 - Seguridad
RLS por `auth.uid()` en tablas críticas; HSTS con `max-age` ≥ 1 año; CSP restringida a dominios autorizados (Supabase, Leaflet, Google Fonts). Verificación: CP-12/CP-13, cabeceras en `vercel.json`, OWASP ZAP.

### RNF-02 - Rendimiento
TTI del catálogo público < 2 s en 4G (1.5 Mbps, RTT 100 ms); conversión WebP en cliente (máx. 2048 px, ahorro ≈ 80% de ancho de banda); bundle JS inicial ≤ 600 kB. Verificación: k6 (p95 < 800 ms), `image-utils.test.ts`.

### RNF-03 - Usabilidad
Mobile-first desde 360 px sin scroll horizontal; objetivos táctiles ≥ 44×44 px; consistencia shadcn/ui en modo claro/oscuro. Verificación: Playwright en viewport móvil.

### RNF-04 - Mantenibilidad
TypeScript estricto sin `any` en lógica de negocio; quality gate en CI: lint sin errores y cobertura ≥ 80% en `src/lib` (`scripts/check-coverage.js`). Verificación: pipeline `.github/workflows/ci.yml`.

### RNF-05 - Fiabilidad
Captura global de `error` y `unhandledrejection` con buffer TTL 5 s (`error-capture.ts`); página de contingencia estática con recarga ante crash (`error-page.ts`). Verificación: `error-capture.test.ts`, `error-page.test.ts`.
