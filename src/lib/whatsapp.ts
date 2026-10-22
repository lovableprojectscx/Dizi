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
 * Construye el mensaje personalizado para un vendedor específico (F39),
 * saludando por su nombre: "Hola ${nombre}, ..." y evitando duplicar "Hola".
 * @param sellerName Nombre del vendedor o tienda
 * @param message Mensaje base
 */
export function buildSellerMessage(sellerName: string, message?: string): string {
  const cleanName = sellerName?.trim() || "";
  if (!message || !message.trim()) {
    return cleanName ? `Hola ${cleanName}` : "Hola";
  }
  const trimmed = message.trim();
  if (!cleanName) return trimmed;

  // Si empieza con "Hola" (seguido opcionalmente de coma, exclamación, espacio o nombre anterior)
  const holaRegex = /^hola(?:\s*[,!:]|\s+[A-Za-z0-9ÁÉÍÓÚáéíóúñÑ_.-]+[,!:]?)?\s*/i;
  if (holaRegex.test(trimmed)) {
    const rest = trimmed.replace(holaRegex, "").trim();
    if (!rest) {
      return `Hola ${cleanName}`;
    }
    const firstChar = rest.charAt(0);
    const isUpper = firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase();
    const formattedRest = isUpper ? firstChar.toLowerCase() + rest.slice(1) : rest;
    return `Hola ${cleanName}, ${formattedRest}`;
  }

  const firstChar = trimmed.charAt(0);
  const isUpper = firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase();
  const formattedRest = isUpper ? firstChar.toLowerCase() + trimmed.slice(1) : trimmed;
  return `Hola ${cleanName}, ${formattedRest}`;
}

export function formatPrice(n?: number | null): string {
  if (n === undefined || n === null || n === 0) {
    return "A consultar";
  }
  return `S/ ${n.toFixed(2)}`;
}
