/**
 * @file survey.ts
 * @description Módulo centralizado y fuente de verdad para la Encuesta de Calidad F43.
 * Contiene la versión de la encuesta, fecha de cierre, preguntas y opciones por plan,
 * validación de respuestas en cliente, generación de enlaces de WhatsApp y exportación CSV.
 */

import { type Store, type PlanId, getEffectivePlan } from "./types";
import { DIZI_SUPPORT_PHONE, buildWaUrl } from "./whatsapp";

/** Versión vigente de la encuesta de calidad */
export const SURVEY_VERSION = "2026-11";

/** Fecha y hora oficial de cierre de la encuesta (America/Lima) */
export const SURVEY_CLOSES_AT = "2026-11-30T23:59:59-05:00";

/** Grupos de encuesta según el plan efectivo del comercio */
export type SurveyGroup = "semilla" | "emprendedor" | "pro";

/** Tipos de preguntas soportadas */
export type SurveyQuestionType = "single" | "multiple" | "scale" | "text";

export interface SurveyQuestion {
  id: "q1" | "q2" | "q3" | "q4" | "q5" | "q6" | "q7";
  number: number;
  label: string;
  type: SurveyQuestionType;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  required: boolean;
  maxLength?: number;
  followUp?: {
    id: "q6_porque";
    label: string;
    type: "text";
    required: boolean;
    maxLength: number;
  };
}

/**
 * Preguntas universales (1 a 3) compartidas por todos los grupos de la versión 2026-11.
 * Textos y opciones literales según propuesta.md:18-21.
 */
export const COMMON_QUESTIONS: SurveyQuestion[] = [
  {
    id: "q1",
    number: 1,
    label: "¿Cómo conociste DIZI?",
    type: "single",
    options: ["TikTok", "Facebook", "recomendación", "Idenza", "otro"],
    required: true,
  },
  {
    id: "q2",
    number: 2,
    label: "¿Te llegan pedidos de clientes desde tu catálogo?",
    type: "single",
    options: ["casi todos mis pedidos", "algunos", "pocos", "ninguno"],
    required: true,
  },
  {
    id: "q3",
    number: 3,
    label: "Del 0 al 10, ¿recomendarías DIZI a otro negocio?",
    type: "scale",
    scaleMin: 0,
    scaleMax: 10,
    required: true,
  },
];

/**
 * Preguntas específicas de Semilla (4 a 7).
 * Textos y opciones literales según propuesta.md:23-27.
 */
export const SEMILLA_QUESTIONS: SurveyQuestion[] = [
  {
    id: "q4",
    number: 4,
    label: "¿Para qué creaste tu catálogo?",
    type: "single",
    options: ["vender por WhatsApp", "link en bio", "solo probar", "otro"],
    required: true,
  },
  {
    id: "q5",
    number: 5,
    label: "¿Qué te frena para cargar más productos?",
    type: "single",
    options: ["tiempo", "es difícil", "no sé cómo", "no lo necesito", "otro"],
    required: true,
  },
  {
    id: "q6",
    number: 6,
    label: "¿Qué tendría que tener DIZI para que pagues un plan?",
    type: "text",
    maxLength: 300,
    required: true,
  },
  {
    id: "q7",
    number: 7,
    label: "¿Cuánto pagarías al mes por tu catálogo?",
    type: "single",
    options: ["nada", "S/ 10", "S/ 20", "S/ 40 o más"],
    required: true,
  },
];

/**
 * Preguntas específicas de Emprendedor (4 a 7).
 * Textos y opciones literales según propuesta.md:29-33.
 */
export const EMPRENDEDOR_QUESTIONS: SurveyQuestion[] = [
  {
    id: "q4",
    number: 4,
    label: "¿Empezaste con el plan gratis antes de pagar?",
    type: "single",
    options: ["sí", "no"],
    required: true,
  },
  {
    id: "q5",
    number: 5,
    label: "¿Qué te hizo decidir pagar?",
    type: "single",
    options: [
      "más productos",
      "quitar la marca DIZI",
      "PDF",
      "banner",
      "precio por mayor",
      "otro",
    ],
    required: true,
  },
  {
    id: "q6",
    number: 6,
    label: "¿Qué te haría pasar a Pro?",
    type: "single",
    options: [
      "cintillo de anuncios",
      "3 banners",
      "varios vendedores",
      "más productos",
      "nada",
    ],
    required: true,
  },
  {
    id: "q7",
    number: 7,
    label: "¿Te interesa pagar el año completo con 25% de descuento?",
    type: "single",
    options: ["sí", "no"],
    required: true,
  },
];

/**
 * Preguntas específicas de Pro (4 a 7).
 * Textos y opciones literales según propuesta.md:35-39.
 */
export const PRO_QUESTIONS: SurveyQuestion[] = [
  {
    id: "q4",
    number: 4,
    label: "¿Empezaste con el plan gratis antes de pagar?",
    type: "single",
    options: ["sí", "no"],
    required: true,
  },
  {
    id: "q5",
    number: 5,
    label: "¿Qué funciones de Pro usas?",
    type: "multiple",
    options: [
      "cintillo",
      "varios banners",
      "varios vendedores",
      "más productos",
      "ninguna en especial",
    ],
    required: true,
  },
  {
    id: "q6",
    number: 6,
    label: "¿Piensas renovar?",
    type: "single",
    options: ["sí", "tal vez", "no"],
    required: true,
    followUp: {
      id: "q6_porque",
      label: "¿por qué?",
      type: "text",
      required: false,
      maxLength: 300,
    },
  },
  {
    id: "q7",
    number: 7,
    label: "¿Te interesa pagar el año completo con 25% de descuento?",
    type: "single",
    options: ["sí", "no"],
    required: true,
  },
];

/**
 * Determina si una tienda es demo o interna según la regla unificada:
 * plan 'ilimitado' O slug terminado en '-demo'.
 */
export function isDemoStore(store: { plan: string; slug: string }): boolean {
  if (!store) return false;
  if (store.plan === "ilimitado") return true;
  if (typeof store.slug === "string" && store.slug.toLowerCase().endsWith("-demo")) {
    return true;
  }
  return false;
}

/**
 * Obtiene el grupo de encuesta correspondiente para una tienda (RF-43.2).
 * - Demos e Ilimitado: no participan (retorna null).
 * - Tienda en prueba (subscription_status = 'trial' con plan distinto de Semilla):
 *   responde las preguntas de Semilla porque aún no ha pagado.
 * - Tiendas vigentes o expiradas: resueltas por getEffectivePlan(store).
 */
export function getSurveyGroup(store: Store): SurveyGroup | null {
  if (!store) return null;
  if (isDemoStore(store)) return null;

  // Regla RF-43.2: tienda en prueba responde preguntas de Semilla
  const isTrial =
    store.subscriptionStatus === "trial" ||
    (store as any).subscription_status === "trial";
  if (isTrial && store.plan !== "semilla") {
    return "semilla";
  }

  const effective = getEffectivePlan(store);
  if (effective === "semilla") return "semilla";
  if (effective === "emprendedor") return "emprendedor";
  if (effective === "pro") return "pro";

  return null;
}

/**
 * Retorna la lista ordenada de las 7 preguntas para un grupo determinado.
 */
export function getQuestionsForGroup(group: SurveyGroup): SurveyQuestion[] {
  let specific: SurveyQuestion[] = [];
  if (group === "semilla") specific = SEMILLA_QUESTIONS;
  else if (group === "emprendedor") specific = EMPRENDEDOR_QUESTIONS;
  else if (group === "pro") specific = PRO_QUESTIONS;

  return [...COMMON_QUESTIONS, ...specific];
}

/**
 * Comprueba si la fecha límite de la encuesta ya expiró (RF-43.12).
 */
export function isSurveyClosed(now: Date = new Date()): boolean {
  const closesAt = new Date(SURVEY_CLOSES_AT).getTime();
  return now.getTime() > closesAt;
}

/**
 * Determina si la tienda puede ver la tarjeta y responder la encuesta (RF-43.1, RF-43.11, RF-43.12).
 */
export function canStoreTakeSurvey(
  store: Store,
  hasAnswered: boolean,
  now: Date = new Date()
): boolean {
  if (hasAnswered) return false;
  if (isSurveyClosed(now)) return false;
  const group = getSurveyGroup(store);
  return group !== null;
}

/**
 * Descripción del beneficio que se muestra en la pantalla final según el grupo o plan (RF-43.6).
 */
export function getRewardDescription(groupOrPlan: SurveyGroup | PlanId): string {
  if (groupOrPlan === "semilla") {
    return "15 días de prueba de Emprendedor";
  }
  return "15 días más de tu plan";
}

/**
 * Mensaje exacto de WhatsApp según RF-43.6.
 */
export function buildSurveyWhatsAppMessage(rewardCode: string, storeSlug: string): string {
  return `Hola, terminé la encuesta de DIZI. Mi código es ${rewardCode} (tienda: ${storeSlug}).`;
}

/**
 * Construye el enlace de WhatsApp para enviar el código a soporte DIZI (+51 925 176 472).
 */
export function buildSurveyWhatsAppLink(rewardCode: string, storeSlug: string): string {
  const message = buildSurveyWhatsAppMessage(rewardCode, storeSlug);
  return buildWaUrl(DIZI_SUPPORT_PHONE, message);
}

/**
 * Valida las respuestas enviadas para un grupo según los requisitos funcionales (RF-43.3).
 * Retorna si es válido y el mapa de errores por campo.
 */
export function validateAnswers(
  group: SurveyGroup,
  answers: Record<string, any>
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const questions = getQuestionsForGroup(group);

  for (const q of questions) {
    const val = answers[q.id];

    // Pregunta requerida vacía o no definida
    if (q.required) {
      if (val === undefined || val === null || val === "") {
        errors[q.id] = "Esta pregunta es obligatoria.";
        continue;
      }
    }

    if (q.type === "scale") {
      const num = Number(val);
      if (isNaN(num) || num < (q.scaleMin ?? 0) || num > (q.scaleMax ?? 10)) {
        errors[q.id] = `Selecciona un valor entre ${q.scaleMin ?? 0} y ${q.scaleMax ?? 10}.`;
      }
    } else if (q.type === "single") {
      if (val && q.options && !q.options.includes(val)) {
        errors[q.id] = "Opción inválida.";
      }
    } else if (q.type === "multiple") {
      if (!Array.isArray(val) || val.length === 0) {
        if (q.required) {
          errors[q.id] = "Selecciona al menos una opción.";
        }
      } else if (q.options) {
        const invalid = val.some((item) => !q.options?.includes(item));
        if (invalid) {
          errors[q.id] = "Una o más opciones son inválidas.";
        }
      }
    } else if (q.type === "text") {
      if (typeof val === "string") {
        if (q.maxLength && val.trim().length > q.maxLength) {
          errors[q.id] = `El texto no puede superar ${q.maxLength} caracteres.`;
        }
      }
    }

    // Validación de follow-up (ej: ¿por qué? en Pro Q6)
    if (q.followUp) {
      const followVal = answers[q.followUp.id];
      if (followVal && typeof followVal === "string") {
        if (followVal.trim().length > q.followUp.maxLength) {
          errors[q.followUp.id] = `El texto no puede superar ${q.followUp.maxLength} caracteres.`;
        }
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Estructura de registro de respuesta para la tabla y vistas.
 */
export interface SurveyResponseRecord {
  id: string;
  store_id: string;
  survey_version: string;
  plan_at_response: string;
  answers: Record<string, any>;
  reward_code: string;
  reward_status: "pendiente" | "aplicado" | "rechazado";
  reward_applied_at?: string | null;
  created_at: string;
  // Campos enriquecidos opcionales para la vista super
  store_slug?: string;
  store_name?: string;
  owner_id?: string;
  owner_store_count?: number;
}

/**
 * Escapa valores para CSV estándar RFC 4180.
 */
function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  // Reemplazar saltos de línea y tabulaciones para formato uniforme
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Genera el archivo CSV con las respuestas según RF-43.10.
 * Garantiza cero correos y cero teléfonos personales.
 */
export function exportSurveyResponsesToCsv(
  responses: Array<SurveyResponseRecord & { store_slug?: string }>
): string {
  const headers = [
    "Fecha",
    "Codigo",
    "Tienda (Slug)",
    "Plan al responder",
    "Estado premio",
    "Q1 - ¿Cómo conociste DIZI?",
    "Q2 - ¿Te llegan pedidos?",
    "Q3 - NPS (0-10)",
    "Q4",
    "Q5",
    "Q6",
    "Q6 (¿Por qué?)",
    "Q7",
  ];

  const lines = [headers.map(escapeCsv).join(",")];

  for (const r of responses) {
    const ans = r.answers || {};
    const q5Val = Array.isArray(ans.q5) ? ans.q5.join("; ") : ans.q5 ?? "";
    const row = [
      r.created_at,
      r.reward_code,
      r.store_slug || r.store_id,
      r.plan_at_response,
      r.reward_status,
      ans.q1 ?? "",
      ans.q2 ?? "",
      ans.q3 ?? "",
      ans.q4 ?? "",
      q5Val,
      ans.q6 ?? "",
      ans.q6_porque ?? "",
      ans.q7 ?? "",
    ];
    lines.push(row.map(escapeCsv).join(","));
  }

  return lines.join("\r\n");
}
