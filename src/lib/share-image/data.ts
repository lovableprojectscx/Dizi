/**
 * @file data.ts
 * @description Mapeo y preparación de datos del producto y la tienda para el generador de imágenes (F46).
 * Calcula precios y ofertas reales mediante discount.ts, URL corta con ?p= y sello según plan.
 */

import { getDiscount } from "@/lib/discount";
import { getEffectivePlan } from "@/lib/types";
import { getOriginalImageUrl } from "@/lib/image-utils";
import type { Product, Store } from "@/lib/types";
import type { ShareImageData } from "./types";

export interface PrepareShareImageDataOptions {
  product: Product;
  store: Store;
  baseUrl?: string;
}

/**
 * Prepara el objeto de datos para renderizar la imagen de estado o historia.
 *
 * Reglas de negocio:
 * - Descuento: calculado con getDiscount de discount.ts (F40). Solo ofertas reales con ahorro >= 5%.
 * - URL corta: formato https://dizi.idenza.site/t/<slug>?p=<id> para abrir directamente el producto.
 * - Marca blanca: el sello "Hecho con Dizi · dizi.idenza.site" solo aparece si el plan efectivo es Semilla.
 * - Foto: se utiliza la URL en alta resolución (1600px), nunca la miniatura _thumb.
 */
export function prepareShareImageData(options: PrepareShareImageDataOptions): ShareImageData {
  const { product, store } = options;
  const baseUrl = (options.baseUrl || "https://dizi.idenza.site").replace(/\/+$/, "");

  // 1. Cálculo de descuento real con discount.ts (F40)
  const discount = getDiscount(product.price, product.originalPrice);
  const isOnSale = Boolean(product.isOnSale && discount !== null);

  // 2. Plan efectivo de la tienda (considera días de gracia)
  const effectivePlan = getEffectivePlan(store);
  const showBranding = effectivePlan === "semilla";

  // 3. Enlace directo al producto en el catálogo
  const catalogProductUrl = `${baseUrl}/t/${store.slug}?p=${product.id}`;

  // 4. Foto original en alta resolución
  const productImageUrl = getOriginalImageUrl(product.image);

  return {
    storeName: (store.name || "Mi Tienda").trim(),
    storeSlug: store.slug,
    storeLogoUrl: store.logo?.trim() || null,
    primaryColor: store.brandColor?.trim() || "#0F172A",
    productId: product.id,
    productName: (product.name || "Producto").trim(),
    price: typeof product.price === "number" ? product.price : 0,
    originalPrice: isOnSale && product.originalPrice ? product.originalPrice : null,
    isOnSale,
    discountPct: isOnSale && discount ? discount.pct : null,
    productImageUrl,
    catalogProductUrl,
    showBranding,
    brandingText: "Hecho con Dizi · dizi.idenza.site",
  };
}
