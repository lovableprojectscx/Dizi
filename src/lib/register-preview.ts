/**
 * @file register-preview.ts
 * @description Fuentes puras para el registro en slides (F53):
 * - Detección de modo prueba por dominio (solo dominios productivos crean cuentas reales).
 * - Tokens de marca del registro y verificación WCAG de contraste.
 * - Productos de ejemplo y constructor en memoria del catálogo para `LivePreview` (`isMockup`).
 */

import { getRubroById, getRubroDefaults } from "./rubros";
import { getContrastRatio, getDefaultTagline, hexToRgb } from "./brand-cover";
import { slugifyStoreName } from "./slug";
import type { Product, Store } from "./types";

/** Dominios reales donde el registro crea cuentas y tiendas en Supabase. */
export const PRODUCTION_REGISTER_HOSTS = [
  "dizi.idenza.site",
  "www.dizi.idenza.site",
  "dizicatalogo.com",
  "www.dizicatalogo.com",
] as const;

const PRODUCTION_HOST_SET = new Set<string>(PRODUCTION_REGISTER_HOSTS);

/**
 * Indica si el hostname corresponde a un dominio productivo autorizado para crear cuentas reales.
 */
export function isProductionRegisterHost(hostname?: string | null): boolean {
  if (!hostname) return false;
  const normalized = hostname.trim().toLowerCase();
  return PRODUCTION_HOST_SET.has(normalized);
}

/**
 * En cualquier dominio distinto de producción (Preview de Vercel, localhost, etc.)
 * el registro corre siempre en modo prueba sin llamar a signUp, addStore, markInviteUsed ni logFunnelStep.
 */
export function isPreviewTestMode(hostname?: string | null): boolean {
  const host =
    hostname !== undefined
      ? hostname
      : typeof window !== "undefined"
        ? window.location.hostname
        : "";
  return !isProductionRegisterHost(host);
}

/** Tokens oficiales de marca para el flujo de registro (manual 01-MARCA). */
export const REGISTER_BRAND_TOKENS = {
  creamBg: "#FAF7F2",
  indigo: "#312E81",
  indigoDark: "#1E1B4B",
  coral: "#FF5C39",
  white: "#FFFFFF",
} as const;

/**
 * Calcula el ratio de contraste WCAG 2.1 entre dos colores hexadecimales.
 */
export function getContrastRatioHex(hexA: string, hexB: string): number {
  const rgbA = hexToRgb(hexA);
  const rgbB = hexToRgb(hexB);
  if (!rgbA || !rgbB) return 0;
  return getContrastRatio(rgbA, rgbB);
}

export interface PreviewProductSeed {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
}

/**
 * Genera una tarjeta SVG en crema (#FAF7F2) con ícono de línea en índigo (#312E81)
 * para rubros sin foto local ni demo asignada (servicios, pastelería, hogar).
 */
export function buildRubroIconCardSvg(rubroId: "servicios" | "pasteleria" | "hogar"): string {
  const iconMarkup: Record<"servicios" | "pasteleria" | "hogar", string> = {
    servicios:
      '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    pasteleria:
      '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3"/><path d="M12 8v3"/><path d="M17 8v3"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/>',
    hogar:
      '<path d="M8 2h8l4 10H4L8 2Z"/><path d="M12 12v6"/><path d="M8 22v-2c0-1.1.9-2 2-2h4a2 2 0 0 1 2 2v2H8Z"/>',
  };

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" width="240" height="180"><rect width="240" height="180" fill="#FAF7F2"/><circle cx="120" cy="90" r="44" fill="#312E81" fill-opacity="0.07"/><g transform="translate(96 66) scale(2)" fill="none" stroke="#312E81" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${iconMarkup[rubroId]}</g></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Productos de ejemplo solo visuales para la vista previa en vivo (RF-53.3, nunca se guardan).
 * - `floreria`, `comida` y `calzado`: URLs reales leídas de `get_public_store` de las demos en vivo.
 * - `ropa`, `tech`, `belleza`, `bisuteria`, `regalos`, `general`: imágenes locales de `public/images/demos/`.
 * - `servicios`, `pasteleria`, `hogar`: tarjetas vectoriales con ícono en índigo (#312E81) sobre crema (#FAF7F2).
 */
export const PREVIEW_PRODUCTS_BY_RUBRO: Record<string, readonly PreviewProductSeed[]> = {
  floreria: [
    {
      id: "prev_flor_1",
      name: "50 Rosas",
      price: 100,
      image: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_floreriademo/products/5r9bgwd4.webp",
    },
    {
      id: "prev_flor_2",
      name: "Ramo Primaveral",
      price: 150,
      image: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_floreriademo/products/rzbltpm2.webp",
    },
    {
      id: "prev_flor_3",
      name: "Ramo Premium Amor Eterno",
      price: 150,
      image: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_floreriademo/products/p_flor7.webp",
    },
  ],
  comida: [
    {
      id: "prev_comida_1",
      name: "Hamburguesa Monster Cheese",
      price: 28.9,
      image: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_restaurantedemo/products/p_rest1.webp",
    },
    {
      id: "prev_comida_2",
      name: "Pizza Pepperoni Artesanal",
      price: 39.9,
      image: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_restaurantedemo/products/p_rest2.webp",
    },
    {
      id: "prev_comida_3",
      name: "Costillas BBQ Ahumadas",
      price: 45,
      image: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_restaurantedemo/products/p_rest3.webp",
    },
  ],
  calzado: [
    {
      id: "prev_calzado_1",
      name: "Air Jordan 1 Retro High OG",
      price: 899,
      image: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_zapatillasdemo/products/p_zapas5.webp",
    },
    {
      id: "prev_calzado_2",
      name: "New Balance 550 Vintage",
      price: 549,
      image: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_zapatillasdemo/products/p_zapas6.webp",
    },
    {
      id: "prev_calzado_3",
      name: "Vans Old Skool Platform",
      price: 329,
      image: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_zapatillasdemo/products/p_zapas7.webp",
    },
  ],
  ropa: [
    {
      id: "prev_ropa_1",
      name: "Conjunto Urbano Lino",
      price: 129,
      image: "/images/demos/bella-moda-demo/prod_03_conjunto_urbano.webp",
    },
    {
      id: "prev_ropa_2",
      name: "Blusa Satinada Marfil",
      price: 89,
      image: "/images/demos/bella-moda-demo/prod_04_blusa_satinada.webp",
    },
    {
      id: "prev_ropa_3",
      name: "Blazer Oversize Clásico",
      price: 169,
      image: "/images/demos/bella-moda-demo/prod_06_blazer_oversize.webp",
    },
  ],
  tech: [
    {
      id: "prev_tech_1",
      name: "Smartphone Pro 256GB",
      price: 2499,
      image: "/images/demos/celulares-demo/prod_01_smartphone_pro.webp",
    },
    {
      id: "prev_tech_2",
      name: "Audífonos Inalámbricos Pro",
      price: 189,
      image: "/images/demos/celulares-demo/prod_03_auriculares_pro.webp",
    },
    {
      id: "prev_tech_3",
      name: "Smartwatch Sport GPS",
      price: 299,
      image: "/images/demos/celulares-demo/prod_04_reloj_sport.webp",
    },
  ],
  belleza: [
    {
      id: "prev_belleza_1",
      name: "Sérum Facial Vitamina C",
      price: 69,
      image: "/images/demos/cosmetica-demo/prod_01_serum_facial.webp",
    },
    {
      id: "prev_belleza_2",
      name: "Rodillo Facial Gua Sha",
      price: 49,
      image: "/images/demos/cosmetica-demo/prod_03_rodillo_guasha.webp",
    },
    {
      id: "prev_belleza_3",
      name: "Crema Hidratante Karité",
      price: 55,
      image: "/images/demos/cosmetica-demo/prod_04_crema_karite.webp",
    },
  ],
  bisuteria: [
    {
      id: "prev_bisuteria_1",
      name: "Anillo Solitario Dorado",
      price: 75,
      image: "/images/demos/joyeria-demo/prod_01_anillo_solitario.webp",
    },
    {
      id: "prev_bisuteria_2",
      name: "Collar Cadena Baño en Oro",
      price: 95,
      image: "/images/demos/joyeria-demo/prod_02_collar_cadena.webp",
    },
    {
      id: "prev_bisuteria_3",
      name: "Aretes Argolla Clásicos",
      price: 59,
      image: "/images/demos/joyeria-demo/prod_03_aretes_argolla.webp",
    },
  ],
  regalos: [
    {
      id: "prev_regalos_1",
      name: "Box Cumpleaños Especial",
      price: 119,
      image: "/images/demos/regalos-demo/prod_01_box_cumpleanos.webp",
    },
    {
      id: "prev_regalos_2",
      name: "Caja de Bombones Artesanales",
      price: 65,
      image: "/images/demos/regalos-demo/prod_02_bombones_caja.webp",
    },
    {
      id: "prev_regalos_3",
      name: "Box Spa Relajante",
      price: 135,
      image: "/images/demos/regalos-demo/prod_05_box_spa.webp",
    },
  ],
  servicios: [
    {
      id: "prev_servicios_1",
      name: "Sesión de Asesoría 60 min",
      price: 90,
      image: buildRubroIconCardSvg("servicios"),
    },
    {
      id: "prev_servicios_2",
      name: "Paquete Mensual Completo",
      price: 250,
      image: buildRubroIconCardSvg("servicios"),
    },
    {
      id: "prev_servicios_3",
      name: "Diagnóstico Inicial",
      price: 50,
      image: buildRubroIconCardSvg("servicios"),
    },
  ],
  pasteleria: [
    {
      id: "prev_pasteleria_1",
      name: "Torta de Chocolate 12 Porc.",
      price: 95,
      image: buildRubroIconCardSvg("pasteleria"),
    },
    {
      id: "prev_pasteleria_2",
      name: "Caja x 6 Cupcakes Decorados",
      price: 42,
      image: buildRubroIconCardSvg("pasteleria"),
    },
    {
      id: "prev_pasteleria_3",
      name: "Pie de Limón Artesanal",
      price: 58,
      image: buildRubroIconCardSvg("pasteleria"),
    },
  ],
  hogar: [
    {
      id: "prev_hogar_1",
      name: "Lámpara de Mesa Nórdica",
      price: 120,
      image: buildRubroIconCardSvg("hogar"),
    },
    {
      id: "prev_hogar_2",
      name: "Set de Cojines Lino",
      price: 85,
      image: buildRubroIconCardSvg("hogar"),
    },
    {
      id: "prev_hogar_3",
      name: "Maceta Cerámica Minimal",
      price: 48,
      image: buildRubroIconCardSvg("hogar"),
    },
  ],
  general: [
    {
      id: "prev_general_1",
      name: "Producto Destacado 1",
      price: 89,
      image: "/images/demos/celulares-demo/prod_03_auriculares_pro.webp",
    },
    {
      id: "prev_general_2",
      name: "Producto Destacado 2",
      price: 65,
      image: "/images/demos/joyeria-demo/prod_02_collar_cadena.webp",
    },
    {
      id: "prev_general_3",
      name: "Producto Destacado 3",
      price: 49,
      image: "/images/demos/regalos-demo/prod_04_taza_ceramica.webp",
    },
  ],
};

export function getPreviewProductsForRubro(niche?: string | null): Product[] {
  const rubro = getRubroById(niche);
  const seeds = PREVIEW_PRODUCTS_BY_RUBRO[rubro.id] ?? PREVIEW_PRODUCTS_BY_RUBRO.general;
  return seeds.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    categoryId: "preview_cat_1",
    image: item.image,
    description: item.description ?? "",
    visible: true,
    isSample: false,
  }));
}

export interface BuildPreviewStoreParams {
  storeName: string;
  niche: string;
  phone?: string;
  countryCode?: string;
  countryIso?: string;
  slug?: string;
}

/**
 * Construye una tienda en memoria para alimentar `<PublicCatalog isMockup={true} />`
 * durante el registro sin escribir nada en Supabase.
 */
export function buildPreviewStore({
  storeName,
  niche,
  phone = "",
  countryCode = "51",
  countryIso = "PE",
  slug,
}: BuildPreviewStoreParams): Store {
  const cleanName = storeName.trim() || "Tu negocio";
  const defaults = getRubroDefaults(niche);
  const resolvedSlug = slug?.trim() || slugifyStoreName(cleanName) || "mi-negocio";

  return {
    id: "preview-register-store",
    slug: resolvedSlug,
    name: cleanName,
    phone: phone.trim(),
    countryCode: countryCode || "51",
    countryIso: countryIso || "PE",
    logo: null,
    plan: "semilla",
    model: defaults.model,
    brandColor: defaults.preset.values.brandColor,
    bgColor: defaults.preset.values.bgColor,
    cardBg: defaults.preset.values.cardBg,
    textColor: defaults.preset.values.textColor,
    accentColor: defaults.preset.values.accentColor,
    catalogTypography: defaults.preset.values.typography,
    cardStyle: defaults.preset.values.cardStyle,
    borderRadius: defaults.preset.values.borderRadius,
    imgShape: defaults.preset.values.imgShape,
    isDark: defaults.preset.values.isDark,
    niche: defaults.rubro.id,
    photoFormat: defaults.photoFormat,
    bannerTagline: getDefaultTagline(defaults.rubro.id),
    active: true,
    isPublished: true,
    showFeatured: false,
    showDiscountPct: false,
    showDiziBranding: true,
    createdAt: "2026-11-18T00:00:00.000Z",
    whatsappClicks: 0,
    categories: [{ id: "preview_cat_1", name: "Catálogo" }],
    products: getPreviewProductsForRubro(defaults.rubro.id),
  };
}
