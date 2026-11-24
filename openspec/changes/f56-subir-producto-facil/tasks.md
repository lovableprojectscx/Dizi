# F56 · Tareas
1. Paso 0 (solo lectura): capturas del formulario actual en Pixel 7 (nuevo, editar sin precio, editar con oferta+variaciones, carga masiva), archivo:línea de cada pieza, y conteo base de productos sin precio por tienda (solo números). PARADA.
2. Revisión de Claude + decisión de Jack (una pantalla o pasos).
3. Rama `f56-subir-producto-facil` (worktree `wt-f56`), paquete a `openspec/changes/`.
4. `product-form.ts` + Vitest (1–8 lógicos).
5. UI en `admin.productos.tsx`.
6. Playwright `movil-android` 1–11 con capturas; 12 en solo lectura; 13 suite existente.
7. lint, vitest, build, tsc. Informe y PARADA → revisión → merge.
8. Verificación en vivo + medición a los 7 días (% productos nuevos con precio).
9. Docs: REQUISITOS, FUENTE, HISTORIAL, mapa.
