/**
 * @file image-utils.ts
 * @description Utilidades de procesamiento y compresión de imágenes en el cliente (Browser Canvas).
 * Convierte formatos pesados (JPG, PNG, HEIC) a WebP optimizado (~35 KB) o JPEG como fallback,
 * redimensiona manteniendo nitidez cristalina, genera miniaturas complementarias (_thumb.webp)
 * y construye URLs con transformaciones de tamaño para el CDN de Supabase Storage.
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
 * Genera una miniatura ligera en WebP (máx 400px, ~12KB–15KB) a partir de un archivo File.
 * Preserva nitidez cristalina en recuadros pequeños de la grilla.
 */
export function createThumbnailWebP(file: File): Promise<string> {
  return convertImageToWebP(file, 400, 0.70);
}

/**
 * Genera una miniatura ligera en WebP (máx 400px, calidad 0.70, ~12KB–15KB) a partir de un base64 Data URL.
 * Usado al guardar productos para crear el asset complementario `_thumb.webp`.
 */
export function createThumbnailFromBase64(
  base64Data: string,
  maxDimension: number = 400,
  quality: number = 0.70
): Promise<string> {
  return new Promise((resolve) => {
    if (!base64Data || !base64Data.startsWith("data:")) {
      resolve(base64Data);
      return;
    }

    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

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
        resolve(base64Data);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "medium";
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const format = isWebpSupported() ? "image/webp" : "image/jpeg";
        const thumbDataUrl = canvas.toDataURL(format, quality);
        resolve(thumbDataUrl);
      } catch (err) {
        resolve(base64Data);
      }
    };

    img.onerror = () => {
      resolve(base64Data);
    };

    img.src = base64Data;
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
  const cleanUrl = url.split("?")[0].trim();
  if (
    cleanUrl.includes("/storage/v1/object/public/images/") &&
    cleanUrl.endsWith(".webp") &&
    !cleanUrl.endsWith("_thumb.webp") &&
    !cleanUrl.includes("_var_")
  ) {
    return cleanUrl.replace(/\.webp$/, "_thumb.webp");
  }
  return cleanUrl;
}

/**
 * Ruta del placeholder neutro cuando una imagen no existe o falla su carga.
 */
export const NO_IMAGE_PLACEHOLDER = "/images/sin-foto.svg";

/**
 * Limpia y normaliza la lista de candidatos de imagen para evitar bucles:
 * - Filtra valores nulos, indefinidos y cadenas vacías.
 * - Deduplica preservando el orden original.
 * - Limpia query params de URLs de Supabase Storage para evitar redundancias.
 * - Preserva Data URLs en base64 y URLs externas.
 * - Garantiza que NO_IMAGE_PLACEHOLDER esté siempre al final de la lista.
 */
export function cleanImageCandidates(candidates: (string | null | undefined)[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const c of candidates) {
    if (!c || typeof c !== "string") continue;
    let trimmed = c.trim();
    if (!trimmed) continue;
    // Si es URL de Supabase con query params, limpiarla igual que getOptimizedImageUrl
    if (trimmed.includes("/storage/v1/object/public/images/") && trimmed.includes("?")) {
      trimmed = trimmed.split("?")[0].trim();
    }
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }

  // Asegurar que NO_IMAGE_PLACEHOLDER esté presente exactamente una vez al final
  if (seen.has(NO_IMAGE_PLACEHOLDER)) {
    const withoutPlaceholder = result.filter((url) => url !== NO_IMAGE_PLACEHOLDER);
    withoutPlaceholder.push(NO_IMAGE_PLACEHOLDER);
    return withoutPlaceholder;
  } else {
    result.push(NO_IMAGE_PLACEHOLDER);
    return result;
  }
}

/**
 * Manejador unificado y resiliente de fallos de carga de imágenes (onError).
 * Recibe una lista de candidatos ordenados por prioridad:
 *   [miniatura, original, NO_IMAGE_PLACEHOLDER]
 * Avanza paso a paso registrando el índice en el atributo `data-img-step` del <img>.
 * Al llegar al placeholder deja de manejar para evitar cualquier bucle infinito.
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event> | Event | { currentTarget?: any; target?: any },
  candidates: (string | null | undefined)[]
): void {
  const img = ((event as any)?.currentTarget || (event as any)?.target) as HTMLImageElement | null;
  if (!img) return;

  const cleanCandidates = cleanImageCandidates(candidates);
  if (cleanCandidates.length === 0) return;

  // Si la imagen actual ya contiene o termina en sin-foto.svg, detener cualquier bucle
  const currentSrc = img.src || "";
  if (currentSrc.includes(NO_IMAGE_PLACEHOLDER) || currentSrc.endsWith("sin-foto.svg")) {
    img.onerror = null;
    return;
  }

  const stepAttr = img.getAttribute("data-img-step");
  const nextStep = stepAttr !== null ? parseInt(stepAttr, 10) + 1 : 1;

  // Si ya nos encontrábamos en el placeholder o más allá
  if (stepAttr !== null) {
    const prevStep = parseInt(stepAttr, 10);
    if (prevStep >= 0 && prevStep < cleanCandidates.length) {
      if (cleanCandidates[prevStep] === NO_IMAGE_PLACEHOLDER) {
        img.onerror = null;
        return;
      }
    }
  }

  if (nextStep >= cleanCandidates.length) {
    img.onerror = null;
    return;
  }

  const nextUrl = cleanCandidates[nextStep];
  img.setAttribute("data-img-step", String(nextStep));

  if (nextUrl === NO_IMAGE_PLACEHOLDER) {
    img.onerror = null;
  }

  img.src = nextUrl;
}

