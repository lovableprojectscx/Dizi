# Spec: Pedidos por WhatsApp

## Propósito
Convertir el carrito del comprador en un mensaje de WhatsApp codificado hacia el número del comercio. Cubre RF-02.

## Requisitos

### Requisito: Construcción del enlace wa.me (RF-02)
El sistema DEBE construir la URL `https://wa.me/<telefono>?text=<mensaje>` con el teléfono normalizado (solo dígitos) y el mensaje URL-encoded con el desglose del pedido.

#### Escenario: Mensaje codificado
- **Dado** un carrito con 1x "Torta de Chocolate (S/ 45.00)" y 2x "Cupcake Red Velvet (S/ 12.00)"
- **Cuando** el comprador llena sus datos ("Juan Pérez") y pulsa "Pedir por WhatsApp"
- **Entonces** la URL codifica caracteres especiales y espacios (ej. `Juan%20P%C3%A9rez`)

#### Escenario: Normalización del teléfono
- **Dado** que el comercio configuró "+51 988-777-666"
- **Cuando** se genera el enlace
- **Entonces** el teléfono queda exactamente `51988777666`

## Trazabilidad
Casos de prueba: CP-05 · E2E-03 · Código: `src/lib/whatsapp.ts` (buildWaUrl)
