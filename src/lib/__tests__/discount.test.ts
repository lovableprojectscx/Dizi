import { describe, it, expect } from "vitest";
import { getDiscount, getOfferBadgeText } from "../discount";

describe("Lógica de Descuentos F40 - getDiscount", () => {
  it("Caso 1: 100 -> 80 resulta en 20% y S/ 20 de ahorro", () => {
    const res = getDiscount(80, 100);
    expect(res).not.toBeNull();
    expect(res?.pct).toBe(20);
    expect(res?.saved).toBe(20);
  });

  it("Caso 2: 100 -> 80.40 redondea hacia abajo a 19% (nunca se exagera)", () => {
    const res = getDiscount(80.4, 100);
    expect(res).not.toBeNull();
    expect(res?.pct).toBe(19);
    expect(res?.saved).toBe(19.6);
  });

  it("Caso 3: 100 -> 96 es menos de 5% (4%), retorna null", () => {
    const res = getDiscount(96, 100);
    expect(res).toBeNull();
  });

  it("Caso 4: 100 -> 95 es exactamente 5%, es válido", () => {
    const res = getDiscount(95, 100);
    expect(res).not.toBeNull();
    expect(res?.pct).toBe(5);
    expect(res?.saved).toBe(5);
  });

  it("Caso 5: originalPrice <= price retorna null", () => {
    expect(getDiscount(100, 100)).toBeNull();
    expect(getDiscount(120, 100)).toBeNull();
  });

  it("Caso 6: precio 0 o negativo retorna null", () => {
    expect(getDiscount(0, 100)).toBeNull();
    expect(getDiscount(-10, 100)).toBeNull();
    expect(getDiscount(50, 0)).toBeNull();
    expect(getDiscount(50, -10)).toBeNull();
  });

  it("Caso 7: valores nulos o indefinidos retornan null", () => {
    expect(getDiscount(null, 100)).toBeNull();
    expect(getDiscount(50, null)).toBeNull();
    expect(getDiscount(undefined, 100)).toBeNull();
    expect(getDiscount(50, undefined)).toBeNull();
  });
});

describe("Texto de Etiqueta F40 - getOfferBadgeText", () => {
  it("Con interruptor apagado (false): siempre retorna 'Oferta'", () => {
    expect(getOfferBadgeText(80, 100, false)).toBe("Oferta");
    expect(getOfferBadgeText(50, 100, false)).toBe("Oferta");
    expect(getOfferBadgeText(96, 100, false)).toBe("Oferta");
  });

  it("Con interruptor encendido (true) y descuento >= 5%: retorna el porcentaje '-X%'", () => {
    expect(getOfferBadgeText(80, 100, true)).toBe("-20%");
    expect(getOfferBadgeText(50, 100, true)).toBe("-50%");
    expect(getOfferBadgeText(80.4, 100, true)).toBe("-19%");
  });

  it("Con interruptor encendido (true) pero descuento < 5%: retorna 'Oferta'", () => {
    expect(getOfferBadgeText(96, 100, true)).toBe("Oferta");
  });

  it("Con interruptor encendido (true) pero sin descuento válido: retorna 'Oferta'", () => {
    expect(getOfferBadgeText(100, 100, true)).toBe("Oferta");
    expect(getOfferBadgeText(100, null, true)).toBe("Oferta");
  });
});
