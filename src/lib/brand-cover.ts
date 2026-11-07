import { Store, getMaxAllowedBanners, getEffectivePlan } from "./types";
import { TIENDAS_CON_ESTILO_ANTERIOR } from "./design-catalog";

/**
 * Normaliza un código hexadecimal de 3 o 6 dígitos a RGB.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let cleaned = hex.replace("#", "").trim();
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (cleaned.length !== 6) return null;
  const num = parseInt(cleaned, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Calcula la luminancia relativa según WCAG 2.1
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
export function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const [rs, gs, bs] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((val) =>
    val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calcula el ratio de contraste entre dos colores WCAG 2.1 (>= 4.5 para AA normal, >= 3.0 para texto grande).
 */
export function getContrastRatio(rgb1: { r: number; g: number; b: number }, rgb2: { r: number; g: number; b: number }): number {
  const l1 = getRelativeLuminance(rgb1);
  const l2 = getRelativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * RF-45.1 y RNF-45.2: Determina si una tienda debe mostrar la Portada de Marca (BrandCover).
 * Devuelve true si el plan no permite banners fotográficos (Semilla) o si no tiene ningún banner activo.
 * Las tiendas en TIENDAS_CON_ESTILO_ANTERIOR conservan su apariencia y portada original.
 */
export function shouldShowBrandCover(store: Partial<Store> | null | undefined): boolean {
  if (!store) return true;
  if (store.slug && TIENDAS_CON_ESTILO_ANTERIOR.has(store.slug)) {
    return false;
  }
  const maxAllowed = getMaxAllowedBanners(store as Store);
  if (maxAllowed <= 0) return true;

  const raw = store.bannerImage || "";
  const banners = store.banners || (raw ? (raw.includes("|||") ? raw.split("|||") : [raw]) : []);
  return banners.length === 0;
}

/**
 * RF-45.2: Eslóganes predeterminados por rubro.
 */
export const DEFAULT_TAGLINES: Record<string, string> = {
  ropa: "Moda que te queda, directo a tu WhatsApp",
  moda: "Moda que te queda, directo a tu WhatsApp",
  calzado: "Moda que te queda, directo a tu WhatsApp",
  comida: "Hecho con cariño, listo para pedir",
  gastronomia: "Hecho con cariño, listo para pedir",
  restaurante: "Hecho con cariño, listo para pedir",
  cafe: "Hecho con cariño, listo para pedir",
  bisuteria: "Detalles que brillan contigo",
  joyeria: "Detalles que brillan contigo",
  accesorios: "Detalles que brillan contigo",
  tech: "Tecnología con garantía, a un mensaje",
  tecnologia: "Tecnología con garantía, a un mensaje",
  electronica: "Tecnología con garantía, a un mensaje",
  servicios: "Reserva tu cita en un toque",
  belleza: "Reserva tu cita en un toque",
  salud: "Reserva tu cita en un toque",
  floreria: "Flores y detalles para cada ocasión",
  flores: "Flores y detalles para cada ocasión",
  botanica: "Flores y detalles para cada ocasión",
  general: "Mira nuestro catálogo y pide por WhatsApp",
};

/**
 * Obtiene el eslogan predeterminado para un rubro específico.
 */
export function getDefaultTagline(niche?: string | null): string {
  if (!niche) return DEFAULT_TAGLINES.general;
  const clean = niche.toLowerCase().trim();
  return DEFAULT_TAGLINES[clean] || DEFAULT_TAGLINES.general;
}

/**
 * Devuelve el eslogan efectivo de la tienda (el configurado o el de su rubro).
 */
export function getEffectiveTagline(store: { bannerTagline?: string | null; niche?: string | null }): string {
  if (store.bannerTagline && store.bannerTagline.trim().length > 0) {
    return store.bannerTagline.trim();
  }
  return getDefaultTagline(store.niche);
}

/**
 * RF-45.5: Determina si la publicidad nativa de Dizi debe aparecer dentro de la grilla de productos.
 * Con 1 a 3 productos no ocupa lugar en la grilla; aparece a partir de 4 productos.
 */
export function shouldShowGridAd(
  productCount: number,
  plan: string | null | undefined,
  isMockup?: boolean
): boolean {
  if (isMockup) return false;
  const effective = (plan || "semilla").toLowerCase();
  if (effective !== "semilla") return false;
  return productCount >= 4;
}

/**
 * RF-45.6: Determina si debe mostrarse la franja de contacto debajo de la grilla.
 * Se muestra cuando hay entre 1 y 3 productos para que el catálogo corto no quede vacío.
 */
export function shouldShowContactStripe(productCount: number): boolean {
  return productCount >= 1 && productCount <= 3;
}

export interface BrandCoverStyles {
  gradient: string;
  textColor: string;
  taglineColor: string;
  borderColor: string;
  avatarBg: string;
  avatarTextColor: string;
  decorColor: string;
  isLightBg: boolean;
}

/**
 * RNF-45.4: Calcula los colores y estilos de la Portada de Marca (Variante B) asegurando contraste AA.
 */
export function getBrandCoverStyles(
  brandColor: string | null | undefined,
  model?: string,
  isDarkTheme?: boolean
): BrandCoverStyles {
  // Color base
  let hex = brandColor?.trim() || "";
  if (!hex || !hex.startsWith("#")) {
    // Si no hay color definido, asignar paleta característica por modelo
    if (model === "arch") hex = "#b45309";
    else if (model === "nature" || model === "nature_mint") hex = "#be185d";
    else if (model === "bite") hex = "#b91c1c";
    else hex = isDarkTheme ? "#6366f1" : "#4f46e5";
  }

  const rgb = hexToRgb(hex) || { r: 79, g: 70, b: 229 };
  const lum = getRelativeLuminance(rgb);

  // Comprobar si el fondo resultante es claro u oscuro
  const isLight = lum > 0.45;

  let gradient: string;
  let textColor: string;
  let taglineColor: string;
  let borderColor: string;
  let avatarBg: string;
  let avatarTextColor: string;
  let decorColor: string;

  if (isLight) {
    // Para colores muy claros (como #FFFFFF o amarillos pastel)
    // El texto DEBE ser oscuro (#0f172a / #1e293b) para garantizar contraste AA (>= 4.5)
    textColor = "#0f172a";
    taglineColor = "#334155";
    borderColor = "rgba(0, 0, 0, 0.12)";
    avatarBg = hex;
    avatarTextColor = "#0f172a";
    decorColor = "rgba(0, 0, 0, 0.08)";
    gradient = `linear-gradient(135deg, ${hex} 0%, rgba(${Math.max(0, rgb.r - 25)}, ${Math.max(0, rgb.g - 25)}, ${Math.max(0, rgb.b - 25)}, 1) 100%)`;
  } else {
    // Colores estándar y oscuros: texto blanco de alto contraste
    textColor = "#ffffff";
    taglineColor = "rgba(255, 255, 255, 0.9)";
    borderColor = "rgba(255, 255, 255, 0.18)";
    avatarBg = "#ffffff";
    avatarTextColor = hex;
    decorColor = "rgba(255, 255, 255, 0.2)";

    // Generar segundo tono más profundo para el degradado
    const r2 = Math.max(0, Math.floor(rgb.r * 0.7));
    const g2 = Math.max(0, Math.floor(rgb.g * 0.7));
    const b2 = Math.max(0, Math.floor(rgb.b * 0.7));
    gradient = `linear-gradient(135deg, ${hex} 0%, rgb(${r2}, ${g2}, ${b2}) 100%)`;
  }

  return {
    gradient,
    textColor,
    taglineColor,
    borderColor,
    avatarBg,
    avatarTextColor,
    decorColor,
    isLightBg: isLight,
  };
}

/**
 * R4: Extrae el nombre corto de la tienda (por ejemplo, si tiene nombre con comillas
 * como 'Biblias y Variedades "Luz y Estilo"', extrae "Luz y Estilo").
 */
export function getShortStoreName(name?: string | null): string {
  if (!name) return "";
  const trimmed = name.trim();
  const quoteMatch = trimmed.match(/["“'«]([^"”'»]+)["”'»]/);
  if (quoteMatch && quoteMatch[1]?.trim()) {
    return quoteMatch[1].trim();
  }
  return trimmed;
}

export interface ContactStripeStyles {
  containerBg: string;
  containerBorder: string;
  titleColor: string;
  descColor: string;
  buttonBg: string;
  buttonTextColor: string;
}

/**
 * R3: Calcula los colores y estilos para la Franja de Contacto (ContactStripe).
 * Fondo suave del color de marca, botón con el color de marca y texto con contraste AA (>= 4.5).
 * Adaptado para tema claro y tema oscuro.
 */
export function getContactStripeStyles(
  brandColor?: string | null,
  isDark = false
): ContactStripeStyles {
  let hex = brandColor?.trim() || "";
  if (!hex || !hex.startsWith("#")) {
    hex = "#25D366";
  }

  const rgb = hexToRgb(hex) || { r: 37, g: 211, b: 102 };

  // Contraste AA para el botón (WCAG 2.1 ratio >= 4.5)
  const whiteRgb = { r: 255, g: 255, b: 255 };
  const darkRgb = { r: 15, g: 23, b: 42 }; // #0f172a
  const contrastWithWhite = getContrastRatio(rgb, whiteRgb);
  const contrastWithDark = getContrastRatio(rgb, darkRgb);

  // Elegir color de texto para el botón que cumpla AA (o el de mayor contraste)
  const buttonTextColor =
    contrastWithWhite >= 4.5
      ? "#ffffff"
      : contrastWithDark >= contrastWithWhite
        ? "#0f172a"
        : "#ffffff";

  return {
    containerBg: isDark
      ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.14)`
      : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`,
    containerBorder: isDark
      ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`
      : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.22)`,
    titleColor: isDark ? "#f8fafc" : "#0f172a",
    descColor: isDark ? "rgba(241, 245, 249, 0.8)" : "rgba(15, 23, 42, 0.75)",
    buttonBg: hex,
    buttonTextColor,
  };
}
