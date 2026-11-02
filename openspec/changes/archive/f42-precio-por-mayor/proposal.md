# F42 · Precio por mayor: propuesta y requisitos

**Estado:** aprobado por Jack (29 oct 2026) · **Planes:** Emprendedor, Pro e Ilimitado
**Por qué:** los clientes de DIZI venden ropa y zapatillas con la lógica de Gamarra ("por mayor desde 3 unidades"). Tiendanube lo ofrece solo en sus planes altos y el catálogo de WhatsApp Business no lo tiene.

## Alcance v1
- Precio por mayor **por producto**, con **hasta 3 niveles** (cantidad mínima → precio por unidad).
- Las tallas y los colores (las variaciones) del mismo producto **suman juntos**.
- **Fuera de la v1:** el surtido por categoría (mezclar modelos), los precios ocultos por tipo de cliente y los descuentos acumulables.

## Requisitos funcionales
| ID | Requisito |
|---|---|
| RF-42.1 | La tienda prende o apaga "Precios por mayor" en Diseño → Módulos. Apagado por defecto. En Semilla se muestra bloqueado con "Disponible en Emprendedor". |
| RF-42.2 | Con el interruptor prendido, el formulario del producto muestra la sección plegada "Precio por mayor" para cargar de 1 a 3 niveles `{desde N unidades, precio c/u}`, con el % calculado y un simulador ("si te piden 3 → S/ 84"). |
| RF-42.3 | Validaciones: N ≥ 2; los N crecen y los precios bajan de un nivel al siguiente; todos los precios son menores al precio del producto; el producto tiene precio; sin variaciones con precios distintos. Si no se cumple, no se guarda y se dice por qué. |
| RF-42.4 | El detalle del producto muestra la tabla de precios por cantidad con el % de ahorro de cada nivel. |
| RF-42.5 | La tarjeta del catálogo muestra el texto "Precio x mayor" bajo el precio, el mismo en todos los diseños. |
| RF-42.6 | En el carrito, el precio por unidad se calcula con la cantidad total del producto (sumando sus variaciones), usando el mejor nivel alcanzado. Muestra "Agrega N más y pagas S/ X c/u", "Precio por mayor aplicado ✅" y "Ahorraste S/ X". |
| RF-42.7 | El mensaje de WhatsApp muestra cada línea, el subtotal del producto con "N u. × S/ X (precio por mayor)" y el ahorro total. |
| RF-42.8 | El PDF muestra los niveles bajo el precio. |
| RF-42.9 | Precio que se cobra = `min(precio vigente del producto, precio del nivel alcanzado)`. Nunca se suman descuentos. |
| RF-42.10 | Si el plan efectivo es Semilla (o venció, con 3 días de gracia), el catálogo ignora los niveles sin borrarlos. |

## Requisitos no funcionales
- **RNF-42.1 Sin cambios para nadie:** con el interruptor apagado, el catálogo, la tarjeta, el carrito, el mensaje y el PDF son idénticos a hoy, byte a byte en el mensaje y comparando capturas en lo visual.
- **RNF-42.2 Una sola fuente de verdad:** todo cálculo pasa por `src/lib/wholesale.ts`.
- **RNF-42.3 Rendimiento:** el cálculo no hace consultas extra; los niveles llegan con el producto.
- **RNF-42.4 Seguridad:** la validación también corre en el servidor (trigger); el cálculo en el navegador es aceptable porque el pedido se confirma por WhatsApp.
- **RNF-42.5 Accesibilidad:** la tabla es una `<table>` real; los avisos del carrito usan `aria-live="polite"`.

## Escenarios de aceptación (Dado / Cuando / Entonces) → cada uno es una prueba
1. **Apagado = hoy.** Dado el interruptor apagado, cuando se arma un pedido de 3 polos, entonces el mensaje es idéntico al de master.
2. **Suma de tallas.** Dado un polo a S/ 35 con nivel "desde 3 → S/ 28", cuando el carrito tiene 2 M + 1 L, entonces cada unidad cuesta S/ 28, el subtotal es S/ 84 y el ahorro S/ 21.
3. **Falta poco.** Dado el mismo producto con 2 unidades, entonces se muestra "Agrega 1 más y pagas S/ 28 c/u" y el total usa S/ 35.
4. **Mejor nivel.** Dados los niveles 3 → S/ 28 y 12 → S/ 24, cuando hay 12 unidades, entonces se cobra S/ 24.
5. **Oferta contra mayor.** Dado un producto en oferta a S/ 26 con nivel 3 → S/ 28, cuando hay 3 unidades, entonces se cobra S/ 26 y no se muestra "precio por mayor aplicado".
6. **Plan Semilla.** Dada una tienda con plan efectivo Semilla y niveles guardados, entonces el catálogo no muestra ni aplica el precio por mayor.
7. **Validación.** Dado un nivel con un precio mayor o igual al normal, cuando se guarda, entonces se rechaza con un mensaje claro (en el panel y en el servidor).
8. **Variaciones con precios distintos.** Dado un producto con la talla XL a otro precio, entonces la sección se muestra deshabilitada, con su explicación.
