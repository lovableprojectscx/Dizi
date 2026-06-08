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
  Sparkles,
  Instagram,
  Facebook,
  Linkedin,
  SlidersHorizontal,
  Info,
  ChevronDown,
  CupSoda,
  Pizza,
  IceCream,
  Cake,
  Flower,
  Gift,
  Heart,
  Sprout,
  LayoutGrid,
  Utensils,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
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
  layout: "grid" | "overlay" | "editorial" | "hero" | "magazine" | "tiles" | "spotlight" | "diagonal" | "arch" | "banner_grid" | "bite";
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
  bite: {
    vars: { "--background": "#09090b", "--card": "#18181b", "--primary": "#ea580c", "--border": "#27272a" } as any,
    isDark: true, imgRounded: "1rem", cardRounded: "1rem",
    cardShadow: "hover:shadow-2xl hover:shadow-orange-950/20", cardBorder: true, headerStyle: "bold", layout: "bite",
  },
  bloom: {
    vars: { "--background": "#fffaf8", "--card": "#ffffff", "--primary": "#be185d", "--border": "#ffe4e6" } as any,
    isDark: false, imgRounded: "2rem", cardRounded: "2rem",
    cardShadow: "hover:shadow-xl hover:shadow-rose-100/50", cardBorder: true, headerStyle: "minimal", layout: "bloom",
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
          <g transform="translate(4.2, 4.3) scale(0.65)">
            <path fill="#FFF" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .8.11V9.4a6.27 6.27 0 0 0-3.11 0A6.33 6.33 0 0 0 2 15.68a6.32 6.32 0 0 0 10.4 4.84 6.26 6.26 0 0 0 1.95-4.52V8.82a8.27 8.27 0 0 0 5.24 1.86V7.28a4.89 4.89 0 0 1-3.11-.59z" />
          </g>
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

const parseCategoryName = (name: string) => {
  if (!name) return { label: "", iconKey: "" };
  const [label, iconKey] = name.split("|");
  return {
    label: label ? label.trim() : "",
    iconKey: iconKey ? iconKey.trim() : ""
  };
};

const ICON_EMOJIS: Record<string, string> = {
  burger: "🍔",
  fries: "🍟",
  drink: "🥤",
  combo: "🍱",
  dessert: "🍰",
  pizza: "🍕",
  icecream: "🍪",
};

const getCleanCategoryName = (rawName: string) => {
  if (!rawName) return "";
  const { label, iconKey } = parseCategoryName(rawName);
  const emoji = ICON_EMOJIS[iconKey] || "";
  return emoji ? `${emoji} ${label}` : label;
};

function CategoryIcon({ iconKey, className }: { iconKey: string; className?: string }) {
  const sizeClass = className || "h-4 w-4";
  switch (iconKey) {
    case "burger":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={sizeClass}
        >
          <path d="M3 11c0-3.3 2.7-6 6-6h6c3.3 0 6 2.7 6 6" />
          <path d="M2 13h20" />
          <path d="M4 17h16" />
          <path d="M3 17c0 2.2 1.8 4 4 4h10c2.2 0 4-1.8 4-4" />
        </svg>
      );
    case "fries":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={sizeClass}
        >
          <path d="M5 11l1.5 9h11l1.5-9" />
          <path d="M8 11V4M12 11V3M16 11V5M10 11V6M14 11V6" />
        </svg>
      );
    case "combo":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={sizeClass}
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 12h18" />
          <path d="M12 12v9" />
        </svg>
      );
    case "drink":
      return <CupSoda className={sizeClass} />;
    case "pizza":
      return <Pizza className={sizeClass} />;
    case "icecream":
      return <IceCream className={sizeClass} />;
    case "dessert":
      return <Cake className={sizeClass} />;
    case "flower":
      return <Flower className={sizeClass} />;
    case "gift":
      return <Gift className={sizeClass} />;
    case "heart":
      return <Heart className={sizeClass} />;
    case "sprout":
      return <Sprout className={sizeClass} />;
    case "leaf":
      return <Leaf className={sizeClass} />;
    case "bouquet":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={sizeClass}
        >
          <path d="M12 2a3 3 0 0 0-3 3c0 2 3 5 3 5s3-3 3-5a3 3 0 0 0-3-3z" />
          <path d="M8 6a3 3 0 0 0-3 3c0 2 3 5 3 5s3-3 3-5a3 3 0 0 0-3-3z" />
          <path d="M16 6a3 3 0 0 0-3 3c0 2 3 5 3 5s3-3 3-5a3 3 0 0 0-3-3z" />
          <path d="M12 10v12M9 14l6 6M15 14l-6 6" />
        </svg>
      );
    default:
      return null;
  }
}

const scanProductBadges = (name: string, description?: string): { emoji: string; label: string }[] => {
  const text = `${name} ${description || ""}`.toLowerCase();
  const badges: { emoji: string; label: string }[] = [];

  if (text.includes("picante") || text.includes("chile") || text.includes("aji") || text.includes("hot") || text.includes("spicy")) {
    badges.push({ emoji: "🌶️", label: "Picante" });
  }
  if (text.includes("vegano") || text.includes("vegan") || text.includes("vegetariano") || text.includes("vegetarian")) {
    badges.push({ emoji: "🌱", label: "Vegano" });
  }
  if (text.includes("sin gluten") || text.includes("gluten-free") || text.includes("gluten free") || text.includes("celiaco")) {
    badges.push({ emoji: "🌾", label: "Sin Gluten" });
  }

  if (text.includes("algodón") || text.includes("algodon") || text.includes("cotton")) {
    badges.push({ emoji: "🧵", label: "Algodón" });
  }
  if (text.includes("invierno") || text.includes("winter") || text.includes("frío") || text.includes("frio")) {
    badges.push({ emoji: "❄️", label: "Invierno" });
  }
  if (text.includes("verano") || text.includes("summer") || text.includes("playa") || text.includes("calor")) {
    badges.push({ emoji: "☀️", label: "Verano" });
  }

  if (text.includes("cumpleaños") || text.includes("cumple") || text.includes("birthday") || text.includes("aniversario")) {
    badges.push({ emoji: "🎂", label: "Cumpleaños" });
  }
  if (text.includes("amor") || text.includes("love") || text.includes("romántico") || text.includes("romantico") || text.includes("pareja") || text.includes("novia") || text.includes("novio")) {
    badges.push({ emoji: "❤️", label: "Amor" });
  }
  if (text.includes("condolencias") || text.includes("pesame") || text.includes("luto") || text.includes("condolence")) {
    badges.push({ emoji: "🕊️", label: "Pésame" });
  }

  if (text.includes("express") || text.includes("rápido") || text.includes("rapido") || text.includes("fast") || text.includes("corto")) {
    badges.push({ emoji: "⚡", label: "Express" });
  }
  if (text.includes("orgánico") || text.includes("organico") || text.includes("organic") || text.includes("natural")) {
    badges.push({ emoji: "🌿", label: "Orgánico" });
  }
  if (text.includes("relajante") || text.includes("relax") || text.includes("antiestrés") || text.includes("antiestres")) {
    badges.push({ emoji: "💆", label: "Relajante" });
  }

  return badges;
};

const DEFAULT_CONFIG: ModelConfig = MODEL_CONFIGS.minimalista;
const BANNER_MODELS = new Set(["elite", "portada", "luxury", "boutique", "nocturno", "dark_fashion", "aurora", "slash", "sunset_glow"]);

const isInAppBrowser = () => {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || "";
  const isInstagram = ua.indexOf("Instagram") > -1;
  const isFB = ua.indexOf("FBAN") > -1 || ua.indexOf("FBAV") > -1;
  const isTikTok = ua.indexOf("TikTok") > -1 || ua.indexOf("musical_ly") > -1;
  return isInstagram || isFB || isTikTok;
};

export function PublicCatalog({
  store,
  mode,
  isMockup = false,
}: {
  store: Store;
  mode: "catalog" | "bio";
  isMockup?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [cartOpen, setCartOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [libroOpen, setLibroOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showInAppHelpModal, setShowInAppHelpModal] = useState(false);
  const [pendingOrderMsg, setPendingOrderMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [showInAppBanner, setShowInAppBanner] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const dismissed = sessionStorage.getItem("dismissed_inapp_banner");
      return isInAppBrowser() && dismissed !== "true";
    } catch (e) {
      return isInAppBrowser();
    }
  });

  const fallbackCopy = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand("copy");
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Fallback copy failed", err);
    }
    document.body.removeChild(textArea);
  };

  const [sortBy, setSortBy] = useState<string>("all");
  const [selectedDiet, setSelectedDiet] = useState<string>("all");
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const activeBanners = useMemo(() => {
    const raw = store.bannerImage || "";
    if (!raw) return [];
    const all = raw.includes("|||") ? raw.split("|||") : [raw];
    
    // Enforce limits: Semilla = 0, Emprendedor = 1, Pro = 3, Ilimitado = 5
    const planId = store.plan;
    if (planId === "semilla") return [];
    if (planId === "emprendedor") return all.slice(0, 1);
    if (planId === "pro") return all.slice(0, 3);
    return all.slice(0, 5);
  }, [store.bannerImage, store.plan]);

  const bannersCount = activeBanners.length;

  useEffect(() => {
    if (bannersCount <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % bannersCount);
    }, 5000);
    return () => clearInterval(interval);
  }, [bannersCount]);


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
  const incViews = useApp((s) => s.incViews);

  // Incrementar vistas al cargar el catálogo de forma profesional y auditada
  useEffect(() => {
    if (!store?.id || isMockup) return;

    // 1. Evitar contar visitas si el usuario es el dueño de la tienda
    const loggedInStores = useApp.getState().stores;
    const isOwner = loggedInStores.some((st) => st.id === store.id);
    if (isOwner) {
      return;
    }

    // 2. Evitar contar visitas de bots/crawlers automáticos
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isBot = /bot|google|baidu|bing|msn|duckduckbot|teoma|slurp|yandex|lighthouse/i.test(userAgent);
    if (isBot) {
      return;
    }

    // 3. Evitar duplicar vistas en la misma sesión de navegación (F5 / recarga)
    const visitedKey = `dizi_visited_${store.id}`;
    const alreadyVisited = sessionStorage.getItem(visitedKey);
    if (alreadyVisited) {
      return;
    }

    // Registrar la visita real única
    incViews(store.id);
    sessionStorage.setItem(visitedKey, "true");
  }, [store?.id, isMockup]);

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
  const bioTypography = store.bioTypography || "sans";
  
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
    } as any;
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
    let { shape, type, radiusClass } = getButtonStyle(buttonStyleId);

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

    let result = visibleProducts;

    // Apply diet / classification filter
    if (selectedDiet !== "all") {
      if (modelId === "bite") {
        if (selectedDiet === "spicy") {
          result = result.filter(
            (p) =>
              p.name.toLowerCase().includes("picante") ||
              p.name.toLowerCase().includes("spicy") ||
              p.name.toLowerCase().includes("ají") ||
              p.name.toLowerCase().includes("salsa") ||
              (p.description && (
                p.description.toLowerCase().includes("picante") ||
                p.description.toLowerCase().includes("spicy") ||
                p.description.toLowerCase().includes("ají")
              ))
          );
        } else if (selectedDiet === "vegan") {
          result = result.filter(
            (p) =>
              p.name.toLowerCase().includes("vegan") ||
              p.name.toLowerCase().includes("vegano") ||
              p.name.toLowerCase().includes("vegetariano") ||
              p.name.toLowerCase().includes("ensalada") ||
              (p.description && (
                p.description.toLowerCase().includes("vegan") ||
                p.description.toLowerCase().includes("vegano") ||
                p.description.toLowerCase().includes("vegetariano")
              ))
          );
        } else if (selectedDiet === "gluten") {
          result = result.filter(
            (p) =>
              p.name.toLowerCase().includes("sin gluten") ||
              p.name.toLowerCase().includes("gluten free") ||
              p.name.toLowerCase().includes("sin tacc") ||
              (p.description && (
                p.description.toLowerCase().includes("sin gluten") ||
                p.description.toLowerCase().includes("gluten free")
              ))
          );
        }
      } else if (modelId === "glam") {
        if (selectedDiet === "cotton") {
          result = result.filter(
            (p) =>
              p.name.toLowerCase().includes("algodón") ||
              p.name.toLowerCase().includes("cotton") ||
              p.name.toLowerCase().includes("hilo") ||
              (p.description && (
                p.description.toLowerCase().includes("algodón") ||
                p.description.toLowerCase().includes("cotton") ||
                p.description.toLowerCase().includes("hilo")
              ))
          );
        } else if (selectedDiet === "winter") {
          result = result.filter(
            (p) =>
              p.name.toLowerCase().includes("invierno") ||
              p.name.toLowerCase().includes("lana") ||
              p.name.toLowerCase().includes("abrigo") ||
              p.name.toLowerCase().includes("casaca") ||
              p.name.toLowerCase().includes("sweat") ||
              p.name.toLowerCase().includes("hoodie") ||
              (p.description && (
                p.description.toLowerCase().includes("invierno") ||
                p.description.toLowerCase().includes("lana") ||
                p.description.toLowerCase().includes("abrigo")
              ))
          );
        } else if (selectedDiet === "summer") {
          result = result.filter(
            (p) =>
              p.name.toLowerCase().includes("verano") ||
              p.name.toLowerCase().includes("lino") ||
              p.name.toLowerCase().includes("playa") ||
              p.name.toLowerCase().includes("shor") ||
              p.name.toLowerCase().includes("polo") ||
              p.name.toLowerCase().includes("top") ||
              (p.description && (
                p.description.toLowerCase().includes("verano") ||
                p.description.toLowerCase().includes("lino") ||
                p.description.toLowerCase().includes("playa")
              ))
          );
        }
      } else if (modelId === "bloom") {
        if (selectedDiet === "love") {
          result = result.filter(
            (p) =>
              p.name.toLowerCase().includes("amor") ||
              p.name.toLowerCase().includes("roja") ||
              p.name.toLowerCase().includes("te amo") ||
              p.name.toLowerCase().includes("aniversario") ||
              p.name.toLowerCase().includes("corazón") ||
              (p.description && (
                p.description.toLowerCase().includes("amor") ||
                p.description.toLowerCase().includes("te amo") ||
                p.description.toLowerCase().includes("romántico")
              ))
          );
        } else if (selectedDiet === "birthday") {
          result = result.filter(
            (p) =>
              p.name.toLowerCase().includes("cumple") ||
              p.name.toLowerCase().includes("alegre") ||
              p.name.toLowerCase().includes("sol") ||
              p.name.toLowerCase().includes("globo") ||
              (p.description && (
                p.description.toLowerCase().includes("cumple") ||
                p.description.toLowerCase().includes("celebrar")
              ))
          );
        } else if (selectedDiet === "condolences") {
          result = result.filter(
            (p) =>
              p.name.toLowerCase().includes("pésame") ||
              p.name.toLowerCase().includes("condolencia") ||
              p.name.toLowerCase().includes("blanca") ||
              p.name.toLowerCase().includes("lágrima") ||
              p.name.toLowerCase().includes("urna") ||
              (p.description && (
                p.description.toLowerCase().includes("pésame") ||
                p.description.toLowerCase().includes("condolencia")
              ))
          );
        }
      } else if (modelId === "vibe") {
        if (selectedDiet === "express") {
          result = result.filter(
            (p) =>
              p.name.toLowerCase().includes("express") ||
              p.name.toLowerCase().includes("rápido") ||
              p.name.toLowerCase().includes("30 min") ||
              (p.description && (
                p.description.toLowerCase().includes("express") ||
                p.description.toLowerCase().includes("30 minutos")
              ))
          );
        } else if (selectedDiet === "organic") {
          result = result.filter(
            (p) =>
              p.name.toLowerCase().includes("orgánic") ||
              p.name.toLowerCase().includes("natural") ||
              p.name.toLowerCase().includes("soya") ||
              p.name.toLowerCase().includes("vege") ||
              (p.description && (
                p.description.toLowerCase().includes("orgánic") ||
                p.description.toLowerCase().includes("natural") ||
                p.description.toLowerCase().includes("soya")
              ))
          );
        } else if (selectedDiet === "relax") {
          result = result.filter(
            (p) =>
              p.name.toLowerCase().includes("relaj") ||
              p.name.toLowerCase().includes("zen") ||
              p.name.toLowerCase().includes("antiestrés") ||
              p.name.toLowerCase().includes("aroma") ||
              p.name.toLowerCase().includes("lavanda") ||
              (p.description && (
                p.description.toLowerCase().includes("relaj") ||
                p.description.toLowerCase().includes("descanso")
              ))
          );
        }
      }
    }

    result = result
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

    // Apply sorting
    if (sortBy === "price_asc") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sortBy === "name_asc") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "rating_desc") {
      const getRating = (prod: Product) => (prod.price > 80 ? 4.9 : prod.price > 15 ? 4.8 : 4.5);
      result = [...result].sort((a, b) => getRating(b) - getRating(a));
    }

    return result;
  }, [productsWithImages, activeCat, query, priceRange, effectiveProductLimit, sortBy, selectedDiet, modelId]);

  const filtered = useMemo(() => {
    return rawFiltered;
  }, [rawFiltered]);

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

    if (isInAppBrowser()) {
      setPendingOrderMsg(msg);
      setShowInAppHelpModal(true);
    } else {
      window.open(buildWaUrl(store.phone, msg), "_blank");
    }
  };

  const consultProduct = (name: string, id?: string) => {
    incClicks(store.id);
    const msg = `Hola, me interesa el producto: ${name}`;

    if (isInAppBrowser()) {
      setPendingOrderMsg(msg);
      setShowInAppHelpModal(true);
    } else {
      window.open(buildWaUrl(store.phone, msg), "_blank");
    }
  };

  const scrollToLocation = () => {
    const el = document.getElementById("location-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const supportClick = () => {
    incClicks(store.id);
    const msg = `Hola ${store.name}, tengo una consulta.`;

    if (isInAppBrowser()) {
      setPendingOrderMsg(msg);
      setShowInAppHelpModal(true);
    } else {
      window.open(buildWaUrl(store.phone, msg), "_blank");
    }
  };

  /* ── Render ──────────────────────────────────────── */
  return (
    <div
      className={cn(
        "min-h-screen bg-background text-foreground transition-colors duration-300",
        finalIsDark ? "dark" : "",
        modelId === "glam" && "theme-glam",
        modelId === "bloom" && "theme-bloom",
        modelId === "vibe" && "theme-vibe",
        isBioMode && bioTypography === "sans" && "typography-sans",
        isBioMode && bioTypography === "serif" && "typography-serif",
        isBioMode && bioTypography === "rounded" && "typography-rounded",
        isBioMode && bioTypography === "modern" && "typography-modern"
      )}
      style={isBioMode && bioTheme !== "default" ? bioThemeVars : themeVars}
      translate="no"
    >
      <style>{`
        .font-serif-glam {
          font-family: 'Playfair Display', Georgia, serif !important;
        }

        .theme-glam {
          font-family: 'Playfair Display', Georgia, serif;
        }
        .theme-bloom {
          font-family: 'Quicksand', sans-serif;
        }
        .theme-vibe {
          font-family: 'Outfit', sans-serif;
        }

        @keyframes premiumShimmer {
          0% { transform: translateX(-150%) skewX(-15deg); }
          35% { transform: translateX(150%) skewX(-15deg); }
          100% { transform: translateX(150%) skewX(-15deg); }
        }
        .animate-premium-shimmer {
          animation: premiumShimmer 4s infinite ease-in-out;
        }
        .scrollbar-none {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
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

      {/* Banner: In-App Browser Warning (TikTok/Instagram) */}
      {showInAppBanner && (
        <div className="bg-amber-600 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between gap-3 shadow-md border-b border-amber-700 select-none animate-in slide-in-from-top duration-300 relative z-[99]">
          <div className="flex items-center gap-2 text-left">
            <span className="text-sm shrink-0">⚠️</span>
            <span>
              <strong>¿Estás en TikTok o Instagram?</strong> Si la redirección a WhatsApp falla, toca los <strong>3 puntos (...)</strong> arriba a la derecha y elige <strong>"Abrir en el navegador"</strong>.
            </span>
          </div>
          <button
            onClick={() => {
              setShowInAppBanner(false);
              try {
                sessionStorage.setItem("dismissed_inapp_banner", "true");
              } catch (e) {}
            }}
            className="text-white hover:text-amber-200 transition font-bold text-sm px-1.5 py-0.5 rounded-md hover:bg-amber-700/50 shrink-0"
            title="Cerrar aviso"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Header ───────────────────────────────────── */}
      {mode === "catalog" && (
        <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border">
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
          {!BANNER_MODELS.has(modelId) && modelId !== "bite" && modelId !== "bloom" && mode === "catalog" && (
            <div className="mx-auto max-w-5xl px-4 pb-3 space-y-2">
              {/* Search row + Filtros button */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="¿Qué estás buscando hoy?"
                    className={cn(
                      "w-full rounded-full bg-secondary pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring transition",
                      modelId === "bite" && "bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:ring-orange-600 focus:border-orange-600"
                    )}
                  />
                </div>
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className={cn(
                    "relative shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-secondary hover:bg-accent text-sm font-semibold transition",
                    modelId === "bite" && "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  )}
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
                        parseCategoryName(store.categories.find(c => c.id === activeCat)?.name ?? activeCat).label
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
            {(store.bioBanner || activeBanners[0]) ? (
              <img
                src={store.bioBanner || activeBanners[0]}
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
          <div className={cn(
            "relative max-w-xl mx-auto px-4 text-center pb-4 flex flex-col items-center",
            bioTypography === "serif" ? "-mt-16 space-y-5" : "-mt-10 space-y-4"
          )}>
            {/* Logo Solapado */}
            <div className="inline-block relative">
              {(store.bioLogo || store.logo) ? (
                <img
                  src={store.bioLogo || store.logo}
                  alt={store.name}
                  className={cn(
                    "rounded-full object-cover border shadow-lg animate-in fade-in duration-300 bg-white",
                    bioTypography === "serif" ? "h-32 w-32 p-1 border-gray-100" : "h-20 w-20 border-4"
                  )}
                  style={bioTypography === "serif" ? {} : { borderColor: "var(--background)" }}
                />
              ) : (
                <div
                  className={cn(
                    "rounded-full flex items-center justify-center shadow-lg border text-xl font-black uppercase text-primary bg-white",
                    bioTypography === "serif" ? "h-32 w-32 border-gray-100" : "h-20 w-20 border-4"
                  )}
                  style={bioTypography === "serif" ? {} : {
                    borderColor: "var(--background)",
                    backgroundColor: "var(--secondary)",
                  }}
                >
                  {store.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Nombre y Descripción */}
            {bioTypography === "serif" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <h1 className="font-serif-editorial text-3xl font-semibold tracking-tight text-foreground">{store.name}</h1>
                  <BadgeCheck className="w-5 h-5 text-gray-400 shrink-0" />
                </div>
                {store.bioDescription && (
                  <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-medium max-w-sm mx-auto leading-relaxed">
                    {store.bioDescription}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <h1 className="text-2xl font-black tracking-tight uppercase text-foreground">{store.name}</h1>
                {store.bioDescription && (
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    {store.bioDescription}
                  </p>
                )}
                <div className="flex items-center justify-center gap-1 mt-1 text-[10px] font-bold text-muted-foreground/80 bg-muted/40 rounded-full w-max mx-auto px-2 py-0.5 border border-muted/50">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 fill-emerald-500/20" />
                  <span>Verified</span>
                </div>
              </div>
            )}

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

              {/* 1.5. VER CATÁLOGO COMPLETO (Serif only) */}
              {bioTypography === "serif" && renderBioButton(
                "#catalogo",
                "Ver Catálogo",
                "#111111",
                "#111111",
                "#ffffff",
                "custom",
                <LayoutGrid className="h-5 w-5" />,
                (e) => {
                  e.preventDefault();
                  document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
                },
                "transparent",
                "var(--foreground)"
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
      {modelId === "elite" && activeBanners.length > 0 && mode === "catalog" && (
        <section className="relative w-full h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
          <img 
            src={activeBanners[0]} 
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
          <div id="catalogo" className="pt-2 mb-6 scroll-mt-20">
            {bioTypography === "serif" ? (
              <h2 className="font-serif-editorial text-xl font-normal text-center text-foreground flex items-center justify-center gap-4">
                <span className="h-[1px] w-12 bg-foreground/10"></span>
                Nuestra Colección
                <span className="h-[1px] w-12 bg-foreground/10"></span>
              </h2>
            ) : (
              <h2 className="text-xs font-black uppercase tracking-wider text-center text-muted-foreground flex items-center justify-center gap-2">
                <span className="h-px w-8 bg-muted-foreground/30"></span>
                <ShoppingBag className="h-3.5 w-3.5 opacity-60" />
                NUESTRA CARTA ONLINE
                <span className="h-px w-8 bg-muted-foreground/30"></span>
              </h2>
            )}
          </div>
        )}
        {filtered.length === 0 && cfg.layout !== "bite" && cfg.layout !== "bloom" ? (
          <div className="py-20 text-center text-muted-foreground text-sm">No encontramos productos.</div>
        ) : mode === "bio" ? (
          <div className="w-full">
            <div className="max-w-md mx-auto mb-6 px-1">
              {/* Horizontal Category Scroll */}
              <div className="flex gap-2 overflow-x-auto scrollbar-none py-1">
                <button
                  onClick={() => setActiveCat("all")}
                  className={cn(
                    "px-4 py-2 text-xs uppercase tracking-wider transition border whitespace-nowrap font-medium",
                    bioTypography === "serif" ? "rounded-none" : "rounded-full",
                    activeCat === "all"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-muted-foreground border-border hover:border-primary"
                  )}
                >
                  Todos
                </button>
                
                {productsWithImages.some(p => p.isOnSale) && (
                  <button
                    onClick={() => setActiveCat("sale")}
                    className={cn(
                      "px-4 py-2 text-xs uppercase tracking-wider transition border whitespace-nowrap font-medium flex items-center gap-1",
                      bioTypography === "serif" ? "rounded-none" : "rounded-full",
                      activeCat === "sale"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-muted-foreground border-border hover:border-primary"
                    )}
                  >
                    <Flame className="h-3 w-3 text-red-500" />
                    Ofertas
                  </button>
                )}

                {store.categories.map((c) => {
                  const { label } = parseCategoryName(c.name);
                  const active = activeCat === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveCat(c.id)}
                      className={cn(
                        "px-4 py-2 text-xs uppercase tracking-wider transition border whitespace-nowrap font-medium",
                        bioTypography === "serif" ? "rounded-none" : "rounded-full",
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-muted-foreground border-border hover:border-primary"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground text-sm">No encontramos productos.</div>
            ) : (
              /* ── BIO-LINK grid: Clean 2-column mobile style grid, max width 600px (max-w-md) */
              <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto">
                {filtered.slice(0, 6).map((p) => (
                  <article
                    key={p.id}
                    className={cn(
                      "overflow-hidden flex flex-col cursor-pointer transition-all duration-200 group border bg-card shadow-sm hover:shadow-md",
                      cfg.cardShadow,
                      bioTypography === "serif" && "border-gray-100 hover:border-black/20"
                    )}
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
                      <h3 className={cn(
                        "line-clamp-2 leading-snug flex-1",
                        bioTypography === "serif" ? "font-serif-editorial text-[13px] font-normal text-foreground" :
                        bioTypography === "rounded" ? "font-sans-bloom text-xs font-medium" :
                        bioTypography === "modern" ? "font-sans-vibe text-xs font-medium" :
                        "text-xs font-semibold"
                      )}>
                        {p.name}
                      </h3>
                      <div className="flex items-center justify-between mt-1">
                        <div>
                          <span className={cn(
                            "text-sm font-black text-primary",
                            bioTypography === "serif" && "font-serif-editorial font-bold"
                          )}>{formatPrice(p.price)}</span>
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
            )}
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
        ) : cfg.layout === "bite" ? (
          /* ── BITE PREMIUM RESTAURANT LAYOUT ── */
          <div className="space-y-8 select-none">
            {/* 1. Cover Banner Carousel */}
            {(() => {
              const banners = activeBanners;
              return (
                <div className="relative w-full aspect-[21/9] sm:aspect-[21/7] rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl group/banner z-10">
                  {banners.length > 0 ? (
                    <>
                      {/* Slides */}
                      <div className="w-full h-full relative">
                        {banners.map((slide, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out transform",
                              idx === currentBannerIndex
                                ? "opacity-100 scale-100 z-10"
                                : "opacity-0 scale-105 z-0 pointer-events-none"
                            )}
                          >
                            <img
                              src={slide}
                              alt={`${store.bannerTitle || store.name} ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                          </div>
                        ))}
                      </div>

                      {/* Manual controls (Arrows) */}
                      {banners.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
                            }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-zinc-900/80 backdrop-blur-md border border-zinc-800 text-white flex items-center justify-center hover:bg-zinc-800 transition-all shadow-md opacity-0 group-hover/banner:opacity-100 active:scale-90 z-20 cursor-pointer"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-zinc-900/80 backdrop-blur-md border border-zinc-800 text-white flex items-center justify-center hover:bg-zinc-800 transition-all shadow-md opacity-0 group-hover/banner:opacity-100 active:scale-90 z-20 cursor-pointer"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </>
                      )}

                      {/* Indicator dots */}
                      {banners.length > 1 && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 bg-black/60 backdrop-blur-xs border border-zinc-800/60 px-2.5 py-1.5 rounded-full">
                          {banners.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentBannerIndex(idx);
                              }}
                              className={cn(
                                "h-1.5 rounded-full transition-all duration-300",
                                idx === currentBannerIndex
                                  ? "w-4 bg-orange-500"
                                  : "w-1.5 bg-zinc-500 hover:bg-zinc-400"
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div 
                      className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-black relative"
                    >
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ea580c_1px,transparent_1px)] [background-size:16px_16px]" />
                      <div className="relative z-10">
                        <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
                          {store.name}
                        </h2>
                        <p className="text-xs text-orange-500 font-bold uppercase tracking-widest mt-1">
                          {store.niche === "hamburgueseria"
                            ? "Premium Burger Experience"
                            : store.niche === "cafeteria"
                            ? "Premium Coffee & Pastry"
                            : "Premium Gourmet Experience"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}



            {/* 2. Spotlight Carousel (Featured Products) */}
            {(() => {
              if (activeCat !== "all" || query.trim() !== "") return null;
              const featuredProducts = productsWithImages.filter(
                (p) => p.description?.includes("#destacado") || p.name?.includes("#destacado")
              );
              if (featuredProducts.length === 0) return null;
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-l-2 pl-3 transition-colors duration-300" style={{ borderColor: "var(--primary)" }}>
                    <h3 className="text-sm sm:text-base font-black text-white tracking-widest flex items-center gap-2 uppercase">
                      {/* Premium 4-point diamond SVG */}
                      <svg 
                        viewBox="0 0 24 24" 
                        fill="currentColor" 
                        className="h-4 w-4 text-[var(--primary)] animate-pulse" 
                        style={{ filter: "drop-shadow(0 0 4px var(--primary))" }}
                      >
                        <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z" />
                      </svg>
                      Nuestros Destacados
                    </h3>
                    <span className="text-[9px] text-zinc-400 font-black uppercase tracking-widest animate-pulse">Desliza →</span>
                  </div>

                  {/* TWO-DIV PATTERN to prevent shadow and scale clipping */}
                  <div className="overflow-x-auto scrollbar-none -mx-4 py-4 sm:-mx-4 sm:py-4">
                    <div className="flex gap-4 px-4 snap-x snap-mandatory w-max min-w-full">
                      {featuredProducts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => setViewingProduct(p)}
                          className="w-[280px] sm:w-[320px] shrink-0 snap-start rounded-3xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 p-3 transition-all duration-300 hover:scale-[1.02] shadow-xl flex flex-col justify-between cursor-pointer group"
                        >
                          <div className="space-y-3">
                            {/* Image */}
                            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800">
                              <img
                                src={p.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80"}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                              />
                              <div className="absolute top-2 left-2 bg-orange-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-lg">
                                Destacado
                              </div>
                            </div>
                            {/* Info */}
                            <div className="space-y-1 text-left px-1">
                              <h4 className="font-extrabold text-sm sm:text-base text-white group-hover:text-orange-500 transition-colors truncate">
                                {p.name}
                              </h4>
                              <p className="text-xs text-zinc-400 line-clamp-2 h-8 leading-snug">
                                {(p.description || "").replace(/#destacado/g, "").trim()}
                              </p>
                            </div>
                          </div>
                          {/* Buy section */}
                          <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-800/80 px-1">
                            <div>
                              <span className="text-base font-black text-orange-500">{formatPrice(p.price)}</span>
                              {p.isOnSale && p.originalPrice && p.originalPrice > p.price && (
                                <span className="text-xs text-zinc-500 line-through block -mt-1">{formatPrice(p.originalPrice)}</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                cartAdd(store.id, p.id);
                                setCartOpen(true);
                              }}
                              style={{
                                borderColor: "var(--primary)",
                                color: "var(--primary)"
                              }}
                              className="border bg-zinc-950/80 hover:bg-[var(--primary)] hover:text-white transition-all duration-300 font-extrabold text-[10px] tracking-widest uppercase rounded-full px-5 py-2.5 shadow-[0_0_10px_rgba(234,88,12,0.1)] hover:shadow-[0_0_15px_var(--primary)]/40 flex items-center gap-1.5"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Añadir
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 3. Navigation and Search Block (Search + Categories) */}
            <div className="space-y-6">
              {/* Search Bar at full width */}
              {mode === "catalog" && (
                <div className="relative w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="¿Qué estás buscando hoy?"
                    className="w-full rounded-full pl-10 pr-4 py-2.5 text-sm outline-none transition bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:ring-orange-600 focus:border-orange-600"
                  />
                </div>
              )}

              {/* Inline Horizontal Category Selector */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 text-left">
                  Categorías
                </h3>
                
                {/* TWO-DIV PATTERN to prevent vertical clipping on scale and shadow */}
                <div className="overflow-x-auto scrollbar-none -mx-4 py-3 sm:-mx-4 sm:py-3">
                  <div className="flex gap-2.5 px-4 w-max min-w-full">
                    <button
                      onClick={() => setActiveCat("all")}
                      style={{
                        borderColor: activeCat === "all" ? "var(--primary)" : "#27272a",
                      }}
                      className={cn(
                        "flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all duration-300 shrink-0 text-xs font-extrabold uppercase tracking-wider bg-zinc-950/40 backdrop-blur-sm",
                        activeCat === "all"
                          ? "bg-zinc-900/90 text-white shadow-lg shadow-[var(--primary)]/10 scale-105"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                      )}
                    >
                      <LayoutGrid className="h-4 w-4 shrink-0" style={{ color: activeCat === "all" ? "#fff" : "var(--primary)" }} />
                      <span>Ver Todo</span>
                    </button>

                    {/* Ofertas */}
                    {store.products.some(p => p.isOnSale) && (
                      <button
                        onClick={() => setActiveCat("sale")}
                        style={{
                          borderColor: activeCat === "sale" ? "var(--primary)" : "#27272a",
                        }}
                        className={cn(
                          "flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all duration-300 shrink-0 text-xs font-extrabold uppercase tracking-wider bg-zinc-950/40 backdrop-blur-sm",
                          activeCat === "sale"
                            ? "bg-zinc-900/90 text-white shadow-lg shadow-[var(--primary)]/10 scale-105"
                            : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                        )}
                      >
                        <Flame className="h-4 w-4 shrink-0 text-red-500" />
                        <span>Ofertas</span>
                      </button>
                    )}

                    {store.categories.map((c) => {
                      const { label, iconKey } = parseCategoryName(c.name);
                      const active = activeCat === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setActiveCat(c.id)}
                          style={{
                            borderColor: active ? "var(--primary)" : "#27272a",
                          }}
                          className={cn(
                            "flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all duration-300 shrink-0 text-xs font-extrabold uppercase tracking-wider bg-zinc-950/40 backdrop-blur-sm",
                            active
                              ? "bg-zinc-900/90 text-white shadow-lg shadow-[var(--primary)]/10 scale-105"
                              : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                          )}
                        >
                          {iconKey ? (
                            <CategoryIcon 
                              iconKey={iconKey} 
                              className="h-4 w-4 shrink-0" 
                              style={{ color: active ? "#fff" : "var(--primary)" }}
                            />
                          ) : (
                            <Utensils 
                              className="h-4 w-4 shrink-0" 
                              style={{ color: active ? "#fff" : "var(--primary)" }}
                            />
                          )}
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Product Grid */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 text-left">
                {activeCat === "all" ? "Nuestros Productos" : parseCategoryName(store.categories.find(c => c.id === activeCat)?.name ?? "").label}
              </h3>
              {(() => {
                const gridProducts = activeCat === "all"
                  ? filtered.filter((p) => !(p.description?.includes("#destacado") || p.name?.includes("#destacado")))
                  : filtered;
                
                if (gridProducts.length === 0) {
                  return (
                    <div className="text-center py-12 border border-zinc-800 rounded-3xl bg-zinc-900/10 text-xs text-zinc-500">
                      No hay productos en esta categoría.
                    </div>
                  );
                }
                
                return (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {gridProducts.map((p) => (
                      <article
                        key={p.id}
                        className="overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-300 group border border-zinc-800 rounded-3xl bg-zinc-900/30 hover:bg-zinc-900 hover:scale-[1.02] shadow-lg"
                        onClick={() => setViewingProduct(p)}
                      >
                        <div>
                          {/* 1:1 image */}
                          <div className="relative overflow-hidden bg-zinc-950 aspect-square rounded-2xl m-2 border border-zinc-800">
                            <img
                              src={p.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80"}
                              alt={p.name}
                              className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                            {p.isOnSale && (
                              <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-lg">
                                Oferta
                              </span>
                            )}
                          </div>
                          {/* Info */}
                          <div className="p-3 pt-1 space-y-1 text-left">
                            <h4 className="font-extrabold text-sm text-white group-hover:text-orange-500 transition-colors line-clamp-1">
                              {p.name}
                            </h4>
                            {p.description && (
                              <p className="text-[11px] text-zinc-400 line-clamp-2 h-7 leading-snug">
                                {p.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Price & Action */}
                        <div className="px-3.5 pb-4 pt-0 flex items-center justify-between mt-auto">
                          <div className="flex flex-col text-left">
                            <span className="text-sm font-black text-orange-500" style={{ color: "var(--primary)" }}>{formatPrice(p.price)}</span>
                            {p.isOnSale && p.originalPrice && p.originalPrice > p.price && (
                              <span className="text-[10px] text-zinc-500 line-through -mt-1">{formatPrice(p.originalPrice)}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              cartAdd(store.id, p.id);
                              setCartOpen(true);
                            }}
                            style={{
                              borderColor: "var(--primary)",
                              color: "var(--primary)"
                            }}
                            className="h-8 px-3 rounded-xl border bg-zinc-950/60 hover:bg-[var(--primary)] hover:text-white transition-all duration-300 flex items-center justify-center gap-1 text-[10px] font-black tracking-wider uppercase shadow-[0_2px_10px_rgba(0,0,0,0.3)] hover:shadow-[0_0_12px_var(--primary)]/30 active:scale-95"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Añadir
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        ) : cfg.layout === "bloom" ? (
          /* ── BLOOM PREMIUM FLORIST LAYOUT ── */
          <div className={cn("space-y-8 select-none relative", store.niche === "floreria" ? "font-serif" : "font-sans")}>
            {store.niche === "floreria" && (
              <>
                {/* Elegant floating leafy watermarks in background */}
                <div className="absolute top-[12%] -left-12 w-28 h-28 text-rose-800 opacity-[0.04] pointer-events-none select-none z-0 hidden md:block">
                  <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full rotate-45">
                    <path d="M50 0C52 20 70 38 100 50C70 62 52 80 50 100C48 80 30 62 0 50C30 38 48 20 50 0Z" />
                  </svg>
                </div>
                <div className="absolute top-[52%] -right-16 w-36 h-36 text-rose-800 opacity-[0.04] pointer-events-none select-none z-0 hidden md:block">
                  <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full -rotate-12">
                    <path d="M50 0C52 20 70 38 100 50C70 62 52 80 50 100C48 80 30 62 0 50C30 38 48 20 50 0Z" />
                  </svg>
                </div>
              </>
            )}

            {/* 1. Cover Banner Carousel */}
            {(() => {
              const banners = activeBanners;
              return (
                <div className={cn(
                  "relative w-full aspect-[21/9] sm:aspect-[21/7] p-1 overflow-hidden group/banner z-10",
                  store.niche === "floreria"
                    ? "rounded-[3.5rem_1.5rem_3.5rem_1.5rem] bg-gradient-to-tr from-rose-200/50 via-[#fffaf8] to-rose-200/50 shadow-[0_12px_35px_rgba(251,207,214,0.4)] border border-rose-100/50"
                    : "rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-md"
                )}>
                  <div className={cn(
                    "w-full h-full rounded-[inherit] overflow-hidden relative",
                    store.niche === "floreria" ? "bg-[#fdfaf8]" : "bg-[var(--card)]"
                  )}>
                    {banners.length > 0 ? (
                      <>
                        {/* Slides */}
                        <div className="w-full h-full relative">
                          {banners.map((slide, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out transform",
                                idx === currentBannerIndex
                                  ? "opacity-100 scale-100 z-10"
                                  : "opacity-0 scale-105 z-0 pointer-events-none"
                              )}
                            >
                              <img
                                src={slide}
                                alt={`${store.bannerTitle || store.name} ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/35 via-transparent to-transparent" />
                            </div>
                          ))}
                        </div>

                        {/* Manual controls (Arrows) */}
                        {banners.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
                              }}
                              className="absolute left-4 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/75 backdrop-blur-md text-stone-700 flex items-center justify-center hover:bg-white transition-all shadow-md opacity-0 group-hover/banner:opacity-100 active:scale-90 z-20 cursor-pointer"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
                              }}
                              className="absolute right-4 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/75 backdrop-blur-md text-stone-700 flex items-center justify-center hover:bg-white transition-all shadow-md opacity-0 group-hover/banner:opacity-100 active:scale-90 z-20 cursor-pointer"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </>
                        )}

                        {/* Indicator dots */}
                        {banners.length > 1 && (
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 bg-stone-900/40 backdrop-blur-xs px-2.5 py-1.5 rounded-full">
                            {banners.map((_, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentBannerIndex(idx);
                                }}
                                className={cn(
                                  "h-1.5 rounded-full transition-all duration-300",
                                  idx === currentBannerIndex
                                    ? "w-4 bg-white"
                                    : "w-1.5 bg-white/50 hover:bg-white/80"
                                )}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div 
                        className={cn(
                          "w-full h-full flex flex-col items-center justify-center p-6 text-center relative",
                          store.niche === "floreria"
                            ? "bg-gradient-to-br from-rose-50/50 via-rose-100/20 to-stone-50"
                            : "bg-gradient-to-br from-[var(--card)] via-[var(--card)] to-muted/20"
                        )}
                      >
                        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(var(--primary)_1px,transparent_1px)] [background-size:20px_20px]" />
                        <div className="relative z-10">
                          <h2 className={cn("text-2xl sm:text-4xl font-normal text-stone-800 tracking-wide", store.niche === "floreria" ? "font-serif" : "font-sans font-bold")}>
                            {store.name}
                          </h2>
                          <p className={cn("text-xs font-semibold uppercase tracking-widest mt-2 font-sans", store.niche === "floreria" ? "text-rose-600/80" : "text-[var(--primary)]")}>
                            {store.niche === "floreria" ? "Arreglos & Detalles Florales" : "Catálogo Oficial"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>


                </div>
              );
            })()}

            {/* 2. Spotlight Carousel (Featured Products) */}
            {(() => {
              if (activeCat !== "all" || query.trim() !== "") return null;
              
              // Fallback selection for featured products
              let featuredProducts = productsWithImages.filter(
                (p) => p.description?.includes("#destacado") || p.name?.includes("#destacado")
              );
              if (featuredProducts.length === 0) {
                featuredProducts = productsWithImages.filter((p) => p.isOnSale);
              }
              if (featuredProducts.length === 0) {
                featuredProducts = productsWithImages.slice(0, 4);
              }
              if (featuredProducts.length === 0) return null;
              
              return (
                <div className="space-y-4 relative z-10">
                  <div className={cn(
                    "flex items-center justify-between border-l-2 pl-3 transition-colors duration-300",
                    store.niche === "floreria" ? "border-rose-400" : "border-[var(--primary)]"
                  )}>
                    <h3 className={cn(
                      "text-sm sm:text-base font-medium text-stone-800 tracking-wider flex items-center gap-2 uppercase",
                      store.niche === "floreria" ? "font-serif" : "font-sans font-bold"
                    )}>
                      {store.niche === "floreria" ? (
                        <>
                          <Flower className="h-4 w-4 text-rose-500 animate-pulse" />
                          Arreglos Destacados
                        </>
                      ) : (
                        <>
                          <Star className="h-4 w-4 text-[var(--primary)] animate-pulse" />
                          Productos Destacados
                        </>
                      )}
                    </h3>
                    <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest animate-pulse font-sans">Desliza →</span>
                  </div>

                  {/* TWO-DIV PATTERN to prevent shadow and scale clipping */}
                  <div className="overflow-x-auto scrollbar-none -mx-4 py-4 sm:-mx-4 sm:py-4">
                    <div className="flex gap-5 px-4 snap-x snap-mandatory w-max min-w-full">
                      {featuredProducts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => setViewingProduct(p)}
                          className={cn(
                            "w-[280px] sm:w-[320px] shrink-0 snap-start p-3.5 transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1 flex flex-col justify-between cursor-pointer group relative",
                            store.niche === "floreria"
                              ? "rounded-[2.5rem_1rem_2.5rem_1rem] border border-rose-100/40 bg-white/75 hover:bg-white shadow-[0_8px_30px_rgba(253,244,245,0.7)] hover:shadow-[0_15px_35px_rgba(251,207,214,0.35)]"
                              : "rounded-3xl border border-[var(--border)] bg-[var(--card)] hover:opacity-95 shadow-sm hover:shadow-md"
                          )}
                        >
                          <div className="space-y-3">
                            {/* Curved image like flower petal / Standard rounded image */}
                            <div className={cn(
                              "relative aspect-square w-full overflow-hidden",
                              store.niche === "floreria"
                                ? "rounded-t-[7rem] rounded-b-[1.5rem] bg-rose-50/20 border border-rose-100/30"
                                : "rounded-2xl bg-muted border border-[var(--border)]"
                            )}>
                              <img
                                src={p.image || "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=600&q=80"}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-105 group-hover:rotate-1 transition-transform duration-700"
                                loading="lazy"
                              />
                              {/* Floating Badge inside image container */}
                              <div 
                                style={{
                                  backgroundColor: store.niche === "floreria" ? undefined : "var(--primary)",
                                }}
                                className={cn(
                                  "absolute bottom-3 left-3 z-10 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md font-sans",
                                  store.niche === "floreria" ? "bg-rose-500" : ""
                                )}
                              >
                                {p.isOnSale ? "Oferta" : "Destacado"}
                              </div>
                            </div>
                            {/* Info */}
                            <div className="space-y-1 text-left px-1">
                              {store.niche === "floreria" && (
                                <span className="text-[10px] italic text-rose-400 font-serif block mb-0.5">Sugerencia de la Florista</span>
                              )}
                              <h4 className={cn(
                                "font-semibold text-sm sm:text-base text-stone-800 transition-colors truncate",
                                store.niche === "floreria" ? "font-serif group-hover:text-rose-600" : "font-sans group-hover:text-[var(--primary)]"
                              )}>
                                {p.name}
                              </h4>
                              <p className="text-xs text-stone-500 line-clamp-2 h-8 leading-relaxed font-sans">
                                {(p.description || "").replace(/#destacado/g, "").trim()}
                              </p>
                            </div>
                          </div>
                          {/* Buy section */}
                          <div className={cn(
                            "flex items-center justify-between pt-3 mt-3 border-t px-1",
                            store.niche === "floreria" ? "border-rose-100/30" : "border-[var(--border)]"
                          )}>
                            <div className="text-left">
                              <span 
                                style={{
                                  color: store.niche === "floreria" ? undefined : "var(--primary)",
                                }}
                                className={cn(
                                  "text-base font-semibold font-sans",
                                  store.niche === "floreria" ? "text-rose-600" : ""
                                )}
                              >
                                {formatPrice(p.price)}
                              </span>
                              {p.isOnSale && p.originalPrice && p.originalPrice > p.price && (
                                <span className="text-xs text-stone-400 line-through block -mt-1 font-sans">{formatPrice(p.originalPrice)}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Consult button (Green) */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  consultProduct(p.name);
                                }}
                                className="h-8 w-8 rounded-full border border-emerald-100 bg-emerald-50 hover:bg-emerald-500 hover:text-white transition-all duration-300 flex items-center justify-center text-emerald-600 shrink-0 shadow-xs active:scale-95"
                                title="Consultar por WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </button>
                              {/* Add to Cart button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cartAdd(store.id, p.id);
                                  setCartOpen(true);
                                }}
                                style={{
                                  backgroundColor: "var(--primary)",
                                }}
                                className="h-8 px-4 rounded-full text-white hover:opacity-90 transition-all duration-300 flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase shadow-sm active:scale-95 font-sans"
                              >
                                <Plus className="h-3 w-3" />
                                Añadir
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 3. Navigation and Search Block (Search + Categories) */}
            <div className="space-y-6 font-sans relative z-10">
              {/* Search Bar at full width */}
              {mode === "catalog" && (
                <div className="relative w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--primary)]" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={store.niche === "floreria" ? "¿Buscas algún arreglo floral en especial?" : "¿Qué estás buscando hoy?"}
                    style={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                    }}
                    className="w-full rounded-full pl-10 pr-4 py-2.5 text-sm outline-none transition placeholder-muted-foreground focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] shadow-sm"
                  />
                </div>
              )}

              {/* Inline Horizontal Category Selector */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-left">
                  Categorías
                </h3>
                
                {/* TWO-DIV PATTERN to prevent vertical clipping on scale and shadow */}
                <div className="overflow-x-auto scrollbar-none -mx-4 py-3 sm:-mx-4 sm:py-3">
                  <div className="flex gap-2.5 px-4 w-max min-w-full">
                    <button
                      onClick={() => setActiveCat("all")}
                      style={{
                        borderColor: activeCat === "all" ? "var(--primary)" : "var(--border)",
                        backgroundColor: activeCat === "all" ? "var(--primary)" : "var(--card)",
                        color: activeCat === "all" ? (effectiveIsDark ? "#000" : "#fff") : "var(--foreground)",
                      }}
                      className={cn(
                        "flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all duration-300 shrink-0 text-xs font-bold uppercase tracking-wider backdrop-blur-sm",
                        activeCat === "all"
                          ? "shadow-sm scale-105 font-extrabold"
                          : "hover:bg-primary/5"
                      )}
                    >
                      <LayoutGrid className="h-4 w-4 shrink-0" style={{ color: activeCat === "all" ? (effectiveIsDark ? "#000" : "#fff") : "var(--primary)" }} />
                      <span>Ver Todo</span>
                    </button>

                    {/* Ofertas */}
                    {store.products.some(p => p.isOnSale) && (
                      <button
                        onClick={() => setActiveCat("sale")}
                        style={{
                          borderColor: activeCat === "sale" ? "var(--primary)" : "var(--border)",
                          backgroundColor: activeCat === "sale" ? "var(--primary)" : "var(--card)",
                          color: activeCat === "sale" ? (effectiveIsDark ? "#000" : "#fff") : "var(--foreground)",
                        }}
                        className={cn(
                          "flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all duration-300 shrink-0 text-xs font-bold uppercase tracking-wider backdrop-blur-sm",
                          activeCat === "sale"
                            ? "shadow-sm scale-105 font-extrabold"
                            : "hover:bg-primary/5"
                        )}
                      >
                        <Flame className="h-4 w-4 shrink-0" style={{ color: activeCat === "sale" ? (effectiveIsDark ? "#000" : "#fff") : "#ef4444" }} />
                        <span>Ofertas</span>
                      </button>
                    )}

                    {store.categories.map((c) => {
                      const { label, iconKey } = parseCategoryName(c.name);
                      const active = activeCat === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setActiveCat(c.id)}
                          style={{
                            borderColor: active ? "var(--primary)" : "var(--border)",
                            backgroundColor: active ? "var(--primary)" : "var(--card)",
                            color: active ? (effectiveIsDark ? "#000" : "#fff") : "var(--foreground)",
                          }}
                          className={cn(
                            "flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all duration-300 shrink-0 text-xs font-bold uppercase tracking-wider backdrop-blur-sm",
                            active
                              ? "shadow-sm scale-105 font-extrabold"
                              : "hover:bg-primary/5"
                          )}
                        >
                          {iconKey ? (
                            <CategoryIcon 
                              iconKey={iconKey} 
                              className="h-4 w-4 shrink-0" 
                              style={{ color: active ? (effectiveIsDark ? "#000" : "#fff") : "var(--primary)" }}
                            />
                          ) : (
                            <Utensils 
                              className="h-4 w-4 shrink-0" 
                              style={{ color: active ? (effectiveIsDark ? "#000" : "#fff") : "var(--primary)" }}
                            />
                          )}
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Product Grid */}
            <div className="space-y-4 relative z-10">
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 text-left">
                {activeCat === "all" ? "Nuestros Productos" : parseCategoryName(store.categories.find(c => c.id === activeCat)?.name ?? "").label}
              </h3>
              {(() => {
                const gridProducts = activeCat === "all"
                  ? filtered.filter((p) => !(p.description?.includes("#destacado") || p.name?.includes("#destacado")))
                  : filtered;
                
                if (gridProducts.length === 0) {
                  return (
                    <div className={cn(
                      "text-center py-12 text-xs text-stone-400 shadow-xs",
                      store.niche === "floreria"
                        ? "border border-rose-100/50 rounded-[2rem] bg-white/50"
                        : "border border-[var(--border)] rounded-3xl bg-[var(--card)]/50"
                    )}>
                      {store.niche === "floreria" ? "No hay arreglos florales en esta categoría." : "No hay productos en esta categoría."}
                    </div>
                  );
                }
                
                return (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {gridProducts.map((p) => (
                      <article
                        key={p.id}
                        className={cn(
                          "overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-300 group",
                          store.niche === "floreria"
                            ? "border border-rose-100/30 rounded-[2.5rem_0.5rem_2.5rem_0.5rem] bg-white/70 hover:bg-white hover:scale-[1.02] shadow-[0_4px_15px_rgba(253,244,245,0.5)] hover:shadow-[0_8px_25px_rgba(251,207,214,0.25)]"
                            : "border border-[var(--border)] rounded-2xl bg-[var(--card)]/75 hover:bg-[var(--card)] hover:scale-[1.02] shadow-sm hover:shadow-md"
                        )}
                        onClick={() => setViewingProduct(p)}
                      >
                        <div>
                          {/* Asymmetric or standard image wrapper */}
                          <div className={cn(
                            "relative overflow-hidden aspect-square m-2",
                            store.niche === "floreria"
                              ? "bg-rose-50/20 rounded-[2rem_0.5rem_2rem_0.5rem] border border-rose-100/20"
                              : "bg-muted rounded-xl border border-[var(--border)]"
                          )}>
                            <img
                              src={p.image || "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=600&q=80"}
                              alt={p.name}
                              className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                            {p.isOnSale && (
                              <span 
                                style={{
                                  backgroundColor: store.niche === "floreria" ? undefined : "var(--primary)",
                                }}
                                className={cn(
                                  "absolute top-2.5 right-2.5 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow z-10",
                                  store.niche === "floreria" ? "bg-rose-500" : ""
                                )}
                              >
                                Oferta
                              </span>
                            )}
                          </div>
                          {/* Info */}
                          <div className="p-3 pt-1 space-y-1 text-left">
                            <h4 className={cn(
                              "font-semibold text-sm text-stone-800 transition-colors line-clamp-1",
                              store.niche === "floreria" ? "font-serif group-hover:text-rose-600" : "font-sans group-hover:text-[var(--primary)]"
                            )}>
                              {p.name}
                            </h4>
                            {p.description && (
                              <p className="text-[11px] text-stone-500 line-clamp-2 h-7 leading-normal font-sans">
                                {p.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Price & Action */}
                        <div className="px-3 pb-3.5 pt-0 flex flex-col sm:flex-row sm:items-center justify-between mt-auto gap-2">
                          <div className="flex flex-col text-left px-0.5">
                            <span className="text-sm font-semibold text-rose-600 font-sans" style={{ color: "var(--primary)" }}>{formatPrice(p.price)}</span>
                            {p.isOnSale && p.originalPrice && p.originalPrice > p.price && (
                              <span className="text-[10px] text-stone-400 line-through -mt-1 font-sans">{formatPrice(p.originalPrice)}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            {/* Consult button (Green) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                consultProduct(p.name);
                              }}
                              className="h-8 w-8 rounded-full border border-emerald-100 bg-emerald-50 hover:bg-emerald-500 hover:text-white transition-all duration-300 flex items-center justify-center text-emerald-600 shrink-0 shadow-xs active:scale-95"
                              title="Consultar por WhatsApp"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </button>
                            {/* Add to Cart button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                cartAdd(store.id, p.id);
                                setCartOpen(true);
                              }}
                              style={{
                                backgroundColor: "var(--primary)",
                              }}
                              className="h-8 px-3 rounded-full text-white hover:opacity-90 transition-all duration-300 flex items-center justify-center gap-1 text-[10px] font-bold tracking-wider uppercase shadow-xs active:scale-95 font-sans"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Añadir
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        ) : cfg.layout === "banner_grid" ? (
          /* ── BANNER GRID layout: portada con imagen ajustable + grid 2 columnas estilo app */
          <div className="space-y-4">
            {/* Banner de portada */}
            {activeBanners[0] ? (
              <div className="relative w-full overflow-hidden" style={{ borderRadius: cfg.cardRounded, aspectRatio: "16/7" }}>
                <img
                  src={activeBanners[0]}
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
            {(() => {
              const buttonStyleId = store.bioButtonStyle || "pill-solid";
              const { shape, type, radiusClass } = getButtonStyle(buttonStyleId);

              const customBg = store.bioButtonColor || store.brandColor || "#1f2937";
              const customText = store.bioButtonTextColor || "#ffffff";

              let bg = customBg;
              let borderColor = customBg;
              let color = customText;
              let extraClasses = "";

              if (type === "solid") {
                bg = customBg;
                borderColor = customBg;
                color = customText;
              } else if (type === "outline") {
                bg = "transparent";
                borderColor = customBg;
                color = store.bioButtonTextColor || customBg;
              } else if (type === "glass") {
                bg = finalIsDark ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.06)";
                borderColor = finalIsDark ? "rgba(255, 255, 255, 0.15)" : "rgba(15, 23, 42, 0.12)";
                color = store.bioButtonTextColor || (finalIsDark ? "#ffffff" : "#0f172a");
                extraClasses = "backdrop-blur-md";
              }

              const hoverGlow = customBg.startsWith("linear") ? "#dc2743" : customBg;
              const isCustomColor = !!(store.bioButtonColor || store.bioButtonTextColor);
              const isMonochrome = type === "outline" || type === "glass" || isCustomColor;

              return (
                <Link
                  to="/t/$slug"
                  params={{ slug: store.slug }}
                  className={cn(
                    "relative w-full max-w-md mx-auto p-1.5 pr-6 font-extrabold uppercase text-xs tracking-widest transition-all duration-300 flex items-center shadow-md hover:scale-[1.02] active:scale-[0.98] border select-none group overflow-hidden hover:shadow-[0_0_20px_var(--hover-glow)] cursor-pointer",
                    radiusClass,
                    extraClasses,
                    bioTypography === "serif" ? "font-serif-editorial font-bold" :
                    bioTypography === "rounded" ? "font-sans-bloom" :
                    bioTypography === "modern" ? "font-sans-vibe" :
                    ""
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
                    <ShoppingBag className={cn(
                      "h-5 w-5",
                      isMonochrome ? "" : "text-primary"
                    )} />
                  </div>
                  <span className="flex-1 text-center pr-3">Ver Catálogo Completo</span>
                </Link>
              );
            })()}

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
            {isInAppBrowser() && (
              <div 
                className="text-[10px] text-amber-700 bg-amber-50/80 border border-amber-200 p-2.5 rounded-xl text-left leading-normal flex items-start gap-1.5 shadow-xs"
                style={{
                  borderRadius: cfg.cardRounded,
                }}
              >
                <span className="text-xs shrink-0">⚠️</span>
                <div>
                  <strong>¿La redirección falla?</strong> Toca los <strong>3 puntos (...)</strong> arriba a la derecha y elige <strong>"Abrir en el navegador"</strong> para poder enviar tu pedido.
                </div>
              </div>
            )}
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
          className="h-[92vh] rounded-t-3xl p-0 overflow-hidden flex flex-col border-0 md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:bottom-auto md:right-auto md:h-[70vh] md:max-w-3xl md:w-full md:rounded-3xl md:border md:shadow-2xl"
          style={{ backgroundColor: "var(--background)", color: "var(--foreground)", ...themeVars } as React.CSSProperties}
        >
          {viewingProduct && (
            <div className="flex flex-col h-full md:flex-row md:overflow-hidden">
              {/* Image — taller for overlay/magazine, shorter for editorial */}
              <div
                className="relative shrink-0 bg-background overflow-hidden md:w-1/2 md:!h-full"
                style={{
                  height: cfg.layout === "editorial" ? "200px" : cfg.layout === "overlay" || cfg.layout === "magazine" ? "320px" : "260px",
                  backgroundColor: "var(--background)",
                }}
              >
                {/* Close button (aspita) - Hidden on desktop since sheet renders one in top-right */}
                <button 
                  onClick={() => setViewingProduct(null)}
                  className="absolute top-4 right-4 z-50 h-10 w-10 flex items-center justify-center bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-all md:hidden"
                  style={{ borderRadius: cfg.cardRounded }}
                >
                  <X className="h-6 w-6" />
                </button>

                <img
                  src={productImages[viewingProduct.id] || viewingProduct.image || "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=85"}
                  alt={viewingProduct.name}
                  className="h-full w-full object-cover"
                  decoding="async"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=85"; }}
                />

                {/* Dark overlay for dark themes */}
                {effectiveIsDark && <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />}

                {/* Hardware-accelerated brightness reduction overlay instead of expensive CSS filter */}
                {effectiveIsDark && (cfg.layout === "overlay" || cfg.layout === "magazine") && (
                  <div className="absolute inset-0 bg-black/15 pointer-events-none" />
                )}

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

              {/* Right Column: Content + Actions */}
              <div className="flex-1 flex flex-col overflow-hidden md:h-full md:w-1/2 md:relative pr-2">
                {/* Content */}
                <div
                  className="flex-1 overflow-y-auto px-5 py-5 space-y-4 pt-10 md:pt-14"
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
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold"
                      style={{
                        backgroundColor: "var(--primary)" + "25",
                        color: "var(--primary)",
                        borderRadius: cfg.cardRounded,
                        border: `1px solid var(--primary)`,
                        borderColor: "var(--primary)" + "50",
                      }}
                    >
                      {(() => {
                        const cat = store.categories.find((c) => c.id === viewingProduct.categoryId);
                        if (!cat) return "";
                        const { label, iconKey } = parseCategoryName(cat.name);
                        return (
                          <>
                            {(cfg.layout === "bite" || cfg.layout === "bloom") && iconKey && (
                              <CategoryIcon 
                                iconKey={iconKey} 
                                className="h-3.5 w-3.5 shrink-0" 
                              />
                            )}
                            <span>{label}</span>
                          </>
                        );
                      })()}
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
                    onClick={() => { consultProduct(viewingProduct.name, viewingProduct.id); setViewingProduct(null); }}
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
              </div>
            </div>
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

      {/* ── In-App Browser Help Modal (TikTok/Instagram) ── */}
      {showInAppHelpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 relative animate-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={() => setShowInAppHelpModal(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center justify-center transition"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icon & Title */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <Info className="h-5 w-5 text-amber-600 dark:text-amber-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">Envío bloqueado por TikTok/Instagram</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Sigue estos sencillos pasos para completar tu pedido:</p>
              </div>
            </div>

            {/* Visual Guide Steps */}
            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 space-y-3.5 text-xs text-zinc-700 dark:text-zinc-300">
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0 mt-0.5">1</span>
                <div>
                  Toca los <strong>tres puntos (...)</strong> en la esquina superior derecha de tu pantalla.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0 mt-0.5">2</span>
                <div>
                  Selecciona la opción <strong>"Abrir en el navegador"</strong> (o <em>"Open in browser"</em>).
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0 mt-0.5">3</span>
                <div>
                  ¡Listo! Tu catálogo se abrirá en Chrome/Safari y podrás presionar <strong>"Enviar pedido por WhatsApp"</strong> sin bloqueos.
                </div>
              </div>
            </div>

            {/* Copiar pedido banner */}
            <div className="space-y-2">
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-center">O copia el texto del pedido y envíalo manualmente:</p>
              <button
                onClick={() => {
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(pendingOrderMsg).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }).catch(() => {
                      fallbackCopy(pendingOrderMsg);
                    });
                  } else {
                    fallbackCopy(pendingOrderMsg);
                  }
                }}
                className={cn(
                  "w-full h-11 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border transition",
                  copied 
                    ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900 dark:text-green-400"
                    : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                )}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ¡Mensaje Copiado al Portapapeles!
                  </>
                ) : (
                  <>
                    <ClipboardList className="h-4 w-4 text-zinc-500" />
                    Copiar texto del pedido
                  </>
                )}
              </button>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowInAppHelpModal(false)}
                className="flex-1 h-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold transition text-zinc-700 dark:text-zinc-300"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  window.open(buildWaUrl(store.phone, pendingOrderMsg), "_blank");
                  setShowInAppHelpModal(false);
                }}
                style={{
                  backgroundColor: "var(--primary)",
                  color: effectiveIsDark ? "#000" : "#fff",
                }}
                className="flex-[1.5] h-12 rounded-2xl font-bold text-xs transition hover:opacity-90 flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="h-4 w-4" />
                Intentar continuar
              </button>
            </div>
          </div>
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
