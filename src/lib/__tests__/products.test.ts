import { describe, it, expect } from "vitest";
import {
  isPlaceholderOrFilename,
  isProductIncomplete,
  getIncompleteReason,
} from "../products";

describe("isPlaceholderOrFilename", () => {
  it("detecta nombres vacíos o solo espacios como placeholder", () => {
    expect(isPlaceholderOrFilename("")).toBe(true);
    expect(isPlaceholderOrFilename("   ")).toBe(true);
    expect(isPlaceholderOrFilename(null)).toBe(true);
    expect(isPlaceholderOrFilename(undefined)).toBe(true);
  });

  it("detecta nombres de archivo de cámara o teléfono (dikalzaflex, tejidos-jic)", () => {
    expect(isPlaceholderOrFilename("IMG 8090")).toBe(true);
    expect(isPlaceholderOrFilename("IMG_8091")).toBe(true);
    expect(isPlaceholderOrFilename("img-8092")).toBe(true);
    expect(isPlaceholderOrFilename("Image1 2026373986596")).toBe(true);
    expect(isPlaceholderOrFilename("WhatsApp Image 2026-09-01")).toBe(true);
    expect(isPlaceholderOrFilename("DSC_0001")).toBe(true);
    expect(isPlaceholderOrFilename("PXL_20260925_120000")).toBe(true);
  });

  it("detecta nombres formados solo por números o códigos de archivo", () => {
    expect(isPlaceholderOrFilename("8090")).toBe(true);
    expect(isPlaceholderOrFilename("2026373986596")).toBe(true);
    expect(isPlaceholderOrFilename("12-34-56")).toBe(true);
  });

  it("acepta nombres comerciales legítimos", () => {
    expect(isPlaceholderOrFilename("Vestido Floral de Seda")).toBe(false);
    expect(isPlaceholderOrFilename("Zapatillas Nike Air Max")).toBe(false);
    expect(isPlaceholderOrFilename("Hamburguesa Doble Carne")).toBe(false);
    expect(isPlaceholderOrFilename("iPhone 15 Pro Max 256GB")).toBe(false);
  });
});

describe("isProductIncomplete", () => {
  it("un producto de ejemplo no se marca como incompleto", () => {
    expect(
      isProductIncomplete({
        name: "Producto de Ejemplo 1",
        price: 49.9,
        isSample: true,
      })
    ).toBe(false);
  });

  it("marca como incompleto si el nombre es de archivo aunque tenga precio", () => {
    expect(
      isProductIncomplete({
        name: "IMG 8090",
        price: 49.9,
        isSample: false,
      })
    ).toBe(true);
  });

  it("marca como incompleto si no tiene precio aunque el nombre sea real", () => {
    expect(
      isProductIncomplete({
        name: "Vestido Rojo",
        price: null,
        isSample: false,
      })
    ).toBe(true);
    expect(
      isProductIncomplete({
        name: "Vestido Rojo",
        price: undefined,
        isSample: false,
      })
    ).toBe(true);
  });

  it("no marca como incompleto si tiene nombre real y precio válido", () => {
    expect(
      isProductIncomplete({
        name: "Vestido Rojo",
        price: 59.9,
        isSample: false,
      })
    ).toBe(false);
  });
});

describe("getIncompleteReason", () => {
  it("determina la causa exacta de producto incompleto", () => {
    expect(getIncompleteReason({ name: "IMG 8090", price: null })).toBe("ambos");
    expect(getIncompleteReason({ name: "IMG 8090", price: 50 })).toBe("nombre");
    expect(getIncompleteReason({ name: "Vestido", price: null })).toBe("precio");
    expect(getIncompleteReason({ name: "Vestido", price: 50 })).toBe(null);
  });
});
