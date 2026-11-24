# F57 · Sin plan gratis: prueba Pro → elegir plan → catálogo en pausa

**Estado:** 📝 Propuesta (23 nov 2026). Decisiones de Jack (23 nov): sí a las tres (pausar también a quienes pagan y no renuevan; aviso de 15 días a las Semilla; va antes que F56). **Condición de Jack: tiene que tener sus pruebas y certificarse que funciona.**

## Por qué (datos del 20–23 nov)
- **Semilla no convierte:** 52 tiendas, 710 visitas entre todas (una sola tienda pagada tiene 54 560), 5 con 10 clics o más y 10 tocadas en 14 días. Los que pagan llegan ya decididos (pagan el día 0 o 1).
- **No hay apuro por renovar:** Milance, Evka y Giosathi vencieron y ninguna renovó. Si no pagan, caen a Semilla y su catálogo sigue en línea.
- **Datos externos:**
  - El plan gratis para siempre convierte cerca de 2,6–3,7 %, y solo compensa con mucho volumen.
  - La prueba completa por tiempo limitado convierte mejor.
  - Tiendanube da 7 días de prueba y su plan gratis solo existe en sus mercados grandes (Argentina, México).
  - El catálogo gratis de WhatsApp Business ya cubre a quien no quiere pagar.

## Regla nueva (una sola, para todas las tiendas)
| Estado | Cuándo | Qué ve el público | Qué ve la dueña |
|---|---|---|---|
| **Activa** | Plan pagado o prueba vigente | Catálogo normal | Panel normal |
| **Gracia** | Hasta 3 días después de vencer (igual que hoy) | Catálogo normal | Aviso "Tu plan venció, renueva para no pausar" |
| **En pausa** | Más de 3 días vencida | Página "en pausa": nombre y logo de la tienda, "Este catálogo está en pausa", botón **"Escribir por WhatsApp"** a la tienda y sello pequeño de DIZI. Sin productos. | Panel abierto, puede editar; aviso fijo "Tu catálogo está en pausa. Reactívalo desde S/ 19.90" con botón a Mi Plan |

- **Nada se borra:** productos, link y configuración quedan intactos. El link (slug) **no se libera**.
- **Se reactiva** como hoy: Jack extiende el plan desde el super. Al instante vuelve a "Activa".
- **No se pausan nunca:** demos (`*-demo`), tiendas internas (Ilimitado internas) ni `zz-*`.

## Transición
1. **Tiendas nuevas:** ya nacen en Pro de 7 a 14 días (F55). Al terminar, y después de la gracia, pasan a **pausa** (ya no a Semilla).
2. **Tiendas que pagan:** si vencen después del despliegue de F57 y no renuevan, se pausan a los 3 días.
3. **Las 52 Semilla y las pagadas que ya cayeron a Semilla antes del despliegue:**
   - **Día D** (despliegue): aviso en su panel y mensaje de Jack por WhatsApp: "El plan gratis termina el {S}. Ese día te regalamos 7 días de Pro; después eliges tu plan".
   - **Día S = D + 15:** todas pasan a **Pro en prueba por 7 días** y luego siguen la regla normal: gracia de 3 días y pausa. En total tienen 25 días desde el aviso.
4. **Interruptor de seguridad:** un valor de configuración en la base (`pausa_activa`) que, si se apaga, hace que **nadie** se vea en pausa (vuelve al comportamiento de hoy) sin redeploy.

## Textos de venta
- **Landing:** se quita la tarjeta Semilla.
  - El botón principal dice "Prueba 7 días gratis".
  - La pregunta frecuente dice: "Sí: 7 días de Pro gratis, sin tarjeta. Después eliges tu plan desde S/ 19.90; si no, tu catálogo queda en pausa (no se borra nada)".
- **Registro y celebración:** mismo mensaje.
- **Mi Plan:** sin Semilla.

## Requisitos funcionales
| RF | Descripción |
|---|---|
| RF-57.1 | Función de base `store_access_state(store)` → `'activa' | 'gracia' | 'pausa'`, única fuente de verdad. La usan `get_public_store`, `effective_product_limit` y el cliente (espejo en TS con la misma tabla de casos). |
| RF-57.2 | `get_public_store` con estado `pausa` devuelve solo lo necesario para la página en pausa (nombre, logo, WhatsApp, colores), sin productos. Igual para Link en Bio. |
| RF-57.3 | Página pública "en pausa" (catálogo y bio), `noindex`. |
| RF-57.4 | Panel en pausa: aviso fijo + botón a Mi Plan; la edición sigue permitida. |
| RF-57.5 | Aviso de transición para Semilla (días que faltan hasta S) en el panel. |
| RF-57.6 | Tarea programada o lógica por fecha que el día S pase las Semilla a Pro en prueba por 7 días (idempotente, con registro). |
| RF-57.7 | Interruptor `pausa_activa` en una tabla de configuración (solo super lo cambia). |
| RF-57.8 | Excepciones: demos, internas y `zz-*` nunca en pausa. |
| RF-57.9 | Textos de landing, registro, celebración, Mi Plan y Ayuda sin Semilla. |
| RF-57.10 | El super ve el estado de cada tienda (activa, gracia o pausa) en su lista. |

## Pruebas y certificación (obligatorias, por pedido de Jack)
1. **Tabla de casos** (Vitest + SQL iguales): plan pagado vigente; vencido hace 2 días; vencido hace 4 días; prueba vigente; prueba vencida hace 4 días; Semilla antes de S; Semilla después de S (en prueba); demo; `zz-`; interruptor apagado. Cada caso con el estado esperado, en TS **y** en la función SQL.
2. **Camino real en la base** (BEGIN…ROLLBACK, usuario simulado): `get_public_store` devuelve la versión en pausa solo cuando corresponde; `initialize_store` + F55 siguen iguales; reactivar (extender plan como super) devuelve el catálogo completo.
3. **Antes del merge:** revisar con lectura que **las 8 tiendas que pagan** y **las 4 en prueba** quedarían "activa", y cuántas quedarían en pausa el día S (solo números).
4. **Después de aplicar (en vivo):**
   - Con el interruptor **apagado** primero, verificar que todo se ve igual que hoy (catálogos de las tiendas pagadas responden normal).
   - Luego, con una tienda **`zz-f57-pausa`** vencida a propósito, comprobar la página en pausa y su reactivación.
   - Recién ahí, encender el interruptor.
5. **Plan de vuelta atrás:** respaldo de cada función tocada + script de reversión + el interruptor.

## Fuera de F57
- Cobro en línea.
- Recordatorios automáticos por WhatsApp o correo (los avisos los manda Jack).
- Plan más barato que Emprendedor.
