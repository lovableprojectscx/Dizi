import { useMemo, useState, useEffect } from "react";
import {
  Search,
  ShoppingBag,
  Plus,
  Minus,
  MessageCircle,
  Flame,
  Trash2,
  X,
  ClipboardList,
  Loader2,
  CheckCircle2,
  MapPin,
  Star,
  Instagram,
  Facebook,
  Linkedin,
  SlidersHorizontal,
  Info,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useApp, useCart } from "@/lib/store";
import { buildWaUrl, formatPrice } from "@/lib/whatsapp";
import type { Store, Product } from "@/lib/types";
import {
  getEffectiveProductLimit,
  getEffectiveModel,
  isSubscriptionExpired,
  modelGraceDaysLeft,
  PLANS,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

const EMPTY_CART: any[] = [];

/* ─────────────────────────────────────────────────────────
   Model → CSS variables + structural config
───────────────────────────────────────────────────────── */
type ModelConfig = {
  vars: React.CSSProperties;
  isDark: boolean;
  imgRounded: string;
  cardRounded: string;
  cardShadow: string;
  cardBorder: boolean;
  headerStyle: "clean" | "bold" | "minimal";
  layout: "grid" | "overlay" | "editorial" | "hero" | "magazine" | "tiles" | "spotlight" | "diagonal" | "arch" | "banner_grid";
};

const MODEL_CONFIGS: Record<string, ModelConfig> = {
  /* ── Plan Semilla ──────────────────────────────────── */
  minimalista: {
    vars: { "--background": "#ffffff", "--card": "#f8fafc", "--primary": "#4f46e5", "--border": "#e2e8f0" } as any,
    isDark: false, imgRounded: "0.75rem", cardRounded: "1rem",
    cardShadow: "hover:shadow-md", cardBorder: true, headerStyle: "clean", layout: "grid",
  },
  clasico: {
    vars: { "--background": "#fdfaf5", "--card": "#fef9ef", "--primary": "#92400e", "--border": "#fde68a" } as any,
    isDark: false, imgRounded: "0.25rem", cardRounded: "0.375rem",
    cardShadow: "hover:shadow-sm", cardBorder: true, headerStyle: "clean", layout: "grid",
  },
  /* ── Plan Emprendedor ──────────────────────────────── */
  nature_mint: {
    vars: { "--background": "#f0fefb", "--card": "#ffffff", "--primary": "#0d9488", "--border": "#99f6e4" } as any,
    isDark: false, imgRounded: "1.25rem", cardRounded: "1.5rem",
    cardShadow: "hover:shadow-lg hover:shadow-teal-200/60", cardBorder: true, headerStyle: "clean", layout: "grid",
  },
  vibrante: {
    vars: { "--background": "#fff7ed", "--card": "#ffffff", "--primary": "#ea580c", "--border": "#ffedd5" } as any,
    isDark: false, imgRounded: "1rem", cardRounded: "1.25rem",
    cardShadow: "hover:shadow-xl hover:shadow-orange-300/40", cardBorder: false, headerStyle: "bold", layout: "overlay",
  },
  eco: {
    vars: { "--background": "#f0fdf4", "--card": "#ffffff", "--primary": "#16a34a", "--border": "#bbf7d0" } as any,
    isDark: false, imgRounded: "9999px", cardRounded: "1.5rem",
    cardShadow: "hover:shadow-lg hover:shadow-green-200/60", cardBorder: true, headerStyle: "clean", layout: "hero",
  },
  /* ── Plan Pro ──────────────────────────────────────── */
  nocturno: {
    vars: { "--background": "#0f172a", "--card": "#1e293b", "--primary": "#818cf8", "--border": "#334155" } as any,
    isDark: true, imgRounded: "0.875rem", cardRounded: "1rem",
    cardShadow: "hover:shadow-2xl hover:shadow-indigo-900/60", cardBorder: false, headerStyle: "bold", layout: "overlay",
  },
  boutique: {
    vars: { "--background": "#faf9f7", "--card": "#f5efe8", "--primary": "#9333ea", "--border": "#ede9fe" } as any,
    isDark: false, imgRounded: "0.75rem", cardRounded: "1rem",
    cardShadow: "hover:shadow-xl hover:shadow-purple-200/50", cardBorder: false, headerStyle: "minimal", layout: "spotlight",
  },
  corporativo: {
    vars: { "--background": "#eff6ff", "--card": "#ffffff", "--primary": "#1d4ed8", "--border": "#bfdbfe" } as any,
    isDark: false, imgRounded: "0.375rem", cardRounded: "0.5rem",
    cardShadow: "hover:shadow-md", cardBorder: true, headerStyle: "clean", layout: "editorial",
  },
  aurora: {
    vars: { "--background": "#0d0d1a", "--card": "#1a1040", "--primary": "#a855f7", "--border": "#2d1b6e" } as any,
    isDark: true, imgRounded: "1.25rem", cardRounded: "1.5rem",
    cardShadow: "hover:shadow-2xl hover:shadow-purple-700/50", cardBorder: false, headerStyle: "bold", layout: "tiles",
  },
  /* ── Plan Ilimitado ────────────────────────────────── */
  luxury: {
    vars: { "--background": "#09090b", "--card": "#18181b", "--primary": "#ca8a04", "--border": "#3f3010" } as any,
    isDark: true, imgRounded: "0px", cardRounded: "0px",
    cardShadow: "hover:shadow-2xl hover:shadow-yellow-900/40", cardBorder: true, headerStyle: "minimal", layout: "editorial",
  },
  dark_fashion: {
    vars: { "--background": "#111111", "--card": "#1c1c1c", "--primary": "#f5f5f5", "--border": "#2a2a2a" } as any,
    isDark: true, imgRounded: "0px", cardRounded: "0px",
    cardShadow: "hover:shadow-2xl", cardBorder: false, headerStyle: "minimal", layout: "magazine",
  },
  slash: {
    vars: { "--background": "#0d1117", "--card": "#1c2128", "--primary": "#faec45", "--border": "#21262d" } as any,
    isDark: true, imgRounded: "0px", cardRounded: "0px",
    cardShadow: "", cardBorder: false, headerStyle: "bold", layout: "diagonal",
  },
  arch_studio: {
    vars: { "--background": "#faf9f6", "--card": "#f4f2ed", "--primary": "#9c6b4e", "--border": "#e8e0d5" } as any,
    isDark: false, imgRounded: "999px", cardRounded: "1rem",
    cardShadow: "hover:shadow-lg hover:shadow-stone-200/80", cardBorder: true, headerStyle: "minimal", layout: "arch",
  },
  /* ── Plan Ilimitado: Portada ───────────────────────── */
  portada: {
    vars: { "--background": "#ffffff", "--card": "#f8fafc", "--primary": "#FF823A", "--border": "#ffe4d5" } as any,
    isDark: false, imgRounded: "0.875rem", cardRounded: "1rem",
    cardShadow: "hover:shadow-md", cardBorder: false, headerStyle: "clean", layout: "banner_grid",
  },
  /* ── Nuevos modelos Elite ──────────────────────────── */
  elite: {
    vars: { "--background": "#ffffff", "--card": "#ffffff", "--primary": "#1e1e1e", "--border": "#e5e7eb" } as any,
    isDark: false, imgRounded: "0px", cardRounded: "0px",
    cardShadow: "hover:shadow-xl", cardBorder: true, headerStyle: "minimal", layout: "grid",
  },
  sunset_glow: {
    vars: { "--background": "#1a0a2e", "--card": "#2d1040", "--primary": "#fb923c", "--border": "#7c2d8e" } as any,
    isDark: true, imgRounded: "1.25rem", cardRounded: "1.5rem",
    cardShadow: "hover:shadow-2xl hover:shadow-orange-700/40", cardBorder: false, headerStyle: "bold", layout: "overlay",
  },
  forest_deep: {
    vars: { "--background": "#0d1f0f", "--card": "#1a2e1c", "--primary": "#4ade80", "--border": "#166534" } as any,
    isDark: true, imgRounded: "0.875rem", cardRounded: "1rem",
    cardShadow: "hover:shadow-2xl hover:shadow-green-900/60", cardBorder: false, headerStyle: "clean", layout: "grid",
  },
};

/**
 * Modelos con fondo bloqueado — su diseño visual depende del fondo original
 * y no debe ser sobrescrito por el color personalizado del usuario.
 */
const BG_LOCKED_MODELS = new Set(["nocturno", "aurora", "luxury", "dark_fashion", "slash", "sunset_glow"]);

const getQuickLinkBranding = (label: string, url: string) => {
  const labelLower = label.toLowerCase();
  const urlLower = url.toLowerCase();

  // Instagram
  if (urlLower.includes("instagram.com") || labelLower.includes("instagram")) {
    return {
      bg: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
      borderColor: "transparent",
      glowColor: "rgba(220, 39, 67, 0.45)",
      baseColor: "#dc2743",
      coloredIcon: (
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id="instaGradBtn" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f09433" />
              <stop offset="25%" stopColor="#e6683c" />
              <stop offset="50%" stopColor="#dc2743" />
              <stop offset="75%" stopColor="#cc2366" />
              <stop offset="100%" stopColor="#bc1888" />
            </linearGradient>
          </defs>
          <rect width="24" height="24" rx="5.5" fill="url(#instaGradBtn)" />
          <path fill="#FFF" d="M12 5.5c-1.782 0-2.004.007-2.705.039a3.7 3.7 0 0 0-1.226.235A2.215 2.215 0 0 0 6.83 7.073a3.7 3.7 0 0 0-.235 1.226C6.563 8.996 6.556 9.218 6.556 11s.007 2.004.039 2.705a3.7 3.7 0 0 0 .235 1.226 2.215 2.215 0 0 0 1.299 1.299c.358.14.786.22 1.226.235.701.032.923.039 2.705.039s2.004-.007 2.705-.039a3.7 3.7 0 0 0 1.226-.235 2.215 2.215 0 0 0 1.299-1.299c.14-.358.22-.786.235-1.226.032-.701.039-.923.039-2.705s-.007-2.004-.039-2.705a3.7 3.7 0 0 0-.235-1.226 2.215 2.215 0 0 0-1.299-1.299c-.358-.14-.786-.22-1.226-.235C14.004 5.507 13.782 5.5 12 5.5zm0 1.17c1.752 0 1.96.007 2.652.039.64.029.988.136 1.22.226a1.045 1.045 0 0 1 .618.618c.09.232.197.58.226 1.22.032.692.039.9.039 2.652s-.007 1.96-.039 2.652c-.029.64-.136.988-.226 1.22a1.045 1.045 0 0 1-.618.618c-.232.09-.58.197-1.22.226-.692.032-.9.039-2.652.039s-1.96-.007-2.652-.039c-.64-.029-.988-.136-1.22-.226a1.045 1.045 0 0 1-.618-.618c-.09-.232-.197-.58-.226-1.22-.032-.692-.039-.9-.039-2.652s.007-1.96.039-2.652c.029-.64.136-.988.226-1.22a1.045 1.045 0 0 1 .618-.618c.232-.09.58-.197 1.22-.226.692-.032.9-.039 2.652-.039zM12 8.16a2.84 2.84 0 1 0 2.84 2.84A2.84 2.84 0 0 0 12 8.16zm0 4.51a1.67 1.67 0 1 1 1.67-1.67A1.67 1.67 0 0 1 12 12.67zm3.125-4.22a.664.664 0 1 0 .664-.664.664.664 0 0 0-.664.664z" />
        </svg>
      ),
    };
  }
  // Facebook
  if (urlLower.includes("facebook.com") || labelLower.includes("facebook")) {
    return {
      bg: "#1877f2",
      borderColor: "#1062cc",
      glowColor: "rgba(24, 119, 242, 0.45)",
      baseColor: "#1877f2",
      coloredIcon: (
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#1877f2" />
          <path fill="#FFF" d="M14 12h-2.5v8h-3v-8h-2v-2.5h2v-1.8c0-2.2 1.4-3.4 3.3-3.4.9 0 1.7.1 1.9.1v2.2h-1.3c-1.1 0-1.3.5-1.3 1.3v1.6h2.5L14 12z" />
        </svg>
      ),
    };
  }
  // TikTok
  if (urlLower.includes("tiktok.com") || labelLower.includes("tiktok")) {
    return {
      bg: "#000000",
      borderColor: "#111111",
      glowColor: "rgba(0, 0, 0, 0.5)",
      baseColor: "#010101",
      coloredIcon: (
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#000000" />
          <path fill="#FFF" d="M16.6 9c-.9 0-1.7-.3-2.4-.8V14c0 2.8-2.2 5-5 5s-5-2.2-5-5 2.2-5 5-5c.3 0 .6 0 .8.1V6.2c-.3 0-.5-.1-.8-.1-4 0-7.2 3.2-7.2 7.2s3.2 7.2 7.2 7.2 7.2-3.2 7.2-7.2V9.8c1.1.8 2.5 1.2 4 1.2V9z" />
        </svg>
      ),
    };
  }
  // LinkedIn
  if (urlLower.includes("linkedin.com") || labelLower.includes("linkedin")) {
    return {
      bg: "#0077b5",
      borderColor: "#005a8a",
      glowColor: "rgba(0, 119, 181, 0.45)",
      baseColor: "#0077b5",
      coloredIcon: (
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#0077b5" />
          <path fill="#FFF" d="M5.3 9h2.8v9H5.3zM6.7 5c1 0 1.8.8 1.8 1.8s-.8 1.8-1.8 1.8-1.8-.8-1.8-1.8.8-1.8 1.8-1.8zm5.2 4h2.7v1.2h.1c.4-.7 1.3-1.4 2.6-1.4 2.8 0 3.3 1.8 3.3 4.2v5h-2.8v-4.4c0-1.1 0-2.4-1.5-2.4s-1.7 1.2-1.7 2.3v4.5h-2.8V9z" />
        </svg>
      ),
    };
  }

  // Fallback (Custom Link)
  const isStar = labelLower.includes("reseña") || labelLower.includes("opinion") || labelLower.includes("calific") || labelLower.includes("opinión");
  return {
    bg: "#1f2937",
    borderColor: "#374151",
    glowColor: "rgba(31, 41, 55, 0.45)",
    baseColor: "#1f2937",
    coloredIcon: isStar ? (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#f59e0b" />
        <path fill="#FFF" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" transform="scale(0.7) translate(5, 5)" />
      </svg>
    ) : (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#4b5563" />
        <path fill="#FFF" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" transform="scale(0.7) translate(5, 5)" />
      </svg>
    ),
  };
};

const DEFAULT_CONFIG: ModelConfig = MODEL_CONFIGS.minimalista;

// Modelos con hero banner — buscador/filtros van DEBAJO del banner, no en el header
const BANNER_MODELS = new Set(["elite", "portada", "luxury", "boutique", "nocturno", "dark_fashion", "aurora", "slash", "sunset_glow"]);

export function PublicCatalog({ store, mode }: { store: Store; mode: "catalog" | "bio" }) {
  const [query, setQuery] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [activeCat, setActiveCat] = useState<string>(
    store.categories?.length === 1 ? store.categories[0].id : "all"
  );
  const [cartOpen, setCartOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [libroOpen, setLibroOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    if (!store?.id || !store.products || store.products.length === 0) {
      setImagesLoaded(true);
      return;
    }
    const fetchImages = async () => {
      try {
        const productIds = store.products.map((p) => p.id);
        const { supabase } = await import("@/lib/supabase");
        const { data, error } = await supabase
          .from("products")
          .select("id, image")
          .in("id", productIds);
        if (data && !error) {
          const imageMap: Record<string, string> = {};
          data.forEach((p: any) => {
            if (p.image) {
              imageMap[p.id] = p.image;
            }
          });
          setProductImages(imageMap);
        }
      } catch (err) {
        console.error("Error cargando imágenes de productos asíncronamente:", err);
      } finally {
        setImagesLoaded(true);
      }
    };
    fetchImages();
  }, [store?.id, store.products]);

  const productsWithImages = useMemo(() => {
    return (store.products || []).map((p) => {
      const hasRealImage = !!productImages[p.id];
      const placeholder = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MDAiIGhlaWdodD0iNjAwIiB2aWV3Qm94PSIwIDAgNjAwIDYwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YxZjVmOSIvPjwvc3ZnPg==";
      return {
        ...p,
        image: hasRealImage 
          ? productImages[p.id] 
          : (imagesLoaded ? (p.image || "") : placeholder),
      };
    });
  }, [store.products, productImages, imagesLoaded]);

  const cart = useCart((s) => s.carts[store.id] ?? EMPTY_CART);
  const cartAdd = useCart((s) => s.add);
  const cartSet = useCart((s) => s.setQty);
  const cartRemove = useCart((s) => s.remove);
  const cartClear = useCart((s) => s.clear);
  const incClicks = useApp((s) => s.incWhatsappClicks);

  /* ── Subscription state ─────────────────────────── */
  const effectiveProductLimit = getEffectiveProductLimit(store);
  const isExpired = isSubscriptionExpired(store);
  const modelDaysLeft = modelGraceDaysLeft(store);

  /* ── Theme setup ─────────────────────────────────── */
  const rawModelId = getEffectiveModel(store);
  const modelId = rawModelId === "portada" ? "elite" : rawModelId;
  const cfg = MODEL_CONFIGS[modelId] ?? DEFAULT_CONFIG;

  // Calculate luminance of a hex color (0 = black, 1 = white)
  const hexLuminance = (hex: string): number => {
    const h = hex.replace("#", "");
    if (h.length < 6) return 1;
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  // If user set a custom bgColor AND model doesn't have a locked background, apply it
  const rawBg = (store as any).bgColor as string | undefined;
  const customBg = BG_LOCKED_MODELS.has(modelId) ? undefined : rawBg;
  const effectiveIsDark = customBg
    ? hexLuminance(customBg) < 0.18   // threshold: < 18% luminance = dark bg
    : cfg.isDark;

  // Blend hex color with white — pure JS, no color-mix (max browser compat)
  const blendWithWhite = (hex: string, amount: number): string => {
    const h = hex.replace("#", "");
    if (h.length < 6) return hex;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const blend = (c: number) => Math.round(c + (255 - c) * amount).toString(16).padStart(2, "0");
    return `#${blend(r)}${blend(g)}${blend(b)}`;
  };

  // Derive card background from custom bg — slightly lighter for contrast
  const effectiveCardBg = customBg
    ? blendWithWhite(customBg, effectiveIsDark ? 0.12 : 0.08)
    : undefined;

  // Gradient backgrounds for locked models that have a special identity
  const MODEL_GRADIENTS: Record<string, string> = {
    aurora:      "radial-gradient(ellipse at 20% 50%, #2d1b6e 0%, #0d0d1a 50%, #1a0830 100%)",
    nocturno:    "linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
    sunset_glow: "radial-gradient(ellipse at 80% 20%, #7c2d8e 0%, #1a0a2e 45%, #0f0520 100%)",
    luxury:      "linear-gradient(180deg, #09090b 0%, #18101a 50%, #09090b 100%)",
    dark_fashion:"linear-gradient(180deg, #111111 0%, #1a1a1a 100%)",
    slash:       "linear-gradient(150deg, #0d1117 0%, #1c1728 50%, #0d1117 100%)",
  };
  const modelGradient = MODEL_GRADIENTS[modelId];

  // Apply brand color and background color overrides
  // All foreground vars recalculated from effectiveIsDark so any model+bg combo stays readable
  const themeVars: React.CSSProperties = {
    ...cfg.vars,
    "--foreground":       effectiveIsDark ? "#f0f0f0" : "#111111",
    "--foreground-muted": effectiveIsDark ? "#a0a0a0" : "#6b7280",
    "--muted-foreground": effectiveIsDark ? "#94a3b8" : "#64748b",
    "--muted":            effectiveIsDark ? "#1e293b" : "#f1f5f9",
    "--secondary":        effectiveIsDark ? "#1e2535" : "#f8fafc",
    "--border":           effectiveIsDark ? "#334155" : "#e2e8f0",
    ...(store.brandColor ? { "--primary": store.brandColor } : {}),
    ...(customBg ? { "--background": customBg } : {}),
    ...(effectiveCardBg ? { "--card": effectiveCardBg } : {}),
    // Gradient for locked models — sets the actual background-image CSS property
    ...(modelGradient ? { backgroundImage: modelGradient } : {}),
  } as React.CSSProperties;

  /* ── Bio-Link Customizations (Theme & Buttons) ── */
  const isBioMode = mode === "bio";
  const bioTheme = store.bioTheme || "default";
  
  let bioThemeVars: React.CSSProperties = { ...themeVars };
  let finalIsDark = effectiveIsDark;

  if (isBioMode && bioTheme !== "default") {
    let background = "#09090b";
    let isDark = true;
    let cardBg = "rgba(255,255,255,0.06)";
    let borderCol = "rgba(255,255,255,0.1)";

    if (bioTheme === "dark") {
      background = "#09090b";
      isDark = true;
      cardBg = "#18181b";
      borderCol = "#27272a";
    } else if (bioTheme === "sunset") {
      background = "linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #4c1d95 100%)";
      isDark = true;
      cardBg = "rgba(255, 255, 255, 0.05)";
      borderCol = "rgba(255, 255, 255, 0.1)";
    } else if (bioTheme === "forest") {
      background = "linear-gradient(135deg, #022c22 0%, #064e3b 50%, #022c22 100%)";
      isDark = true;
      cardBg = "rgba(255, 255, 255, 0.05)";
      borderCol = "rgba(255, 255, 255, 0.1)";
    } else if (bioTheme === "neon") {
      background = "radial-gradient(circle at center, #0c001c 0%, #020005 100%)";
      isDark = true;
      cardBg = "rgba(255, 0, 128, 0.05)";
      borderCol = "rgba(0, 255, 240, 0.2)";
    } else if (bioTheme === "glass") {
      background = "linear-gradient(135deg, #0f172a 0%, #1e1b4b 30%, #311042 70%, #0f172a 100%)";
      isDark = true;
      cardBg = "rgba(255, 255, 255, 0.08)";
      borderCol = "rgba(255, 255, 255, 0.15)";
    } else if (bioTheme === "pastel") {
      background = "linear-gradient(135deg, #fef08a 0%, #fbcfe8 50%, #c084fc 100%)";
      isDark = false;
      cardBg = "rgba(255, 255, 255, 0.4)";
      borderCol = "rgba(255, 255, 255, 0.6)";
    } else if (bioTheme === "ocean") {
      background = "linear-gradient(135deg, #083344 0%, #0f172a 50%, #0c4a6e 100%)";
      isDark = true;
      cardBg = "rgba(255, 255, 255, 0.05)";
      borderCol = "rgba(255, 255, 255, 0.1)";
    } else if (bioTheme === "custom") {
      const isCustomImage = !!store.bioBgImage && store.plan !== "semilla";
      if (isCustomImage) {
        background = `url(${store.bioBgImage})`;
        isDark = true;
        cardBg = "rgba(255, 255, 255, 0.08)";
        borderCol = "rgba(255, 255, 255, 0.15)";
      } else {
        const customColor = store.bioBgColor || "#0f172a";
        background = customColor;
        // Check color brightness
        const hex = customColor.replace("#", "");
        const rgb = parseInt(hex, 16);
        const r = (rgb >> 16) & 0xff;
        const g = (rgb >> 8) & 0xff;
        const b = (rgb >> 0) & 0xff;
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        isDark = luma < 128;
        cardBg = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(15, 23, 42, 0.05)";
        borderCol = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(15, 23, 42, 0.1)";
      }
    }

    finalIsDark = isDark;
    bioThemeVars = {
      ...cfg.vars,
      "--background": (background.includes("gradient") || background.startsWith("url(")) ? "#0f172a" : background,
      "--foreground": isDark ? "#f8fafc" : "#0f172a",
      "--foreground-muted": isDark ? "#cbd5e1" : "#475569",
      "--muted-foreground": isDark ? "#94a3b8" : "#64748b",
      "--muted": isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
      "--secondary": isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
      "--border": borderCol,
      "--card": cardBg,
      ...(store.brandColor ? { "--primary": store.brandColor } : {}),
      ...((background.includes("gradient") || background.startsWith("url(")) 
        ? { backgroundImage: background, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" } 
        : { backgroundImage: "none" }),
    } as React.CSSProperties;
  }

  const getButtonStyle = (styleId: string) => {
    const activeStyle = store.plan === "semilla" ? "pill-solid" : (styleId || "pill-solid");
    const parts = activeStyle.split("-");
    const shape = parts[0] || "pill";
    const type = parts[1] || "solid";

    let radiusClass = "rounded-full";
    if (shape === "rounded") radiusClass = "rounded-lg";
    if (shape === "sharp") radiusClass = "rounded-none";

    return { shape, type, radiusClass };
  };

  const renderBioButton = (
    href: string,
    label: string,
    defaultBg: string,
    defaultBorder: string,
    defaultText: string,
    platform: "whatsapp" | "location" | "instagram" | "facebook" | "tiktok" | "linkedin" | "custom",
    customIcon?: React.ReactNode,
    onClick?: (e: React.MouseEvent) => void,
    overrideBg?: string,
    overrideText?: string
  ) => {
    const buttonStyleId = store.bioButtonStyle || "pill-solid";
    const { shape, type, radiusClass } = getButtonStyle(buttonStyleId);

    const customBg = overrideBg || store.bioButtonColor;
    const customText = overrideText || store.bioButtonTextColor;

    const baseBg = customBg || defaultBg;
    const baseText = customText || (customBg ? "#ffffff" : defaultText);

    let bg = baseBg;
    let borderColor = customBg ? baseBg : defaultBorder;
    let color = baseText;
    let extraClasses = "";

    if (type === "solid") {
      bg = baseBg;
      borderColor = customBg ? baseBg : defaultBorder;
      color = baseText;
    } else if (type === "outline") {
      bg = "transparent";
      borderColor = baseBg;
      color = customText || baseBg;
    } else if (type === "glass") {
      bg = finalIsDark ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.06)";
      borderColor = finalIsDark ? "rgba(255, 255, 255, 0.15)" : "rgba(15, 23, 42, 0.12)";
      color = customText || (finalIsDark ? "#ffffff" : "#0f172a");
      extraClasses = "backdrop-blur-md";
    }

    const hoverGlow = baseBg.startsWith("linear") ? "#dc2743" : baseBg;
    const isCustomColor = !!(customBg || customText);
    const isMonochrome = type === "outline" || type === "glass" || isCustomColor;

    const getMonochromeIcon = () => {
      const iconClass = "h-5 w-5";
      if (platform === "whatsapp") return <MessageCircle className={iconClass} />;
      if (platform === "location") return <MapPin className={iconClass} />;
      if (platform === "instagram") return <Instagram className={iconClass} />;
      if (platform === "facebook") return <Facebook className={iconClass} />;
      if (platform === "linkedin") return <Linkedin className={iconClass} />;
      return <Star className={iconClass} />;
    };

    return (
      <a
        href={href}
        onClick={onClick}
        target={onClick ? undefined : "_blank"}
        rel={onClick ? undefined : "noopener noreferrer"}
        className={cn(
          "relative w-full p-1.5 pr-6 font-extrabold uppercase text-xs tracking-widest transition-all duration-300 flex items-center shadow-md hover:scale-[1.02] active:scale-[0.98] border select-none group overflow-hidden hover:shadow-[0_0_20px_var(--hover-glow)]",
          radiusClass,
          extraClasses
        )}
        style={{
          background: bg,
          borderColor: borderColor,
          color: color,
          "--hover-glow": hoverGlow,
        } as React.CSSProperties}
      >
        <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-premium-shimmer pointer-events-none" />
        
        <div className={cn(
          "h-9 w-9 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300",
          isMonochrome ? "bg-transparent" : "bg-white rounded-full shadow-inner"
        )}>
          {isMonochrome ? getMonochromeIcon() : customIcon}
        </div>
        <span className="flex-1 text-center pr-3">{label}</span>
      </a>
    );
  };

  /* ── Price range bounds ─────────────────────────────────────── */
  const [priceMin, priceMax] = useMemo(() => {
    const prices = productsWithImages.filter(p => p.visible).map(p => p.price);
    if (prices.length === 0) return [0, 0];
    return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))];
  }, [productsWithImages]);

  const hasPriceFilter = store.priceFilterEnabled && priceMin < priceMax;

  /* ── Derived data ────────────────────────────────── */
  const rawFiltered = useMemo(() => {
    const products = productsWithImages;

    // Los productos sample son solo para previsualización interna del admin.
    // Nunca se muestran en el catálogo público.
    const visibleProducts = products
      .filter((p) => p.visible && !p.isSample)
      .slice(0, effectiveProductLimit === Infinity ? undefined : effectiveProductLimit);

    return visibleProducts
      .filter((p) => {
        if (activeCat === "all") return true;
        if (activeCat === "sale") return p.isOnSale;
        return p.categoryId === activeCat;
      })
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
      .filter((p) => {
        if (!priceRange) return true;
        return p.price >= priceRange[0] && p.price <= priceRange[1];
      });
  }, [productsWithImages, activeCat, query, priceRange, effectiveProductLimit]);

  const filtered = useMemo(() => {
    const isBioLink = store.bioLinksEnabled && mode === "bio";
    if (isBioLink) {
      return rawFiltered.slice(0, 4);
    }
    return rawFiltered;
  }, [rawFiltered, store.bioLinksEnabled, mode]);

  const cartCount = cart.reduce((a, c) => a + c.qty, 0);
  const cartLines = cart
    .map((c) => {
      const product = productsWithImages.find((p) => p.id === c.productId);
      return product ? { ...c, product } : null;
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);
  const total = cartLines.reduce((a, l) => a + l.product.price * l.qty, 0);

  /* ── Actions ─────────────────────────────────────── */
  const sendOrder = () => {
    const lines = cartLines
      .map((l) => `• ${l.product.name} x${l.qty} — ${formatPrice(l.product.price * l.qty)}`)
      .join("\n");
    const msg = `Hola ${store.name}, quiero hacer este pedido:\n\n${lines}\n\nTotal: ${formatPrice(total)}`;
    incClicks(store.id);
    window.open(buildWaUrl(store.phone, msg), "_blank");
  };

  const consultProduct = (name: string) => {
    incClicks(store.id);
    window.open(buildWaUrl(store.phone, `Hola, me interesa el producto: ${name}`), "_blank");
  };

  const scrollToLocation = () => {
    const el = document.getElementById("location-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const supportClick = () => {
    incClicks(store.id);
    window.open(buildWaUrl(store.phone, `Hola ${store.name}, tengo una consulta.`), "_blank");
  };

  /* ── Render ──────────────────────────────────────── */
  return (
    <div
      className={cn("min-h-screen bg-background text-foreground transition-colors duration-300", finalIsDark ? "dark" : "")}
      style={isBioMode && bioTheme !== "default" ? bioThemeVars : themeVars}
      translate="no"
    >
      <style>{`
        @keyframes premiumShimmer {
          0% { transform: translateX(-150%) skewX(-15deg); }
          35% { transform: translateX(150%) skewX(-15deg); }
          100% { transform: translateX(150%) skewX(-15deg); }
        }
        .animate-premium-shimmer {
          animation: premiumShimmer 4s infinite ease-in-out;
        }
      `}</style>
      {/* Preview banner */}
      {!store.isPublished && (
        <div className="bg-primary/20 border-b border-primary/30 text-primary px-4 py-1.5 text-center text-[10px] font-bold uppercase tracking-widest">
          Modo Previzualizacion — Solo tu puedes ver esto
        </div>
      )}

      {/* Banner: modelo premium en periodo de gracia (solo visible al owner via previewMode) */}
      {modelDaysLeft !== null && modelDaysLeft > 0 && !store.isPublished && (
        <div className="bg-amber-500 text-white px-4 py-2 text-center text-xs font-semibold">
          Estas usando el modelo <strong>{store.model}</strong> de tu plan anterior.
          En <strong>{modelDaysLeft} dia{modelDaysLeft !== 1 ? "s" : ""}</strong> cambiara automaticamente al modelo Semilla.
          {" "}<a href="/admin/plan" className="underline hover:no-underline">Renueva para conservarlo</a>.
        </div>
      )}

      {/* Banner: modelo ya cambiado a semilla (solo visible al owner) */}
      {modelDaysLeft === 0 && !store.isPublished && (
        <div className="bg-destructive text-white px-4 py-2 text-center text-xs font-semibold">
          Tu suscripcion vencio. El catalogo ahora usa el modelo Semilla.
          {" "}<a href="/admin/plan" className="underline hover:no-underline">Renueva tu plan</a> para recuperar tu diseno original.
        </div>
      )}

      {/* Banner publico: plan vencido, productos limitados */}
      {isExpired && (
        <div className="bg-muted border-b px-4 py-1.5 text-center text-[10px] text-muted-foreground uppercase tracking-widest">
          Catalogo en modo limitado — mostrando {PLANS["semilla"].productLimit} productos
        </div>
      )}

      {/* ── Header ───────────────────────────────────── */}
      {mode === "catalog" && (
        <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {store.logo ? (
                <img
                  src={store.logo}
                  alt={store.name}
                  className="h-8 w-8 object-cover shrink-0"
                  style={{ borderRadius: cfg.imgRounded }}
                />
              ) : (
                <div
                  className="h-8 w-8 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0"
                  style={{ borderRadius: cfg.imgRounded }}
                >
                  <span className="text-primary font-black text-xs uppercase">
                    {store.name.charAt(0)}
                  </span>
                </div>
              )}
              <span
                className={cn("text-sm truncate", cfg.headerStyle === "bold" ? "font-black tracking-tight" : cfg.headerStyle === "minimal" ? "font-light tracking-widest uppercase text-xs" : "font-bold")}
              >
                {store.name}
              </span>
            </div>

            {store.bioLinksEnabled ? (
              <Link
                to="/bio/$slug"
                params={{ slug: store.slug }}
                className={cn(
                  "shrink-0 h-8 px-4 rounded-full bg-primary text-primary-foreground",
                  "text-xs font-bold hover:opacity-90 active:scale-95 transition-all duration-200",
                  "flex items-center gap-1.5 shadow-sm"
                )}
              >
                <Info className="h-3.5 w-3.5" />
                <span>Info</span>
              </Link>
            ) : (
              <button
                onClick={supportClick}
                className={cn(
                  "shrink-0 h-8 px-4 rounded-full bg-primary text-primary-foreground",
                  "text-xs font-bold hover:opacity-90 active:scale-95 transition-all duration-200",
                  "flex items-center gap-1.5 shadow-sm"
                )}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Contacto</span>
              </button>
            )}
          </div>

          {/* Search + Filtros button: modelos SIN hero banner */}
          {!BANNER_MODELS.has(modelId) && mode === "catalog" && (
            <div className="mx-auto max-w-5xl px-4 pb-3 space-y-2">
              {/* Search row + Filtros button */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="¿Qué estás buscando hoy?"
                    className="w-full rounded-full bg-secondary pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring transition"
                  />
                </div>
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="relative shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-secondary hover:bg-accent text-sm font-semibold transition"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Filtros</span>
                  {(() => {
                    const cnt = (activeCat !== "all" ? 1 : 0) + (priceRange ? 1 : 0);
                    return cnt > 0 ? (
                      <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center">
                        {cnt}
                      </span>
                    ) : null;
                  })()}
                </button>
              </div>
              {/* Active filter tags */}
              {(activeCat !== "all" || priceRange) && (
                <div className="flex flex-wrap gap-1.5">
                  {activeCat !== "all" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                      {activeCat === "sale" ? (
                        <><Flame className="h-3 w-3 text-red-500" /> Ofertas</>
                      ) : (
                        store.categories.find(c => c.id === activeCat)?.name ?? activeCat
                      )}
                      <button onClick={() => setActiveCat("all")} className="ml-1 hover:opacity-60 transition">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {priceRange && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                      Hasta S/ {priceRange[1]}
                      <button onClick={() => setPriceRange(null)} className="ml-1 hover:opacity-60 transition">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </header>
      )}

      {/* ── Bio-Link Header View ── */}
      {mode === "bio" && (
        <section className="w-full animate-in fade-in slide-in-from-top-4 duration-500">
          {/* Banner Panorámico */}
          <div className="relative w-full h-[35vw] max-h-[220px] bg-muted overflow-hidden">
            {(store.bioBanner || store.bannerImage) ? (
              <img
                src={store.bioBanner || store.bannerImage}
                alt={store.name}
                className="w-full h-full object-cover animate-in fade-in duration-550"
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, var(--primary) 0%, var(--background) 100%)`,
                  opacity: 0.15,
                }}
              />
            )}
            <div className="absolute inset-0 bg-black/10" />
          </div>

          {/* Perfil & Links */}
          <div className="relative max-w-xl mx-auto px-4 -mt-10 text-center space-y-4 pb-4">
            {/* Logo Solapado */}
            <div className="inline-block relative">
              {(store.bioLogo || store.logo) ? (
                <img
                  src={store.bioLogo || store.logo}
                  alt={store.name}
                  className="h-20 w-20 rounded-full object-cover border-4 shadow-lg animate-in fade-in duration-300"
                  style={{ borderColor: "var(--background)" }}
                />
              ) : (
                <div
                  className="h-20 w-20 rounded-full flex items-center justify-center shadow-lg border-4 text-xl font-black uppercase text-primary"
                  style={{
                    borderColor: "var(--background)",
                    backgroundColor: "var(--secondary)",
                  }}
                >
                  {store.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Nombre y Descripción */}
            <div className="space-y-2">
              <h1 className="text-2xl font-black tracking-tight uppercase">{store.name}</h1>
              {store.bioDescription && (
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {store.bioDescription}
                </p>
              )}
              {/* Verified Badge */}
              <div className="flex items-center justify-center gap-1 mt-1 text-[10px] font-bold text-muted-foreground/80 bg-muted/40 rounded-full w-max mx-auto px-2 py-0.5 border border-muted/50">
                <CheckCircle2 className="h-3 w-3 text-emerald-500 fill-emerald-500/20" />
                <span>Verified</span>
              </div>
            </div>

            {/* Enlaces Rápidos (Quick Links - Estilo Branded Oficial / Charcoal) */}
            <div className="flex flex-col gap-2.5 pt-4 max-w-md mx-auto w-full px-2">
              {/* 1. PEDIR POR WHATSAPP */}
              {store.phone && renderBioButton(
                `https://wa.me/${store.phone}`,
                "Pedir por WhatsApp",
                "#25D366",
                "#128C7E",
                "#ffffff",
                "whatsapp",
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none">
                  <path fill="#25D366" d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.767.46 3.427 1.267 4.887L2 22l5.227-1.373A9.972 9.972 0 0 0 12.004 22c5.524 0 10.004-4.48 10.004-10.004C22.008 6.48 17.528 2 12.004 2z" />
                  <path fill="#FFF" d="M12.004 3.15c-4.88 0-8.854 3.974-8.854 8.854 0 1.56.406 3.084 1.18 4.417L3.75 20.25l4.004-1.05a8.814 8.814 0 0 0 4.25 1.084c4.88 0 8.854-3.974 8.854-8.854S16.884 3.15 12.004 3.15zm4.846 11.233c-.23.633-1.34 1.167-1.854 1.25-.47.083-1.077.15-3.083-.683-2.56-1.06-4.226-3.67-4.353-3.84-.127-.17-.99-1.32-.99-2.52 0-1.2.62-1.78.84-2.02.22-.24.47-.3.63-.3.16 0 .32 0 .46.01.15.01.35-.06.55.42.2.49.69 1.68.75 1.8.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.25.32-.36.43-.12.13-.25.27-.1.53.15.26.66 1.09 1.41 1.76.97.87 1.79 1.14 2.05 1.27.26.13.41.11.56-.06.15-.17.65-.76.82-1.02.17-.26.34-.22.57-.13.23.09 1.47.69 1.72.82.25.13.42.19.48.3.06.11.06.63-.17 1.26z" />
                </svg>
              )}

              {/* 2. NUESTRA UBICACIÓN (Si tiene coordenadas) */}
              {store.locationLat && store.locationLng && renderBioButton(
                "#",
                "Nuestra Ubicación",
                "#ea4335",
                "#d93025",
                "#ffffff",
                "location",
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="12" fill="#ea4335" />
                  <path fill="#FFF" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" transform="scale(0.7) translate(5, 4)" />
                </svg>,
                scrollToLocation
              )}

              {/* 3. Enlaces rápidos del usuario (Redes sociales oficiales + personalizados) */}
              {(() => {
                let customLinkCount = 0;
                const isSemilla = store.plan === "semilla";

                return store.quickLinks && store.quickLinks.map((link, idx) => {
                  const labelLower = link.label.toLowerCase();
                  const isOfficialSocial = ["instagram", "facebook", "tiktok", "linkedin"].includes(labelLower);

                  if (!isOfficialSocial) {
                    customLinkCount++;
                    if (isSemilla && customLinkCount > 5) {
                      return null;
                    }
                  }

                  const branding = getQuickLinkBranding(link.label, link.url);
                  const href = link.url.startsWith("http") ? link.url : `https://${link.url}`;
                  
                  let platform: "instagram" | "facebook" | "linkedin" | "custom" = "custom";
                  const urlLower = link.url.toLowerCase();
                  if (urlLower.includes("instagram.com") || labelLower.includes("instagram")) {
                    platform = "instagram";
                  } else if (urlLower.includes("facebook.com") || labelLower.includes("facebook")) {
                    platform = "facebook";
                  } else if (urlLower.includes("linkedin.com") || labelLower.includes("linkedin")) {
                    platform = "linkedin";
                  }

                  const defaultBg = platform === "custom" ? "#1f2937" : (branding.baseColor || "#1f2937");
                  const defaultBorder = branding.borderColor === "transparent" ? defaultBg : branding.borderColor;

                  // Force default/brand colors for Semilla stores
                  const finalBgColor = isSemilla ? undefined : link.bgColor;
                  const finalTextColor = isSemilla ? undefined : link.textColor;

                  return (
                    <div key={idx} className="w-full">
                      {renderBioButton(
                        href,
                        link.label,
                        branding.bg,
                        defaultBorder,
                        "#ffffff",
                        platform,
                        branding.coloredIcon,
                        undefined,
                        finalBgColor,
                        finalTextColor
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </section>
      )}

      {/* ── Hero Banner (Only for Elite/Banner models) ── */}
      {modelId === "elite" && store.bannerImage && mode === "catalog" && (
        <section className="relative w-full h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
          <img 
            src={store.bannerImage} 
            alt={store.bannerTitle || store.name}
            className="absolute inset-0 w-full h-full object-cover animate-in fade-in duration-1000"
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div className="relative z-10 text-center px-4 max-w-3xl animate-in zoom-in slide-in-from-bottom-8 duration-700">
            {store.bannerTitle && (
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase mb-4 drop-shadow-2xl">
                {store.bannerTitle}
              </h1>
            )}
            <div className="h-1 w-20 bg-white mx-auto mb-6" />
            <p className="text-white/90 text-sm md:text-lg font-medium tracking-widest uppercase drop-shadow-md">
              Explora nuestra colección exclusiva
            </p>
          </div>
        </section>
      )}

      {/* ── Filtros post-banner: solo modelos con hero ──────────── */}
      {BANNER_MODELS.has(modelId) && mode === "catalog" && (
        <div className="sticky top-[57px] z-20 bg-background/95 backdrop-blur-md border-b shadow-sm">
          <div className="mx-auto max-w-5xl px-4 py-3 space-y-2">
            {/* Search row + Filtros button */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="¿Qué estás buscando hoy?"
                  className="w-full rounded-full bg-secondary pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring transition"
                />
              </div>
              <button
                onClick={() => setIsFilterOpen(true)}
                className="relative shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-secondary hover:bg-accent text-sm font-semibold transition"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filtros</span>
                {(() => {
                  const cnt = (activeCat !== "all" ? 1 : 0) + (priceRange ? 1 : 0);
                  return cnt > 0 ? (
                    <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center">
                      {cnt}
                    </span>
                  ) : null;
                })()}
              </button>
            </div>
            {/* Active filter tags */}
            {(activeCat !== "all" || priceRange) && (
              <div className="flex flex-wrap gap-1.5">
                {activeCat !== "all" && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    {activeCat === "sale" ? (
                      <><Flame className="h-3 w-3 text-red-500" /> Ofertas</>
                    ) : (
                      store.categories.find(c => c.id === activeCat)?.name ?? activeCat
                    )}
                    <button onClick={() => setActiveCat("all")} className="ml-1 hover:opacity-60 transition">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {priceRange && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    Hasta S/ {priceRange[1]}
                    <button onClick={() => setPriceRange(null)} className="ml-1 hover:opacity-60 transition">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Product Area ──────────────────────────────── */}
      <main className="mx-auto max-w-5xl px-4 pt-6 pb-32">
        {mode === "bio" && (
          <h2 className="text-xs font-black uppercase tracking-wider text-center mb-6 text-muted-foreground flex items-center justify-center gap-2">
            <span className="h-px w-8 bg-muted-foreground/30"></span>
            <ShoppingBag className="h-3.5 w-3.5 opacity-60" />
            NUESTRA CARTA ONLINE
            <span className="h-px w-8 bg-muted-foreground/30"></span>
          </h2>
        )}
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground text-sm">No encontramos productos.</div>
        ) : mode === "bio" ? (
          /* ── BIO-LINK grid: Clean 2-column mobile style grid, max width 600px (max-w-md) for better mobile presentation on desktop as well! */
          <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto">
            {filtered.map((p) => (
              <article
                key={p.id}
                className={cn("overflow-hidden flex flex-col cursor-pointer transition-all duration-200 group border bg-card shadow-sm hover:shadow-md", cfg.cardShadow)}
                style={{ borderRadius: cfg.cardRounded || "0.75rem" }}
                onClick={() => setViewingProduct(p)}
              >
                {/* Imagen cuadrada */}
                <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: "1/1" }}>
                  <img
                    src={p.image || "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80"}
                    alt={p.name}
                    className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80";
                    }}
                  />
                  {p.isOnSale && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">OFERTA</span>
                  )}
                </div>
                {/* Info */}
                <div className="p-2.5 flex flex-col gap-1 flex-1">
                  <h3 className="text-xs font-semibold line-clamp-2 leading-snug flex-1">{p.name}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      <span className="text-sm font-black text-primary">{formatPrice(p.price)}</span>
                      {p.isOnSale && p.originalPrice && p.originalPrice > p.price && (
                        <span className="text-[10px] text-muted-foreground line-through ml-1">{formatPrice(p.originalPrice)}</span>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); cartAdd(store.id, p.id); }}
                      className="h-7 w-7 rounded-full flex items-center justify-center bg-primary text-white hover:opacity-90 transition shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : cfg.layout === "overlay" ? (
          /* ── OVERLAY layout: portrait 3:4 cards with gradient text (ZARA / Instagram Shopping style) */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {filtered.map((p) => (
              <article
                key={p.id}
                className="relative overflow-hidden cursor-pointer group"
                style={{ borderRadius: cfg.cardRounded, aspectRatio: "3/4" }}
                onClick={() => setViewingProduct(p)}
              >
                <img
                  src={p.image || "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80"} alt={p.name}
                  className="absolute inset-0 h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80";
                  }}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                {p.isOnSale && (
                  <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">OFERTA</span>
                )}
                {/* Text on image */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-xs font-semibold line-clamp-1 mb-1">{p.name}</p>
                  <div className="flex items-center justify-between gap-1">
                    <div>
                      <span className="text-white font-black text-sm">{formatPrice(p.price)}</span>
                      {p.isOnSale && p.originalPrice && p.originalPrice > p.price && (
                        <span className="text-white/50 text-[10px] line-through ml-1">{formatPrice(p.originalPrice)}</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={(e)=>{e.stopPropagation();consultProduct(p.name);}} className="h-7 w-7 rounded-full bg-white/20 backdrop-blur text-white flex items-center justify-center hover:bg-white/40 transition">
                        <MessageCircle className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={(e)=>{e.stopPropagation();cartAdd(store.id,p.id);}} className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : cfg.layout === "editorial" ? (
          /* ── EDITORIAL layout: horizontal list (Net-a-Porter / luxury fashion style) */
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {filtered.map((p) => (
              <article
                key={p.id}
                className={cn("flex gap-4 py-5 cursor-pointer group transition-all", cfg.cardShadow)}
                onClick={() => setViewingProduct(p)}
              >
                <div className="relative shrink-0 overflow-hidden bg-muted" style={{ width: "100px", height: "100px", borderRadius: cfg.imgRounded }}>
                  <img 
                    src={p.image || "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80"} 
                    alt={p.name} 
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80";
                    }}
                  />
                  {p.isOnSale && (
                    <span className="absolute top-1 left-1 bg-red-500 text-white text-[8px] font-bold px-1 py-0.5 rounded">SALE</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className={cn("font-semibold text-sm leading-snug", cfg.headerStyle === "minimal" ? "tracking-widest uppercase text-xs font-light" : "")}>{p.name}</h3>
                    {p.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-baseline gap-2">
                      <span className="font-black text-primary">{formatPrice(p.price)}</span>
                      {p.isOnSale && p.originalPrice && p.originalPrice > p.price && (
                        <span className="text-xs text-muted-foreground line-through">{formatPrice(p.originalPrice)}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={(e)=>{e.stopPropagation();consultProduct(p.name);}} className="text-xs border px-3 py-1.5 hover:bg-accent transition flex items-center gap-1" style={{ borderRadius: cfg.cardRounded }}>
                        <MessageCircle className="h-3 w-3" /> Consultar
                      </button>
                      <button onClick={(e)=>{e.stopPropagation();cartAdd(store.id,p.id);}} className="bg-primary text-primary-foreground px-3 py-1.5 flex items-center gap-1 text-xs font-bold hover:opacity-90 transition" style={{ borderRadius: cfg.cardRounded }}>
                        <Plus className="h-3 w-3" /> Añadir
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : cfg.layout === "hero" ? (
          /* ── HERO layout: first product is 2-col featured, rest are small grid */
          <div className="space-y-3">
            {filtered.length > 0 && (
              <article
                className={cn("relative overflow-hidden cursor-pointer group col-span-2", cfg.cardBorder ? "border" : "", cfg.cardShadow)}
                style={{ borderRadius: cfg.cardRounded, backgroundColor: "var(--card)", borderColor: "var(--border)", aspectRatio: "16/7" }}
                onClick={() => setViewingProduct(filtered[0])}
              >
                <img 
                  src={filtered[0].image || "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80"} 
                  alt={filtered[0].name} 
                  className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
                {filtered[0].isOnSale && <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">OFERTA</span>}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Destacado</p>
                  <h3 className="text-white font-black text-xl mb-2">{filtered[0].name}</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-white font-black text-2xl">{formatPrice(filtered[0].price)}</span>
                    <div className="flex gap-2">
                      <button onClick={(e)=>{e.stopPropagation();consultProduct(filtered[0].name);}} className="bg-white/20 backdrop-blur text-white text-xs px-3 py-2 font-bold hover:bg-white/30 transition flex items-center gap-1" style={{ borderRadius: cfg.cardRounded }}>
                        <MessageCircle className="h-3.5 w-3.5" /> Consultar
                      </button>
                      <button onClick={(e)=>{e.stopPropagation();cartAdd(store.id,filtered[0].id);}} className="bg-primary text-primary-foreground text-xs px-4 py-2 font-bold hover:opacity-90 transition flex items-center gap-1" style={{ borderRadius: cfg.cardRounded }}>
                        <Plus className="h-3.5 w-3.5" /> Añadir
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.slice(1).map((p) => (
                <article
                  key={p.id}
                  className={cn("overflow-hidden flex flex-col cursor-pointer transition-all group", cfg.cardBorder ? "border" : "", cfg.cardShadow)}
                  style={{ borderRadius: cfg.cardRounded, backgroundColor: "var(--card)", borderColor: "var(--border)" }}
                  onClick={() => setViewingProduct(p)}
                >
                  <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: "1/1" }}>
                    <img 
                      src={p.image || "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80"} 
                      alt={p.name} 
                      className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      loading="lazy" 
                      style={{ borderRadius: cfg.imgRounded }} 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80";
                      }}
                    />
                    {p.isOnSale && <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">OFERTA</span>}
                  </div>
                  <div className="p-2.5 flex flex-col flex-1 gap-1.5">
                    <h3 className="text-xs font-semibold line-clamp-2 flex-1">{p.name}</h3>
                    <span className="text-sm font-black text-primary">{formatPrice(p.price)}</span>
                    <div className="flex gap-1.5">
                      <button onClick={(e)=>{e.stopPropagation();consultProduct(p.name);}} className="flex-1 text-[10px] border py-1.5 hover:bg-accent transition flex items-center justify-center gap-0.5" style={{ borderRadius: cfg.cardRounded }}>
                        <MessageCircle className="h-3 w-3" /> Consultar
                      </button>
                      <button onClick={(e)=>{e.stopPropagation();cartAdd(store.id,p.id);}} className="bg-primary text-primary-foreground w-7 h-7 flex items-center justify-center hover:opacity-90 transition shrink-0" style={{ borderRadius: cfg.cardRounded }}>
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : cfg.layout === "magazine" ? (
          /* ── MAGAZINE layout: fashion editorial alternating full/half width rows */
          <div className="space-y-1">
            {filtered.map((p, i) => {
              const isFeature = i % 3 === 0; // every 3rd card is a full-width feature
              if (isFeature) {
                return (
                  <article
                    key={p.id}
                    className="relative overflow-hidden cursor-pointer group w-full"
                    style={{ aspectRatio: "21/9" }}
                    onClick={() => setViewingProduct(p)}
                  >
                    <img
                      src={p.image || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85"}
                      alt={p.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85"; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    {p.isOnSale && <span className="absolute top-4 left-4 text-[10px] font-bold tracking-[0.2em] uppercase border border-white/60 text-white px-3 py-1">SALE</span>}
                    <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
                      <div>
                        <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] mb-2">Editorial</p>
                        <h3 className="text-white font-light text-2xl tracking-widest uppercase mb-1">{p.name}</h3>
                        <span className="text-white font-black text-xl tracking-wider">{formatPrice(p.price)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); consultProduct(p.name); }} className="border border-white/40 text-white text-[10px] tracking-widest uppercase px-4 py-2 hover:bg-white/10 transition backdrop-blur-sm">CONSULTAR</button>
                        <button onClick={(e) => { e.stopPropagation(); cartAdd(store.id, p.id); }} className="bg-white text-black text-[10px] tracking-widest uppercase px-4 py-2 font-bold hover:bg-white/90 transition"><Plus className="h-3 w-3 inline" /></button>
                      </div>
                    </div>
                  </article>
                );
              }
              // Non-feature: rendered in pairs below
              return null;
            })}
            {/* Render non-feature items in 2-col rows */}
            {(() => {
              const nonFeatures = filtered.filter((_, i) => i % 3 !== 0);
              const pairs: typeof filtered[] = [];
              for (let i = 0; i < nonFeatures.length; i += 2) pairs.push(nonFeatures.slice(i, i + 2));
              return pairs.map((pair, pi) => (
                <div key={pi} className="grid grid-cols-2 gap-1">
                  {pair.map((p) => (
                    <article
                      key={p.id}
                      className="relative overflow-hidden cursor-pointer group"
                      style={{ aspectRatio: "3/4" }}
                      onClick={() => setViewingProduct(p)}
                    >
                      <img
                        src={p.image || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80"}
                        alt={p.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80"; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      {p.isOnSale && <span className="absolute top-3 left-3 text-[9px] font-bold tracking-widest uppercase border border-white/50 text-white px-2 py-0.5">SALE</span>}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-light text-sm tracking-widest uppercase line-clamp-1 mb-1">{p.name}</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold text-sm">{formatPrice(p.price)}</span>
                          <div className="flex gap-1">
                            <button onClick={(e) => { e.stopPropagation(); consultProduct(p.name); }} className="h-7 w-7 border border-white/40 text-white flex items-center justify-center hover:bg-white/10 transition backdrop-blur-sm"><MessageCircle className="h-3 w-3" /></button>
                            <button onClick={(e) => { e.stopPropagation(); cartAdd(store.id, p.id); }} className="h-7 w-7 bg-white text-black flex items-center justify-center hover:bg-white/90 transition"><Plus className="h-3 w-3" /></button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ));
            })()}
          </div>
        ) : cfg.layout === "tiles" ? (
          /* ── TILES layout: alternating wide (full) + square pair — inspired by Apple editorial */
          <div className="grid grid-cols-2 gap-2">
            {filtered.map((p, i) => {
              const isWide = i % 3 === 0;
              const fallback = "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=80";
              return (
                <article
                  key={p.id}
                  className={cn("relative overflow-hidden cursor-pointer group", isWide ? "col-span-2" : "", cfg.cardShadow)}
                  style={{
                    aspectRatio: isWide ? "16/7" : "1/1",
                    borderRadius: cfg.cardRounded,
                    backgroundColor: "var(--card)",
                  }}
                  onClick={() => setViewingProduct(p)}
                >
                  <img
                    src={p.image || fallback}
                    alt={p.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => { (e.target as HTMLImageElement).src = fallback; }}
                  />
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 ${isWide ? "bg-gradient-to-r from-black/70 via-black/30 to-transparent" : "bg-gradient-to-t from-black/75 via-black/10 to-transparent"}`} />
                  {p.isOnSale && <span className="absolute top-3 left-3 text-[10px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full">OFERTA</span>}
                  {isWide ? (
                    <div className="absolute bottom-0 left-0 p-5 right-0 flex items-end justify-between">
                      <div>
                        <h3 className={cn("text-white leading-tight mb-1", cfg.headerStyle === "minimal" ? "text-2xl font-light tracking-widest uppercase" : "text-2xl font-black")}>{p.name}</h3>
                        <span className="text-white/80 font-black text-xl">{formatPrice(p.price)}</span>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); consultProduct(p.name); }} className="h-10 px-4 text-xs font-bold border border-white/50 text-white backdrop-blur-sm hover:bg-white/10 transition" style={{ borderRadius: cfg.cardRounded }}>
                          <MessageCircle className="h-3.5 w-3.5 inline mr-1" />Consultar
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); cartAdd(store.id, p.id); }} className="h-10 px-4 text-xs font-bold text-black hover:opacity-90 transition" style={{ backgroundColor: "var(--primary)", borderRadius: cfg.cardRounded }}>
                          <Plus className="h-3.5 w-3.5 inline" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-white text-xs font-bold line-clamp-1 mb-0.5">{p.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-white font-black text-sm">{formatPrice(p.price)}</span>
                        <div className="flex gap-1">
                          <button onClick={(e) => { e.stopPropagation(); consultProduct(p.name); }} className="h-7 w-7 border border-white/40 text-white flex items-center justify-center hover:bg-white/10 transition backdrop-blur-sm" style={{ borderRadius: cfg.cardRounded }}><MessageCircle className="h-3 w-3" /></button>
                          <button onClick={(e) => { e.stopPropagation(); cartAdd(store.id, p.id); }} className="h-7 w-7 flex items-center justify-center hover:opacity-90 transition" style={{ backgroundColor: "var(--primary)", borderRadius: cfg.cardRounded }}><Plus className="h-3 w-3 text-white" /></button>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : cfg.layout === "spotlight" ? (
          /* ── SPOTLIGHT layout: 1 large featured + 2 stacked small — inspired by Farfetch / Mytheresa */
          <div className="space-y-3">
            {(() => {
              const fallback = "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=80";
              const groups: typeof filtered[] = [];
              for (let i = 0; i < filtered.length; i += 3) groups.push(filtered.slice(i, i + 3));
              return groups.map((group, gi) => (
                <div key={gi} className={cn("grid grid-cols-2 gap-2", gi % 2 !== 0 ? "[&>*:first-child]:order-last" : "")}>
                  {/* Large card */}
                  {group[0] && (
                    <article
                      className={cn("relative overflow-hidden cursor-pointer group", cfg.cardShadow)}
                      style={{ borderRadius: cfg.cardRounded, aspectRatio: "2/3" }}
                      onClick={() => setViewingProduct(group[0])}
                    >
                      <img src={group[0].image || fallback} alt={group[0].name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onError={(e) => { (e.target as HTMLImageElement).src = fallback; }} />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 30%, rgba(0,0,0,0.1) 70%)" }} />
                      {group[0].isOnSale && <span className="absolute top-3 left-3 text-[9px] font-black bg-red-500 text-white px-2 py-0.5" style={{ borderRadius: cfg.cardRounded }}>OFERTA</span>}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-white/50 text-[9px] uppercase tracking-[0.25em] mb-1">Destacado</p>
                        <h3 className={cn("text-white leading-tight mb-2 line-clamp-2", cfg.headerStyle === "minimal" ? "text-sm font-light tracking-widest uppercase" : "text-sm font-black")}>{group[0].name}</h3>
                        <div className="flex items-center justify-between">
                          <span className="font-black text-base" style={{ color: "var(--primary)" }}>{formatPrice(group[0].price)}</span>
                          <div className="flex gap-1">
                            <button onClick={(e) => { e.stopPropagation(); consultProduct(group[0].name); }} className="h-7 w-7 border border-white/30 text-white flex items-center justify-center hover:bg-white/10 backdrop-blur-sm" style={{ borderRadius: cfg.cardRounded }}><MessageCircle className="h-3 w-3" /></button>
                            <button onClick={(e) => { e.stopPropagation(); cartAdd(store.id, group[0].id); }} className="h-7 w-7 flex items-center justify-center hover:opacity-90" style={{ backgroundColor: "var(--primary)", borderRadius: cfg.cardRounded }}><Plus className="h-3 w-3 text-white" /></button>
                          </div>
                        </div>
                      </div>
                    </article>
                  )}
                  {/* 2 stacked small cards */}
                  <div className="flex flex-col gap-2">
                    {group.slice(1).map((p) => (
                      <article
                        key={p.id}
                        className={cn("relative overflow-hidden cursor-pointer group flex-1", cfg.cardShadow)}
                        style={{ borderRadius: cfg.cardRounded, minHeight: "100px" }}
                        onClick={() => setViewingProduct(p)}
                      >
                        <img src={p.image || fallback} alt={p.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-600" onError={(e) => { (e.target as HTMLImageElement).src = fallback; }} />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 40%, transparent)" }} />
                        {p.isOnSale && <span className="absolute top-2 left-2 text-[8px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full">SALE</span>}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <h3 className="text-white text-xs font-bold line-clamp-1 mb-1">{p.name}</h3>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black" style={{ color: "var(--primary)" }}>{formatPrice(p.price)}</span>
                            <button onClick={(e) => { e.stopPropagation(); cartAdd(store.id, p.id); }} className="h-6 w-6 flex items-center justify-center hover:opacity-90" style={{ backgroundColor: "var(--primary)", borderRadius: cfg.cardRounded }}><Plus className="h-3 w-3 text-white" /></button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        ) : cfg.layout === "diagonal" ? (
          /* ── DIAGONAL layout: slanted clip-path cuts — Nike / streetwear editorial */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
            {filtered.map((p, i) => {
              const fallback = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80";
              const slantRight = "polygon(0 0, 100% 0, 100% 88%, 0 100%)";
              const slantLeft  = "polygon(0 0, 100% 0, 100% 100%, 0 88%)";
              return (
                <article
                  key={p.id}
                  className="relative cursor-pointer group overflow-hidden"
                  style={{ backgroundColor: "var(--card)" }}
                  onClick={() => setViewingProduct(p)}
                >
                  {/* Slanted image */}
                  <div
                    className="relative overflow-hidden"
                    style={{
                      aspectRatio: "4/3",
                      clipPath: i % 2 === 0 ? slantRight : slantLeft,
                    }}
                  >
                    <img
                      src={p.image || fallback}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => { (e.target as HTMLImageElement).src = fallback; }}
                    />
                    {p.isOnSale && (
                      <span className="absolute top-4 left-4 text-[10px] font-black tracking-widest uppercase px-3 py-1" style={{ backgroundColor: "var(--primary)", color: "#000" }}>
                        OFERTA
                      </span>
                    )}
                  </div>
                  {/* Text — flows into the clipped gap */}
                  <div className="px-5 pt-0 pb-5 -mt-4 relative z-10">
                    {/* Category label */}
                    <p className="text-[9px] uppercase tracking-[0.3em] font-bold mb-1" style={{ color: "var(--primary)" }}>
                      {store.categories.find(c => c.id === p.categoryId)?.name}
                    </p>
                    <h3 className="font-black text-base uppercase tracking-widest line-clamp-1 mb-3" style={{ color: "var(--foreground)" }}>
                      {p.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-black text-xl" style={{ color: "var(--primary)" }}>{formatPrice(p.price)}</span>
                        {p.isOnSale && p.originalPrice && p.originalPrice > p.price && (
                          <span className="text-xs line-through ml-2 opacity-40">{formatPrice(p.originalPrice)}</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); consultProduct(p.name); }}
                          className="h-9 px-3 text-xs font-black uppercase tracking-widest border transition hover:opacity-70"
                          style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); cartAdd(store.id, p.id); }}
                          className="h-9 px-4 text-xs font-black uppercase tracking-widest transition hover:opacity-80"
                          style={{ backgroundColor: "var(--primary)", color: effectiveIsDark ? "#000" : "#fff" }}
                        >
                          <Plus className="h-3.5 w-3.5 inline" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : cfg.layout === "arch" ? (
          /* ── ARCH layout: arched portrait frames — luxury cosmetics / Byredo / AESOP style */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 px-2 pb-4">
            {filtered.map((p) => {
              const fallback = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80";
              return (
                <article
                  key={p.id}
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => setViewingProduct(p)}
                >
                  {/* Arched image frame */}
                  <div
                    className="relative overflow-hidden w-full group-hover:scale-[1.02] transition-transform duration-500"
                    style={{
                      aspectRatio: "3/4",
                      borderRadius: "999px 999px 1rem 1rem", // arch top
                      border: cfg.cardBorder ? `1px solid var(--border)` : "none",
                      backgroundColor: "var(--card)",
                    }}
                  >
                    <img
                      src={p.image || fallback}
                      alt={p.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      style={{ borderRadius: "999px 999px 0.75rem 0.75rem" }}
                      onError={(e) => { (e.target as HTMLImageElement).src = fallback; }}
                    />
                    {/* Subtle vignette */}
                    <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.2) 100%)" }} />
                    {p.isOnSale && (
                      <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-widest uppercase border text-white px-2 py-0.5 backdrop-blur-sm" style={{ borderColor: "white", borderRadius: "999px" }}>
                        SALE
                      </span>
                    )}
                  </div>

                  {/* Caption below arch */}
                  <div className="w-full text-center pt-3 px-1 space-y-1">
                    <h3
                      className="text-xs font-light uppercase tracking-[0.2em] line-clamp-2"
                      style={{ color: "var(--foreground)" }}
                    >
                      {p.name}
                    </h3>
                    <p className="text-xs font-black" style={{ color: "var(--primary)" }}>
                      {formatPrice(p.price)}
                    </p>
                    <div className="flex justify-center pt-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); consultProduct(p.name); }}
                        className="flex-1 py-1.5 text-[10px] uppercase tracking-widest border transition hover:opacity-70 font-medium"
                        style={{ borderColor: "var(--border)", color: "var(--foreground)", borderRadius: "999px" }}
                      >
                        Consultar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : cfg.layout === "banner_grid" ? (
          /* ── BANNER GRID layout: portada con imagen ajustable + grid 2 columnas estilo app */
          <div className="space-y-4">
            {/* Banner de portada */}
            {(store as any).bannerImage ? (
              <div className="relative w-full overflow-hidden" style={{ borderRadius: cfg.cardRounded, aspectRatio: "16/7" }}>
                <img
                  src={(store as any).bannerImage}
                  alt={store.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white font-black text-xl leading-tight drop-shadow-lg">
                    {(store as any).bannerTitle || `Catálogo ${store.name}`}
                  </p>
                  <p className="text-white/70 text-xs mt-0.5">Toca un producto para más info</p>
                </div>
              </div>
            ) : (
              /* Placeholder banner si no hay imagen */
              <div
                className="w-full flex flex-col items-center justify-center gap-2 py-8 px-4 text-center"
                style={{ borderRadius: cfg.cardRounded, background: `linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 60%, #fff) 100%)` }}
              >
                <p className="text-white font-black text-2xl leading-tight">{(store as any).bannerTitle || `Catálogo ${store.name}`}</p>
                <p className="text-white/80 text-sm">Bienvenido · Toca cualquier producto</p>
              </div>
            )}

            {/* Grid de productos 2 columnas estilo app */}
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((p) => (
                <article
                  key={p.id}
                  className={cn("overflow-hidden flex flex-col cursor-pointer transition-all duration-200 group", cfg.cardShadow)}
                  style={{ borderRadius: cfg.cardRounded, backgroundColor: "var(--card)" }}
                  onClick={() => setViewingProduct(p)}
                >
                  {/* Imagen cuadrada */}
                  <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: "1/1" }}>
                    <img
                      src={p.image || "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80"}
                      alt={p.name}
                      className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      style={{ borderRadius: `${cfg.imgRounded} ${cfg.imgRounded} 0 0` }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80";
                      }}
                    />
                    {p.isOnSale && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">OFERTA</span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-2.5 flex flex-col gap-1 flex-1">
                    <h3 className="text-xs font-semibold line-clamp-2 leading-snug flex-1">{p.name}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <div>
                        <span className="text-sm font-black text-primary">{formatPrice(p.price)}</span>
                        {p.isOnSale && p.originalPrice && p.originalPrice > p.price && (
                          <span className="text-[10px] text-muted-foreground line-through ml-1">{formatPrice(p.originalPrice)}</span>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); cartAdd(store.id, p.id); }}
                        className="h-7 w-7 rounded-full flex items-center justify-center bg-primary text-white hover:opacity-90 transition shrink-0"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          /* ── GRID layout: standard responsive grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((p) => (
              <article
                key={p.id}
                className={cn("overflow-hidden flex flex-col cursor-pointer transition-all duration-200 group", cfg.cardBorder ? "border" : "", cfg.cardShadow)}
                style={{ borderRadius: cfg.cardRounded, backgroundColor: "var(--card)", borderColor: cfg.cardBorder ? "var(--border)" : "transparent" }}
                onClick={() => setViewingProduct(p)}
              >
                <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: "4/3" }}>
                  <img 
                    src={p.image || "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80"} 
                    alt={p.name} 
                    className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    loading="lazy" 
                    style={{ borderRadius: cfg.imgRounded }} 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80";
                    }}
                  />
                  {p.isOnSale && <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow"><Flame className="h-2.5 w-2.5" /> Oferta</span>}
                </div>
                <div className="p-3 flex flex-col flex-1 gap-2">
                  <h3 className="text-sm font-semibold leading-snug line-clamp-2 flex-1">{p.name}</h3>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-black text-primary">{formatPrice(p.price)}</span>
                    {p.isOnSale && p.originalPrice && p.originalPrice > p.price && (
                      <span className="text-[11px] text-muted-foreground line-through">{formatPrice(p.originalPrice)}</span>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={(e)=>{e.stopPropagation();consultProduct(p.name);}} className="flex-1 inline-flex items-center justify-center gap-1 text-xs font-medium py-2 hover:bg-accent transition border border-border bg-background" style={{ borderRadius: cfg.cardRounded }}>
                      <MessageCircle className="h-3.5 w-3.5" /> Consultar
                    </button>
                    <button onClick={(e)=>{e.stopPropagation();cartAdd(store.id,p.id);}} className="inline-flex items-center justify-center bg-primary text-primary-foreground w-9 h-9 hover:bg-primary/90 transition shrink-0" style={{ borderRadius: cfg.cardRounded }} aria-label="Agregar al carrito">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {mode === "bio" && (
          <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Link
              to="/t/$slug"
              params={{ slug: store.slug }}
              className="w-full max-w-md mx-auto py-4 rounded-xl font-black uppercase text-xs tracking-wider bg-primary text-primary-foreground hover:opacity-95 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
            >
              Ver Catálogo Completo
            </Link>

            {/* Módulo de Ubicación Geográfica */}
            {store.locationLat && store.locationLng && (
              <div id="location-section" className="pt-8 border-t space-y-4 scroll-mt-6" style={{ borderColor: "var(--border)" }}>
                <h3 className="text-xs font-black uppercase tracking-widest text-center text-muted-foreground flex items-center justify-center gap-2">
                  <span className="h-px w-8 bg-muted-foreground/30"></span>
                  <MapPin className="h-3.5 w-3.5 opacity-60" />
                  Nuestra Ubicación
                  <span className="h-px w-8 bg-muted-foreground/30"></span>
                </h3>
                
                <div className="max-w-md mx-auto space-y-4">
                  <div 
                    className="rounded-2xl overflow-hidden border shadow-sm h-[200px] w-full relative group transition-all duration-300 hover:shadow-lg"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <iframe
                      title="Ubicación"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${store.locationLng-0.003}%2C${store.locationLat-0.0015}%2C${store.locationLng+0.003}%2C${store.locationLat+0.0015}&layer=mapnik&marker=${store.locationLat}%2C${store.locationLng}`}
                      className="w-full h-full border-none filter grayscale-[25%] contrast-[105%] brightness-[97%] transition-all"
                    />
                  </div>
                  
                  {store.locationAddress && (
                    <div className="space-y-2 text-center">
                      <a
                        href={`https://maps.google.com/?q=${store.locationLat},${store.locationLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex py-2.5 px-4 rounded-xl border items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all hover:scale-[1.01] hover:bg-muted/40 shadow-sm bg-card text-foreground"
                        style={{ borderColor: "var(--border)" }}
                      >
                        📍 Ver en Google Maps
                      </a>
                      <p className="text-[11px] text-muted-foreground font-semibold px-4 leading-relaxed">
                        {store.locationAddress}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Footer libro de reclamaciones ────────────── */}
      {store.libroReclamacionesActivo && (
        <div className="py-6 text-center border-t" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => setLibroOpen(true)}
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
            style={{ color: "var(--muted-foreground)" }}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Libro de Reclamaciones
          </button>
        </div>
      )}

      {/* ── Modal Libro de Reclamaciones ─────────────── */}
      {libroOpen && (
        <LibroReclamacionesModal
          store={store}
          onClose={() => setLibroOpen(false)}
          themeVars={themeVars}
          cfg={cfg}
        />
      )}

      {/* ── FAB ──────────────────────────────────────── */}
      <button
        onClick={() => (cartCount > 0 ? setCartOpen(true) : supportClick())}
        className="fixed bottom-8 right-4 z-40 h-14 w-14 bg-primary text-primary-foreground shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition"
        style={{
          borderRadius: cfg.imgRounded === "9999px" ? "9999px" : "1rem",
          backgroundColor: "var(--primary)",
          color: effectiveIsDark ? "#000" : "#fff",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)"
        }}
        aria-label={cartCount > 0 ? "Ver carrito" : "Soporte WhatsApp"}
      >
        {cartCount > 0 ? (
          <>
            <ShoppingBag className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center border-2" style={{ borderColor: "var(--primary)" }}>
              {cartCount}
            </span>
          </>
        ) : (
          <ShoppingBag className="h-6 w-6 opacity-70" />
        )}
      </button>

      {/* ── Cart Sheet ───────────────────────────────── */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent
          side="bottom"
          className="h-[80vh] rounded-t-3xl p-0 flex flex-col border-0"
          style={{ backgroundColor: "var(--background)", color: "var(--foreground)", ...themeVars } as React.CSSProperties}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-5 pt-5 pb-3 shrink-0"
            style={{ borderBottom: `1px solid var(--border)` }}
          >
            <ShoppingBag className="h-5 w-5 shrink-0" style={{ color: "var(--primary)" }} />
            <span
              className={cn(
                "flex-1 font-bold",
                cfg.headerStyle === "minimal" ? "text-sm uppercase tracking-[0.2em]" : "text-base"
              )}
              style={{ color: "var(--foreground)" }}
            >
              Tu pedido
            </span>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {cartLines.length === 0 && (
              <div
                className="py-16 text-center text-sm"
                style={{ color: "var(--muted-foreground)" }}
              >
                Tu carrito está vacío.
              </div>
            )}
            {cartLines.map((l) => (
              <div
                key={l.productId}
                className="flex items-center gap-3 p-2"
                style={{
                  backgroundColor: "var(--card)",
                  border: `1px solid var(--border)`,
                  borderRadius: cfg.cardRounded,
                }}
              >
                <img
                  src={l.product.image}
                  alt={l.product.name}
                  className="h-12 w-12 object-cover shrink-0"
                  style={{ borderRadius: cfg.imgRounded === "9999px" ? "9999px" : "0.5rem" }}
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=200&q=70"; }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={cn("text-sm font-bold truncate", cfg.headerStyle === "minimal" ? "tracking-wide uppercase text-xs" : "")}
                    style={{ color: "var(--foreground)" }}
                  >
                    {l.product.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--primary)" }}>
                    {formatPrice(l.product.price)}
                  </p>
                </div>
                {/* Qty controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => cartSet(store.id, l.productId, l.qty - 1)}
                    className="h-7 w-7 flex items-center justify-center transition hover:opacity-70"
                    style={{ border: `1px solid var(--border)`, color: "var(--foreground)", borderRadius: cfg.cardRounded }}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-black" style={{ color: "var(--foreground)" }}>
                    {l.qty}
                  </span>
                  <button
                    onClick={() => cartSet(store.id, l.productId, l.qty + 1)}
                    className="h-7 w-7 flex items-center justify-center transition hover:opacity-70"
                    style={{ border: `1px solid var(--border)`, color: "var(--foreground)", borderRadius: cfg.cardRounded }}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <button
                  onClick={() => cartRemove(store.id, l.productId)}
                  className="h-7 w-7 flex items-center justify-center transition hover:opacity-60"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            className="shrink-0 px-5 py-4 space-y-3"
            style={{ borderTop: `1px solid var(--border)`, backgroundColor: "var(--card)" }}
          >
            <div className="flex items-center justify-between">
              <span
                className={cn("text-sm", cfg.headerStyle === "minimal" ? "uppercase tracking-widest text-xs" : "")}
                style={{ color: "var(--muted-foreground)" }}
              >
                Total
              </span>
              <span className="text-xl font-black" style={{ color: "var(--primary)" }}>
                {formatPrice(total)}
              </span>
            </div>
            <button
              className="w-full h-12 font-bold transition hover:opacity-90 flex items-center justify-center gap-2 text-sm"
              style={{
                backgroundColor: "var(--primary)",
                color: effectiveIsDark ? "#000" : "#fff",
                borderRadius: cfg.cardRounded,
                ...(cfg.headerStyle === "minimal" ? { letterSpacing: "0.15em", textTransform: "uppercase" as const, fontSize: "11px" } : {}),
              }}
              onClick={sendOrder}
              disabled={cartLines.length === 0}
            >
              <MessageCircle className="h-4 w-4" />
              Enviar pedido por WhatsApp
            </button>
            {cartLines.length > 0 && (
              <button
                onClick={() => cartClear(store.id)}
                className="w-full text-xs flex items-center justify-center gap-1 transition hover:opacity-60"
                style={{ color: "var(--muted-foreground)" }}
              >
                <Trash2 className="h-3 w-3" /> Vaciar carrito
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>


      {/* ── Filter Drawer ─────────────────────────────── */}
      <Drawer open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DrawerContent
          className="max-h-[90vh] focus:outline-none"
          style={{ backgroundColor: "var(--background)", color: "var(--foreground)", ...themeVars } as React.CSSProperties}
        >
          <DrawerHeader className="text-left border-b pb-4" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-base font-black uppercase tracking-wide" style={{ color: "var(--foreground)" }}>
                Filtros
              </DrawerTitle>
              <DrawerClose asChild>
                <button
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted transition"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <X className="h-4 w-4" />
                </button>
              </DrawerClose>
            </div>
            <DrawerDescription className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
              Filtra los productos por categoría{hasPriceFilter ? " y precio" : ""}
            </DrawerDescription>
          </DrawerHeader>

          <div className="overflow-y-auto flex-1 px-4 py-5 space-y-6">
            {/* ── Categorías ── */}
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
                Categorías
              </p>
              <div className="grid grid-cols-2 gap-2">
                {/* Todos */}
                <button
                  onClick={() => setActiveCat("all")}
                  className="flex items-center justify-center gap-2 px-3 py-3 text-sm font-semibold border transition"
                  style={{
                    borderRadius: cfg.cardRounded,
                    backgroundColor: activeCat === "all" ? "var(--primary)" : "var(--secondary)",
                    color: activeCat === "all" ? (effectiveIsDark ? "#000" : "#fff") : "var(--foreground)",
                    borderColor: activeCat === "all" ? "var(--primary)" : "var(--border)",
                  }}
                >
                  Todos
                </button>

                {/* Ofertas */}
                <button
                  onClick={() => setActiveCat("sale")}
                  className="flex items-center justify-center gap-2 px-3 py-3 text-sm font-semibold border transition"
                  style={{
                    borderRadius: cfg.cardRounded,
                    backgroundColor: activeCat === "sale" ? "var(--primary)" : "var(--secondary)",
                    color: activeCat === "sale" ? (effectiveIsDark ? "#000" : "#fff") : "var(--foreground)",
                    borderColor: activeCat === "sale" ? "var(--primary)" : "var(--border)",
                  }}
                >
                  <Flame className="h-3.5 w-3.5 text-red-500" />
                  Ofertas
                </button>

                {/* Cada categoría */}
                {(store.categories || []).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCat(c.id)}
                    className="flex items-center justify-center gap-2 px-3 py-3 text-sm font-semibold border transition"
                    style={{
                      borderRadius: cfg.cardRounded,
                      backgroundColor: activeCat === c.id ? "var(--primary)" : "var(--secondary)",
                      color: activeCat === c.id ? (effectiveIsDark ? "#000" : "#fff") : "var(--foreground)",
                      borderColor: activeCat === c.id ? "var(--primary)" : "var(--border)",
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Precio ── */}
            {hasPriceFilter && (
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
                  Precio
                </p>
                <PriceRangeSlider
                  min={priceMin}
                  max={priceMax}
                  value={priceRange ?? [priceMin, priceMax]}
                  onChange={setPriceRange}
                  onReset={() => setPriceRange(null)}
                  isDark={effectiveIsDark}
                />
              </div>
            )}
          </div>

          {/* ── Footer actions ── */}
          <div
            className="px-4 pt-3 pb-6 space-y-2 border-t shrink-0"
            style={{ borderColor: "var(--border)" }}
          >
            {/* Restablecer */}
            {(activeCat !== "all" || priceRange) && (
              <button
                onClick={() => { setActiveCat("all"); setPriceRange(null); }}
                className="w-full h-10 text-sm font-semibold border rounded-full transition hover:bg-muted"
                style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
              >
                Restablecer filtros
              </button>
            )}
            {/* Aplicar */}
            <DrawerClose asChild>
              <button
                className="w-full h-12 font-bold text-sm transition hover:opacity-90 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "var(--primary)",
                  color: effectiveIsDark ? "#000" : "#fff",
                  borderRadius: cfg.cardRounded,
                  ...(cfg.headerStyle === "minimal" ? { letterSpacing: "0.15em", textTransform: "uppercase" as const, fontSize: "11px" } : {}),
                }}
              >
                Ver {rawFiltered.length} {rawFiltered.length === 1 ? "producto" : "productos"}
              </button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>

      {/* ── Product Detail Sheet ─────────────────────── */}
      <Sheet open={!!viewingProduct} onOpenChange={(v) => { if (!v) setViewingProduct(null); }}>
        <SheetContent
          side="bottom"
          className="h-[92vh] rounded-t-3xl p-0 overflow-hidden flex flex-col border-0"
          style={{ backgroundColor: "var(--background)", color: "var(--foreground)", ...themeVars } as React.CSSProperties}
        >
          {viewingProduct && (
            <>
              {/* Image — taller for overlay/magazine, shorter for editorial */}
              <div
                className="relative shrink-0 bg-muted overflow-hidden"
                style={{
                  height: cfg.layout === "editorial" ? "200px" : cfg.layout === "overlay" || cfg.layout === "magazine" ? "320px" : "260px",
                }}
              >
                {/* Close button (aspita) */}
                <button 
                  onClick={() => setViewingProduct(null)}
                  className="absolute top-4 right-4 z-50 h-10 w-10 flex items-center justify-center bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-all"
                  style={{ borderRadius: cfg.cardRounded }}
                >
                  <X className="h-6 w-6" />
                </button>

                <img
                  src={productImages[viewingProduct.id] || viewingProduct.image || "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=85"}
                  alt={viewingProduct.name}
                  className="h-full w-full object-cover"
                  style={{
                    filter: effectiveIsDark && (cfg.layout === "overlay" || cfg.layout === "magazine") ? "brightness(0.85)" : "none",
                  }}
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=85"; }}
                />

                {/* Dark overlay for dark themes */}
                {effectiveIsDark && <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />}

                {/* Sale badge — style adapts to model */}
                {viewingProduct.isOnSale && (
                  cfg.layout === "magazine" ? (
                    <span className="absolute top-4 left-4 text-[10px] font-bold tracking-[0.2em] uppercase border border-white/60 text-white px-3 py-1 backdrop-blur">OFERTA</span>
                  ) : cfg.layout === "overlay" ? (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">OFERTA</span>
                  ) : (
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                      <Flame className="h-3 w-3" /> Oferta
                    </span>
                  )
                )}

                {/* For dark/magazine: show price on image */}
                {(cfg.layout === "magazine" || (effectiveIsDark && cfg.layout === "overlay")) && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
                    <p className={cn("text-white font-black text-2xl", cfg.headerStyle === "minimal" ? "font-light tracking-widest uppercase" : "")}>
                      {formatPrice(viewingProduct.price)}
                      {viewingProduct.isOnSale && viewingProduct.originalPrice && viewingProduct.originalPrice > viewingProduct.price && (
                        <span className="text-white/40 text-sm line-through ml-3 font-normal">{formatPrice(viewingProduct.originalPrice)}</span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Content */}
              <div
                className="flex-1 overflow-y-auto px-5 py-5 space-y-4"
                style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
              >
                {/* Title — adapts typography to model */}
                <h2
                  className={cn(
                    "leading-tight",
                    cfg.headerStyle === "bold" ? "text-2xl font-black" :
                    cfg.headerStyle === "minimal" ? "text-lg font-light tracking-[0.2em] uppercase" :
                    "text-xl font-bold"
                  )}
                  style={{ color: "var(--foreground)" }}
                >
                  {viewingProduct.name}
                </h2>

                {/* Price — only show below image for non-dark overlay models */}
                {!(cfg.layout === "magazine" || (effectiveIsDark && cfg.layout === "overlay")) && (
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-black" style={{ color: "var(--primary)" }}>
                      {formatPrice(viewingProduct.price)}
                    </span>
                    {viewingProduct.isOnSale && viewingProduct.originalPrice && viewingProduct.originalPrice > viewingProduct.price && (
                      <span className="text-sm line-through" style={{ color: "var(--muted-foreground)" }}>
                        {formatPrice(viewingProduct.originalPrice)}
                      </span>
                    )}
                  </div>
                )}

                {/* Description */}
                {viewingProduct.description && (
                  <div>
                    <p
                      className={cn(
                        "text-xs font-bold mb-1",
                        cfg.headerStyle === "minimal" ? "tracking-[0.3em] uppercase" : "tracking-widest uppercase"
                      )}
                      style={{ color: "var(--primary)" }}
                    >
                      Descripción
                    </p>
                    <p
                      className="text-sm leading-relaxed whitespace-pre-line"
                      style={{ color: "var(--foreground)", opacity: effectiveIsDark ? 0.85 : 0.75 }}
                    >
                      {viewingProduct.description}
                    </p>
                  </div>
                )}

                {/* Category */}
                <div>
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-1"
                    style={{ color: "var(--primary)" }}
                  >
                    Categoría
                  </p>
                  <span
                    className="inline-block px-3 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: "var(--primary)" + "25",
                      color: "var(--primary)",
                      borderRadius: cfg.cardRounded,
                      border: `1px solid var(--primary)`,
                      borderColor: "var(--primary)" + "50",
                    }}
                  >
                    {store.categories.find((c) => c.id === viewingProduct.categoryId)?.name}
                  </span>
                </div>
              </div>

              {/* Action footer — also themed */}
              <div
                className="border-t px-5 py-4 flex gap-3 shrink-0"
                style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
              >
                <button
                  className="flex-1 h-12 gap-2 font-semibold text-sm flex items-center justify-center border transition hover:opacity-80"
                  style={{
                    borderRadius: cfg.cardRounded,
                    borderColor: "var(--primary)",
                    color: "var(--primary)",
                    backgroundColor: "transparent",
                    ...(cfg.headerStyle === "minimal" ? { letterSpacing: "0.15em", textTransform: "uppercase", fontSize: "11px" } : {}),
                  }}
                  onClick={() => { consultProduct(viewingProduct.name); setViewingProduct(null); }}
                >
                  <MessageCircle className="h-4 w-4" />
                  Consultar
                </button>
                <button
                  className="flex-1 h-12 gap-2 font-bold text-sm flex items-center justify-center transition hover:opacity-90 shadow-lg"
                  style={{
                    borderRadius: cfg.cardRounded,
                    backgroundColor: "var(--primary)",
                    color: effectiveIsDark ? "#000" : "#fff",
                                        ...(cfg.headerStyle === "minimal" ? { letterSpacing: "0.15em", textTransform: "uppercase" as const, fontSize: "11px" } : {}),
                  }}
                  onClick={() => { cartAdd(store.id, viewingProduct.id); setViewingProduct(null); setCartOpen(true); }}
                >
                  <Plus className="h-4 w-4" />
                  Añadir al carrito
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Floating Badge for Plan Semilla stores on BioLink */}
      {mode === "bio" && store.plan === "semilla" && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <a
            href="https://dizi.idenza.site"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur border border-zinc-200 dark:border-zinc-800 shadow-md text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
          >
            <span>Crea tu catálogo gratis con</span>
            <span className="text-primary font-black tracking-tight">Dizi</span>
          </a>
        </div>
      )}

    </div>
  );
}

/* ── LibroReclamacionesModal ─────────────────────────────────────────────
   Conforme a:
   · Ley N° 29571 — Código de Protección y Defensa del Consumidor
   · DS N° 011-2011-PCM y DS N° 006-2014-PCM (Reglamento LR)
   · DS N° 101-2022-PCM (Anexo I actualizado, plazo 15 días hábiles)
   · Ley N° 31435 y Ley N° 32495 (plataformas digitales, nov. 2025)
   · Resolución SPC-INDECOPI N° 0272-2024
──────────────────────────────────────────────────────────────────────── */
interface TicketData {
  id: string;
  numeroCorrelativo: number;
  fecha: string;
  // Sección A
  empresaNombre: string;
  empresaRuc: string;
  empresaDireccion: string;
  empresaUrl: string;
  // Sección B
  consumidorNombre: string;
  consumidorTipoDoc: string;
  consumidorNumDoc: string;
  consumidorDomicilio: string;
  consumidorTelefono: string;
  consumidorEmail: string;
  esMenorEdad: boolean;
  tutorNombre: string;
  tutorNumDoc: string;
  // Sección C
  bienDescripcion: string;
  bienMonto: string;
  // Sección D
  tipo: "queja" | "reclamo";
  descripcion: string;
  pedidoConsumidor: string;
}

/* Helper: campo de input con label */
function LRField({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[11px] text-red-500 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  borderRadius: "0.625rem",
  padding: "0.6rem 0.75rem",
  fontSize: "0.875rem",
  outline: "none",
  border: "1px solid var(--border)",
  backgroundColor: "var(--card)",
  color: "var(--foreground)",
};

function LRInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={INPUT_STYLE} />;
}
function LRTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ ...INPUT_STYLE, resize: "vertical", minHeight: "80px" }} />;
}

function LibroReclamacionesModal({
  store,
  onClose,
  themeVars,
  cfg,
}: {
  store: Store;
  onClose: () => void;
  themeVars: React.CSSProperties;
  cfg: ModelConfig;
}) {
  // Sección B
  const [nombre,       setNombre]       = useState("");
  const [tipoDoc,      setTipoDoc]      = useState<"DNI"|"CE"|"Pasaporte"|"RUC">("DNI");
  const [numDoc,       setNumDoc]       = useState("");
  const [domicilio,    setDomicilio]    = useState("");
  const [telefono,     setTelefono]     = useState("");
  const [email,        setEmail]        = useState("");
  const [esMenor,      setEsMenor]      = useState(false);
  const [tutorNombre,  setTutorNombre]  = useState("");
  const [tutorDoc,     setTutorDoc]     = useState("");
  // Sección C
  const [bienDesc,     setBienDesc]     = useState("");
  const [bienMonto,    setBienMonto]    = useState("");
  // Sección D
  const [tipo,         setTipo]         = useState<"queja"|"reclamo">("reclamo");
  const [descripcion,  setDescripcion]  = useState("");
  const [pedido,       setPedido]       = useState("");
  // Control
  const [step,         setStep]         = useState<1|2|3>(1);
  const [sending,      setSending]      = useState(false);
  const [ticket,       setTicket]       = useState<TicketData | null>(null);
  const [errorMsg,     setErrorMsg]     = useState("");

  const año = new Date().getFullYear();
  const numFormatted = ticket
    ? `N° ${String(ticket.numeroCorrelativo).padStart(4,"0")}-${año}`
    : "";

  // ── Validaciones de seguridad ────────────────────────────────
  const val = {
    // Nombre: mínimo 2 palabras, solo letras/espacios/tildes, sin repetición absurda
    nombre: (v: string) => {
      const t = v.trim();
      if (t.length < 5) return "Ingresa tu nombre completo";
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(t)) return "Solo letras, sin números ni símbolos";
      if (t.split(/\s+/).filter(Boolean).length < 2) return "Escribe nombre y apellido";
      if (/(.)\1{3,}/.test(t.replace(/\s/g,""))) return "Nombre no válido";
      return "";
    },
    // Documento según tipo
    numDoc: (v: string, tipo: string) => {
      const t = v.trim();
      if (!t) return "Campo requerido";
      if (tipo === "DNI") {
        if (!/^\d{8}$/.test(t)) return "El DNI debe tener exactamente 8 dígitos";
        if (/^(\d)\1{7}$/.test(t)) return "DNI no válido";
      }
      if (tipo === "CE") {
        if (!/^\d{9,12}$/.test(t)) return "El CE debe tener 9 a 12 dígitos";
      }
      if (tipo === "RUC") {
        if (!/^\d{11}$/.test(t)) return "El RUC debe tener exactamente 11 dígitos";
        if (!/^(10|15|16|17|20)/.test(t)) return "RUC no válido (debe iniciar con 10, 15, 16, 17 o 20)";
      }
      if (tipo === "Pasaporte") {
        if (!/^[a-zA-Z0-9]{6,12}$/.test(t)) return "Pasaporte: 6 a 12 caracteres alfanuméricos";
      }
      return "";
    },
    // Teléfono peruano opcional (9 dígitos si se llena)
    telefono: (v: string) => {
      const t = v.trim();
      if (!t) return "";
      if (!/^\d{7,12}$/.test(t)) return "Teléfono: 7 a 12 dígitos";
      if (/^(\d)\1{6,}$/.test(t)) return "Teléfono no válido";
      return "";
    },
    // Email básico si se llena
    email: (v: string) => {
      const t = v.trim();
      if (!t) return "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t)) return "Correo electrónico no válido";
      return "";
    },
    // Texto libre: mínimo chars, sin spam de caracteres
    texto: (v: string, min = 20, label = "campo") => {
      const t = v.trim();
      if (t.length < min) return `Mínimo ${min} caracteres para ${label}`;
      if (/(.)\1{4,}/.test(t)) return "Texto no válido (caracteres repetidos)";
      // Detectar palabras repetidas más de 3 veces seguidas
      if (/(\b\w+\b)(\s+\1){3,}/i.test(t)) return "Por favor describe con más detalle";
      return "";
    },
  };

  const errNombre   = val.nombre(nombre);
  const errNumDoc   = val.numDoc(numDoc, tipoDoc);
  const errTelefono = val.telefono(telefono);
  const errEmail    = val.email(email);
  const errTutorNombre = esMenor ? val.nombre(tutorNombre) : "";
  const errTutorDoc    = esMenor ? val.numDoc(tutorDoc, "DNI") : "";
  const errDescripcion = val.texto(descripcion, 20, "la descripción");
  const errPedido      = val.texto(pedido, 10, "el pedido");

  const canStep1 = !errNombre && !errNumDoc && !errTelefono && !errEmail &&
    nombre.trim() && numDoc.trim() &&
    (!esMenor || (!errTutorNombre && !errTutorDoc && tutorNombre.trim() && tutorDoc.trim()));
  const canStep2 = !errDescripcion && !errPedido && descripcion.trim() && pedido.trim();

  const handleSubmit = async () => {
    if (!canStep2) return;
    setErrorMsg("");
    setSending(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data, error: rpcError } = await supabase.rpc("insert_reclamacion", {
        p_tenant_id:            store.id,
        p_consumidor_nombre:    nombre.trim(),
        p_consumidor_tipo_doc:  tipoDoc,
        p_consumidor_num_doc:   numDoc.trim(),
        p_consumidor_domicilio: domicilio.trim() || null,
        p_consumidor_telefono:  telefono.trim() || null,
        p_consumidor_email:     email.trim() || null,
        p_es_menor_edad:        esMenor,
        p_tutor_nombre:         tutorNombre.trim() || null,
        p_tutor_num_doc:        tutorDoc.trim() || null,
        p_bien_descripcion:     bienDesc.trim() || null,
        p_bien_monto:           bienMonto ? parseFloat(bienMonto) : null,
        p_tipo:                 tipo,
        p_descripcion:          descripcion.trim(),
        p_pedido_consumidor:    pedido.trim(),
      });
      if (rpcError) throw rpcError;
      const row = Array.isArray(data) ? data[0] : data;
      setTicket({
        id:                   row.id,
        numeroCorrelativo:    row.numero_correlativo,
        fecha:                row.fecha,
        empresaNombre:        row.empresa_nombre ?? store.name,
        empresaRuc:           row.empresa_ruc ?? "",
        empresaDireccion:     row.empresa_direccion ?? "",
        empresaUrl:           row.empresa_url ?? "",
        consumidorNombre:     nombre.trim(),
        consumidorTipoDoc:    tipoDoc,
        consumidorNumDoc:     numDoc.trim(),
        consumidorDomicilio:  domicilio.trim(),
        consumidorTelefono:   telefono.trim(),
        consumidorEmail:      email.trim(),
        esMenorEdad:          esMenor,
        tutorNombre:          tutorNombre.trim(),
        tutorNumDoc:          tutorDoc.trim(),
        bienDescripcion:      bienDesc.trim(),
        bienMonto:            bienMonto,
        tipo,
        descripcion:          descripcion.trim(),
        pedidoConsumidor:     pedido.trim(),
      });
    } catch (err) {
      console.error("[LibroReclamaciones]", err);
      setErrorMsg("Error al registrar. Por favor intenta nuevamente o recarga la página.");
    } finally {
      setSending(false);
    }
  };

  const handlePrint = async () => {
    if (!ticket) return;
    const num = `N° ${String(ticket.numeroCorrelativo).padStart(4,"0")}-${new Date().getFullYear()}`;
    const fecha = new Date(ticket.fecha).toLocaleString("es-PE", { dateStyle:"long", timeStyle:"short" });

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const W = 210;
    const margin = 14;
    const contentW = W - margin * 2;
    let y = 0;

    // ── Cabecera azul ──────────────────────────────────────────
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, W, 42, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text(`HOJA DE RECLAMACIÓN · ${ticket.tipo === "reclamo" ? "RECLAMO" : "QUEJA"}`, W / 2, 10, { align: "center" });

    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.text(num, W / 2, 24, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(fecha, W / 2, 34, { align: "center" });

    y = 52;

    // Helper: sección con título gris y línea
    const section = (title: string) => {
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text(title, margin, y);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y + 1.5, margin + contentW, y + 1.5);
      y += 6;
    };

    // Helper: línea de texto normal
    const line = (text: string, bold = false, indent = 0) => {
      doc.setFontSize(9);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setTextColor(30, 41, 59);
      const lines = doc.splitTextToSize(text, contentW - indent);
      doc.text(lines, margin + indent, y);
      y += lines.length * 5;
    };

    // Helper: separador fino
    const hr = () => {
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, margin + contentW, y);
      y += 5;
    };

    // ── Sección A ──────────────────────────────────────────────
    section("A. DATOS DEL PROVEEDOR");
    line(ticket.empresaNombre, true);
    if (ticket.empresaRuc)      line(`RUC: ${ticket.empresaRuc}`);
    if (ticket.empresaDireccion) line(ticket.empresaDireccion);
    if (ticket.empresaUrl)      line(ticket.empresaUrl);
    y += 3;
    hr();

    // ── Sección B ──────────────────────────────────────────────
    section("B. DATOS DEL CONSUMIDOR");
    line(ticket.consumidorNombre, true);
    line(`${ticket.consumidorTipoDoc}: ${ticket.consumidorNumDoc}`);
    if (ticket.consumidorDomicilio) line(ticket.consumidorDomicilio);
    if (ticket.consumidorTelefono)  line(`Tel: ${ticket.consumidorTelefono}`);
    if (ticket.consumidorEmail)     line(`Email: ${ticket.consumidorEmail}`);
    if (ticket.esMenorEdad) {
      line(`Tutor: ${ticket.tutorNombre}  —  Doc: ${ticket.tutorNumDoc}`);
    }
    y += 3;
    hr();

    // ── Sección C ──────────────────────────────────────────────
    if (ticket.bienDescripcion || ticket.bienMonto) {
      section("C. BIEN O SERVICIO");
      if (ticket.bienDescripcion) line(ticket.bienDescripcion);
      if (ticket.bienMonto)       line(`Monto: S/ ${parseFloat(ticket.bienMonto).toFixed(2)}`, true);
      y += 3;
      hr();
    }

    // ── Sección D ──────────────────────────────────────────────
    section(`D. DETALLE — ${ticket.tipo.toUpperCase()}`);
    line(ticket.descripcion);
    if (ticket.pedidoConsumidor) {
      y += 2;
      line("Pedido del consumidor:", true);
      line(ticket.pedidoConsumidor, false, 3);
    }
    y += 5;

    // ── Caja legal ─────────────────────────────────────────────
    const legalLines = [
      `Plazo de respuesta: El proveedor tiene un plazo máximo de 15 días hábiles improrrogables para dar respuesta a su ${ticket.tipo}, conforme a la Ley N° 31435 y el DS N° 101-2022-PCM.`,
      `Código único: ${num}. Este documento es constancia oficial al amparo de la Ley N° 29571 — Código de Protección y Defensa del Consumidor.`,
      `Si el proveedor no responde en el plazo legal, puede presentar denuncia ante INDECOPI (consumidor.gob.pe) citando el número de hoja.`,
      `Conserve este documento. El proveedor debe conservarlo por un mínimo de 2 años (Art. 9° DS N° 011-2011-PCM).`,
    ];

    // Calcular altura del bloque legal
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    let legalH = 8;
    legalLines.forEach(l => {
      legalH += doc.splitTextToSize(l, contentW - 8).length * 4.5;
    });

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentW, legalH, 3, 3, "FD");
    y += 5;

    legalLines.forEach(l => {
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      const wrapped = doc.splitTextToSize(l, contentW - 8);
      doc.text(wrapped, margin + 4, y);
      y += wrapped.length * 4.5 + 2;
    });

    // ── Guardar ────────────────────────────────────────────────
    doc.save(`Reclamacion_${num.replace(/[°\s\/]/g, "_")}.pdf`);
  };

  const sBase: React.CSSProperties = {
    ...themeVars,
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
  } as React.CSSProperties;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ backgroundColor:"rgba(0,0,0,0.65)", backdropFilter:"blur(4px)" }}
      >
        <div
          className="w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col"
          style={{ ...sBase, maxHeight:"95vh" }}
        >
          {/* ── HEADER ── */}
          <div
            className="flex items-center justify-between px-5 py-4 shrink-0"
            style={{ borderBottom:"1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2.5">
              <ClipboardList className="h-5 w-5" style={{ color:"var(--primary)" }} />
              <div>
                <p className="font-black text-sm leading-none">Libro de Reclamaciones</p>
                <p className="text-[10px] mt-0.5" style={{ color:"var(--muted-foreground)" }}>
                  Ley N° 29571 · DS N° 101-2022-PCM
                </p>
              </div>
            </div>
            {!ticket && (
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full flex items-center justify-center transition hover:opacity-60"
                style={{ color:"var(--muted-foreground)" }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* ── BODY ── */}
          <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">

            {/* ════════ TICKET FINAL ════════ */}
            {ticket && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500" />
                  <p className="font-black text-lg">Registrado correctamente</p>
                  <p className="text-xs" style={{ color:"var(--muted-foreground)" }}>
                    Guarda o imprime esta constancia — es tu comprobante legal.
                  </p>
                </div>

                {/* Ticket imprimible */}
                <div
                  id="lr-ticket"
                  className="rounded-2xl border-2 overflow-hidden"
                  style={{ borderColor:"var(--border)" }}
                >
                  {/* Cabecera del ticket */}
                  <div className="p-4 text-center text-white" style={{ backgroundColor:"var(--primary)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                      Hoja de Reclamación · {ticket.tipo === "reclamo" ? "RECLAMO" : "QUEJA"}
                    </p>
                    <p className="lr-num text-3xl font-black tracking-tight mt-1">{numFormatted}</p>
                    <p className="text-[11px] opacity-75 mt-1">
                      {new Date(ticket.fecha).toLocaleString("es-PE", { dateStyle:"long", timeStyle:"short" })}
                    </p>
                  </div>

                  <div className="p-4 space-y-3 text-sm" style={{ backgroundColor:"var(--card)" }}>
                    {/* Sección A: Proveedor */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color:"var(--muted-foreground)" }}>
                        A. Datos del Proveedor
                      </p>
                      <p className="font-bold">{ticket.empresaNombre}</p>
                      {ticket.empresaRuc && <p className="text-xs">RUC: {ticket.empresaRuc}</p>}
                      {ticket.empresaDireccion && <p className="text-xs">{ticket.empresaDireccion}</p>}
                      {ticket.empresaUrl && <p className="text-xs">{ticket.empresaUrl}</p>}
                    </div>

                    <div className="border-t" style={{ borderColor:"var(--border)" }} />

                    {/* Sección B: Consumidor */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color:"var(--muted-foreground)" }}>
                        B. Datos del Consumidor
                      </p>
                      <p className="font-bold">{ticket.consumidorNombre}</p>
                      <p className="text-xs">{ticket.consumidorTipoDoc}: {ticket.consumidorNumDoc}</p>
                      {ticket.consumidorDomicilio && <p className="text-xs">{ticket.consumidorDomicilio}</p>}
                      {ticket.consumidorTelefono && <p className="text-xs">Tel: {ticket.consumidorTelefono}</p>}
                      {ticket.consumidorEmail    && <p className="text-xs">Email: {ticket.consumidorEmail}</p>}
                      {ticket.esMenorEdad && (
                        <p className="text-xs">Tutor: {ticket.tutorNombre} — Doc: {ticket.tutorNumDoc}</p>
                      )}
                    </div>

                    {/* Sección C: Bien/Servicio */}
                    {(ticket.bienDescripcion || ticket.bienMonto) && (
                      <>
                        <div className="border-t" style={{ borderColor:"var(--border)" }} />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color:"var(--muted-foreground)" }}>
                            C. Bien o Servicio
                          </p>
                          {ticket.bienDescripcion && <p className="text-xs">{ticket.bienDescripcion}</p>}
                          {ticket.bienMonto && (
                            <p className="text-xs font-semibold">
                              Monto: S/ {parseFloat(ticket.bienMonto).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    <div className="border-t" style={{ borderColor:"var(--border)" }} />

                    {/* Sección D: Reclamo */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color:"var(--muted-foreground)" }}>
                        D. Detalle — <span className="capitalize">{ticket.tipo}</span>
                      </p>
                      <p className="text-xs leading-relaxed">{ticket.descripcion}</p>
                      {ticket.pedidoConsumidor && (
                        <>
                          <p className="text-[10px] font-bold mt-2" style={{ color:"var(--muted-foreground)" }}>
                            Pedido del consumidor:
                          </p>
                          <p className="text-xs leading-relaxed">{ticket.pedidoConsumidor}</p>
                        </>
                      )}
                    </div>

                    <div className="border-t" style={{ borderColor:"var(--border)" }} />

                    {/* Texto legal obligatorio */}
                    <div
                      className="rounded-xl p-3 text-[10px] leading-relaxed space-y-1"
                      style={{ backgroundColor:"var(--muted)", color:"var(--muted-foreground)" }}
                    >
                      <p>
                        <strong>Plazo de respuesta:</strong> El proveedor tiene un plazo máximo de{" "}
                        <strong>15 días hábiles improrrogables</strong> para dar respuesta a su {ticket.tipo},
                        conforme a la Ley N° 31435 y el DS N° 101-2022-PCM.
                      </p>
                      <p>
                        <strong>Código único:</strong> {numFormatted}. Este documento es constancia oficial
                        de la presentación de su {ticket.tipo} al amparo de la Ley N° 29571 — Código de
                        Protección y Defensa del Consumidor.
                      </p>
                      <p>
                        Si el proveedor no responde dentro del plazo legal, puede presentar una denuncia
                        ante <strong>INDECOPI</strong> (consumidor.gob.pe) citando el número de hoja indicado.
                      </p>
                      <p>
                        <strong>Conserve este documento.</strong> El proveedor está obligado a conservar
                        esta hoja por un mínimo de 2 años (Art. 9° DS N° 011-2011-PCM).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Acciones post-ticket */}
                <button
                  onClick={handlePrint}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition hover:opacity-90 active:scale-95"
                  style={{ backgroundColor:"var(--primary)", color:"#fff" }}
                >
                  ⬇️ Descargar PDF
                </button>
                <p className="text-[10px] text-center" style={{ color:"var(--muted-foreground)" }}>
                  El PDF se descarga directamente — sin diálogos de impresión.
                </p>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl text-sm font-medium transition hover:opacity-60"
                  style={{ color:"var(--muted-foreground)" }}
                >
                  Cerrar
                </button>
              </div>
            )}

            {/* ════════ FORMULARIO — PASO 1 de 2 ════════ */}
            {!ticket && step === 1 && (
              <div className="space-y-4">
                {/* Datos empresa */}
                <div
                  className="rounded-xl p-3 text-xs"
                  style={{ backgroundColor:"var(--muted)" }}
                >
                  <p className="font-black text-sm" style={{ color:"var(--foreground)" }}>
                    {(store as any).empresaRazonSocial || store.name}
                  </p>
                  {(store as any).empresaRuc && (
                    <p style={{ color:"var(--muted-foreground)" }}>RUC: {(store as any).empresaRuc}</p>
                  )}
                  {(store as any).empresaDireccion && (
                    <p style={{ color:"var(--muted-foreground)" }}>{(store as any).empresaDireccion}</p>
                  )}
                </div>

                {/* Marco legal */}
                <div
                  className="rounded-xl border px-3 py-2.5 text-[10px] leading-relaxed"
                  style={{ borderColor:"var(--border)", color:"var(--muted-foreground)" }}
                >
                  Conforme a la <strong>Ley N° 29571</strong> (Código de Protección y Defensa del Consumidor)
                  y el <strong>DS N° 101-2022-PCM</strong>, tienes derecho a presentar una queja o reclamo.
                  Recibirás un número correlativo único como constancia legal.
                  {" "}El proveedor tiene <strong>15 días hábiles</strong> para responderte.
                </div>

                <p className="text-xs font-black uppercase tracking-wider" style={{ color:"var(--muted-foreground)" }}>
                  Sección B — Datos del Consumidor
                </p>

                <LRField label="Nombre completo" required error={nombre.trim().length > 2 ? errNombre : ""}>
                  <LRInput
                    value={nombre} onChange={e => setNombre(e.target.value)}
                    placeholder="Nombre y apellido completos"
                    style={{ ...INPUT_STYLE, borderColor: nombre.trim().length > 2 && errNombre ? "#ef4444" : undefined }}
                  />
                </LRField>

                <div className="grid grid-cols-2 gap-3">
                  <LRField label="Tipo de documento" required>
                    <select
                      value={tipoDoc}
                      onChange={e => { setTipoDoc(e.target.value as any); setNumDoc(""); }}
                      style={INPUT_STYLE}
                    >
                      <option value="DNI">DNI</option>
                      <option value="CE">Carné de Extranjería</option>
                      <option value="Pasaporte">Pasaporte</option>
                      <option value="RUC">RUC</option>
                    </select>
                  </LRField>
                  <LRField label="Número de documento" required error={numDoc.trim().length > 2 ? errNumDoc : ""}>
                    <LRInput
                      value={numDoc}
                      onChange={e => {
                        const v = tipoDoc === "Pasaporte"
                          ? e.target.value.replace(/[^a-zA-Z0-9]/g,"").slice(0,12)
                          : e.target.value.replace(/\D/g,"").slice(0, tipoDoc === "RUC" ? 11 : tipoDoc === "DNI" ? 8 : 12);
                        setNumDoc(v);
                      }}
                      placeholder={tipoDoc === "DNI" ? "12345678" : tipoDoc === "RUC" ? "20123456789" : tipoDoc === "CE" ? "123456789" : "AB123456"}
                      inputMode={tipoDoc === "Pasaporte" ? "text" : "numeric"}
                      maxLength={tipoDoc === "DNI" ? 8 : tipoDoc === "RUC" ? 11 : 12}
                      style={{ ...INPUT_STYLE, borderColor: numDoc.trim().length > 2 && errNumDoc ? "#ef4444" : undefined }}
                    />
                  </LRField>
                </div>

                <LRField label="Domicilio / Dirección">
                  <LRInput
                    value={domicilio} onChange={e => setDomicilio(e.target.value)}
                    placeholder="Av. o calle, ciudad (opcional)"
                  />
                </LRField>

                <div className="grid grid-cols-2 gap-3">
                  <LRField label="Teléfono de contacto" error={telefono.trim().length > 2 ? errTelefono : ""}>
                    <LRInput
                      value={telefono} onChange={e => setTelefono(e.target.value.replace(/\D/g,"").slice(0,12))}
                      placeholder="987654321" inputMode="numeric"
                      style={{ ...INPUT_STYLE, borderColor: telefono.trim().length > 2 && errTelefono ? "#ef4444" : undefined }}
                    />
                  </LRField>
                  <LRField label="Correo electrónico" error={email.trim().length > 4 ? errEmail : ""}>
                    <LRInput
                      value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="tu@correo.com" type="email"
                      style={{ ...INPUT_STYLE, borderColor: email.trim().length > 4 && errEmail ? "#ef4444" : undefined }}
                    />
                  </LRField>
                </div>

                {/* Menor de edad */}
                <label className="flex items-center gap-2.5 cursor-pointer text-sm select-none">
                  <input
                    type="checkbox"
                    checked={esMenor}
                    onChange={e => setEsMenor(e.target.checked)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  Soy menor de edad (se requieren datos del tutor)
                </label>

                {esMenor && (
                  <div className="grid grid-cols-2 gap-3 pl-1 border-l-2" style={{ borderColor:"var(--primary)" }}>
                    <LRField label="Nombre del tutor" required error={tutorNombre.trim().length > 2 ? errTutorNombre : ""}>
                      <LRInput
                        value={tutorNombre} onChange={e => setTutorNombre(e.target.value)}
                        placeholder="Nombre del padre/madre/tutor"
                        style={{ ...INPUT_STYLE, borderColor: tutorNombre.trim().length > 2 && errTutorNombre ? "#ef4444" : undefined }}
                      />
                    </LRField>
                    <LRField label="N° doc. tutor" required error={tutorDoc.trim().length > 2 ? errTutorDoc : ""}>
                      <LRInput
                        value={tutorDoc} onChange={e => setTutorDoc(e.target.value.replace(/\D/g,"").slice(0,8))}
                        placeholder="DNI del tutor"
                        inputMode="numeric"
                        maxLength={8}
                        style={{ ...INPUT_STYLE, borderColor: tutorDoc.trim().length > 2 && errTutorDoc ? "#ef4444" : undefined }}
                      />
                    </LRField>
                  </div>
                )}

                <div
                  className="rounded-xl p-3 text-[10px]"
                  style={{ backgroundColor:"var(--muted)", color:"var(--muted-foreground)" }}
                >
                  Los campos con <span className="text-red-500 font-bold">*</span> son obligatorios
                  conforme al Anexo I del DS N° 101-2022-PCM. Los datos opcionales facilitan la respuesta
                  del proveedor.
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!canStep1}
                  className="w-full py-3 rounded-xl font-bold text-sm transition disabled:opacity-40"
                  style={{ backgroundColor:"var(--primary)", color:"white" }}
                >
                  Continuar →
                </button>
              </div>
            )}

            {/* ════════ FORMULARIO — PASO 2 de 2 ════════ */}
            {!ticket && step === 2 && (
              <div className="space-y-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 text-xs font-semibold transition hover:opacity-60"
                  style={{ color:"var(--muted-foreground)" }}
                >
                  ← Volver
                </button>

                <p className="text-xs font-black uppercase tracking-wider" style={{ color:"var(--muted-foreground)" }}>
                  Sección C — Bien o Servicio
                </p>

                <LRField label="Descripción del producto o servicio">
                  <LRInput
                    value={bienDesc} onChange={e => setBienDesc(e.target.value)}
                    placeholder="Ej: Zapatillas talla 42, color negro"
                  />
                </LRField>

                <LRField label="Monto pagado (S/)">
                  <LRInput
                    value={bienMonto} onChange={e => setBienMonto(e.target.value.replace(/[^0-9.]/g,""))}
                    placeholder="0.00" inputMode="decimal"
                  />
                </LRField>

                <div className="border-t" style={{ borderColor:"var(--border)" }} />

                <p className="text-xs font-black uppercase tracking-wider" style={{ color:"var(--muted-foreground)" }}>
                  Sección D — Detalle del {tipo === "reclamo" ? "Reclamo" : "Queja"}
                </p>

                {/* Tipo */}
                <LRField label="Tipo de registro" required>
                  <div className="grid grid-cols-2 gap-2">
                    {(["reclamo","queja"] as const).map(t => (
                      <button
                        key={t} type="button" onClick={() => setTipo(t)}
                        className="rounded-xl px-3 py-3 text-left text-sm transition border"
                        style={{
                          borderColor: tipo===t ? "var(--primary)" : "var(--border)",
                          backgroundColor: tipo===t ? "var(--primary)" : "var(--card)",
                          color: tipo===t ? "white" : "var(--foreground)",
                        }}
                      >
                        <p className="font-black capitalize">{t}</p>
                        <p className="text-[10px] opacity-80 mt-0.5 leading-tight">
                          {t === "reclamo"
                            ? "Disconformidad con producto o servicio recibido"
                            : "Malestar en la atención o trato recibido"}
                        </p>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] mt-1" style={{ color:"var(--muted-foreground)" }}>
                    Art. 3° DS N° 011-2011-PCM: el <em>reclamo</em> es disconformidad con el bien/servicio;
                    la <em>queja</em> es malestar en la atención, sin disconformidad con el bien/servicio.
                    Ninguno constituye denuncia administrativa.
                  </p>
                </LRField>

                <LRField label="Descripción detallada" required error={descripcion.trim().length > 5 ? errDescripcion : ""}>
                  <LRTextarea
                    value={descripcion} onChange={e => setDescripcion(e.target.value)}
                    placeholder="Describe con el mayor detalle posible lo ocurrido: qué pasó, cuándo, cómo..."
                    rows={4}
                    style={{ ...INPUT_STYLE, resize:"vertical", minHeight:"80px", borderColor: descripcion.trim().length > 5 && errDescripcion ? "#ef4444" : undefined }}
                  />
                  <p className="text-[10px]" style={{ color:"var(--muted-foreground)" }}>
                    {descripcion.trim().length}/20 caracteres mínimo
                  </p>
                </LRField>

                <LRField label="¿Qué solicitas al proveedor?" required error={pedido.trim().length > 5 ? errPedido : ""}>
                  <LRTextarea
                    value={pedido} onChange={e => setPedido(e.target.value)}
                    placeholder="Ej: Cambio del producto, devolución del dinero, disculpas formales..."
                    rows={3}
                    style={{ ...INPUT_STYLE, resize:"vertical", minHeight:"80px", borderColor: pedido.trim().length > 5 && errPedido ? "#ef4444" : undefined }}
                  />
                  <p className="text-[10px]" style={{ color:"var(--muted-foreground)" }}>
                    {pedido.trim().length}/10 caracteres mínimo
                  </p>
                </LRField>

                {errorMsg && (
                  <p className="text-xs text-red-500 font-medium">{errorMsg}</p>
                )}

                <div
                  className="rounded-xl p-3 text-[10px] leading-relaxed"
                  style={{ backgroundColor:"var(--muted)", color:"var(--muted-foreground)" }}
                >
                  Al enviar, declaras que la información es verídica. Tus datos serán usados
                  exclusivamente para gestionar tu {tipo}. El proveedor tiene{" "}
                  <strong>15 días hábiles</strong> para responderte (Ley N° 31435). Si no
                  recibes respuesta, puedes acudir a <strong>INDECOPI</strong> (consumidor.gob.pe).
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={sending || !canStep2}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-40"
                  style={{ backgroundColor:"var(--primary)", color:"white" }}
                >
                  {sending
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Registrando...</>
                    : `Registrar ${tipo}`}
                </button>
              </div>
            )}
          </div>

          {/* ── STEPS INDICATOR ── */}
          {!ticket && (
            <div
              className="px-5 py-3 flex items-center justify-center gap-2 shrink-0"
              style={{ borderTop:"1px solid var(--border)" }}
            >
              {[1,2].map(s => (
                <div
                  key={s}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: step===s ? "2rem" : "0.75rem",
                    backgroundColor: step>=s ? "var(--primary)" : "var(--border)",
                  }}
                />
              ))}
              <span className="text-[10px] ml-2" style={{ color:"var(--muted-foreground)" }}>
                Paso {step} de 2
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Chip component ─────────────────────────────────────── */
function Chip({
  active,
  onClick,
  children,
  cfg,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  cfg: ModelConfig;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 text-xs font-semibold border whitespace-nowrap transition",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-foreground border-border hover:bg-accent"
      )}
      style={{ borderRadius: cfg.cardRounded }}
    >
      {children}
    </button>
  );
}

/* ── PriceRangeSlider ────────────────────────────────────────────
   Slider de rango de precio dual — min/max calculados de los productos reales
──────────────────────────────────────────────────────────────── */
function PriceRangeSlider({
  min, max, value, onChange, onReset, isDark,
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  onReset: () => void;
  isDark: boolean;
}) {
  const [lo, hi] = value;
  const range = max - min || 1;
  const hiPercent = ((hi - min) / range) * 100;
  const isFiltered = hi < max;

  const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

  const handleHi = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    onChange([min, clamp(v, min, max)]);
  };

  const mutedText = isDark ? "text-white/50" : "text-black/40";
  const fgText   = isDark ? "text-white/80" : "text-black/70";

  return (
    <div className="space-y-1.5">
      <div className={`flex items-center justify-between text-xs font-medium ${fgText}`}>
        <span>Precio Máximo</span>
        <div className="flex items-center gap-2">
          <span className="font-bold tabular-nums">
            S/ {hi.toLocaleString()}
          </span>
          {isFiltered && (
            <button
              onClick={onReset}
              className="text-[10px] underline opacity-60 hover:opacity-100 transition"
            >
              limpiar
            </button>
          )}
        </div>
      </div>

      {/* Track */}
      <div className="relative h-5 flex items-center">
        {/* Rail */}
        <div className={`absolute w-full h-1.5 rounded-full ${isDark ? "bg-white/15" : "bg-black/10"}`} />
        {/* Active range */}
        <div
          className="absolute h-1.5 rounded-full bg-primary"
          style={{ left: `0%`, width: `${hiPercent}%` }}
        />
        {/* Thumb Hi */}
        <input
          type="range" min={min} max={max} step={1} value={hi}
          onChange={handleHi}
          className="absolute w-full appearance-none bg-transparent cursor-pointer"
          style={{ zIndex: 4 }}
        />
      </div>

      <div className={`flex justify-between text-[10px] ${mutedText}`}>
        <span>S/ {min.toLocaleString()}</span>
        <span>S/ {max.toLocaleString()}</span>
      </div>

      <style>{`
        input[type=range].appearance-none::-webkit-slider-thumb {
          appearance: none;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: var(--primary, #4f46e5);
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
          cursor: pointer;
        }
        input[type=range].appearance-none::-moz-range-thumb {
          width: 18px; height: 18px;
          border-radius: 50%;
          background: var(--primary, #4f46e5);
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
