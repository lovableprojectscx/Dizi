/**
 * @file caption.ts
 * @description Generador de texto bonito y formateado para compartir productos en redes sociales y estados (F46.2).
 * Lógica pura sin dependencias de base de datos ni adivinanzas de rubro por stores.niche o categorías.
 */

import { formatPrice } from "@/lib/whatsapp";
import { getDiscount } from "@/lib/discount";

export type CaptionTemplate = "novedad" | "oferta" | "simple";

export interface CaptionProductInput {
  name: string;
  price?: number | null;
  originalPrice?: number | null;
  isOnSale?: boolean;
}

export interface GenerateCaptionOptions {
  storeName: string;
  productName: string;
  price?: number | null;
  originalPrice?: number | null;
  isOnSale?: boolean;
  productUrl: string;
  template?: CaptionTemplate;
  productEmoji?: string | null;
}

export const PRODUCT_EMOJI_LIST = [
  { id: "👟", label: "Calzado / Zapatillas", emoji: "👟" },
  { id: "👗", label: "Moda / Vestidos", emoji: "👗" },
  { id: "💍", label: "Joyería / Accesorios", emoji: "💍" },
  { id: "🌸", label: "Flores / Plantas", emoji: "🌸" },
  { id: "🍰", label: "Pastelería / Postres", emoji: "🍰" },
  { id: "📱", label: "Tecnología / Celulares", emoji: "📱" },
  { id: "🎁", label: "Regalos / Sorpresas", emoji: "🎁" },
  { id: "🕯️", label: "Velas / Aromas", emoji: "🕯️" },
  { id: "💄", label: "Belleza / Cosmética", emoji: "💄" },
  { id: "🏠", label: "Hogar / Decoración", emoji: "🏠" },
] as const;

export const DEFAULT_PRODUCT_EMOJI = "🛍️";

function getStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== "undefined") {
      return localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Obtiene el emoji preferido guardado para la tienda en localStorage.
 */
export function getSavedProductEmoji(storeId: string): string | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    return storage.getItem(`dizi_share_emoji_${storeId}`);
  } catch {
    return null;
  }
}

/**
 * Guarda el emoji preferido para la tienda en localStorage.
 */
export function saveProductEmoji(storeId: string, emoji: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(`dizi_share_emoji_${storeId}`, emoji);
  } catch {
    // Modo incógnito o cuota excedida: silenciar
  }
}

/**
 * Genera el texto formateado (caption) listo para compartir en WhatsApp, Instagram o redes.
 */
export function generateCaption(options: GenerateCaptionOptions): string {
  const storeName = (options.storeName || "Mi Tienda").trim();
  const productName = (options.productName || "Producto").trim();
  const rawPrice = typeof options.price === "number" ? options.price : null;
  const isConsultPrice = rawPrice === null || rawPrice <= 0;
  const price = isConsultPrice ? 0 : rawPrice;

  // Cálculo de oferta real usando las reglas estrictas de discount.ts (ahorro >= 5%)
  const discount = !isConsultPrice ? getDiscount(price, options.originalPrice) : null;
  const hasRealDiscount = Boolean(!isConsultPrice && options.isOnSale && discount !== null);

  // Template seleccionado: "oferta" solo es válida si hay descuento real según discount.ts
  let template: CaptionTemplate = options.template || "novedad";
  if (template === "oferta" && !hasRealDiscount) {
    template = "novedad";
  }

  // Emoji para el producto
  // "none", null o "" significa explícitamente "Ninguno"
  let itemPrefix = "";
  if (options.productEmoji === "none" || options.productEmoji === "" || options.productEmoji === null) {
    itemPrefix = "";
  } else if (options.productEmoji) {
    itemPrefix = `${options.productEmoji} `;
  } else {
    itemPrefix = `${DEFAULT_PRODUCT_EMOJI} `;
  }

  // 1. Encabezado
  let header = "";
  if (template === "novedad") {
    header = `✨ NUEVO en ${storeName} ✨\n\n`;
  } else if (template === "oferta") {
    header = `🔥 OFERTA en ${storeName} 🔥\n\n`;
  } else {
    // "simple": sin encabezado
    header = "";
  }

  // 2. Línea del producto
  const productLine = `${itemPrefix}${productName}`;

  // 3. Línea del precio
  let priceLine = "";
  if (isConsultPrice) {
    priceLine = "💬 Precio a consultar";
  } else if (hasRealDiscount && discount && options.originalPrice) {
    priceLine = `💰 ${formatPrice(price)} (Antes: ${formatPrice(options.originalPrice)} · -${discount.pct}%)`;
  } else {
    priceLine = `💰 ${formatPrice(price)}`;
  }

  // 4. Cierre con llamada a la acción y enlace
  const ctaLine = `📲 Pídelo aquí 👇\n${options.productUrl.trim()}`;

  return `${header}${productLine}\n\n${priceLine}\n\n${ctaLine}`;
}
