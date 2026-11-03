# F43 · Encuesta de calidad: proceso y tareas

1. **Jack decide** las 3 decisiones abiertas de `propuesta.md`.
2. **Paso 0 (Antigravity, solo lectura, PARADA):** ver el encargo.
3. **Revisión de Claude + OK de Jack.**
4. **Rama `f43-encuesta-calidad`:**
   1. copiar estos 3 documentos a `openspec/changes/f43-encuesta-calidad/` (proposal.md, design.md, tasks.md);
   2. la migración (archivo, sin aplicar), partiendo de las definiciones de producción;
   3. `survey.ts` + sus pruebas de Vitest (escenarios 1 a 7 y 13 en lo que es lógica pura, con el nombre del escenario, por ejemplo `"E2 prueba = Semilla"`);
   4. `admin.encuesta.tsx`, la tarjeta del dashboard y `super.encuestas.tsx`;
   5. Playwright en `movil-android` con tiendas `zz-audit-*`: escenarios 1, 3, 4, 5, 6, 7, 9, 10, 11, 14, 15 y 16, contra un entorno donde la migración esté aplicada (si no hay, se dejan escritas y se corren después del merge);
   6. pruebas de los RPC (escenarios 7, 8, 11 y 12) en `tests/integration`;
   7. `npm run lint`, `npx vitest run`, `npm run build`, con la salida real.
5. **Revisión de Claude → merge de Jack → respaldo → migración con OK → Playwright en vivo con `zz-audit` → borrar las tiendas y respuestas de prueba (conteo residual en 0).**
6. **Al cerrar:** `openspec/specs/encuesta-calidad/spec.md` nuevo (y su copia), fila F43 en `REQUISITOS-FUNCIONALES.md`, `FUENTE-DE-VERDAD.md` y `HISTORIAL-DE-CAMBIOS.md`.
