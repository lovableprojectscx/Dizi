import { describe, expect, it } from "vitest";
import {
  SURVEY_VERSION,
  SURVEY_CLOSES_AT,
  isDemoStore,
  getSurveyGroup,
  getQuestionsForGroup,
  isSurveyClosed,
  canStoreTakeSurvey,
  getRewardDescription,
  buildSurveyWhatsAppMessage,
  buildSurveyWhatsAppLink,
  validateAnswers,
  exportSurveyResponsesToCsv,
  type SurveyResponseRecord,
} from "../survey";
import { type Store } from "../types";

describe("F43 · Encuesta de calidad (Reglas de negocio y validación)", () => {
  const baseStore: Store = {
    id: "zz-audit-f43-store-1",
    slug: "zz-audit-tienda-1",
    name: "Tienda Audit 1",
    phone: "999888777",
    countryCode: "51",
    plan: "semilla",
    active: true,
    createdAt: "2026-01-01T00:00:00Z",
    whatsappClicks: 0,
    categories: [],
    products: [],
  };

  it("E1 Semilla ve sus preguntas: Dada una tienda zz-audit en Semilla, ve preguntas 1-3 y 4-7 de Semilla", () => {
    const store: Store = { ...baseStore, plan: "semilla" };
    const group = getSurveyGroup(store);
    expect(group).toBe("semilla");

    const questions = getQuestionsForGroup(group!);
    expect(questions.length).toBe(7);
    expect(questions[0].label).toBe("¿Cómo conociste DIZI?");
    expect(questions[1].label).toBe("¿Te llegan pedidos de clientes desde tu catálogo?");
    expect(questions[2].label).toBe("Del 0 al 10, ¿recomendarías DIZI a otro negocio?");
    expect(questions[3].label).toBe("¿Para qué creaste tu catálogo?");
    expect(questions[4].label).toBe("¿Qué te frena para cargar más productos?");
    expect(questions[5].label).toBe("¿Qué tendría que tener DIZI para que pagues un plan?");
    expect(questions[6].label).toBe("¿Cuánto pagarías al mes por tu catálogo?");

    // Opciones literales exactas
    expect(questions[0].options).toEqual(["TikTok", "Facebook", "recomendación", "Idenza", "otro"]);
    expect(questions[1].options).toEqual(["casi todos mis pedidos", "algunos", "pocos", "ninguno"]);
    expect(questions[3].options).toEqual(["vender por WhatsApp", "link en bio", "solo probar", "otro"]);
    expect(questions[4].options).toEqual(["tiempo", "es difícil", "no sé cómo", "no lo necesito", "otro"]);
    expect(questions[6].options).toEqual(["nada", "S/ 10", "S/ 20", "S/ 40 o más"]);
  });

  it("E2 prueba = Semilla: Dada una tienda en prueba de Emprendedor, ve las preguntas de Semilla", () => {
    const storeEnPrueba: Store = {
      ...baseStore,
      plan: "emprendedor",
      subscriptionStatus: "trial",
      planExpiresAt: new Date(Date.now() + 86400000 * 10).toISOString(),
    };

    const group = getSurveyGroup(storeEnPrueba);
    expect(group).toBe("semilla");

    const questions = getQuestionsForGroup(group!);
    expect(questions.length).toBe(7);
    expect(questions[3].label).toBe("¿Para qué creaste tu catálogo?");
    expect(questions[5].label).toBe("¿Qué tendría que tener DIZI para que pagues un plan?");
  });

  it("E3 Pro ve las suyas: Dada una tienda Pro activa, ve las 4 a 7 de Pro con multiselección y follow-up", () => {
    const storePro: Store = {
      ...baseStore,
      plan: "pro",
      subscriptionStatus: "active",
      planExpiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    };

    const group = getSurveyGroup(storePro);
    expect(group).toBe("pro");

    const questions = getQuestionsForGroup(group!);
    expect(questions.length).toBe(7);
    expect(questions[3].label).toBe("¿Empezaste con el plan gratis antes de pagar?");
    expect(questions[4].label).toBe("¿Qué funciones de Pro usas?");
    expect(questions[4].type).toBe("multiple");
    expect(questions[4].options).toEqual([
      "cintillo",
      "varios banners",
      "varios vendedores",
      "más productos",
      "ninguna en especial",
    ]);
    expect(questions[5].label).toBe("¿Piensas renovar?");
    expect(questions[5].options).toEqual(["sí", "tal vez", "no"]);
    expect(questions[5].followUp?.label).toBe("¿por qué?");
    expect(questions[6].label).toBe("¿Te interesa pagar el año completo con 25% de descuento?");
    expect(questions[6].options).toEqual(["sí", "no"]);
  });

  it("E4 Ilimitado no la ve: Dada una tienda Ilimitado, no participa y canStoreTakeSurvey retorna false", () => {
    const storeIlimitado: Store = {
      ...baseStore,
      plan: "ilimitado",
    };

    expect(isDemoStore(storeIlimitado)).toBe(true);
    expect(getSurveyGroup(storeIlimitado)).toBeNull();
    expect(canStoreTakeSurvey(storeIlimitado, false)).toBe(false);
  });

  it("E5 Obligatorias: Cuando falta una respuesta obligatoria o excede 300 caracteres, no pasa validación", () => {
    // Respuestas incompletas para Semilla
    const incompleteSemilla = {
      q1: "TikTok",
      q2: "algunos",
      // Falta q3
      q4: "vender por WhatsApp",
      q5: "tiempo",
      q6: "", // Obligatoria vacía
      q7: "S/ 10",
    };

    const result1 = validateAnswers("semilla", incompleteSemilla);
    expect(result1.valid).toBe(false);
    expect(result1.errors.q3).toBeDefined();
    expect(result1.errors.q6).toBeDefined();

    // Texto de q6 que excede 300 caracteres
    const longText = "a".repeat(301);
    const result2 = validateAnswers("semilla", {
      q1: "TikTok",
      q2: "algunos",
      q3: 10,
      q4: "vender por WhatsApp",
      q5: "tiempo",
      q6: longText,
      q7: "S/ 10",
    });
    expect(result2.valid).toBe(false);
    expect(result2.errors.q6).toContain("300 caracteres");

    // Pro Q5 requiere al menos una opción seleccionada
    const proEmptyQ5 = {
      q1: "TikTok",
      q2: "algunos",
      q3: 9,
      q4: "sí",
      q5: [], // Vacío
      q6: "sí",
      q7: "sí",
    };
    const result3 = validateAnswers("pro", proEmptyQ5);
    expect(result3.valid).toBe(false);
    expect(result3.errors.q5).toBeDefined();

    // Respuestas válidas completas
    const validPro = {
      q1: "TikTok",
      q2: "algunos",
      q3: 10,
      q4: "sí",
      q5: ["cintillo", "más productos"],
      q6: "sí",
      q6_porque: "Excelente servicio",
      q7: "sí",
    };
    const result4 = validateAnswers("pro", validPro);
    expect(result4.valid).toBe(true);
    expect(Object.keys(result4.errors).length).toBe(0);
  });

  it("E6 Código del servidor y enlace WhatsApp: Formato exacto de mensaje y enlace a soporte", () => {
    const code = "DZ-H8M3Q7";
    const slug = "zz-audit-calzados";
    const msg = buildSurveyWhatsAppMessage(code, slug);
    expect(msg).toBe("Hola, terminé la encuesta de DIZI. Mi código es DZ-H8M3Q7 (tienda: zz-audit-calzados).");

    const link = buildSurveyWhatsAppLink(code, slug);
    expect(link).toContain("https://wa.me/51925176472");
    expect(link).toContain(encodeURIComponent(msg));
  });

  it("E7 Una sola vez: Dada una tienda que ya respondió, canStoreTakeSurvey retorna false", () => {
    const storeSemilla: Store = { ...baseStore, plan: "semilla" };
    expect(canStoreTakeSurvey(storeSemilla, false)).toBe(true);
    expect(canStoreTakeSurvey(storeSemilla, true)).toBe(false);
  });

  it("E13 CSV sin datos personales: Cuando el super exporta, el CSV no contiene correos ni teléfonos", () => {
    const records: Array<SurveyResponseRecord & { store_slug?: string }> = [
      {
        id: "resp-1",
        store_id: "zz-audit-f43-store-1",
        store_slug: "zz-audit-tienda-1",
        survey_version: SURVEY_VERSION,
        plan_at_response: "semilla",
        reward_code: "DZ-AB2345",
        reward_status: "pendiente",
        created_at: "2026-11-03T10:00:00Z",
        answers: {
          q1: "TikTok",
          q2: "algunos",
          q3: 9,
          q4: "vender por WhatsApp",
          q5: "tiempo",
          q6: "Me gustaría catálogo con video",
          q7: "S/ 20",
        },
      },
      {
        id: "resp-2",
        store_id: "zz-audit-f43-store-2",
        store_slug: "zz-audit-tienda-2",
        survey_version: SURVEY_VERSION,
        plan_at_response: "pro",
        reward_code: "DZ-CD6789",
        reward_status: "aplicado",
        reward_applied_at: "2026-11-03T11:00:00Z",
        created_at: "2026-11-03T10:30:00Z",
        answers: {
          q1: "Facebook",
          q2: "casi todos mis pedidos",
          q3: 10,
          q4: "sí",
          q5: ["cintillo", "varios banners"],
          q6: "sí",
          q6_porque: "Nos ayudó a ordenar pedidos",
          q7: "sí",
        },
      },
    ];

    const csv = exportSurveyResponsesToCsv(records);

    // Cabecera presente
    expect(csv).toContain('"Fecha","Codigo","Tienda (Slug)","Plan al responder","Estado premio"');
    expect(csv).toContain("DZ-AB2345");
    expect(csv).toContain("DZ-CD6789");
    expect(csv).toContain("cintillo; varios banners");

    // Ausencia estricta de datos personales: ningún @ (correos) ni teléfonos con formato
    expect(csv).not.toMatch(/@/);
    expect(csv).not.toMatch(/51925176472/);
    expect(csv).not.toMatch(/999888777/);
  });

  it("E15 Cierre de encuesta: Fecha de cierre respetada y bloqueada", () => {
    const beforeClosing = new Date("2026-11-30T23:59:00-05:00");
    const afterClosing = new Date("2026-12-01T00:00:01-05:00");

    expect(isSurveyClosed(beforeClosing)).toBe(false);
    expect(isSurveyClosed(afterClosing)).toBe(true);

    const store: Store = { ...baseStore, plan: "semilla" };
    expect(canStoreTakeSurvey(store, false, beforeClosing)).toBe(true);
    expect(canStoreTakeSurvey(store, false, afterClosing)).toBe(false);
  });

  it("E16 Demo fuera: Tiendas con slug terminado en -demo quedan fuera", () => {
    const demoStore: Store = {
      ...baseStore,
      plan: "semilla",
      slug: "tienda-prueba-demo",
    };

    expect(isDemoStore(demoStore)).toBe(true);
    expect(getSurveyGroup(demoStore)).toBeNull();
    expect(canStoreTakeSurvey(demoStore, false)).toBe(false);
  });

  it("getRewardDescription: Devuelve el texto adecuado según el grupo o plan", () => {
    expect(getRewardDescription("semilla")).toBe("15 días de prueba de Emprendedor");
    expect(getRewardDescription("emprendedor")).toBe("15 días más de tu plan");
    expect(getRewardDescription("pro")).toBe("15 días más de tu plan");
  });
});
