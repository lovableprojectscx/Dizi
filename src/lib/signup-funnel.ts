/**
 * @file signup-funnel.ts
 * @description Medición anónima y no bloqueante del embudo de registro (RF-49.10, RNF-49.4).
 * Solo envía `session_id`, `step` y `source` opcional (sin correos, nombres ni teléfonos).
 */

import { supabase } from "./supabase";
import { sanitizeSignupUtm } from "./slug";

export type FunnelStep =
  | "vio_registro"
  | "completo_negocio"
  | "creo_cuenta"
  | "creo_producto"
  | "salto_producto";

const SESSION_STORAGE_KEY = "dizi_signup_funnel_session";
const UTM_STORAGE_KEY = "dizi_signup_funnel_utm";

function generateFunnelSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `sf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Obtiene o crea un `session_id` efímero (8–64 chars) en `sessionStorage`.
 */
export function getOrCreateFunnelSessionId(): string {
  if (typeof window === "undefined") {
    return generateFunnelSessionId();
  }
  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing && existing.length >= 8 && existing.length <= 64) {
      return existing;
    }
    const created = generateFunnelSessionId().slice(0, 64);
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    return generateFunnelSessionId().slice(0, 64);
  }
}

export function rememberFunnelSource(source?: string | null): void {
  if (typeof window === "undefined") return;
  const clean = sanitizeSignupUtm(source);
  try {
    if (clean) {
      window.sessionStorage.setItem(UTM_STORAGE_KEY, clean);
    }
  } catch {
    // Silencioso en entornos sin sessionStorage
  }
}

export function getRememberedFunnelSource(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sanitizeSignupUtm(window.sessionStorage.getItem(UTM_STORAGE_KEY));
  } catch {
    return null;
  }
}

/**
 * Registra un paso del embudo sin bloquear el flujo ni mostrar errores al usuario.
 */
export async function logFunnelStep(
  step: FunnelStep,
  source?: string | null,
): Promise<boolean> {
  try {
    const sessionId = getOrCreateFunnelSessionId();
    const cleanSource = sanitizeSignupUtm(source) ?? getRememberedFunnelSource();

    const { error } = await supabase.from("signup_funnel_events").insert({
      session_id: sessionId,
      step,
      source: cleanSource,
    });

    if (error) {
      console.warn(`[signup-funnel] No se pudo registrar paso ${step}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[signup-funnel] Excepción silenciosa en paso ${step}:`, err);
    return false;
  }
}
