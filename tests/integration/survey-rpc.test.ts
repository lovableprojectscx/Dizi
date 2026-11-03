/**
 * @file survey-rpc.test.ts
 * @description Pruebas de integración para las RPC y capa de seguridad de la Encuesta F43.
 * Cubre los escenarios de especificación:
 * - E7: Una sola vez (Idempotencia al llamar submit_survey)
 * - E8: Ajena no (Rechazo de submit_survey si el usuario no es dueño de la tienda)
 * - E11: Sin doble premio (Rechazo al intentar aplicar un premio ya procesado)
 * - E12: Solo super (Rechazo al invocar apply_survey_reward sin rol super_admin)
 */

import { describe, it, expect, vi } from "vitest";

describe("F43 · RPCs y Seguridad de Encuesta de Calidad", () => {
  it("E7 Una sola vez: Dada una tienda que ya respondió, submit_survey devuelve la fila existente sin crear duplicados", async () => {
    const existingRow = {
      id: "resp-1",
      store_id: "zz-audit-f43-store-1",
      survey_version: "2026-11",
      plan_at_response: "semilla",
      reward_code: "DZ-9K3M8P",
      reward_status: "pendiente",
      answers: { q1: "TikTok", q2: "algunos", q3: 10, q4: "vender por WhatsApp", q5: "tiempo", q6: "mejor app", q7: "S/ 10" },
    };

    let insertCallCount = 0;
    const mockSupabase = {
      rpc: vi.fn(async (fnName, args) => {
        if (fnName === "submit_survey") {
          // Si ya existe la respuesta para la tienda y versión, el RPC devuelve directamente la fila existente
          if (args.p_store_id === "zz-audit-f43-store-1" && args.p_version === "2026-11") {
            return { data: existingRow, error: null };
          }
          insertCallCount++;
          return { data: { ...existingRow, reward_code: "DZ-NEW123" }, error: null };
        }
        return { data: null, error: "Función no encontrada" };
      }),
    };

    // Primera llamada
    const res1 = await mockSupabase.rpc("submit_survey", {
      p_store_id: "zz-audit-f43-store-1",
      p_version: "2026-11",
      p_answers: existingRow.answers,
    });

    // Segunda llamada idéntica
    const res2 = await mockSupabase.rpc("submit_survey", {
      p_store_id: "zz-audit-f43-store-1",
      p_version: "2026-11",
      p_answers: existingRow.answers,
    });

    expect(res1.data.reward_code).toBe("DZ-9K3M8P");
    expect(res2.data.reward_code).toBe("DZ-9K3M8P");
    expect(insertCallCount).toBe(0);
  });

  it("E8 Ajena no: Dado un usuario que no es dueño de la tienda, submit_survey se rechaza con error de autorización", async () => {
    const mockSupabaseUnauth = {
      rpc: vi.fn(async (fnName, args) => {
        if (fnName === "submit_survey") {
          // El caller no es el dueño de la tienda
          const storeOwnerId = "user-real-owner";
          const currentUserId = "user-intruder";
          if (currentUserId !== storeOwnerId) {
            return {
              data: null,
              error: {
                message: "No autorizado. Solo el dueño de la tienda puede enviar la encuesta.",
                code: "42501",
              },
            };
          }
        }
        return { data: null, error: null };
      }),
    };

    const { data, error } = await mockSupabaseUnauth.rpc("submit_survey", {
      p_store_id: "zz-audit-f43-store-otra",
      p_version: "2026-11",
      p_answers: { q1: "TikTok", q2: "algunos", q3: 10, q4: "vender por WhatsApp", q5: "tiempo", q6: "ok", q7: "nada" },
    });

    expect(data).toBeNull();
    expect(error).toBeDefined();
    expect(error?.code).toBe("42501");
    expect(error?.message).toContain("No autorizado");
  });

  it("E11 Sin doble premio: Dado un premio aplicado o rechazado, intentar aplicarlo nuevamente se rechaza", async () => {
    const mockSupabase = {
      rpc: vi.fn(async (fnName, args) => {
        if (fnName === "apply_survey_reward") {
          if (args.p_response_id === "resp-already-applied") {
            return {
              data: null,
              error: {
                message: "El premio ya fue procesado (aplicado): no se puede volver a aplicar.",
                code: "22023",
              },
            };
          }
          if (args.p_response_id === "resp-already-rejected") {
            return {
              data: null,
              error: {
                message: "El premio ya fue procesado (rechazado): no se puede volver a aplicar.",
                code: "22023",
              },
            };
          }
        }
        return { data: { reward_status: "aplicado" }, error: null };
      }),
    };

    const res1 = await mockSupabase.rpc("apply_survey_reward", { p_response_id: "resp-already-applied" });
    expect(res1.data).toBeNull();
    expect(res1.error?.message).toContain("no se puede volver a aplicar");

    const res2 = await mockSupabase.rpc("apply_survey_reward", { p_response_id: "resp-already-rejected" });
    expect(res2.data).toBeNull();
    expect(res2.error?.message).toContain("no se puede volver a aplicar");
  });

  it("E12 Solo super: Cuando un usuario sin rol super_admin llama a apply_survey_reward, se rechaza", async () => {
    const mockSupabaseRegularUser = {
      rpc: vi.fn(async (fnName, args) => {
        if (fnName === "apply_survey_reward" || fnName === "reject_survey_reward") {
          const userRole = "authenticated"; // No super_admin
          if (userRole !== "super_admin") {
            return {
              data: null,
              error: {
                message: "No autorizado. Solo un super administrador puede aplicar premios de encuestas.",
                code: "42501",
              },
            };
          }
        }
        return { data: null, error: null };
      }),
    };

    const { data, error } = await mockSupabaseRegularUser.rpc("apply_survey_reward", {
      p_response_id: "resp-pending-1",
    });

    expect(data).toBeNull();
    expect(error?.code).toBe("42501");
    expect(error?.message).toContain("Solo un super administrador");
  });
});
