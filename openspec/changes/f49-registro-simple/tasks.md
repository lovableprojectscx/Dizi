# F49 · Tareas

1. **Paso 0 (solo lectura → informe → PARADA):** ver encargo.
2. Revisión de Claude + OK de Jack.
3. Rama `f49-registro-simple` en worktree aparte desde `origin/master`.
4. Copiar el paquete a `openspec/changes/f49-registro-simple/`.
5. Migración solo como archivo.
6. Lógica pura + Vitest: `rubros.ts`, slug, `signup-funnel.ts`, lectura de `?origen=`/`utm_source`, reintento sin columnas.
7. UI: registro, primer producto, "Completa tu tienda", superadmin, título de demos.
8. Playwright `movil-android` contra la app real con Supabase interceptado (sin crear cuentas reales): escenarios 1–12, capturas a 375 y 1280 px de cada pantalla nueva.
9. `npm run lint` (0 errores), `npx vitest run` (mismo método que master), `npm run build`.
10. Commit y push sin merge → revisión de Claude.
11. Respaldo + migración con OK de Jack → verificación de solo lectura.
12. Merge de Jack → verificación en vivo: registro real con una cuenta `zz-audit-f49-*`, luego se borra.
13. Actualizar spec, `REQUISITOS-FUNCIONALES.md`, `FUENTE-DE-VERDAD.md` e `HISTORIAL-DE-CAMBIOS.md`.
