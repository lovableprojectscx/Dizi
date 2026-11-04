/**
 * @file photo-format.ts
 * @description Única fuente de verdad para el cálculo y recomendación del formato
 * de fotos por tienda (RF-41.1, RF-41.2, RNF-41.2).
 */

export type PhotoFormat = "square" | "portrait" | "contain";

export interface PhotoAspect {
  ratio: string;
  contain?: boolean;
}

export interface StorePhotoFormatSource {
  model?: string | null;
  photoFormat?: PhotoFormat | string | null;
  photo_format?: PhotoFormat | string | null;
  niche?: string | null;
}

/**
 * Determina si un diseño o layout es flexible para el formato de fotos.
 * Solo Grilla ("grid", "minimalista", "clasico") y Bloom Estándar ("bloom_general",
 * o "bloom" cuando no es florería) permiten elegir formato (RF-41.2).
 * Todos los demás diseños ignoran el formato.
 */
export function isFlexiblePhotoLayout(
  layoutOrModel: string | null | undefined,
  niche?: string | null,
): boolean {
  if (!layoutOrModel) return false;
  const l = layoutOrModel.trim().toLowerCase();

  // Variantes y alias de Grilla
  if (l === "grid" || l === "minimalista" || l === "clasico") return true;

  // Bloom Estándar
  if (l === "bloom_general") return true;
  if (l === "bloom" && (niche || "").trim().toLowerCase() !== "floreria") return true;

  return false;
}

/**
 * Resuelve la proporción de foto para una tienda y layout.
 * Es la ÚNICA fuente de verdad para el renderizado de fotos en catálogo (RNF-41.2).
 *
 * @param store Tienda (contiene photoFormat/photo_format, model, niche)
 * @param layout Layout efectivo a evaluar (opcional, si se omite usa store.model)
 * @returns { ratio, contain } o null si el diseño no es flexible (el diseño manda).
 */
export function getPhotoAspect(
  store: StorePhotoFormatSource | null | undefined,
  layout?: string | null,
): PhotoAspect | null {
  const effectiveLayout = (layout || store?.model || "grid").trim().toLowerCase();
  const niche = store?.niche ?? null;

  if (!isFlexiblePhotoLayout(effectiveLayout, niche)) {
    return null;
  }

  const format = (store?.photoFormat ?? store?.photo_format ?? null) as PhotoFormat | null;

  // Si no hay formato explícito (NULL histórico):
  // Grilla dibuja en 4/3 y Bloom en 1/1 (RF-41.1)
  if (!format) {
    if (effectiveLayout === "grid" || effectiveLayout === "minimalista" || effectiveLayout === "clasico") {
      return { ratio: "4/3", contain: false };
    }
    return { ratio: "1/1", contain: false };
  }

  switch (format) {
    case "square":
      return { ratio: "1/1", contain: false };
    case "portrait":
      return { ratio: "3/4", contain: false };
    case "contain":
      return { ratio: "1/1", contain: true };
    default:
      // Fallback ante valores inesperados: comportarse como NULL histórico
      if (effectiveLayout === "grid" || effectiveLayout === "minimalista" || effectiveLayout === "clasico") {
        return { ratio: "4/3", contain: false };
      }
      return { ratio: "1/1", contain: false };
  }
}

/**
 * Sugiere el formato de fotos inicial según el rubro de la tienda (RF-41.6).
 * - "ropa" (o moda/boutique): "portrait" (Vertical 3:4)
 * - cualquier otro ("comida", "bisuteria", "tech", "servicios", "general", null): "square" (Cuadrada 1:1)
 */
export function suggestPhotoFormat(niche?: string | null): "portrait" | "square" {
  const n = (niche || "").trim().toLowerCase();
  if (n === "ropa" || n === "moda" || n === "boutique") {
    return "portrait";
  }
  return "square";
}
