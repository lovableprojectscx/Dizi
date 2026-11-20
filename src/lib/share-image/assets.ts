/**
 * @file assets.ts
 * @description Carga compartida de recursos para renderizar imágenes de estado e historia (F46 / F54):
 * tipografías del canvas, QR en memoria, logo de tienda con CORS y foto del producto con
 * respaldo automático a Supabase Storage si Bunny falla por CORS.
 */

import QRCode from "qrcode";
import { toSupabaseUrl } from "@/lib/image-utils";
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
