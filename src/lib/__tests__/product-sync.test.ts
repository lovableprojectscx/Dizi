import { describe, it, expect } from "vitest";
import {
  diffProduct,
  toDbPatch,
  isConflict,
  ProductConflictError,
  areJsonEqual,
} from "../product-sync";
import type { Product } from "../types";

describe("F44: Módulo product-sync (lógica pura de sincronización y control optimista)", () => {
  const baseProduct: Product = {
    id: "prod-123",
    name: "Vestido Floral",
    price: 89.9,
    categoryId: "cat-456",
    image: "https://example.com/vestido.webp",
    description: "100% algodón",
    isOnSale: true,
    originalPrice: 120,
    visible: true,
    isSample: false,
    sortOrder: 10,
    tags: ["nuevo", "primavera"],
    variations: [
      { id: "v1", name: "S", price: null, image: null },
      { id: "v2", name: "M", price: null, image: null },
      { id: "v3", name: "L", price: null, image: null },
      { id: "v4", name: "XL", price: null, image: null },
    ],
    wholesaleTiers: [{ min_qty: 6, price: 75 }],
    version: 5,
    updatedAt: "2026-11-03T10:00:00Z",
  };

  describe("diffProduct (RF-44.4: guardado parcial)", () => {
    it("retorna un objeto vacío cuando original y editado son idénticos", () => {
      const edited = { ...baseProduct };
      const diff = diffProduct(baseProduct, edited);
      expect(diff).toEqual({});
      expect(Object.keys(diff).length).toBe(0);
    });

    it("E1: si un dispositivo cambia solo el precio, diff contiene únicamente price y preserva tallas", () => {
      const edited: Product = {
        ...baseProduct,
        price: 99.5,
      };

      const diff = diffProduct(baseProduct, edited);
      expect(diff).toEqual({ price: 99.5 });
      expect(diff.variations).toBeUndefined();
      expect(diff.name).toBeUndefined();
    });

    it("detecta cambios en arrays estructurados como variations", () => {
      const edited: Product = {
        ...baseProduct,
        variations: [
          { id: "v1", name: "S", price: null, image: null },
          { id: "v2", name: "M", price: null, image: null },
        ],
      };

      const diff = diffProduct(baseProduct, edited);
      expect(diff.variations).toHaveLength(2);
      expect(diff.price).toBeUndefined();
    });

    it("detecta cambios en wholesaleTiers y tags", () => {
      const edited: Product = {
        ...baseProduct,
        tags: ["nuevo", "verano"],
        wholesaleTiers: [{ min_qty: 12, price: 70 }],
      };

      const diff = diffProduct(baseProduct, edited);
      expect(diff.tags).toEqual(["nuevo", "verano"]);
      expect(diff.wholesaleTiers).toEqual([{ min_qty: 12, price: 70 }]);
    });

    it("no incluye metadata id, version o timestamps en el diff", () => {
      const edited: Product = {
        ...baseProduct,
        version: 6,
        updatedAt: "2026-11-03T10:30:00Z",
      };

      const diff = diffProduct(baseProduct, edited);
      expect(diff).toEqual({});
    });
  });

  describe("toDbPatch (conversión camelCase a snake_case)", () => {
    it("convierte propiedades parciales a columnas PostgreSQL correspondientes", () => {
      const diff: Partial<Product> = {
        name: "Nombre Nuevo",
        price: 50,
        categoryId: "cat-789",
        isOnSale: false,
        originalPrice: null,
        visible: false,
        sortOrder: 25,
        wholesaleTiers: [{ min_qty: 3, price: 45 }],
      };

      const patch = toDbPatch(diff);
      expect(patch).toEqual({
        name: "Nombre Nuevo",
        price: 50,
        category_id: "cat-789",
        is_on_sale: false,
        original_price: null,
        visible: false,
        sort_order: 25,
        wholesale_tiers: [{ min_qty: 3, price: 45 }],
      });
    });

    it("E4: reordenar productos genera patch solo con sort_order", () => {
      const diff: Partial<Product> = { sortOrder: 50 };
      const patch = toDbPatch(diff);
      expect(patch).toEqual({ sort_order: 50 });
      expect(patch.price).toBeUndefined();
      expect(patch.variations).toBeUndefined();
      expect(patch.visible).toBeUndefined();
    });

    it("E8: alternar visibilidad genera patch solo con visible", () => {
      const diff: Partial<Product> = { visible: false };
      const patch = toDbPatch(diff);
      expect(patch).toEqual({ visible: false });
      expect(patch.price).toBeUndefined();
      expect(patch.variations).toBeUndefined();
    });
  });

  describe("isConflict & ProductConflictError (RF-44.5)", () => {
    it("detecta conflicto cuando rowsAffected es 0", () => {
      expect(isConflict(null, 0)).toBe(true);
      expect(isConflict(null, 1)).toBe(false);
    });

    it("detecta conflicto a partir de instancia ProductConflictError o código PRODUCT_VERSION_CONFLICT", () => {
      const conflictErr = new ProductConflictError();
      expect(isConflict(conflictErr)).toBe(true);
      expect(conflictErr.message).toBe(
        "Este producto se modificó desde otro dispositivo. Te mostramos la versión actual; revisa y vuelve a guardar."
      );
    });

    it("areJsonEqual compara correctamente igualdad profunda en tags y objetos", () => {
      expect(areJsonEqual(["a", "b"], ["a", "b"])).toBe(true);
      expect(areJsonEqual(["a", "b"], ["b", "a"])).toBe(false);
      expect(areJsonEqual(null, null)).toBe(true);
      expect(areJsonEqual(null, undefined)).toBe(false);
    });
  });
});
