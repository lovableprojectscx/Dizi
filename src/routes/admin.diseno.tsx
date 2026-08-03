import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { convertImageToWebP } from "@/lib/image-utils";
import {
  Lock,
  Check,
  Sparkles,
  Crown,
  Palette,
  Image,
  Sliders,
  Eye,
  LayoutGrid,
  Layers,
  Search,
  FileText,
  Megaphone,
  BarChart3,
  Tag,
  ShieldAlert,
  Moon,
  Sun,
  Maximize2,
  Smartphone,
  Monitor,
  Upload,
  Trash2,
  X,
} from "lucide-react";
import { type PlanId } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn, hexLuminance } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PublicCatalog } from "@/components/public/PublicCatalog";
import { DESIGN_STRUCTURES, StructureDef, resolveStructureId } from "@/lib/design-catalog";
import { THEME_PRESETS, ThemePreset } from "@/lib/theme-presets";

export const Route = createFileRoute("/admin/diseno")({
  component: DisenoUnificadoPage,
});

const PLAN_LEVELS: Record<PlanId, number> = {
  semilla: 0,
  emprendedor: 1,
  pro: 2,
  ilimitado: 3,
};

const BRAND_COLORS = [
  { id: "default", name: "Índigo Dizi", hex: "#4f46e5", display: "#4f46e5" },
  { id: "blue", name: "Azul Océano", hex: "#2563eb", display: "#2563eb" },
  { id: "cyan", name: "Cyan", hex: "#0891b2", display: "#0891b2" },
  { id: "green", name: "Esmeralda", hex: "#059669", display: "#059669" },
  { id: "teal", name: "Teal Nature", hex: "#0d9488", display: "#0d9488" },
  { id: "lime", name: "Lima", hex: "#65a30d", display: "#65a30d" },
  { id: "amber", name: "Ámbar", hex: "#d97706", display: "#d97706" },
  { id: "orange", name: "Naranja Bloom", hex: "#ea580c", display: "#ea580c" },
  { id: "red", name: "Rojo Coral", hex: "#dc2626", display: "#dc2626" },
  { id: "rose", name: "Rosa", hex: "#be185d", display: "#be185d" },
  { id: "purple", name: "Púrpura", hex: "#7c3aed", display: "#7c3aed" },
  { id: "slate", name: "Carbón", hex: "#334155", display: "#334155" },
];

const BG_COLORS = [
  { id: "white", name: "Blanco Puro", hex: "#ffffff", display: "#ffffff" },
  { id: "cream", name: "Crema Cálido", hex: "#fdfaf5", display: "#fdfaf5" },
  { id: "rose_bg", name: "Rosa Suave", hex: "#fff5f7", display: "#fff5f7" },
  { id: "mint_bg", name: "Menta Fresco", hex: "#f0fefb", display: "#f0fefb" },
  { id: "sky_bg", name: "Cielo Suave", hex: "#eff6ff", display: "#eff6ff" },
  { id: "sand", name: "Arena", hex: "#faf5eb", display: "#faf5eb" },
  { id: "gray", name: "Gris Claro", hex: "#f8fafc", display: "#f8fafc" },
  { id: "dark_forest", name: "Bosque Oscuro", hex: "#0d1f0f", display: "#0d1f0f" },
  { id: "charcoal", name: "Carbón Slate", hex: "#1e293b", display: "#1e293b" },
  { id: "midnight", name: "Medianoche", hex: "#0f172a", display: "#0f172a" },
  { id: "obsidian", name: "Obsidiana", hex: "#09090b", display: "#09090b" },
];

function ColorSwatch({
  colors,
  selected,
  onSelect,
  customLabel = "Personalizado",
}: {
  colors: { id: string; name: string; hex: string; display: string }[];
  selected: string;
  onSelect: (hex: string) => void;
  customLabel?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2.5 items-center">
      {colors.map((c) => {
        const active = selected.toLowerCase() === c.hex.toLowerCase();
        return (
          <button
            key={c.id}
            type="button"
            title={c.name}
            onClick={() => onSelect(c.hex)}
            className={cn(
              "relative h-8 w-8 rounded-full border-2 transition-all hover:scale-110 shadow-sm",
              active
                ? "border-foreground ring-2 ring-foreground/20 scale-110 shadow-md"
                : "border-zinc-200"
            )}
            style={{ backgroundColor: c.display }}
          >
            {active && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Check className="h-3.5 w-3.5 text-white drop-shadow mix-blend-difference" />
              </div>
            )}
          </button>
        );
      })}

      <div className="flex items-center gap-2 border-l border-zinc-200 pl-2.5 ml-0.5">
        <div
          className={cn(
            "relative h-8 w-8 rounded-full overflow-hidden transition-all hover:scale-110 shrink-0 shadow-sm border-2",
            selected && !colors.find((c) => c.hex.toLowerCase() === selected.toLowerCase())
              ? "border-foreground ring-2 ring-foreground/20 scale-110 shadow-md"
              : "border-dashed border-zinc-300"
          )}
          title={customLabel}
        >
          <input
            type="color"
            value={selected || "#000000"}
            onChange={(e) => onSelect(e.target.value)}
            className="absolute -inset-4 h-16 w-16 cursor-pointer opacity-0"
          />
          <div
            className="w-full h-full"
            style={{ backgroundColor: selected || "#ffffff" }}
          />
        </div>
      </div>
    </div>
  );
}

function DisenoUnificadoPage() {
  const id = useApp((s) => s.currentStoreId);
  const store = useApp((s) => s.stores.find((st) => st.id === id));
  const update = useApp((s) => s.updateStore);

  if (!store) return null;

  const currentPlanLevel = PLAN_LEVELS[store.plan] ?? 0;

  // Estado principal de navegación entre las 3 secciones
  const [activeSection, setActiveSection] = useState<"estructura" | "tema" | "modulos">("estructura");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Estructura seleccionada (mapeando modelos legados como boutique a spotlight)
  const [selectedStructure, setSelectedStructure] = useState<string>(
    resolveStructureId(store.model, store.niche)
  );

  // 2. Estado del Tema (Los 10 atributos finos)
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [brandColor, setBrandColor] = useState<string>(store.brandColor || "#4f46e5");
  const [bgColor, setBgColor] = useState<string>((store as any).bgColor || "#ffffff");
  const [textColor, setTextColor] = useState<string>(store.textColor || "#1e293b");
  const [cardBg, setCardBg] = useState<string>((store as any).cardBg || "#f8fafc");
  const [accentColor, setAccentColor] = useState<string>((store as any).accentColor || "#e0e7ff");
  const [borderRadius, setBorderRadius] = useState<string>((store as any).borderRadius || "12px");
  const [imgShape, setImgShape] = useState<"square" | "rounded" | "circle">((store as any).imgShape || "rounded");
  const [isDark, setIsDark] = useState<boolean>((store as any).isDark || false);
  const [typography, setTypography] = useState<"sans" | "serif" | "rounded" | "modern">(
    store.catalogTypography || "sans"
  );
  const [cardStyle, setCardStyle] = useState<"standard" | "flat" | "shadow" | "curved">(
    store.cardStyle || "standard"
  );

  // 3. Portada, Banners y Cintillo
  const originalBannerImage = (store as any).bannerImage || "";
  const hasMultipleBanners = originalBannerImage.includes("|||");
  const [bannerImage, setBannerImage] = useState<string>(originalBannerImage);
  const [bannerTitle, setBannerTitle] = useState<string>((store as any).bannerTitle || "");
  const [bannerTagline, setBannerTagline] = useState<string>(store.bannerTagline || "");
  const [bannerBottomTag, setBannerBottomTag] = useState<string>(store.bannerBottomTag || "");
  const [bannerStyle, setBannerStyle] = useState<"direct" | "framed" | "curved">(
    (store as any).bannerStyle || "framed"
  );

  const [promoBarEnabled, setPromoBarEnabled] = useState<boolean>(store.promoBarEnabled || false);
  const [promoBarText, setPromoBarText] = useState<string>(store.promoBarText || "");
  const [promoBarActionType, setPromoBarActionType] = useState<"none" | "product" | "category" | "url" | "coupon" | "cart">(
    store.promoBarActionType || "none"
  );
  const [promoBarActionValue, setPromoBarActionValue] = useState<string>(store.promoBarActionValue || "");
  const [promoBarBgColor, setPromoBarBgColor] = useState<string>(store.promoBarBgColor || "");
  const [promoBarTextColor, setPromoBarTextColor] = useState<string>(store.promoBarTextColor || "");
  const [promoBarIsMarquee, setPromoBarIsMarquee] = useState<boolean>(store.promoBarIsMarquee || false);

  // Carga inicial sincronizada
  useEffect(() => {
    if (store && !isLoaded) {
      setSelectedStructure(resolveStructureId(store.model, store.niche));
      setBrandColor(store.brandColor || "#4f46e5");
      setBgColor((store as any).bgColor || "#ffffff");
      setTextColor(store.textColor || "#1e293b");
      setCardBg((store as any).cardBg || "#f8fafc");
      setAccentColor((store as any).accentColor || "#e0e7ff");
      setBorderRadius((store as any).borderRadius || "12px");
      setImgShape((store as any).imgShape || "rounded");
      setIsDark((store as any).isDark || false);
      setTypography(store.catalogTypography || "sans");
      setCardStyle(store.cardStyle || "standard");

      setBannerImage(originalBannerImage);
      setBannerTitle((store as any).bannerTitle || "");
      setBannerTagline(store.bannerTagline || "");
      setBannerBottomTag(store.bannerBottomTag || "");
      setBannerStyle((store as any).bannerStyle || "framed");

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

  // Aplicar un Preset de Tema
  const handleApplyPreset = (preset: ThemePreset) => {
    setSelectedPresetId(preset.id);
    setBrandColor(preset.values.brandColor);
    setBgColor(preset.values.bgColor);
    setTextColor(preset.values.textColor);
    setCardBg(preset.values.cardBg);
    setAccentColor(preset.values.accentColor);
    setBorderRadius(preset.values.borderRadius);
    setImgShape(preset.values.imgShape);
    setIsDark(preset.values.isDark);
    setTypography(preset.values.typography);
    setCardStyle(preset.values.cardStyle);
    toast.success(`✨ Tema "${preset.name}" aplicado como punto de partida`);
  };

  const handleBgColorSelect = (newBg: string) => {
    setBgColor(newBg);
    const dark = hexLuminance(newBg) < 0.35;
    setIsDark(dark);
    if (dark) {
      setCardBg("#18181b");
      setTextColor("#f4f4f5");
      setAccentColor("#27272a");
    } else {
      setCardBg("#ffffff");
      setTextColor("#18181b");
      setAccentColor("#e2e8f0");
    }
  };

  // Multi-banner support (up to 5 banners based on plan)
  const bannerList = bannerImage ? bannerImage.split("|||").filter(Boolean) : [];
  const maxAllowedBanners = store.plan === "semilla" ? 0 : store.plan === "emprendedor" ? 1 : store.plan === "pro" ? 3 : 5;

  const handleAddBanner = async (file: File, indexToReplace?: number) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen es muy pesada (máximo 10 MB)");
      return;
    }
    try {
      const webpDataUrl = await convertImageToWebP(file);
      const currentList = [...bannerList];
      if (typeof indexToReplace === "number" && indexToReplace < currentList.length) {
        currentList[indexToReplace] = webpDataUrl;
      } else {
        if (maxAllowedBanners > 0 && currentList.length >= maxAllowedBanners) {
          toast.error(`Tu plan actual (${store.plan.toUpperCase()}) permite un máximo de ${maxAllowedBanners} banner(s).`);
          return;
        }
        currentList.push(webpDataUrl);
      }
      setBannerImage(currentList.join("|||"));
      toast.info("Banner actualizado. Haz clic en Guardar cambios.");
    } catch {
      toast.error("No se pudo procesar la imagen del banner.");
    }
  };

  const handleRemoveBanner = (index: number) => {
    const currentList = bannerList.filter((_, i) => i !== index);
    setBannerImage(currentList.join("|||"));
    toast.info("Banner eliminado. Haz clic en Guardar cambios.");
  };

  // Guardar configuración unificada
  const save = async () => {
    const toastId = toast.loading("Guardando diseño...");
    try {
      await update(store.id, {
        model: selectedStructure as any,
        brandColor: brandColor || null,
        bgColor: bgColor || null,
        textColor: textColor || null,
        cardBg: cardBg || null,
        accentColor: accentColor || null,
        borderRadius: borderRadius || null,
        imgShape: imgShape || "rounded",
        isDark: isDark,
        catalogTypography: typography || null,
        cardStyle: cardStyle || null,
        bannerImage: bannerImage || null,
        bannerTitle: bannerTitle || null,
        bannerTagline: bannerTagline || null,
        bannerBottomTag: bannerBottomTag || null,
        bannerStyle: bannerStyle || null,
        promoBarEnabled,
        promoBarText,
        promoBarActionType,
        promoBarActionValue,
        promoBarBgColor: promoBarBgColor || null,
        promoBarTextColor: promoBarTextColor || null,
        promoBarIsMarquee,
      } as any);

      toast.success("🎨 Diseño unificado guardado en tu catálogo", { id: toastId });
    } catch (err) {
      console.error("[save diseño unificado]", err);
      toast.error("Error al guardar el diseño. Revisa la consola.", { id: toastId });
    }
  };

  // Tienda virtualizada para el Live Preview
  const previewStore = {
    ...store,
    model: selectedStructure,
    brandColor: brandColor,
    bgColor: bgColor,
    textColor: textColor,
    cardBg: cardBg,
    accentColor: accentColor,
    borderRadius: borderRadius,
    imgShape: imgShape,
    isDark: isDark,
    catalogTypography: typography,
    cardStyle: cardStyle,
    bannerImage: bannerImage,
    bannerTitle: bannerTitle,
    bannerTagline: bannerTagline,
    bannerBottomTag: bannerBottomTag,
    bannerStyle: bannerStyle,
    promoBarEnabled: promoBarEnabled,
    promoBarText: promoBarText,
    promoBarActionType: promoBarActionType,
    promoBarActionValue: promoBarActionValue,
    promoBarBgColor: promoBarBgColor,
    promoBarTextColor: promoBarTextColor,
    promoBarIsMarquee: promoBarIsMarquee,
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      {/* Header Unificado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-black text-2xl tracking-tight text-zinc-900">Diseño del Catálogo</h1>
            <Badge className="bg-primary/10 text-primary border-none text-[10px] font-extrabold uppercase px-2.5 py-0.5">
              Sistema Unificado
            </Badge>
          </div>
          <p className="text-xs text-zinc-550 mt-1">
            Personaliza la estructura visual, la paleta de colores y activa los módulos de tu catálogo.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsPreviewOpen(true)}
            className="flex-1 sm:flex-none rounded-xl text-xs font-bold gap-2"
          >
            <Eye className="h-4 w-4" />
            Vista previa
          </Button>

          <Button
            type="button"
            onClick={save}
            className="flex-1 sm:flex-none rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white gap-2 shadow-md"
          >
            <Check className="h-4 w-4" />
            Guardar cambios
          </Button>
        </div>
      </div>

      {/* Navegación por Secciones Principales */}
      <div className="grid grid-cols-3 sm:flex sm:items-center gap-1.5 sm:gap-2 mt-6 p-1.5 bg-zinc-100/90 rounded-2xl border border-zinc-200/80 w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveSection("estructura")}
          className={cn(
            "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-2.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all text-center cursor-pointer",
            activeSection === "estructura"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-900"
          )}
        >
          <LayoutGrid className={cn("h-5 w-5 sm:h-4 sm:w-4 shrink-0", activeSection === "estructura" ? "text-primary" : "text-zinc-500")} />
          <span className="leading-tight">1. Estructura ({DESIGN_STRUCTURES.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("tema")}
          className={cn(
            "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-2.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all text-center cursor-pointer",
            activeSection === "tema"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-900"
          )}
        >
          <Palette className={cn("h-5 w-5 sm:h-4 sm:w-4 shrink-0", activeSection === "tema" ? "text-amber-500" : "text-zinc-500")} />
          <span className="leading-tight">2. Tema & Colores</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("modulos")}
          className={cn(
            "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-2.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all text-center cursor-pointer",
            activeSection === "modulos"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-900"
          )}
        >
          <Layers className={cn("h-5 w-5 sm:h-4 sm:w-4 shrink-0", activeSection === "modulos" ? "text-purple-500" : "text-zinc-500")} />
          <span className="leading-tight">3. Módulos & Funciones</span>
        </button>
      </div>

      {/* Grid Principal (Controles + Preview lateral) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        {/* Panel de Controles (7 Columna en Desktop) */}
        <div className="lg:col-span-7 space-y-6">
          {/* SECCIÓN 1: ESTRUCTURA */}
          {activeSection === "estructura" && (
            <div className="rounded-3xl border border-zinc-200/85 bg-white p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="font-extrabold text-base text-zinc-900">Catálogo de Estructuras</h3>
                <p className="text-xs text-zinc-550 mt-0.5">
                  Todas las estructuras están disponibles para todos los planes. Selecciona el diseño que mejor organice tus productos.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {DESIGN_STRUCTURES.map((struct) => {
                  const isActive = selectedStructure === struct.id;
                  return (
                    <div
                      key={struct.id}
                      onClick={() => setSelectedStructure(struct.id)}
                      className={cn(
                        "relative rounded-2xl border-2 p-4 cursor-pointer transition-all duration-200 flex flex-col justify-between group",
                        isActive
                          ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                          : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
                      )}
                    >
                      <div>
                        {/* Img Preview o Tag */}
                        {struct.previewImage ? (
                          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-zinc-100 mb-3 border">
                            <img
                              src={struct.previewImage}
                              alt={struct.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          </div>
                        ) : (
                          <div className="aspect-[16/9] w-full rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-50 border flex items-center justify-center mb-3">
                            <LayoutGrid className="h-8 w-8 text-zinc-400" />
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-extrabold text-xs text-zinc-900">{struct.name}</h4>
                          {isActive && (
                            <Badge className="bg-primary text-white border-none text-[8px] font-extrabold py-0.5 px-2">
                              SELECCIONADA
                            </Badge>
                          )}
                        </div>

                        <p className="text-[11px] text-zinc-550 leading-relaxed mb-3">
                          {struct.description}
                        </p>
                      </div>

                      {struct.suggestedNiche && (
                        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            <span>{struct.suggestedNiche}</span>
                          </div>
                          {struct.supportsCategoryIcons && (
                            <span className="text-[9px] font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 tracking-normal normal-case">
                              ✨ Soporta Íconos
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECCIÓN 2: TEMA & COLORES */}
          {activeSection === "tema" && (
            <div className="rounded-3xl border border-zinc-200/85 bg-white p-6 shadow-sm space-y-8 animate-in fade-in duration-200">
              {/* Presets de Arranque */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-zinc-900">Presets de Tema</h3>
                    <p className="text-[11px] text-zinc-550">
                      Carga una combinación cromática de arranque. Puedes personalizar cada atributo individualmente.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {THEME_PRESETS.map((preset) => {
                    const active = selectedPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={cn(
                          "flex flex-col gap-2 p-3 rounded-xl border text-left transition-all hover:border-primary/50",
                          active
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-zinc-200 bg-zinc-50/50 hover:bg-white"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-zinc-900">{preset.name}</span>
                          <div
                            className="h-3.5 w-3.5 rounded-full border shadow-xs shrink-0"
                            style={{ backgroundColor: preset.values.brandColor }}
                          />
                        </div>
                        <p className="text-[9.5px] text-zinc-500 line-clamp-2">{preset.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 10 Controles Finos */}
              <div className="pt-6 border-t border-zinc-200 space-y-6">
                <h3 className="font-extrabold text-sm text-zinc-900">Personalización Fina de Tema</h3>

                {/* Color de Marca */}
                <div className="space-y-3 bg-zinc-50/50 p-4 rounded-2xl border">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-xs text-zinc-800">Color Primario (Marca)</label>
                    <span className="font-mono text-[10px] text-zinc-400 uppercase">{brandColor}</span>
                  </div>
                  <ColorSwatch colors={BRAND_COLORS} selected={brandColor} onSelect={setBrandColor} />
                </div>

                {/* Color de Fondo */}
                <div className="space-y-3 bg-zinc-50/50 p-4 rounded-2xl border">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-xs text-zinc-800">Color de Fondo del Catálogo</label>
                    <span className="font-mono text-[10px] text-zinc-400 uppercase">{bgColor}</span>
                  </div>
                  <ColorSwatch colors={BG_COLORS} selected={bgColor} onSelect={handleBgColorSelect} />
                </div>

                {/* Color de Tarjeta, Texto y Acento */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2 bg-zinc-50/50 p-4 rounded-2xl border">
                    <label className="font-bold text-xs text-zinc-800">Fondo de Tarjeta</label>
                    <input
                      type="color"
                      value={cardBg}
                      onChange={(e) => setCardBg(e.target.value)}
                      className="h-9 w-full rounded-xl cursor-pointer border border-zinc-200"
                    />
                  </div>

                  <div className="space-y-2 bg-zinc-50/50 p-4 rounded-2xl border">
                    <label className="font-bold text-xs text-zinc-800">Color de Texto</label>
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="h-9 w-full rounded-xl cursor-pointer border border-zinc-200"
                    />
                  </div>

                  <div className="space-y-2 bg-zinc-50/50 p-4 rounded-2xl border">
                    <label className="font-bold text-xs text-zinc-800">Color de Acento</label>
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-9 w-full rounded-xl cursor-pointer border border-zinc-200"
                    />
                  </div>
                </div>

                {/* Tipografía & Estilo de Tarjeta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-bold text-xs text-zinc-800">Tipografía</label>
                    <select
                      value={typography}
                      onChange={(e) => setTypography(e.target.value as any)}
                      className="w-full h-10 rounded-xl border border-input bg-white px-3 text-xs font-semibold"
                    >
                      <option value="sans">Sans-serif Moderna (Limpia)</option>
                      <option value="serif">Serif Elegante (Editorial)</option>
                      <option value="rounded">Rounded Amigable (Suave)</option>
                      <option value="modern">Modern Monospace (Geométrica)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="font-bold text-xs text-zinc-800">Estilo de Tarjeta</label>
                    <select
                      value={cardStyle}
                      onChange={(e) => setCardStyle(e.target.value as any)}
                      className="w-full h-10 rounded-xl border border-input bg-white px-3 text-xs font-semibold"
                    >
                      <option value="standard">Estándar (Con Borde)</option>
                      <option value="flat">Flat (Plana Sin Sombra)</option>
                      <option value="shadow">Shadow (Sombra Elevada)</option>
                      <option value="curved">Curved (Esquinas Curvadas)</option>
                    </select>
                  </div>
                </div>

                {/* Radio de Esquinas & Modo Oscuro */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-xs text-zinc-800">Radio de Esquinas</label>
                      <span className="text-xs font-bold text-primary">{borderRadius}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="24"
                      value={parseInt(borderRadius) || 12}
                      onChange={(e) => setBorderRadius(`${e.target.value}px`)}
                      className="w-full accent-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl border bg-zinc-50/50">
                    <div className="flex items-center gap-2">
                      {isDark ? <Moon className="h-4 w-4 text-purple-600" /> : <Sun className="h-4 w-4 text-amber-500" />}
                      <span className="font-bold text-xs text-zinc-800">Modo Oscuro</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isDark}
                      onChange={(e) => {
                        const nextDark = e.target.checked;
                        setIsDark(nextDark);
                        if (nextDark) {
                          setBgColor("#09090b");
                          setCardBg("#18181b");
                          setTextColor("#f4f4f5");
                          setAccentColor("#27272a");
                        } else {
                          setBgColor("#ffffff");
                          setCardBg("#ffffff");
                          setTextColor("#18181b");
                          setAccentColor("#e2e8f0");
                        }
                      }}
                      className="h-4 w-4 rounded accent-primary cursor-pointer"
                    />
                  </div>
                </div>

                {/* Textos y Leyendas del Banner / Portada */}
                <div className="pt-6 border-t border-zinc-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-blue-600" />
                    <h3 className="font-extrabold text-sm text-zinc-900">Textos y Leyendas de Portada</h3>
                  </div>

                  <div className="space-y-3 bg-zinc-50/50 p-4 rounded-2xl border">
                    <div className="space-y-1">
                      <label className="font-bold text-xs text-zinc-800">Título Principal del Banner</label>
                      <input
                        type="text"
                        value={bannerTitle}
                        onChange={(e) => setBannerTitle(e.target.value)}
                        placeholder="Ej: Colección Primavera 2026"
                        className="w-full h-10 rounded-xl border border-input bg-white px-3 text-xs font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-xs text-zinc-800">Subtítulo / Mensaje Promocional (Tagline)</label>
                      <input
                        type="text"
                        value={bannerTagline}
                        onChange={(e) => setBannerTagline(e.target.value)}
                        placeholder="Ej: Envíos gratis a todo el Perú en compras mayores a S/ 100"
                        className="w-full h-10 rounded-xl border border-input bg-white px-3 text-xs font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-xs text-zinc-800">Etiqueta Inferior del Banner</label>
                      <input
                        type="text"
                        value={bannerBottomTag}
                        onChange={(e) => setBannerBottomTag(e.target.value)}
                        placeholder="Ej: Oferta por tiempo limitado"
                        className="w-full h-10 rounded-xl border border-input bg-white px-3 text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 3: MÓDULOS & FUNCIONES */}
          {activeSection === "modulos" && (
            <div className="rounded-3xl border border-zinc-200/85 bg-white p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="font-extrabold text-base text-zinc-900">Módulos & Funcionalidades del Catálogo</h3>
                <p className="text-xs text-zinc-550 mt-0.5">
                  Haz clic en los botones de acción para gestionar cada función o desbloquear los módulos con un plan superior.
                </p>
              </div>

              <div className="space-y-3">
                {/* 0. Cintillo Promocional / Barra de Anuncios (Envío Gratis) */}
                <div className="p-4 rounded-2xl border bg-zinc-50/50 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                        <Sparkles className="h-4.5 w-4.5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-zinc-900 flex items-center gap-2">
                          Cintillo Promocional / Envío Gratis
                          <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-[9px] font-extrabold py-0.5">
                            Barra Superior
                          </Badge>
                        </h4>
                        <p className="text-[11px] text-zinc-550">
                          Muestra un anuncio superior en el catálogo (Envío gratis, descuentos, avisos importantes).
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={promoBarEnabled}
                          onChange={(e) => setPromoBarEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                      </label>
                    </div>
                  </div>

                  {promoBarEnabled && (
                    <div className="pt-3 border-t border-zinc-200/80 space-y-3 animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <label className="font-bold text-xs text-zinc-800">Texto del Anuncio / Oferta</label>
                        <input
                          type="text"
                          value={promoBarText}
                          onChange={(e) => setPromoBarText(e.target.value)}
                          placeholder="Ej: ¡Envío gratis a partir de S/. 150 en todos los pedidos!"
                          className="w-full h-10 rounded-xl border border-input bg-white px-3 text-xs font-semibold"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-xs text-zinc-800">Acción al Hacer Clic</label>
                          <select
                            value={promoBarActionType}
                            onChange={(e) => setPromoBarActionType(e.target.value as any)}
                            className="w-full h-10 rounded-xl border border-input bg-white px-3 text-xs font-semibold"
                          >
                            <option value="none">Sin botón (Solo mensaje)</option>
                            <option value="cart">Abrir Carrito</option>
                            <option value="url">Abrir Enlace Externo</option>
                            <option value="category">Ir a Categoría</option>
                            <option value="product">Ver Producto</option>
                          </select>
                        </div>

                        {promoBarActionType !== "none" && promoBarActionType !== "cart" && (
                          <div className="space-y-1">
                            <label className="font-bold text-xs text-zinc-800">
                              {promoBarActionType === "url" ? "URL del Enlace" : "ID o Valor"}
                            </label>
                            <input
                              type="text"
                              value={promoBarActionValue}
                              onChange={(e) => setPromoBarActionValue(e.target.value)}
                              placeholder={promoBarActionType === "url" ? "https://..." : "Valor"}
                              className="w-full h-10 rounded-xl border border-input bg-white px-3 text-xs font-semibold"
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <div className="space-y-1">
                          <label className="font-bold text-[11px] text-zinc-700">Fondo Personalizado</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={promoBarBgColor || brandColor || "#ea580c"}
                              onChange={(e) => setPromoBarBgColor(e.target.value)}
                              className="h-8 w-10 rounded-lg cursor-pointer border border-zinc-200 p-0.5"
                            />
                            {promoBarBgColor && (
                              <button
                                type="button"
                                onClick={() => setPromoBarBgColor("")}
                                className="text-[10px] text-zinc-400 hover:text-zinc-700 underline"
                              >
                                Restablecer
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-[11px] text-zinc-700">Texto Personalizado</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={promoBarTextColor || "#ffffff"}
                              onChange={(e) => setPromoBarTextColor(e.target.value)}
                              className="h-8 w-10 rounded-lg cursor-pointer border border-zinc-200 p-0.5"
                            />
                            {promoBarTextColor && (
                              <button
                                type="button"
                                onClick={() => setPromoBarTextColor("")}
                                className="text-[10px] text-zinc-400 hover:text-zinc-700 underline"
                              >
                                Restablecer
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-xl border bg-white mt-auto h-10">
                          <span className="font-bold text-xs text-zinc-700">Marquesina (Scroll)</span>
                          <input
                            type="checkbox"
                            checked={promoBarIsMarquee}
                            onChange={(e) => setPromoBarIsMarquee(e.target.checked)}
                            className="h-4 w-4 rounded accent-primary cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 1. Marca de Agua Dizi */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border bg-zinc-50/50 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-zinc-200 flex items-center justify-center shrink-0">
                      <Megaphone className="h-4.5 w-4.5 text-zinc-700" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-zinc-900">Marca de Agua Dizi</h4>
                      <p className="text-[11px] text-zinc-550">
                        {currentPlanLevel === 0 ? "Visible al pie en Plan Semilla" : "Oculta automáticamente en tu plan activo"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {currentPlanLevel === 0 ? (
                      <Link to="/admin/plan">
                        <Button size="sm" variant="outline" className="text-xs h-8 border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 font-semibold">
                          Quitar Marca de Agua
                        </Button>
                      </Link>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                        ✓ Oculta (Marca Propia)
                      </Badge>
                    )}
                  </div>
                </div>

                {/* 2. Banners en Portada (Hasta 5 Banners según Plan) */}
                <div className="p-4 rounded-2xl border bg-zinc-50/50 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <Image className="h-4.5 w-4.5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-zinc-900 flex items-center gap-2">
                          Banners en Portada
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[9px] font-extrabold py-0.5">
                            {store.plan === "semilla"
                              ? "0 Banners (Plan Semilla)"
                              : store.plan === "emprendedor"
                                ? "1 Banner Max"
                                : store.plan === "pro"
                                  ? "Carrusel 3 Banners"
                                  : "Carrusel 5 Banners"}
                          </Badge>
                        </h4>
                        <p className="text-[11px] text-zinc-550">
                          {maxAllowedBanners === 0
                            ? "El Plan Semilla no incluye imágenes personalizadas en portada. Actualiza a Emprendedor (1 banner) o Pro/Ilimitado (hasta 5 en carrusel)."
                            : `Gestiona hasta ${maxAllowedBanners} banner(s) para la portada de tu catálogo. (${bannerList.length}/${maxAllowedBanners} subidos)`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {maxAllowedBanners > 0 && bannerList.length < maxAllowedBanners && (
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleAddBanner(file);
                            }}
                            className="hidden"
                          />
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-700 shadow-xs transition">
                            <Upload className="h-3.5 w-3.5 text-primary" />
                            + Agregar Banner ({bannerList.length + 1}/{maxAllowedBanners})
                          </span>
                        </label>
                      )}
                      {currentPlanLevel < 3 && (
                        <Link to="/admin/plan">
                          <Button size="sm" variant="ghost" className="text-xs h-8 text-primary font-bold">
                            Ampliar Plan
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Banner Gallery Grid */}
                  {bannerList.length > 0 && (
                    <div className="pt-3 border-t border-zinc-200/80 space-y-2">
                      <p className="text-xs font-bold text-zinc-800">
                        Imágenes Cargadas ({bannerList.length} de {maxAllowedBanners})
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {bannerList.map((url, idx) => (
                          <div
                            key={idx}
                            className="relative rounded-2xl border border-zinc-200 bg-white p-2.5 space-y-2 group shadow-xs hover:border-primary/40 transition"
                          >
                            <div className="relative aspect-[16/7] w-full rounded-xl overflow-hidden bg-zinc-100 border border-zinc-100">
                              <img
                                src={url}
                                alt={`Banner ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold">
                                Banner #{idx + 1}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <label className="cursor-pointer text-[10px] text-zinc-600 font-bold hover:text-primary transition flex items-center gap-1">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleAddBanner(file, idx);
                                  }}
                                  className="hidden"
                                />
                                <Upload className="h-3 w-3" /> Reemplazar
                              </label>

                              <button
                                type="button"
                                onClick={() => handleRemoveBanner(idx)}
                                className="text-[10px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1"
                              >
                                <Trash2 className="h-3 w-3" /> Eliminar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Buscador Inteligente */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border bg-zinc-50/50 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <Search className="h-4.5 w-4.5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-zinc-900">Buscador Inteligente</h4>
                      <p className="text-[11px] text-zinc-550">Filtro en tiempo real para encontrar artículos al instante</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {currentPlanLevel >= 1 ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                        ✓ Activo
                      </Badge>
                    ) : (
                      <Link to="/admin/plan">
                        <Button size="sm" variant="outline" className="text-xs h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold gap-1">
                          <Lock className="h-3 w-3" /> Desbloquear
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* 4. Catálogo en PDF */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border bg-zinc-50/50 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <FileText className="h-4.5 w-4.5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-zinc-900">Exportar Catálogo en PDF</h4>
                      <p className="text-[11px] text-zinc-550">Genera un PDF interactivo con enlaces hacia tu WhatsApp</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {currentPlanLevel >= 1 ? (
                      <Link to="/admin/productos">
                        <Button size="sm" variant="outline" className="text-xs h-8 font-semibold">
                          Exportar en Productos
                        </Button>
                      </Link>
                    ) : (
                      <Link to="/admin/plan">
                        <Button size="sm" variant="outline" className="text-xs h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold gap-1">
                          <Lock className="h-3 w-3" /> Desbloquear
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* 5. Estadísticas de Visitas */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border bg-zinc-50/50 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                      <BarChart3 className="h-4.5 w-4.5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-zinc-900">Estadísticas de Visitas</h4>
                      <p className="text-[11px] text-zinc-550">Métricas de tráfico y clics en tiempo real</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {currentPlanLevel >= 2 ? (
                      <Link to="/admin/dashboard">
                        <Button size="sm" variant="outline" className="text-xs h-8 font-semibold">
                          Ver Estadísticas
                        </Button>
                      </Link>
                    ) : (
                      <Link to="/admin/plan">
                        <Button size="sm" variant="outline" className="text-xs h-8 border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold gap-1">
                          <Lock className="h-3 w-3" /> Desbloquear
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* 6. Filtro de Etiquetas */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border bg-zinc-50/50 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                      <Tag className="h-4.5 w-4.5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-zinc-900">Filtro Táctil de Etiquetas</h4>
                      <p className="text-[11px] text-zinc-550">Etiquetas interactivas (vegano, picante, más vendido, sin gluten)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {currentPlanLevel >= 2 ? (
                      <Link to="/admin/productos">
                        <Button size="sm" variant="outline" className="text-xs h-8 font-semibold">
                          Asignar Etiquetas
                        </Button>
                      </Link>
                    ) : (
                      <Link to="/admin/plan">
                        <Button size="sm" variant="outline" className="text-xs h-8 border-amber-300 text-amber-800 hover:bg-amber-50 font-semibold gap-1">
                          <Lock className="h-3 w-3" /> Desbloquear
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panel de Live Preview Lateral (Solo visible en escritorio desktop) */}
        <div className="hidden lg:block lg:col-span-5">
          <div className="sticky top-6 rounded-3xl border border-zinc-900 bg-[#09090b] p-3 shadow-2xl space-y-3">
            <div className="flex items-center justify-between px-3 pt-2 text-white">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold">Live Preview</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsPreviewOpen(true)}
                className="text-zinc-400 hover:text-white text-xs gap-1.5 h-7 px-2"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                Expandir
              </Button>
            </div>

            {/* Frame de Teléfono Simulado */}
            <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-950 shadow-inner">
              <PublicCatalog store={previewStore as any} mode="catalog" isMockup={true} />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Previsualización Expandida con Conmutador Móvil / Escritorio */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent
          className={cn(
            "p-0 overflow-hidden bg-zinc-950 border-zinc-800 rounded-3xl flex flex-col transition-all duration-300 [&>button:last-child]:hidden",
            previewDevice === "mobile"
              ? "max-w-2xl w-[95vw] h-[92vh]"
              : "max-w-6xl w-[95vw] h-[92vh]"
          )}
        >
          <DialogHeader className="p-3 bg-zinc-900 border-b border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <DialogTitle className="text-white text-xs sm:text-sm font-bold flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Vista Previa Expandida
              </DialogTitle>

              {/* Botón Salir Prominente */}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setIsPreviewOpen(false)}
                className="h-8 px-3.5 rounded-xl text-xs font-extrabold gap-1 text-white bg-red-600 hover:bg-red-700 active:scale-95 shadow-md"
              >
                <X className="h-4 w-4" />
                <span>Salir</span>
              </Button>
            </div>

            <div className="flex items-center justify-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all flex-1 sm:flex-none justify-center",
                  previewDevice === "mobile"
                    ? "bg-primary text-white shadow-md"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <Smartphone className="h-3.5 w-3.5" />
                Móvil
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all flex-1 sm:flex-none justify-center",
                  previewDevice === "desktop"
                    ? "bg-primary text-white shadow-md"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <Monitor className="h-3.5 w-3.5" />
                Escritorio (PC)
              </button>
            </div>
          </DialogHeader>

          <div className="flex-1 w-full h-full overflow-y-auto bg-zinc-900 flex justify-center p-4">
            {previewDevice === "mobile" ? (
              <div className="w-[375px] h-[680px] sm:w-[390px] sm:h-[750px] bg-white rounded-[40px] border-[8px] border-zinc-800 shadow-2xl overflow-hidden relative my-auto shrink-0">
                <div className="absolute top-0 inset-x-0 h-5 bg-zinc-800 rounded-b-2xl w-28 mx-auto z-30 pointer-events-none" />
                <div className="w-full h-full overflow-y-auto">
                  <PublicCatalog store={previewStore as any} mode="catalog" isMockup={true} />
                </div>
              </div>
            ) : (
              <div className="w-full h-full bg-white rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
                <div className="bg-zinc-800 px-4 py-2 border-b border-zinc-700 flex items-center gap-3 shrink-0">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 bg-zinc-900 text-zinc-400 text-xs py-1 px-3 rounded-md font-mono flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-emerald-400" /> https://dizi.pe/{store.slug}
                  </div>
                </div>
                <div className="flex-1 w-full overflow-y-auto">
                  <PublicCatalog store={previewStore as any} mode="catalog" isMockup={true} />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
