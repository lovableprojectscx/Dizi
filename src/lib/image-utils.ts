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

export const SUPABASE_STORAGE_IMAGES_PREFIX =
  "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/";

/**
 * Convierte una URL pública de Supabase Storage a la URL del CDN Bunny (Pull Zone)
 * si la variable VITE_IMAGE_CDN_BASE está configurada en el entorno.
 * Si la variable está vacía o indefinida, devuelve la URL de Supabase intacta (interruptor apagado).
 * Quita query params (?t=...) para garantizar caché unificada en el CDN.
 * Soporta tanto Plan A (https://<cdn>) como Plan B (https://<cdn>/storage/v1/object/public/images).
 */
export function toCdnUrl(url: string | null | undefined): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  const cdnBase = (import.meta.env.VITE_IMAGE_CDN_BASE || "").trim().replace(/\/+$/, "");
  if (!cdnBase) {
    return trimmed;
  }

  if (trimmed.startsWith(SUPABASE_STORAGE_IMAGES_PREFIX)) {
    // Quitar query params (?t=...) para garantizar caché unificada en el CDN
    const cleanUrl = trimmed.split("?")[0].trim();
    const relativePath = cleanUrl.slice(SUPABASE_STORAGE_IMAGES_PREFIX.length);
    return `${cdnBase}/${relativePath}`;
  }

  return trimmed;
}

/**
 * Convierte una URL servida desde el CDN de vuelta a su URL canónica de origen en Supabase Storage.
 * Usado para fallbacks resilientes y para operaciones que requieren la URL original de Storage.
 */
export function toSupabaseUrl(url: string | null | undefined): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  const cdnBase = (import.meta.env.VITE_IMAGE_CDN_BASE || "").trim().replace(/\/+$/, "");
  if (cdnBase && trimmed.startsWith(cdnBase + "/")) {
    const relativePath = trimmed.slice((cdnBase + "/").length);
    return `${SUPABASE_STORAGE_IMAGES_PREFIX}${relativePath}`;
  }

  if (trimmed.includes(".b-cdn.net/")) {
    const parts = trimmed.split(".b-cdn.net/");
    if (parts.length > 1) {
      let relativePath = parts[1];
      if (relativePath.startsWith("storage/v1/object/public/images/")) {
        relativePath = relativePath.slice("storage/v1/object/public/images/".length);
      }
      return `${SUPABASE_STORAGE_IMAGES_PREFIX}${relativePath}`;
    }
  }

  return trimmed;
}

/**
 * Optimiza una URL de imagen para el catálogo.
 * Si el CDN está activo mediante VITE_IMAGE_CDN_BASE, devuelve la URL del CDN.
 * De lo contrario, devuelve la URL limpia original para compatibilidad con Supabase Storage.
 */
export function getOptimizedImageUrl(url: string | null | undefined, _width: number = 600): string {
  if (!url) return "";
  const cleanUrl = url.split("?")[0].trim();
  return toCdnUrl(cleanUrl);
}

/**
 * Devuelve la URL de la miniatura optimizada de 400px (_thumb.webp).
 * Si el CDN está activo, la entrega desde el CDN. Si no, desde Supabase Storage.
 */
export function getThumbnailUrl(url: string | null | undefined): string {
  if (!url) return "";
  const cleanUrl = url.split("?")[0].trim();
  let result = cleanUrl;
  if (
    cleanUrl.includes("/storage/v1/object/public/images/") &&
    cleanUrl.endsWith(".webp") &&
    !cleanUrl.endsWith("_thumb.webp") &&
    !cleanUrl.includes("_var_")
  ) {
    result = cleanUrl.replace(/\.webp$/, "_thumb.webp");
  }
  return toCdnUrl(result);
}

/**
 * Ruta del placeholder neutro cuando una imagen no existe o falla su carga.
 */
export const NO_IMAGE_PLACEHOLDER = "/images/sin-foto.svg";

/**
 * Limpia y normaliza la lista de candidatos de imagen para evitar bucles:
 * - Filtra valores nulos, indefinidos y cadenas vacías.
 * - Deduplica preservando el orden original.
 * - Si un candidato apunta al CDN, añade su contraparte directa en Supabase como fallback previo a la original.
 * - Limpia query params de URLs para evitar redundancias.
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
    // Si es URL con query params, limpiarla igual que getOptimizedImageUrl
    if (trimmed.includes("?") && (trimmed.includes("/storage/v1/object/public/images/") || trimmed.includes(".b-cdn.net/"))) {
      trimmed = trimmed.split("?")[0].trim();
    }
    if (!seen.has(trimmed)) {
      seen.add(trimmed);
      result.push(trimmed);
    }

    // Si el candidato es una URL de CDN, agregar su equivalente directo en Supabase Storage
    const supUrl = toSupabaseUrl(trimmed);
    if (supUrl && supUrl !== trimmed && !seen.has(supUrl)) {
      seen.add(supUrl);
      result.push(supUrl);
    }
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
 * Normaliza una URL para comparación exacta en el manejador de errores.
 */
function normalizeUrlForCompare(url: string | null | undefined): string {
  if (!url) return "";
  const clean = url.split("?")[0].trim();
  if (clean.startsWith("data:") || clean.startsWith("blob:")) {
    return clean;
  }
  try {
    const base = typeof window !== "undefined" && window.location?.origin ? window.location.origin : "https://dizi.idenza.site";
    return new URL(clean, base).href;
  } catch {
    return clean;
  }
}

/**
 * Manejador unificado y resiliente de fallos de carga de imágenes (onError).
 * Recibe una lista de candidatos ordenados por prioridad:
 *   [miniatura CDN -> miniatura Supabase -> original Supabase -> NO_IMAGE_PLACEHOLDER]
 *
 * Determina el siguiente intento buscando la URL actual (img.src) dentro de la lista de candidatos,
 * lo que previene desincronizaciones cuando React actualiza el src en el mismo elemento <img>.
 * Si la URL actual no está en la lista, comienza por la primera distinta a la actual.
 * Al llegar al placeholder desactiva el onerror para evitar bucles infinitos.
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

  const normCurrent = normalizeUrlForCompare(currentSrc);
  const normalizedCandidates = cleanCandidates.map(normalizeUrlForCompare);

  // Buscar la URL actual dentro de la lista de candidatos normalizados
  const currentIndex = normalizedCandidates.findIndex((norm) => norm === normCurrent);

  let nextIndex: number;
  if (currentIndex !== -1) {
    // Si la URL actual está en la lista, avanzar a la siguiente posición
    nextIndex = currentIndex + 1;
  } else {
    // Si no está, empezar por la primera distinta a la actual
    const firstDifferentIndex = normalizedCandidates.findIndex((norm) => norm !== normCurrent);
    nextIndex = firstDifferentIndex !== -1 ? firstDifferentIndex : 0;
  }

  if (nextIndex >= cleanCandidates.length) {
    img.onerror = null;
    return;
  }

  const nextUrl = cleanCandidates[nextIndex];
  img.setAttribute("data-img-step", String(nextIndex));

  if (nextUrl === NO_IMAGE_PLACEHOLDER || nextUrl.includes(NO_IMAGE_PLACEHOLDER) || nextUrl.endsWith("sin-foto.svg")) {
    img.onerror = null;
  }

  img.src = nextUrl;
}


