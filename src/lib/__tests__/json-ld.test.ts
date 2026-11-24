import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { PLANS } from "../types";

describe("index.html JSON-LD Structured Data", () => {
  const htmlPath = path.resolve(__dirname, "../../../index.html");
  const htmlContent = fs.readFileSync(htmlPath, "utf-8");

  // Buscar todos los bloques ld+json
  const scriptRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let softwareAppJson: any = null;
  let match;

  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed["@type"] === "SoftwareApplication") {
        softwareAppJson = parsed;
        break;
      }
    } catch {
      // Ignorar bloques no parseables
    }
  }

  expect(softwareAppJson, "Debe existir un bloque SoftwareApplication en index.html").not.toBeNull();

  it("no debe contener aggregateRating falso o inventado", () => {
    expect(softwareAppJson.aggregateRating).toBeUndefined();
  });

  it("debe contener las 4 ofertas de planes sincronizadas exactamente con PLANS", () => {
    expect(Array.isArray(softwareAppJson.offers)).toBe(true);
    expect(softwareAppJson.offers).toHaveLength(4);

    const offersByName: Record<string, any> = {};
    for (const offer of softwareAppJson.offers) {
      offersByName[offer.name] = offer;
    }

    // F57.2: Plan Semilla ya no se ofrece públicamente; se ofrece Prueba 7 días de Pro gratis
    expect(offersByName["Plan Semilla"]).toBeUndefined();

    // 1. Prueba Pro gratis (7 días)
    const prueba = offersByName["Prueba 7 días de Pro gratis"];
    expect(prueba).toBeDefined();
    expect(Number(prueba.price)).toBe(0);
    expect(prueba.priceCurrency).toBe("PEN");
    expect(prueba.description).toContain("Prueba gratis por 7 días");

    // 2. Plan Emprendedor
    const emprendedor = offersByName["Plan Emprendedor"];
    expect(emprendedor).toBeDefined();
    expect(Number(emprendedor.price)).toBe(PLANS.emprendedor.price);
    expect(emprendedor.priceCurrency).toBe("PEN");
    expect(emprendedor.description).toContain(`${PLANS.emprendedor.productLimit} productos`);

    // 3. Plan Catálogo Pro
    const pro = offersByName["Plan Catálogo Pro"];
    expect(pro).toBeDefined();
    expect(Number(pro.price)).toBe(PLANS.pro.price);
    expect(pro.priceCurrency).toBe("PEN");
    expect(pro.description).toContain(`${PLANS.pro.productLimit} productos`);

    // 4. Plan Ilimitado
    const ilimitado = offersByName["Plan Ilimitado"];
    expect(ilimitado).toBeDefined();
    expect(Number(ilimitado.price)).toBe(PLANS.ilimitado.price);
    expect(ilimitado.priceCurrency).toBe("PEN");
    expect(ilimitado.description).toContain(`${PLANS.ilimitado.productLimit} productos`);
  });
});
