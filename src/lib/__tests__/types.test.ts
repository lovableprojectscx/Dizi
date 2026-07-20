import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import {
  daysSinceExpiry,
  daysUntilExpiry,
  getEffectivePlan,
  getEffectiveProductLimit,
  isSubscriptionExpired,
  modelGraceDaysLeft,
  shouldUseSemillaModel,
  getEffectiveModel,
  isPlanActive,
  getBioLinksLimit,
  canUsePremiumBioFeatures,
  getImageSpec,
  checkImageRatio,
  planAllowsPromoBar,
  Store,
  PlanId,
} from "../types";

// Fijamos la fecha del sistema en una fecha específica para hacer las pruebas deterministas
const FIXED_DATE = new Date("2026-07-07T12:00:00Z");

describe("Pruebas unitarias de Reglas de Suscripción (types.ts)", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  // Helper para construir tiendas de prueba parciales
  const createMockStore = (plan: PlanId, planExpiresAt?: string, model?: string) => {
    return {
      plan,
      planExpiresAt,
      model,
    } as unknown as Store;
  };

  describe("daysSinceExpiry", () => {
    it("debe retornar null si no hay fecha de vencimiento", () => {
      const store = createMockStore("pro");
      expect(daysSinceExpiry(store)).toBeNull();
    });

    it("debe retornar 0 si vence hoy a la misma hora", () => {
      const store = createMockStore("pro", "2026-07-07T12:00:00Z");
      expect(daysSinceExpiry(store)).toBe(0);
    });

    it("debe retornar número de días transcurridos si ya venció", () => {
      const store = createMockStore("pro", "2026-07-04T12:00:00Z");
      expect(daysSinceExpiry(store)).toBe(3);
    });

    it("debe retornar número negativo de días si aún está vigente", () => {
      const store = createMockStore("pro", "2026-07-10T12:00:00Z");
      expect(daysSinceExpiry(store)).toBe(-3);
    });
  });

  describe("daysUntilExpiry", () => {
    it("debe retornar null si no hay fecha de vencimiento", () => {
      const store = createMockStore("pro");
      expect(daysUntilExpiry(store)).toBeNull();
    });

    it("debe retornar días restantes si está vigente", () => {
      const store = createMockStore("pro", "2026-07-10T12:00:00Z");
      expect(daysUntilExpiry(store)).toBe(3);
    });

    it("debe retornar días negativos si ya venció", () => {
      const store = createMockStore("pro", "2026-07-04T12:00:00Z");
      expect(daysUntilExpiry(store)).toBe(-3);
    });
  });

  describe("getEffectivePlan", () => {
    it("debe retornar semilla si el plan original es semilla", () => {
      const store = createMockStore("semilla");
      expect(getEffectivePlan(store)).toBe("semilla");
    });

    it("debe retornar el plan original si no tiene fecha de vencimiento", () => {
      const store = createMockStore("pro");
      expect(getEffectivePlan(store)).toBe("pro");
    });

    it("CP-06: debe retornar el plan original si vence hoy (dentro del periodo de gracia)", () => {
      const store = createMockStore("pro", "2026-07-07T12:00:00Z");
      expect(getEffectivePlan(store)).toBe("pro");
    });

    it("CP-07: debe retornar el plan original si venció hace 3 días (último día de gracia)", () => {
      const store = createMockStore("pro", "2026-07-04T12:00:00Z");
      expect(getEffectivePlan(store)).toBe("pro");
    });

    it("CP-08: debe degradar a semilla si venció hace 4 días (gracia expirada)", () => {
      const store = createMockStore("pro", "2026-07-03T12:00:00Z");
      expect(getEffectivePlan(store)).toBe("semilla");
    });
  });

  describe("getEffectiveProductLimit (CP-09)", () => {
    it("debe retornar el límite del plan semilla para plan semilla", () => {
      const store = createMockStore("semilla");
      expect(getEffectiveProductLimit(store)).toBe(20);
    });

    it("debe retornar el límite del plan original si está vigente", () => {
      const store = createMockStore("pro", "2026-07-10T12:00:00Z");
      expect(getEffectiveProductLimit(store)).toBe(200);
    });

    it("debe retornar el límite del plan semilla si el plan venció y pasó la gracia", () => {
      const store = createMockStore("pro", "2026-07-01T12:00:00Z");
      expect(getEffectiveProductLimit(store)).toBe(20);
    });
  });

  describe("isSubscriptionExpired", () => {
    it("debe retornar false para el plan semilla", () => {
      const store = createMockStore("semilla");
      expect(isSubscriptionExpired(store)).toBe(false);
    });

    it("debe retornar false si no tiene fecha de expiración", () => {
      const store = createMockStore("pro");
      expect(isSubscriptionExpired(store)).toBe(false);
    });

    it("debe retornar false si la fecha de expiración es futura", () => {
      const store = createMockStore("pro", "2026-07-08T12:00:00Z");
      expect(isSubscriptionExpired(store)).toBe(false);
    });

    it("debe retornar true si la fecha de expiración es pasada", () => {
      const store = createMockStore("pro", "2026-07-06T12:00:00Z");
      expect(isSubscriptionExpired(store)).toBe(true);
    });
  });

  describe("modelGraceDaysLeft", () => {
    it("debe retornar null para plan semilla", () => {
      const store = createMockStore("semilla");
      expect(modelGraceDaysLeft(store)).toBeNull();
    });

    it("debe retornar null si no hay fecha de vencimiento o si el plan está vigente", () => {
      const store1 = createMockStore("pro");
      const store2 = createMockStore("pro", "2026-07-10T12:00:00Z");
      expect(modelGraceDaysLeft(store1)).toBeNull();
      expect(modelGraceDaysLeft(store2)).toBeNull();
    });

    it("debe retornar días de gracia restantes del modelo (máximo 15)", () => {
      const store = createMockStore("pro", "2026-07-02T12:00:00Z"); // Venció hace 5 días
      expect(modelGraceDaysLeft(store)).toBe(10); // 15 - 5 = 10
    });

    it("debe retornar 0 si pasaron los 15 días de gracia", () => {
      const store = createMockStore("pro", "2026-06-20T12:00:00Z"); // Venció hace 17 días
      expect(modelGraceDaysLeft(store)).toBe(0);
    });
  });

  describe("shouldUseSemillaModel", () => {
    it("debe retornar false si está en periodo de gracia de diseño", () => {
      const store = createMockStore("pro", "2026-07-02T12:00:00Z"); // Venció hace 5 días (gracia de 10 días restantes)
      expect(shouldUseSemillaModel(store)).toBe(false);
    });

    it("debe retornar true si la gracia de diseño expiró", () => {
      const store = createMockStore("pro", "2026-06-20T12:00:00Z"); // Venció hace 17 días
      expect(shouldUseSemillaModel(store)).toBe(true);
    });
  });

  describe("getEffectiveModel", () => {
    it("debe retornar el modelo semilla si expiró el periodo de gracia", () => {
      const store = createMockStore("pro", "2026-06-20T12:00:00Z", "boutique");
      expect(getEffectiveModel(store)).toBe("minimalista");
    });

    it("debe retornar el modelo configurado si no ha expirado la gracia", () => {
      const store = createMockStore("pro", "2026-07-06T12:00:00Z", "boutique");
      expect(getEffectiveModel(store)).toBe("boutique");
    });
  });

  describe("isPlanActive", () => {
    it("debe retornar true para plan semilla", () => {
      const store = createMockStore("semilla");
      expect(isPlanActive(store)).toBe(true);
    });

    it("debe retornar false si no tiene fecha de vencimiento", () => {
      const store = createMockStore("pro");
      expect(isPlanActive(store)).toBe(false);
    });

    it("debe retornar true si la fecha de vencimiento es futura", () => {
      const store = createMockStore("pro", "2026-07-08T12:00:00Z");
      expect(isPlanActive(store)).toBe(true);
    });

    it("debe retornar false si la fecha de vencimiento es pasada", () => {
      const store = createMockStore("pro", "2026-07-06T12:00:00Z");
      expect(isPlanActive(store)).toBe(false);
    });
  });

  describe("getBioLinksLimit", () => {
    it("debe retornar 3 para plan semilla efectivo", () => {
      const store = createMockStore("semilla");
      expect(getBioLinksLimit(store)).toBe(3);
    });

    it("debe retornar Infinity para plan pro activo", () => {
      const store = createMockStore("pro", "2026-07-10T12:00:00Z");
      expect(getBioLinksLimit(store)).toBe(Infinity);
    });
  });

  describe("canUsePremiumBioFeatures", () => {
    it("debe retornar false para plan semilla", () => {
      const store = createMockStore("semilla");
      expect(canUsePremiumBioFeatures(store)).toBe(false);
    });

    it("debe retornar true para plan pro", () => {
      const store = createMockStore("pro");
      expect(canUsePremiumBioFeatures(store)).toBe(true);
    });
  });

  describe("planAllowsPromoBar", () => {
    it("debe retornar false para plan semilla", () => {
      const store = createMockStore("semilla");
      expect(planAllowsPromoBar(store)).toBe(false);
    });

    it("debe retornar false para plan emprendedor", () => {
      const store = createMockStore("emprendedor");
      expect(planAllowsPromoBar(store)).toBe(false);
    });

    it("debe retornar true para plan pro", () => {
      const store = createMockStore("pro");
      expect(planAllowsPromoBar(store)).toBe(true);
    });

    it("debe retornar true para plan ilimitado", () => {
      const store = createMockStore("ilimitado");
      expect(planAllowsPromoBar(store)).toBe(true);
    });

    it("debe retornar false si el plan pro venció y expiró el periodo de gracia", () => {
      const store = createMockStore("pro", "2026-07-01T12:00:00Z"); // Venció hace 6 días (gracia de 3 días expirada)
      expect(planAllowsPromoBar(store)).toBe(false);
    });
  });
});

describe("Pruebas unitarias de Especificaciones de Imagen (types.ts)", () => {
  const createMockStoreWithModel = (model: string) => {
    return {
      plan: "pro",
      model,
    } as unknown as Store;
  };

  describe("getImageSpec", () => {
    it("debe retornar especificación grid (1:1) para modelo minimalista", () => {
      const store = createMockStoreWithModel("minimalista");
      const spec = getImageSpec(store);
      expect(spec.ratio).toBe("1/1");
      expect(spec.label).toBe("Cuadrada 1:1");
    });

    it("debe retornar especificación overlay (3:4) para modelo vibrante", () => {
      const store = createMockStoreWithModel("vibrante");
      const spec = getImageSpec(store);
      expect(spec.ratio).toBe("3/4");
      expect(spec.label).toBe("Vertical 3:4");
    });

    it("debe retornar especificación banner_grid (16:7) para modelo portada", () => {
      const store = createMockStoreWithModel("portada");
      const spec = getImageSpec(store);
      expect(spec.ratio).toBe("16/7");
      expect(spec.label).toBe("Panoramica 16:7");
    });
  });

  describe("checkImageRatio", () => {
    const specSquare = {
      ratio: "1/1",
      width: 1000,
      height: 1000,
      label: "Cuadrada 1:1",
      hint: "test hint",
      tolerance: 0.15,
    };

    it("debe retornar ok si la relación coincide dentro de la tolerancia", () => {
      const result = checkImageRatio(1000, 1000, specSquare);
      expect(result.status).toBe("ok");
    });

    it("debe retornar warning si la relación difiere más de la tolerancia (demasiado ancha)", () => {
      const result = checkImageRatio(1200, 800, specSquare); // 1.5 ratio vs 1.0 (50% de diferencia)
      expect(result.status).toBe("warning");
      expect(result.message).toContain("mas ancha");
    });

    it("debe retornar warning si la relación difiere más de la tolerancia (demasiado alta)", () => {
      const result = checkImageRatio(800, 1200, specSquare); // 0.67 ratio vs 1.0 (33% de diferencia)
      expect(result.status).toBe("warning");
      expect(result.message).toContain("mas alta");
    });
  });
});
