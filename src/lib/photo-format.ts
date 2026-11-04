/**
 * @file photo-format.ts
 * @description Única fuente de verdad para el cálculo y recomendación del formato
 * de fotos por tienda (RF-41.1, RF-41.2, RNF-41.2, F41b).
 * La matriz de formatos permitidos y proporciones base vive exclusivamente
 * en `DESIGN_SPECS` (design-catalog.ts).
 */

import { getDesignSpec, PhotoFormat } from "./design-catalog";

export type { PhotoFormat };

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
 * Determina si un diseño o estructura es flexible para el formato de fotos.
 * Lee directamente de la ficha técnica única `DESIGN_SPECS[id].formatosFoto` (F41b / RNF-41b.2).
 */
export function isFlexiblePhotoLayout(
  layoutOrModel: string | null | undefined,
  niche?: string | null,
): boolean {
  if (!layoutOrModel) return false;
  const spec = getDesignSpec(layoutOrModel, niche);
  return Boolean(spec.formatosFoto && spec.formatosFoto.length > 0);
}

/**
 * Resuelve la proporción de foto para una tienda y diseño.
 * Es la ÚNICA fuente de verdad para el renderizado de fotos en catálogo (RNF-41.2, F41b).
 * Resuelve siempre el ID oficial de la estructura mediante `getDesignSpec`.
 *
 * @param store Tienda (contiene photoFormat/photo_format, model, niche)
 * @param layout Diseño o modelo a evaluar (opcional, si se omite usa store.model)
 * @returns { ratio, contain } o null si el diseño no es flexible (el diseño manda).
 */
export function getPhotoAspect(
  store: StorePhotoFormatSource | null | undefined,
  layout?: string | null,
): PhotoAspect | null {
  const modelToResolve = layout ?? store?.model;
  const spec = getDesignSpec(modelToResolve, store?.niche);

  // Si el diseño no tiene formatos permitidos (no es flexible), el diseño manda (E7)
  if (!spec.formatosFoto || spec.formatosFoto.length === 0) {
    return null;
  }

  const baseRatio = spec.proporcionBase || "1/1";
  const format = (store?.photoFormat ?? store?.photo_format ?? null) as PhotoFormat | null;

  // Si no hay formato explícito (NULL histórico) (E1):
  if (!format) {
    return { ratio: baseRatio, contain: false };
  }

  // RF-41b.3 / E3: Si el formato guardado no está permitido en el diseño actual,
  // el catálogo se ve como "como hoy" (proporción base), sin borrar el valor guardado
  if (!spec.formatosFoto.includes(format)) {
    return { ratio: baseRatio, contain: false };
  }

  // Formato permitido en el diseño actual:
  switch (format) {
    case "square":
      return { ratio: "1/1", contain: false };
    case "portrait":
      return { ratio: "3/4", contain: false };
    case "contain":
      return { ratio: "1/1", contain: true };
    default:
      return { ratio: baseRatio, contain: false };
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
