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

export function formatPrice(n?: number | null): string {
  if (n === undefined || n === null || n === 0) {
    return "A consultar";
  }
  return `S/ ${n.toFixed(2)}`;
}
