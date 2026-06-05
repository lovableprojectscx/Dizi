export type PlanId = "semilla" | "emprendedor" | "pro" | "ilimitado";

export type SubscriptionStatus = "active" | "expired" | "cancelled" | "trial";

export interface Plan {
  id: PlanId;
  name: string;
  productLimit: number;
  price: number;
}

export const PLANS: Record<PlanId, Plan> = {
  semilla:      { id: "semilla",      name: "Semilla",      productLimit: 7,        price: 0    },
  emprendedor:  { id: "emprendedor",  name: "Emprendedor",  productLimit: 50,       price: 14.9 },
  pro:          { id: "pro",          name: "Pro",          productLimit: 200,      price: 19.9 },
  ilimitado:    { id: "ilimitado",    name: "Ilimitado",    productLimit: Infinity, price: 34.9 },
};

export const PLAN_DURATION_OPTIONS = [
  { value: 1,  label: "1 mes" },
  { value: 3,  label: "3 meses" },
  { value: 6,  label: "6 meses" },
  { value: 12, label: "12 meses (1 ano)" },
] as const;

// Dias de gracia antes de aplicar restricciones de productos
export const GRACE_DAYS = 3;
// Dias antes de cambiar el modelo de diseno al modelo semilla
export const MODEL_GRACE_DAYS = 15;
// Modelo por defecto del plan semilla
export const SEMILLA_MODEL = "minimalista";

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  image: string;
  description?: string;
  isOnSale?: boolean;
  originalPrice?: number;
  visible: boolean;
  isSample?: boolean;
}

export interface QuickLink {
  label: string;
  url: string;
  bgColor?: string;
  textColor?: string;
}

export interface Store {
  id: string;
  slug: string;
  name: string;
  phone: string;
  countryCode: string;
  logo?: string;
  brandColor?: string;
  bgColor?: string;
  bannerImage?: string;
  bannerTitle?: string;
  plan: PlanId;
  active: boolean;
  createdAt: string;
  whatsappClicks: number;
  views: number;
  isPublished?: boolean;
  model?: string;
  ownerId?: string;
  niche?: string;
  priceFilterEnabled?: boolean;
  libroReclamacionesActivo?: boolean;
  empresaRuc?: string;
  empresaRazonSocial?: string;
  empresaDireccion?: string;
  planExpiresAt?: string;
  subscriptionStatus?: SubscriptionStatus;
  cancelledAt?: string;
  cancelReason?: string;
  planDurationMonths?: number;
  bioDescription?: string;
  locationLat?: number;
  locationLng?: number;
  locationAddress?: string;
  quickLinks?: QuickLink[];
  bioLinksEnabled?: boolean;
  bioLogo?: string;
  bioBanner?: string;
  bioTheme?: string;
  bioTypography?: "sans" | "serif" | "rounded" | "modern";
  bioButtonStyle?: string;
  bioButtonColor?: string;
  bioButtonTextColor?: string;
  bioBgImage?: string;
  bioBgColor?: string;
  categories: Category[];
  products: Product[];
}

export interface Invite {
  token: string;
  plan: PlanId;
  used: boolean;
  createdAt: string;
  durationMonths: number;
  expiresAt: string;
  notes?: string;
}

// ─── Helpers de suscripcion ──────────────────────────────────────────────────

/** Dias desde que vencio el plan. Negativo = aun vigente. */
export function daysSinceExpiry(store: Store): number | null {
  if (!store.planExpiresAt) return null;
  const diff = Date.now() - new Date(store.planExpiresAt).getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** Dias restantes hasta el vencimiento del plan. Negativo = ya vencio. */
export function daysUntilExpiry(store: Store): number | null {
  if (!store.planExpiresAt) return null;
  const diff = new Date(store.planExpiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Retorna el plan que debe aplicarse ACTUALMENTE considerando dias de gracia.
 * - Si el plan no vencio o esta en gracia (<=3 dias): retorna el plan real.
 * - Si paso el periodo de gracia: retorna "semilla".
 */
export function getEffectivePlan(store: Store): PlanId {
  if (store.plan === "semilla") return "semilla";
  if (!store.planExpiresAt) return store.plan;
  const expired = daysSinceExpiry(store);
  if (expired === null) return store.plan;
  if (expired > GRACE_DAYS) return "semilla";
  return store.plan;
}

/**
 * Retorna el limite de productos que aplica en este momento.
 */
export function getEffectiveProductLimit(store: Store): number {
  return PLANS[getEffectivePlan(store)].productLimit;
}

/**
 * Indica si la suscripcion vencio (sin importar gracia).
 */
export function isSubscriptionExpired(store: Store): boolean {
  if (store.plan === "semilla") return false;
  if (!store.planExpiresAt) return false;
  return new Date(store.planExpiresAt) < new Date();
}

/**
 * Dias que quedan del periodo de gracia del modelo (15 dias).
 * Retorna null si no aplica (plan vigente o semilla).
 * Retorna 0 si el modelo ya debe cambiar.
 */
export function modelGraceDaysLeft(store: Store): number | null {
  if (store.plan === "semilla") return null;
  if (!store.planExpiresAt) return null;
  const since = daysSinceExpiry(store);
  if (since === null || since <= 0) return null; // Plan aun vigente
  const remaining = MODEL_GRACE_DAYS - since;
  return Math.max(0, remaining);
}

/**
 * Indica si el modelo premium debe reemplazarse ya por el modelo semilla.
 * (cuando pasaron mas de 15 dias desde el vencimiento)
 */
export function shouldUseSemillaModel(store: Store): boolean {
  const left = modelGraceDaysLeft(store);
  return left !== null && left === 0;
}

/**
 * Retorna el modelo que debe usarse actualmente en el catalogo publico.
 */
export function getEffectiveModel(store: Store): string {
  if (shouldUseSemillaModel(store)) return SEMILLA_MODEL;
  return store.model || SEMILLA_MODEL;
}

/** Formatea una fecha ISO para mostrar en UI: "13 may. 2026" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Retorna true si el plan esta activo y vigente (sin gracia) */
export function isPlanActive(store: Store): boolean {
  if (store.plan === "semilla") return true;
  if (!store.planExpiresAt) return false;
  return new Date(store.planExpiresAt) > new Date();
}

/** Retorna el limite de enlaces personalizados en el BioLink */
export function getBioLinksLimit(store: Store): number {
  if (store.plan === "semilla") return 5;
  return Infinity;
}

/** Retorna true si la tienda puede usar fondos personalizados e imagenes en el BioLink */
export function canUsePremiumBioFeatures(store: Store): boolean {
  return store.plan !== "semilla";
}


// ─── Especificaciones de imagen por layout ───────────────────────────────────

export interface ImageSpec {
  /** Ratio CSS para aspect-ratio (ej: "1/1", "3/4") */
  ratio: string;
  /** Ancho recomendado en pixels */
  width: number;
  /** Alto recomendado en pixels */
  height: number;
  /** Label legible: "Cuadrada 1:1" */
  label: string;
  /** Por que este ratio: lo que ve el usuario */
  hint: string;
  /** Tolerancia de diferencia de ratio (0.15 = 15%) antes de mostrar warning */
  tolerance: number;
}

export const LAYOUT_IMAGE_SPECS: Record<string, ImageSpec> = {
  grid: {
    ratio: "1/1", width: 1000, height: 1000,
    label: "Cuadrada 1:1",
    hint: "Este catalogo muestra productos en grilla cuadrada. Imagenes cuadradas se ven perfectas sin recorte.",
    tolerance: 0.15,
  },
  overlay: {
    ratio: "3/4", width: 900, height: 1200,
    label: "Vertical 3:4",
    hint: "Este catalogo usa tarjetas verticales estilo Instagram. Imagenes verticales llenan toda la tarjeta sin barras negras.",
    tolerance: 0.12,
  },
  editorial: {
    ratio: "4/3", width: 1200, height: 900,
    label: "Horizontal 4:3",
    hint: "El layout editorial muestra imagenes horizontales junto al texto del producto. Una imagen cuadrada o horizontal funciona bien.",
    tolerance: 0.15,
  },
  hero: {
    ratio: "1/1", width: 1000, height: 1000,
    label: "Cuadrada 1:1",
    hint: "El primer producto usa un banner panoramico; el resto aparece en circulos. Imagenes cuadradas se centran bien en ambos.",
    tolerance: 0.20,
  },
  magazine: {
    ratio: "21/9", width: 2100, height: 900,
    label: "Panoramica 21:9",
    hint: "El primer producto ocupa un banner full-width cinematografico. Usa una imagen muy ancha para el efecto editorial completo.",
    tolerance: 0.15,
  },
  tiles: {
    ratio: "2/3", width: 800, height: 1200,
    label: "Vertical 2:3",
    hint: "Las tiles son columnas altas y angostas. Una imagen vertical hace que el producto se vea elegante y sin recortes.",
    tolerance: 0.12,
  },
  spotlight: {
    ratio: "3/4", width: 900, height: 1200,
    label: "Vertical 3:4",
    hint: "El spotlight resalta cada producto en grande. Imagenes verticales aprovechan todo el espacio disponible.",
    tolerance: 0.12,
  },
  diagonal: {
    ratio: "1/1", width: 1000, height: 1000,
    label: "Cuadrada 1:1",
    hint: "El layout diagonal aplica recorte dinamico. Imagenes cuadradas dan el mejor resultado con esta transformacion.",
    tolerance: 0.20,
  },
  arch: {
    ratio: "1/1", width: 1000, height: 1000,
    label: "Cuadrada 1:1",
    hint: "Las tarjetas con arco muestran la imagen en un marco especial. Imagenes cuadradas centradas funcionan perfecto.",
    tolerance: 0.15,
  },
  banner_grid: {
    ratio: "16/7", width: 1600, height: 700,
    label: "Panoramica 16:7",
    hint: "El primer producto aparece como banner ancho y el resto en grilla. Usa una imagen panoramica para el producto destacado.",
    tolerance: 0.15,
  },
  bite: {
    ratio: "1/1", width: 1000, height: 1000,
    label: "Cuadrada 1:1",
    hint: "El diseño Bite Burger muestra tarjetas cuadradas de alta calidad en grilla. Las imágenes cuadradas se ven perfectas.",
    tolerance: 0.15,
  },
  bloom: {
    ratio: "1/1", width: 1000, height: 1000,
    label: "Cuadrada 1:1",
    hint: "El diseño Bloom Floral muestra tarjetas cuadradas de alta calidad en grilla. Las imágenes cuadradas se ven perfectas.",
    tolerance: 0.15,
  },
};

/** Obtiene la especificacion de imagen para el modelo activo de una tienda */
export function getImageSpec(store: Store): ImageSpec {
  const rawModel = store.model || "minimalista";
  const model = rawModel === "portada" ? "banner_grid" : rawModel;
  // Mapear modelo a layout
  const LAYOUT_MAP: Record<string, string> = {
    minimalista: "grid", clasico: "grid", nature_mint: "grid",
    vibrante: "overlay", eco: "hero", luxury: "editorial",
    pastel: "spotlight", boutique: "editorial", nocturno: "overlay",
    neon: "grid", dark_fashion: "overlay", tropical: "grid",
    corporativo: "grid", moderno: "grid", terroso: "grid",
    marina: "grid", candy: "overlay", rose_gold: "overlay",
    forest: "grid", sunset: "grid", ice: "grid", urban: "overlay",
    elite: "grid", portada: "banner_grid", banner_grid: "banner_grid",
    magazine: "magazine", tiles: "tiles", spotlight: "spotlight",
    diagonal: "diagonal", arch: "arch", editorial: "editorial",
    bite: "bite", bloom: "bloom",
  };
  const layout = LAYOUT_MAP[model] || "grid";
  return LAYOUT_IMAGE_SPECS[layout] || LAYOUT_IMAGE_SPECS["grid"];
}

/**
 * Dado el ancho y alto real de una imagen, detecta si coincide con el spec.
 * Retorna: "ok" | "warning" | "error"
 */
export function checkImageRatio(
  naturalWidth: number,
  naturalHeight: number,
  spec: ImageSpec
): { status: "ok" | "warning"; message: string } {
  if (naturalWidth === 0 || naturalHeight === 0) return { status: "ok", message: "" };
  const [rW, rH] = spec.ratio.split("/").map(Number);
  const expectedRatio = rW / rH;
  const actualRatio = naturalWidth / naturalHeight;
  const diff = Math.abs(actualRatio - expectedRatio) / expectedRatio;

  if (diff <= spec.tolerance) {
    return { status: "ok", message: "" };
  }

  const isTooBroad = actualRatio > expectedRatio;
  return {
    status: "warning",
    message: isTooBroad
      ? "Tu imagen es mas ancha de lo recomendado — se recortaran los lados."
      : "Tu imagen es mas alta de lo recomendado — se recortara arriba y abajo.",
  };
}
