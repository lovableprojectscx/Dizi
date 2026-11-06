# F45 · Primera impresión: tareas

1. **Paso 0 (Antigravity, solo lectura, PARADA):**
   - qué dibuja hoy cada diseño del selector arriba de los productos cuando no hay banner, con archivo:línea y una captura a 375 px de una tienda real de cada diseño;
   - dónde se usa `banner_tagline` y `banner_title` hoy;
   - lista de tiendas sin portada visible hoy (slug, plan, diseño) con SQL real: son las que cambiarían;
   - cómo se ubica hoy la publicidad de Dizi con 1, 3 y 5 productos en cada diseño;
   - mockups HTML a 375 y 1280 px de la portada de marca en 3 diseños (Grilla, Arch y Nature), con un color claro, uno oscuro y uno intermedio, y de la franja de contacto.
2. **Revisión de Claude + decisiones de Jack** (portada en Semilla, publicidad, eslóganes).
3. Rama `f45-primera-impresion` (después del merge de F41b), copia de estos documentos a `openspec/changes/`.
4. `brand-cover.ts` + Vitest de E1, E2, E4, E6 y E7 sobre el código real.
5. `BrandCover`, publicidad, franja de contacto, asistente y paletas del registro.
6. Capturas antes y después: idénticas en las tiendas con portada con foto; lista de tiendas que cambian con sus capturas, para el OK de Jack.
7. Playwright `movil-android` con tiendas `zz-audit-*` (E1–E9). lint, tsc, Vitest con el mismo método y build.
8. Revisión de Claude → OK de Jack tienda por tienda → merge → verificación en vivo → limpieza → documentación.
