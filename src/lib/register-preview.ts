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
 * para rubros sin foto ni demo asignada (servicios, pastelería, hogar) y como placeholder
 * mientras cargan las fotos de ejemplo de cualquier rubro.
 */
export function buildRubroIconCardSvg(rubroId: string): string {
  const iconMarkup: Record<string, string> = {
    floreria:
      '<circle cx="12" cy="12" r="3"/><path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5"/><path d="M12 7.5V9"/><path d="M7.5 12H9"/><path d="M16.5 12H15"/><path d="M12 16.5V15"/><path d="M12 22v-5.5"/>',
    ropa:
      '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
    calzado:
      '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/>',
    bisuteria:
      '<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>',
    belleza:
      '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
    hogar:
      '<path d="M8 2h8l4 10H4L8 2Z"/><path d="M12 12v6"/><path d="M8 22v-2c0-1.1.9-2 2-2h4a2 2 0 0 1 2 2v2H8Z"/>',
    comida:
      '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    pasteleria:
      '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3"/><path d="M12 8v3"/><path d="M17 8v3"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/>',
    tech:
      '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
    regalos:
      '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
    servicios:
      '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    general:
      '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  };

  const cleanId = getRubroById(rubroId).id;
  const markup = iconMarkup[cleanId] ?? iconMarkup.general;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" width="240" height="180"><rect width="240" height="180" fill="#FAF7F2"/><circle cx="120" cy="90" r="44" fill="#312E81" fill-opacity="0.07"/><g transform="translate(96 66) scale(2)" fill="none" stroke="#312E81" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${markup}</g></svg>`;
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
      name: "Taza de Cerámica Artesanal",
      price: 49,
      image: "/images/demos/regalos-demo/prod_04_taza_ceramica.webp",
    },
    {
      id: "prev_general_2",
      name: "Mini Torta Decorada",
      price: 58,
      image: "/images/demos/regalos-demo/prod_06_mini_torta.webp",
    },
    {
      id: "prev_general_3",
      name: "Arreglo de Rosas en Caja",
      price: 95,
      image: "/images/demos/regalos-demo/prod_03_arreglo_rosas.webp",
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

/**
 * Devuelve todas las URLs de fotos reales (HTTP o locales) de los 12 rubros para precarga,
 * priorizando el rubro activo primero y omitiendo tarjetas vectoriales inline.
 */
export function getAllPreviewImageUrls(priorityNiche?: string | null): string[] {
  const activeId = getRubroById(priorityNiche).id;
  const orderedKeys = [
    activeId,
    ...Object.keys(PREVIEW_PRODUCTS_BY_RUBRO).filter((k) => k !== activeId),
  ];
  const seen = new Set<string>();
  const urls: string[] = [];

  for (const key of orderedKeys) {
    const items = PREVIEW_PRODUCTS_BY_RUBRO[key] ?? [];
    for (const item of items) {
      if (item.image && !item.image.startsWith("data:") && !seen.has(item.image)) {
        seen.add(item.image);
        urls.push(item.image);
      }
    }
  }
  return urls;
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
    bannerTagline:
      defaults.rubro.id === "general"
        ? "Pide fácil directo por WhatsApp"
        : getDefaultTagline(defaults.rubro.id),
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
