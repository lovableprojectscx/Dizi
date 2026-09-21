/**
 * @file utils.ts
 * @description Funciones auxiliares y de utilidad compartida para la plataforma Dizi.
 * Incluye combinación inteligente de clases CSS de Tailwind y cálculo de luminancia hex.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina condicionalmente clases CSS utilizando `clsx` y resuelve conflictos de especificidad con `tailwind-merge`.
 * @param inputs Lista de nombres de clase, arrays u objetos condicionales de clases.
 * @returns Cadena de clases CSS sanitizada y sin duplicados conflictivos.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calcula la luminancia relativa perceptiva de un color hexadecimal según el estándar ITU-R BT.709.
 * Utilizado para decidir automáticamente contraste de texto (texto claro vs texto oscuro)
 * sobre fondos dinámicos elegidos por el usuario.
 * @param hex Código de color en formato hexadecimal (ej. `#FFFFFF` o `#000`).
 * @returns Valor entre 0 (negro absoluto) y 1 (blanco puro).
 */
export function hexLuminance(hex: string): number {
  if (!hex || typeof hex !== "string") return 0.5;
  const h = hex.replace("#", "");
  if (h.length < 6) return 0.5;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
