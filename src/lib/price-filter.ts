import type { Product } from "./types";

/** Rango mínimo y máximo entero (`[min, max]`) de precios filtrables del catálogo */
export interface PriceBounds {
  min: number;
  max: number;
}

/**
 * Normaliza los límites `{ min, max }` entregados por `get_public_store.price_bounds`.
 * Devuelve `undefined` si el payload es nulo, inválido o negativo.
 */
export function parsePriceBounds(raw: unknown): PriceBounds | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const candidate = raw as { min?: unknown; max?: unknown };
  if (candidate.min === null || candidate.min === undefined || candidate.max === null || candidate.max === undefined) {
    return undefined;
  }
  const min = Number(candidate.min);
  const max = Number(candidate.max);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) {
    return undefined;
  }
  return {
    min: Math.floor(min),
    max: Math.ceil(max),
  };
}

/**
 * Extrae todos los precios numéricos positivos (> 0) de un producto:
 * su precio base (si > 0) y los precios positivos de sus variaciones.
 * Los productos "A consultar" retornan arreglo vacío.
 */
export function getProductFilterablePrices(
  product: Pick<Product, "price" | "variations">,
): number[] {
  const prices: number[] = [];
  const basePrice = Number(product.price);
  if (Number.isFinite(basePrice) && basePrice > 0) {
    prices.push(basePrice);
  }
  if (Array.isArray(product.variations)) {
    for (const variation of product.variations) {
      if (variation && variation.price !== undefined && variation.price !== null) {
        const varPrice = Number(variation.price);
        if (Number.isFinite(varPrice) && varPrice > 0) {
          prices.push(varPrice);
        }
      }
    }
  }
  return prices;
}

/**
 * Calcula los límites `[min, max]` del slider de precios.
 * Prioriza `serverBounds` (calculado en PostgreSQL sobre el catálogo completo hasta `effective_limit`)
 * para evitar sesgo en catálogos > 36 ítems; si no viene definido, calcula sobre `products` en memoria.
 */
export function computePriceBounds(
  products: Array<Pick<Product, "price" | "variations">>,
  serverBounds?: PriceBounds | null,
): PriceBounds {
  const validServerBounds = parsePriceBounds(serverBounds);
  if (validServerBounds) {
    return validServerBounds;
  }

  let min = Infinity;
  let max = -Infinity;
  for (const product of products) {
    for (const price of getProductFilterablePrices(product)) {
      if (price < min) min = price;
      if (price > max) max = price;
    }
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 0 };
  }

  return {
    min: Math.floor(min),
    max: Math.ceil(max),
  };
}

/**
 * Indica si existe un rango filtrable real (al menos dos precios distintos).
 */
export function hasUsablePriceBounds(bounds: PriceBounds): boolean {
  return Number.isFinite(bounds.min) && Number.isFinite(bounds.max) && bounds.min < bounds.max;
}

/**
 * Clampa `[nextMin, nextMax]` dentro de `bounds` garantizando `min <= max`.
 * Devuelve `null` cuando cubre todo `[bounds.min, bounds.max]` (sin recorte activo),
 * desactivando automáticamente el modo filtro para restaurar portada y productos "A consultar".
 */
export function normalizePriceRange(
  nextMin: number,
  nextMax: number,
  bounds: PriceBounds,
): [number, number] | null {
  if (!hasUsablePriceBounds(bounds)) return null;

  const clampedMin = Math.max(bounds.min, Math.min(bounds.max, Math.floor(nextMin)));
  const clampedMax = Math.min(bounds.max, Math.max(bounds.min, Math.ceil(nextMax)));
  const min = Math.min(clampedMin, clampedMax);
  const max = Math.max(clampedMin, clampedMax);

  if (min <= bounds.min && max >= bounds.max) {
    return null;
  }
  return [min, max];
}

/**
 * Determina si el filtro por rango de precios está recortando activamente el universo.
 */
export function isPriceRangeActive(
  range: [number, number] | null | undefined,
  bounds: PriceBounds,
): range is [number, number] {
  if (!range || !hasUsablePriceBounds(bounds)) return false;
  return range[0] > bounds.min || range[1] < bounds.max;
}

/**
 * Evalúa si un producto coincide con el rango de precio activo.
 * - Sin recorte activo (`null` o rango completo): retorna `true` (incluye "A consultar").
 * - Con recorte activo: excluye productos "A consultar" y retorna `true` si el precio base (> 0)
 *   o al menos una variación positiva cae dentro de `[min, max]`.
 */
export function matchesPriceRange(
  product: Pick<Product, "price" | "variations">,
  range: [number, number] | null | undefined,
  bounds: PriceBounds,
): boolean {
  if (!isPriceRangeActive(range, bounds)) {
    return true;
  }
  const prices = getProductFilterablePrices(product);
  if (prices.length === 0) {
    return false;
  }
  const [min, max] = range;
  return prices.some((p) => p >= min && p <= max);
}

/**
 * Etiqueta unificada para el chip de rango de precio en la barra de resultados.
 */
export function formatPriceRangeLabel(range: [number, number]): string {
  return `S/ ${range[0]} – S/ ${range[1]}`;
}

/**
 * Detecta errores de PostgREST / PostgreSQL cuando el RPC de 7 parámetros aún no ha sido
 * aplicado en producción (`PGRST202`, `42883`, 404), habilitando fallback a la firma legacy de 5 args.
 */
export function shouldFallbackToLegacyProductsRpc(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as {
    code?: unknown;
    message?: unknown;
    details?: unknown;
    hint?: unknown;
    status?: unknown;
  };
  const code = String(err.code || "");
  if (code === "PGRST202" || code === "42883" || err.status === 404) {
    return true;
  }
  const combined =
    `${String(err.message || "")} ${String(err.details || "")} ${String(err.hint || "")}`.toLowerCase();
  return (
    combined.includes("could not find the function") ||
    combined.includes("p_min_price") ||
    combined.includes("p_max_price")
  );
}
