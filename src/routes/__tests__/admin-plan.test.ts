import { describe, it, expect } from "vitest";
import { PLANS, type Store, getEffectiveProductLimit } from "@/lib/types";

describe("Pruebas del Panel Administrador y SuperAdmin (Fase 3)", () => {
  describe("Cálculo de Consumo y Barras de Límite en Panel Admin", () => {
    it("debe calcular el porcentaje de consumo correcto para un catálogo Semilla de 20 productos", () => {
      const storeSemilla = { plan: "semilla", products: Array(15).fill({}) } as unknown as Store;
      const limit = getEffectiveProductLimit(storeSemilla);
      const used = storeSemilla.products.length;
      const percentage = (used / limit) * 100;

      expect(limit).toBe(20);
      expect(used).toBe(15);
      expect(percentage).toBe(75);
    });

    it("debe calcular el porcentaje de consumo para un catálogo Emprendedor de 100 productos", () => {
      const storeEmprendedor = { plan: "emprendedor", products: Array(80).fill({}) } as unknown as Store;
      const limit = getEffectiveProductLimit(storeEmprendedor);
      const used = storeEmprendedor.products.length;
      const percentage = (used / limit) * 100;

      expect(limit).toBe(100);
      expect(used).toBe(80);
      expect(percentage).toBe(80);
    });

    it("debe calcular el porcentaje de consumo para un catálogo Pro de 300 productos", () => {
      const storePro = { plan: "pro", products: Array(150).fill({}) } as unknown as Store;
      const limit = getEffectiveProductLimit(storePro);
      const used = storePro.products.length;
      const percentage = (used / limit) * 100;

      expect(limit).toBe(300);
      expect(used).toBe(150);
      expect(percentage).toBe(50);
    });

    it("debe calcular el porcentaje de consumo para un catálogo Ilimitado de 1000 productos", () => {
      const storeIlimitado = { plan: "ilimitado", products: Array(250).fill({}) } as unknown as Store;
      const limit = getEffectiveProductLimit(storeIlimitado);
      const used = storeIlimitado.products.length;
      const percentage = (used / limit) * 100;

      expect(limit).toBe(1000);
      expect(used).toBe(250);
      expect(percentage).toBe(25);
    });
  });

  describe("Generador de Invitaciones SuperAdmin (InviteGenerator)", () => {
    it("debe verificar que las tarifas regulares figuren en las opciones de invitación", () => {
      const invitePlanLabels = [
        { plan: "emprendedor", priceText: "S/ 19.90 / mes" },
        { plan: "pro", priceText: "S/ 39.90 / mes" },
        { plan: "ilimitado", priceText: "S/ 69.90 / mes" },
        { plan: "semilla", priceText: "Gratis" },
      ];

      expect(PLANS.emprendedor.price).toBe(19.9);
      expect(PLANS.pro.price).toBe(39.9);
      expect(PLANS.ilimitado.price).toBe(69.9);
      expect(PLANS.semilla.price).toBe(0);

      invitePlanLabels.forEach((item) => {
        expect(PLANS[item.plan as keyof typeof PLANS]).toBeDefined();
      });
    });
  });
});
