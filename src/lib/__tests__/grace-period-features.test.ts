import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import {
  Store,
  getEffectivePlan,
  getMaxAllowedBanners,
  planAllowsPromoBar,
  canUsePremiumBioFeatures,
  getBioLinksLimit,
  getEffectiveProductLimit,
  getEffectiveModel,
  isSubscriptionExpired,
  PLANS,
} from "../types";

// Fijamos fecha de prueba de referencia: 2026-09-30 12:00:00 UTC
const NOW = new Date("2026-09-30T12:00:00Z");

describe("G9.3: Reglas comerciales por ciclo de vida de plan (Vigente, En Gracia, Vencido)", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  const createTestStore = (
    plan: "semilla" | "emprendedor" | "pro" | "ilimitado",
    planExpiresAt?: string,
    model: string = "lookbook",
  ): Store =>
    ({
      id: "test-store-id",
      name: "Tienda Test",
      slug: "tienda-test",
      plan,
      planExpiresAt,
      model,
      brandColor: "#6366f1",
      showDiziBranding: false,
      bannerImage: "https://example.com/b1.jpg|||https://example.com/b2.jpg|||https://example.com/b3.jpg|||https://example.com/b4.jpg|||https://example.com/b5.jpg",
      quickLinks: [
        { label: "Link 1", url: "https://link1.com" },
        { label: "Link 2", url: "https://link2.com" },
        { label: "Link 3", url: "https://link3.com" },
        { label: "Link 4", url: "https://link4.com" },
      ],
      products: [],
      promoBarEnabled: true,
      promoBarText: "Envío gratis por compras mayores a S/ 100",
    } as unknown as Store);

  describe("1. Caso Plan Vigente (fecha de expiración futura)", () => {
    it("mantiene beneficios completos de Pro (3 banners, promo bar, links ilimitados, modelo intacto)", () => {
      // Vence en 10 días: 2026-10-10
      const store = createTestStore("pro", "2026-10-10T12:00:00Z", "lookbook");

      expect(isSubscriptionExpired(store)).toBe(false);
      expect(getEffectivePlan(store)).toBe("pro");
      expect(getEffectiveProductLimit(store)).toBe(300);
      expect(getMaxAllowedBanners(store)).toBe(3);
      expect(planAllowsPromoBar(store)).toBe(true);
      expect(canUsePremiumBioFeatures(store)).toBe(true);
      expect(getBioLinksLimit(store)).toBe(Infinity);
      // El modelo visual se conserva
      expect(getEffectiveModel(store)).toBe("lookbook");
    });

    it("mantiene beneficios completos de Emprendedor (1 banner, sin promo bar, links ilimitados)", () => {
      const store = createTestStore("emprendedor", "2026-10-10T12:00:00Z", "editorial");

      expect(getEffectivePlan(store)).toBe("emprendedor");
      expect(getEffectiveProductLimit(store)).toBe(100);
      expect(getMaxAllowedBanners(store)).toBe(1);
      expect(planAllowsPromoBar(store)).toBe(false);
      expect(canUsePremiumBioFeatures(store)).toBe(true);
      expect(getBioLinksLimit(store)).toBe(Infinity);
      expect(getEffectiveModel(store)).toBe("editorial");
    });
  });

  describe("2. Caso Periodo de Gracia (vencido hace 2 días, <= 3 días de tolerancia)", () => {
    it("respeta el periodo de gracia de 3 días sin degradar comercialmente al comercio", () => {
      // Venció hace 2 días: 2026-09-28
      const store = createTestStore("pro", "2026-09-28T12:00:00Z", "boutique");
      // La fecha calendario ya venció, pero está en periodo de gracia
      expect(isSubscriptionExpired(store)).toBe(true);
      expect(getEffectivePlan(store)).toBe("pro");
      expect(getEffectiveProductLimit(store)).toBe(300);
      expect(getMaxAllowedBanners(store)).toBe(3);
      expect(planAllowsPromoBar(store)).toBe(true);
      expect(canUsePremiumBioFeatures(store)).toBe(true);
      expect(getBioLinksLimit(store)).toBe(Infinity);
      expect(getEffectiveModel(store)).toBe("boutique");
    });
  });

  describe("3. Caso Vencido (> 3 días de gracia transcurridos)", () => {
    it("degrada comercialmente a Semilla pero MANTIENE el diseño configurado intacto", () => {
      // Venció hace 4 días: 2026-09-26 (superó los 3 días de gracia)
      const store = createTestStore("pro", "2026-09-26T12:00:00Z", "lookbook");

      expect(isSubscriptionExpired(store)).toBe(true);
      // El plan comercial efectivo ahora es Semilla
      expect(getEffectivePlan(store)).toBe("semilla");
      // Límites comerciales caen a Semilla
      expect(getEffectiveProductLimit(store)).toBe(20);
      expect(getMaxAllowedBanners(store)).toBe(0);
      expect(planAllowsPromoBar(store)).toBe(false);
      expect(canUsePremiumBioFeatures(store)).toBe(false);
      expect(getBioLinksLimit(store)).toBe(3);

      // Decisión de Jack (30 sep 2026): El modelo visual NO se degrada ni vuelve a classic
      expect(getEffectiveModel(store)).toBe("lookbook");
    });
  });

  describe("4. Caso Renovación de Plan", () => {
    it("al actualizar la fecha de vencimiento a futuro, recupera beneficios sin pérdida de datos", () => {
      // Tienda que estaba vencida
      const expiredStore = createTestStore("pro", "2026-09-20T12:00:00Z", "lookbook");
      expect(getEffectivePlan(expiredStore)).toBe("semilla");

      // El usuario renueva y la fecha pasa a futuro
      const renewedStore = {
        ...expiredStore,
        planExpiresAt: "2026-10-30T12:00:00Z",
      };

      expect(isSubscriptionExpired(renewedStore)).toBe(false);
      expect(getEffectivePlan(renewedStore)).toBe("pro");
      expect(getMaxAllowedBanners(renewedStore)).toBe(3);
      expect(planAllowsPromoBar(renewedStore)).toBe(true);
      expect(canUsePremiumBioFeatures(renewedStore)).toBe(true);
      expect(getEffectiveModel(renewedStore)).toBe("lookbook");
    });
  });
});
