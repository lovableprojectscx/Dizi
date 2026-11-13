# Spec: Pedidos por WhatsApp

## Propósito
Convertir el carrito del comprador o la consulta de producto en un mensaje de WhatsApp codificado hacia el número del comercio o del vendedor seleccionado, y opcionalmente generar un enlace web detallado (`/pedido/:code`) para tiendas Pro e Ilimitado. Cubre RF-02, RF-39, RF-39b, RF-42.7 y F51.

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

### Requisito: Link de pedido detallado por WhatsApp (`/pedido/:code`) (F51)
Cuando una tienda en plan efectivo **Pro** o **Ilimitado** habilite `stores.order_link_enabled` desde `/admin/configuracion` (apagado por defecto en tiendas existentes), al enviar un pedido desde el carrito por WhatsApp el sistema DEBE:
1. Preabrir la ventana de WhatsApp síncronamente para evitar bloqueos de popups en móvil.
2. Invocar la RPC `create_public_order` (`SECURITY DEFINER`), que valida tienda, plan efectivo, productos y precios en servidor, aplica idempotencia de 15 s ante doble clic, limita envíos diarios anti-spam (1,000 Pro / 3,000 Ilimitado), compacta rutas de Storage en JSONB, genera un código aleatorio de 10 caracteres (`extensions.gen_random_bytes(10)`) y asigna vigencia `expires_at` (**90 días Pro · 180 días Ilimitado**).
3. Anexar `\n\n→ Ver pedido detallado: https://<origen>/pedido/<CODIGO>` al final del mensaje de WhatsApp (conservando el listado completo de productos antes de la firma opcional de Dizi y evitando emojis de 4 bytes que WhatsApp Desktop/wa.me puede corromper como `U+FFFD`) y mostrar acceso directo en `SuccessModal`.
4. Renderizar `/pedido/:code` con fotos en miniatura vía CDN Bunny (`getThumbnailUrl(item.image)`), variación, precio unitario/mayorista, ahorro por mayor, vendedor, checklist de empaque local (`localStorage`), copia de resumen y **PDF generativo 100 % en cliente (`window.print()`, 0 bytes en servidor)**.
5. Limpiar lotes vencidos (`expires_at <= now()`) semanalmente con `cleanup_expired_orders` vía `pg_cron`.

#### Escenario: Envío con Link de Pedido activado (Pro/Ilimitado)
- **Dado** una tienda Pro con `order_link_enabled = true` y productos en el carrito
- **Cuando** el comprador pulsa "Enviar pedido por WhatsApp"
- **Entonces** se registra el pedido en `public.orders` con `expires_at` a 90 días, el mensaje hacia `wa.me` incluye la lista habitual más `→ Ver pedido detallado: .../pedido/<CODIGO>`, y `SuccessModal` ofrece el botón "Ver link de pedido detallado".

#### Escenario: Opción apagada o plan inferior (Semilla/Emprendedor)
- **Dado** una tienda con `order_link_enabled = false` o con plan efectivo Semilla/Emprendedor
- **Cuando** el comprador envía su pedido por WhatsApp
- **Entonces** no se invoca `create_public_order`, no se guarda fila en `orders` y el mensaje de WhatsApp conserva exactamente el formato estándar sin `/pedido/`.

#### Escenario: Pedido expirado o inexistente
- **Dado** un código inexistente o un pedido cuyo `expires_at` ya venció
- **Cuando** el dueño o comprador abre `/pedido/:code`
- **Entonces** `get_public_order` retorna `NULL` y la ruta muestra el estado amigable "Pedido no encontrado".

## Trazabilidad
Casos de prueba: CP-05 · E2E-03 · Vitest: `wholesale.test.ts`, `whatsapp.test.ts`, `sellers.test.ts`, `order-link.test.ts` · Playwright: `tests/e2e/link-pedido.spec.ts` · Código: `src/lib/whatsapp.ts`, `src/lib/wholesale.ts`, `src/lib/sellers.ts`, `src/lib/order-link.ts`, `src/routes/pedido.$code.tsx`, `src/routes/admin.configuracion.tsx`, `src/components/public/PublicCatalog.tsx`, `src/components/public/SellerSelectorDialog.tsx`, migración `20261112200000_order_link_whatsapp.sql`.
