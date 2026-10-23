/**
 * @file whatsapp.ts
 * @description Módulo centralizado para enlaces y formateo de WhatsApp en DIZI.
 */

export const DIZI_SUPPORT_PHONE = "51925176472";

export function buildWaUrl(phone: string, message?: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (!message) {
    return `https://wa.me/${cleaned}`;
  }
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

/**
 * Construye el mensaje personalizado para un vendedor específico (F39).
 * Saluda por el nombre: "Hola Dianis, ..."
 *
 * Regla: Solo quita "Hola" + puntuación opcional (",", "!", ":") y espacios siguientes.
 * Nunca remueve palabras posteriores para no alterar nombres de tienda, pronombres ("me"), etc.
 *
 * @param sellerName Nombre del vendedor (ej: "Dianis")
 * @param message Mensaje base
 */
export function buildSellerMessage(sellerName: string, message?: string): string {
  const cleanName = sellerName?.trim() || "";
  if (!message || !message.trim()) {
    return cleanName ? `Hola ${cleanName}` : "Hola";
  }
  const trimmed = message.trim();
  if (!cleanName) return trimmed;

  // Solo quita "Hola" + puntuación opcional (",", "!", ":") y espacios siguientes
  const holaRegex = /^hola\s*[,!:]?\s*/i;
  const rest = holaRegex.test(trimmed)
    ? trimmed.replace(holaRegex, "").trim()
    : trimmed;

  if (!rest) {
    return `Hola ${cleanName}`;
  }

  const firstChar = rest.charAt(0);
  const isUpper = firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase();
  const formattedRest = isUpper ? firstChar.toLowerCase() + rest.slice(1) : rest;
  return `Hola ${cleanName}, ${formattedRest}`;
}

export function formatPrice(n?: number | null): string {
  if (n === undefined || n === null || n === 0) {
    return "A consultar";
  }
  return `S/ ${n.toFixed(2)}`;
}
