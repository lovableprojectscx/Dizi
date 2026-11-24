import { describe, it, expect } from "vitest";
import {
  getStoreAccessState,
  isStorePaused,
  isStoreInGrace,
  type AppConfigState,
} from "../access-state";

describe("F57: access-state (matriz completa de casos F57)", () => {
  // Fecha fija para pruebas: 2026-11-23T12:00:00Z
  const NOW = new Date("2026-11-23T12:00:00Z");

  const configOn: AppConfigState = {
    pausaActiva: true,
    pausaDesde: "2026-11-23T00:00:00Z",
    semillaFin: "2026-12-01T00:00:00Z",
  };

  const configOff: AppConfigState = {
    pausaActiva: false,
    pausaDesde: null,
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

  it("Caso 2: Plan pagado, venció hace 2 días (dentro de gracia) -> gracia", () => {
    const store = {
      slug: "tienda-vencida-2d",
      plan: "pro" as const,
      planExpiresAt: "2026-11-21T12:00:00Z", // -2 días (gracia termina Nov 24 > pausa_desde Nov 23)
      subscriptionStatus: "active",
    };
    expect(getStoreAccessState(store, configOn, NOW)).toBe("gracia");
    expect(isStorePaused(store, configOn, NOW)).toBe(false);
    expect(isStoreInGrace(store, configOn, NOW)).toBe(true);
  });

  it("Caso 3: Plan pagado en régimen nuevo, venció hace 4 días (fuera de gracia) -> pausa", () => {
    // Si pausa_desde fue hace 10 días (2026-11-13) y la tienda venció hace 4 días (Nov 19)
    const configOlder: AppConfigState = {
      pausaActiva: true,
      pausaDesde: "2026-11-13T00:00:00Z",
      semillaFin: "2026-12-01T00:00:00Z",
    };
    const store = {
      slug: "tienda-vencida-4d",
      plan: "pro" as const,
      planExpiresAt: "2026-11-19T12:00:00Z", // -4 días (gracia terminó Nov 22 > pausa_desde Nov 13)
      subscriptionStatus: "active",
    };
    expect(getStoreAccessState(store, configOlder, NOW)).toBe("pausa");
    expect(isStorePaused(store, configOlder, NOW)).toBe(true);
    expect(isStoreInGrace(store, configOlder, NOW)).toBe(false);
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

  it("Caso 5: Prueba Pro en régimen nuevo vencida hace 4 días -> pausa", () => {
    const configOlder: AppConfigState = {
      pausaActiva: true,
      pausaDesde: "2026-11-13T00:00:00Z",
      semillaFin: "2026-12-01T00:00:00Z",
    };
    const store = {
      slug: "tienda-prueba-vencida",
      plan: "pro" as const,
      planExpiresAt: "2026-11-19T12:00:00Z", // -4 días
      subscriptionStatus: "trial",
    };
    expect(getStoreAccessState(store, configOlder, NOW)).toBe("pausa");
    expect(isStorePaused(store, configOlder, NOW)).toBe(true);
  });

  it("Caso 6: Semilla antes de S (interruptor ON) -> activa", () => {
    const store = {
      slug: "tienda-semilla",
      plan: "semilla" as const,
      planExpiresAt: null,
      subscriptionStatus: "active",
    };
    expect(getStoreAccessState(store, configOn, NOW)).toBe("activa");
    expect(isStorePaused(store, configOn, NOW)).toBe(false);
  });

  it("Caso 7 (REGLA F57.2): Semilla después de S sin correr el sunset -> activa", () => {
    // S fue 2026-12-01, fecha de evaluación 2026-12-05 (después de S), aún plan semilla
    const store = {
      slug: "semilla-sin-sunset",
      plan: "semilla" as const,
      planExpiresAt: null,
      subscriptionStatus: "active",
    };
    const afterS = new Date("2026-12-05T12:00:00Z");
    expect(getStoreAccessState(store, configOn, afterS)).toBe("activa");
    expect(isStorePaused(store, configOn, afterS)).toBe(false);
  });

  it("Caso 8: Semilla migrada por sunset a Pro trial (+7 días) vigente -> activa", () => {
    const store = {
      slug: "semilla-migrada-a-pro",
      plan: "pro" as const,
      planExpiresAt: "2026-12-08T12:00:00Z",
      subscriptionStatus: "trial",
    };
    const futureDate = new Date("2026-12-02T12:00:00Z");
    expect(getStoreAccessState(store, configOn, futureDate)).toBe("activa");
    expect(isStorePaused(store, configOn, futureDate)).toBe(false);
  });

  it("Caso 9: Demo (*-demo) vencida nunca se pausa -> activa", () => {
    const store = {
      slug: "calzados-demo",
      plan: "pro" as const,
      planExpiresAt: "2026-10-01T12:00:00Z",
      subscriptionStatus: "trial",
    };
    expect(getStoreAccessState(store, configOn, NOW)).toBe("activa");
    expect(isStorePaused(store, configOn, NOW)).toBe(false);
  });

  it("Caso 10: Auditoría zz-* vencida nunca se pausa -> activa", () => {
    const store = {
      slug: "zz-audit-store",
      plan: "pro" as const,
      planExpiresAt: "2026-10-01T12:00:00Z",
      subscriptionStatus: "trial",
    };
    expect(getStoreAccessState(store, configOn, NOW)).toBe("activa");
    expect(isStorePaused(store, configOn, NOW)).toBe(false);
  });

  it("Caso 11: Cuentas internas (Ilimitado sin expiración) nunca se pausan -> activa", () => {
    const store = {
      slug: "cuenta-fundador",
      plan: "ilimitado" as const,
      planExpiresAt: null,
      subscriptionStatus: "active",
    };
    expect(getStoreAccessState(store, configOn, NOW)).toBe("activa");
    expect(isStorePaused(store, configOn, NOW)).toBe(false);
  });

  it("Caso 12 (REGLA F57.1): Pagada vencida antes de que se active la pausa (Milance, Giosathi) -> activa", () => {
    // pausa_desde se activó hoy 2026-11-23. Milance venció el 2026-11-15 (gracia terminó Nov 18 < Nov 23)
    const storeMilance = {
      slug: "milance-pre-pausa",
      plan: "pro" as const,
      planExpiresAt: "2026-11-15T00:00:00Z",
      subscriptionStatus: "active",
    };
    const storeGiosathi = {
      slug: "giosathi-pre-pausa",
      plan: "emprendedor" as const,
      planExpiresAt: "2026-11-12T00:00:00Z",
      subscriptionStatus: "active",
    };
    expect(getStoreAccessState(storeMilance, configOn, NOW)).toBe("activa");
    expect(getStoreAccessState(storeGiosathi, configOn, NOW)).toBe("activa");
    expect(isStorePaused(storeMilance, configOn, NOW)).toBe(false);
    expect(isStorePaused(storeGiosathi, configOn, NOW)).toBe(false);
  });

  it("Caso 13 (REGLA F57.3): Interruptor apagado = idéntico a hoy (nadie en pausa) -> activa", () => {
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
    const storeSemilla = {
      slug: "tienda-semilla",
      plan: "semilla" as const,
      planExpiresAt: null,
    };
    expect(getStoreAccessState(storeExpiredPaid, configOff, NOW)).toBe("activa");
    expect(getStoreAccessState(storeExpiredTrial, configOff, NOW)).toBe("activa");
    expect(getStoreAccessState(storeSemilla, configOff, NOW)).toBe("activa");
    expect(isStorePaused(storeExpiredPaid, configOff, NOW)).toBe(false);
    expect(isStorePaused(storeExpiredTrial, configOff, NOW)).toBe(false);
    expect(isStorePaused(storeSemilla, configOff, NOW)).toBe(false);
  });

  it("Caso 14: Reactivación comercial: tienda en pausa que renueva plan pasa a activa al instante", () => {
    const configOlder: AppConfigState = {
      pausaActiva: true,
      pausaDesde: "2026-11-13T00:00:00Z",
      semillaFin: "2026-12-01T00:00:00Z",
    };
    const store = {
      slug: "tienda-en-pausa",
      plan: "pro" as const,
      planExpiresAt: "2026-11-19T12:00:00Z",
      subscriptionStatus: "active",
    };
    expect(getStoreAccessState(store, configOlder, NOW)).toBe("pausa");

    // Super extiende a 30 días en el futuro
    const storeReactivated = {
      ...store,
      planExpiresAt: "2026-12-23T12:00:00Z",
    };
    expect(getStoreAccessState(storeReactivated, configOlder, NOW)).toBe("activa");
    expect(isStorePaused(storeReactivated, configOlder, NOW)).toBe(false);
  });
});
