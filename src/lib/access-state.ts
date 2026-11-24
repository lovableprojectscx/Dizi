/**
 * @file access-state.ts
 * @description Fuente única de verdad en TypeScript para el estado de acceso de tiendas (F57).
 * Espejo exacto de la función SQL `public.store_access_state(p_store_id)` y su tabla de 11 casos.
 */

import type { Store } from "./types";

export type StoreAccessState = "activa" | "gracia" | "pausa";

export interface AppConfigState {
  pausaActiva: boolean;
  semillaFin: string | null;
}

const GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000; // 3 días

/**
 * Determina el estado de acceso de una tienda ('activa' | 'gracia' | 'pausa').
 * Espejo fiel de public.store_access_state() en Postgres.
 *
 * @param store Datos de la tienda (plan, slug, planExpiresAt).
 * @param config Configuración global de la plataforma (pausaActiva, semillaFin).
 * @param now Instante temporal de evaluación (permite pruebas deterministas).
 */
export function getStoreAccessState(
  store: Pick<Store, "slug" | "plan"> & {
    planExpiresAt?: string | null;
    subscriptionStatus?: string | null;
  },
  config: AppConfigState = { pausaActiva: false, semillaFin: null },
  now: Date = new Date(),
): StoreAccessState {
  if (!store) return "pausa";

  const slug = store.slug || "";

  // 1. Excepciones: nunca se pausan
  // (a) Demos (*-demo)
  if (slug.endsWith("-demo")) {
    return "activa";
  }
  // (b) Tiendas de auditoría o pruebas internas (zz-*)
  if (slug.startsWith("zz-")) {
    return "activa";
  }
  // (c) Cuentas internas (Ilimitado sin expiración)
  if (store.plan === "ilimitado" && !store.planExpiresAt) {
    return "activa";
  }

  const { pausaActiva, semillaFin } = config;
  const nowMs = now.getTime();

  // 2. Si el interruptor general está apagado (false), nadie entra en pausa
  if (!pausaActiva) {
    if (store.plan === "semilla") {
      return "activa";
    }
    if (!store.planExpiresAt) {
      return "activa";
    }
    const expiryMs = new Date(store.planExpiresAt).getTime();
    if (isNaN(expiryMs) || nowMs <= expiryMs) {
      return "activa";
    }
    if (nowMs <= expiryMs + GRACE_PERIOD_MS) {
      return "gracia";
    }
    // Con interruptor apagado, la tienda vencida no se pausa (degrada a Semilla libre)
    return "activa";
  }

  // 3. Interruptor encendido (true):
  // (a) Plan Semilla
  if (store.plan === "semilla") {
    // Si semillaFin es null, no hay transición activa para Semilla: se mantiene activa
    if (!semillaFin) {
      return "activa";
    }

    // Comparar fecha en zona horaria local/UTC (YYYY-MM-DD)
    const todayStr = now.toISOString().slice(0, 10);
    const targetDateStr = semillaFin.slice(0, 10);

    if (todayStr < targetDateStr) {
      return "activa";
    }
    return "pausa";
  }

  // (b) Planes de pago o prueba Pro (plan !== 'semilla')
  if (!store.planExpiresAt) {
    return "activa";
  }

  const expiryMs = new Date(store.planExpiresAt).getTime();
  if (isNaN(expiryMs)) {
    return "activa";
  }

  // Vigente
  if (nowMs <= expiryMs) {
    return "activa";
  }

  // En tolerancia (gracia) hasta 3 días
  if (nowMs <= expiryMs + GRACE_PERIOD_MS) {
    return "gracia";
  }

  // Superó los 3 días de gracia: pausa comercial
  return "pausa";
}

/**
 * Indica si una tienda se encuentra en pausa comercial según la configuración activa.
 */
export function isStorePaused(
  store: Pick<Store, "slug" | "plan"> & {
    planExpiresAt?: string | null;
    subscriptionStatus?: string | null;
  },
  config?: AppConfigState,
  now?: Date,
): boolean {
  return getStoreAccessState(store, config, now) === "pausa";
}

/**
 * Indica si una tienda se encuentra en sus 3 días de gracia.
 */
export function isStoreInGrace(
  store: Pick<Store, "slug" | "plan"> & {
    planExpiresAt?: string | null;
    subscriptionStatus?: string | null;
  },
  config?: AppConfigState,
  now?: Date,
): boolean {
  return getStoreAccessState(store, config, now) === "gracia";
}
