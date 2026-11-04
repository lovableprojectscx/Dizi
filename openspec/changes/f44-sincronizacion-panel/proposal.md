# F44 · Sincronización segura del panel (hotfix): propuesta y requisitos

**Estado:** aprobado por Jack (2 nov 2026) · **Prioridad:** urgente (pérdida de datos de clientas que pagan) · **Planes:** todos
**Por qué:** una clienta (jhoselynperu) perdió tallas: el panel muestra S, M, L y XL y la base guarda solo S. El diagnóstico (2 nov), certificado por Claude, encontró que el panel guarda los productos en el navegador, no los vuelve a pedir si ya tiene datos (`admin.tsx:106-110`) y, al guardar, manda la fila completa (`store.ts` upsertProduct). Un dispositivo con datos viejos **pisa** lo nuevo (*lost update*).

## Alcance v1
Datos frescos + guardado parcial + control de versión optimista + quitar el reintento silencioso + el navegador deja de guardar los productos.
**Fuera de la v1:** sincronización en tiempo real (Supabase Realtime) y mezcla automática de cambios.

## Requisitos funcionales
| ID | Requisito |
|---|---|
| RF-44.1 | Al entrar al panel, se muestra lo disponible y **siempre** se consulta la base en segundo plano. Al volver a la pestaña (visible), si pasaron más de 60 s, se consulta de nuevo. |
| RF-44.2 | **Stale-while-revalidate:** el navegador puede seguir guardando los datos para pintar al instante, pero **siempre** se revalidan contra la base al entrar y al volver a la pestaña, y **nunca** se usa el dato guardado para escribir: editar lee fresco (RF-44.3) y todo guardado exige la versión (RF-44.5). Se sube la versión de `persist` para descartar los datos guardados de antes de F44. (Decisión del 3 nov: medir con datos reales dio +1.13 s en Slow 4G al quitar la caché; con SWR no hay penalización). |
| RF-44.3 | Al abrir "Editar", el producto se lee de la base y el formulario se llena con esa versión. |
| RF-44.4 | Guardar un producto existente manda **solo los campos modificados**. Los productos nuevos se insertan completos. |
| RF-44.5 | Cada producto tiene `version` (entero) y `updated_at`. Toda escritura del panel sobre un producto existente exige que su `version` coincida con la leída. Si no coincide: no se guarda nada, se recarga el producto y se avisa "Este producto se modificó desde otro dispositivo. Te mostramos la versión actual; revisa y vuelve a guardar." |
| RF-44.6 | Si la base devuelve un error, se muestra el error real y el panel **no** cambia. Se elimina el reintento que quitaba `variations` y `wholesale_tiers`. |
| RF-44.7 | Reordenar productos manda solo `id` + `sort_order` (+ `version`). |
| RF-44.8 | Mostrar u ocultar un producto manda solo `visible` (+ `version`). |

## Requisitos no funcionales
- **RNF-44.1 Nada más cambia:** el catálogo público, el Bio, el PDF y las funciones públicas siguen idénticos. Quien edita desde un solo dispositivo no nota nada salvo datos frescos.
- **RNF-44.2 Una sola fuente de verdad:** la base. El estado del panel es solo un reflejo.
- **RNF-44.3 Rendimiento:** medir la carga del panel antes y después en `catalogo` (289 productos, solo lectura). Que no empeore más de 1 s en 4G; si empeora, reportarlo antes de seguir.
- **RNF-44.4 Seguridad:** las RLS actuales no cambian; el trigger de versión es `SECURITY INVOKER`.
- **RNF-44.5 Celular primero:** los avisos se leen bien a 375 px.

## Escenarios (cada uno es una prueba con su número)
1. **E1 Datos viejos no pisan:** dado que A guardó las tallas S, M, L y XL, y B tiene datos viejos ([S]), cuando B cambia solo el precio, entonces la base queda con S, M, L y XL y el precio nuevo.
2. **E2 Edición simultánea:** dado que A y B abrieron el mismo producto (versión 5), cuando A guarda (versión 6) y luego B guarda, entonces B recibe el aviso, no se pisa nada y su formulario se recarga.
3. **E3 Error de la base:** dado un error al guardar, entonces se muestra el error y el panel queda igual a la base.
4. **E4 Reordenar:** reordenar no cambia el precio, la visibilidad ni las tallas.
5. **E5 Entrar con datos viejos:** dado un navegador con datos de hace días, al entrar al panel se ven los datos de la base.
6. **E6 Volver a la pestaña:** dado un cambio hecho desde otro dispositivo, al volver a la pestaña (más de 60 s después) se ve el cambio.
7. **E7 Editar abre fresco:** dado un producto cambiado en la base, al abrir "Editar" el formulario muestra la versión de la base.
8. **E8 Visibilidad:** ocultar un producto no toca sus tallas ni su precio.

## Decisiones abiertas para Jack
- Ninguna: la solución estándar (datos frescos + actualización parcial + control de versión optimista) está aprobada. Tiempo real queda para después.
