import { useMemo, useState } from "react";
import {
  Search,
  ShoppingBag,
  Plus,
  Minus,
  MessageCircle,
  Flame,
  Trash2,
  X,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useApp, useCart } from "@/lib/store";
import { buildWaUrl, formatPrice } from "@/lib/whatsapp";
import type { Store, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

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

const DEFAULT_CONFIG: ModelConfig = MODEL_CONFIGS.minimalista;

export function PublicCatalog({ store }: { store: Store }) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>(
    store.categories?.length === 1 ? store.categories[0].id : "all"
  );
  const [cartOpen, setCartOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  const cart = useCart((s) => s.carts[store.id] ?? EMPTY_CART);
  const cartAdd = useCart((s) => s.add);
  const cartSet = useCart((s) => s.setQty);
  const cartRemove = useCart((s) => s.remove);
  const cartClear = useCart((s) => s.clear);
  const incClicks = useApp((s) => s.incWhatsappClicks);

  /* ── Theme setup ─────────────────────────────────── */
  const modelId = store.model || "minimalista";
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

  /* ── Derived data ────────────────────────────────── */
  const filtered = useMemo(() => {
    const products = store.products || [];
    // If we have only sample products, we show them regardless of category mismatch (common in new stores)
    const hasOnlySamples = products.length > 0 && products.every(p => p.isSample);
    
    return products
      .filter((p) => p.visible)
      .filter((p) => {
        if (activeCat === "all") return true;
        if (activeCat === "sale") return p.isOnSale;
        // Relax category filter for samples to avoid "empty store" on new accounts
        if (hasOnlySamples && activeCat === "all") return true;
        return p.categoryId === activeCat;
      })
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  }, [store.products, activeCat, query]);

  const cartCount = cart.reduce((a, c) => a + c.qty, 0);
  const cartLines = cart
    .map((c) => {
      const product = (store.products || []).find((p) => p.id === c.productId);
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

  const supportClick = () => {
    incClicks(store.id);
    window.open(buildWaUrl(store.phone, `Hola ${store.name}, tengo una consulta.`), "_blank");
  };

  /* ── Render ──────────────────────────────────────── */
  return (
    <div
      className={cn("min-h-screen bg-background text-foreground transition-colors duration-300", effectiveIsDark ? "dark" : "")}
      style={themeVars}
      translate="no"
    >
      {/* Preview banner */}
      {!store.isPublished && (
        <div className="bg-primary/20 border-b border-primary/30 text-primary px-4 py-1.5 text-center text-[10px] font-bold uppercase tracking-widest">
          Modo Previsualización — Solo tú puedes ver esto
        </div>
      )}

      {/* ── Header ───────────────────────────────────── */}
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

          <button
            onClick={supportClick}
            className="shrink-0 h-8 px-3 rounded-full border border-primary/20 bg-primary/5 text-primary text-[11px] font-bold uppercase tracking-wider hover:bg-primary/10 transition"
          >
            Contacto
          </button>
        </div>

        {/* Search */}
        <div className="mx-auto max-w-5xl px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="¿Qué estás buscando hoy?"
              className="w-full rounded-full bg-secondary pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring transition"
            />
          </div>
        </div>

        {/* Category chips */}
        <div className="mx-auto max-w-5xl px-4 pb-3 overflow-x-auto scrollbar-none">
          <div className="flex gap-2 w-max">
            {store.categories.length > 1 && (
              <Chip active={activeCat === "all"} onClick={() => setActiveCat("all")} cfg={cfg}>
                Todos
              </Chip>
            )}
            {(store.categories || []).map((c) => (
              <Chip key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)} cfg={cfg}>
                {c.name}
              </Chip>
            ))}
            <Chip active={activeCat === "sale"} onClick={() => setActiveCat("sale")} cfg={cfg}>
              <Flame className="h-3 w-3 mr-1 inline" />
              Ofertas
            </Chip>
          </div>
        </div>
      </header>

      {/* ── Product Area ──────────────────────────────── */}
      <main className="mx-auto max-w-5xl px-4 pt-6 pb-32">
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground text-sm">No encontramos productos.</div>
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
                    <div className="flex gap-1 justify-center pt-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); consultProduct(p.name); }}
                        className="flex-1 py-1.5 text-[10px] uppercase tracking-widest border transition hover:opacity-70 font-medium"
                        style={{ borderColor: "var(--border)", color: "var(--foreground)", borderRadius: "999px" }}
                      >
                        Consultar
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); cartAdd(store.id, p.id); }}
                        className="h-7 w-7 flex items-center justify-center transition hover:opacity-80"
                        style={{ backgroundColor: "var(--primary)", color: effectiveIsDark ? "#000" : "#fff", borderRadius: "999px" }}
                      >
                        <Plus className="h-3 w-3" />
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
      </main>

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
                  src={viewingProduct.image || "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=85"}
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

    </div>
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
