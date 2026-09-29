/**
 * @file products.ts
 * @description Utilidades y lógica de detección de productos incompletos y nombres de archivo
 * para la carga masiva y gestión del catálogo (Fase 1B - Bug B3).
 */

import type { Product } from "./types";

/**
 * Detecta si un nombre de producto es un nombre de archivo por defecto o un placeholder.
 * Ejemplos: "IMG 8090", "Image1 2026373986596", "WhatsApp Image 2026-09-01", "8090", "".
 */
export function isPlaceholderOrFilename(name?: string | null): boolean {
  if (!name) return true;
  const trimmed = name.trim();
  if (trimmed.length === 0) return true;

  // Solo números, guiones, puntos o espacios (ej. "8090", "2026373986596", "01-02")
  if (/^[\d\s\-_.]+$/.test(trimmed)) return true;

  // Prefijos típicos de nombres generados por cámaras, celulares o apps de mensajería
  const filePrefixRegex =
    /^(img|image|imagen|whatsapp\s*image|photo|foto|pxl|dsc|screenshot|captura|snapchat|pic)[\s\-_0-9.]/i;
  if (filePrefixRegex.test(trimmed)) return true;

  // Nombres de archivos comunes directos (ej. "IMG", "IMAGE", "FOTO")
  const exactNames = /^(img|image|imagen|foto|photo|screenshot|captura)$/i;
  if (exactNames.test(trimmed)) return true;

  return false;
}

/**
 * Determina si un producto está incompleto (nombre de archivo / sin precio).
 * Los productos de ejemplo no se consideran incompletos (tienen su propia etiqueta de EJEMPLO).
 */
export function isProductIncomplete(
  product: Pick<Product, "name" | "price" | "isSample">
): boolean {
  if (product.isSample) return false;
  if (isPlaceholderOrFilename(product.name)) return true;
  if (product.price === null || product.price === undefined) return true;
  return false;
}

/**
 * Retorna una etiqueta corta descriptiva del motivo por el cual el producto está incompleto.
 */
export function getIncompleteReason(
  product: Pick<Product, "name" | "price" | "isSample">
): "nombre" | "precio" | "ambos" | null {
  if (product.isSample) return null;
  const badName = isPlaceholderOrFilename(product.name);
  const badPrice = product.price === null || product.price === undefined;

  if (badName && badPrice) return "ambos";
  if (badName) return "nombre";
  if (badPrice) return "precio";
  return null;
}
