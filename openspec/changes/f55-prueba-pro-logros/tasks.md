# F55 · Tareas
1. Paso 0 (solo lectura → informe → PARADA).
2. Revisión de Claude + OK de Jack.
3. Rama `f55-prueba-pro-logros` en un worktree desde `catalog-connect-main` (nunca `D:\DIZI`), **después** del merge de F54 y de textos-planes.
4. Copiar el paquete a `openspec/changes/f55-prueba-pro-logros/`.
5. Migración solo como archivo (trigger + tabla + RLS + RPC), con pruebas SQL de los escenarios 3–8, 11 y 12 en una base local o con `BEGIN … ROLLBACK`, nunca sobre tiendas reales.
6. Lógica pura + Vitest (escenarios 9, 10, 14).
7. UI y textos.
8. Playwright `movil-android` (escenarios 1, 2, 15 + capturas a 375 y 1280).
9. Lint, Vitest, build.
10. Push sin merge → Preview → Claude revisa → Jack certifica.
11. Respaldo + migración con OK de Jack → merge → verificación en vivo (Claude, solo lectura).
12. Pasados 7 días: Claude mide los indicadores con la consulta de `diseno.md`.
13. Actualizar spec, `REQUISITOS-FUNCIONALES.md`, `FUENTE-DE-VERDAD.md` e `HISTORIAL-DE-CAMBIOS.md`.
