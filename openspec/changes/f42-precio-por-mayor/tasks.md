# F42 · Precio por mayor: proceso y tareas

1. **Paso 0 (Antigravity, solo lectura, PARADA):** confirmar la arquitectura contra el código, con las líneas: todas las funciones y consultas que devuelven productos, el `upsert`/`safePayload` de `store.ts`, dónde va cada componente y los mockups HTML (detalle, tarjeta, carrito y editor del panel).
2. **Revisión de Claude + OK de Jack.**
3. **Rama `f42-precio-por-mayor`:**
   1. copiar estos 3 documentos a `openspec/changes/f42-precio-por-mayor/` (proposal.md, design.md, tasks.md);
   2. la migración (archivo, sin aplicar) con el diff de las funciones contra producción;
   3. `wholesale.ts` + sus pruebas (los 8 escenarios de `propuesta.md`, con el código real);
   4. el catálogo (tarjeta, detalle, carrito, mensaje), el PDF y el panel;
   5. las capturas antes y después con el interruptor apagado (deben ser iguales) y las capturas con el interruptor prendido en local;
   6. al cerrar: actualizar `openspec/specs/pedidos-whatsapp/spec.md` y `catalogo-publico/spec.md` con los requisitos nuevos.
4. **Revisión de Claude → merge de Jack → migración con OK y respaldo → verificación en vivo.**
