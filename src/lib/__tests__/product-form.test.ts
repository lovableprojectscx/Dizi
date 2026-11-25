import { describe, it, expect } from "vitest";
import {
  initialPriceState,
  usedOptionsCount,
  needsConsultConfirm,
  validateEssentials,
  countBulkWithoutPrice,
} from "../product-form";
import { getProductNameExample } from "../rubros";

describe("F56 · product-form (lógica pura)", () => {
  it("E1 producto nuevo arranca con precio habilitado, vacío y sin marcar A consultar", () => {
    const state = initialPriceState({ id: "", price: null }, true);
    expect(state).toEqual({ priceInput: "", isConsultOnly: false });
  });

  it("E2 precio escrito 25 no requiere confirmación de A consultar", () => {
    expect(needsConsultConfirm("25", false)).toBe(false);
  });

  it("E3 A consultar marcado no requiere confirmación aunque priceInput esté vacío", () => {
    expect(needsConsultConfirm("", true)).toBe(false);
  });

  it("E4 precio vacío y A consultar sin marcar dispara confirmación", () => {
    expect(needsConsultConfirm("", false)).toBe(true);
    expect(needsConsultConfirm("   ", false)).toBe(true);
  });

  it("E5 producto existente sin precio abre con A consultar marcado", () => {
    const state = initialPriceState({ id: "p_1", price: null }, false);
    expect(state).toEqual({ priceInput: "", isConsultOnly: true });
  });

  it("E5b producto existente con precio abre con su precio y A consultar desmarcado", () => {
    const state = initialPriceState({ id: "p_2", price: 49.9 }, false);
    expect(state).toEqual({ priceInput: "49.9", isConsultOnly: false });
  });

  it("E6 producto con oferta y variaciones cuenta 2 opciones usadas", () => {
    const count = usedOptionsCount({
      id: "p_3",
      isOnSale: true,
      originalPrice: 120,
      variations: [{ id: "v1", name: "Rojo", price: 89.9, image: null }],
      description: "",
      wholesaleTiers: [],
    });
    expect(count).toBe(2);
  });

  it("E7 producto nuevo sin extras tiene 0 opciones usadas", () => {
    const count = usedOptionsCount({
      id: "",
      description: "",
      isOnSale: false,
      variations: [],
      wholesaleTiers: [],
    });
    expect(count).toBe(0);
  });

  it("E7b cuenta descripción, destacado, oferta, variaciones y por mayor hasta 5", () => {
    const count = usedOptionsCount({
      id: "p_4",
      description: "Rosas importadas #destacado",
      isOnSale: true,
      variations: [{ id: "v1", name: "Rojo", price: null, image: null }],
      wholesaleTiers: [{ min_qty: 6, price: 20 }],
    });
    expect(count).toBe(5);
  });

  it("E8 placeholder por rubro: florería devuelve ramo de rosas, sin rubro devuelve ejemplo general", () => {
    expect(getProductNameExample("floreria", true)).toBe("Ej. Ramo de 12 rosas rojas");
    expect(getProductNameExample(undefined, true)).toBe("Ej. iPhone 15 Pro Max 256GB");
    expect(getProductNameExample("general", true)).toBe("Ej. iPhone 15 Pro Max 256GB");
  });

  it("E9 carga masiva cuenta productos sin precio correctamente", () => {
    const count = countBulkWithoutPrice([
      { price: "25.00" },
      { price: "" },
      { price: null },
    ]);
    expect(count).toBe(2);
  });

  it("E15 validateEssentials detecta nombre o categoría faltante", () => {
    expect(validateEssentials("", "cat_1")).toEqual({
      valid: false,
      missingField: "name",
      message: "Falta el nombre",
    });
    expect(validateEssentials("   ", "cat_1")).toEqual({
      valid: false,
      missingField: "name",
      message: "Falta el nombre",
    });
    expect(validateEssentials("Ramo", "")).toEqual({
      valid: false,
      missingField: "category",
      message: "Elige una categoría",
    });
    expect(validateEssentials("Ramo", "cat_1")).toEqual({
      valid: true,
      missingField: null,
      message: null,
    });
  });
});
