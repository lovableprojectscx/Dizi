import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Sparkles, Palette, Image, Utensils, Check, Flame, Coffee, AlertTriangle, Plus, BookOpen, LayoutGrid, Leaf, Grid, Columns, Sliders, ChevronDown, Eye, Lock, Megaphone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PublicCatalog } from "@/components/public/PublicCatalog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/diseno-premium")({
  component: DisenoPremiumPage,
});

/* ─────────────────────────────────────────────────────────
   COLOR SWATCH FOR RESTAURANT
   ───────────────────────────────────────────────────────── */
function ColorSwatch({
  colors, selected, onSelect, allowCustom = false, customLabel = "Personalizado",
}: {
  colors: { id: string; name: string; hex: string; display: string }[];
  selected: string;
  onSelect: (hex: string) => void;
  allowCustom?: boolean;
  customLabel?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2.5 items-center">
      {colors.map((c) => {
        const active = selected === c.hex;
        return (
          <button
            key={c.id}
            type="button"
            title={c.name}
            onClick={() => onSelect(c.hex)}
            className={cn(
              "relative h-9 w-9 rounded-full border-2 transition-all hover:scale-110",
              active
                ? "border-foreground ring-2 ring-foreground/20 scale-110 shadow-lg"
                : "border-transparent shadow-sm"
            )}
            style={{ backgroundColor: c.display }}
          >
            {active && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Check className="h-3.5 w-3.5 text-white drop-shadow" />
              </div>
            )}
          </button>
        );
      })}

      {allowCustom && (
        <div className="flex items-center gap-2 border-l pl-2.5 ml-0.5" style={{ borderColor: "var(--border)" }}>
          <div
            className={cn(
              "relative h-9 w-9 rounded-full overflow-hidden transition-all hover:scale-110 shrink-0 shadow-sm border-2",
              selected && !colors.find(c => c.hex === selected)
                ? "border-foreground ring-2 ring-foreground/20 scale-110 shadow-lg"
                : "border-dashed border-border"
            )}
            title={customLabel}
          >
            <input
              type="color"
              value={selected || "#000000"}
              onChange={(e) => onSelect(e.target.value)}
              className="absolute -inset-4 h-20 w-20 cursor-pointer"
            />
            {selected && !colors.find(c => c.hex === selected) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Check className="h-3.5 w-3.5 drop-shadow text-white mix-blend-difference" />
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold">{customLabel}</span>
            {selected && !colors.find(c => c.hex === selected) && (
              <span className="text-[10px] font-mono text-muted-foreground uppercase">{selected}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const PREMIUM_TEMPLATES: Record<string, { id: string; name: string; description: string; image: string; defaultColor: string }[]> = {
  general: [
    {
      id: "bloom",
      name: "Estándar Premium",
      description: "Diseño premium multipropósito limpio y moderno para cualquier tipo de negocio. Cuenta con carrusel de banners superiores, sección de productos destacados, grilla de productos simétrica de esquinas suaves y buscador inteligente.",
      image: "/images/standard_premium_mockup.png",
      defaultColor: "#FF823A"
    },
    {
      id: "lookbook",
      name: "Lookbook Editorial",
      description: "Inspirado en catálogos de lujo y revistas de diseño. Muestra cada artículo a página completa con números de índice gigantes, tipografía serif estilizada, cero emojis y botones de compra integrados y discretos.",
      image: "/images/mockups/luxury.png",
      defaultColor: "#8b7365"
    }
  ],
  hamburgueseria: [
    {
      id: "bite",
      name: "Bite Burger",
      description: "Diseño premium oscuro con carrusel de destacados superior, grilla de productos 1:1, selector de categorías con iconos vectoriales y banner panorámico.",
      image: "/images/mockups/restaurant.png",
      defaultColor: "#ea580c"
    }
  ],
  floreria: [
    {
      id: "bloom",
      name: "Bloom Floral",
      description: "Diseño premium ligero y sumamente elegante para florerías y florerías boutique. Cuenta con carrusel de arreglos destacados, grilla de productos con bordes suaves de arco orgánico, selector de categorías con iconos botánicos y una paleta de colores primaveral y sofisticada.",
      image: "/images/mockups/boutique.png",
      defaultColor: "#be185d"
    },
    {
      id: "nature",
      name: "Eco Nature",
      description: "Diseño premium orgánico e innovador inspirado en la sostenibilidad botánica. Utiliza tipografías serif refinadas, paleta verde salvia y crema, bordes de cápsula ultra redondeados, y banners con líneas fluidas para una estética natural y moderna.",
      image: "/images/mockups/eco.png",
      defaultColor: "#4b5c43"
    }
  ]
};

/* ─────────────────────────────────────────────────────────
   PAGE COMPONENT
   ───────────────────────────────────────────────────────── */
function DisenoPremiumPage() {
  const id = useApp((s) => s.currentStoreId);
  const store = useApp((s) => s.stores.find((st) => st.id === id));
  const update = useApp((s) => s.updateStore);

  if (!store) return null;

  // ── PLAN VERIFICATION ──
  const isPremiumPlan = store.plan === "pro" || store.plan === "ilimitado";
  if (!isPremiumPlan) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-16 text-center space-y-8 animate-in fade-in duration-300">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
          <Sparkles className="h-10 w-10 animate-pulse" />
        </div>
        <div className="max-w-xl mx-auto space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Diseños Premium Exclusivos</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Los diseños premium de alta costura optimizados para rubros específicos (como <strong>Florerías - Bloom</strong> y <strong>Hamburgueserías - Bite</strong>), carruseles multi-banner y botoneras duales son exclusivos para el <strong>Plan Catálogo Pro</strong> e <strong>Ilimitado</strong>.
          </p>
        </div>
        <div className="p-6 border rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-zinc-200/60 dark:border-zinc-800 max-w-md mx-auto shadow-sm">
          <p className="text-xs text-muted-foreground leading-normal">
            Tu tienda actual se encuentra en el plan <strong>{store.plan.toUpperCase()}</strong>. Actualiza ahora para desbloquear toda la potencia visual del sistema.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <a
            href="https://wa.me/51925176472?text=Hola%20Dizi%2C%20quiero%20actualizar%20mi%20tienda%20al%20Plan%20Pro%20para%20desbloquear%20los%20dise%C3%B1os%20premium"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-orange-500 hover:bg-orange-600 px-6 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all active:scale-95 cursor-pointer"
          >
            Actualizar mi Plan por WhatsApp
          </a>
        </div>
      </div>
    );
  }

  const maxBanners = store.plan === "ilimitado" ? 5 : 3;

  const [selectedTemplate, setSelectedTemplate] = useState(() => {
    if (store.model && store.model !== "default") return store.model;
    if (store.niche === "floreria") return "bloom";
    if (store.niche === "hamburgueseria") return "bite";
    return "bloom"; // Default to bloom layout (which will adapt to Estándar Premium)
  });
  const [premiumModel, setPremiumModel] = useState<"general" | "hamburgueseria" | "floreria">(() => {
    if (store.niche === "general" || store.niche === "floreria" || store.niche === "hamburgueseria") {
      return store.niche as any;
    }
    return "general";
  });
  const [brandColor, setBrandColor] = useState(store.brandColor || "#FF823A");
  const [bgColor, setBgColor] = useState(() => {
    if (store.bgColor) return store.bgColor;
    const defaultModel = store.model && store.model !== "default" ? store.model : (store.niche === "floreria" ? "bloom" : store.niche === "hamburgueseria" ? "bite" : "bloom");
    return defaultModel === "bite" ? "#09090b" : defaultModel === "bloom" && store.niche === "floreria" ? "#fffaf8" : "#ffffff";
  });
  const [textColor, setTextColor] = useState(store.textColor || "");
  const [bannerImages, setBannerImages] = useState<string[]>(() => {
    const raw = (store as any).bannerImage || "";
    return raw ? (raw.includes("|||") ? raw.split("|||") : [raw]) : [];
  });
  const [bannerTitle, setBannerTitle] = useState((store as any).bannerTitle || "");
  const [bannerTagline, setBannerTagline] = useState((store as any).bannerTagline || "");
  const [bannerBottomTag, setBannerBottomTag] = useState((store as any).bannerBottomTag || "");
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeCustomizerTab, setActiveCustomizerTab] = useState<"estilo" | "colores" | "banners" | "ajustes" | "cintillo">("estilo");
  const [bannerStyle, setBannerStyle] = useState<"direct" | "framed" | "curved">("framed");
  const [catalogTypography, setCatalogTypography] = useState<"sans" | "serif" | "rounded" | "modern">("sans");
  const [cardStyle, setCardStyle] = useState<"standard" | "flat" | "shadow" | "curved">("standard");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [promoBarEnabled, setPromoBarEnabled] = useState(store.promoBarEnabled || false);
  const [promoBarText, setPromoBarText] = useState(store.promoBarText || "");
  const [promoBarActionType, setPromoBarActionType] = useState<"none" | "product" | "category" | "url" | "coupon" | "cart">(
    store.promoBarActionType || "none"
  );
  const [promoBarActionValue, setPromoBarActionValue] = useState(store.promoBarActionValue || "");
  const [promoBarBgColor, setPromoBarBgColor] = useState(store.promoBarBgColor || "");
  const [promoBarTextColor, setPromoBarTextColor] = useState(store.promoBarTextColor || "");
  const [promoBarIsMarquee, setPromoBarIsMarquee] = useState(store.promoBarIsMarquee || false);

  const applyTemplateDefaults = (templateId: string, nicheId: string) => {
    if (templateId === "bloom" && nicheId === "floreria") {
      setBannerStyle("curved");
      setCatalogTypography("serif");
      setCardStyle("curved");
      setActiveCustomizerTab("estilo");
    } else if (templateId === "nature" && nicheId === "floreria") {
      setBannerStyle("curved");
      setCatalogTypography("serif");
      setCardStyle("curved");
      setActiveCustomizerTab("estilo");
    } else if (templateId === "bite" && nicheId === "hamburgueseria") {
      setBannerStyle("framed");
      setCatalogTypography("sans");
      setCardStyle("standard");
      setActiveCustomizerTab("estilo");
    } else if (templateId === "lookbook" && nicheId === "general") {
      setBannerStyle("direct");
      setCatalogTypography("serif");
      setCardStyle("flat");
      setActiveCustomizerTab("estilo");
    } else if (templateId === "bloom" && nicheId === "general") {
      if (store.model === "bloom" && store.niche === "general") {
        setBannerStyle((store as any).bannerStyle || "framed");
        setCatalogTypography((store as any).catalogTypography || "sans");
        setCardStyle((store as any).cardStyle || "standard");
      } else {
        setBannerStyle("framed");
        setCatalogTypography("sans");
        setCardStyle("standard");
      }
    }
  };

  useEffect(() => {
    if (store && !isLoaded) {
      setBrandColor(store.brandColor || (store.niche === "floreria" ? "#be185d" : store.niche === "hamburgueseria" ? "#ea580c" : "#FF823A"));
      const defaultModel = store.model && store.model !== "default" ? store.model : (store.niche === "floreria" ? "bloom" : store.niche === "hamburgueseria" ? "bite" : "bloom");
      setBgColor(store.bgColor || (defaultModel === "bite" ? "#09090b" : defaultModel === "bloom" && store.niche === "floreria" ? "#fffaf8" : "#ffffff"));
      setTextColor(store.textColor || "");
      const raw = (store as any).bannerImage || "";
      setBannerImages(raw ? (raw.includes("|||") ? raw.split("|||") : [raw]) : []);
      setBannerTitle((store as any).bannerTitle || "");
      setBannerTagline((store as any).bannerTagline || "");
      setBannerBottomTag((store as any).bannerBottomTag || "");
      const activeNiche = store.niche === "floreria" ? "floreria" : store.niche === "hamburgueseria" ? "hamburgueseria" : "general";
      const activeModel = store.model && store.model !== "default" ? store.model : (activeNiche === "floreria" ? "bloom" : activeNiche === "hamburgueseria" ? "bite" : "bloom");
      setSelectedTemplate(activeModel);
      setPremiumModel(activeNiche);
      
      // Load customization variables
      setBannerStyle((store as any).bannerStyle || "framed");
      setCatalogTypography((store as any).catalogTypography || "sans");
      setCardStyle((store as any).cardStyle || "standard");
      setPromoBarEnabled(store.promoBarEnabled || false);
      setPromoBarText(store.promoBarText || "");
      setPromoBarActionType(store.promoBarActionType || "none");
      setPromoBarActionValue(store.promoBarActionValue || "");
      setPromoBarBgColor(store.promoBarBgColor || "");
      setPromoBarTextColor(store.promoBarTextColor || "");
      setPromoBarIsMarquee(store.promoBarIsMarquee || false);
      
      setIsLoaded(true);
    }
  }, [store, isLoaded]);

  const isDirty =
    store.model !== selectedTemplate ||
    brandColor !== (store.brandColor || "") ||
    (store.bgColor || "") !== (bgColor || "") ||
    textColor !== (store.textColor || "") ||
    bannerImages.filter(Boolean).join("|||") !== ((store as any).bannerImage || "") ||
    bannerTitle !== ((store as any).bannerTitle || "") ||
    bannerTagline !== ((store as any).bannerTagline || "") ||
    bannerBottomTag !== ((store as any).bannerBottomTag || "") ||
    store.niche !== premiumModel ||
    (store as any).bannerStyle !== bannerStyle ||
    (store as any).catalogTypography !== catalogTypography ||
    (store as any).cardStyle !== cardStyle ||
    promoBarEnabled !== (store.promoBarEnabled || false) ||
    promoBarText !== (store.promoBarText || "") ||
    promoBarActionType !== (store.promoBarActionType || "none") ||
    promoBarActionValue !== (store.promoBarActionValue || "") ||
    promoBarBgColor !== (store.promoBarBgColor || "") ||
    promoBarTextColor !== (store.promoBarTextColor || "") ||
    promoBarIsMarquee !== (store.promoBarIsMarquee || false);

  const save = async () => {
    const toastId = toast.loading("Guardando diseño...");
    try {
      const serialized = bannerImages.filter(Boolean).join("|||") || null;
      await update(store.id, {
        model: selectedTemplate,
        brandColor: brandColor || null,
        bgColor: bgColor || null,
        textColor: textColor || null,
        bannerImage: serialized,
        bannerTitle: bannerTitle || null,
        niche: premiumModel,
        bannerStyle: bannerStyle || null,
        catalogTypography: catalogTypography || null,
        cardStyle: cardStyle || null,
        bannerTagline: bannerTagline || null,
        bannerBottomTag: bannerBottomTag || null,
        promoBarEnabled,
        promoBarText,
        promoBarActionType,
        promoBarActionValue,
        promoBarBgColor: promoBarBgColor || null,
        promoBarTextColor: promoBarTextColor || null,
        promoBarIsMarquee,
      } as any);

      const updatedStore = useApp.getState().stores.find((st) => st.id === store.id);
      if (updatedStore) {
        const raw = (updatedStore as any).bannerImage ?? "";
        setBannerImages(raw ? (raw.includes("|||") ? raw.split("|||") : [raw]) : []);
        setPromoBarEnabled(updatedStore.promoBarEnabled || false);
        setPromoBarText(updatedStore.promoBarText || "");
        setPromoBarActionType(updatedStore.promoBarActionType || "none");
        setPromoBarActionValue(updatedStore.promoBarActionValue || "");
        setPromoBarBgColor(updatedStore.promoBarBgColor || "");
        setPromoBarTextColor(updatedStore.promoBarTextColor || "");
        setPromoBarIsMarquee(updatedStore.promoBarIsMarquee || false);
      }

      toast.success("Diseño de diseñador aplicado con éxito", { id: toastId });
    } catch (err) {
      console.error("[save diseño]", err);
      toast.error("Error al guardar. Revisa la consola.", { id: toastId });
    }
  };

  const PREMIUM_COLORS = {
    general: [
      { id: "orange",   name: "Naranja Atardecer", hex: "#FF823A", display: "#FF823A" },
      { id: "blue",     name: "Azul Eléctrico",   hex: "#2563eb", display: "#2563eb" },
      { id: "emerald",  name: "Verde Esmeralda",  hex: "#10b981", display: "#10b981" },
      { id: "violet",   name: "Violeta Profundo", hex: "#7c3aed", display: "#7c3aed" },
    ],
    hamburgueseria: [
      { id: "orange",  name: "Naranja Fuego",     hex: "#ea580c", display: "#ea580c" },
      { id: "amber",   name: "Ámbar Cálido",      hex: "#d97706", display: "#d97706" },
      { id: "yellow",  name: "Amarillo Mostaza",  hex: "#eab308", display: "#eab308" },
      { id: "red",     name: "Rojo Salsa",        hex: "#dc2626", display: "#dc2626" },
    ],
    floreria: [
      { id: "rose",     name: "Rosa Silvestre",    hex: "#be185d", display: "#be185d" },
      { id: "pink",     name: "Rosa Pastel",       hex: "#ec4899", display: "#ec4899" },
      { id: "emerald",  name: "Verde Follaje",     hex: "#059669", display: "#059669" },
      { id: "burgundy", name: "Rojo Borgoña",      hex: "#881337", display: "#881337" },
    ]
  };

  const PREMIUM_BG_COLORS = {
    general: [
      { id: "pure-white",   name: "Blanco Puro (Sugerido)", hex: "#ffffff", display: "#ffffff" },
      { id: "neutral-gray",  name: "Gris Claro",           hex: "#f8fafc", display: "#f8fafc" },
      { id: "dark-slate",    name: "Oscuro Premium",       hex: "#0f172a", display: "#0f172a" },
    ],
    hamburgueseria: [
      { id: "dark-charcoal", name: "Carbón Oscuro (Sugerido)", hex: "#09090b", display: "#09090b" },
      { id: "dark-slate",    name: "Pizarra Oscura",        hex: "#0f172a", display: "#0f172a" },
      { id: "neutral-gray",  name: "Gris Neutro",          hex: "#fafaf9", display: "#fafaf9" },
    ],
    floreria: [
      { id: "soft-cream",   name: "Crema Suave (Sugerido)", hex: "#fffaf8", display: "#fffaf8" },
      { id: "pure-white",   name: "Blanco Puro",          hex: "#ffffff", display: "#ffffff" },
      { id: "soft-lavanda",  name: "Lavanda Suave",        hex: "#faf5ff", display: "#faf5ff" },
      { id: "soft-menta",    name: "Menta Suave",          hex: "#f4fdf4", display: "#f4fdf4" },
    ]
  };

  const selectedNicheColors = PREMIUM_COLORS[premiumModel] || PREMIUM_COLORS.general;

  const previewStore = {
    ...store,
    model: selectedTemplate,
    brandColor: brandColor,
    bgColor: bgColor,
    textColor: textColor,
    bannerImage: bannerImages.filter(Boolean).join("|||"),
    bannerTitle: bannerTitle,
    niche: premiumModel,
    bannerStyle: bannerStyle,
    catalogTypography: catalogTypography,
    cardStyle: cardStyle,
    bannerTagline: bannerTagline,
    bannerBottomTag: bannerBottomTag,
    promoBarEnabled: promoBarEnabled,
    promoBarText: promoBarText,
    promoBarActionType: promoBarActionType,
    promoBarActionValue: promoBarActionValue,
    promoBarBgColor: promoBarBgColor,
    promoBarTextColor: promoBarTextColor,
    promoBarIsMarquee: promoBarIsMarquee,
  };

  const premiumModelNames: Record<string, string> = {
    general: "Estándar Premium",
    hamburgueseria: "Hamburguesería",
    floreria: "Florería & Regalos",
    restaurante: "Restaurante Gourmet",
    cafeteria: "Cafetería & Pastelería",
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b pb-5 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-orange-500" />
            Personalizador de Diseños Premium
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Diseña un catálogo premium autogestionable optimizado para el nicho comercial de tu negocio.
          </p>
        </div>
        <Badge className="bg-orange-500/10 text-orange-500 border border-orange-500/20 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {store.model && store.model !== "default" ? `Diseño ${store.model.toUpperCase()} Activo` : "Diseño Estándar Activo"}
        </Badge>
      </div>

      {/* ── Sub-navigation slider tabs ───────────────── */}
      <div className="bg-zinc-100/80 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl p-1.5 w-full flex gap-1 shadow-sm border border-zinc-200/40 dark:border-zinc-800/40 mb-8 sticky top-14 z-30 overflow-x-auto scrollbar-none">
        {[
          { id: "estilo", label: "Estilo & Plantilla", icon: Sparkles },
          { id: "colores", label: "Paleta de Colores", icon: Palette },
          { id: "banners", label: "Portada & Banners", icon: Image },
          { id: "ajustes", label: "Ajustes de Diseño", icon: Sliders },
          { id: "cintillo", label: "Cintillo de Anuncios", icon: Megaphone },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeCustomizerTab === tab.id;
          const isAjustesDisabled = tab.id === "ajustes" && !(selectedTemplate === "bloom" && premiumModel === "general");
          
          return (
            <button
              key={tab.id}
              type="button"
              disabled={isAjustesDisabled}
              onClick={() => setActiveCustomizerTab(tab.id as any)}
              className={cn(
                "flex-grow py-3 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer select-none",
                active
                  ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 shadow-sm border border-zinc-200/20"
                  : isAjustesDisabled
                    ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed opacity-50"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
              title={isAjustesDisabled ? "Disponible solo para Estándar Premium" : undefined}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-orange-500" : "text-zinc-400")} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
              {isAjustesDisabled && <Lock className="h-3 w-3 text-zinc-400 dark:text-zinc-650 inline-block shrink-0" />}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col lg:flex-row gap-10 items-start">
        {/* Left Side: Configuration Controls */}
        <div className="flex-1 w-full max-w-2xl space-y-8">

          {/* TAB 1: ESTILO & PLANTILLA */}
          {activeCustomizerTab === "estilo" && (
            <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900">Seleccionar Diseño Premium</h3>
                  <p className="text-xs text-zinc-500">Selecciona el diseño premium que deseas aplicar y previsualizar en el simulador móvil.</p>
                </div>
              </div>

               {/* Nicho Selection Tabs */}
              <div className="flex gap-2 p-1 bg-zinc-100 rounded-2xl w-full max-w-md mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setPremiumModel("general");
                    setSelectedTemplate("bloom");
                    setBrandColor("#FF823A");
                    setBgColor("#ffffff");
                    applyTemplateDefaults("bloom", "general");
                  }}
                  className={cn(
                    "flex-grow py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    premiumModel === "general"
                      ? "bg-white text-zinc-955 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900"
                  )}
                >
                  General / Multirubro
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPremiumModel("hamburgueseria");
                    setSelectedTemplate("bite");
                    setBrandColor("#ea580c");
                    setBgColor("#09090b");
                    applyTemplateDefaults("bite", "hamburgueseria");
                  }}
                  className={cn(
                    "flex-grow py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    premiumModel === "hamburgueseria"
                      ? "bg-white text-zinc-955 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900"
                  )}
                >
                  Hamburguesería
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPremiumModel("floreria");
                    setSelectedTemplate("bloom");
                    setBrandColor("#be185d");
                    setBgColor("#fffaf8");
                    applyTemplateDefaults("bloom", "floreria");
                  }}
                  className={cn(
                    "flex-grow py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    premiumModel === "floreria"
                      ? "bg-white text-zinc-955 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900"
                  )}
                >
                  Florería Boutique
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(PREMIUM_TEMPLATES[premiumModel] || []).map((tpl) => {
                  const active = selectedTemplate === tpl.id;
                  const isCurrentInProduction = store.model === tpl.id && store.niche === premiumModel;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => {
                        setSelectedTemplate(tpl.id);
                        setPremiumModel(premiumModel);
                        setBrandColor(tpl.defaultColor);
                        setBgColor(tpl.id === "bite" ? "#09090b" : (tpl.id === "bloom" || tpl.id === "nature") && premiumModel === "floreria" ? "#fffaf8" : "#ffffff");
                        applyTemplateDefaults(tpl.id, premiumModel);
                      }}
                      className={cn(
                        "cursor-pointer flex flex-col rounded-2xl border-2 overflow-hidden transition-all hover:scale-[1.01] bg-zinc-50/20",
                        active
                          ? "border-orange-600 bg-orange-50/10 shadow-sm"
                          : "border-zinc-100 hover:border-zinc-200"
                      )}
                    >
                      {/* Thumbnail Image */}
                      <div className="h-32 bg-zinc-100 relative overflow-hidden">
                        <img src={tpl.image} alt={tpl.name} className="w-full h-full object-cover" />
                        {isCurrentInProduction ? (
                          <div className="absolute top-2 right-2 bg-green-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md">
                            Activo en Producción
                          </div>
                        ) : active ? (
                          <div className="absolute top-2 right-2 bg-orange-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md animate-pulse">
                            Previsualizando
                          </div>
                        ) : (
                          <div className="absolute top-2 right-2 bg-zinc-800/80 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md">
                            Click para Previsualizar
                          </div>
                        )}
                      </div>
                      {/* Details */}
                      <div className="p-4 space-y-1 text-left flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-extrabold text-sm text-zinc-800">{tpl.name}</h4>
                          <p className="text-[11px] text-zinc-500 leading-normal mt-1">{tpl.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: PALETA DE COLORES */}
          {activeCustomizerTab === "colores" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Card 2: Brand Color Selection */}
              <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                    <Palette className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-zinc-900">Color de Acento</h3>
                    <p className="text-xs text-zinc-500">Destaca botones, insignias de oferta y elementos interactivos.</p>
                  </div>
                </div>

                <ColorSwatch
                  colors={selectedNicheColors}
                  selected={brandColor}
                  onSelect={setBrandColor}
                  allowCustom
                  customLabel="Color personalizado"
                />
              </div>

              {/* Card 2.5: Background Color Selection */}
              <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                    <Palette className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-zinc-900">Color de Fondo</h3>
                    <p className="text-xs text-zinc-500">Personaliza el fondo del catálogo. Para el diseño Bloom se recomiendan tonos claros.</p>
                  </div>
                </div>

                <ColorSwatch
                  colors={PREMIUM_BG_COLORS[premiumModel] || PREMIUM_BG_COLORS.hamburgueseria}
                  selected={bgColor}
                  onSelect={setBgColor}
                  allowCustom
                  customLabel="Fondo personalizado"
                />
              </div>

              {/* Card 2.7: Text Color Selection */}
              <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                      <Sliders className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-zinc-900">Color del Texto</h3>
                      <p className="text-xs text-zinc-500">Color principal de textos, títulos y descripciones</p>
                    </div>
                  </div>
                  {textColor && (
                    <button
                      type="button"
                      onClick={() => setTextColor("")}
                      className="text-[10px] text-red-600 hover:underline font-bold"
                    >
                      Restablecer
                    </button>
                  )}
                </div>

                <ColorSwatch
                  colors={[
                    { id: "default", name: "Texto automático", hex: "", display: "#e2e8f0" },
                    { id: "dark", name: "Oscuro elegante", hex: "#111111", display: "#111111" },
                    { id: "light", name: "Blanco puro", hex: "#ffffff", display: "#ffffff" },
                    { id: "slate", name: "Pizarra", hex: "#475569", display: "#475569" },
                    { id: "muted", name: "Gris", hex: "#6b7280", display: "#6b7280" },
                  ]}
                  selected={textColor}
                  onSelect={setTextColor}
                  allowCustom
                  customLabel="Texto personalizado"
                />
              </div>
            </div>
          )}

          {/* TAB 3: PORTADA & BANNERS */}
          {activeCustomizerTab === "banners" && (
            <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Image className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900">
                    {premiumModel === "hamburgueseria" 
                      ? "Banner de Portada del Restaurante" 
                      : premiumModel === "floreria" 
                      ? "Banner de Portada de la Florería" 
                      : "Banner de Portada del Catálogo"}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {premiumModel === "hamburgueseria" 
                      ? "Imagen panorámica superior que define la identidad de tu cocina." 
                      : premiumModel === "floreria" 
                      ? "Imagen panorámica superior que define la identidad de tu florería." 
                      : "Imagen panorámica superior que define la identidad de tu negocio."}
                  </p>
                </div>
              </div>

              {/* Banner list in uploader */}
              {bannerImages.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-zinc-700 uppercase tracking-wider">Imágenes de Portada Activas ({bannerImages.length}/{maxBanners})</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {bannerImages.map((imgUrl, index) => (
                      <div key={index} className="relative aspect-[21/9] rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100 group">
                        <img src={imgUrl} alt={`Banner ${index + 1}`} className="w-full h-full object-cover animate-in fade-in duration-300" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <button
                          type="button"
                          onClick={() => {
                            setBannerImages(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all shadow-md text-xs font-bold z-10 cursor-pointer"
                        >
                          ✕
                        </button>
                        <span className="absolute bottom-1 left-1.5 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                          Banner {index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Specs notice */}
              <div className="flex items-start gap-3 rounded-2xl bg-zinc-50 border border-zinc-100 p-4">
                <svg className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-zinc-700">Dimensión sugerida: 21:9 panorámico (Soporta carrusel de hasta {maxBanners} portadas)</p>
                  <p className="text-[11px] text-zinc-500 leading-normal">
                    Puedes subir múltiples imágenes. En el catálogo público, se mostrarán como un carrusel premium con deslizamiento automático.
                  </p>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              {bannerImages.length < maxBanners ? (
                <label className={cn(
                  "flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all hover:bg-orange-50/20 hover:border-orange-500/50 border-zinc-200"
                )}>
                  <Plus className="h-8 w-8 text-zinc-400" />
                  <span className="text-sm font-bold text-zinc-700">Agregar Imagen de Portada</span>
                  <span className="text-xs text-zinc-400">Formatos JPG, PNG, WEBP de hasta 10 MB ({bannerImages.length}/{maxBanners})</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 10 * 1024 * 1024) { toast.error("La imagen supera el límite de 10 MB"); return; }
                      try {
                        const { convertImageToWebP } = await import("@/lib/image-utils");
                        const webp = await convertImageToWebP(file);
                        setBannerImages(prev => [...prev, webp]);
                      } catch { toast.error("Error al procesar la imagen."); }
                    }}
                  />
                </label>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-6 border border-dashed rounded-2xl border-zinc-200 bg-zinc-50 text-zinc-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Límite de Banners Alcanzado (5/5)</span>
                  <p className="text-[11px] text-center px-4 leading-normal">
                    Elimina uno de tus banners actuales para poder subir una nueva imagen.
                  </p>
                </div>
              )}

              {/* Banner Title, Tagline and Bottom Tag Inputs */}
              {selectedTemplate !== "bite" && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-zinc-700 uppercase tracking-wider">Título del Banner (Opcional)</label>
                    <input
                      type="text"
                      value={bannerTitle}
                      onChange={(e) => setBannerTitle(e.target.value)}
                      placeholder={selectedTemplate === "nature" ? "Equipamiento médico y soportes certificados" : `Catálogo ${store.name}`}
                      className="flex h-11 w-full rounded-2xl border border-zinc-200 bg-transparent px-4 py-2 text-sm shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500"
                    />
                  </div>

                  {(selectedTemplate === "nature" || selectedTemplate === "lookbook" || (selectedTemplate === "bloom" && premiumModel === "floreria")) && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-extrabold text-zinc-700 uppercase tracking-wider">Superetiqueta / Tagline Superior (Opcional)</label>
                        <input
                          type="text"
                          value={bannerTagline}
                          onChange={(e) => setBannerTagline(e.target.value)}
                          placeholder={premiumModel === "floreria" ? "Catálogo Eco-friendly & Botánico" : "Colección Exclusiva"}
                          className="flex h-11 w-full rounded-2xl border border-zinc-200 bg-transparent px-4 py-2 text-sm shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-extrabold text-zinc-700 uppercase tracking-wider">Etiqueta Inferior / Botón de Acción (Opcional)</label>
                        <input
                          type="text"
                          value={bannerBottomTag}
                          onChange={(e) => setBannerBottomTag(e.target.value)}
                          placeholder={premiumModel === "floreria" ? "Sostenible & Local" : "Diseño Exclusivo"}
                          className="flex h-11 w-full rounded-2xl border border-zinc-200 bg-transparent px-4 py-2 text-sm shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AJUSTES DE DISEÑO */}
          {activeCustomizerTab === "ajustes" && selectedTemplate === "bloom" && premiumModel === "general" && (
            <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Sliders className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900">Ajustes de Diseño</h3>
                  <p className="text-xs text-zinc-500">Personaliza la tipografía, tarjetas y cortes del banner para adaptar el diseño Estándar Premium a tu marca.</p>
                </div>
              </div>

              {/* Banner Style Selector */}
              <div className="space-y-4">
                <div className="flex flex-col gap-0.5">
                  <h4 className="font-bold text-xs text-zinc-800">Estilo del Corte de Portada</h4>
                  <p className="text-[10px] text-zinc-500">Controla cómo se integra el carrusel de banners con el catálogo.</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "direct", label: "Directo", desc: "Borde recto y full-width" },
                    { id: "framed", label: "Con Margen", desc: "Efecto recuadro flotante" },
                    { id: "curved", label: "Curvado", desc: "Curva orgánica premium" },
                  ].map((style) => {
                    const active = bannerStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setBannerStyle(style.id as any)}
                        className={cn(
                          "flex flex-col gap-1 p-3 rounded-xl border-2 text-left cursor-pointer transition-all hover:border-orange-500/50",
                          active ? "border-orange-600 bg-orange-50/10 shadow-xs" : "border-zinc-100 bg-zinc-50/30"
                        )}
                      >
                        <span className="text-[11px] font-bold text-zinc-900">{style.label}</span>
                        <span className="text-[9px] text-zinc-500 leading-snug">{style.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Typography Selector */}
              <div className="space-y-4">
                <div className="flex flex-col gap-0.5">
                  <h4 className="font-bold text-xs text-zinc-800">Tipografía del Catálogo</h4>
                  <p className="text-[10px] text-zinc-500">Elige la familia tipográfica que mejor represente la voz de tu marca.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: "sans", label: "Inter (Sans)", fontClass: "font-sans", desc: "Moderno & Limpio" },
                    { id: "serif", label: "Playfair (Serif)", fontClass: "font-serif-editorial", desc: "Elegante & Editorial" },
                    { id: "rounded", label: "Quicksand (Rounded)", fontClass: "font-sans-bloom", desc: "Cálido & Amigable" },
                    { id: "modern", label: "Outfit (Modern)", fontClass: "font-sans-vibe", desc: "Tecnológico & Premium" },
                  ].map((typo) => {
                    const active = catalogTypography === typo.id;
                    return (
                      <button
                        key={typo.id}
                        type="button"
                        onClick={() => setCatalogTypography(typo.id as any)}
                        className={cn(
                          "flex flex-col gap-1 p-3 rounded-xl border-2 text-left cursor-pointer transition-all hover:border-orange-500/50",
                          active ? "border-orange-600 bg-orange-50/10 shadow-xs" : "border-zinc-100 bg-zinc-50/30"
                        )}
                      >
                        <span className={cn("text-xs font-black text-zinc-900 block", typo.fontClass)}>{typo.label.split(" ")[0]}</span>
                        <span className="text-[9px] text-zinc-500 leading-snug">{typo.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card Style Selector */}
              <div className="space-y-4">
                <div className="flex flex-col gap-0.5">
                  <h4 className="font-bold text-xs text-zinc-800">Diseño de Tarjetas de Producto</h4>
                  <p className="text-[10px] text-zinc-500">Define el estilo visual, sombras y bordes de las tarjetas de tus productos.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: "standard", label: "Estándar", desc: "Esquinas suaves con sombra sutil" },
                    { id: "curved", label: "Curvado", desc: "Esquinas muy curvas orgánicas" },
                    { id: "flat", label: "Plano", desc: "Borde fino sin sombra" },
                    { id: "shadow", label: "Elevado", desc: "Sin borde con sombra elegante" },
                  ].map((card) => {
                    const active = cardStyle === card.id;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => setCardStyle(card.id as any)}
                        className={cn(
                          "flex flex-col gap-1 p-3 rounded-xl border-2 text-left cursor-pointer transition-all hover:border-orange-500/50",
                          active ? "border-orange-600 bg-orange-50/10 shadow-xs" : "border-zinc-100 bg-zinc-50/30"
                        )}
                      >
                        <span className="text-[11px] font-bold text-zinc-900">{card.label}</span>
                        <span className="text-[9px] text-zinc-500 leading-snug">{card.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CINTILLO DE ANUNCIOS */}
          {activeCustomizerTab === "cintillo" && (
            <div className="rounded-3xl border border-zinc-200/85 bg-white p-6 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div
                className="flex items-center gap-3 border-b pb-4"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Megaphone className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900 font-sans">Cintillo de Anuncios</h3>
                  <p className="text-xs text-zinc-555">
                    Muestra un aviso horizontal destacado en la parte superior de tu catálogo.
                  </p>
                </div>
              </div>

              {!(store.plan === "pro" || store.plan === "ilimitado") ? (
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50/50 p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4.5 w-4.5 text-zinc-400" />
                    <h4 className="font-extrabold text-xs text-zinc-955">
                      Cintillo de Anuncios Bloqueado
                    </h4>
                  </div>
                  <p className="text-[10px] text-zinc-555 leading-relaxed">
                    Los cintillos promocionales personalizados con intenciones de clic (redirección a productos, categorías, cupones o enlaces) son exclusivos para las tiendas en el plan <strong>Pro</strong> e <strong>Ilimitado</strong>.
                  </p>
                  <a
                    href="https://wa.me/51925176472?text=Hola,%20quiero%2520desbloquear%2520el%2520cintillo%2520de%2520anuncios"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-[10px] font-extrabold py-2 px-4 shadow w-fit transition-all active:scale-95 border-none cursor-pointer"
                  >
                    Mejorar Plan
                  </a>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Activar cintillo */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <div className="flex flex-col gap-0.5">
                      <h4 className="font-bold text-xs text-zinc-800">Mostrar Cintillo en el Catálogo</h4>
                      <p className="text-[10px] text-zinc-500">
                        Habilita la visualización de la barra promocional.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={promoBarEnabled}
                        onChange={(e) => setPromoBarEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>

                  {promoBarEnabled && (
                    <div className="space-y-5">
                      {/* Texto del aviso */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                          Texto del Anuncio
                        </label>
                        <input
                          type="text"
                          value={promoBarText}
                          onChange={(e) => setPromoBarText(e.target.value)}
                          placeholder="Ej: 🚚 ¡Envío gratis por compras mayores a S/. 150!"
                          className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3.5 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-600"
                        />
                      </div>

                      {/* Tipo de Acción */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                          Acción al hacer Clic
                        </label>
                        <select
                          value={promoBarActionType}
                          onChange={(e) => {
                            setPromoBarActionType(e.target.value as any);
                            setPromoBarActionValue("");
                          }}
                          className="flex h-10 w-full rounded-xl border border-zinc-250 bg-white px-3.5 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-600 cursor-pointer text-zinc-800"
                        >
                          <option value="none">Ninguna (Solo texto informativo)</option>
                          <option value="product">Redirigir a un Producto</option>
                          <option value="category">Filtrar por Categoría</option>
                          <option value="url">Abrir Enlace Externo (URL)</option>
                          <option value="coupon">Copiar Código de Cupón</option>
                          <option value="cart">Abrir Carrito de Compras</option>
                        </select>
                      </div>

                      {/* Valor de Acción Condicional */}
                      {promoBarActionType === "product" && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            Selecciona el Producto
                          </label>
                          <select
                            value={promoBarActionValue}
                            onChange={(e) => setPromoBarActionValue(e.target.value)}
                            className="flex h-10 w-full rounded-xl border border-zinc-250 bg-white px-3.5 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-600 cursor-pointer text-zinc-800"
                          >
                            <option value="">-- Elige un producto --</option>
                            {store.products?.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} {p.price ? `(S/ ${p.price.toFixed(2)})` : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {promoBarActionType === "category" && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            Selecciona la Categoría
                          </label>
                          <select
                            value={promoBarActionValue}
                            onChange={(e) => setPromoBarActionValue(e.target.value)}
                            className="flex h-10 w-full rounded-xl border border-zinc-250 bg-white px-3.5 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-600 cursor-pointer text-zinc-800"
                          >
                            <option value="">-- Elige una categoría --</option>
                            {store.categories?.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {promoBarActionType === "coupon" && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            Código del Cupón a Copiar
                          </label>
                          <input
                            type="text"
                            value={promoBarActionValue}
                            onChange={(e) => setPromoBarActionValue(e.target.value)}
                            placeholder="Ej: ENVIOFREE"
                            className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3.5 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-600 uppercase"
                          />
                        </div>
                      )}

                      {promoBarActionType === "url" && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            Enlace de Destino (URL)
                          </label>
                          <input
                            type="url"
                            value={promoBarActionValue}
                            onChange={(e) => setPromoBarActionValue(e.target.value)}
                            placeholder="Ej: https://instagram.com/mi_marca"
                            className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3.5 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-600"
                          />
                        </div>
                      )}

                      {/* Colores de Fondo y Texto */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            Color de Fondo
                          </label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={promoBarBgColor || "#000000"}
                              onChange={(e) => setPromoBarBgColor(e.target.value)}
                              className="h-8 w-8 rounded-lg border border-zinc-200 cursor-pointer p-0"
                            />
                            <input
                              type="text"
                              value={promoBarBgColor || ""}
                              onChange={(e) => setPromoBarBgColor(e.target.value)}
                              placeholder="Color por defecto"
                              className="flex-1 h-8 rounded-lg border border-input bg-transparent px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-600"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            Color del Texto
                          </label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={promoBarTextColor || "#ffffff"}
                              onChange={(e) => setPromoBarTextColor(e.target.value)}
                              className="h-8 w-8 rounded-lg border border-zinc-200 cursor-pointer p-0"
                            />
                            <input
                              type="text"
                              value={promoBarTextColor || ""}
                              onChange={(e) => setPromoBarTextColor(e.target.value)}
                              placeholder="Color por defecto"
                              className="flex-1 h-8 rounded-lg border border-input bg-transparent px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-600"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Marquee effect */}
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                        <div className="flex flex-col gap-0.5">
                          <h4 className="font-bold text-xs text-zinc-800">Texto Desplazable (Marquee)</h4>
                          <p className="text-[10px] text-zinc-500">
                            Hace que el texto se mueva infinitamente de derecha a izquierda.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={promoBarIsMarquee}
                            onChange={(e) => setPromoBarIsMarquee(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Side: Smartphone Mockup Frame */}
        <div className="hidden lg:flex lg:sticky lg:top-6 w-[380px] flex-col items-center shrink-0">
          <div className="relative w-[360px] h-[720px] bg-zinc-950 rounded-[48px] p-3.5 border-[6px] border-zinc-800 ring-1 ring-zinc-700/50 flex flex-col overflow-hidden select-none" style={{
            boxShadow: `0 25px 60px -15px ${brandColor ? brandColor + "25" : "rgba(234, 88, 12, 0.15)"}`
          }}>
            {/* Notch / Dynamic Island */}
            <div className="absolute top-4.5 left-1/2 -translate-x-1/2 w-28 h-5.5 bg-black rounded-full z-40 flex items-center justify-center">
              <div className="w-10 h-1 bg-zinc-900 rounded-full" />
            </div>

            {/* Status Bar */}
            <div className="h-6 bg-[#09090b] w-full shrink-0 flex items-center justify-between px-6 pt-1 text-[10px] text-zinc-400 font-bold z-30">
              <span>9:41</span>
              <div className="flex items-center gap-1.5">
                <span>5G</span>
                <div className="w-4 h-2 border border-zinc-700 rounded-xs p-0.5 flex items-center">
                  <div className="w-full h-full bg-zinc-400 rounded-3xs" />
                </div>
              </div>
            </div>

            {/* Simulated Live Frame */}
            <div className="flex-grow overflow-y-auto no-scrollbar rounded-[34px] border border-zinc-900 bg-[#09090b] relative">
              <PublicCatalog store={previewStore as any} mode="catalog" isMockup={true} />
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground text-center mt-4 max-w-[320px] leading-relaxed">
            <strong>Simulador Interactivo:</strong> Puedes hacer scroll, navegar categorías y agregar productos en tiempo real.
          </p>
        </div>
      </div>

      {/* Floating Save/Preview Banner */}
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-3 items-center w-[calc(100%-2rem)] max-w-sm md:max-w-md justify-center">
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-full shadow-2xl border px-4 py-2 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-4 duration-300 w-full">
          {/* Preview Button on Mobile/Tablet */}
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="flex lg:hidden items-center justify-center gap-1.5 px-4 py-2 rounded-full border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-900 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Eye className="h-3.5 w-3.5 text-zinc-600" />
            <span>Previsualizar</span>
          </button>

          {isDirty ? (
            <div className="flex items-center gap-2.5 ml-auto text-xs">
              <span className="hidden sm:inline-flex text-[10px] font-bold text-zinc-400 items-center shrink-0">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
                Editado
              </span>
              <Button onClick={save} className="rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold px-5 py-2 text-xs shadow-lg transition-transform active:scale-95 border-none cursor-pointer">
                <Check className="h-3.5 w-3.5 mr-1" />
                Guardar
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 ml-auto">
              <Sparkles className="h-3.5 w-3.5 text-orange-500 animate-pulse" />
              <span className="text-[10px] sm:text-xs text-zinc-500 font-bold shrink-0">
                Diseño guardado
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-[390px] h-[85vh] bg-zinc-950 rounded-[40px] p-3 border-[6px] border-zinc-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-4 right-4 z-[110] h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all border border-zinc-800 cursor-pointer text-xs font-bold"
            >
              ✕
            </button>

            {/* Notch / Dynamic Island */}
            <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-[105] flex items-center justify-center">
              <div className="w-8 h-1 bg-zinc-900 rounded-full" />
            </div>

            {/* Status Bar */}
            <div className="h-5 bg-[#09090b] w-full shrink-0 flex items-center justify-between px-6 pt-1 text-[9px] text-zinc-400 font-bold z-[104] select-none">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <span>5G</span>
                <div className="w-3.5 h-1.5 border border-zinc-700 rounded-xs p-0.25 flex items-center">
                  <div className="w-full h-full bg-zinc-400 rounded-[2px]" />
                </div>
              </div>
            </div>

            {/* Simulated Live Frame */}
            <div className="flex-grow overflow-y-auto no-scrollbar rounded-[28px] border border-zinc-900 bg-[#09090b] relative">
              <PublicCatalog store={previewStore as any} mode="catalog" isMockup={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
