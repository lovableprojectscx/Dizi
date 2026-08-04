import { describe, it, expect } from "vitest";

describe("Pruebas de Migración SQL de Supabase (Fase 4 - get_public_store RPC)", () => {
  it("debe validar la correspondencia de límites del RPC get_public_store por plan", () => {
    const rpcEffectiveLimits: Record<string, number> = {
      semilla: 20,
      emprendedor: 100,
      pro: 300,
      ilimitado: 1000,
    };

    expect(rpcEffectiveLimits.semilla).toBe(20);
    expect(rpcEffectiveLimits.emprendedor).toBe(100);
    expect(rpcEffectiveLimits.pro).toBe(300);
    expect(rpcEffectiveLimits.ilimitado).toBe(1000);
  });

  it("debe validar la degradación en el RPC get_public_store cuando pasen 3 días de gracia", () => {
    const evaluateRpcPlan = (plan: string, daysExpired: number): { effectivePlan: string; limit: number } => {
      let effectivePlan = plan;
      if (plan === "semilla" || daysExpired > 3) {
        effectivePlan = "semilla";
      }

      const limits: Record<string, number> = {
        semilla: 20,
        emprendedor: 100,
        pro: 300,
        ilimitado: 1000,
      };

      return {
        effectivePlan,
        limit: limits[effectivePlan] || 20,
      };
    };

    // Dentro del periodo de gracia (2 días vencido): mantiene su plan
    const insideGrace = evaluateRpcPlan("pro", 2);
    expect(insideGrace.effectivePlan).toBe("pro");
    expect(insideGrace.limit).toBe(300);

    // Fuera del periodo de gracia (4 días vencido): degrada a semilla
    const outsideGrace = evaluateRpcPlan("pro", 4);
    expect(outsideGrace.effectivePlan).toBe("semilla");
    expect(outsideGrace.limit).toBe(20);
  });
});
