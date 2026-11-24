# F57.1 · Tareas
1. Paso 0 (solo lectura): confirmar hechos del diseño con archivo:línea y `pg_get_functiondef`; informe y PARADA.
2. Revisión de Claude + OK de Jack.
3. Rama `f57-1-aviso-semilla` (worktree `wt-f57-1`).
4. Migración solo como archivo: `semilla_sunset_targets` + `apply_semilla_sunset` usándola + grants.
5. `semilla-notice.ts` + Vitest (escenarios 1–11).
6. Ventana + franja en `admin.tsx`.
7. Playwright `movil-android` escenarios 1–13 con capturas.
8. lint, vitest, build, tsc (19 errores de base, ninguno nuevo).
9. Informe y PARADA → revisión de Claude.
10. Con OK: respaldo, aplicar migración, escenarios 14–16 en la base (solo lectura / BEGIN…ROLLBACK, sin tiendas reales modificadas).
11. Merge de Jack.
12. Con OK de Jack: `semilla_fin = "2026-12-09"`. Claude verifica en vivo quién ve el aviso.
13. 8 dic noche: Jack enciende `pausa_activa`. 9 dic 6:00: conversión. Claude verifica 0 en pausa.
14. Actualizar FUENTE-DE-VERDAD, REQUISITOS, HISTORIAL.
