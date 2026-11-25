# F58 · Tareas (Paso 1)

1. Crear rama `f58-pixel-meta` en worktree `wt-f58` desde `master` (`c3bc620`) y paquete en `openspec/changes/f58-pixel-meta/`.
2. Implementar `src/lib/meta-pixel.ts` + pruebas unitarias en `src/lib/__tests__/meta-pixel.test.ts`.
3. Integrar `trackPageView` en `src/routes/__root.tsx`.
4. Integrar `trackLead` y `trackCompleteRegistration` en `src/routes/register.tsx`.
5. Actualizar CSP Report-Only en `vercel.json` y aviso en `src/routes/privacidad.tsx`.
6. Crear y ejecutar `tests/e2e/f58-pixel-meta.spec.ts` (escenarios 1–10 en `movil-android`, interceptando red de Meta y simulando host productivo).
7. Ejecutar `npm run lint`, `npx vitest run`, `npm run build` y `npx tsc --noEmit` (comparando con baseline de 19 errores).
8. Commit, push, informe `capturas-f58/INFORME-F58-paso1.md` y PARADA.
