# F41b · Formato en más diseños: tareas

1. **Paso 0:** ✅ hecho el 4 nov (matriz visual), revisado por Claude y matriz aprobada por Jack.
2. **Rama `f41b-formato-todos-los-disenos`:** rebasar sobre `origin/master` (`6cb6a78`) y copiar estos 3 documentos a `openspec/changes/f41b-formato-en-mas-disenos/`.
3. **Capturas "antes"** desde master de las 8 tiendas de control (RNF-41b.1), a 375 y 1280 px.
4. **Matriz en `DESIGN_SPECS`** (`formatosFoto` y `proporcionBase`) y `getPhotoAspect` leyéndola por id oficial. Borrar las listas duplicadas del Paso 0.
5. **Catálogo** con los 8 diseños conectados.
6. **Selector** con las opciones permitidas por diseño.
7. **Vitest E1–E8** sobre el código real, y **Playwright** `movil-android` con una tienda `zz-audit-*` para E2–E6.
8. **Capturas "después"** con NULL: deben ser idénticas a las de "antes" (comparación píxel por píxel, no por tamaño de archivo).
9. lint, tsc (ningún error nuevo), Vitest con el mismo método antes y después, y build.
10. **Revisión de Claude → merge de Jack** (sin migración) → verificación en vivo → borrar la tienda `zz-audit-*`.
11. **Cierre:** actualizar `openspec/specs`, `REQUISITOS-FUNCIONALES.md`, `CONTEXTO-DIZI-ACTUAL.md` y el mapa.
