import { describe, it, expect } from "vitest";
import { getOrderLinkRetentionDays, planAllowsOrderLink, type Store } from "@/lib/types";
import { mapStoreFromDB } from "@/lib/store";
import { getThumbnailUrl, SUPABASE_STORAGE_IMAGES_PREFIX } from "@/lib/image-utils";
import {
  appendOrderLinkToMessage,
  buildCreateOrderItemsPayload,
  buildOrderUrl,
  expandOrderImageUrl,
  formatOrderSummaryText,
  getOrderLineKey,
  isOrderLinkActiveForStore,
  mapPublicOrderFromDB,
} from "@/lib/order-link";

const makeStore = (overrides: Partial<Store> = {}): Store => ({
  id: "s_test",
  slug: "tienda-test",
  name: "Tienda Test",
  phone: "51999888777",
  countryCode: "51",
  countryIso: "PE",
  plan: "pro",
  active: true,
  createdAt: new Date().toISOString(),
  whatsappClicks: 0,
  categories: [],
  products: [],
  ...overrides,
});

describe("Link de Pedido por WhatsApp (order-link)", () => {
  describe("1. Reglas de plan (Pro e Ilimitado) y valor por defecto", () => {
    it("permite Link de Pedido solo en planes Pro e Ilimitado vigentes", () => {
      const future = new Date(Date.now() + 10 * 86400_000).toISOString();
      expect(planAllowsOrderLink(makeStore({ plan: "semilla" }))).toBe(false);
      expect(planAllowsOrderLink(makeStore({ plan: "emprendedor", planExpiresAt: future }))).toBe(false);
      expect(planAllowsOrderLink(makeStore({ plan: "pro", planExpiresAt: future }))).toBe(true);
      expect(planAllowsOrderLink(makeStore({ plan: "ilimitado", planExpiresAt: future }))).toBe(true);
    });

    it("bloquea el Link de Pedido cuando el plan Pro supera los 3 días de gracia", () => {
      const withinGrace = new Date(Date.now() - 2 * 86400_000).toISOString();
      const expiredGrace = new Date(Date.now() - 5 * 86400_000).toISOString();

      expect(planAllowsOrderLink(makeStore({ plan: "pro", planExpiresAt: withinGrace }))).toBe(true);
      expect(planAllowsOrderLink(makeStore({ plan: "pro", planExpiresAt: expiredGrace }))).toBe(false);
    });

    it("isOrderLinkActiveForStore exige interruptor activo Y plan Pro/Ilimitado", () => {
      const future = new Date(Date.now() + 10 * 86400_000).toISOString();
      expect(isOrderLinkActiveForStore(makeStore({ plan: "pro", planExpiresAt: future }))).toBe(false);
      expect(
        isOrderLinkActiveForStore(
          makeStore({ plan: "pro", planExpiresAt: future, orderLinkEnabled: false }),
        ),
      ).toBe(false);
      expect(
        isOrderLinkActiveForStore(
          makeStore({ plan: "pro", planExpiresAt: future, orderLinkEnabled: true }),
        ),
      ).toBe(true);
      expect(
        isOrderLinkActiveForStore(
          makeStore({ plan: "emprendedor", planExpiresAt: future, orderLinkEnabled: true }),
        ),
      ).toBe(false);
    });

    it("mapStoreFromDB deja orderLinkEnabled en false por defecto y respeta true", () => {
      const baseRow = {
        id: "s_1",
        slug: "test",
        name: "Test",
        phone: "51999111222",
        plan: "pro",
        active: true,
        created_at: new Date().toISOString(),
        categories: [],
        products: [],
      };
      expect(mapStoreFromDB(baseRow).orderLinkEnabled).toBe(false);
      expect(mapStoreFromDB({ ...baseRow, order_link_enabled: true }).orderLinkEnabled).toBe(true);
    });
  });

  describe("2. Construcción de URL y mensaje de WhatsApp", () => {
    it("construye la URL pública normalizada del pedido", () => {
      expect(buildOrderUrl(" ab12cd34ef ", "https://dizi.idenza.site/")).toBe(
        "https://dizi.idenza.site/pedido/AB12CD34EF",
      );
    });

    it("agrega el link al mensaje habitual sin alterar la lista de productos y sin emojis de 4 bytes", () => {
      const baseMsg =
        "Hola Mi Tienda, quiero hacer este pedido:\n\n• Polo x2 — S/ 70.00\n\nTotal: S/ 70.00";
      const result = appendOrderLinkToMessage(baseMsg, "https://dizi.idenza.site/pedido/K7M9P2X4QR");
      expect(result).toBe(
        `${baseMsg}\n\n→ Ver pedido detallado: https://dizi.idenza.site/pedido/K7M9P2X4QR`,
      );
      expect([...result].every((ch) => (ch.codePointAt(0) ?? 0) <= 0xffff)).toBe(true);
    });
  });

  describe("3. Payload hacia servidor y mapeo del detalle de pedido", () => {
    it("genera el payload limpio para create_public_order filtrando cantidades inválidas", () => {
      const payload = buildCreateOrderItemsPayload([
        { product: { id: "p1" }, variationId: "v1", qty: 3 },
        { product: { id: "p2" }, variationId: null, qty: 0 },
        { product: { id: "p3" }, qty: 2.8 },
      ]);
      expect(payload).toEqual([
        { product_id: "p1", variation_id: "v1", qty: 3 },
        { product_id: "p3", variation_id: null, qty: 2 },
      ]);
    });

    it("mapea la respuesta de get_public_order y formatea el resumen con checklist", () => {
      const order = mapPublicOrderFromDB({
        id: "uuid-1",
        code: "K7M9P2X4QR",
        store_id: "s_1",
        store_slug: "mi-tienda",
        store_name: "Mi Tienda",
        seller_name: "Dianis",
        subtotal_regular: 105,
        wholesale_savings: 21,
        total: 84,
        has_quote_items: false,
        created_at: "2026-11-12T20:00:00Z",
        items: [
          {
            product_id: "p1",
            name: "Polo Oversize",
            image: "https://cdn.example.com/polo.webp",
            variation_id: "v1",
            variation_name: "Talla M / Negro",
            qty: 3,
            regular_price: 35,
            unit_price: 28,
            line_total: 84,
            is_wholesale: true,
          },
        ],
      });

      expect(order).not.toBeNull();
      expect(order!.code).toBe("K7M9P2X4QR");
      expect(order!.items[0].isWholesale).toBe(true);

      const checked = new Set([getOrderLineKey(order!.items[0], 0)]);
      const summary = formatOrderSummaryText(order!, checked);
      expect(summary).toContain("Pedido #K7M9P2X4QR — Mi Tienda");
      expect(summary).toContain("Vendedor: Dianis");
      expect(summary).toContain("[✓] Polo Oversize (Talla M / Negro) x3 — S/ 84.00");
      expect(summary).toContain("[S/ 28.00 c/u por mayor]");
      expect(summary).toContain("Ahorro por mayor: -S/ 21.00");
      expect(summary).toContain("Total: S/ 84.00");
    });

    it("expande rutas compactas de Storage para mantener miniaturas _thumb.webp y calcula vigencia por plan", () => {
      const future = new Date(Date.now() + 10 * 86400_000).toISOString();
      expect(getOrderLinkRetentionDays(makeStore({ plan: "semilla" }))).toBe(0);
      expect(getOrderLinkRetentionDays(makeStore({ plan: "emprendedor", planExpiresAt: future }))).toBe(0);
      expect(getOrderLinkRetentionDays(makeStore({ plan: "pro", planExpiresAt: future }))).toBe(90);
      expect(getOrderLinkRetentionDays(makeStore({ plan: "ilimitado", planExpiresAt: future }))).toBe(180);

      const expanded = expandOrderImageUrl("store_1/polo_123.webp");
      expect(expanded).toBe(`${SUPABASE_STORAGE_IMAGES_PREFIX}store_1/polo_123.webp`);
      expect(getThumbnailUrl(expanded)).toContain("_thumb.webp");

      const mapped = mapPublicOrderFromDB({
        id: "uuid-2",
        code: "ABC123DEF4",
        store_id: "store_1",
        store_slug: "tienda",
        store_name: "Tienda",
        created_at: "2026-11-12T20:00:00Z",
        expires_at: "2027-02-10T20:00:00Z",
        items: [{ product_id: "p1", name: "Polo", image: "store_1/polo_123.webp", qty: 1 }],
      });
      expect(mapped!.expiresAt).toBe("2027-02-10T20:00:00Z");
      expect(mapped!.items[0].image).toBe(`${SUPABASE_STORAGE_IMAGES_PREFIX}store_1/polo_123.webp`);
    });
  });
});
