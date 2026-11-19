# F53 · Tareas
1. Paso 0 (solo lectura → informe → PARADA): ver encargo.
2. Revisión de Claude + OK de Jack.
3. Rama `f53-registro-slides` en worktree desde `Catalogo Dinamico SAAS\catalog-connect-main` (nunca desde `D:\DIZI`).
4. Copiar el paquete a `openspec/changes/f53-registro-slides/`.
5. Migración solo como archivo.
6. Lógica pura + Vitest (ciudades, pasos del embudo, contraste de colores, tienda en memoria de la vista previa).
7. UI de las 6 pantallas + vista previa + celebración.
8. Playwright `movil-android` con Supabase interceptado: escenarios 1–12, capturas de cada pantalla a 375 y 1280 px.
9. Lint (0 errores), Vitest (mismo método que master), build con el peso de la página del registro antes y después.
10. Commit y push sin merge → enlace Preview de Vercel de la rama → revisión de Claude.
11. **Prueba de Jack en el Preview** (modo prueba, sin crear cuentas) → ajustes en la misma rama → repetir hasta que Jack escriba "certificado".
12. Con la certificación y al menos 7 días de datos de F49: respaldo + migración con OK → merge de Jack → verificación en vivo.
13. Actualizar spec, `REQUISITOS-FUNCIONALES.md`, `FUENTE-DE-VERDAD.md` e `HISTORIAL-DE-CAMBIOS.md`.
