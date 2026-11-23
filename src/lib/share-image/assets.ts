/**
 * @file assets.ts
 * @description Carga compartida de recursos para renderizar imágenes de estado e historia (F46 / F54):
 * tipografías del canvas, QR en memoria, logo de tienda con CORS y foto del producto con
 * respaldo automático a Supabase Storage si Bunny falla por CORS.
 */

import QRCode from "qrcode";
import { toSupabaseUrl, getOriginalImageUrl } from "@/lib/image-utils";
import { ensureShareImageFontsLoaded } from "./styles";
import type { ShareImageData } from "./types";

export interface LoadedShareImageAssets {
  productImage: HTMLImageElement | null;
  storeLogoImage: HTMLImageElement | null;
  qrImage: HTMLCanvasElement | null;
  imageError: string | null;
}

export interface LoadShareImageAssetsOptions {
  /** Tamaño del QR en px (300 en diálogo, 160 en miniaturas). Por defecto 300. */
  qrSize?: number;
  /** Permite cancelar trabajo pendiente si el componente se desmonta. */
  signal?: AbortSignal;
}

function loadCorsImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Error de carga de imagen"));
    img.src = url;
  });
}

/**
 * Carga en memoria fuentes, QR, logo y foto del producto para `drawShareImage`.
 * Reutilizado por `ShareImageDialog` y `StylePreviewStrip` sin duplicar lógica CORS.
 */
export async function loadShareImageAssets(
  shareData: Pick<ShareImageData, "catalogProductUrl" | "storeLogoUrl" | "productImageUrl">,
  options: LoadShareImageAssetsOptions = {},
): Promise<LoadedShareImageAssets> {
  const { qrSize = 300, signal } = options;

  let qrImage: HTMLCanvasElement | null = null;
  let storeLogoImage: HTMLImageElement | null = null;
  let productImage: HTMLImageElement | null = null;
  let imageError: string | null = null;

  await ensureShareImageFontsLoaded();
  if (signal?.aborted) {
    return { productImage, storeLogoImage, qrImage, imageError };
  }

  // Generar QR en memoria
  try {
    const qrCanvas = document.createElement("canvas");
    await QRCode.toCanvas(qrCanvas, shareData.catalogProductUrl, {
      width: qrSize,
      margin: 1,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    });
    qrImage = qrCanvas;
  } catch {
    qrImage = null;
  }

  if (signal?.aborted) {
    return { productImage, storeLogoImage, qrImage, imageError };
  }

  // Cargar logo si existe (no bloqueante)
  if (shareData.storeLogoUrl) {
    try {
      storeLogoImage = await loadCorsImage(shareData.storeLogoUrl);
    } catch {
      storeLogoImage = null;
    }
  }

  if (signal?.aborted) {
    return { productImage, storeLogoImage, qrImage, imageError };
  }

  // Cargar foto del producto con respaldo a Supabase Storage si Bunny falla por CORS
  if (shareData.productImageUrl) {
    try {
      productImage = await loadCorsImage(shareData.productImageUrl);
    } catch {
      const fallbackUrl = toSupabaseUrl(shareData.productImageUrl);
      if (fallbackUrl && fallbackUrl !== shareData.productImageUrl) {
        try {
          productImage = await loadCorsImage(fallbackUrl);
        } catch {
          imageError = "No se pudo cargar la foto con permisos de exportación.";
          productImage = null;
        }
      } else {
        imageError = "No se pudo cargar la foto del producto.";
        productImage = null;
      }
    }
  }

  return {
    productImage,
    storeLogoImage,
    qrImage,
    imageError,
  };
}

export interface LoadedCatalogImageAssets {
  productImages: HTMLImageElement[];
  storeLogoImage: HTMLImageElement | null;
  qrImage: HTMLCanvasElement | null;
  imageError: string | null;
}

/**
 * Carga en memoria fuentes, QR, logo y hasta 4 fotos de productos para la imagen de catálogo (F55).
 */
export async function loadCatalogImageAssets(
  store: { slug: string; logo?: string | null; products?: Array<{ visible?: boolean; isSample?: boolean; image?: string | null }> },
  baseUrl?: string,
  options: LoadShareImageAssetsOptions = {}
): Promise<LoadedCatalogImageAssets> {
  const { qrSize = 300, signal } = options;
  const origin = (baseUrl || (typeof window !== "undefined" ? window.location.origin : "https://dizi.la")).replace(/\/+$/, "");
  const catalogUrl = `${origin}/t/${store.slug}`;

  let qrImage: HTMLCanvasElement | null = null;
  let storeLogoImage: HTMLImageElement | null = null;
  const productImages: HTMLImageElement[] = [];
  const imageError: string | null = null;

  await ensureShareImageFontsLoaded();
  if (signal?.aborted) {
    return { productImages, storeLogoImage, qrImage, imageError };
  }

  // Generar QR en memoria del enlace al catálogo completo
  try {
    const qrCanvas = document.createElement("canvas");
    await QRCode.toCanvas(qrCanvas, catalogUrl, {
      width: qrSize,
      margin: 1,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    });
    qrImage = qrCanvas;
  } catch {
    qrImage = null;
  }

  if (signal?.aborted) {
    return { productImages, storeLogoImage, qrImage, imageError };
  }

  // Logo de la tienda
  if (store.logo && store.logo.trim()) {
    try {
      storeLogoImage = await loadCorsImage(store.logo.trim());
    } catch {
      storeLogoImage = null;
    }
  }

  if (signal?.aborted) {
    return { productImages, storeLogoImage, qrImage, imageError };
  }

  // Hasta 4 fotos de productos reales y visibles
  const eligibleProducts = (store.products || [])
    .filter((p) => !p.isSample && p.visible && p.image && p.image.trim().length > 0)
    .slice(0, 4);

  for (const prod of eligibleProducts) {
    if (signal?.aborted) break;
    const url = getOriginalImageUrl(prod.image!);
    if (!url) continue;

    try {
      const img = await loadCorsImage(url);
      productImages.push(img);
    } catch {
      const fallbackUrl = toSupabaseUrl(url);
      if (fallbackUrl && fallbackUrl !== url) {
        try {
          const imgFallback = await loadCorsImage(fallbackUrl);
          productImages.push(imgFallback);
        } catch {
          // Ignorar fallo de foto individual
        }
      }
    }
  }

  return {
    productImages,
    storeLogoImage,
    qrImage,
    imageError,
  };
}
