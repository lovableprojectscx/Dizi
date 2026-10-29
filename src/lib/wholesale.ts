/**
 * wholesale.ts - Motor de Reglas de Negocio para Precios por Mayor (F42)
 *
 * Fuente única de verdad para el cálculo de escalas por mayor, validaciones,
 * sugerencias de siguiente nivel y ahorros en carrito y pedidos WhatsApp.
 */

import { Product, ProductVariation, Store, WholesaleTier } from "./types";

/**
 * Evalúa si una tienda tiene habilitado el módulo de precios por mayor
 * respetando el plan comercial (Semilla o vencido queda inhabilitado).
 */
export function isStoreWholesaleEnabled(store?: Store | { wholesaleEnabled?: boolean; plan?: string } | null): boolean {
  if (!store) return false;
  if (!store.wholesaleEnabled) return false;
  if (store.plan === "semilla") return false;
  return true;
}

/**
 * Verifica si las variaciones de un producto tienen precios distintos al precio base del producto.
 * (RF-42.3 / RF-42.8: Sin variaciones con precios distintos).
 */
export function hasDisparateVariationPrices(product: Product): boolean {
  if (!product.variations || product.variations.length === 0) return false;
  const basePrice = product.price ?? 0;
  return product.variations.some(
    (v) => v.price !== null && v.price !== undefined && Number(v.price) !== basePrice,
  );
}

/**
 * Determina si un producto es elegible para aplicar precios por mayor.
 */
export function isWholesaleEligible(
  product: Product,
  store?: Store | { wholesaleEnabled?: boolean; plan?: string } | null,
): boolean {
  if (store && !isStoreWholesaleEnabled(store)) return false;
  if (product.price === null || product.price === undefined || product.price <= 0) return false;
  if (!product.wholesaleTiers || product.wholesaleTiers.length === 0) return false;
  if (hasDisparateVariationPrices(product)) return false;
  return true;
}

/**
 * Obtiene los niveles válidos y ordenados ascendentemente por cantidad mínima.
 */
export function getTiers(
  product: Product,
  store?: Store | { wholesaleEnabled?: boolean; plan?: string } | null,
): WholesaleTier[] {
  if (!isWholesaleEligible(product, store)) return [];
  return [...(product.wholesaleTiers || [])]
    .filter((t) => typeof t.min_qty === "number" && typeof t.price === "number" && t.min_qty >= 2 && t.price > 0)
    .sort((a, b) => a.min_qty - b.min_qty);
}

export interface UnitPriceCalculation {
  /** Precio unitario final a cobrar por unidad */
  unitPrice: number;
  /** Indica si se aplicó un nivel de precio por mayor */
  isWholesaleApplied: boolean;
  /** Nivel alcanzado que se aplicó (si corresponde) */
  appliedTier: WholesaleTier | null;
  /** Precio regular de referencia del producto */
  regularPrice: number;
  /** Ahorro por unidad frente al precio regular */
  unitSavings: number;
  /** Ahorro total para la cantidad del producto */
  totalSavings: number;
}

/**
 * Calcula el precio unitario de un producto en función de la cantidad acumulada
 * sumando todas sus variaciones (RF-42.6, RF-42.9).
 *
 * Regla RF-42.9: Precio que se cobra = min(precio vigente del producto, precio del nivel alcanzado).
 * Si el producto ya está en oferta a un precio menor o igual al nivel, se mantiene la oferta
 * y NO se marca como "precio por mayor aplicado" (Escenario 5).
 */
export function getUnitPrice(
  product: Product,
  totalQty: number,
  store?: Store | { wholesaleEnabled?: boolean; plan?: string } | null,
): UnitPriceCalculation {
  const regularPrice = Number(product.price ?? 0);
  const result: UnitPriceCalculation = {
    unitPrice: regularPrice,
    isWholesaleApplied: false,
    appliedTier: null,
    regularPrice,
    unitSavings: 0,
    totalSavings: 0,
  };

  if (!isWholesaleEligible(product, store) || totalQty <= 0) {
    return result;
  }

  const tiers = getTiers(product, store);
  // Buscar el nivel más alto alcanzado (el de mayor min_qty que sea <= totalQty)
  let bestTier: WholesaleTier | null = null;
  for (const tier of tiers) {
    if (totalQty >= tier.min_qty) {
      if (!bestTier || tier.price < bestTier.price) {
        bestTier = tier;
      }
    }
  }

  if (bestTier && bestTier.price < regularPrice) {
    result.unitPrice = bestTier.price;
    result.isWholesaleApplied = true;
    result.appliedTier = bestTier;
    result.unitSavings = regularPrice - bestTier.price;
    result.totalSavings = (regularPrice - bestTier.price) * totalQty;
  }

  return result;
}

export interface NextTierSuggestion {
  /** Siguiente nivel por alcanzar */
  nextTier: WholesaleTier;
  /** Cantidad de unidades que faltan para alcanzarlo */
  missingUnits: number;
  /**
   * Si debe mostrarse la sugerencia ("Agrega N más y pagas...").
   * Ajuste de Jack: solo si faltan 3 unidades o menos (missingUnits <= 3).
   */
  shouldShowSuggestion: boolean;
  /** Precio unitario al que accedería */
  targetPrice: number;
}

/**
 * Determina el siguiente nivel por alcanzar y si cumple la regla de sugerencia
 * en el carrito (mostrar sugerencia solo si faltan 3 unidades o menos).
 */
export function getNextTier(
  product: Product,
  totalQty: number,
  store?: Store | { wholesaleEnabled?: boolean; plan?: string } | null,
): NextTierSuggestion | null {
  if (!isWholesaleEligible(product, store)) return null;

  const tiers = getTiers(product, store);
  const regularPrice = Number(product.price ?? 0);

  // Buscar el primer nivel cuya cantidad mínima sea superior a la cantidad actual
  const nextTier = tiers.find((t) => t.min_qty > totalQty);
  if (!nextTier) return null;

  // Si el precio del siguiente nivel no es más barato que el precio vigente, no sugerir
  if (nextTier.price >= regularPrice) return null;

  const missingUnits = nextTier.min_qty - totalQty;

  return {
    nextTier,
    missingUnits,
    shouldShowSuggestion: missingUnits <= 3 && missingUnits > 0,
    targetPrice: nextTier.price,
  };
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valida una configuración de niveles de precio por mayor en el cliente (RF-42.3).
 */
export function validateTiers(
  tiers: WholesaleTier[],
  productPrice: number | null | undefined,
  variations?: ProductVariation[],
): ValidationResult {
  if (!tiers || tiers.length === 0) {
    return { valid: true };
  }

  if (tiers.length > 3) {
    return { valid: false, error: "Máximo 3 niveles de precio por mayor permitidos." };
  }

  const basePrice = productPrice !== null && productPrice !== undefined ? Number(productPrice) : NaN;
  if (isNaN(basePrice) || basePrice <= 0) {
    return { valid: false, error: "El producto debe tener un precio base mayor a 0." };
  }

  // Verificar variaciones con precios dispares
  if (variations && variations.length > 0) {
    const hasDifferent = variations.some(
      (v) => v.price !== null && v.price !== undefined && Number(v.price) !== basePrice,
    );
    if (hasDifferent) {
      return {
        valid: false,
        error: "No se puede activar precio por mayor en productos con variaciones a distinto precio.",
      };
    }
  }

  let prevQty = 0;
  let prevPrice = basePrice;

  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    const qty = Number(tier.min_qty);
    const price = Number(tier.price);

    if (isNaN(qty) || isNaN(price)) {
      return { valid: false, error: "Cada nivel debe tener una cantidad y un precio válidos." };
    }

    if (qty < 2) {
      return { valid: false, error: "La cantidad mínima debe ser al menos 2 unidades." };
    }

    if (price <= 0) {
      return { valid: false, error: "El precio por mayor debe ser mayor a 0." };
    }

    if (price >= basePrice) {
      return {
        valid: false,
        error: `El precio del Nivel ${i + 1} (S/ ${price.toFixed(2)}) debe ser menor al precio normal del producto (S/ ${basePrice.toFixed(2)}).`,
      };
    }

    if (i > 0) {
      if (qty <= prevQty) {
        return {
          valid: false,
          error: `La cantidad del Nivel ${i + 1} (${qty}) debe ser mayor a la del Nivel ${i} (${prevQty}).`,
        };
      }
      if (price >= prevPrice) {
        return {
          valid: false,
          error: `El precio del Nivel ${i + 1} (S/ ${price.toFixed(2)}) debe ser menor al del Nivel ${i} (S/ ${prevPrice.toFixed(2)}).`,
        };
      }
    }

    prevQty = qty;
    prevPrice = price;
  }

  return { valid: true };
}
