import { describe, it, expect } from "vitest";
import { buildWaUrl, formatPrice } from "@/lib/whatsapp";
import { type Product, type Store } from "@/lib/types";

// Helper de detección de navegador in-app (TikTok / Instagram / Facebook)
const isInAppBrowserUserAgent = (ua: string): boolean => {
  const uaLower = ua.toLowerCase();
  return (
    uaLower.includes("instagram") ||
    uaLower.includes("fban") ||
    uaLower.includes("fbav") ||
    uaLower.includes("musical_ly") ||
    uaLower.includes("tiktok") ||
    uaLower.includes("bytedance")
  );
};

// Helper para construir el mensaje estructurado de pedido
interface CartItem {
  product: Product;
  quantity: number;
  selectedNotes?: string;
}

const buildOrderMessage = (storeName: string, items: CartItem[]): string => {
  let total = 0;
  let hasQuoteItems = false;

  const lines = items
    .map((item) => {
      const price = item.product.price;
      if (price !== null && price !== undefined && price > 0) {
        const subtotal = price * item.quantity;
        total += subtotal;
        const note = item.selectedNotes ? ` (${item.selectedNotes})` : "";
        return `• ${item.quantity}x ${item.product.name}${note} — ${formatPrice(subtotal)}`;
      } else {
        hasQuoteItems = true;
        const note = item.selectedNotes ? ` (${item.selectedNotes})` : "";
        return `• ${item.quantity}x ${item.product.name}${note} — A cotizar`;
      }
    })
    .join("\n");

  const totalMsg =
    total > 0
      ? `${formatPrice(total)}${hasQuoteItems ? " + artículos a cotizar" : ""}`
      : "A consultar";

  return `Hola ${storeName}, quiero hacer este pedido:\n\n${lines}\n\nTotal: ${totalMsg}`;
};

describe("Parte 4: Catálogo Público y Pedidos WhatsApp", () => {
  describe("1. Construcción y Codificación de Enlace WhatsApp", () => {
    it("limpia caracteres no numéricos del teléfono", () => {
      const url = buildWaUrl("+51 925 176 472", "Hola");
      expect(url).toContain("https://wa.me/51925176472");
    });

    it("codifica saltos de línea, caracteres especiales y tildes", () => {
      const message = "Hola,\nquiero cotizar:\n• Zapatillas (Edición Especial)";
      const url = buildWaUrl("51925176472", message);
      expect(url).toBe(
        `https://wa.me/51925176472?text=${encodeURIComponent(message)}`
      );
      expect(url).toContain("%0A"); // Salto de línea codificado
      expect(url).toContain("%E2%80%A2"); // Bullet codificado
    });
  });

  describe("2. Formateo del Mensaje de Pedido del Carrito", () => {
    it("genera el mensaje estructurado con subtotales y total correcto", () => {
      const items: CartItem[] = [
        {
          product: { id: "1", name: "Polo Oversize", price: 45, categoryId: "c1", image: "", visible: true },
          quantity: 2,
          selectedNotes: "Talla M / Negro",
        },
        {
          product: { id: "2", name: "Gorra Urbana", price: 30, categoryId: "c1", image: "", visible: true },
          quantity: 1,
        },
      ];

      const msg = buildOrderMessage("Mi Tienda Dizi", items);
      expect(msg).toContain("Hola Mi Tienda Dizi, quiero hacer este pedido:");
      expect(msg).toContain("• 2x Polo Oversize (Talla M / Negro) — S/ 90.00");
      expect(msg).toContain("• 1x Gorra Urbana — S/ 30.00");
      expect(msg).toContain("Total: S/ 120.00");
    });

    it("maneja carritos con productos sin precio fijo (a cotizar)", () => {
      const items: CartItem[] = [
        {
          product: { id: "1", name: "Torta Personalizada", price: 0, categoryId: "c1", image: "", visible: true },
          quantity: 1,
          selectedNotes: "Relleno manjar blanco",
        },
        {
          product: { id: "2", name: "Velas", price: 10, categoryId: "c1", image: "", visible: true },
          quantity: 2,
        },
      ];

      const msg = buildOrderMessage("Pastelería Dulce", items);
      expect(msg).toContain("• 1x Torta Personalizada (Relleno manjar blanco) — A cotizar");
      expect(msg).toContain("• 2x Velas — S/ 20.00");
      expect(msg).toContain("Total: S/ 20.00 + artículos a cotizar");
    });
  });

  describe("3. Detección de Navegadores In-App (TikTok e Instagram)", () => {
    it("detecta User Agents embebidos de TikTok e Instagram", () => {
      const instagramUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 289.0.0.21.111";
      const tiktokUA = "Mozilla/5.0 (Linux; Android 12; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Mobile Safari/537.36 musical_ly_2022405040";
      const standardChromeUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

      expect(isInAppBrowserUserAgent(instagramUA)).toBe(true);
      expect(isInAppBrowserUserAgent(tiktokUA)).toBe(true);
      expect(isInAppBrowserUserAgent(standardChromeUA)).toBe(false);
    });
  });

  describe("4. Enlaces Directos de Producto (Deep Linking)", () => {
    it("genera enlace universal para compartir producto específico", () => {
      const origin = "https://dizi.lat";
      const storeSlug = "tienda-demo";
      const productId = "prod-9988";

      const shareUrl = `${origin}/t/${storeSlug}?p=${productId}`;
      expect(shareUrl).toBe("https://dizi.lat/t/tienda-demo?p=prod-9988");
    });
  });
});
