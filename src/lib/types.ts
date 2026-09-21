/**
 * @file types.ts
 * @description Modelos de dominio, tipos TypeScript, constantes del negocio y funciones auxiliares
 * para la plataforma DIZI (Catálogo Dinámico SAAS, Bio-Links y Gestión de Suscripciones).
 */

/**
 * Identificadores válidos para los planes de suscripción de DIZI.
 * - `semilla`: Plan básico/gratuito con funciones esenciales y límite de productos.
 * - `emprendedor`: Plan inicial para negocios en crecimiento (hasta 100 productos).
 * - `pro`: Plan avanzado con soporte de promociones, múltiples banners y funciones completas.
 * - `ilimitado`: Plan superior sin restricciones de catálogo ni productos (hasta 1000 productos).
 */
export type PlanId = "semilla" | "emprendedor" | "pro" | "ilimitado";

/**
 * Estados del ciclo de vida de la suscripción de una tienda.
 * - `active`: Suscripción vigente y al día.
 * - `trial`: Periodo de prueba gratuito concedido a la tienda.
 * - `expired`: Suscripción que superó su fecha límite y periodo de gracia.
 * - `cancelled`: Suscripción cancelada manualmente por el comercio o el administrador.
 */
export type SubscriptionStatus = "active" | "expired" | "cancelled" | "trial";

/**
 * Estructura de configuración y límites asociados a un plan comercial.
 */
export interface Plan {
  /** Identificador único del plan */
  id: PlanId;
  /** Nombre comercial visible para el usuario (ej: "Catálogo Pro") */
  name: string;
  /** Cantidad máxima de productos que la tienda puede publicar */
  productLimit: number;
  /** Precio mensual regular en moneda local (PEN / Soles) */
  price: number;
  /** Precio anual con descuento por pago adelantado */
  annualPrice: number;
}

/**
 * Catálogo de planes disponibles en el sistema con sus límites y precios oficiales.
 */
export const PLANS: Record<PlanId, Plan> = {
  semilla: { id: "semilla", name: "Semilla", productLimit: 20, price: 0, annualPrice: 0 },
  emprendedor: { id: "emprendedor", name: "Emprendedor", productLimit: 100, price: 19.9, annualPrice: 179 },
  pro: { id: "pro", name: "Catálogo Pro", productLimit: 300, price: 39.9, annualPrice: 359 },
  ilimitado: { id: "ilimitado", name: "Ilimitado", productLimit: 1000, price: 69.9, annualPrice: 629 },
};

/**
 * Opciones predeterminadas de duración para la contratación o extensión de planes.
 */
export const PLAN_DURATION_OPTIONS = [
  { value: 1, label: "1 mes" },
  { value: 3, label: "3 meses" },
  { value: 6, label: "6 meses" },
  { value: 12, label: "12 meses (1 año)" },
] as const;

/**
 * Días de tolerancia concedidos al comercio tras el vencimiento de su plan
 * antes de aplicar las restricciones y límites del plan semilla.
 */
export const GRACE_DAYS = 3;

/**
 * Días de gracia antes de revertir la plantilla de diseño personalizada
 * a la plantilla básica del plan semilla cuando la suscripción caduca.
 */
export const MODEL_GRACE_DAYS = 15;

/**
 * Nombre de la plantilla de diseño predeterminada asignada al plan semilla.
 */
export const SEMILLA_MODEL = "minimalista";

/**
 * Representa una categoría de productos dentro de una tienda.
 */
export interface Category {
  /** Identificador único de la categoría (UUID o hash corto) */
  id: string;
  /** Nombre visible de la categoría (ej: "Bebidas", "Calzado") */
  name: string;
  /** Icono representativo opcional (nombre del icono de Lucide) */
  icon?: string;
  /** Cantidad calculada de productos pertenecientes a esta categoría */
  productCount?: number;
}

/**
 * Representa una variación específica de un producto (ej: talla, color, sabor).
 */
export interface ProductVariation {
  /** Identificador único de la variación */
  id: string;
  /** Nombre descriptivo de la variante (ej: "Talla L / Rojo", "500 ml") */
  name: string;
  /** Precio particular de esta variante si difiere del precio base del producto */
  price?: number | null;
  /** URL de la imagen específica que representa a esta variante */
  image?: string | null;
}

/**
 * Representa un artículo o producto publicado en el catálogo de una tienda.
 */
export interface Product {
  /** Identificador único del producto (UUID) */
  id: string;
  /** Nombre comercial del producto */
  name: string;
  /** Precio regular de venta. Si es null, el producto se muestra sin precio directo o a consultar */
  price?: number | null;
  /** ID de la categoría a la que pertenece el producto */
  categoryId: string;
  /** URL pública de la imagen principal del producto (alojada en Supabase Storage) */
  image: string;
  /** Descripción detallada del producto (ingredientes, materiales, instrucciones) */
  description?: string;
  /** Indica si el producto se encuentra en oferta o promoción destacada */
  isOnSale?: boolean;
  /** Precio original de referencia antes de la oferta (se muestra tachado en la UI) */
  originalPrice?: number | null;
  /** Determina si el producto es visible para los compradores en el catálogo público */
  visible: boolean;
  /** Indica si es un producto de demostración precargado durante el onboarding */
  isSample?: boolean;
  /** Orden numérico para la visualización manual y reordenamiento en el catálogo */
  sortOrder?: number;
  /** Etiquetas o palabras clave asociadas para búsqueda y filtros */
  tags?: string[];
  /** Fecha de creación en formato ISO 8601 */
  createdAt?: string;
  /** Lista opcional de variantes disponibles para este producto */
  variations?: ProductVariation[];
}

/**
 * Representa un botón o enlace de acceso rápido dentro de la página Link-in-Bio de una tienda.
 */
export interface QuickLink {
  /** Texto mostrado en el botón (ej: "Síguenos en Instagram", "Menú del Día") */
  label: string;
  /** URL de destino hacia donde redirige el botón */
  url: string;
  /** Color de fondo personalizado en formato hexadecimal (ej: "#FF007F") */
  bgColor?: string;
  /** Color del texto en formato hexadecimal (ej: "#FFFFFF") */
  textColor?: string;
  /** URL de una miniatura o icono personalizado cargado por el usuario */
  thumbnailUrl?: string;
  /** Nombre del icono predeterminado de Lucide o red social */
  iconName?: string;
}

/**
 * Entidad principal que representa a un comercio/tienda en la plataforma DIZI.
 * Contiene toda la configuración de identidad de marca, catálogo, diseño, bio-link y suscripción.
 */
export interface Store {
  /** Identificador único de la tienda (UUID) */
  id: string;
  /** Slug único utilizado para la URL pública (ej: "dizi.la/t/mi-tienda") */
  slug: string;
  /** Nombre comercial de la tienda o negocio */
  name: string;
  /** Número telefónico de contacto para recepción de pedidos vía WhatsApp */
  phone: string;
  /** Código telefónico internacional del país (ej: "51" para Perú) */
  countryCode: string;
  /** URL del logotipo de la tienda */
  logo?: string | null;
  /** Color primario de marca en formato hexadecimal (ej: "#2563EB") */
  brandColor?: string | null;
  /** Color de fondo principal del catálogo */
  bgColor?: string | null;
  /** Color de texto principal del catálogo */
  textColor?: string | null;
  /** URL o URLs concatenadas (con |||) de las imágenes de banner de portada */
  bannerImage?: string | null;
  /** Título principal superpuesto en el banner de cabecera */
  bannerTitle?: string | null;
  /** Estilo visual del banner: directo (full width), framed (enmarcado) o curved (con curvas) */
  bannerStyle?: "direct" | "framed" | "curved" | null;
  /** Familia tipográfica utilizada en el catálogo público */
  catalogTypography?: "sans" | "serif" | "rounded" | "modern" | null;
  /** Estilo visual de las tarjetas de producto en el catálogo */
  cardStyle?: "standard" | "flat" | "shadow" | "curved" | null;
  /** Color de fondo de las tarjetas de producto */
  cardBg?: string | null;
  /** Color de acento para botones, precios y destacados */
  accentColor?: string | null;
  /** Radio de borde para elementos interactivos y tarjetas */
  borderRadius?: string | null;
  /** Forma geométrica de las imágenes de producto (cuadrada, redondeada, circular) */
  imgShape?: "square" | "rounded" | "circle" | null;
  /** Modo oscuro activo para la visualización del catálogo */
  isDark?: boolean | null;
  /** Plan de suscripción contratado actualmente por la tienda */
  plan: PlanId;
  /** Estado de activación del comercio en la plataforma */
  active: boolean;
  /** Fecha de registro de la tienda en formato ISO 8601 */
  createdAt: string;
  /** Contador acumulado de clics hacia WhatsApp generados desde el catálogo */
  whatsappClicks: number;
  /** Contador acumulado de visitas recibidas en la tienda */
  views?: number;
  /** Total de bytes transferidos estimados hacia clientes para métricas de egress */
  egressBytes?: number;
  /** Determina si el catálogo se encuentra publicado y accesible al público */
  isPublished?: boolean;
  /** Nombre de la plantilla de diseño visual asignada al catálogo */
  model?: string;
  /** Identificador de usuario (auth.users) propietario de la tienda */
  ownerId?: string;
  /** Nicho o rubro comercial del negocio (ej: "gastronomia", "moda", "tecnologia") */
  niche?: string;
  /** Habilita el filtro de rango de precios en el catálogo público */
  priceFilterEnabled?: boolean;
  /** Activa la visualización del Libro de Reclamaciones virtual exigido por ley */
  libroReclamacionesActivo?: boolean;
  /** Número de Registro Único de Contribuyente (RUC) de la empresa */
  empresaRuc?: string | null;
  /** Razón Social legal de la empresa propietaria */
  empresaRazonSocial?: string | null;
  /** Dirección fiscal física de la empresa */
  empresaDireccion?: string | null;
  /** Fecha y hora exacta en que vence el plan actual (ISO 8601) */
  planExpiresAt?: string;
  /** Estado detallado de la suscripción (active, trial, expired, cancelled) */
  subscriptionStatus?: SubscriptionStatus;
  /** Fecha en que se canceló la suscripción (si aplica) */
  cancelledAt?: string;
  /** Motivo registrado al cancelar la suscripción */
  cancelReason?: string;
  /** Duración en meses pactada en el ciclo actual de suscripción */
  planDurationMonths?: number;
  /** Precio especial personalizado pactado con el cliente fuera de tarifa regular */
  customPrice?: number;
  /** Biografía o descripción breve mostrada en la página Link-in-Bio */
  bioDescription?: string | null;
  /** Latitud geográfica de la ubicación física del negocio */
  locationLat?: number;
  /** Longitud geográfica de la ubicación física del negocio */
  locationLng?: number;
  /** Dirección física en texto legible */
  locationAddress?: string | null;
  /** Habilita la visualización del mapa interactivo con Leaflet en el bio-link */
  showMap?: boolean;
  /** Muestra la marca "Creado con DIZI" en el pie de página */
  showDiziBranding?: boolean;
  /** Código o slug de la tienda que refirió a este comercio */
  referredBy?: string | null;
  /** Indica si ya se entregó la recompensa de referidos por esta tienda */
  referralRewarded?: boolean;
  /** Indica si el usuario completó el asistente de configuración inicial */
  onboardingCompleted?: boolean;
  /** Lista de enlaces rápidos configurados para la página Link-in-Bio */
  quickLinks?: QuickLink[];
  /** Activa la página pública de Link-in-Bio (/bio/:slug) */
  bioLinksEnabled?: boolean;
  /** URL de la foto de perfil o logo circular para el Bio-Link */
  bioLogo?: string | null;
  /** URL de la imagen de portada o banner para el Bio-Link */
  bioBanner?: string | null;
  /** Tema estético para el Bio-Link (ej: "default", "dark", "sunset", "neon") */
  bioTheme?: string | null;
  /** Estilo tipográfico para el Bio-Link */
  bioTypography?: "sans" | "serif" | "rounded" | "modern" | null;
  /**
   * Muestra el botón directo "Ver Catálogo" en el Bio-Link.
   * null = comportamiento automático según plantilla.
   */
  bioShowCatalogButton?: boolean | null;
  /** Estilo de los botones del Bio-Link (ej: "pill-solid", "rounded-outline", "sharp-glass") */
  bioButtonStyle?: string | null;
  /** Color de fondo personalizado de los botones del Bio-Link */
  bioButtonColor?: string | null;
  /** Color del texto de los botones del Bio-Link */
  bioButtonTextColor?: string | null;
  /** URL de la imagen de fondo de pantalla completa en el Bio-Link */
  bioBgImage?: string | null;
  /** Color de fondo sólido para el Bio-Link */
  bioBgColor?: string | null;
  /** Eslogan o frase secundaria mostrada en el banner principal */
  bannerTagline?: string | null;
  /** Etiqueta pequeña mostrada en la parte inferior del banner */
  bannerBottomTag?: string | null;
  /** Arreglo de URLs de imágenes de banners múltiples */
  banners?: string[];
  /** Activa la barra superior de anuncios o cintillo promocional */
  promoBarEnabled?: boolean;
  /** Texto del anuncio en la barra promocional */
  promoBarText?: string;
  /** Tipo de acción al hacer clic en la barra: enlace, producto, categoría o cupón */
  promoBarActionType?: "none" | "product" | "category" | "url" | "coupon" | "cart";
  /** Valor asociado a la acción (ej: ID del producto o URL externa) */
  promoBarActionValue?: string;
  /** Color de fondo de la barra promocional */
  promoBarBgColor?: string | null;
  /** Color del texto de la barra promocional */
  promoBarTextColor?: string | null;
  /** Activa el efecto de marquesina (texto desplazándose horizontalmente) */
  promoBarIsMarquee?: boolean;
  /** Categorías pertenecientes a la tienda */
  categories: Category[];
  /** Productos pertenecientes a la tienda */
  products: Product[];
  /** Total de productos activos en base de datos para optimizaciones de conteo */
  totalProductsCount?: number;
}

/**
 * Representa un token de invitación generado para activar o regalar un plan a una tienda.
 */
export interface Invite {
  /** Token alfanumérico único para canje */
  token: string;
  /** Plan que se activará al canjear el token */
  plan: PlanId;
  /** Indica si la invitación ya fue consumida por algún comercio */
  used: boolean;
  /** Fecha en que se creó la invitación (ISO 8601) */
  createdAt: string;
  /** Duración en meses por defecto asignada al canjear */
  durationMonths: number;
  /** Fecha límite en la que expira la validez del token */
  expiresAt: string;
  /** Notas internas sobre el cliente o motivo de la cortesía */
  notes?: string;
  /** Precio especial pactado con el cliente al usar la invitación */
  customPrice?: number;
  /** Valor numérico de duración (ej: 15 para 15 días) */
  durationValue?: number;
  /** Unidad de tiempo para la duración: días o meses */
  durationUnit?: "days" | "months";
}

/**
 * Representa una oferta o promoción de precio para un plan de suscripción en el sistema.
 */
export interface PlanPromotion {
  /** Identificador del plan al que aplica la promoción */
  plan_id: PlanId;
  /** Precio regular de referencia */
  regular_price: number;
  /** Precio promocional con descuento aplicado */
  promo_price?: number | null;
  /** Indica si la promoción está actualmente vigente y visible */
  promo_active: boolean;
  /** Texto de la insignia promocional (ej: "¡50% DCTO!", "OFERTA LANZAMIENTO") */
  promo_label?: string | null;
  /** Fecha límite de caducidad de la oferta en formato ISO 8601 */
  promo_until?: string | null;
}

// ─── Helpers de suscripcion ──────────────────────────────────────────────────

/**
 * Calcula los días transcurridos desde que venció el plan de la tienda.
 * @param store Objeto de la tienda.
 * @returns Número entero de días (positivo = vencido, negativo = aún vigente, null = sin fecha de vencimiento).
 */
export function daysSinceExpiry(store: Store): number | null {
  if (!store.planExpiresAt) return null;
  const diff = Date.now() - new Date(store.planExpiresAt).getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calcula los días restantes hasta la fecha de expiración del plan.
 * @param store Objeto de la tienda.
 * @returns Número entero de días restantes (positivo = vigencia disponible, negativo = ya caducó).
 */
export function daysUntilExpiry(store: Store): number | null {
  if (!store.planExpiresAt) return null;
  const diff = new Date(store.planExpiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Retorna el plan que debe aplicarse efectivamente en este instante considerando el periodo de gracia.
 * - Si el plan es "semilla", retorna "semilla".
 * - Si el plan no ha vencido o se encuentra dentro del margen de gracia (<= 3 días), retorna el plan contratado.
 * - Si superó los días de gracia, degrada automáticamente las capacidades al plan "semilla".
 * @param store Objeto de la tienda.
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
 * Retorna el límite máximo de productos permitido para la tienda en este momento según su plan efectivo.
 * @param store Objeto de la tienda.
 */
export function getEffectiveProductLimit(store: Store): number {
  return PLANS[getEffectivePlan(store)].productLimit;
}

/**
 * Determina si la suscripción de la tienda ya superó su fecha límite, sin considerar los días de gracia.
 * @param store Objeto de la tienda.
 */
export function isSubscriptionExpired(store: Store): boolean {
  if (store.plan === "semilla") return false;
  if (!store.planExpiresAt) return false;
  return new Date(store.planExpiresAt) < new Date();
}

/**
 * Calcula cuántos días restan del periodo de gracia especial (15 días) para mantener la plantilla de diseño elegida.
 * @param store Objeto de la tienda.
 * @returns Días restantes de gracia de diseño, o null si el plan está vigente o es semilla.
 */
export function modelGraceDaysLeft(store: Store): number | null {
  if (store.plan === "semilla") return null;
  if (!store.planExpiresAt) return null;
  const since = daysSinceExpiry(store);
  if (since === null || since <= 0) return null;
  const remaining = MODEL_GRACE_DAYS - since;
  return Math.max(0, remaining);
}

/**
 * Retorna el modelo de diseño que debe renderizarse actualmente en el catálogo público de la tienda.
 * @param store Objeto de la tienda.
 */
export function getEffectiveModel(store: Store): string {
  return store.model || SEMILLA_MODEL;
}

/**
 * Función auxiliar para verificar si debe forzarse el modelo semilla.
 * Actualmente todas las plantillas están disponibles en todos los planes.
 */
export function shouldUseSemillaModel(_store: Store): boolean {
  return false;
}

/**
 * Formatea una fecha ISO a un formato legible en español (ej: "13 may. 2026").
 * @param iso Cadena de fecha en formato ISO 8601.
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Indica si el plan de la tienda se encuentra activo y no vencido (sin contemplar gracia).
 * @param store Objeto de la tienda.
 */
export function isPlanActive(store: Store): boolean {
  if (store.plan === "semilla") return true;
  if (!store.planExpiresAt) return false;
  return new Date(store.planExpiresAt) > new Date();
}

/**
 * Retorna el límite máximo de botones/enlaces permitidos en la página Link-in-Bio de la tienda.
 * El plan semilla permite hasta 3 enlaces; planes superiores tienen enlaces ilimitados.
 * @param store Objeto de la tienda.
 */
export function getBioLinksLimit(store: Store): number {
  if (getEffectivePlan(store) === "semilla") return 3;
  return Infinity;
}

/**
 * Indica si la tienda tiene habilitadas las opciones estéticas premium en su Bio-Link
 * (imágenes de fondo personalizadas, temas avanzados, etc.).
 * @param store Objeto de la tienda.
 */
export function canUsePremiumBioFeatures(store: Store): boolean {
  return store.plan !== "semilla";
}

/**
 * Indica si el plan de la tienda permite mostrar la barra superior de anuncios (Cintillo).
 * Disponible exclusivamente para planes "pro" e "ilimitado".
 * @param store Objeto de la tienda.
 */
export function planAllowsPromoBar(store: Store): boolean {
  const plan = getEffectivePlan(store);
  return plan === "pro" || plan === "ilimitado";
}

// ─── Especificaciones de imagen por layout ───────────────────────────────────

/**
 * Especificación de dimensiones y proporciones ideales para las imágenes de productos según la plantilla.
 */
export interface ImageSpec {
  /** Proporción CSS de aspecto (ej: "1/1", "3/4", "16/9") */
  ratio: string;
  /** Ancho recomendado en píxeles */
  width: number;
  /** Alto recomendado en píxeles */
  height: number;
  /** Etiqueta descriptiva legible para el usuario (ej: "Cuadrada 1:1") */
  label: string;
  /** Mensaje explicativo sobre cómo se visualizará en la plantilla */
  hint: string;
  /** Margen de tolerancia antes de mostrar advertencia de recorte (0.15 = 15%) */
  tolerance: number;
}

/**
 * Catálogo de especificaciones de imagen por cada tipo de layout del catálogo.
 */
export const LAYOUT_IMAGE_SPECS: Record<string, ImageSpec> = {
  grid: {
    ratio: "1/1",
    width: 1000,
    height: 1000,
    label: "Cuadrada 1:1",
    hint: "Este catálogo muestra productos en grilla cuadrada. Imágenes cuadradas se ven perfectas sin recorte.",
    tolerance: 0.15,
  },
  overlay: {
    ratio: "3/4",
    width: 900,
    height: 1200,
    label: "Vertical 3:4",
    hint: "Este catálogo usa tarjetas verticales estilo Instagram. Imágenes verticales llenan toda la tarjeta sin barras negras.",
    tolerance: 0.12,
  },
  editorial: {
    ratio: "4/3",
    width: 1200,
    height: 900,
    label: "Horizontal 4:3",
    hint: "El layout editorial muestra imágenes horizontales junto al texto del producto. Una imagen cuadrada o horizontal funciona bien.",
    tolerance: 0.15,
  },
  hero: {
    ratio: "1/1",
    width: 1000,
    height: 1000,
    label: "Cuadrada 1:1",
    hint: "El primer producto usa un banner panorámico; el resto aparece en círculos. Imágenes cuadradas se centran bien en ambos.",
    tolerance: 0.2,
  },
  magazine: {
    ratio: "21/9",
    width: 2100,
    height: 900,
    label: "Panorámica 21:9",
    hint: "El primer producto ocupa un banner full-width cinematográfico. Usa una imagen muy ancha para el efecto editorial completo.",
    tolerance: 0.15,
  },
  tiles: {
    ratio: "2/3",
    width: 800,
    height: 1200,
    label: "Vertical 2:3",
    hint: "Las tiles son columnas altas y angostas. Una imagen vertical hace que el producto se vea elegante y sin recortes.",
    tolerance: 0.12,
  },
  spotlight: {
    ratio: "3/4",
    width: 900,
    height: 1200,
    label: "Vertical 3:4",
    hint: "El spotlight resalta cada producto en grande. Imágenes verticales aprovechan todo el espacio disponible.",
    tolerance: 0.12,
  },
  diagonal: {
    ratio: "1/1",
    width: 1000,
    height: 1000,
    label: "Cuadrada 1:1",
    hint: "El layout diagonal aplica recorte dinámico. Imágenes cuadradas dan el mejor resultado con esta transformación.",
    tolerance: 0.2,
  },
  arch: {
    ratio: "1/1",
    width: 1000,
    height: 1000,
    label: "Cuadrada 1:1",
    hint: "Las tarjetas con arco muestran la imagen en un marco especial. Imágenes cuadradas centradas funcionan perfecto.",
    tolerance: 0.15,
  },
  banner_grid: {
    ratio: "16/7",
    width: 1600,
    height: 700,
    label: "Panorámica 16:7",
    hint: "El primer producto aparece como banner ancho y el resto en grilla. Usa una imagen panorámica para el producto destacado.",
    tolerance: 0.15,
  },
  bite: {
    ratio: "1/1",
    width: 1000,
    height: 1000,
    label: "Cuadrada 1:1",
    hint: "El diseño Bite Burger muestra tarjetas cuadradas de alta calidad en grilla. Las imágenes cuadradas se ven perfectas.",
    tolerance: 0.15,
  },
  bloom: {
    ratio: "1/1",
    width: 1000,
    height: 1000,
    label: "Cuadrada 1:1",
    hint: "El diseño Bloom Floral muestra tarjetas cuadradas de alta calidad en grilla. Las imágenes cuadradas se ven perfectas.",
    tolerance: 0.15,
  },
};

/**
 * Obtiene la especificación de proporciones y dimensiones de imagen recomendada
 * según la plantilla de diseño configurada en la tienda.
 * @param store Objeto de la tienda.
 */
export function getImageSpec(store: Store): ImageSpec {
  const rawModel = store.model || "minimalista";
  const model = rawModel === "portada" ? "banner_grid" : rawModel;

  const LAYOUT_MAP: Record<string, string> = {
    minimalista: "grid",
    clasico: "grid",
    nature_mint: "grid",
    vibrante: "overlay",
    eco: "hero",
    pastel: "spotlight",
    boutique: "editorial",
    nocturno: "overlay",
    neon: "grid",
    dark_fashion: "overlay",
    tropical: "grid",
    corporativo: "grid",
    moderno: "grid",
    terroso: "grid",
    marina: "grid",
    candy: "overlay",
    rose_gold: "overlay",
    forest: "grid",
    sunset: "grid",
    ice: "grid",
    urban: "overlay",
    elite: "grid",
    portada: "banner_grid",
    banner_grid: "banner_grid",
    magazine: "magazine",
    tiles: "tiles",
    spotlight: "spotlight",
    diagonal: "diagonal",
    arch: "arch",
    editorial: "editorial",
    bite: "bite",
    bloom: "bloom",
  };
  const layout = LAYOUT_MAP[model] || "grid";
  return LAYOUT_IMAGE_SPECS[layout] || LAYOUT_IMAGE_SPECS["grid"];
}

/**
 * Evalúa si las dimensiones reales de una imagen cumplen con la especificación recomendada
 * para la plantilla, advirtiendo sobre recortes inesperados.
 * @param naturalWidth Ancho nativo de la imagen en píxeles.
 * @param naturalHeight Alto nativo de la imagen en píxeles.
 * @param spec Especificación esperada de la plantilla.
 */
export function checkImageRatio(
  naturalWidth: number,
  naturalHeight: number,
  spec: ImageSpec,
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
      ? "Tu imagen es más ancha de lo recomendado — se recortarán los lados."
      : "Tu imagen es más alta de lo recomendado — se recortará arriba y abajo.",
  };
}

/**
 * Métricas de transferencia de datos y consumo de ancho de banda (Egress) de una tienda.
 */
export interface StoreEgressMetrics {
  /** Tamaño estimado en KB del JSON del catálogo */
  catalogPayloadKB: number;
  /** Tamaño estimado en KB del JSON del Bio-Link */
  bioLinkPayloadKB: number;
  /** Consumo acumulado en MB generado por visitas al catálogo */
  catalogEgressMB: number;
  /** Consumo acumulado en MB generado por visitas al Bio-Link */
  bioLinkEgressMB: number;
  /** Consumo acumulado en MB generado por descarga de imágenes desde Storage */
  mediaStorageMB: number;
  /** Total combinado de transferencia en MB */
  totalEgressMB: number;
  /** Indica si la entrega está optimizada mediante red de distribución (CDN) */
  optimizedWithCdn: boolean;
}

/**
 * Calcula las métricas de consumo de ancho de banda y transferencia de datos de una tienda
 * basándose en su cantidad de productos, visitas y descargas estimadas.
 * @param store Parámetros de la tienda requeridos para el cálculo de consumo.
 */
export function calculateStoreEgress(store: {
  products?: Array<{ visible: boolean; isSample?: boolean }>;
  categories?: Array<unknown>;
  quickLinks?: Array<unknown>;
  views?: number;
  egressBytes?: number;
  bannerImage?: string | null;
  logo?: string | null;
}): StoreEgressMetrics {
  const visibleProductsCount = store.products?.filter((p) => p.visible && !p.isSample).length || 0;
  const categoriesCount = store.categories?.length || 0;
  const linksCount = store.quickLinks?.length || 0;

  // Tamaño real o estimado del JSON del catálogo en KB
  const catalogPayloadKB = Number((0.8 + visibleProductsCount * 0.35 + categoriesCount * 0.1).toFixed(2));
  const bioLinkPayloadKB = Number((0.5 + linksCount * 0.15).toFixed(2));

  const views = store.views || 0;
  const catalogViews = Math.round(views * 0.8);
  const bioViews = Math.round(views * 0.2);

  const catalogEgressMB = Number(((catalogViews * catalogPayloadKB) / 1024).toFixed(2));
  const bioLinkEgressMB = Number(((bioViews * bioLinkPayloadKB) / 1024).toFixed(2));

  // Descarga estimada de imágenes de Storage (lote inicial de 12 fotos ~80KB cada una)
  const imageDownloadsPerVisitMB = Math.min(12, visibleProductsCount) * 0.08;
  const totalMediaEgressMB = Number((views * imageDownloadsPerVisitMB).toFixed(2));

  // Si existe el contador de API medido por PostgreSQL, sumarle el estimado de descarga de imágenes
  const apiJsonMB = store.egressBytes && store.egressBytes > 0
    ? Number((store.egressBytes / (1024 * 1024)).toFixed(2))
    : Number((catalogEgressMB + bioLinkEgressMB).toFixed(2));

  const combinedTotalMB = Number((apiJsonMB + totalMediaEgressMB).toFixed(2));

  return {
    catalogPayloadKB,
    bioLinkPayloadKB,
    catalogEgressMB,
    bioLinkEgressMB,
    mediaStorageMB: totalMediaEgressMB,
    totalEgressMB: combinedTotalMB,
    optimizedWithCdn: true,
  };
}
