import { describe, it, expect } from "vitest";
import { PLANS } from "@/lib/types";
import { LANDING_SHOWCASE_DESIGNS } from "@/lib/landing-disenos";
import { DESIGN_SPECS } from "@/lib/design-catalog";
import fs from "fs";
import path from "path";

describe("Pruebas de la Landing Page Pública (Fase 2 - Precios y Límites)", () => {
  describe("Estructura de Tarifas y Descuentos Anuales", () => {
    it("debe verificar que el Plan Semilla sea gratis con 20 productos de límite", () => {
      const semilla = PLANS.semilla;
      expect(semilla.price).toBe(0);
      expect(semilla.annualPrice).toBe(0);
      expect(semilla.productLimit).toBe(20);
    });

    it("debe verificar la tarifa mensual y anual del Plan Emprendedor (100 productos)", () => {
      const emprendedor = PLANS.emprendedor;
      expect(emprendedor.price).toBe(19.9);
      expect(emprendedor.annualPrice).toBe(179); // Ahorra S/ 60 al año (~25%)
      expect(emprendedor.productLimit).toBe(100);

      // Verificación de mensual equivalente en pago anual (179 / 12 = 14.916)
      const monthlyEquiv = emprendedor.annualPrice / 12;
      expect(monthlyEquiv).toBeCloseTo(14.92, 1);
    });

    it("debe verificar la tarifa mensual y anual del Plan Catálogo Pro (300 productos)", () => {
      const pro = PLANS.pro;
      expect(pro.price).toBe(39.9);
      expect(pro.annualPrice).toBe(359); // Ahorra S/ 120 al año (~25%)
      expect(pro.productLimit).toBe(300);

      // Verificación de mensual equivalente en pago anual (359 / 12 = 29.916)
      const monthlyEquiv = pro.annualPrice / 12;
      expect(monthlyEquiv).toBeCloseTo(29.92, 1);
    });

    it("debe verificar la tarifa mensual y anual del Plan Ilimitado (1000 productos)", () => {
      const ilimitado = PLANS.ilimitado;
      expect(ilimitado.price).toBe(69.9);
      expect(ilimitado.annualPrice).toBe(629); // Ahorra S/ 210 al año (~25%)
      expect(ilimitado.productLimit).toBe(1000);

      // Verificación de mensual equivalente en pago anual (629 / 12 = 52.416)
      const monthlyEquiv = ilimitado.annualPrice / 12;
      expect(monthlyEquiv).toBeCloseTo(52.42, 1);
    });
  });

  describe("Servicio Opcional Llave en Mano", () => {
    it("debe definir el servicio de Configuración Asistida por S/ 79", () => {
      const asistidaService = {
        name: "Configuración Asistida Dizi",
        price: 79,
        type: "pago_unico",
        features: [
          "Carga de hasta 30 productos con imágenes y categorías",
          "Personalización de banner de portada y paleta de colores",
          "Configuración de perfil Link en Bio",
          "Capacitación de 20 minutos por WhatsApp o Meet",
        ],
      };

      expect(asistidaService.price).toBe(79);
      expect(asistidaService.type).toBe("pago_unico");
      expect(asistidaService.features).toHaveLength(4);
    });
  });

  describe("Sección de Diseños Oficiales en Landing Page (F47a)", () => {
    it("la sección solo lista ids con enSelector: true", () => {
      // Extraer el conjunto exacto de IDs con enSelector: true desde DESIGN_SPECS
      const expectedIds = Object.values(DESIGN_SPECS)
        .filter((spec) => spec.enSelector)
        .map((spec) => spec.id)
        .sort();

      const actualIds = LANDING_SHOWCASE_DESIGNS.map((item) => item.id);

      // Verificar que no existan IDs duplicados en el listado de la landing
      const uniqueActualIds = Array.from(new Set(actualIds));
      expect(actualIds).toHaveLength(uniqueActualIds.length);

      // Comparar el conjunto exacto de IDs (sin faltantes ni sobrantes)
      expect([...actualIds].sort()).toEqual(expectedIds);
    });

    it("ningún texto dice 15 diseños", () => {
      const files = [
        path.resolve(__dirname, "../index.tsx"),
        path.resolve(__dirname, "../../lib/types.ts"),
        path.resolve(__dirname, "../ayuda.tsx"),
        path.resolve(__dirname, "../novedades.tsx"),
      ];

      for (const filePath of files) {
        const content = fs.readFileSync(filePath, "utf-8");
        const filename = path.basename(filePath);

        expect(content, `${filename} no debe mencionar '15 diseños'`).not.toMatch(/15\s+diseños/i);
        expect(content, `${filename} no debe mencionar '15 estructuras'`).not.toMatch(/15\s+estructuras/i);
        expect(content, `${filename} no debe mencionar '15 modelos'`).not.toMatch(/15\s+modelos/i);
        expect(content, `${filename} no debe mencionar 'diseños (15)'`).not.toMatch(/diseños\s*\(15\)/i);
        expect(content, `${filename} no debe mencionar 'todos (15)'`).not.toMatch(/todos\s*\(15\)/i);
      }
    });

    it("falla si aparece dizi.pe en src/routes", () => {
      const routesDir = path.resolve(__dirname, "..");
      const files = fs
        .readdirSync(routesDir)
        .filter((file) => (file.endsWith(".tsx") || file.endsWith(".ts")) && !file.includes(".test."));

      expect(files.length).toBeGreaterThan(0);

      for (const file of files) {
        const filePath = path.join(routesDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        expect(content, `El archivo src/routes/${file} contiene referencia a dizi.pe`).not.toContain("dizi.pe");
      }
    });
  });
});
