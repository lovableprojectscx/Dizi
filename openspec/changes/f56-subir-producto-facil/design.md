# F56 · Diseño (hipótesis hasta el Paso 0)
- **Sin base de datos.** Solo `src/routes/admin.productos.tsx` y, si conviene, un componente nuevo `src/components/admin/MoreOptionsSection.tsx`.
- **Estado de precio:** separar `isConsultOnly` (booleano) de `priceInput` (texto). Hoy uno depende del otro (`checked={priceInput === ""}`, `:1024`), por eso el nuevo producto nace "A consultar". Al abrir: `isConsultOnly = product.id existe && product.price == null`.
- **Lógica pura:** `src/lib/product-form.ts` → `initialPriceState(product, isNew)`, `usedOptionsCount(product)`, `needsConsultConfirm(priceInput, isConsultOnly)`. Vitest.
- **Placeholder:** reusar la función de `rubros.ts:245-253` (la que devuelve `ejemploProducto` según `niche`).
- **Confirmación:** dentro del Dialog (estado local), nada de `window.confirm`.
- **Riesgo:** `admin.productos.tsx` tiene 3.662 líneas y F44 (sincronización segura) vive ahí: no tocar el guardado ni la detección de cambios (`:627`), solo el estado inicial y el render.
- No en paralelo con nada que toque `admin.productos.tsx`.
