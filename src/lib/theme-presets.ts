export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  isDark: boolean;
  values: {
    brandColor: string;
    bgColor: string;
    textColor: string;
    cardBg: string;
    accentColor: string;
    borderRadius: string;
    imgShape: "square" | "rounded" | "circle";
    isDark: boolean;
    typography: "sans" | "serif" | "rounded" | "modern";
    cardStyle: "standard" | "flat" | "shadow" | "curved";
  };
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "claro",
    name: "Claro Minimalista",
    description: "Paleta limpia e ilustrativa de alto contraste, ideal para cualquier rubro.",
    isDark: false,
    values: {
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
  },
  {
    id: "calido",
    name: "Cálido Tradicional",
    description: "Tonos cremas, madera y detalles terracota para marcas artesanales y tradicionales.",
    isDark: false,
    values: {
      brandColor: "#92400e",
      bgColor: "#fdfaf5",
      textColor: "#451a03",
      cardBg: "#fef9ef",
      accentColor: "#fef3c7",
      borderRadius: "6px",
      imgShape: "square",
      isDark: false,
      typography: "serif",
      cardStyle: "standard",
    },
  },
  {
    id: "menta",
    name: "Menta Fresco",
    description: "Sensación fresca y vegetal en tonos turquesa y esmeralda suave.",
    isDark: false,
    values: {
      brandColor: "#0d9488",
      bgColor: "#f0fefb",
      textColor: "#134e4a",
      cardBg: "#ffffff",
      accentColor: "#99f6e4",
      borderRadius: "24px",
      imgShape: "rounded",
      isDark: false,
      typography: "sans",
      cardStyle: "standard",
    },
  },
  {
    id: "bosque",
    name: "Bosque Profundo",
    description: "Fondo verde oscuro con acentos neón que transmiten exclusividad y naturaleza nocturna.",
    isDark: true,
    values: {
      brandColor: "#4ade80",
      bgColor: "#0d1f0f",
      textColor: "#f0fdf4",
      cardBg: "#142e17",
      accentColor: "#166534",
      borderRadius: "16px",
      imgShape: "rounded",
      isDark: true,
      typography: "sans",
      cardStyle: "shadow",
    },
  },
  {
    id: "nocturno",
    name: "Nocturno Elegante",
    description: "Fondo slate oscuro con contraste índigo para catálogos modernos nocturnos.",
    isDark: true,
    values: {
      brandColor: "#818cf8",
      bgColor: "#0f172a",
      textColor: "#f8fafc",
      cardBg: "#1e293b",
      accentColor: "#312e81",
      borderRadius: "16px",
      imgShape: "rounded",
      isDark: true,
      typography: "modern",
      cardStyle: "shadow",
    },
  },
  {
    id: "atardecer",
    name: "Atardecer Místico",
    description: "Violáceo profundo con tonos naranjas y ámbar de alto dinamismo.",
    isDark: true,
    values: {
      brandColor: "#fb923c",
      bgColor: "#1a0a2e",
      textColor: "#faf5ff",
      cardBg: "#2e1065",
      accentColor: "#581c87",
      borderRadius: "20px",
      imgShape: "rounded",
      isDark: true,
      typography: "modern",
      cardStyle: "shadow",
    },
  },
  {
    id: "vibrante",
    name: "Vibrante Naranja",
    description: "Energía cálida y moderna inspirada en tiendas de tendencia e Instagram Shopping.",
    isDark: false,
    values: {
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
  },
];
