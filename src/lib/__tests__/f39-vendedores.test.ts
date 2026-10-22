import { describe, it, expect } from "vitest";
import { buildSellerMessage, buildWaUrl } from "../whatsapp";
import { getMaxSellers, PLANS, type Store, type Seller } from "../types";

describe("F39: Varios Vendedores (WhatsApp Múltiple)", () => {
  describe("1. buildSellerMessage - Saludo personalizado sin duplicar 'Hola'", () => {
    it("saluda por el nombre si el mensaje empieza con 'Hola,'", () => {
      const msg = "Hola, me interesa el producto: Zapatillas Urbanas";
      const result = buildSellerMessage("Dianis", msg);
      expect(result).toBe("Hola Dianis, me interesa el producto: Zapatillas Urbanas");
    });

    it("saluda por el nombre si el mensaje empieza con 'Hola <Tienda>,'", () => {
      const msg = "Hola Adornia, tengo una consulta.";
      const result = buildSellerMessage("Dianis", msg);
      expect(result).toBe("Hola Dianis, tengo una consulta.");
    });

    it("no duplica 'Hola' en ningún caso", () => {
      expect(buildSellerMessage("Luisa", "Hola")).toBe("Hola Luisa");
      expect(buildSellerMessage("Luisa", "Hola!")).toBe("Hola Luisa");
      expect(buildSellerMessage("Luisa", "hola, quiero hacer un pedido")).toBe(
        "Hola Luisa, quiero hacer un pedido",
      );
    });

    it("agrega el saludo en minúscula si el mensaje no empieza con Hola", () => {
      const msg = "Quiero consultar disponibilidad";
      const result = buildSellerMessage("Estefany", msg);
      expect(result).toBe("Hola Estefany, quiero consultar disponibilidad");
    });

    it("devuelve 'Hola <Nombre>' si el mensaje es vacío o nulo", () => {
      expect(buildSellerMessage("Dianis", "")).toBe("Hola Dianis");
      expect(buildSellerMessage("Dianis", undefined)).toBe("Hola Dianis");
    });

    it("conserva el mensaje original si no se proporciona nombre", () => {
      expect(buildSellerMessage("", "Hola, consulta")).toBe("Hola, consulta");
    });
  });

  describe("2. getMaxSellers - Límites por plan contando el principal", () => {
    it("Semilla permite 1 (solo el principal)", () => {
      expect(getMaxSellers({ plan: "semilla" })).toBe(1);
    });

    it("Emprendedor permite 1 (solo el principal)", () => {
      expect(getMaxSellers({ plan: "emprendedor" })).toBe(1);
    });

    it("Pro permite hasta 3 vendedores en total", () => {
      expect(getMaxSellers({ plan: "pro" })).toBe(3);
    });

    it("Ilimitado permite hasta 5 vendedores en total", () => {
      expect(getMaxSellers({ plan: "ilimitado" })).toBe(5);
    });

    it("Plan Pro vencido con más de 3 días de gracia degrada a 1 (Semilla)", () => {
      const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      expect(getMaxSellers({ plan: "pro", planExpiresAt: pastDate })).toBe(1);
    });

    it("Plan Pro vencido dentro del periodo de gracia (<= 3 días) conserva 3", () => {
      const graceDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
      expect(getMaxSellers({ plan: "pro", planExpiresAt: graceDate })).toBe(3);
    });
  });

  describe("3. Catálogo de planes (PLANS.features)", () => {
    it("Pro incluye 'Varios vendedores (hasta 3)'", () => {
      expect(PLANS.pro.features).toContain("Varios vendedores (hasta 3)");
    });

    it("Ilimitado incluye 'Varios vendedores (hasta 5)'", () => {
      expect(PLANS.ilimitado.features).toContain("Varios vendedores (hasta 5)");
    });

    it("Semilla y Emprendedor NO incluyen varios vendedores", () => {
      expect(PLANS.semilla.features.some((f) => f.includes("vendedores"))).toBe(false);
      expect(PLANS.emprendedor.features.some((f) => f.includes("vendedores"))).toBe(false);
    });
  });

  describe("4. Vendedores inactivos y activos", () => {
    const storeMock: Partial<Store> = {
      id: "store_test",
      name: "Adornia",
      phone: "51925176472",
      countryIso: "PE",
      plan: "pro",
      sellers: [
        { id: "s1", name: "Dianis", phone: "51935555485", countryIso: "PE", active: true },
        { id: "s2", name: "Luisa", phone: "51939980472", countryIso: "PE", active: false },
        { id: "s3", name: "Estefany", phone: "51973322450", countryIso: "PE", active: true },
      ],
    };

    it("un vendedor inactivo no aparece entre los activos", () => {
      const activeExtras = (storeMock.sellers || []).filter((s) => s.active);
      expect(activeExtras.map((s) => s.name)).toEqual(["Dianis", "Estefany"]);
      expect(activeExtras.some((s) => s.name === "Luisa")).toBe(false);
    });

    it("la lista completa de vendedores incluye al principal + activos", () => {
      const activeExtras = (storeMock.sellers || []).filter((s) => s.active);
      const allActive = [
        { id: "main", name: storeMock.name!, phone: storeMock.phone!, isMain: true },
        ...activeExtras,
      ];
      expect(allActive).toHaveLength(3); // Adornia (principal) + Dianis + Estefany
      expect(allActive[0].id).toBe("main");
      expect(allActive[1].name).toBe("Dianis");
      expect(allActive[2].name).toBe("Estefany");
    });
  });

  describe("5. Comportamiento sin vendedores vs con vendedores", () => {
    it("sin vendedores extra, los enlaces se dirigen al número principal con mensaje original", () => {
      const mainPhone = "51925176472";
      const originalMsg = "Hola Adornia, quiero hacer este pedido:\n• 1x Anillo de Oro\nTotal: S/ 150.00";
      const url = buildWaUrl(mainPhone, originalMsg);

      expect(url).toBe(
        `https://wa.me/51925176472?text=${encodeURIComponent(originalMsg)}`,
      );
      // No contiene saludo de vendedor
      expect(url).not.toContain("Dianis");
    });

    it("con vendedor elegido, abre su número específico y saluda por su nombre", () => {
      const seller: Seller = {
        id: "s1",
        name: "Dianis",
        phone: "51935555485",
        countryIso: "PE",
        active: true,
      };
      const originalMsg = "Hola Adornia, quiero hacer este pedido:\n• 1x Anillo de Oro\nTotal: S/ 150.00";
      const customizedMsg = buildSellerMessage(seller.name, originalMsg);
      const url = buildWaUrl(seller.phone, customizedMsg);

      expect(url).toContain("https://wa.me/51935555485");
      expect(customizedMsg).toContain("Hola Dianis, quiero hacer este pedido");
      expect(customizedMsg).not.toContain("Hola Dianis, Hola");
    });
  });

  describe("6. Bloqueo en Panel de Administración según Plan", () => {
    it("en Emprendedor bloquea agregar vendedores (maxExtraSellers === 0)", () => {
      const storeEmprendedor: Partial<Store> = { plan: "emprendedor", sellers: [] };
      const maxTotal = getMaxSellers(storeEmprendedor as Store);
      const maxExtra = Math.max(0, maxTotal - 1);
      const canAdd = (storeEmprendedor.sellers?.length || 0) < maxExtra;

      expect(maxTotal).toBe(1);
      expect(maxExtra).toBe(0);
      expect(canAdd).toBe(false);
    });

    it("en Pro permite hasta 2 vendedores extra (3 en total con principal)", () => {
      const storePro: Partial<Store> = {
        plan: "pro",
        sellers: [{ id: "s1", name: "Dianis", phone: "51935555485", active: true }],
      };
      const maxTotal = getMaxSellers(storePro as Store);
      const maxExtra = Math.max(0, maxTotal - 1);
      const canAdd = (storePro.sellers?.length || 0) < maxExtra;

      expect(maxTotal).toBe(3);
      expect(maxExtra).toBe(2);
      expect(canAdd).toBe(true); // 1 < 2
    });

    it("en Pro bloquea cuando ya se alcanzaron 2 vendedores extra", () => {
      const storeProFull: Partial<Store> = {
        plan: "pro",
        sellers: [
          { id: "s1", name: "Dianis", phone: "51935555485", active: true },
          { id: "s2", name: "Luisa", phone: "51939980472", active: true },
        ],
      };
      const maxTotal = getMaxSellers(storeProFull as Store);
      const maxExtra = Math.max(0, maxTotal - 1);
      const canAdd = (storeProFull.sellers?.length || 0) < maxExtra;

      expect(canAdd).toBe(false); // 2 < 2 es false
    });
  });
});
