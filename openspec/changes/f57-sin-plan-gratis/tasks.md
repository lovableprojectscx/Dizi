# F57 · Tareas
1. Paso 0 (solo lectura → informe → PARADA).
2. Revisión de Claude + OK de Jack (incluida la fecha S).
3. Rama `f57-sin-plan-gratis` en un worktree desde `catalog-connect-main` (master actual), nunca `D:\DIZI`.
4. Copiar el paquete a `openspec/changes/f57-sin-plan-gratis/`.
5. Migración solo como archivo (función de estado, `get_public_store`, `effective_product_limit`, configuración/interruptor, transición de Semilla), con reversión.
6. Pruebas: tabla de casos en Vitest y SQL; camino real en BEGIN…ROLLBACK (pegar salida).
7. UI: página en pausa, avisos en el panel, super, textos.
8. Playwright: página en pausa, panel en pausa, landing sin Semilla (375 y 1280).
9. Lint, Vitest (método con clave simulada), build.
10. Push sin merge → revisión de Claude.
11. Aplicar la migración con el **interruptor apagado** → Claude verifica que nada cambió en público → merge de Jack → prueba con `zz-f57-pausa` → encender el interruptor → Claude verifica.
12. El día D, Jack avisa a las Semilla (Claude redacta el mensaje). El día S, Claude verifica la transición.
