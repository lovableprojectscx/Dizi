import type { Product } from "./types";

export interface PriceFormState {
  priceInput: string;
  isConsultOnly: boolean;
}

export interface EssentialsValidation {
  valid: boolean;
  missingField: "name" | "category" | null;
  message: string | null;
}

/**
 * Estado inicial del campo precio y de la opción "A consultar" al abrir el formulario.
 * - Producto nuevo (`isNew = true`): precio habilitado y vacío, sin marcar "A consultar" (RF-56.1).
 * - Producto existente (`isNew = false`): "A consultar" solo si `price` es null/undefined/0 (RF-56.2).
 */
export function initialPriceState(
  product: Partial<Product> | null | undefined,
  isNew: boolean,
): PriceFormState {
  if (isNew) {
    return { priceInput: "", isConsultOnly: false };
  }
  const hasPrice =
    product?.price !== null &&
    product?.price !== undefined &&
    product.price !== 0;
  return {
    priceInput: hasPrice ? product!.price!.toString() : "",
    isConsultOnly: !hasPrice,
  };
}

/**
 * Cuenta cuántas opciones de "Más opciones" tiene activas un producto (0 a 5):
 * descripción, oferta, destacado (`#destacado`), variaciones y precios por mayor (RF-56.3).
 */
export function usedOptionsCount(
  product: Partial<Product> | null | undefined,
  isFeaturedOverride?: boolean,
): number {
  if (!product) return 0;
  let count = 0;

  const cleanDescription = (product.description || "").replace(/#destacado/g, "").trim();
  if (cleanDescription.length > 0) count += 1;

  if (product.isOnSale) count += 1;

  const isFeatured =
    isFeaturedOverride !== undefined
      ? isFeaturedOverride
      : Boolean(
          product.description?.includes("#destacado") ||
            product.name?.includes("#destacado"),
        );
  if (isFeatured) count += 1;

  if ((product.variations?.length ?? 0) > 0) count += 1;

  if ((product.wholesaleTiers?.length ?? 0) > 0) count += 1;

  return count;
}

/**
 * Indica si al guardar se debe pedir confirmación en la misma ventana
 * porque el precio está vacío y no se marcó "A consultar" (RF-56.5).
 */
export function needsConsultConfirm(
  priceInput: string,
  isConsultOnly: boolean,
): boolean {
  return !isConsultOnly && priceInput.trim() === "";
}

/**
 * Valida los campos esenciales antes de guardar para marcar en rojo el campo faltante (RF-56.9).
 */
export function validateEssentials(
  name: string | null | undefined,
  categoryId: string | null | undefined,
): EssentialsValidation {
  if (!(name ?? "").trim()) {
    return {
      valid: false,
      missingField: "name",
      message: "Falta el nombre",
    };
  }
  if (!(categoryId ?? "").trim()) {
    return {
      valid: false,
      missingField: "category",
      message: "Elige una categoría",
    };
  }
  return { valid: true, missingField: null, message: null };
}

/**
 * Cuenta cuántos borradores de carga masiva quedarán como "A consultar" (RF-56.6).
 */
export function countBulkWithoutPrice(
  drafts: Array<{ price?: string | number | null; isConsultOnly?: boolean }>,
): number {
  return drafts.filter((d) => {
    if (d.isConsultOnly) return true;
    if (d.price === null || d.price === undefined) return true;
    return String(d.price).trim() === "";
  }).length;
}
