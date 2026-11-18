/**
 * @file slug.ts
 * @description Utilidades puras para generar y validar slugs de tienda y parámetros
 * de origen de llegada (`?origen=` / `utm_source=`) sin tocar `?ref=`.
 */

export const MAX_SLUG_LENGTH = 40;

export const SIGNUP_SOURCES = [
  "tiktok",
  "facebook",
  "instagram",
  "recomendacion",
  "otro",
] as const;

export type SignupSource = (typeof SIGNUP_SOURCES)[number];

export const SIGNUP_SOURCE_LABELS: Record<SignupSource, string> = {
  tiktok: "TikTok",
  facebook: "Facebook",
  instagram: "Instagram",
  recomendacion: "Me recomendaron",
  otro: "Otro",
};

/**
 * Convierte el nombre de un negocio en un slug URL válido (RF-49.3):
 * minúsculas, sin tildes/diacríticos, espacios/puntuación en guiones, máx. 40 caracteres.
 */
export function slugifyStoreName(name: string): string {
  if (!name) return "";
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");
}

/**
 * Sanitiza la edición manual del campo link permitiendo escribir guiones intermedios.
 */
export function sanitizeSlugInput(value: string): string {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, MAX_SLUG_LENGTH);
}

/**
 * Sanitiza un parámetro corto de origen (`^[a-z0-9-]{1,40}$`) para `stores.signup_utm`
 * y `signup_funnel_events.source`. Retorna `null` si no queda contenido válido.
 */
export function sanitizeSignupUtm(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Lee el origen de campaña desde `search` (`?origen=` con prioridad, o `utm_source=`).
 * Nunca lee ni mezcla `?ref=` (reservado para código de referidos).
 */
export function extractSignupUtmFromSearch(search: string): string | null {
  const params = new URLSearchParams(search);
  const raw = params.get("origen") ?? params.get("utm_source");
  return sanitizeSignupUtm(raw);
}
