import { describe, it, expect } from "vitest";
import { PLANS } from "@/lib/types";

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
});
