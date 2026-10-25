/**
 * Utilidades para cálculo de descuentos y porcentaje de ofertas (F40)
 */

export interface DiscountInfo {
  pct: number;
  saved: number;
}

/**
 * Calcula el porcentaje y monto de descuento entre el precio original y el precio de oferta.
 *
 * Reglas de Jack (F40):
 * - Solo aplica si originalPrice > price > 0.
 * - pct = Math.floor(((originalPrice - price) / originalPrice) * 100) (redondeo hacia abajo, nunca se exagera).
 * - Si pct < 5%, retorna null (no se muestra etiqueta con porcentaje ni texto de ahorro).
 */
export function getDiscount(
  price?: number | null,
  originalPrice?: number | null
): DiscountInfo | null {
  if (
    price === undefined ||
    price === null ||
    originalPrice === undefined ||
    originalPrice === null
  ) {
    return null;
  }

  // Precios válidos y positivos
  if (price <= 0 || originalPrice <= 0) {
    return null;
  }

  // Solo hay descuento si el precio original es mayor al precio de oferta
  if (originalPrice <= price) {
    return null;
  }

  // Cálculo del porcentaje redondeado hacia abajo
  // Se usa Math.round en la resta para evitar imprecisiones de coma flotante de JS (ej: 100 - 80.4 = 19.599999999999994)
  const diff = originalPrice - price;
  const pct = Math.floor((diff / originalPrice) * 100);

  // Si el descuento es menor al 5%, no aplica porcentaje
  if (pct < 5) {
    return null;
  }

  return {
    pct,
    saved: Number(diff.toFixed(2)),
  };
}

/**
 * Retorna el texto para la etiqueta de oferta en tarjetas y banners.
 *
 * - Si showDiscountPct es true y hay descuento válido (>= 5%): retorna "-X%" (ej: "-20%").
 * - Si showDiscountPct es false o el descuento es menor al 5% o inexistente: retorna "Oferta".
 */
export function getOfferBadgeText(
  price?: number | null,
  originalPrice?: number | null,
  showDiscountPct?: boolean
): string {
  if (showDiscountPct) {
    const discount = getDiscount(price, originalPrice);
    if (discount !== null) {
      return `-${discount.pct}%`;
    }
  }
  return "Oferta";
}
