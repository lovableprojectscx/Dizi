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

const FALLBACK_SLUG_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Genera un slug de respaldo `mi-tienda-xxxx` con 4 caracteres al azar.
 */
export function generateFallbackStoreSlug(randomFn: () => number = Math.random): string {
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(randomFn() * FALLBACK_SLUG_CHARS.length) % FALLBACK_SLUG_CHARS.length;
    suffix += FALLBACK_SLUG_CHARS[idx];
  }
  return `mi-tienda-${suffix}`;
}

function appendSlugSuffix(base: string, suffix: string): string {
  const cleanSuffix = slugifyStoreName(suffix);
  if (!cleanSuffix) return base;
  const maxBaseLen = Math.max(1, MAX_SLUG_LENGTH - cleanSuffix.length - 1);
  const trimmedBase = base.slice(0, maxBaseLen).replace(/-+$/g, "");
  return trimmedBase ? `${trimmedBase}-${cleanSuffix}` : cleanSuffix.slice(0, MAX_SLUG_LENGTH);
}

export interface ResolveSlugOptions {
  storeName: string;
  city?: string | null;
  isAvailable: (candidate: string) => Promise<boolean>;
  maxNumericAttempts?: number;
  randomFn?: () => number;
}

/**
 * Genera candidatos de link automático desde el nombre del negocio:
 * 1. `slugifyStoreName(nombre)`
 * 2. Si está ocupado y hay ciudad: `nombre-ciudad`
 * 3. Luego `nombre-2`, `nombre-3`, ...
 * 4. Si el nombre no produce un slug válido (< 3 caracteres), usa `mi-tienda-xxxx`.
 */
export async function resolveAvailableStoreSlug({
  storeName,
  city,
  isAvailable,
  maxNumericAttempts = 15,
  randomFn = Math.random,
}: ResolveSlugOptions): Promise<string> {
  const base = slugifyStoreName(storeName);
  if (!base || base.length < 3) {
    for (let i = 0; i < 5; i++) {
      const candidate = generateFallbackStoreSlug(randomFn);
      if (await isAvailable(candidate)) return candidate;
    }
    return generateFallbackStoreSlug(randomFn);
  }

  const candidates: string[] = [base];
  const cleanCity = city ? slugifyStoreName(city) : "";
  if (cleanCity) {
    const withCity = appendSlugSuffix(base, cleanCity);
    if (withCity !== base) candidates.push(withCity);
  }
  for (let n = 2; n <= maxNumericAttempts + 1; n++) {
    candidates.push(appendSlugSuffix(base, String(n)));
  }

  for (const candidate of candidates) {
    if (await isAvailable(candidate)) {
      return candidate;
    }
  }

  return generateFallbackStoreSlug(randomFn);
}
