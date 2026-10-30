# Spec: Pedidos por WhatsApp

## Propósito
Convertir el carrito del comprador o la consulta de producto en un mensaje de WhatsApp codificado hacia el número del comercio o del vendedor seleccionado. Cubre RF-02, RF-39, RF-39b y RF-42.7.

## Requisitos

### Requisito: Construcción del enlace wa.me (RF-02)
El sistema DEBE construir la URL `https://wa.me/<telefono>?text=<mensaje>` con el teléfono normalizado (solo dígitos) y el mensaje URL-encoded con el desglose del pedido o la consulta del producto.

#### Escenario: Mensaje codificado
- **Dado** un carrito con 1x "Torta de Chocolate (S/ 45.00)" y 2x "Cupcake Red Velvet (S/ 12.00)"
- **Cuando** el comprador llena sus datos ("Juan Pérez") y pulsa "Pedir por WhatsApp"
- **Entonces** la URL codifica caracteres especiales y espacios (ej. `Juan%20P%C3%A9rez`).

#### Escenario: Normalización del teléfono
- **Dado** que el comercio configuró "+51 988-777-666"
- **Cuando** se genera el enlace
- **Entonces** el teléfono queda exactamente `51988777666`.

### Requisito: Enrutamiento a Múltiples Vendedores (F39, F39b)
Cuando una tienda cuente con dos o más vendedores activos (`resolveActiveSellers(store).length > 1`) en planes Pro o Ilimitado, al hacer clic en "Pedir por WhatsApp", "Consultar" o enlaces de contacto, el sistema DEBE desplegar un diálogo modal interactivo (Dialog con Portal) para que el comprador elija a qué vendedor dirigir su mensaje.
- El vendedor principal puede ser apagado siempre que quede al menos un vendedor activo en la tienda.
- Si solo existe un vendedor activo o la tienda opera en plan Semilla/Emprendedor (o plan vencido que superó días de gracia), el sistema DEBE abrir el enlace directo de WhatsApp con el vendedor activo/principal sin mostrar el selector.

#### Escenario: Selección de vendedor en carrito con múltiples asesores
- **Dado** una tienda Pro con 2 vendedores activos ("Dianis" principal y "Luisa" secundaria)
- **Cuando** el cliente presiona "Pedir por WhatsApp"
- **Entonces** se despliega el modal de selección de asesor permitiendo elegir entre Dianis y Luisa antes de abrir la aplicación de WhatsApp.

#### Escenario: Canalización directa con un solo vendedor activo
- **Dado** una tienda con un único vendedor habilitado o con plan Semilla
- **Cuando** el cliente pulsa el botón de pedido
- **Entonces** se genera y abre directamente el enlace hacia ese número sin modal intermediario.

### Requisito: Formato de líneas con precio por mayor y ahorro total (RF-42.7)
Cuando una línea del pedido alcance un nivel de precio por mayor, el mensaje DEBE reflejar el desglose con `"• <Producto> x<N> — S/ <Subtotal> (<N> u. × S/ <PrecioMayor> precio por mayor)"` y totalizar el ahorro global con `"\nAhorro por mayor: -S/ <AhorroTotal>"` antes del total. Si el interruptor de precios por mayor está apagado o no se alcanza ningún nivel, el mensaje DEBE ser idéntico al estándar byte a byte.

#### Escenario: Pedido con precio por mayor aplicado
- **Dado** una tienda con precios por mayor activos y un producto "Polo Oversize" (S/ 35 base, nivel desde 3 u. a S/ 28 c/u)
- **Cuando** el cliente añade 3 unidades y presiona "Pedir por WhatsApp"
- **Entonces** la línea del producto indica `• Polo Oversize x3 — S/ 84.00 (3 u. × S/ 28.00 precio por mayor)` y se añade `Ahorro por mayor: -S/ 21.00`.

## Trazabilidad
Casos de prueba: CP-05 · E2E-03 · Vitest: `wholesale.test.ts`, `whatsapp.test.ts`, `sellers.test.ts` · Código: `src/lib/whatsapp.ts`, `src/lib/wholesale.ts`, `src/lib/sellers.ts`, `src/components/public/PublicCatalog.tsx`, `src/components/public/SellerSelectorDialog.tsx`.
