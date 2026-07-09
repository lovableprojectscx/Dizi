import { describe, it, expect } from "vitest";
import { planAllowsPromoBar, Store, PlanId } from "../types";

// Helper to create dummy stores
const createMockStore = (plan: PlanId, planExpiresAt?: string): Store => {
  return {
    plan,
    planExpiresAt,
  } as unknown as Store;
};

describe("PromoBar business logic (planAllowsPromoBar)", () => {
  it("should deny promo bar for Semilla (free) plan", () => {
    const store = createMockStore("semilla");
    expect(planAllowsPromoBar(store)).toBe(false);
  });

  it("should deny promo bar for Emprendedor plan", () => {
    const store = createMockStore("emprendedor");
    expect(planAllowsPromoBar(store)).toBe(false);
  });

  it("should allow promo bar for active Pro plan", () => {
    const store = createMockStore("pro");
    expect(planAllowsPromoBar(store)).toBe(true);
  });

  it("should allow promo bar for active Ilimitado plan", () => {
    const store = createMockStore("ilimitado");
    expect(planAllowsPromoBar(store)).toBe(true);
  });

  it("should deny promo bar for expired Pro plan when grace period has passed", () => {
    // Current test runner mock date is 2026-07-07T12:00:00Z in types.test.ts, 
    // but here we just test with a very old expiration date relative to now
    const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(); // 10 days ago
    const store = createMockStore("pro", pastDate);
    expect(planAllowsPromoBar(store)).toBe(false);
  });
});
