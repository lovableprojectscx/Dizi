import { describe, it, expect } from "vitest";
import { formatPrice, buildWaUrl } from "../whatsapp";

describe("formatPrice (RF-03)", () => {
  it("CP-01: formatea precio positivo", () => {
    expect(formatPrice(25.5)).toBe("S/ 25.50");
  });

  it("CP-02: precio 0 -> A consultar", () => {
    expect(formatPrice(0)).toBe("A consultar");
  });

  it("CP-03: null/undefined -> A consultar", () => {
    expect(formatPrice(null)).toBe("A consultar");
    expect(formatPrice(undefined)).toBe("A consultar");
  });

  it("CP-04: formatea precio con decimales y redondea (0.005 -> S/ 0.01)", () => {
    expect(formatPrice(0.005)).toBe("S/ 0.01");
  });
});

describe("buildWaUrl (RF-02)", () => {
  it("CP-05: limpia el teléfono y codifica el mensaje", () => {
    expect(buildWaUrl("+51 966-123-456", "Hola ¿precio?")).toBe(
      "https://wa.me/51966123456?text=Hola%20%C2%BFprecio%3F",
    );
  });
});
