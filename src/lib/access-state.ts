/**
 * @file access-state.ts
 * @description Fuente única de verdad en TypeScript para el estado de acceso de tiendas (F57).
 * Espejo exacto de la función SQL `public.store_access_state(p_store_id)` y su matriz de casos.
 */

import { useState, useEffect } from "react";
import type { Store } from "./types";
import { supabase } from "./supabase";

export type StoreAccessState = "activa" | "gracia" | "pausa";

export interface AppConfigState {
  pausaActiva: boolean;
  pausaDesde?: string | null;
  semillaFin?: string | null;
}

const GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000; // 3 días

/**
 * Determina el estado de acceso de una tienda ('activa' | 'gracia' | 'pausa').
 * Espejo fiel de public.store_access_state() en Postgres.
 *
 * @param store Datos de la tienda (plan, slug, planExpiresAt).
 * @param config Configuración global de la plataforma (pausaActiva, pausaDesde, semillaFin).
 * @param now Instante temporal de evaluación (permite pruebas deterministas).
 */
export function getStoreAccessState(
  store: Pick<Store, "slug" | "plan"> & {
    planExpiresAt?: string | null;
    subscriptionStatus?: string | null;
  },
  config: AppConfigState = { pausaActiva: false, pausaDesde: null, semillaFin: null },
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

  // 2. Regla Semilla (F57.2): Una Semilla NUNCA pasa a 'pausa' directamente.
  // La pausa solo llega después de que apply_semilla_sunset la convierte en prueba y esa prueba vence + 3 días.
  if (store.plan === "semilla") {
    return "activa";
  }

  const { pausaActiva, pausaDesde } = config;

  // 3. Si el interruptor general está apagado (false), todo es idéntico a hoy (nadie entra en pausa)
  if (!pausaActiva) {
    return "activa";
  }

  // 4. Tiendas sin fecha de expiración
  if (!store.planExpiresAt) {
    return "activa";
  }

  const expiresMs = new Date(store.planExpiresAt).getTime();
  const graceEndMs = expiresMs + GRACE_PERIOD_MS;
  const nowMs = now.getTime();

  // 5. Tiendas pagadas que vencieron ANTES de que se active la pausa (Milance, Giosathi, etc.)
  // Si plan <> 'semilla' y (plan_expires_at + 3 días) < pausa_desde -> 'activa' (régimen anterior: como Semilla efectiva)
  if (pausaDesde) {
    const pausaDesdeMs = new Date(pausaDesde).getTime();
    if (graceEndMs < pausaDesdeMs) {
      return "activa";
    }
  }

  // 6. Régimen nuevo (con pausa_activa = true):
  if (nowMs <= expiresMs) {
    return "activa";
  }
  if (nowMs <= graceEndMs) {
    return "gracia";
  }
  return "pausa";
}

/**
 * Retorna true si la tienda se encuentra en pausa comercial efectiva.
 */
export function isStorePaused(
  store: Pick<Store, "slug" | "plan"> & {
    planExpiresAt?: string | null;
    subscriptionStatus?: string | null;
  },
  config: AppConfigState = { pausaActiva: false, pausaDesde: null, semillaFin: null },
  now: Date = new Date(),
): boolean {
  return getStoreAccessState(store, config, now) === "pausa";
}

/**
 * Retorna true si la tienda se encuentra en período de gracia de 3 días.
 */
export function isStoreInGrace(
  store: Pick<Store, "slug" | "plan"> & {
    planExpiresAt?: string | null;
    subscriptionStatus?: string | null;
  },
  config: AppConfigState = { pausaActiva: false, pausaDesde: null, semillaFin: null },
  now: Date = new Date(),
): boolean {
  return getStoreAccessState(store, config, now) === "gracia";
}

let cachedConfig: AppConfigState = { pausaActiva: false, pausaDesde: null, semillaFin: null };

/**
 * Consulta la configuración global de app_config en Supabase con caché en memoria.
 */
export async function fetchAppConfig(): Promise<AppConfigState> {
  try {
    const { data, error } = await supabase.from("app_config").select("key, value");
    if (!error && data) {
      const config: AppConfigState = { pausaActiva: false, pausaDesde: null, semillaFin: null };
      for (const row of data as any[]) {
        if (row.key === "pausa_activa") {
          config.pausaActiva = row.value === true || row.value === "true";
        }
        if (row.key === "pausa_desde") {
          config.pausaDesde = row.value ? String(row.value).replace(/"/g, "") : null;
        }
        if (row.key === "semilla_fin") {
          config.semillaFin = row.value ? String(row.value).replace(/"/g, "") : null;
        }
      }
      cachedConfig = config;
      return config;
    }
  } catch {
    // Si la tabla aún no existe o hay falla de red, mantiene valor seguro
  }
  return cachedConfig;
}

/**
 * Hook de React para consumir la configuración global de app_config de manera reactiva.
 */
export function useAppConfig(): AppConfigState {
  const [config, setConfig] = useState<AppConfigState>(cachedConfig);

  useEffect(() => {
    let isMounted = true;
    fetchAppConfig().then((cfg) => {
      if (isMounted) {
        setConfig(cfg);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return config;
}
