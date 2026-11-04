/**
 * @file product-sync.ts
 * @description Módulo de sincronización segura y control de versiones optimista para productos (F44).
 * Proporciona cálculo de diffs parciales, mapeo a columnas de base de datos, detección de conflictos
 * y manejo de excepciones de concurrencia optimista.
 */

import type { Product } from "./types";

/**
 * Error lanzado cuando una operación de guardado sobre un producto falla
 * debido a que otro dispositivo incrementó la versión en la base de datos (concurrencia optimista, RF-44.5).
 */
export class ProductConflictError extends Error {
  readonly code = "PRODUCT_VERSION_CONFLICT";
  readonly freshProduct?: Product;

  constructor(
    message = "Este producto se modificó desde otro dispositivo. Te mostramos la versión actual; revisa y vuelve a guardar.",
    freshProduct?: Product
  ) {
    super(message);
    this.name = "ProductConflictError";
    this.freshProduct = freshProduct;
  }
}

/**
 * Compara dos estructuras (arrays, objetos, primitivos) para igualdad profunda serializada en JSON.
 */
export function areJsonEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a === null || a === undefined || b === null || b === undefined) return a === b;
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Calcula la diferencia entre el producto original (como fue cargado de la base de datos)
 * y el producto editado por el usuario en el panel.
 * Retorna únicamente los campos modificados (RF-44.4).
 * Si no hay cambios, retorna un objeto vacío `{}`.
 */
export function diffProduct(original: Product, edited: Product): Partial<Product> {
  const diff: Partial<Product> = {};

  if (original.name !== edited.name) {
    diff.name = edited.name;
  }

  const origPrice = original.price !== undefined ? original.price : null;
  const editPrice = edited.price !== undefined ? edited.price : null;
  if (origPrice !== editPrice) {
    diff.price = editPrice;
  }

  if (original.categoryId !== edited.categoryId) {
    diff.categoryId = edited.categoryId;
  }

  if (original.image !== edited.image) {
    diff.image = edited.image;
  }

  const origDesc = original.description ?? "";
  const editDesc = edited.description ?? "";
  if (origDesc !== editDesc) {
    diff.description = edited.description ? edited.description : "";
  }

  const origOnSale = !!original.isOnSale;
  const editOnSale = !!edited.isOnSale;
  if (origOnSale !== editOnSale) {
    diff.isOnSale = editOnSale;
  }

  const origOrigPrice = original.originalPrice !== undefined ? original.originalPrice : null;
  const editOrigPrice = edited.originalPrice !== undefined ? edited.originalPrice : null;
  if (origOrigPrice !== editOrigPrice) {
    diff.originalPrice = editOrigPrice;
  }

  if (original.visible !== edited.visible) {
    diff.visible = edited.visible;
  }

  if (original.isSample !== edited.isSample) {
    diff.isSample = edited.isSample;
  }

  if (original.sortOrder !== edited.sortOrder) {
    diff.sortOrder = edited.sortOrder;
  }

  if (!areJsonEqual(original.tags || [], edited.tags || [])) {
    diff.tags = edited.tags || [];
  }

  if (!areJsonEqual(original.variations || [], edited.variations || [])) {
    diff.variations = edited.variations || [];
  }

  if (!areJsonEqual(original.wholesaleTiers || [], edited.wholesaleTiers || [])) {
    diff.wholesaleTiers = edited.wholesaleTiers || [];
  }

  return diff;
}

/**
 * Convierte un diff parcial de Product (camelCase) al formato de columnas en PostgreSQL (snake_case).
 */
export function toDbPatch(diff: Partial<Product>): Record<string, any> {
  const patch: Record<string, any> = {};

  if (diff.name !== undefined) patch.name = diff.name;
  if (diff.price !== undefined) patch.price = diff.price;
  if (diff.categoryId !== undefined) patch.category_id = diff.categoryId;
  if (diff.image !== undefined) patch.image = diff.image;
  if (diff.description !== undefined) patch.description = diff.description || null;
  if (diff.isOnSale !== undefined) patch.is_on_sale = diff.isOnSale;
  if (diff.originalPrice !== undefined) patch.original_price = diff.originalPrice;
  if (diff.visible !== undefined) patch.visible = diff.visible;
  if (diff.isSample !== undefined) patch.is_sample = diff.isSample;
  if (diff.sortOrder !== undefined) patch.sort_order = diff.sortOrder;
  if (diff.tags !== undefined) patch.tags = diff.tags;
  if (diff.variations !== undefined) patch.variations = diff.variations;
  if (diff.wholesaleTiers !== undefined) patch.wholesale_tiers = diff.wholesaleTiers;

  return patch;
}

/**
 * Determina si el resultado de una actualización condicional sobre version representa un conflicto de concurrencia.
 */
export function isConflict(error: any, rowsAffected?: number): boolean {
  if (error && (error.code === "PRODUCT_VERSION_CONFLICT" || error.name === "ProductConflictError")) {
    return true;
  }
  if (rowsAffected !== undefined && rowsAffected === 0) {
    return true;
  }
  return false;
}
