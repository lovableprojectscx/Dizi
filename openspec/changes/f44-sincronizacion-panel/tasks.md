# F44 · Sincronización segura del panel: proceso

1. **Paso 0 (Antigravity, solo lectura, PARADA):** confirmar `diseno.md` contra el código, con las líneas; listar **todos** los lugares que leen o escriben `products` desde el panel; confirmar los triggers de `products` en producción (`pg_trigger`); medir la carga actual del panel en `catalogo`.
2. **Revisión de Claude + OK de Jack.**
3. **Rama `f44-sincronizacion-panel`:**
   1. copiar este paquete a `openspec/changes/f44-sincronizacion-panel/`;
   2. la migración (archivo);
   3. `product-sync.ts` + Vitest (E1 a E8, con el código real);
   4. `store.ts`, `admin.tsx` y `admin.productos.tsx`;
   5. **Playwright con 2 navegadores reales** sobre `zz-audit-sync` (crear y borrar) para E1, E2, E5 y E6;
   6. lint, tsc (sin errores nuevos), Vitest y build;
   7. la medición de la carga antes y después.
4. **Revisión de Claude → merge de Jack → `aplicar-migracion` (con OK) → verificación en vivo:** editar un producto en la PC y en el celular y confirmar el aviso.
5. **Cierre:** actualizar `openspec/specs` (seguridad o panel), `REQUISITOS-FUNCIONALES` (F44) y `CONTEXTO-DIZI-ACTUAL`; archivar el change.
