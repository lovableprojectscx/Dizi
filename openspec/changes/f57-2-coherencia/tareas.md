# F57.2 · Tareas
1. Paso 0 (solo lectura): confirmar cada archivo:línea de la tabla RF y `pg_get_functiondef` de `cancel_subscription` e `initialize_store`; informe y PARADA.
2. Revisión de Claude + OK de Jack (incluye la decisión del plazo legal).
3. Rama `f57-2-coherencia` (después del merge de F57.1).
4. Textos (RF-57.2.1/2/4/5) + pruebas 1, 2, 6, 7.
5. Mi Plan (RF-57.2.3) + Vitest/Playwright 3–5.
6. Super (RF-57.2.6) + prueba 8.
7. Migración como archivo (RF-57.2.7/8) + pruebas 9–10 en BEGIN…ROLLBACK con `zz-audit-*`.
8. Espejo openspec (RF-57.2.9) + prueba 12.
9. lint, vitest, build, tsc; prueba 11 (md5 catálogos). Informe y PARADA.
10. Revisión → merge → migración con respaldo y OK → verificación en vivo → docs (FUENTE, REQUISITOS, HISTORIAL; Términos legal con fecha).
