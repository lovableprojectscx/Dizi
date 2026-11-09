# F46 · Imágenes para estados: tareas

0. **Jack activa CORS en Bunny** (zona `dizifotos`). Claude verifica que `access-control-allow-origin` llega en una foto real.
1. **Paso 0 (Antigravity, solo lectura, PARADA):**
   - confirmar con archivo:línea cómo se abre un producto con `?p=`, qué tamaños de foto hay en Bunny para un producto (original y miniatura) y cómo obtener la original;
   - confirmar que `qrcode` sirve en el navegador;
   - **mockups reales en canvas** (HTML local) de los 6 estilos × 2 tamaños con 3 productos de `zapatillas-demo` (uno vertical, uno cuadrado y uno horizontal, y uno en oferta) y una tienda en Semilla y otra Pro;
   - probar `navigator.canShare({ files })` en el emulador Android de Playwright y reportar qué pasa.
2. **Revisión de Claude + Jack elige los estilos** (puede descartar o pedir cambios).
3. Rama `f46-imagenes-estados` (worktree aparte), copia a `openspec/changes/`.
4. `styles.ts` + `data.ts` + Vitest de E2, E3, E4 y E7 sobre el código real.
5. Editor, botón en Productos, compartir y descargar.
6. Migración de `share_events` (solo el archivo), si Jack la aprueba.
7. Playwright `movil-android` con tiendas `zz-audit-*` (E1–E8); capturas de las imágenes generadas en `capturas-f46/`.
8. lint, tsc, Vitest con el mismo método y build.
9. Revisión de Claude → migración con OK → merge → verificación en vivo (crear y compartir una imagen real en tu celular) → limpieza → documentación.
