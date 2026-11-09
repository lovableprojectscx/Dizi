/**
 * @file types.ts
 * @description Tipos e interfaces para el generador de imágenes de estados e historias (F46).
 */

export type ShareImageStyle = "etiqueta" | "editorial" | "marco-color" | "oferta";

export type ShareImageFormat = "historia" | "cuadrada";

export interface ShareImageDimensions {
  width: number;
  height: number;
}

export const SHARE_IMAGE_SIZES: Record<ShareImageFormat, ShareImageDimensions> = {
  historia: { width: 1080, height: 1920 },
  cuadrada: { width: 1080, height: 1080 },
};

export interface ShareImageData {
  storeName: string;
  storeSlug: string;
  storeLogoUrl: string | null;
  primaryColor: string;
  productId: string;
  productName: string;
  price: number;
  originalPrice: number | null;
  isOnSale: boolean;
  discountPct: number | null;
  productImageUrl: string;
  catalogProductUrl: string;
  showBranding: boolean;
  brandingText: string;
}

export interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ValidationResult {
  ok: boolean;
  collisions: string[];
  safeZoneViolations: string[];
  tagViolations: string[];
}
