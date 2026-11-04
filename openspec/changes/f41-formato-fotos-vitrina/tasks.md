# F41 · Formato de fotos + Vitrina: proceso y tareas

1. **Paso 0 (Antigravity, solo lectura):** ✅ hecho el 4 nov y verificado por Claude. Falta copiar los mockups a `04-TECNICA/encargos/capturas-f41/`.
2. **Revisión de los mockups por Claude + OK de Jack.**
3. **Rama `f41-formato-fotos-vitrina` en el worktree `catalog-connect-f41`:**
   1. copiar estos 3 documentos a `openspec/changes/f41-formato-fotos-vitrina/` (proposal.md, design.md, tasks.md);
   2. **capturas "antes"** de master (con las variables de entorno listas): `/t/catalogo`, `/t/jhoselynperu`, `/t/onfeet`, `/bio/milance` y una tienda por cada diseño en uso, a 375 y 1280 px;
   3. migración (solo el archivo, sin aplicar), con el diff de `get_public_store` contra la definición viva;
   4. `photo-format.ts` + Vitest de E1–E6, E8 y E11 **sobre el código real**;
   5. Grilla y Bloom con `getPhotoAspect`, después Vitrina, Lookbook, selector y registro;
   6. Playwright `movil-android` con tiendas `zz-audit-*` para E3, E4, E7, E8, E9 y E10;
   7. **capturas "después"** con `NULL`, que deben ser idénticas a las de "antes" (si hay animaciones, se congelan y se dice);
   8. lint, tsc (ningún error nuevo sobre los 15 que ya hay), Vitest **con el mismo método antes y después** y build.
4. **Revisión de Claude.**
5. **Migración con OK de Jack y respaldo**, antes del merge (es compatible hacia atrás).
6. **Merge de Jack.**
7. **Verificación en vivo:** `/t/catalogo` y `/t/onfeet` sin cambios; prueba en `zz-audit-*` y limpieza.
8. **Cierre:** actualizar `openspec/specs` (catálogo público y diseños), `REQUISITOS-FUNCIONALES.md`, `CONTEXTO-DIZI-ACTUAL.md` y el mapa.
