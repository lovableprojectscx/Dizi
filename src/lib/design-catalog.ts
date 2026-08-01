export interface StructureThemeDefaults {
  brandColor?: string;
  bgColor?: string;
  textColor?: string;
  cardBg?: string;
  accentColor?: string;
  borderRadius?: string;
  imgShape?: "square" | "rounded" | "circle";
  isDark?: boolean;
  typography?: "sans" | "serif" | "rounded" | "modern";
  cardStyle?: "standard" | "flat" | "shadow" | "curved";
}

export interface StructureDef {
  id: string;
  name: string;
  description: string;
  previewImage?: string;
  layout:
    | "grid"
    | "overlay"
    | "editorial"
    | "hero"
    | "magazine"
    | "tiles"
    | "spotlight"
    | "diagonal"
    | "arch"
    | "banner_grid"
    | "bloom_general"
    | "bloom_floral"
    | "bite"
    | "nature"
    | "lookbook";
  defaultTheme: StructureThemeDefaults;
  supportedModules: string[];
  suggestedNiche?: string;
  supportsCategoryIcons?: boolean;
}

export const DESIGN_STRUCTURES: StructureDef[] = [
  {
    id: "grid",
    name: "Grilla Simétrica",
    description: "Distribución clásica en rejilla 2×N con tarjetas limpias. Ideal para catálogos con amplio inventario.",
    previewImage: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80",
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
    supportedModules: ["watermark", "banners", "search", "pdf", "promoBar", "featured", "dualButton", "analytics", "tagFilter"],
    suggestedNiche: "General / Comercio",
  },
  {
    id: "overlay",
    name: "Overlay Visual",
    description: "Tarjetas verticales 3:4 con texto superpuesto sobre imagen. Estilo dinámico tipo redes sociales.",
    previewImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80",
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
    supportedModules: ["watermark", "banners", "search", "pdf", "promoBar", "featured", "dualButton", "analytics", "tagFilter"],
    suggestedNiche: "Moda / Calzado",
  },
  {
    id: "hero",
    name: "Hero Panorámico",
    description: "Cabecera de impacto + galería destacada circular. El primer producto captura la atención inmediata.",
    previewImage: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
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
    supportedModules: ["watermark", "banners", "search", "pdf", "promoBar", "featured", "dualButton", "analytics", "tagFilter"],
    suggestedNiche: "Bienestar / Ecológico",
  },
  {
    id: "spotlight",
    name: "Enfoque Spotlight",
    description: "Enfoca la atención en productos estrella individuales con presentación tipo vitrina de lujo.",
    previewImage: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80",
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
    supportedModules: ["watermark", "banners", "search", "pdf", "promoBar", "featured", "dualButton", "analytics", "tagFilter"],
    suggestedNiche: "Joyería / Boutique",
  },
  {
    id: "editorial",
    name: "Estilo Editorial",
    description: "Tipografía de titulares y espacios generosos. Perfecto para marcas que cuentan historias.",
    previewImage: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
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
    supportedModules: ["watermark", "banners", "search", "pdf", "promoBar", "featured", "dualButton", "analytics", "tagFilter"],
    suggestedNiche: "Corporativo / Marcas Premium",
  },
  {
    id: "tiles",
    name: "Mosaico Tiles",
    description: "Bloques tipo azulejo interconectados. Distribución moderna ideal para catálogos visuales.",
    previewImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    layout: "tiles",
    defaultTheme: {
      brandColor: "#7c3aed",
      bgColor: "#f5f3ff",
      textColor: "#2e1065",
      cardBg: "#ffffff",
      accentColor: "#ddd6fe",
      borderRadius: "16px",
      imgShape: "rounded",
      isDark: false,
      typography: "modern",
      cardStyle: "standard",
    },
    supportedModules: ["watermark", "banners", "search", "pdf", "promoBar", "featured", "dualButton", "analytics", "tagFilter"],
    suggestedNiche: "Tecnología / Accesorios",
    supportsCategoryIcons: true,
  },
  {
    id: "magazine",
    name: "Revista Magazine",
    description: "Disposición asimétrica inspirada en publicaciones de tendencia y catálogos de temporada.",
    previewImage: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
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
    supportedModules: ["watermark", "banners", "search", "pdf", "promoBar", "featured", "dualButton", "analytics", "tagFilter"],
    suggestedNiche: "Noche / Tendencias",
  },
  {
    id: "diagonal",
    name: "Diagonal Dynamic",
    description: "Cortes en diagonal y ángulos dinámicos. Da un aire de energía, deporte e innovación.",
    previewImage: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80",
    layout: "diagonal",
    defaultTheme: {
      brandColor: "#2563eb",
      bgColor: "#eff6ff",
      textColor: "#1e3a8a",
      cardBg: "#ffffff",
      accentColor: "#bfdbfe",
      borderRadius: "12px",
      imgShape: "rounded",
      isDark: false,
      typography: "sans",
      cardStyle: "standard",
    },
    supportedModules: ["watermark", "banners", "search", "pdf", "promoBar", "featured", "dualButton", "analytics", "tagFilter"],
    suggestedNiche: "Deportes / Juventud",
  },
  {
    id: "arch",
    name: "Arch Studio",
    description: "Arcos curvados elegantes en imágenes y tarjetas. Otorga una estética artística distintiva.",
    previewImage: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80",
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
    supportedModules: ["watermark", "banners", "search", "pdf", "promoBar", "featured", "dualButton", "analytics", "tagFilter"],
    suggestedNiche: "Diseño / Arte / Belleza",
  },
  {
    id: "banner_grid",
    name: "Portada con Banner",
    description: "Sección principal con imagen de portada panorámica seguida de catálogo organizativo.",
    previewImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
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
    supportedModules: ["watermark", "banners", "search", "pdf", "promoBar", "featured", "dualButton", "analytics", "tagFilter"],
    suggestedNiche: "Promociones / Marcas con Banner",
  },
  {
    id: "bloom_general",
    name: "Bloom Estándar Premium",
    description: "Diseño multipropósito limpio y moderno con carrusel de banners superiores y destacados.",
    previewImage: "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=800&q=80",
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
    supportedModules: ["watermark", "banners", "search", "pdf", "promoBar", "featured", "dualButton", "analytics", "tagFilter"],
    suggestedNiche: "Multipropósito Premium",
    supportsCategoryIcons: true,
  },
  {
    id: "bloom_floral",
    name: "Bloom Floral",
    description: "Diseño romántico de esquinas suaves y detalles curvos especiales para florerías y regalos.",
    previewImage: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
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
    supportedModules: ["watermark", "banners", "search", "pdf", "promoBar", "featured", "dualButton", "analytics", "tagFilter"],
    suggestedNiche: "Florería / Regalos",
    supportsCategoryIcons: true,
  },
  {
    id: "bite",
    name: "Bite Gastronómico",
    description: "Layout gastronómico optimizado para rápida navegación, fotos apetitosas e interacción directa.",
    previewImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
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
    supportedModules: ["watermark", "banners", "search", "pdf", "promoBar", "featured", "dualButton", "analytics", "tagFilter"],
    suggestedNiche: "Gastronomía / Restobar",
    supportsCategoryIcons: true,
  },
  {
    id: "nature",
    name: "Nature Orgánico",
    description: "Elegancia natural en verde salvia con tipografía serif. Salud, belleza y productos botánicos.",
    previewImage: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
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
    supportedModules: ["watermark", "banners", "search", "pdf", "promoBar", "featured", "dualButton", "analytics", "tagFilter"],
    suggestedNiche: "Salud / Orgánico",
    supportsCategoryIcons: true,
  },
  {
    id: "lookbook",
    name: "Lookbook Moda",
    description: "Catálogo de alta moda con tarjetas estilo revista y presentación limpia para colecciones.",
    previewImage: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80",
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
    supportedModules: ["watermark", "banners", "search", "pdf", "promoBar", "featured", "dualButton", "analytics", "tagFilter"],
    suggestedNiche: "Moda / Colecciones",
  },
];

/* ─────────────────────────────────────────────────────────
   ADAPTADORES — Modulo 2.5
   Puente entre los ids unificados y lo que el render y los
   datos historicos entienden. Repuesto tras perdida por
   corrupcion de archivo el 30/07/2026.
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

export function modelSupportsCategoryIcons(structureOrModelId: string | null | undefined): boolean {
  if (!structureOrModelId) return false;
  const struct = DESIGN_STRUCTURES.find(
    (s) => s.id === structureOrModelId || s.layout === structureOrModelId
  );
  if (struct?.supportsCategoryIcons) return true;

  const renderModel = resolveRenderModel(structureOrModelId);
  return (
    renderModel === "bite" ||
    renderModel === "bloom" ||
    renderModel === "nature" ||
    renderModel === "aurora"
  );
}

/** Traduce un model historico (+ niche) a su estructura unificada, para preseleccionar en el panel. */
const LEGACY_STRUCTURE_MAP: Record<string, string> = {
  minimalista: "grid",
  clasico: "grid",
  nature_mint: "grid",
  forest_deep: "grid",
  vibrante: "overlay",
  nocturno: "overlay",
  sunset_glow: "overlay",
  eco: "hero",
  elite: "hero",
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
): string {
  if (!modelId) return "grid";
  // Ya es un id unificado
  if (RENDER_MODEL_MAP[modelId]) return modelId;
  // bloom historico: se desambigua por el rubro
  if (modelId === "bloom") return niche === "floreria" ? "bloom_floral" : "bloom_general";
  return LEGACY_STRUCTURE_MAP[modelId] ?? "grid";
}
