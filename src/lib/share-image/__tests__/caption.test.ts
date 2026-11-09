import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  generateCaption,
  getSavedProductEmoji,
  saveProductEmoji,
  DEFAULT_PRODUCT_EMOJI,
  PRODUCT_EMOJI_LIST,
} from "../caption";

describe("F46.2 · Texto bonito al compartir (caption.ts)", () => {
  const baseOptions = {
    storeName: "Kickz Premium",
    productName: "Air Jordan 1 Retro High",
    price: 499.9,
    originalPrice: null,
    isOnSale: false,
    productUrl: "https://dizi.idenza.site/t/kickz?p=aj1-retro",
  };

  describe("1. Plantilla Novedad (“✨ NUEVO en {tienda} ✨”)", () => {
    it("genera el encabezado de novedad y emojis neutros por defecto", () => {
      const text = generateCaption({
        ...baseOptions,
        template: "novedad",
      });

      expect(text).toContain("✨ NUEVO en Kickz Premium ✨");
      expect(text).toContain("🛍️ Air Jordan 1 Retro High");
      expect(text).toContain("💰 S/ 499.90");
      expect(text).toContain("📲 Pídelo aquí 👇");
      expect(text).toContain("https://dizi.idenza.site/t/kickz?p=aj1-retro");
    });

    it("con oferta real muestra el precio actual, precio anterior y porcentaje de descuento", () => {
      const text = generateCaption({
        ...baseOptions,
        price: 89.9,
        originalPrice: 129.9,
        isOnSale: true,
        template: "novedad",
      });

      expect(text).toContain("✨ NUEVO en Kickz Premium ✨");
      expect(text).toContain("💰 S/ 89.90 (Antes: S/ 129.90 · -30%)");
      expect(text).toContain("📲 Pídelo aquí 👇");
    });

    it("con precio 0 o nulo muestra '💬 Precio a consultar' sin símbolo de moneda ni oferta", () => {
      const text = generateCaption({
        ...baseOptions,
        price: 0,
        originalPrice: 100,
        isOnSale: true,
        template: "novedad",
      });

      expect(text).toContain("✨ NUEVO en Kickz Premium ✨");
      expect(text).toContain("💬 Precio a consultar");
      expect(text).not.toContain("S/ 0");
      expect(text).not.toContain("Antes:");
      expect(text).not.toContain("%");
    });
  });

  describe("2. Plantilla Oferta (“🔥 OFERTA en {tienda} 🔥”)", () => {
    it("con oferta real según discount.ts incluye el encabezado de oferta", () => {
      const text = generateCaption({
        ...baseOptions,
        price: 79.9,
        originalPrice: 100,
        isOnSale: true,
        template: "oferta",
      });

      expect(text).toContain("🔥 OFERTA en Kickz Premium 🔥");
      expect(text).toContain("💰 S/ 79.90 (Antes: S/ 100.00 · -20%)");
      expect(text).toContain("📲 Pídelo aquí 👇");
    });

    it("sin oferta real (sin descuento real o pct < 5%) hace fallback a Novedad (no engaña)", () => {
      // Producto con precio normal sin oferta
      const textSinOferta = generateCaption({
        ...baseOptions,
        price: 100,
        originalPrice: null,
        isOnSale: false,
        template: "oferta",
      });

      expect(textSinOferta).not.toContain("🔥 OFERTA");
      expect(textSinOferta).toContain("✨ NUEVO en Kickz Premium ✨");
      expect(textSinOferta).toContain("💰 S/ 100.00");

      // Producto con descuento inferior al 5% (ej. 100 a 98 = 2%)
      const textDescuentoMinimo = generateCaption({
        ...baseOptions,
        price: 98,
        originalPrice: 100,
        isOnSale: true,
        template: "oferta",
      });

      expect(textDescuentoMinimo).not.toContain("🔥 OFERTA");
      expect(textDescuentoMinimo).toContain("✨ NUEVO en Kickz Premium ✨");
      expect(textDescuentoMinimo).toContain("💰 S/ 98.00");
    });

    it("con precio a consultar (price <= 0) hace fallback a Novedad y muestra '💬 Precio a consultar'", () => {
      const text = generateCaption({
        ...baseOptions,
        price: null,
        originalPrice: 200,
        isOnSale: true,
        template: "oferta",
      });

      expect(text).not.toContain("🔥 OFERTA");
      expect(text).toContain("✨ NUEVO en Kickz Premium ✨");
      expect(text).toContain("💬 Precio a consultar");
    });
  });

  describe("3. Plantilla Simple (sin encabezado llamativo)", () => {
    it("empieza directamente con el producto sin encabezado de novedad ni oferta", () => {
      const text = generateCaption({
        ...baseOptions,
        template: "simple",
      });

      expect(text).not.toContain("✨ NUEVO");
      expect(text).not.toContain("🔥 OFERTA");
      expect(text.startsWith("🛍️ Air Jordan 1 Retro High")).toBe(true);
      expect(text).toContain("💰 S/ 499.90");
      expect(text).toContain("📲 Pídelo aquí 👇");
      expect(text).toContain("https://dizi.idenza.site/t/kickz?p=aj1-retro");
    });

    it("con oferta en plantilla Simple muestra desglose de precio y descuento", () => {
      const text = generateCaption({
        ...baseOptions,
        price: 150,
        originalPrice: 200,
        isOnSale: true,
        template: "simple",
      });

      expect(text.startsWith("🛍️ Air Jordan 1 Retro High")).toBe(true);
      expect(text).toContain("💰 S/ 150.00 (Antes: S/ 200.00 · -25%)");
    });
  });

  describe("4. Soporte para 'Emoji de tu producto' y 'Ninguno'", () => {
    it("usa el emoji neutro por defecto 🛍️ si no se especifica", () => {
      const text = generateCaption({
        ...baseOptions,
        productEmoji: undefined,
      });
      expect(text).toContain("🛍️ Air Jordan 1 Retro High");
    });

    it("reemplaza el 🛍️ por el emoji elegido (ej. 👟)", () => {
      const text = generateCaption({
        ...baseOptions,
        productEmoji: "👟",
      });
      expect(text).toContain("👟 Air Jordan 1 Retro High");
      expect(text).not.toContain("🛍️");
    });

    it("soporta otros emojis de la lista (👗, 💍, 🌸, 🍰, 📱, 🎁, 🕯️, 💄, 🏠)", () => {
      for (const item of PRODUCT_EMOJI_LIST) {
        const text = generateCaption({
          ...baseOptions,
          productEmoji: item.emoji,
        });
        expect(text).toContain(`${item.emoji} Air Jordan 1 Retro High`);
      }
    });

    it("con 'none' o 'Ninguno' omite el emoji del producto", () => {
      const textNone = generateCaption({
        ...baseOptions,
        productEmoji: "none",
      });
      expect(textNone).not.toContain("🛍️");
      expect(textNone).toContain("\nAir Jordan 1 Retro High\n");

      const textNull = generateCaption({
        ...baseOptions,
        productEmoji: null,
      });
      expect(textNull).not.toContain("🛍️");
      expect(textNull).toContain("\nAir Jordan 1 Retro High\n");
    });
  });

  describe("5. Enlace del producto y estructura final", () => {
    it("siempre coloca la llamada a la acción y la URL al final con saltos de línea claros", () => {
      const text = generateCaption(baseOptions);
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

      expect(lines[lines.length - 2]).toBe("📲 Pídelo aquí 👇");
      expect(lines[lines.length - 1]).toBe(baseOptions.productUrl);
    });
  });

  describe("6. Persistencia de emoji por tienda en localStorage", () => {
    beforeEach(() => {
      const storage: Record<string, string> = {};
      vi.stubGlobal("localStorage", {
        getItem: vi.fn((key: string) => storage[key] ?? null),
        setItem: vi.fn((key: string, val: string) => {
          storage[key] = val;
        }),
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("recuerda el emoji por storeId y permite recuperarlo", () => {
      saveProductEmoji("store-123", "👗");
      expect(getSavedProductEmoji("store-123")).toBe("👗");
      expect(getSavedProductEmoji("store-456")).toBeNull();
    });

    it("maneja excepciones de localStorage en modo incógnito de forma segura", () => {
      vi.stubGlobal("localStorage", {
        getItem: vi.fn(() => {
          throw new Error("QuotaExceededError");
        }),
        setItem: vi.fn(() => {
          throw new Error("QuotaExceededError");
        }),
      });

      expect(() => saveProductEmoji("store-1", "👟")).not.toThrow();
      expect(getSavedProductEmoji("store-1")).toBeNull();
    });
  });
});
