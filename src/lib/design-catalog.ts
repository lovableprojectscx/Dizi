/**
 * @file design-catalog.ts
 * @description Catálogo de estructuras y plantillas de diseño visual para las tiendas de DIZI.
 * Define la Ficha Única de Diseño (DesignSpec), modelos arquitectónicos (Grilla, Overlay,
 * Hero, Magazine, Tiles, Spotlight, Arch, etc.), sus paletas de color y estilos predeterminados,
 * y funciones de resolución en tiempo de ejecución (`getDesignSpec`, `resolveRenderModel`, `resolveStructureId`).
 */

/**
 * Valores estéticos predeterminados asignados a una estructura de diseño.
 */
export interface StructureThemeDefaults {
  /** Color primario de marca */
  brandColor?: string;
  /** Color de fondo del catálogo */
  bgColor?: string;
  /** Color principal del texto */
  textColor?: string;
  /** Color de fondo de las tarjetas de producto */
  cardBg?: string;
  /** Color de acento para botones y badges */
  accentColor?: string;
  /** Radio de curvatura de esquinas */
  borderRadius?: string;
  /** Forma geométrica de las fotos de producto */
  imgShape?: "square" | "rounded" | "circle";
  /** Activa modo oscuro por defecto */
  isDark?: boolean;
  /** Tipografía predeterminada */
  typography?: "sans" | "serif" | "rounded" | "modern";
  /** Estilo de las tarjetas de producto */
  cardStyle?: "standard" | "flat" | "shadow" | "curved";
}

/**
 * Los 15 identificadores oficiales de diseño en DIZI.
 */
export type OfficialDesignId =
  | "grid"
  | "overlay"
  | "hero"
  | "spotlight"
  | "editorial"
  | "tiles"
  | "magazine"
  | "diagonal"
  | "arch"
  | "banner_grid"
  | "bloom_general"
  | "bloom_floral"
  | "bite"
  | "nature"
  | "lookbook";

export type CoverTextField = "titulo" | "subtitulo" | "etiqueta";

export type EditableThemeField =
  | "colores"
  | "tipografia"
  | "tarjeta"
  | "formaFoto"
  | "radio"
  | "oscuro";

/**
 * Ficha técnica única de especificación de diseño DIZI (DesignSpec).
 * Única fuente de verdad para panel, catálogo, documentación y pruebas automáticas.
 */
export interface DesignSpec {
  /** Identificador único oficial de la estructura */
  id: OfficialDesignId;
  /** Nombre comercial en el panel */
  nombre: string;
  /** Familia arquitectónica */
  familia: "estandar" | "premium";
  /** Si pinta portada y tipo (carrusel o ninguna) */
  portada: "ninguna" | "carrusel";
  /** Qué textos sobre la portada dibuja el catálogo y solicita el panel */
  textosPortada: CoverTextField[];
  /** Si inventa textos de ejemplo cuando la tienda no escribe */
  textosDeEjemplo: boolean;
  /** Si respeta corte de banner (directo / con margen / curvado) */
  corteBanner: boolean;
  /** Si soporta carrusel de productos destacados */
  destacados: boolean;
  /** Si dibuja íconos de categoría */
  iconosCategoria: boolean;
  /** Qué controles de tema muestra el panel y respeta el catálogo */
  temaEditable: EditableThemeField[];
  /** Modo oscuro por defecto de fábrica */
  oscuroDeFabrica: boolean;
  /** Rubro o nicho sugerido (informativo) */
  rubroSugerido: string;
  /** Si está activo en el selector del panel */
  enSelector: boolean;
}

/**
 * Diccionario de fichas técnicas para los 15 diseños oficiales.
 * Refleja estrictamente el comportamiento real en tiempo de ejecución (N1).
 */
export const DESIGN_SPECS: Record<OfficialDesignId, DesignSpec> = {
  grid: {
    id: "grid",
    nombre: "Grilla Simétrica",
    familia: "estandar",
    portada: "carrusel",
    textosPortada: ["titulo", "subtitulo", "etiqueta"],
    textosDeEjemplo: false,
    corteBanner: false,
    destacados: false,
    iconosCategoria: false,
    temaEditable: ["colores", "tipografia", "oscuro"],
    oscuroDeFabrica: false,
    rubroSugerido: "General / Comercio",
    enSelector: true,
  },
  overlay: {
    id: "overlay",
    nombre: "Overlay Visual",
    familia: "estandar",
    portada: "ninguna",
    textosPortada: [],
    textosDeEjemplo: false,
    corteBanner: false,
    destacados: false,
    iconosCategoria: false,
    temaEditable: ["colores", "tipografia", "oscuro"],
    oscuroDeFabrica: false,
    rubroSugerido: "Moda / Calzado",
    enSelector: true,
  },
  hero: {
    id: "hero",
    nombre: "Hero Panorámico",
    familia: "estandar",
    portada: "ninguna",
    textosPortada: [],
    textosDeEjemplo: false,
    corteBanner: false,
    destacados: false,
    iconosCategoria: false,
    temaEditable: ["colores", "tipografia", "oscuro"],
    oscuroDeFabrica: false,
    rubroSugerido: "Bienestar / Ecológico",
    enSelector: true,
  },
  spotlight: {
    id: "spotlight",
    nombre: "Enfoque Spotlight",
    familia: "estandar",
    portada: "ninguna",
    textosPortada: [],
    textosDeEjemplo: false,
    corteBanner: false,
    destacados: false,
    iconosCategoria: false,
    temaEditable: ["colores", "tipografia", "oscuro"],
    oscuroDeFabrica: false,
    rubroSugerido: "Joyería / Boutique",
    enSelector: true,
  },
  editorial: {
    id: "editorial",
    nombre: "Estilo Editorial",
    familia: "estandar",
    portada: "ninguna",
    textosPortada: [],
    textosDeEjemplo: false,
    corteBanner: false,
    destacados: false,
    iconosCategoria: false,
    temaEditable: ["colores", "tipografia", "oscuro"],
    oscuroDeFabrica: false,
    rubroSugerido: "Corporativo / Marcas Premium",
    enSelector: true,
  },
  tiles: {
    id: "tiles",
    nombre: "Mosaico Tiles",
    familia: "estandar",
    portada: "ninguna",
    textosPortada: [],
    textosDeEjemplo: false,
    corteBanner: false,
    destacados: false,
    iconosCategoria: false,
    temaEditable: ["colores", "tipografia", "oscuro"],
    oscuroDeFabrica: true,
    rubroSugerido: "Tecnología / Accesorios",
    enSelector: true,
  },
  magazine: {
    id: "magazine",
    nombre: "Revista Magazine",
    familia: "estandar",
    portada: "ninguna",
    textosPortada: [],
    textosDeEjemplo: false,
    corteBanner: false,
    destacados: false,
    iconosCategoria: false,
    temaEditable: ["colores", "tipografia", "oscuro"],
    oscuroDeFabrica: true,
    rubroSugerido: "Noche / Tendencias",
    enSelector: true,
  },
  diagonal: {
    id: "diagonal",
    nombre: "Diagonal Dynamic",
    familia: "estandar",
    portada: "ninguna",
    textosPortada: [],
    textosDeEjemplo: false,
    corteBanner: false,
    destacados: false,
    iconosCategoria: false,
    temaEditable: ["colores", "tipografia", "oscuro"],
    oscuroDeFabrica: true,
    rubroSugerido: "Deportes / Juventud",
    enSelector: true,
  },
  arch: {
    id: "arch",
    nombre: "Arch Studio",
    familia: "estandar",
    portada: "ninguna",
    textosPortada: [],
    textosDeEjemplo: false,
    corteBanner: false,
    destacados: false,
    iconosCategoria: false,
    temaEditable: ["colores", "tipografia", "oscuro"],
    oscuroDeFabrica: false,
    rubroSugerido: "Diseño / Arte / Belleza",
    enSelector: true,
  },
  banner_grid: {
    id: "banner_grid",
    nombre: "Portada con Banner",
    familia: "estandar",
    portada: "carrusel",
    textosPortada: ["titulo", "subtitulo", "etiqueta"],
    textosDeEjemplo: false,
    corteBanner: false,
    destacados: false,
    iconosCategoria: false,
    temaEditable: ["colores", "tipografia", "oscuro"],
    oscuroDeFabrica: false,
    rubroSugerido: "Promociones / Marcas con Banner",
    enSelector: true,
  },
  bloom_general: {
    id: "bloom_general",
    nombre: "Bloom Estándar Premium",
    familia: "premium",
    portada: "carrusel",
    textosPortada: [],
    textosDeEjemplo: false,
    corteBanner: true,
    destacados: true,
    iconosCategoria: true,
    temaEditable: ["colores", "tipografia", "tarjeta", "oscuro"],
    oscuroDeFabrica: false,
    rubroSugerido: "Multipropósito Premium",
    enSelector: true,
  },
  bloom_floral: {
    id: "bloom_floral",
    nombre: "Bloom Floral",
    familia: "premium",
    portada: "carrusel",
    textosPortada: [],
    textosDeEjemplo: false,
    corteBanner: true,
    destacados: true,
    iconosCategoria: true,
    temaEditable: ["colores", "tipografia", "tarjeta", "oscuro"],
    oscuroDeFabrica: false,
    rubroSugerido: "Florería / Regalos",
    enSelector: true,
  },
  bite: {
    id: "bite",
    nombre: "Bite Gastronómico",
    familia: "premium",
    portada: "carrusel",
    textosPortada: [],
    textosDeEjemplo: false,
    corteBanner: false,
    destacados: true,
    iconosCategoria: true,
    temaEditable: ["colores", "tipografia", "oscuro"],
    oscuroDeFabrica: true,
    rubroSugerido: "Gastronomía / Restobar",
    enSelector: true,
  },
  nature: {
    id: "nature",
    nombre: "Nature Orgánico",
    familia: "premium",
    portada: "carrusel",
    textosPortada: ["titulo", "subtitulo", "etiqueta"],
    textosDeEjemplo: true,
    corteBanner: false,
    destacados: true,
    iconosCategoria: true,
    temaEditable: ["colores", "tipografia", "oscuro"],
    oscuroDeFabrica: false,
    rubroSugerido: "Salud / Orgánico",
    enSelector: true,
  },
  lookbook: {
    id: "lookbook",
    nombre: "Lookbook Moda",
    familia: "premium",
    portada: "carrusel",
    textosPortada: ["titulo", "subtitulo", "etiqueta"],
    textosDeEjemplo: true,
    corteBanner: false,
    destacados: false,
    iconosCategoria: false,
    temaEditable: ["colores", "tipografia", "oscuro"],
    oscuroDeFabrica: false,
    rubroSugerido: "Moda / Colecciones",
    enSelector: true,
  },
};

/**
 * Definición completa de una plantilla o estructura de diseño disponible en DIZI.
 */
export interface StructureDef {
  /** Identificador único de la plantilla */
  id: OfficialDesignId;
  /** Nombre comercial visible para el comerciante */
  name: string;
  /** Descripción del estilo y público objetivo */
  description: string;
  /** Imagen de previsualización para el catálogo de plantillas */
  previewImage?: string;
  /** Tipo de distribución geométrica aplicada en la UI */
  layout: OfficialDesignId;
  /** Paleta y estilos por defecto */
  defaultTheme: StructureThemeDefaults;
  /** Ficha técnica única de especificación */
  spec: DesignSpec;
  /** @deprecated Reemplazado por spec. Mantenido por retrocompatibilidad */
  supportedModules: string[];
  /** Rubro o nicho comercial sugerido */
  suggestedNiche?: string;
  /** Soporta iconos personalizados en categorías */
  supportsCategoryIcons?: boolean;
}

export const DESIGN_STRUCTURES: StructureDef[] = [
  {
    id: "grid",
    name: "Grilla Simétrica",
    description: "Distribución clásica en rejilla 2×N con tarjetas limpias. Ideal para catálogos con amplio inventario.",
    previewImage: "/images/designs/minimalista.webp",
    layout: "grid",
    defaultTheme: {
      brandColor: "#4f46e5",
      bgColor: "#ffffff",
      textColor: "#1e293b",
      cardBg: "#f8fafc",
      accentColor: "#e0e7ff",
      borderRadius: "12px",
      imgShape: "rounded",
      isDark: false,
      typography: "sans",
      cardStyle: "standard",
    },
    spec: DESIGN_SPECS.grid,
    supportedModules: ["watermark", "banners", "search", "pdf", "promoBar", "dualButton", "analytics"],
    suggestedNiche: "General / Comercio",
    supportsCategoryIcons: false,
  },
  {
    id: "overlay",
    name: "Overlay Visual",
    description: "Tarjetas verticales 3:4 con texto superpuesto sobre imagen. Estilo dinámico tipo redes sociales.",
    previewImage: "/images/designs/boutique.webp",
    layout: "overlay",
    defaultTheme: {
      brandColor: "#ea580c",
      bgColor: "#fff7ed",
      textColor: "#431407",
      cardBg: "#ffffff",
      accentColor: "#ffedd5",
      borderRadius: "20px",
      imgShape: "rounded",
      isDark: false,
      typography: "modern",
      cardStyle: "shadow",
    },
    spec: DESIGN_SPECS.overlay,
    supportedModules: ["watermark", "search", "pdf", "promoBar", "dualButton", "analytics"],
    suggestedNiche: "Moda / Calzado",
    supportsCategoryIcons: false,
  },
  {
    id: "hero",
    name: "Hero Panorámico",
    description: "Cabecera de impacto + galería destacada circular. El primer producto captura la atención inmediata.",
    previewImage: "/images/designs/editorial.webp",
    layout: "hero",
    defaultTheme: {
      brandColor: "#16a34a",
      bgColor: "#f0fdf4",
      textColor: "#14532d",
      cardBg: "#ffffff",
      accentColor: "#dcfce7",
      borderRadius: "24px",
      imgShape: "circle",
      isDark: false,
      typography: "sans",
      cardStyle: "standard",
    },
    spec: DESIGN_SPECS.hero,
    supportedModules: ["watermark", "search", "pdf", "promoBar", "dualButton", "analytics"],
    suggestedNiche: "Bienestar / Ecológico",
    supportsCategoryIcons: false,
  },
  {
    id: "spotlight",
    name: "Enfoque Spotlight",
    description: "Enfoca la atención en productos estrella individuales con presentación tipo vitrina de lujo.",
    previewImage: "/images/designs/catalogo.webp",
    layout: "spotlight",
    defaultTheme: {
      brandColor: "#d97706",
      bgColor: "#faf5eb",
      textColor: "#451a03",
      cardBg: "#ffffff",
      accentColor: "#fef3c7",
      borderRadius: "16px",
      imgShape: "square",
      isDark: false,
      typography: "serif",
      cardStyle: "shadow",
    },
    spec: DESIGN_SPECS.spotlight,
    supportedModules: ["watermark", "search", "pdf", "promoBar", "dualButton", "analytics"],
    suggestedNiche: "Joyería / Boutique",
    supportsCategoryIcons: false,
  },
  {
    id: "editorial",
    name: "Estilo Editorial",
    description: "Tipografía de titulares y espacios generosos. Perfecto para marcas que cuentan historias.",
    previewImage: "/images/designs/dark-fashion.webp",
    layout: "editorial",
    defaultTheme: {
      brandColor: "#334155",
      bgColor: "#ffffff",
      textColor: "#0f172a",
      cardBg: "#f8fafc",
      accentColor: "#e2e8f0",
      borderRadius: "4px",
      imgShape: "square",
      isDark: false,
      typography: "serif",
      cardStyle: "flat",
    },
    spec: DESIGN_SPECS.editorial,
    supportedModules: ["watermark", "search", "pdf", "promoBar", "dualButton", "analytics"],
    suggestedNiche: "Corporativo / Marcas Premium",
    supportsCategoryIcons: false,
  },
  {
    id: "tiles",
    name: "Mosaico Tiles",
    description: "Bloques tipo azulejo interconectados. Distribución moderna ideal para catálogos visuales.",
    previewImage: "/images/designs/grid-compact.webp",
    layout: "tiles",
    defaultTheme: {
      brandColor: "#a855f7",
      bgColor: "#0d0d1a",
      textColor: "#f4f4f5",
      cardBg: "#1a1040",
      accentColor: "#2d1b6e",
      borderRadius: "16px",
      imgShape: "rounded",
      isDark: true,
      typography: "modern",
      cardStyle: "standard",
    },
    spec: DESIGN_SPECS.tiles,
    supportedModules: ["watermark", "search", "pdf", "promoBar", "dualButton", "analytics"],
    suggestedNiche: "Tecnología / Accesorios",
    supportsCategoryIcons: false,
  },
  {
    id: "magazine",
    name: "Revista Magazine",
    description: "Disposición asimétrica inspirada en publicaciones de tendencia y catálogos de temporada.",
    previewImage: "/images/designs/horizontal-swipe.webp",
    layout: "magazine",
    defaultTheme: {
      brandColor: "#e11d48",
      bgColor: "#09090b",
      textColor: "#f4f4f5",
      cardBg: "#18181b",
      accentColor: "#ffe4e6",
      borderRadius: "8px",
      imgShape: "square",
      isDark: true,
      typography: "modern",
      cardStyle: "flat",
    },
    spec: DESIGN_SPECS.magazine,
    supportedModules: ["watermark", "search", "pdf", "promoBar", "dualButton", "analytics"],
    suggestedNiche: "Noche / Tendencias",
    supportsCategoryIcons: false,
  },
  {
    id: "diagonal",
    name: "Diagonal Dynamic",
    description: "Cortes en diagonal y ángulos dinámicos. Da un aire de energía, deporte e innovación.",
    previewImage: "/images/designs/retail-cards.webp",
    layout: "diagonal",
    defaultTheme: {
      brandColor: "#faec45",
      bgColor: "#0d1117",
      textColor: "#f4f4f5",
      cardBg: "#1c2128",
      accentColor: "#21262d",
      borderRadius: "12px",
      imgShape: "rounded",
      isDark: true,
      typography: "sans",
      cardStyle: "standard",
    },
    spec: DESIGN_SPECS.diagonal,
    supportedModules: ["watermark", "search", "pdf", "promoBar", "dualButton", "analytics"],
    suggestedNiche: "Deportes / Juventud",
    supportsCategoryIcons: false,
  },
  {
    id: "arch",
    name: "Arch Studio",
    description: "Arcos curvados elegantes en imágenes y tarjetas. Otorga una estética artística distintiva.",
    previewImage: "/images/designs/neon-glow.webp",
    layout: "arch",
    defaultTheme: {
      brandColor: "#be185d",
      bgColor: "#fff5f7",
      textColor: "#831843",
      cardBg: "#ffffff",
      accentColor: "#fbcfe8",
      borderRadius: "24px",
      imgShape: "rounded",
      isDark: false,
      typography: "serif",
      cardStyle: "curved",
    },
    spec: DESIGN_SPECS.arch,
    supportedModules: ["watermark", "search", "pdf", "promoBar", "dualButton", "analytics"],
    suggestedNiche: "Diseño / Arte / Belleza",
    supportsCategoryIcons: false,
  },
  {
    id: "banner_grid",
    name: "Portada con Banner",
    description: "Sección principal con imagen de portada panorámica seguida de catálogo organizativo.",
    previewImage: "/images/designs/modern-soft.webp",
    layout: "banner_grid",
    defaultTheme: {
      brandColor: "#059669",
      bgColor: "#f0fdf4",
      textColor: "#064e3b",
      cardBg: "#ffffff",
      accentColor: "#a7f3d0",
      borderRadius: "16px",
      imgShape: "rounded",
      isDark: false,
      typography: "sans",
      cardStyle: "standard",
    },
    spec: DESIGN_SPECS.banner_grid,
    supportedModules: ["watermark", "banners", "search", "pdf", "promoBar", "dualButton", "analytics"],
    suggestedNiche: "Promociones / Marcas con Banner",
    supportsCategoryIcons: false,
  },
  {
    id: "bloom_general",
    name: "Bloom Estándar Premium",
    description: "Diseño multipropósito limpio y moderno con carrusel de banners superiores y destacados.",
    previewImage: "/images/designs/retro-vintage.webp",
    layout: "bloom_general",
    defaultTheme: {
      brandColor: "#FF823A",
      bgColor: "#ffffff",
      textColor: "#18181b",
      cardBg: "#f4f4f5",
      accentColor: "#ffedd5",
      borderRadius: "16px",
      imgShape: "rounded",
      isDark: false,
      typography: "sans",
      cardStyle: "standard",
    },
    spec: DESIGN_SPECS.bloom_general,
    supportedModules: ["watermark", "banners", "search", "pdf", "promoBar", "featured", "dualButton", "analytics"],
    suggestedNiche: "Multipropósito Premium",
    supportsCategoryIcons: true,
  },
  {
    id: "bloom_floral",
    name: "Bloom Floral",
    description: "Diseño romántico de esquinas suaves y detalles curvos especiales para florerías y regalos.",
    previewImage: "/images/designs/clean-compact.webp",
    layout: "bloom_floral",
    defaultTheme: {
      brandColor: "#be185d",
      bgColor: "#fff5f7",
      textColor: "#831843",
      cardBg: "#ffffff",
      accentColor: "#fbcfe8",
      borderRadius: "24px",
      imgShape: "rounded",
      isDark: false,
      typography: "serif",
      cardStyle: "curved",
    },
    spec: DESIGN_SPECS.bloom_floral,
    supportedModules: ["watermark", "banners", "search", "pdf", "promoBar", "featured", "dualButton", "analytics"],
    suggestedNiche: "Florería / Regalos",
    supportsCategoryIcons: true,
  },
  {
    id: "bite",
    name: "Bite Gastronómico",
    description: "Layout gastronómico optimizado para rápida navegación, fotos apetitosas e interacción directa.",
    previewImage: "/images/designs/elegant-serif.webp",
    layout: "bite",
    defaultTheme: {
      brandColor: "#dc2626",
      bgColor: "#0f172a",
      textColor: "#f8fafc",
      cardBg: "#1e293b",
      accentColor: "#fecaca",
      borderRadius: "16px",
      imgShape: "rounded",
      isDark: true,
      typography: "modern",
      cardStyle: "standard",
    },
    spec: DESIGN_SPECS.bite,
    supportedModules: ["watermark", "banners", "search", "pdf", "promoBar", "featured", "dualButton", "analytics"],
    suggestedNiche: "Gastronomía / Restobar",
    supportsCategoryIcons: true,
  },
  {
    id: "nature",
    name: "Nature Orgánico",
    description: "Elegancia natural en verde salvia con tipografía serif. Salud, belleza y productos botánicos.",
    previewImage: "/images/designs/natural-warm.webp",
    layout: "nature",
    defaultTheme: {
      brandColor: "#047857",
      bgColor: "#f0fdf4",
      textColor: "#064e3b",
      cardBg: "#ffffff",
      accentColor: "#a7f3d0",
      borderRadius: "20px",
      imgShape: "rounded",
      isDark: false,
      typography: "serif",
      cardStyle: "standard",
    },
    spec: DESIGN_SPECS.nature,
    supportedModules: ["watermark", "banners", "search", "pdf", "promoBar", "featured", "dualButton", "analytics"],
    suggestedNiche: "Salud / Orgánico",
    supportsCategoryIcons: true,
  },
  {
    id: "lookbook",
    name: "Lookbook Moda",
    description: "Catálogo de alta moda con tarjetas estilo revista y presentación limpia para colecciones.",
    previewImage: "/images/designs/bold-impact.webp",
    layout: "lookbook",
    defaultTheme: {
      brandColor: "#18181b",
      bgColor: "#ffffff",
      textColor: "#09090b",
      cardBg: "#fafafa",
      accentColor: "#e4e4e7",
      borderRadius: "8px",
      imgShape: "square",
      isDark: false,
      typography: "serif",
      cardStyle: "flat",
    },
    spec: DESIGN_SPECS.lookbook,
    supportedModules: ["watermark", "banners", "search", "pdf", "promoBar", "dualButton", "analytics"],
    suggestedNiche: "Moda / Colecciones",
    supportsCategoryIcons: false,
  },
];

/* ─────────────────────────────────────────────────────────
   ADAPTADORES — Módulo 2.5
   Puente entre los ids unificados y lo que el render y los
   datos históricos entienden.
   ───────────────────────────────────────────────────────── */

/** Traduce un id de estructura unificada al id que MODEL_CONFIGS de PublicCatalog sabe renderizar. */
const RENDER_MODEL_MAP: Record<string, string> = {
  grid: "minimalista",
  overlay: "vibrante",
  hero: "eco",
  spotlight: "boutique",
  editorial: "corporativo",
  tiles: "aurora",
  magazine: "dark_fashion",
  diagonal: "slash",
  arch: "arch_studio",
  banner_grid: "portada",
  bloom_general: "bloom",
  bloom_floral: "bloom",
  bloom: "bloom",
  bite: "bite",
  nature: "nature",
  lookbook: "lookbook",
};

export function resolveRenderModel(structureId: string | null | undefined): string {
  if (!structureId) return "minimalista";
  return RENDER_MODEL_MAP[structureId] ?? structureId;
}

/** Traduce un model histórico (+ niche) a su estructura unificada. */
const LEGACY_STRUCTURE_MAP: Record<string, string> = {
  minimalista: "grid",
  clasico: "grid",
  nature_mint: "grid",
  forest_deep: "grid",
  vibrante: "overlay",
  nocturno: "overlay",
  sunset_glow: "overlay",
  eco: "hero",
  elite: "banner_grid",
  boutique: "spotlight",
  corporativo: "editorial",
  aurora: "tiles",
  dark_fashion: "magazine",
  luxury: "magazine",
  slash: "diagonal",
  arch_studio: "arch",
  portada: "banner_grid",
  bite: "bite",
  nature: "nature",
  lookbook: "lookbook",
};

export function resolveStructureId(
  modelId: string | null | undefined,
  niche?: string | null,
): OfficialDesignId {
  if (!modelId) return "grid";
  // bloom histórico: se desambigua por el rubro
  if (modelId === "bloom") return niche === "floreria" ? "bloom_floral" : "bloom_general";
  // Ya es un id unificado (de las 15 estructuras)
  if (modelId in DESIGN_SPECS) return modelId as OfficialDesignId;
  return (LEGACY_STRUCTURE_MAP[modelId] as OfficialDesignId) ?? "grid";
}

/**
 * Obtiene la ficha única de diseño (DesignSpec) para cualquier ID de estructura,
 * modelo render o modelo histórico.
 */
export function getDesignSpec(
  modelOrStructureId: string | null | undefined,
  niche?: string | null,
): DesignSpec {
  const structureId = resolveStructureId(modelOrStructureId, niche);
  return DESIGN_SPECS[structureId] ?? DESIGN_SPECS.grid;
}

/**
 * Consulta si un diseño o estructura soporta íconos en categorías.
 * Lee directamente de la ficha única (DesignSpec).
 */
export function modelSupportsCategoryIcons(structureOrModelId: string | null | undefined): boolean {
  if (!structureOrModelId) return false;
  return getDesignSpec(structureOrModelId).iconosCategoria;
}
