import { describe, it, expect } from "vitest";
import {
  getStoreAccessState,
  isStorePaused,
  isStoreInGrace,
  type AppConfigState,
} from "../access-state";

describe("F57: access-state (tabla de 11 casos de diseno.md)", () => {
  // Fecha fija para pruebas: 2026-11-23T12:00:00Z
  const NOW = new Date("2026-11-23T12:00:00Z");

  const configOn: AppConfigState = {
    pausaActiva: true,
    semillaFin: "2026-12-01T00:00:00Z",
  };

  const configOff: AppConfigState = {
    pausaActiva: false,
    semillaFin: null,
  };

  it("Caso 1: Plan pagado, vence en 10 días (interruptor ON) -> activa", () => {
    const store = {
      slug: "tienda-pagada",
      plan: "pro" as const,
      planExpiresAt: "2026-12-03T12:00:00Z", // +10 días
      subscriptionStatus: "active",
    };
    expect(getStoreAccessState(store, configOn, NOW)).toBe("activa");
    expect(isStorePaused(store, configOn, NOW)).toBe(false);
    expect(isStoreInGrace(store, configOn, NOW)).toBe(false);
  });

  it("Caso 2: Plan pagado, venció hace 2 días (interruptor ON) -> gracia", () => {
    const store = {
      slug: "tienda-vencida-2d",
      plan: "pro" as const,
      planExpiresAt: "2026-11-21T12:00:00Z", // -2 días
      subscriptionStatus: "active",
    };
    expect(getStoreAccessState(store, configOn, NOW)).toBe("gracia");
    expect(isStorePaused(store, configOn, NOW)).toBe(false);
    expect(isStoreInGrace(store, configOn, NOW)).toBe(true);
  });

  it("Caso 3: Plan pagado, venció hace 4 días (interruptor ON) -> pausa", () => {
    const store = {
      slug: "tienda-vencida-4d",
      plan: "pro" as const,
      planExpiresAt: "2026-11-19T12:00:00Z", // -4 días (superó los 3 días de gracia)
      subscriptionStatus: "active",
    };
    expect(getStoreAccessState(store, configOn, NOW)).toBe("pausa");
    expect(isStorePaused(store, configOn, NOW)).toBe(true);
    expect(isStoreInGrace(store, configOn, NOW)).toBe(false);
  });

  it("Caso 4: Prueba Pro vigente (interruptor ON) -> activa", () => {
    const store = {
      slug: "tienda-prueba-pro",
      plan: "pro" as const,
      planExpiresAt: "2026-11-27T12:00:00Z", // +4 días
      subscriptionStatus: "trial",
    };
    expect(getStoreAccessState(store, configOn, NOW)).toBe("activa");
    expect(isStorePaused(store, configOn, NOW)).toBe(false);
  });

  it("Caso 5: Prueba Pro vencida hace 4 días (interruptor ON) -> pausa", () => {
    const store = {
      slug: "tienda-prueba-vencida",
      plan: "pro" as const,
      planExpiresAt: "2026-11-19T12:00:00Z", // -4 días
      subscriptionStatus: "trial",
    };
    expect(getStoreAccessState(store, configOn, NOW)).toBe("pausa");
    expect(isStorePaused(store, configOn, NOW)).toBe(true);
  });

  it("Caso 6: Semilla, antes del día S (interruptor ON) -> activa", () => {
    const store = {
      slug: "tienda-semilla",
      plan: "semilla" as const,
      planExpiresAt: null,
      subscriptionStatus: "active",
    };
    // S es 2026-12-01, NOW es 2026-11-23
    expect(getStoreAccessState(store, configOn, NOW)).toBe("activa");
    expect(isStorePaused(store, configOn, NOW)).toBe(false);
  });

  it("Caso 7: Semilla después de S (ya pasada a prueba Pro por apply_semilla_sunset) -> activa", () => {
    const store = {
      slug: "semilla-migrada-a-pro",
      plan: "pro" as const,
      planExpiresAt: "2026-12-08T12:00:00Z", // Pro trial +7 días asignado el día S
      subscriptionStatus: "trial",
    };
    const futureDate = new Date("2026-12-02T12:00:00Z");
    expect(getStoreAccessState(store, configOn, futureDate)).toBe("activa");
    expect(isStorePaused(store, configOn, futureDate)).toBe(false);
  });

  it("Caso 8: Demo (*-demo) vencida (interruptor ON) -> activa", () => {
    const store = {
      slug: "calzados-demo",
      plan: "pro" as const,
      planExpiresAt: "2026-10-01T12:00:00Z", // Vencida hace más de un mes
      subscriptionStatus: "trial",
    };
    expect(getStoreAccessState(store, configOn, NOW)).toBe("activa");
    expect(isStorePaused(store, configOn, NOW)).toBe(false);
  });

  it("Caso 9: zz-* vencida (interruptor ON) -> activa", () => {
    const store = {
      slug: "zz-audit-store",
      plan: "pro" as const,
      planExpiresAt: "2026-10-01T12:00:00Z", // Vencida
      subscriptionStatus: "trial",
    };
    expect(getStoreAccessState(store, configOn, NOW)).toBe("activa");
    expect(isStorePaused(store, configOn, NOW)).toBe(false);
  });

  it("Caso 10: Caso 3 o 5 con el interruptor apagado (interruptor OFF) -> activa", () => {
    const storeExpiredPaid = {
      slug: "tienda-vencida-4d",
      plan: "pro" as const,
      planExpiresAt: "2026-11-19T12:00:00Z",
      subscriptionStatus: "active",
    };
    const storeExpiredTrial = {
      slug: "tienda-prueba-vencida",
      plan: "pro" as const,
      planExpiresAt: "2026-11-19T12:00:00Z",
      subscriptionStatus: "trial",
    };
    expect(getStoreAccessState(storeExpiredPaid, configOff, NOW)).toBe("activa");
    expect(getStoreAccessState(storeExpiredTrial, configOff, NOW)).toBe("activa");
    expect(isStorePaused(storeExpiredPaid, configOff, NOW)).toBe(false);
    expect(isStorePaused(storeExpiredTrial, configOff, NOW)).toBe(false);
  });

  it("Caso 11: Reactivación: caso 3 + el super extiende el plan -> activa al instante", () => {
    const store = {
      slug: "tienda-vencida-4d",
      plan: "pro" as const,
      planExpiresAt: "2026-11-19T12:00:00Z",
      subscriptionStatus: "active",
    };
    // Antes de extender: en pausa
    expect(getStoreAccessState(store, configOn, NOW)).toBe("pausa");

    // Super extiende a 30 días en el futuro
    const storeReactivated = {
      ...store,
      planExpiresAt: "2026-12-23T12:00:00Z",
    };
    expect(getStoreAccessState(storeReactivated, configOn, NOW)).toBe("activa");
    expect(isStorePaused(storeReactivated, configOn, NOW)).toBe(false);
  });

  it("Caso Extra: Cuentas internas (Ilimitado sin expiración) nunca se pausan", () => {
    const store = {
      slug: "cuenta-fundador",
      plan: "ilimitado" as const,
      planExpiresAt: null,
      subscriptionStatus: "active",
    };
    expect(getStoreAccessState(store, configOn, NOW)).toBe("activa");
    expect(isStorePaused(store, configOn, NOW)).toBe(false);
  });

  it("Caso Extra: Semilla con semillaFin = null nunca se pausa aunque pausaActiva = true", () => {
    const configSemillaNull: AppConfigState = {
      pausaActiva: true,
      semillaFin: null,
    };
    const store = {
      slug: "semilla-libre",
      plan: "semilla" as const,
      planExpiresAt: null,
    };
    expect(getStoreAccessState(store, configSemillaNull, NOW)).toBe("activa");
    expect(isStorePaused(store, configSemillaNull, NOW)).toBe(false);
  });
});
