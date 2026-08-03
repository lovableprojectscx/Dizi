/**
 * image-utils.ts
 * Utilidades de procesamiento de imágenes en el cliente.
 * Convierte cualquier formato (JPG, PNG, HEIC, etc.) a WebP
 * (o JPEG como fallback en navegadores antiguos/iOS antiguos)
 * usando el canvas del browser — sin dependencias externas.
 */

const MAX_DIMENSION = 1080; // px máximo en cualquier lado (optimizado para carga HD rápida en móviles)
const WEBP_QUALITY = 0.80; // 0.80 = excelente nitidez visual reduciendo el peso a ~150KB por foto de 10MB

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
 * Para miniaturas en tarjetas solicita un ancho ajustado (ej. 400-600px) a través de wsrv.nl,
 * mientras que para zoom o vistas ampliadas devuelve alta resolución (1600px+) o la URL original.
 */
export function getOptimizedImageUrl(url: string | null | undefined, width: number = 600): string {
  if (!url) return "";
  const cleanUrl = url.trim();

  // Si es un data URL (base64) o un blob local, devolver tal cual
  if (cleanUrl.startsWith("data:") || cleanUrl.startsWith("blob:")) {
    return cleanUrl;
  }

  // Si ya viene formateado con wsrv.nl o es SVG, devolver tal cual
  if (cleanUrl.includes("wsrv.nl") || cleanUrl.endsWith(".svg")) {
    return cleanUrl;
  }

  try {
    const isHighRes = width >= 1200;
    const quality = isHighRes ? 92 : 80;
    // Si se pide alta resolución (>1600px) y es HTTP(S), enrutar a wsrv.nl con alta calidad WebP
    const encoded = encodeURIComponent(cleanUrl);
    return `https://wsrv.nl/?url=${encoded}&w=${width}&q=${quality}&output=webp`;
  } catch (e) {
    return cleanUrl;
  }
}
