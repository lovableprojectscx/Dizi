# F54 · Tareas
1. Paso 0 (solo lectura → informe → PARADA): ver encargo.
2. Revisión de Claude + OK de Jack (incluye las decisiones abiertas).
3. Rama `f54-inicio-promociona` en un worktree desde `Catalogo Dinamico SAAS\catalog-connect-main` (nunca desde `D:\DIZI`).
4. Copiar el paquete a `openspec/changes/f54-inicio-promociona/`.
5. Sin migración.
6. Lógica pura + Vitest: `panel-home.ts` (escenarios 2–7), `promo-ideas.ts` (escenario 10, fechas móviles 2026 y 2027, hora de Lima), contraste (escenario 13).
7. UI: franja, mosaico, siguiente paso, números, miniaturas, ideas, cuadrícula, `initialStyle`.
8. Playwright `movil-android` + escritorio con Supabase interceptado (tiendas en memoria tipo `zz-audit-*`): escenarios 1–14, capturas a 375 y 1280 px de Inicio y Promociona, en claro y oscuro.
9. Lint (0 errores), Vitest (mismo método que master), build con el peso de `/admin/dashboard` y `/admin/marketing` antes y después.
10. Commit y push sin merge → enlace Preview de Vercel → **Claude prueba el Preview** → ajustes en la misma rama → Jack escribe "certificado".
11. Merge de Jack → verificación en vivo de Claude.
12. Actualizar spec, `REQUISITOS-FUNCIONALES.md`, `FUENTE-DE-VERDAD.md` e `HISTORIAL-DE-CAMBIOS.md`.
