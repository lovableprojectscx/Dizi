/**
 * @file semilla-notice.ts
 * @description Fuente única de verdad en el cliente para el aviso de fin del plan gratis (F57.1).
 * Funciones puras y deterministas evaluadas siempre en zona horaria America/Lima,
 * alineadas exactamente con `public.semilla_sunset_targets(p_s date)` en Postgres.
 */

import { GRACE_DAYS, type Store } from "./types";
import type { AppConfigState } from "./access-state";

const DAY_MS = 24 * 60 * 60 * 1000;
const GRACE_PERIOD_MS = GRACE_DAYS * DAY_MS;

const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

const limaDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Lima",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export type SemillaNoticeStoreInput = Pick<Store, "slug" | "plan"> & {
  planExpiresAt?: string | null;
  subscriptionStatus?: string | null;
  active?: boolean;
};

interface CalendarDateParts {
  year: number;
  month: number;
  day: number;
}

/**
 * Extrae año, mes (1..12) y día de una cadena ISO corta `YYYY-MM-DD` sin conversión UTC->local.
 */
function parseIsoDateParts(raw: string | null | undefined): CalendarDateParts | null {
  if (!raw) return null;
  const cleaned = String(raw).replace(/"/g, "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(cleaned);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

/**
 * Obtiene la fecha calendario actual (año, mes 1..12, día) en hora oficial de Lima (`America/Lima`).
 */
function getLimaDateParts(now: Date): CalendarDateParts | null {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) return null;
  const parts = limaDateFormatter.formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  if (!year || !month || !day) return null;
  return { year, month, day };
}

/**
 * Calcula cuántos días calendario faltan en Lima hasta `config.semillaFin`.
 * - Positivo (> 0): hoy en Lima es anterior a `semillaFin`.
 * - 0: hoy en Lima es exactamente el día S (`semillaFin`).
 * - Negativo (< 0): el día S ya pasó en Lima.
 * - `null`: `semillaFin` está vacío o no es válido.
 */
export function daysUntilSemillaFin(
  config: Pick<AppConfigState, "semillaFin"> | null | undefined,
  now: Date = new Date(),
): number | null {
  const target = parseIsoDateParts(config?.semillaFin);
  if (!target) return null;

  const todayLima = getLimaDateParts(now);
  if (!todayLima) return null;

  const targetUtcMidnight = Date.UTC(target.year, target.month - 1, target.day);
  const todayUtcMidnight = Date.UTC(todayLima.year, todayLima.month - 1, todayLima.day);

  return Math.round((targetUtcMidnight - todayUtcMidnight) / DAY_MS);
}

/**
 * Formatea `config.semillaFin` en español sin desfase de zona horaria (ej. `'2026-12-09'` -> `"9 de diciembre"`).
 */
export function formatSemillaFin(
  config: Pick<AppConfigState, "semillaFin"> | null | undefined,
): string | null {
  const parts = parseIsoDateParts(config?.semillaFin);
  if (!parts) return null;
  return `${parts.day} de ${MONTHS_ES[parts.month - 1]}`;
}

/**
 * Formatea el día inmediatamente anterior a `config.semillaFin` (ej. `'2026-12-09'` -> `"8 de diciembre"`).
 */
export function formatDayBeforeSemillaFin(
  config: Pick<AppConfigState, "semillaFin"> | null | undefined,
): string | null {
  const parts = parseIsoDateParts(config?.semillaFin);
  if (!parts) return null;
  const prev = new Date(Date.UTC(parts.year, parts.month - 1, parts.day - 1));
  return `${prev.getUTCDate()} de ${MONTHS_ES[prev.getUTCMonth()]}`;
}

/**
 * Formatea la cuenta regresiva legible en español ("Falta 1 día" / "Faltan N días").
 */
export function formatSemillaCountdown(days: number): string {
  return days === 1 ? "Falta 1 día" : `Faltan ${days} días`;
}

/**
 * Clave de localStorage para recordar que la ventana ya se mostró para esta tienda y esta fecha S.
 */
export function getSemillaNoticeStorageKey(storeId: string, semillaFin: string): string {
  const cleanFin = String(semillaFin).replace(/"/g, "").trim();
  return `dizi_semilla_notice_${storeId}_${cleanFin}`;
}

/**
 * Regla única (RF-57.1.1 / RF-57.1.2): decide si una tienda debe ver el aviso de fin del plan gratis
 * (tanto la franja superior como la ventana de una sola vez).
 *
 * Se muestra solo si se cumplen todas:
 * 1. `semillaFin` tiene fecha válida y hoy (hora Lima) es estrictamente anterior a esa fecha.
 * 2. La tienda está activa (`active !== false`).
 * 3. No es demo (`*-demo`), no es de prueba (`zz-*`), ni es Ilimitado sin vencimiento.
 * 4. Su plan efectivo es gratis: `plan === 'semilla'`, o tiene otro plan cuyo vencimiento + 3 días
 *    de gracia ya pasó respecto a `now` (`planExpiresAt + 3 días < now`).
 */
export function shouldShowSemillaNotice(
  store: SemillaNoticeStoreInput | null | undefined,
  config: Pick<AppConfigState, "semillaFin"> | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!store) return false;
  if (store.active === false) return false;

  // 1. Verificar fecha S en hora Lima (estrictamente antes del día S)
  const daysLeft = daysUntilSemillaFin(config, now);
  if (daysLeft === null || daysLeft <= 0) {
    return false;
  }

  // 2. Excepciones: demos, pruebas zz-* e internas Ilimitado sin vencimiento
  const slug = store.slug || "";
  if (slug.endsWith("-demo")) return false;
  if (slug.startsWith("zz-")) return false;
  if (store.plan === "ilimitado" && !store.planExpiresAt) return false;

  // 3. Grupo objetivo: Semilla directa o plan pagado/prueba que ya superó los 3 días de gracia
  if (store.plan === "semilla") {
    return true;
  }

  if (!store.planExpiresAt) {
    return false;
  }

  const expiresMs = new Date(store.planExpiresAt).getTime();
  if (Number.isNaN(expiresMs)) {
    return false;
  }

  return expiresMs + GRACE_PERIOD_MS < now.getTime();
}
