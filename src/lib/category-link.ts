/**
 * @file category-link.ts
 * @description Módulo unificado para generación y resolución de URLs de categorías y productos en el catálogo público (/t/:slug?c=...).
 * Diseñado conforme a la especificación F25 de la FASE 4A.
 */

export interface CategoryLike {
  id: string;
  name: string;
  icon?: string;
  productCount?: number;
}

/**
 * Limpia el nombre crudo de una categoría, quitando el sufijo del ícono ('|flower').
 */
export function cleanCategoryName(rawName?: string | null): string {
  if (!rawName) return "";
  return rawName.split("|")[0].trim();
}

/**
 * Convierte el nombre de una categoría a un slug URL-friendly:
 * 1. Quita todo desde '|' (sufijo de icono)
 * 2. Quita emojis y símbolos gráficos
 * 3. Convierte a minúsculas
 * 4. Reemplaza '&' por espacio
 * 5. Quita tildes / diacríticos
 * 6. Convierte cualquier caracter no alfanumérico a '-'
 * 7. Elimina guiones repetidos y en los extremos
 * Si el resultado es vacío, devuelve el fallbackId (si fue provisto) o cadena vacía.
 */
export function categorySlug(name?: string | null, fallbackId?: string): string {
  if (!name || typeof name !== "string") {
    return fallbackId || "";
  }

  // 1. Quitar sufijo de ícono
  let s = name.split("|")[0];

  // 2. Quitar emojis y símbolos
  s = s.replace(/\p{Extended_Pictographic}/gu, "");
  s = s.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu, "");

  // 3. Minúsculas
  s = s.toLowerCase();

  // 4. '&' -> espacio
  s = s.replace(/&/g, " ");

  // 5. Quitar tildes
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 6. Todo lo que no sea letra o número -> '-'
  s = s.replace(/[^a-z0-9]+/g, "-");

  // 7. Sin guiones repetidos ni bordes
  s = s.replace(/-+/g, "-").replace(/^-+|-+$/g, "");

  if (!s) {
    return fallbackId || "";
  }

  return s;
}

/**
 * Mapea las categorías de una tienda a sus slugs definitivos,
 * resolviendo colisiones: si dos categorías dan el mismo slug, la segunda usa su ID.
 */
export function getCategorySlugMap(categories: CategoryLike[]): Map<string, string> {
  const slugMap = new Map<string, string>();
  const usedSlugs = new Set<string>();

  for (const cat of categories) {
    const rawSlug = categorySlug(cat.name, cat.id);
    if (!rawSlug) {
      slugMap.set(cat.id, cat.id);
      usedSlugs.add(cat.id.toLowerCase());
    } else if (usedSlugs.has(rawSlug.toLowerCase())) {
      // Slug duplicado dentro de la misma tienda: para la segunda se usa su id
      slugMap.set(cat.id, cat.id);
      usedSlugs.add(cat.id.toLowerCase());
    } else {
      slugMap.set(cat.id, rawSlug);
      usedSlugs.add(rawSlug.toLowerCase());
    }
  }

  return slugMap;
}

/**
 * Obtiene el slug público para una categoría específica en el contexto de su tienda.
 */
export function getCategorySlug(categories: CategoryLike[], category: CategoryLike): string {
  const map = getCategorySlugMap(categories);
  return map.get(category.id) || categorySlug(category.name, category.id) || category.id;
}

/**
 * Busca una categoría por el parámetro URL (?c=...):
 * 1. Si es 'ofertas', retorna { id: 'sale', name: 'Ofertas' }
 * 2. Busca coincidencia por slug
 * 3. Si no, busca coincidencia por id
 * 4. Si no hay coincidencia, retorna null
 */
export function findCategoryByParam<T extends CategoryLike>(
  categories: T[],
  param?: string | null
): T | { id: "sale"; name: "Ofertas" } | null {
  if (!param || !param.trim()) return null;
  const p = param.trim();
  const pSlug = categorySlug(p);
  const pLower = p.toLowerCase();

  if (pLower === "ofertas" || pSlug === "ofertas") {
    return { id: "sale", name: "Ofertas" };
  }

  const slugMap = getCategorySlugMap(categories);

  // 1. Por slug (coincidencia con slug normalizado con categorySlug o param directo en minúsculas)
  const matchBySlug = categories.find((c) => {
    const catSlug = slugMap.get(c.id)?.toLowerCase();
    return (pSlug && catSlug === pSlug) || catSlug === pLower;
  });
  if (matchBySlug) return matchBySlug;

  // 2. Por ID directo
  const matchById = categories.find(
    (c) => c.id.toLowerCase() === pLower
  );
  if (matchById) return matchById;

  return null;
}

export interface BuildStoreUrlOptions {
  c?: string | null;
  p?: string | null;
  ref?: string | null;
  origin?: string;
  extraParams?: Record<string, string>;
}

/**
 * Único punto centralizado para armar enlaces públicos a tiendas (/t/:slug).
 * Soporta parámetros de categoría (?c=), producto (?p=) y preservación de referral (?ref=).
 */
export function buildStoreUrl(slug: string, options: BuildStoreUrlOptions = {}): string {
  const origin =
    options.origin ||
    (typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://dizi.idenza.site");

  const cleanSlug = slug.replace(/^\/?t\//, "").replace(/^\//, "").replace(/\/$/, "");
  const basePath = options.c
    ? `/t/${cleanSlug}/${encodeURIComponent(options.c)}`
    : `/t/${cleanSlug}`;
  const url = new URL(basePath, origin);

  let refToUse = options.ref;
  if (!refToUse && typeof window !== "undefined" && window.location?.search) {
    try {
      const current = new URLSearchParams(window.location.search);
      const currentRef = current.get("ref");
      if (currentRef) refToUse = currentRef;
    } catch {}
  }

  if (refToUse) {
    url.searchParams.set("ref", refToUse);
  }

  if (options.p) {
    url.searchParams.set("p", options.p);
  }

  if (options.extraParams) {
    for (const [k, v] of Object.entries(options.extraParams)) {
      if (v) url.searchParams.set(k, v);
    }
  }

  return url.toString();
}
