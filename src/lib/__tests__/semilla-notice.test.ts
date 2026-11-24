import { describe, it, expect } from "vitest";
import {
  shouldShowSemillaNotice,
  daysUntilSemillaFin,
  formatSemillaFin,
  formatDayBeforeSemillaFin,
  formatSemillaCountdown,
  getSemillaNoticeStorageKey,
} from "../semilla-notice";
import type { AppConfigState } from "../access-state";

describe("F57.1: semilla-notice (escenarios 1–11)", () => {
  const configConFecha: AppConfigState = {
    pausaActiva: false,
    pausaDesde: null,
    semillaFin: "2026-12-09",
  };

  // 24 nov 2026 10:00 hora Lima = 2026-11-24T15:00:00.000Z
  const HOY_24_NOV_LIMA = new Date("2026-11-24T15:00:00.000Z");

  it('Escenario 1: Semilla, semilla_fin = 9 dic, hoy 24 nov → mostrar aviso, "9 de diciembre", "Faltan 15 días"', () => {
    const store = {
      slug: "tienda-semilla-activa",
      plan: "semilla" as const,
      planExpiresAt: null,
      subscriptionStatus: "active",
      active: true,
    };

    expect(shouldShowSemillaNotice(store, configConFecha, HOY_24_NOV_LIMA)).toBe(true);
    expect(formatSemillaFin(configConFecha)).toBe("9 de diciembre");
    expect(formatDayBeforeSemillaFin(configConFecha)).toBe("8 de diciembre");

    const days = daysUntilSemillaFin(configConFecha, HOY_24_NOV_LIMA);
    expect(days).toBe(15);
    expect(formatSemillaCountdown(days!)).toBe("Faltan 15 días");
    expect(getSemillaNoticeStorageKey("s_test1", "2026-12-09")).toBe(
      "dizi_semilla_notice_s_test1_2026-12-09",
    );
  });

  it("Escenario 2: Pro pagado vigente → nada", () => {
    const store = {
      slug: "tienda-pro-pagada",
      plan: "pro" as const,
      planExpiresAt: "2026-12-20T15:00:00.000Z", // +26 días
      subscriptionStatus: "active",
      active: true,
    };

    expect(shouldShowSemillaNotice(store, configConFecha, HOY_24_NOV_LIMA)).toBe(false);
  });

  it("Escenario 3: Pro en prueba vigente → nada", () => {
    const store = {
      slug: "tienda-pro-trial",
      plan: "pro" as const,
      planExpiresAt: "2026-11-30T15:00:00.000Z", // +6 días
      subscriptionStatus: "trial",
      active: true,
    };

    expect(shouldShowSemillaNotice(store, configConFecha, HOY_24_NOV_LIMA)).toBe(false);
  });

  it("Escenario 4: Pagado vencido hace 1 día (gracia) → no muestra aviso de plan gratis", () => {
    const store = {
      slug: "tienda-en-gracia",
      plan: "pro" as const,
      planExpiresAt: "2026-11-23T15:00:00.000Z", // venció hace 1 día (dentro de los 3 días de gracia)
      subscriptionStatus: "active",
      active: true,
    };

    expect(shouldShowSemillaNotice(store, configConFecha, HOY_24_NOV_LIMA)).toBe(false);
  });

  it("Escenario 5: Pagado vencido hace 5 días → mostrar aviso", () => {
    const store = {
      slug: "tienda-vencida-5d",
      plan: "emprendedor" as const,
      planExpiresAt: "2026-11-19T15:00:00.000Z", // venció hace 5 días (> 3 días de gracia)
      subscriptionStatus: "active",
      active: true,
    };

    expect(shouldShowSemillaNotice(store, configConFecha, HOY_24_NOV_LIMA)).toBe(true);
  });

  it("Escenario 6: Semilla con slug *-demo → nada", () => {
    const store = {
      slug: "zapateria-demo",
      plan: "semilla" as const,
      planExpiresAt: null,
      subscriptionStatus: "active",
      active: true,
    };

    expect(shouldShowSemillaNotice(store, configConFecha, HOY_24_NOV_LIMA)).toBe(false);
  });

  it("Escenario 7: Semilla con slug zz-* → nada", () => {
    const store = {
      slug: "zz-audit-f57-1-test",
      plan: "semilla" as const,
      planExpiresAt: null,
      subscriptionStatus: "active",
      active: true,
    };

    expect(shouldShowSemillaNotice(store, configConFecha, HOY_24_NOV_LIMA)).toBe(false);
  });

  it("Escenario 8: Ilimitado sin vencimiento → nada", () => {
    const store = {
      slug: "cuenta-interna-dizi",
      plan: "ilimitado" as const,
      planExpiresAt: null,
      subscriptionStatus: "active",
      active: true,
    };

    expect(shouldShowSemillaNotice(store, configConFecha, HOY_24_NOV_LIMA)).toBe(false);
  });

  it("Escenario 9: semilla_fin vacío → nada para nadie", () => {
    const configVacia: AppConfigState = {
      pausaActiva: false,
      pausaDesde: null,
      semillaFin: null,
    };
    const configStringVacio: AppConfigState = {
      pausaActiva: false,
      pausaDesde: null,
      semillaFin: "",
    };

    const semillaStore = {
      slug: "tienda-semilla",
      plan: "semilla" as const,
      planExpiresAt: null,
      active: true,
    };
    const expiredStore = {
      slug: "tienda-vencida-10d",
      plan: "pro" as const,
      planExpiresAt: "2026-11-10T15:00:00.000Z",
      active: true,
    };

    expect(shouldShowSemillaNotice(semillaStore, configVacia, HOY_24_NOV_LIMA)).toBe(false);
    expect(shouldShowSemillaNotice(expiredStore, configVacia, HOY_24_NOV_LIMA)).toBe(false);
    expect(shouldShowSemillaNotice(semillaStore, configStringVacio, HOY_24_NOV_LIMA)).toBe(false);
    expect(daysUntilSemillaFin(configVacia, HOY_24_NOV_LIMA)).toBeNull();
    expect(formatSemillaFin(configVacia)).toBeNull();
  });

  it("Escenario 10: Hoy = 9 dic (hora Lima) o después → nada", () => {
    const store = {
      slug: "tienda-semilla",
      plan: "semilla" as const,
      planExpiresAt: null,
      active: true,
    };

    // Exactamente inicio del 9 dic en Lima (00:00:00 -05:00 = 05:00:00Z)
    const inicio9DicLima = new Date("2026-12-09T05:00:00.000Z");
    expect(daysUntilSemillaFin(configConFecha, inicio9DicLima)).toBe(0);
    expect(shouldShowSemillaNotice(store, configConFecha, inicio9DicLima)).toBe(false);

    // 10 dic en Lima (12:00:00 -05:00 = 17:00:00Z)
    const dia10DicLima = new Date("2026-12-10T17:00:00.000Z");
    expect(daysUntilSemillaFin(configConFecha, dia10DicLima)).toBe(-1);
    expect(shouldShowSemillaNotice(store, configConFecha, dia10DicLima)).toBe(false);
  });

  it('Escenario 11: 8 dic 23:30 Lima → todavía se ve ("Falta 1 día")', () => {
    const store = {
      slug: "tienda-semilla",
      plan: "semilla" as const,
      planExpiresAt: null,
      active: true,
    };

    // 8 dic 23:30 Lima = 2026-12-09T04:30:00.000Z (en UTC ya es 9 dic, pero en Lima aún es 8 dic)
    const noche8DicLima = new Date("2026-12-09T04:30:00.000Z");

    expect(shouldShowSemillaNotice(store, configConFecha, noche8DicLima)).toBe(true);
    const days = daysUntilSemillaFin(configConFecha, noche8DicLima);
    expect(days).toBe(1);
    expect(formatSemillaCountdown(days!)).toBe("Falta 1 día");
  });
});
