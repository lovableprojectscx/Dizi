/**
 * image-utils.ts
 * Utilidades de procesamiento de imágenes en el cliente.
 * Convierte cualquier formato (JPG, PNG, HEIC, etc.) a WebP
 * usando el canvas del browser — sin dependencias externas.
 */

const MAX_DIMENSION = 2048; // px máximo en cualquier lado (incrementado para mayor nitidez)
const WEBP_QUALITY  = 0.92; // 0-1: 0.92 = calidad visual premium, evita artefactos y mantiene textos nítidos

/**
 * Convierte un File de imagen a WebP y lo devuelve como data URL.
 * Redimensiona si algún lado supera MAX_DIMENSION, manteniendo proporción.
 */
export function convertImageToWebP(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      // Redimensionar si es muy grande
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Canvas no disponible"));
        return;
      }

      // Habilitar suavizado de imagen en alta calidad para evitar pérdida de nitidez al redimensionar
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);

      const webpDataUrl = canvas.toDataURL("image/webp", WEBP_QUALITY);
      resolve(webpDataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo leer la imagen"));
    };

    img.src = objectUrl;
  });
}
