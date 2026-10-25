import { describe, it, expect } from "vitest";
import { getDiscount, getOfferBadgeText } from "../discount";
import { mapStoreFromDB } from "../store";

describe("F40 - Pruebas de Renderizado e Integridad de Descuentos", () => {
  describe("1. Regla de Oro: Con interruptor apagado (showDiscountPct = false)", () => {
    it("La etiqueta en todas las tarjetas y banners sigue diciendo exactamente 'Oferta'", () => {
      // Diferentes niveles de descuento
      expect(getOfferBadgeText(80, 100, false)).toBe("Oferta");
      expect(getOfferBadgeText(50, 100, false)).toBe("Oferta");
      expect(getOfferBadgeText(10, 100, false)).toBe("Oferta");
      expect(getOfferBadgeText(96, 100, false)).toBe("Oferta");
    });

    it("Si showDiscountPct es undefined o nulo, preserva 'Oferta'", () => {
      expect(getOfferBadgeText(80, 100, undefined)).toBe("Oferta");
      expect(getOfferBadgeText(80, 100, false)).toBe("Oferta");
    });
  });

  describe("2. Comportamiento con interruptor encendido (showDiscountPct = true)", () => {
    it("Cambia la etiqueta 'Oferta' al porcentaje '-X%' cuando el descuento es >= 5%", () => {
      expect(getOfferBadgeText(80, 100, true)).toBe("-20%");
      expect(getOfferBadgeText(50, 100, true)).toBe("-50%");
      expect(getOfferBadgeText(75, 100, true)).toBe("-25%");
      expect(getOfferBadgeText(10, 100, true)).toBe("-90%");
    });

    it("Si el descuento es menor al 5%, mantiene 'Oferta' (no exagera ni distorsiona)", () => {
      // 100 -> 96 = 4% de descuento (< 5%)
      expect(getOfferBadgeText(96, 100, true)).toBe("Oferta");
      // 100 -> 98 = 2% de descuento (< 5%)
      expect(getOfferBadgeText(98, 100, true)).toBe("Oferta");
    });

    it("Redondeo estricto hacia abajo (floor): nunca exagera el porcentaje", () => {
      // 100 -> 80.40: (100 - 80.4) = 19.6% -> floor = 19%
      expect(getOfferBadgeText(80.4, 100, true)).toBe("-19%");
      // 100 -> 70.90: (100 - 70.9) = 29.1% -> floor = 29%
      expect(getOfferBadgeText(70.9, 100, true)).toBe("-29%");
    });
  });

  describe("3. Detalle de Producto: Cálculo de 'Ahorras S/ X'", () => {
    it("Calcula el monto ahorrado exacto para el modal de producto", () => {
      const discount = getDiscount(80, 100);
      expect(discount).not.toBeNull();
      expect(discount?.saved).toBe(20);

      const discountDecimal = getDiscount(80.4, 100);
      expect(discountDecimal).not.toBeNull();
      expect(discountDecimal?.saved).toBe(19.6);
    });

    it("Retorna null si el descuento es menor al 5% para no mostrar 'Ahorras'", () => {
      expect(getDiscount(96, 100)).toBeNull();
    });
  });

  describe("4. Persistencia y mapeo en Store (mapStoreFromDB)", () => {
    const baseRow: any = {
      id: "store_f40",
      slug: "tienda-f40",
      name: "Tienda F40",
      phone: "987654321",
      plan: "pro",
      active: true,
      is_published: true,
      categories: [],
      products: [],
    };

    it("Tiendas existentes sin show_discount_pct en BD nacen con false (apagado)", () => {
      const store = mapStoreFromDB({ ...baseRow, show_discount_pct: null });
      expect(store.showDiscountPct).toBe(false);
    });

    it("Tienda con show_discount_pct = false se mapea a false", () => {
      const store = mapStoreFromDB({ ...baseRow, show_discount_pct: false });
      expect(store.showDiscountPct).toBe(false);
    });

    it("Tienda con show_discount_pct = true se mapea a true", () => {
      const store = mapStoreFromDB({ ...baseRow, show_discount_pct: true });
      expect(store.showDiscountPct).toBe(true);
    });
  });
});
