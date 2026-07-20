/**
 * image-utils.ts
 * Utilidades de procesamiento de imágenes en el cliente.
 * Convierte cualquier formato (JPG, PNG, HEIC, etc.) a WebP
 * (o JPEG como fallback en navegadores antiguos/iOS antiguos)
 * usando el canvas del browser — sin dependencias externas.
 */

const MAX_DIMENSION = 1200; // px máximo en cualquier lado (reducido para optimizar tamaño y ancho de banda)
const WEBP_QUALITY = 0.92; // 0-1: 0.92 = calidad visual premium, evita artefactos y mantiene textos nítidos

let _isWebpSupported: boolean | null = null;

/**
 * Detecta si el navegador actual soporta exportación a WebP desde el Canvas.
 * iOS/Safari añadió soporte recién en la versión 17.2.
 */
function isWebpSupported(): boolean {
  if (_isWebpSupported !== null) return _isWebpSupported;
  try {
    const canvas = document.createElement("canvas");
    _isWebpSupported = canvas.toDataURL("image/webp").startsWith("data:image/webp");
  } catch (e) {
    _isWebpSupported = false;
  }
  return _isWebpSupported;
}

/**
 * Convierte un File de imagen a WebP (o JPEG fallback) y lo devuelve como data URL.
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

      const format = isWebpSupported() ? "image/webp" : "image/jpeg";
      const quality = format === "image/webp" ? WEBP_QUALITY : 0.88;
      const webpDataUrl = canvas.toDataURL(format, quality);
      resolve(webpDataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo leer la imagen"));
    };

    img.src = objectUrl;
  });
}

/**
 * Intenta cargar una URL de imagen externa, la redimensiona y la convierte a WebP (o JPEG fallback) como base64 Data URL.
 * Usa crossOrigin = "anonymous" para intentar saltar restricciones CORS si el origen lo permite.
 */
export function convertImageUrlToWebP(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Si ya es un base64 Data URL, resolver inmediatamente
    if (url.startsWith("data:")) {
      resolve(url);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

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
        reject(new Error("Canvas no disponible"));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(img, 0, 0, width, height);

      try {
        const format = isWebpSupported() ? "image/webp" : "image/jpeg";
        const quality = format === "image/webp" ? WEBP_QUALITY : 0.88;
        const webpDataUrl = canvas.toDataURL(format, quality);
        resolve(webpDataUrl);
      } catch (err) {
        reject(new Error("No se pudo convertir a base64 debido a restricciones de CORS"));
      }
    };

    img.onerror = () => {
      reject(new Error("No se pudo cargar la imagen desde la URL"));
    };

    img.src = url;
  });
}

/**
 * Optimiza una URL de imagen para reducir el consumo de ancho de banda y cached egress.
 * Si es una URL de Supabase (o cualquier imagen externa), la enruta a través del servicio gratuito de optimización e imágenes images.weserv.nl.
 */
export function getOptimizedImageUrl(url: string | null | undefined, width: number = 600): string {
  if (!url) return "";
  
  // Si ya es un base64 Data URL, o si es un SVG local, o si es una ruta local, no lo tocamos.
  if (
    url.startsWith("data:") || 
    url.includes(".svg") || 
    url.startsWith("/") || 
    url.startsWith("./")
  ) {
    return url;
  }
  
  // Limpiar espacios en blanco
  const cleanUrl = url.trim();
  
  // Enrutar por weserv.nl para redimensionar y convertir a webp en la caché de Cloudflare
  return `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&w=${width}&output=webp`;
}
