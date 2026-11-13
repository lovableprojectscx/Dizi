/**
 * @file order-link.ts
 * @description Módulo centralizado para la generación, formateo y consulta de Links de Pedido
 * enviados desde el carrito de compras hacia WhatsApp (planes Pro e Ilimitado).
 */

import { supabase, invokeRpcWithRetry } from "./supabase";
import { planAllowsOrderLink, type Store } from "./types";
import { SUPABASE_STORAGE_IMAGES_PREFIX } from "./image-utils";
import { formatPrice } from "./whatsapp";

/**
 * Reconstruye la URL completa de Storage si la BD guardó una ruta relativa compacta.
 */
export function expandOrderImageUrl(rawImage: string | null | undefined): string {
  if (!rawImage || typeof rawImage !== "string") return "";
  const trimmed = rawImage.trim();
  if (!trimmed) return "";
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }
  return `${SUPABASE_STORAGE_IMAGES_PREFIX}${trimmed.replace(/^\/+/, "")}`;
}

export interface OrderItemPayload {
  product_id: string;
  variation_id?: string | null;
  qty: number;
}

export interface OrderItemSnapshot {
  productId: string;
  name: string;
  image: string;
  variationId?: string | null;
  variationName?: string | null;
  qty: number;
  regularPrice: number | null;
  unitPrice: number | null;
  lineTotal: number | null;
  isWholesale: boolean;
}

export interface PublicOrderDetail {
  id: string;
  code: string;
  storeId: string;
  storeSlug: string;
  storeName: string;
  storeLogo?: string | null;
  storePhone?: string | null;
  brandColor?: string | null;
  sellerName?: string | null;
  sellerPhone?: string | null;
  items: OrderItemSnapshot[];
  subtotalRegular: number | null;
  wholesaleSavings: number;
  total: number | null;
  hasQuoteItems: boolean;
  createdAt: string;
  expiresAt?: string | null;
}

export interface CreatePublicOrderResult {
  id: string;
  code: string;
  createdAt: string;
  expiresAt?: string | null;
}

/**
 * Indica si una tienda tiene activo el Link de Pedido tanto en configuración como por su plan efectivo.
 */
export function isOrderLinkActiveForStore(store?: Store | null): boolean {
  if (!store) return false;
  return Boolean(store.orderLinkEnabled) && planAllowsOrderLink(store);
}

/**
 * Construye la URL pública del detalle del pedido (/pedido/:code).
 */
export function buildOrderUrl(code: string, origin?: string): string {
  const cleanCode = encodeURIComponent(code.trim().toUpperCase());
  const baseOrigin =
    origin?.replace(/\/+$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "https://dizi.idenza.site");
  return `${baseOrigin}/pedido/${cleanCode}`;
}

/**
 * Inserta el link del pedido detallado al final del cuerpo del mensaje de WhatsApp.
 */
export function appendOrderLinkToMessage(message: string, orderUrl: string): string {
  const trimmed = message.trimEnd();
  if (!orderUrl.trim()) return trimmed;
  // Usamos flecha BMP (→, U+2192) para evitar que wa.me / WhatsApp Desktop corrompa emojis de 4 bytes en U+FFFD (rombo)
  return `${trimmed}\n\n→ Ver pedido detallado: ${orderUrl.trim()}`;
}

/**
 * Transforma las líneas del carrito al payload mínimo validado en servidor por `create_public_order`.
 */
export function buildCreateOrderItemsPayload(
  cartLines: Array<{ product: { id: string }; variationId?: string | null; qty: number }>,
): OrderItemPayload[] {
  return cartLines
    .filter((l) => l.product?.id && l.qty > 0)
    .map((l) => ({
      product_id: l.product.id,
      variation_id: l.variationId || null,
      qty: Math.max(1, Math.min(9999, Math.floor(l.qty))),
    }));
}

/**
 * Normaliza la respuesta JSONB de `get_public_order` a `PublicOrderDetail`.
 */
export function mapPublicOrderFromDB(data: any): PublicOrderDetail | null {
  if (!data || !data.code) return null;

  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items: OrderItemSnapshot[] = rawItems.map((it: any) => ({
    productId: String(it.product_id || ""),
    name: String(it.name || "Producto"),
    image: expandOrderImageUrl(it.image),
    variationId: it.variation_id ?? null,
    variationName: it.variation_name ?? null,
    qty: Number(it.qty || 1),
    regularPrice:
      it.regular_price !== null && it.regular_price !== undefined
        ? Number(it.regular_price)
        : null,
    unitPrice:
      it.unit_price !== null && it.unit_price !== undefined ? Number(it.unit_price) : null,
    lineTotal:
      it.line_total !== null && it.line_total !== undefined ? Number(it.line_total) : null,
    isWholesale: Boolean(it.is_wholesale),
  }));

  return {
    id: String(data.id || ""),
    code: String(data.code),
    storeId: String(data.store_id || ""),
    storeSlug: String(data.store_slug || ""),
    storeName: String(data.store_name || ""),
    storeLogo: data.store_logo ?? null,
    storePhone: data.store_phone ?? null,
    brandColor: data.brand_color ?? null,
    sellerName: data.seller_name ?? null,
    sellerPhone: data.seller_phone ?? null,
    items,
    subtotalRegular:
      data.subtotal_regular !== null && data.subtotal_regular !== undefined
        ? Number(data.subtotal_regular)
        : null,
    wholesaleSavings: Number(data.wholesale_savings || 0),
    total: data.total !== null && data.total !== undefined ? Number(data.total) : null,
    hasQuoteItems: Boolean(data.has_quote_items),
    createdAt: String(data.created_at || new Date().toISOString()),
    expiresAt: data.expires_at ? String(data.expires_at) : null,
  };
}

/**
 * Crea un pedido en Supabase mediante la RPC `create_public_order`.
 * Usa timeout acotado para no frenar la redirección a WhatsApp si hay latencia extrema.
 */
export async function createPublicOrder(params: {
  storeId: string;
  items: OrderItemPayload[];
  sellerName?: string | null;
  sellerPhone?: string | null;
}): Promise<CreatePublicOrderResult | null> {
  if (!params.storeId || params.items.length === 0) return null;

  const { data, error } = await supabase.rpc("create_public_order", {
    p_store_id: params.storeId,
    p_items: params.items,
    p_seller_name: params.sellerName || null,
    p_seller_phone: params.sellerPhone || null,
  });

  if (error || !data || !(data as any).code) {
    console.warn("[createPublicOrder] No se pudo generar el link de pedido:", error);
    return null;
  }

  return {
    id: String((data as any).id || ""),
    code: String((data as any).code),
    createdAt: String((data as any).created_at || new Date().toISOString()),
    expiresAt: (data as any).expires_at ? String((data as any).expires_at) : null,
  };
}

/**
 * Obtiene el detalle público de un pedido por su código único, con reintentos ante fallos de red/5xx.
 */
export async function fetchPublicOrder(code: string): Promise<PublicOrderDetail | null> {
  const cleanCode = code.trim();
  if (!cleanCode) return null;

  const { data, error } = await invokeRpcWithRetry<any>("get_public_order", {
    order_code: cleanCode,
  });

  if (error) {
    throw error;
  }

  return mapPublicOrderFromDB(data);
}

/**
 * Formatea un resumen de texto limpio del pedido (incluyendo estado de empaque si se pasa)
 * para copiar rápidamente al portapapeles desde la vista de pedido.
 */
export function formatOrderSummaryText(
  order: PublicOrderDetail,
  checkedKeys?: Set<string>,
): string {
  const header = `Pedido #${order.code} — ${order.storeName}`;
  const sellerLine = order.sellerName ? `Vendedor: ${order.sellerName}\n` : "";
  const lines = order.items
    .map((item, idx) => {
      const key = getOrderLineKey(item, idx);
      const prefix = checkedKeys ? (checkedKeys.has(key) ? "[✓] " : "[ ] ") : "• ";
      const varSuffix = item.variationName ? ` (${item.variationName})` : "";
      const priceText =
        item.lineTotal !== null && item.lineTotal > 0 ? formatPrice(item.lineTotal) : "A consultar";
      const wholesaleNote =
        item.isWholesale && item.unitPrice
          ? ` [${formatPrice(item.unitPrice)} c/u por mayor]`
          : "";
      return `${prefix}${item.name}${varSuffix} x${item.qty} — ${priceText}${wholesaleNote}`;
    })
    .join("\n");

  const savingsLine =
    order.wholesaleSavings > 0
      ? `\nAhorro por mayor: -${formatPrice(order.wholesaleSavings)}`
      : "";
  const totalValue =
    order.total !== null && order.total > 0
      ? `${formatPrice(order.total)}${order.hasQuoteItems ? " + artículos a cotizar" : ""}`
      : "A consultar";

  return `${header}\n${sellerLine}\n${lines}${savingsLine}\n\nTotal: ${totalValue}`;
}

/**
 * Clave estable para identificar una línea dentro del checklist local del pedido.
 */
export function getOrderLineKey(
  item: Pick<OrderItemSnapshot, "productId" | "variationId">,
  index: number,
): string {
  return `${item.productId}::${item.variationId || ""}::${index}`;
}
