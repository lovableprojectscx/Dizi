/**
 * image-utils.ts
 * Utilidades de procesamiento de imágenes en el cliente.
 * Convierte cualquier formato (JPG, PNG, HEIC, etc.) a WebP
 * (o JPEG como fallback en navegadores antiguos/iOS antiguos)
 * usando el canvas del browser — sin dependencias externas.
 */

const MAX_DIMENSION = 800; // px máximo en cualquier lado (optimizado para carga HD súper rápida en móviles a ~35KB)
const WEBP_QUALITY = 0.75; // 0.75 = nitidez cristalina reduciendo el peso de fotos de 10MB a solo ~35KB-45KB

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
 * Redimensiona si algún lado supera maxDimension, manteniendo la proporción y máxima nitidez.
 */
export function convertImageToWebP(
  file: File,
  maxDimension: number = MAX_DIMENSION,
  qualityOverride?: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      // Redimensionar si es muy grande
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
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
      const quality = qualityOverride ?? (format === "image/webp" ? WEBP_QUALITY : 0.88);
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
 * Genera una miniatura ligera en WebP (máx 400px, ~25KB) a partir de un archivo File.
 * Preserva nitidez cristalina en recuadros pequeños de la grilla.
 */
export function createThumbnailWebP(file: File): Promise<string> {
  return convertImageToWebP(file, 400, 0.78);
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
 * Optimiza una URL de imagen para el catálogo.
 * Devuelve la URL original limpia para garantizar compatibilidad total con Supabase Storage
 * y prevenir fallos de carga en el sitio público.
 */
export function getOptimizedImageUrl(url: string | null | undefined, _width: number = 600): string {
  if (!url) return "";
  const cleanUrl = url.split("?")[0].trim();
  return cleanUrl;
}

/**
 * Devuelve la URL de la miniatura optimizada de 400px si está disponible,
 * o la URL limpia original como fallback.
 */
export function getThumbnailUrl(url: string | null | undefined): string {
  if (!url) return "";
  const cleanUrl = url.trim();
  if (cleanUrl.includes("/storage/v1/object/public/images/") && cleanUrl.endsWith(".webp") && !cleanUrl.endsWith("_thumb.webp")) {
    return cleanUrl.replace(/\.webp$/, "_thumb.webp");
  }
  return cleanUrl;
}
