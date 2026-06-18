import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Lock, Check, Sparkles, Crown, Palette, Image, Sliders, Eye } from "lucide-react";
import { type PlanId, LAYOUT_IMAGE_SPECS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PublicCatalog } from "@/components/public/PublicCatalog";

export const Route = createFileRoute("/admin/diseno")({
  component: DisenoPage,
});

const PLAN_LEVELS: Record<PlanId, number> = {
  semilla: 0,
  emprendedor: 1,
  pro: 3,
  ilimitado: 3,
};

/* ─────────────────────────────────────────────────────────
   BRAND COLORS
───────────────────────────────────────────────────────── */
const BRAND_COLORS = [
  { id: "default", name: "Color del modelo", hex: "", display: "#e2e8f0" },
  { id: "indigo",  name: "Índigo",           hex: "#4f46e5", display: "#4f46e5" },
  { id: "blue",    name: "Azul Océano",       hex: "#2563eb", display: "#2563eb" },
  { id: "cyan",    name: "Cyan",              hex: "#0891b2", display: "#0891b2" },
  { id: "green",   name: "Esmeralda",         hex: "#059669", display: "#059669" },
  { id: "lime",    name: "Lima",              hex: "#65a30d", display: "#65a30d" },
  { id: "amber",   name: "Ámbar",             hex: "#d97706", display: "#d97706" },
  { id: "orange",  name: "Naranja",           hex: "#ea580c", display: "#ea580c" },
  { id: "red",     name: "Rojo Coral",        hex: "#dc2626", display: "#dc2626" },
  { id: "rose",    name: "Rosa",              hex: "#e11d48", display: "#e11d48" },
  { id: "pink",    name: "Rosa Pastel",       hex: "#db2777", display: "#db2777" },
  { id: "purple",  name: "Púrpura",           hex: "#7c3aed", display: "#7c3aed" },
  { id: "slate",   name: "Carbón",            hex: "#334155", display: "#334155" },
];

/* ─────────────────────────────────────────────────────────
   BACKGROUND COLORS — para personalizar el fondo del catálogo
───────────────────────────────────────────────────────── */
const BG_COLORS = [
  { id: "default",  name: "Fondo del modelo",  hex: "",        display: "#e2e8f0" },
  { id: "white",    name: "Blanco puro",        hex: "#ffffff", display: "#ffffff" },
  { id: "cream",    name: "Crema",              hex: "#fdfaf5", display: "#fdfaf5" },
  { id: "ivory",    name: "Marfil",             hex: "#fef9ef", display: "#fef9ef" },
  { id: "rose_bg",  name: "Rosa suave",         hex: "#fff5f7", display: "#fff5f7" },
  { id: "mint_bg",  name: "Menta",              hex: "#f0fefb", display: "#f0fefb" },
  { id: "sky_bg",   name: "Cielo",              hex: "#eff6ff", display: "#eff6ff" },
  { id: "lavender", name: "Lavanda",            hex: "#f5f3ff", display: "#f5f3ff" },
  { id: "sand",     name: "Arena",              hex: "#faf5eb", display: "#faf5eb" },
  { id: "stone",    name: "Piedra",             hex: "#f5f5f4", display: "#f5f5f4" },
  { id: "gray",     name: "Gris claro",         hex: "#f8fafc", display: "#f8fafc" },
  { id: "charcoal", name: "Carbón",             hex: "#1e293b", display: "#1e293b" },
  { id: "midnight", name: "Medianoche",         hex: "#0f172a", display: "#0f172a" },
  { id: "obsidian_bg", name: "Obsidiana",       hex: "#09090b", display: "#09090b" },
];

/* ─────────────────────────────────────────────────────────
   MODEL DEFINITIONS — 12 modelos únicos, sin repetidos

   ELIMINADOS por ser casi idénticos a otros:
   - pastel (hero+círculos = mismo que eco)
   - tropical (grid+círculos = mismo que eco pero en grid)
   - moderno (overlay b&n = fusionado en nocturno/neon)
   - miami (overlay oscuro = similar a nocturno/neon)
   - sakura (editorial = similar a luxury/corporativo)
   - terracotta (editorial = similar a luxury/corporativo)
   - monochrome (magazine b&n = similar a dark_fashion)
   - obsidian (spotlight = igual que boutique)
   - aurora (tiles oscuro = tiles con diferente color)
   - retro_pop (tiles = fusionado en aurora que es más distintivo)
───────────────────────────────────────────────────────── */
interface ModelDef {
  id: string;
  name: string;
  desc: string;
  planLevel: number;
  badge?: string;
  imgShape: "square" | "rounded" | "circle";
  layout: "grid" | "overlay" | "editorial" | "hero" | "magazine" | "tiles" | "spotlight" | "diagonal" | "arch" | "banner_grid";
  bg: string;
  cardBg: string;
  primaryColor: string;
  textColor: string;
  accentColor: string;
  borderRadius: string;
  isDark?: boolean;
  /** Si true, el modelo tiene un fondo único (degradado/imagen CSS) que no se puede personalizar */
  bgLocked?: boolean;
}

const MODELS: ModelDef[] = [
  /* ══ PLAN SEMILLA — 2 modelos ══════════════════════════ */
  {
    id: "minimalista", name: "Minimalista", layout: "grid",
    desc: "Limpio, moderno y atemporal. Rejilla 2×N con tarjetas flotantes y borde sutil.",
    planLevel: 0, badge: "Popular", imgShape: "rounded",
    bg: "#ffffff", cardBg: "#f8fafc", primaryColor: "#4f46e5",
    textColor: "#1e293b", accentColor: "#e0e7ff", borderRadius: "12px",
  },
  {
    id: "clasico", name: "Clásico Cálido", layout: "grid",
    desc: "Tipografía serif y tonos terrosos con tarjetas de borde fino. Artesanías y comida.",
    planLevel: 0, imgShape: "square",
    bg: "#fdfaf5", cardBg: "#fef9ef", primaryColor: "#92400e",
    textColor: "#451a03", accentColor: "#fef3c7", borderRadius: "6px",
  },

  /* ══ PLAN EMPRENDEDOR — 3 modelos ══════════════════════ */
  {
    id: "nature_mint", name: "Nature Mint", layout: "grid",
    desc: "Verde teal fresco con imágenes redondeadas. Salud, bienestar y cafés.",
    planLevel: 1, badge: "Fresh", imgShape: "rounded",
    bg: "#f0fefb", cardBg: "#ffffff", primaryColor: "#0d9488",
    textColor: "#134e4a", accentColor: "#99f6e4", borderRadius: "24px",
  },
  {
    id: "vibrante", name: "Vibrante", layout: "overlay",
    desc: "Cards portrait 3:4 con texto sobre gradiente. Energético tipo Instagram Shopping.",
    planLevel: 1, badge: "Trending", imgShape: "rounded",
    bg: "#fff7ed", cardBg: "#ffffff", primaryColor: "#ea580c",
    textColor: "#431407", accentColor: "#ffedd5", borderRadius: "20px",
  },
  {
    id: "eco", name: "Eco Hero", layout: "hero",
    desc: "Banner hero panorámico + galería circular. El primer producto siempre destaca.",
    planLevel: 1, badge: "Premium", imgShape: "circle",
    bg: "#f0fdf4", cardBg: "#ffffff", primaryColor: "#16a34a",
    textColor: "#14532d", accentColor: "#dcfce7", borderRadius: "999px",
  },

  /* ══ PLAN PRO — 4 modelos ═══════════════════════════════ */
  {
    id: "nocturno", name: "Nocturno", layout: "overlay",
    desc: "Dark mode de alto impacto. Cards portrait 3:4 con texto sobre imagen oscura. Fondo exclusivo.",
    planLevel: 2, badge: "Pro", imgShape: "rounded", isDark: true, bgLocked: true,
    bg: "#0f172a", cardBg: "#1e293b", primaryColor: "#818cf8",
    textColor: "#f1f5f9", accentColor: "#312e81", borderRadius: "16px",
  },
  {
    id: "elite", name: "Elite ✦", layout: "hero",
    desc: "Portada con Banner cinematográfico: Ideal para marcas con identidad visual fuerte.",
    planLevel: 2, badge: "Elite", imgShape: "square",
    bg: "#ffffff", cardBg: "#ffffff", primaryColor: "#1e1e1e",
    textColor: "#111111", accentColor: "#f3f4f6", borderRadius: "0px",
  },
  {
    id: "boutique", name: "Boutique", layout: "spotlight",
    desc: "Editorial fashion: 1 producto estrella grande + 2 complementarios apilados. Farfetch style.",
    planLevel: 2, badge: "Pro", imgShape: "rounded",
    bg: "#faf9f7", cardBg: "#f5efe8", primaryColor: "#9333ea",
    textColor: "#2d1b69", accentColor: "#ede9fe", borderRadius: "16px",
  },
  {
    id: "corporativo", name: "Corporativo Azul", layout: "editorial",
    desc: "Lista horizontal profesional con descripción visible. Servicios y consultoras.",
    planLevel: 2, badge: "Pro", imgShape: "rounded",
    bg: "#eff6ff", cardBg: "#ffffff", primaryColor: "#1d4ed8",
    textColor: "#1e3a5f", accentColor: "#dbeafe", borderRadius: "8px",
  },
  {
    id: "aurora", name: "Aurora Glass", layout: "tiles",
    desc: "Tiles glassmorphism con degradado cósmico. Fondo único irrepetible.",
    planLevel: 2, badge: "Pro ✦", imgShape: "rounded", isDark: true, bgLocked: true,
    bg: "#0d0d1a", cardBg: "#1a1040", primaryColor: "#a855f7",
    textColor: "#e2d9f3", accentColor: "#2d1b6e", borderRadius: "24px",
  },

  /* ══ PLAN ILIMITADO — 3 modelos elite ══════════════════ */
  {
    id: "luxury", name: "Luxury Gold", layout: "editorial",
    desc: "Lista tipo Net-a-Porter: imagen cuadrada + info detallada. Oscuro, dorado, intemporal. Fondo exclusivo.",
    planLevel: 3, badge: "Elite ✦", imgShape: "square", isDark: true, bgLocked: true,
    bg: "#09090b", cardBg: "#18181b", primaryColor: "#ca8a04",
    textColor: "#fafafa", accentColor: "#292524", borderRadius: "4px",
  },
  {
    id: "dark_fashion", name: "Dark Fashion", layout: "magazine",
    desc: "Revista editorial oscura: banners full-width alternados con pares verticales 3:4. Fondo exclusivo.",
    planLevel: 3, badge: "Elite ✦", imgShape: "square", isDark: true, bgLocked: true,
    bg: "#111111", cardBg: "#1c1c1c", primaryColor: "#f5f5f5",
    textColor: "#f5f5f5", accentColor: "#2a2a2a", borderRadius: "0px",
  },
  {
    id: "slash", name: "Slash Diagonal", layout: "diagonal",
    desc: "Cortes diagonales de alto impacto. Imagen slanted + texto. Estilo Nike / streetwear. Fondo exclusivo.",
    planLevel: 3, badge: "Elite ✦", imgShape: "square", isDark: true, bgLocked: true,
    bg: "#0d1117", cardBg: "#1c2128", primaryColor: "#faec45",
    textColor: "#f0f0f0", accentColor: "#21262d", borderRadius: "0px",
  },
  {
    id: "arch_studio", name: "Arch Studio", layout: "arch",
    desc: "Marcos en arco tipo ventana. Tipografía ligera y elegante. Fondo personalizable.",
    planLevel: 3, badge: "Elite", imgShape: "rounded",
    bg: "#faf9f6", cardBg: "#f4f2ed", primaryColor: "#9c6b4e",
    textColor: "#2c1a0e", accentColor: "#e8e0d5", borderRadius: "999px",
  },
  {
    id: "portada", name: "Portada con Banner", layout: "banner_grid",
    desc: "Banner de imagen personalizable en la parte superior + catálogo en grid 2 columnas. Limpio, visual y fácil de usar.",
    planLevel: 3, badge: "Elite ✦", imgShape: "rounded",
    bg: "#ffffff", cardBg: "#f8fafc", primaryColor: "#FF823A",
    textColor: "#1a1a1a", accentColor: "#ffe4d5", borderRadius: "14px",
  },
  {
    id: "sunset_glow", name: "Sunset Glow", layout: "overlay",
    desc: "Degradado atardecer en el fondo — naranja, rosa y morado — con cards portrait flotantes.",
    planLevel: 3, badge: "Elite ✦", imgShape: "rounded", isDark: true, bgLocked: true,
    bg: "#1a0a2e", cardBg: "#2d1040", primaryColor: "#fb923c",
    textColor: "#ffe4d6", accentColor: "#7c2d8e", borderRadius: "20px",
  },
  {
    id: "forest_deep", name: "Forest Deep", layout: "grid",
    desc: "Bosque oscuro con viñeta verde. Fotográfico y orgánico. Fondo personalizable.",
    planLevel: 3, badge: "Elite", imgShape: "rounded",
    bg: "#0d1f0f", cardBg: "#1a2e1c", primaryColor: "#4ade80",
    textColor: "#d1fae5", accentColor: "#166534", borderRadius: "14px",
    isDark: true,
  },
];


/* ─────────────────────────────────────────────────────────
   MINI PREVIEW COMPONENT — cada layout tiene su preview única
───────────────────────────────────────────────────────── */
function ModelPreview({ model, storeName }: { model: ModelDef; storeName: string }) {
  const imgR = model.borderRadius;
  const mini = { backgroundColor: model.primaryColor, opacity: 0.85 };
  const muted = { backgroundColor: model.textColor, opacity: 0.2 };
  const accent = { backgroundColor: model.accentColor };

  const Header = () => (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 shrink-0"
      style={{ backgroundColor: model.bg, borderBottom: `1px solid ${model.accentColor}` }}>
      <div className="h-4 w-4 flex items-center justify-center text-[7px] font-black text-white shrink-0"
        style={{ borderRadius: model.imgShape === "circle" ? "999px" : "4px", backgroundColor: model.primaryColor }}>
        {storeName.charAt(0).toUpperCase()}
      </div>
      <div className="h-1.5 rounded-full w-10" style={{ backgroundColor: model.textColor, opacity: 0.45 }} />
      <div className="flex-1" />
      <div className="h-3 rounded-full px-1.5 text-[5px] font-bold flex items-center"
        style={{ backgroundColor: model.primaryColor, color: "#fff" }}>Contacto</div>
    </div>
  );

  const SearchBar = () => (
    <div className="px-2.5 py-1 shrink-0">
      <div className="h-3 rounded-full w-full flex items-center px-1.5 gap-1"
        style={{ backgroundColor: model.accentColor }}>
        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: model.primaryColor, opacity: 0.6 }} />
        <div className="h-1 rounded-full flex-1" style={{ backgroundColor: model.textColor, opacity: 0.25 }} />
      </div>
    </div>
  );

  /* ── BANNER GRID: portada con imagen + grid 2 col ── */
  if (model.layout === "banner_grid") {
    return (
      <div className="h-48 w-full overflow-hidden flex flex-col" style={{ backgroundColor: model.bg }}>
        <Header />
        <div className="px-2 pt-1 pb-0.5 shrink-0">
          {/* Banner simulado */}
          <div className="relative w-full overflow-hidden mb-1.5" style={{ height: "52px", borderRadius: "8px" }}>
            <div className="absolute inset-0" style={{
              background: `linear-gradient(135deg, ${model.primaryColor}cc, ${model.accentColor}dd)`,
            }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 40%, transparent)" }} />
            {/* Icono de imagen en esquina */}
            <div className="absolute top-1.5 right-1.5 h-3.5 w-3.5 rounded flex items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.25)" }}>
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#fff", opacity: 0.8 }} />
            </div>
            {/* Texto de portada */}
            <div className="absolute bottom-1.5 left-2 space-y-0.5">
              <div className="h-1.5 rounded-full w-16" style={{ backgroundColor: "#fff", opacity: 0.9 }} />
              <div className="h-1 rounded-full w-10" style={{ backgroundColor: "#fff", opacity: 0.55 }} />
            </div>
          </div>
        </div>
        {/* Grid 2 columnas */}
        <div className="grid grid-cols-2 gap-1 px-2 pb-1.5 flex-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="overflow-hidden flex flex-col"
              style={{ borderRadius: "6px", backgroundColor: model.cardBg }}>
              {/* Imagen cuadrada */}
              <div style={{
                aspectRatio: "1/1",
                background: i % 2 === 0
                  ? `linear-gradient(135deg, ${model.primaryColor}bb, ${model.accentColor}aa)`
                  : `linear-gradient(135deg, ${model.accentColor}cc, ${model.primaryColor}66)`,
              }} />
              {/* Info */}
              <div className="p-1 space-y-0.5">
                <div className="h-1 rounded-full w-4/5" style={{ backgroundColor: model.textColor, opacity: 0.5 }} />
                <div className="flex items-center justify-between">
                  <div className="h-1.5 rounded-full w-2/5" style={{ backgroundColor: model.primaryColor, opacity: 0.9 }} />
                  <div className="h-3 w-3 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: model.primaryColor }}>
                    <div className="h-0.5 w-0.5 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── OVERLAY: portrait 3:4 con texto sobre gradiente ── */
  if (model.layout === "overlay") {
    const cols = model.isDark ? 3 : 3;
    return (
      <div className="h-48 w-full overflow-hidden flex flex-col" style={{ backgroundColor: model.bg }}>
        <Header />
        <div className={`flex gap-1 px-2 py-1.5 flex-1 overflow-hidden`}>
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="flex-1 relative overflow-hidden flex flex-col"
              style={{ borderRadius: imgR }}>
              {/* Simulated photo */}
              <div className="flex-1" style={{
                background: i % 2 === 0
                  ? `linear-gradient(135deg, ${model.primaryColor}cc, ${model.accentColor}aa)`
                  : `linear-gradient(135deg, ${model.accentColor}cc, ${model.primaryColor}88)`,
              }} />
              {/* Dark gradient overlay */}
              <div className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 38%, transparent 72%)" }} />
              {/* Sale tag on first */}
              {i === 0 && (
                <div className="absolute top-1.5 left-1.5">
                  <div className="text-[4.5px] font-black px-1 py-0.5 rounded-full"
                    style={{ backgroundColor: "#ef4444", color: "#fff" }}>OFERTA</div>
                </div>
              )}
              {/* Text on bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-1.5 space-y-0.5">
                <div className="h-1 rounded-full w-4/5" style={{ backgroundColor: "#fff", opacity: 0.85 }} />
                <div className="flex items-center justify-between">
                  <div className="h-1.5 rounded-full w-2/5" style={mini} />
                  <div className="h-3.5 w-3.5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: model.primaryColor }}>
                    <div className="h-0.5 w-0.5 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── EDITORIAL: lista horizontal estilo Net-a-Porter ── */
  if (model.layout === "editorial") {
    return (
      <div className="h-48 w-full overflow-hidden flex flex-col" style={{ backgroundColor: model.bg }}>
        <Header />
        <div className="flex-1 overflow-hidden px-2 py-1.5 space-y-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-2 items-center py-1.5"
              style={{ borderBottom: `1px solid ${model.accentColor}` }}>
              {/* Imagen cuadrada */}
              <div className="shrink-0 relative overflow-hidden"
                style={{ width: "32px", height: "32px", borderRadius: model.isDark ? "2px" : imgR }}>
                <div className="absolute inset-0" style={{
                  background: i === 0
                    ? `linear-gradient(135deg, ${model.primaryColor}, ${model.accentColor}88)`
                    : `linear-gradient(135deg, ${model.accentColor}, ${model.primaryColor}55)`,
                }} />
              </div>
              {/* Texto */}
              <div className="flex-1 space-y-1">
                <div className="h-1.5 rounded-full" style={{ width: i === 0 ? "80%" : i === 1 ? "65%" : "70%", backgroundColor: model.textColor, opacity: 0.6 }} />
                <div className="h-1 rounded-full w-full" style={{ backgroundColor: model.textColor, opacity: 0.2 }} />
              </div>
              {/* Precio */}
              <div className="shrink-0 h-2 rounded-full w-7" style={{ ...mini }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── HERO: banner panorámico + mini grid con imágenes circulares ── */
  if (model.layout === "hero") {
    return (
      <div className="h-48 w-full overflow-hidden flex flex-col" style={{ backgroundColor: model.bg }}>
        <Header />
        <div className="px-2 pt-1 shrink-0">
          {/* Hero banner */}
          <div className="relative w-full overflow-hidden mb-1.5" style={{ height: "58px", borderRadius: imgR === "999px" ? "16px" : imgR }}>
            <div className="absolute inset-0"
              style={{ background: `linear-gradient(135deg, ${model.primaryColor}dd, ${model.accentColor}99)` }} />
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(to right, rgba(0,0,0,0.55) 35%, transparent)" }} />
            <div className="absolute top-1.5 left-2 text-[5px] font-bold tracking-widest uppercase"
              style={{ color: model.primaryColor, backgroundColor: "#fff", padding: "1px 4px", borderRadius: "3px" }}>Destacado</div>
            <div className="absolute bottom-0 left-0 p-2 space-y-0.5">
              <div className="h-1.5 rounded-full w-14" style={{ backgroundColor: "#fff", opacity: 0.9 }} />
              <div className="h-2 rounded-full w-10" style={{ backgroundColor: "#fff", opacity: 0.6 }} />
            </div>
            <div className="absolute bottom-2 right-2 h-3.5 px-2 rounded-full flex items-center text-[5px] font-bold"
              style={{ backgroundColor: model.primaryColor, color: "#fff" }}>Añadir</div>
          </div>
        </div>
        {/* Grid círculos */}
        <div className="flex gap-1 px-2 pb-1.5 flex-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full" style={{
                aspectRatio: "1/1",
                borderRadius: "999px",
                background: i % 2 === 0
                  ? `${model.primaryColor}cc`
                  : `${model.accentColor}dd`,
                border: `1.5px solid ${model.accentColor}`,
              }} />
              <div className="h-1 rounded-full w-4/5" style={{ ...muted }} />
              <div className="h-1.5 rounded-full w-3/5" style={{ ...mini }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── MAGAZINE: full-width banner + pares 3:4 ── */
  if (model.layout === "magazine") {
    return (
      <div className="h-48 w-full overflow-hidden flex flex-col" style={{ backgroundColor: model.bg }}>
        <Header />
        <div className="flex-1 overflow-hidden space-y-0.5 px-0 pt-1">
          {/* Full-width editorial banner */}
          <div className="relative overflow-hidden mx-0" style={{ height: "44px" }}>
            <div className="absolute inset-0"
              style={{ background: `linear-gradient(90deg, ${model.primaryColor}cc, ${model.accentColor}88)` }} />
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)" }} />
            <div className="absolute top-1 left-2 text-[4.5px] font-bold tracking-[0.3em] uppercase"
              style={{ color: model.isDark ? model.primaryColor : "#fff", opacity: 0.7 }}>Editorial</div>
            <div className="absolute bottom-1 left-2 right-2 flex items-center justify-between">
              <div className="h-1.5 rounded-sm w-20" style={{ backgroundColor: "#fff", opacity: 0.9 }} />
              <div className="h-3 px-1.5 flex items-center text-[4px] font-bold"
                style={{ border: "0.5px solid rgba(255,255,255,0.5)", color: "#fff" }}>VER</div>
            </div>
          </div>
          {/* 2 columnas 3:4 */}
          <div className="flex gap-0.5 flex-1 pb-1 px-0">
            {[0, 1].map((i) => (
              <div key={i} className="flex-1 relative overflow-hidden" style={{ minHeight: "70px" }}>
                <div className="absolute inset-0"
                  style={{
                    background: i === 0
                      ? `linear-gradient(160deg, ${model.accentColor}cc, ${model.primaryColor}88)`
                      : `linear-gradient(160deg, ${model.primaryColor}aa, ${model.accentColor}cc)`,
                  }} />
                <div className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 40%, transparent)" }} />
                <div className="absolute bottom-0 left-0 right-0 p-1.5">
                  <div className="h-1 rounded-sm w-3/4 mb-0.5" style={{ backgroundColor: "#fff", opacity: 0.85 }} />
                  <div className="h-1.5 rounded-sm w-1/2" style={{ backgroundColor: "#fff", opacity: 0.5 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── TILES: 1 banner ancho + 2 cuadros ── */
  if (model.layout === "tiles") {
    return (
      <div className="h-48 w-full overflow-hidden flex flex-col" style={{ backgroundColor: model.bg }}>
        <Header />
        <div className="px-2 pt-1 space-y-1 flex-1 overflow-hidden">
          {/* Banner ancho */}
          <div className="relative overflow-hidden w-full" style={{ height: "54px", borderRadius: imgR }}>
            <div className="absolute inset-0"
              style={{ background: `linear-gradient(120deg, ${model.primaryColor}ee, ${model.accentColor}99)` }} />
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(to right, rgba(0,0,0,0.55) 30%, transparent)" }} />
            {/* Glass tag */}
            <div className="absolute top-2 right-2 h-4 px-2 flex items-center rounded text-[4.5px] font-bold"
              style={{ backgroundColor: model.primaryColor, color: "#000", opacity: 0.9 }}>NUEVO</div>
            <div className="absolute bottom-0 left-0 p-2 space-y-0.5">
              <div className="h-1.5 rounded-full w-20" style={{ backgroundColor: "#fff", opacity: 0.9 }} />
              <div className="flex items-center gap-1">
                <div className="h-2 rounded-full w-10" style={{ backgroundColor: "#fff", opacity: 0.5 }} />
              </div>
            </div>
          </div>
          {/* 2 cuadros */}
          <div className="flex gap-1 flex-1 pb-1">
            {[0, 1].map((i) => (
              <div key={i} className="flex-1 relative overflow-hidden" style={{ borderRadius: imgR, minHeight: "52px" }}>
                <div className="absolute inset-0"
                  style={{
                    background: i === 0
                      ? `linear-gradient(145deg, ${model.accentColor}dd, ${model.primaryColor}88)`
                      : `linear-gradient(145deg, ${model.primaryColor}99, ${model.accentColor}cc)`,
                  }} />
                <div className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 35%, transparent)" }} />
                <div className="absolute bottom-0 left-0 right-0 p-1.5">
                  <div className="h-1 rounded-full w-3/4" style={{ backgroundColor: "#fff", opacity: 0.85 }} />
                  <div className="flex items-center justify-between mt-0.5">
                    <div className="h-1.5 rounded-full w-2/5" style={{ ...mini }} />
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: model.primaryColor, opacity: 0.9 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── SPOTLIGHT: 1 grande izquierda + 2 apilados derecha ── */
  if (model.layout === "spotlight") {
    return (
      <div className="h-48 w-full overflow-hidden flex flex-col" style={{ backgroundColor: model.bg }}>
        <Header />
        <div className="flex gap-1 px-2 pb-2 pt-1 flex-1 overflow-hidden">
          {/* Grande izquierda */}
          <div className="flex-1 relative overflow-hidden" style={{ borderRadius: imgR }}>
            <div className="absolute inset-0"
              style={{ background: `linear-gradient(150deg, ${model.primaryColor}dd, ${model.accentColor}99)` }} />
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 28%, rgba(0,0,0,0.08) 70%)" }} />
            <div className="absolute top-2 left-2 text-[4.5px] font-bold tracking-widest uppercase"
              style={{ color: model.primaryColor }}>Destacado</div>
            <div className="absolute bottom-0 left-0 right-0 p-2 space-y-0.5">
              <div className="h-1 rounded-full w-4/5" style={{ backgroundColor: "#fff", opacity: 0.55 }} />
              <div className="h-1.5 rounded-full w-3/5" style={{ backgroundColor: "#fff", opacity: 0.9 }} />
              <div className="h-2.5 rounded-full w-8 mt-0.5" style={{ ...mini }} />
            </div>
          </div>
          {/* 2 apilados derecha */}
          <div className="flex-1 flex flex-col gap-1">
            {[0, 1].map((i) => (
              <div key={i} className="flex-1 relative overflow-hidden" style={{ borderRadius: imgR }}>
                <div className="absolute inset-0"
                  style={{
                    background: i === 0
                      ? `linear-gradient(120deg, ${model.accentColor}cc, ${model.primaryColor}88)`
                      : `linear-gradient(120deg, ${model.primaryColor}aa, ${model.accentColor}bb)`,
                  }} />
                <div className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 38%, transparent)" }} />
                <div className="absolute bottom-0 left-0 right-0 p-1.5">
                  <div className="h-1 rounded-full w-3/4" style={{ backgroundColor: "#fff", opacity: 0.85 }} />
                  <div className="flex justify-between items-center mt-0.5">
                    <div className="h-1.5 rounded-full w-2/5" style={{ ...mini }} />
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: model.primaryColor }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── DIAGONAL: cortes diagonales estilo Nike ── */
  if (model.layout === "diagonal") {
    return (
      <div className="h-48 w-full overflow-hidden flex flex-col" style={{ backgroundColor: model.bg }}>
        <Header />
        <div className="flex-1 overflow-hidden">
          {[0, 1].map((i) => (
            <div key={i} className="flex" style={{ height: "46%" }}>
              {/* Bloque con clip diagonal */}
              <div className="flex-1 relative overflow-hidden" style={{
                clipPath: i % 2 === 0
                  ? "polygon(0 0, 100% 0, 100% 80%, 0 100%)"
                  : "polygon(0 0, 100% 0, 100% 100%, 0 80%)",
                background: i === 0
                  ? `linear-gradient(120deg, ${model.primaryColor}dd, ${model.accentColor}99)`
                  : `linear-gradient(120deg, ${model.accentColor}bb, ${model.primaryColor}cc)`,
              }}>
                {/* Tag diagonal */}
                <div className="absolute top-1.5 left-2 text-[4.5px] font-black px-1.5 py-0.5 tracking-widest"
                  style={{ backgroundColor: model.primaryColor, color: "#000" }}>
                  {i === 0 ? "NEW" : "SALE"}
                </div>
              </div>
              {/* Columna de texto */}
              <div className="w-2/5 px-2 py-1.5 flex flex-col justify-center gap-1"
                style={{ backgroundColor: model.cardBg }}>
                <div className="h-1 rounded-full w-full" style={{ ...muted }} />
                <div className="h-2 rounded-full w-3/4" style={{ ...mini }} />
                <div className="h-3 rounded w-12 mt-0.5 flex items-center justify-center text-[4px] font-black"
                  style={{ backgroundColor: model.primaryColor, color: "#000" }}>AÑADIR</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── ARCH: marcos en arco, lujo y perfumería ── */
  if (model.layout === "arch") {
    return (
      <div className="h-48 w-full overflow-hidden flex flex-col" style={{ backgroundColor: model.bg }}>
        <Header />
        <div className="flex gap-2 px-2 py-2 flex-1 overflow-hidden items-start">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              {/* Marco arco */}
              <div className="relative overflow-hidden w-full" style={{
                aspectRatio: "3/4",
                borderRadius: "999px 999px 6px 6px",
                background: i === 0
                  ? `linear-gradient(160deg, ${model.primaryColor}cc, ${model.accentColor}88)`
                  : i === 1
                    ? `linear-gradient(160deg, ${model.accentColor}aa, ${model.primaryColor}77)`
                    : `linear-gradient(160deg, ${model.primaryColor}88, ${model.accentColor}cc)`,
                border: `1px solid ${model.accentColor}`,
                opacity: i === 0 ? 1 : 0.75,
              }}>
                {/* Highlight superior */}
                <div className="absolute top-0 left-0 right-0 h-1/3"
                  style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)" }} />
              </div>
              {/* Leyenda */}
              <div className="h-1 rounded-full w-4/5" style={{ ...muted }} />
              <div className="h-1.5 rounded-full w-1/2" style={{ ...mini }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── GRID (default): rejilla 2×3 con tarjetas ── */
  return (
    <div className="h-48 w-full overflow-hidden flex flex-col" style={{ backgroundColor: model.bg }}>
      <Header />
      <SearchBar />
      <div className="grid grid-cols-3 gap-1 px-2 pb-2 flex-1 overflow-hidden">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col gap-0.5 overflow-hidden"
            style={{
              backgroundColor: model.cardBg,
              borderRadius: imgR,
              padding: "4px",
              border: `1px solid ${model.accentColor}`,
            }}>
            {/* Imagen simulada */}
            <div style={{
              height: "28px",
              borderRadius: imgR === "999px" ? "999px" : "calc(" + imgR + " - 2px)",
              background: i % 3 === 0
                ? `${model.primaryColor}cc`
                : `${model.accentColor}dd`,
            }} />
            <div className="h-1 rounded-full w-4/5" style={{ ...muted }} />
            <div className="h-1.5 rounded-full w-1/2" style={{ ...mini }} />
          </div>
        ))}
      </div>
    </div>
  );
}


/* ─────────────────────────────────────────────────────────
   COLOR SWATCH — reutilizable para marca y fondo
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
                <Check className="h-3.5 w-3.5 drop-shadow"
                  style={{ color: c.hex === "" ? "#64748b" : c.hex === "#ffffff" || c.hex === "#fdfaf5" || c.hex === "#fef9ef" || c.hex === "#fff5f7" || c.hex === "#f0fefb" || c.hex === "#eff6ff" || c.hex === "#f5f3ff" || c.hex === "#faf5eb" || c.hex === "#f5f5f4" || c.hex === "#f8fafc" ? "#334155" : "#ffffff" }} />
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


/* ─────────────────────────────────────────────────────────
   PAGE COMPONENT
───────────────────────────────────────────────────────── */
function DisenoPage() {
  const id = useApp((s) => s.currentStoreId);
  const store = useApp((s) => s.stores.find((st) => st.id === id));
  const update = useApp((s) => s.updateStore);

  if (!store) return null;

  const [activeTab, setActiveTab] = useState(String(PLAN_LEVELS[store.plan]));
  const [selectedModel, setSelectedModel] = useState(store.model || "minimalista");
  const [brandColor, setBrandColor] = useState(store.brandColor || "");
  const [bgColor, setBgColor] = useState((store as any).bgColor || "");
  const [bannerImage, setBannerImage] = useState((store as any).bannerImage || "");
  const [bannerTitle, setBannerTitle] = useState((store as any).bannerTitle || "");
  const [bannerStyle, setBannerStyle] = useState<"direct" | "framed" | "curved">((store as any).bannerStyle || "framed");
  const [activeCustomizerTab, setActiveCustomizerTab] = useState<"estilo" | "colores" | "banners" | "ajustes">("estilo");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const userLevel = PLAN_LEVELS[store.plan];

  useEffect(() => {
    // Cuando bannerImage cambia a estar definido (es decir, fetchData termina)
    if (store && (store as any).bannerImage !== undefined && !isLoaded) {
      setSelectedModel(store.model || "minimalista");
      setBrandColor(store.brandColor || "");
      setBgColor((store as any).bgColor || "");
      setBannerImage((store as any).bannerImage || "");
      setBannerTitle((store as any).bannerTitle || "");
      setBannerStyle((store as any).bannerStyle || "framed");
      setIsLoaded(true);
    }
  }, [store, isLoaded]);

  // Determinar si el modelo actualmente seleccionado tiene fondo bloqueado
  const selectedModelDef = MODELS.find(m => m.id === selectedModel);
  const isBgLocked = selectedModelDef?.bgLocked === true;

  // Si el modelo tiene fondo bloqueado, siempre ignorar el bgColor del estado
  const effectiveBgColor = isBgLocked ? "" : bgColor;

  const isDirty =
    selectedModel !== (store.model || "minimalista") ||
    brandColor !== (store.brandColor || "") ||
    effectiveBgColor !== ((store as any).bgColor || "") ||
    bannerImage !== ((store as any).bannerImage || "") ||
    bannerTitle !== ((store as any).bannerTitle || "") ||
    bannerStyle !== ((store as any).bannerStyle || "framed");

  const handleModelSelect = (modelId: string) => {
    const def = MODELS.find(m => m.id === modelId);
    setSelectedModel(modelId);
    // Si el nuevo modelo tiene fondo bloqueado, limpiar el bgColor del estado
    if (def?.bgLocked) {
      setBgColor("");
    }
  };

  const save = async () => {
    const toastId = toast.loading("Guardando diseño...");
    try {
      await update(store.id, {
        model: selectedModel as any,
        brandColor: brandColor || null,
        bgColor: effectiveBgColor || null,
        bannerImage: bannerImage || null,
        bannerTitle: bannerTitle || null,
        bannerStyle: bannerStyle || "framed",
      } as any);

      // Update local state to the saved URL with cache-busting timestamp
      const updatedStore = useApp.getState().stores.find((st) => st.id === store.id);
      if (updatedStore) {
        setBannerImage((updatedStore as any).bannerImage ?? "");
        setBannerStyle((updatedStore as any).bannerStyle ?? "framed");
      }

      toast.success("🎨 Diseño aplicado a tu catálogo", { id: toastId });
    } catch (err) {
      console.error("[save diseño]", err);
      toast.error("Error al guardar. Revisa la consola.", { id: toastId });
    }
  };

  const planGroups = [
    { label: "Semilla", level: 0, color: "text-gray-600 bg-gray-100" },
    { label: "Emprendedor", level: 1, color: "text-blue-700 bg-blue-50 border border-blue-200" },
    { label: "Pro", level: 2, color: "text-purple-700 bg-purple-50 border border-purple-200" },
    { label: "Ilimitado", level: 3, color: "text-amber-700 bg-amber-50 border border-amber-200" },
  ];


  const previewStore = {
    ...store,
    model: selectedModel,
    brandColor: brandColor,
    bgColor: effectiveBgColor,
    bannerImage: bannerImage,
    bannerTitle: bannerTitle,
    bannerStyle: bannerStyle,
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b pb-5 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Palette className="h-8 w-8 text-primary animate-pulse" />
            Personalizador de Diseños
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Diseña un catálogo espectacular y fácil de usar para tus clientes. Los cambios se reflejan en tiempo real.
          </p>
        </div>
        <Badge className="bg-primary/10 text-primary border border-primary/20 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {store.model && store.model !== "default" ? `Diseño ${store.model.toUpperCase()} Activo` : "Diseño Estándar Activo"}
        </Badge>
      </div>

      {/* ── Sub-navigation slider tabs ───────────────── */}
      <div className="bg-zinc-100/80 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl p-1.5 w-full flex gap-1 shadow-sm border border-zinc-200/40 dark:border-zinc-800/40 mb-8 sticky top-14 z-30">
        {[
          { id: "estilo", label: "Estilo & Plantilla", icon: Sparkles },
          { id: "colores", label: "Paleta de Colores", icon: Palette },
          { id: "banners", label: "Portada & Banners", icon: Image },
          { id: "ajustes", label: "Ajustes de Diseño", icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeCustomizerTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCustomizerTab(tab.id as any)}
              className={cn(
                "flex-grow py-3 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer select-none",
                active
                  ? "bg-white dark:bg-zinc-955 text-zinc-900 dark:text-zinc-50 shadow-sm border border-zinc-200/20"
                  : "text-zinc-500 hover:text-zinc-855 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-zinc-400")} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col lg:flex-row gap-10 items-start">
        {/* Left Side: Configuration Controls */}
        <div className="flex-grow w-full max-w-2xl space-y-6 min-h-[480px]">

          {/* TAB 1: ESTILO & PLANTILLA */}
          {activeCustomizerTab === "estilo" && (
            <div className="rounded-3xl border border-zinc-200/85 bg-white p-6 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: "var(--border)" }}>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900">Seleccionar Plantilla</h3>
                  <p className="text-xs text-zinc-500">Escoge el modelo visual idóneo para tus productos y marca.</p>
                </div>
              </div>

              {/* Tabs por plan */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="w-full overflow-x-auto pb-2 scrollbar-none">
                  <TabsList className="flex h-11 items-center justify-start rounded-xl bg-zinc-100 p-1 text-muted-foreground w-full">
                    {planGroups.map((group) => (
                      <TabsTrigger
                        key={group.level}
                        value={String(group.level)}
                        className="flex-grow inline-flex items-center justify-center whitespace-nowrap rounded-lg px-2 py-2 text-xs font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border"
                      >
                        {group.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {planGroups.map((group) => {
                  const groupModels = MODELS.filter((m) => m.planLevel === group.level);
                  const locked = group.level > userLevel;

                  return (
                    <TabsContent key={group.level} value={String(group.level)} className="mt-6 animate-in fade-in-50 duration-300">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-extrabold text-sm text-zinc-800">Modelos del Plan {group.label}</h4>
                            {locked && (
                              <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                                <Lock className="h-3 w-3" /> Requiere actualización de plan
                              </p>
                            )}
                          </div>
                          {locked && (
                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-zinc-100 border-none text-zinc-500">
                              Bloqueado
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {groupModels.map((model) => {
                            const isLocked = model.planLevel > userLevel;
                            const isSelected = selectedModel === model.id;
                            const isActive = (store.model || "minimalista") === model.id;

                            return (
                              <div
                                key={model.id}
                                onClick={() => !isLocked && handleModelSelect(model.id)}
                                className={cn(
                                  "group relative rounded-2xl overflow-hidden border-2 transition-all duration-300",
                                  isLocked
                                    ? "opacity-60 cursor-not-allowed grayscale-[20%]"
                                    : "cursor-pointer hover:shadow-lg hover:-translate-y-0.5",
                                  isSelected
                                    ? "border-primary shadow-md shadow-primary/15 -translate-y-0.5"
                                    : "border-zinc-200/80 bg-zinc-50/30 hover:border-primary/40"
                                )}
                              >
                                {/* Check seleccionado */}
                                {isSelected && !isLocked && (
                                  <div className="absolute top-2.5 right-2.5 z-20 h-6.5 w-6.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow animate-in zoom-in duration-200">
                                    <Check className="h-3.5 w-3.5" />
                                  </div>
                                )}

                                {/* Candado */}
                                {isLocked && (
                                  <div className="absolute inset-0 z-10 bg-black/5 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1.5">
                                    <div className="h-8 w-8 rounded-full bg-white/90 shadow flex items-center justify-center">
                                      <Lock className="h-4 w-4 text-zinc-500" />
                                    </div>
                                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-zinc-500">
                                      Premium
                                    </span>
                                  </div>
                                )}

                                {/* Preview visual */}
                                <div className="relative">
                                  {model.bgLocked && !isLocked && (
                                    <div className="absolute top-2.5 right-2.5 z-20">
                                      <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white rounded-full px-2 py-0.5">
                                        <Lock className="h-2 w-2" />
                                        <span className="text-[6.5px] font-bold">Fondo único</span>
                                      </div>
                                    </div>
                                  )}
                                  {model.badge && !isLocked && (
                                    <div className="absolute top-2.5 left-2.5 z-20">
                                      <Badge className="bg-black/45 backdrop-blur-md text-white border-none text-[7.5px] font-bold tracking-wider uppercase py-0.5 px-1.5">
                                        {model.badge}
                                      </Badge>
                                    </div>
                                  )}
                                  <ModelPreview model={model} storeName={store.name} />
                                </div>

                                {/* Footer info */}
                                <div className="p-3 border-t bg-white flex flex-col gap-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-extrabold text-xs text-zinc-800">{model.name}</span>
                                    {isActive && (
                                      <Badge className="h-4.5 px-1.5 text-[8px] font-extrabold bg-primary/10 text-primary border-none">
                                        ACTIVO
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-zinc-500 leading-snug line-clamp-2">
                                    {model.desc}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>

              {/* Upgrade CTA */}
              {(store.plan === "semilla" || store.plan === "emprendedor") && (
                <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 p-4.5 flex items-center gap-4 mt-6">
                  <Crown className="h-8 w-8 text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-blue-900">Desbloquea diseños premium exclusivos</p>
                    <p className="text-[11px] text-blue-700 mt-0.5">
                      Actualiza tu plan y obtén acceso a los {MODELS.filter(m => m.planLevel > userLevel).length} modelos avanzados restantes.
                    </p>
                  </div>
                  <a
                    href="https://wa.me/51925176472?text=Hola,%20quiero%20actualizar%2520mi%2520plan%2520en%2520Dizi"
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-xs font-bold transition shadow"
                  >
                    Saber más
                  </a>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PALETA DE COLORES */}
          {activeCustomizerTab === "colores" && (
            <div className="rounded-3xl border border-zinc-200/85 bg-white p-6 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: "var(--border)" }}>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900">Paleta de Colores</h3>
                  <p className="text-xs text-zinc-550">Personaliza los colores del catálogo para adaptarlos a tu identidad de marca.</p>
                </div>
              </div>

              {/* Color de Acento */}
              <div className="rounded-2xl border bg-zinc-50/30 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Palette className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-zinc-955">Color de Acento</h4>
                      <p className="text-[10px] text-zinc-500">Botones, precios y elementos destacados</p>
                    </div>
                  </div>
                  {brandColor && (
                    <button
                      type="button"
                      onClick={() => setBrandColor("")}
                      className="text-[10px] text-red-650 hover:underline font-bold"
                    >
                      Restablecer
                    </button>
                  )}
                </div>
                <ColorSwatch
                  colors={BRAND_COLORS}
                  selected={brandColor}
                  onSelect={setBrandColor}
                  allowCustom
                  customLabel="Hex personalizado"
                />
              </div>

              {/* Color de Fondo */}
              <div className={cn("rounded-2xl border p-5 space-y-4 transition-all", isBgLocked ? "bg-zinc-100/40 opacity-75" : "bg-zinc-50/30")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", isBgLocked ? "bg-zinc-200" : "bg-primary/10")}>
                      {isBgLocked ? (
                        <Lock className="h-4 w-4 text-zinc-500" />
                      ) : (
                        <Image className="h-4.5 w-4.5 text-primary" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-zinc-955">Color de Fondo</h4>
                      <p className="text-[10px] text-zinc-550">
                        {isBgLocked
                          ? `Fondo único bloqueado para "${selectedModelDef?.name}"`
                          : "Color de fondo de la aplicación y tarjetas"}
                      </p>
                    </div>
                  </div>
                  {!isBgLocked && bgColor && (
                    <button
                      type="button"
                      onClick={() => setBgColor("")}
                      className="text-[10px] text-red-650 hover:underline font-bold"
                    >
                      Restablecer
                    </button>
                  )}
                </div>

                {isBgLocked ? (
                  <div className="rounded-xl border border-dashed bg-white px-4 py-3 flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-full shrink-0 shadow-inner"
                      style={{ background: `linear-gradient(135deg, ${selectedModelDef?.bg}, ${selectedModelDef?.cardBg})` }}
                    />
                    <div>
                      <p className="text-xs font-bold text-zinc-800">Fondo Especial del Modelo</p>
                      <p className="text-[10px] text-zinc-550 leading-snug">Este diseño utiliza un fondo diseñado exclusivamente para mantener su elegancia.</p>
                    </div>
                  </div>
                ) : (
                  <ColorSwatch
                    colors={BG_COLORS}
                    selected={bgColor}
                    onSelect={setBgColor}
                    allowCustom
                    customLabel="Fondo personalizado"
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PORTADA & BANNERS */}
          {activeCustomizerTab === "banners" && (
            <div className="rounded-3xl border border-zinc-200/85 bg-white p-6 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: "var(--border)" }}>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Image className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900">Portada & Banners</h3>
                  <p className="text-xs text-zinc-550">Sube imágenes de portada para darle la bienvenida a tus visitantes.</p>
                </div>
              </div>

              {!(selectedModel === "elite" || selectedModel === "portada") ? (
                <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center space-y-4">
                  <div className="mx-auto h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center">
                    <Image className="h-6 w-6 text-zinc-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-zinc-955">El modelo actual no admite Portada</h4>
                    <p className="text-xs text-zinc-555 max-w-sm mx-auto leading-relaxed">
                      Para poder agregar imágenes de portada y banners, por favor selecciona una plantilla de diseño que lo soporte (como <strong>Elite</strong> o <strong>Portada con Banner</strong>) en la pestaña de <strong>Estilo & Plantilla</strong>.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveCustomizerTab("estilo")}
                    className="rounded-full text-xs font-bold"
                  >
                    Elegir plantilla
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Preview del banner */}
                  {bannerImage && (
                    <div className="relative w-full overflow-hidden rounded-2xl border shadow-inner" style={{ aspectRatio: "16/7" }}>
                      <img src={bannerImage} alt="Banner" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <button
                        type="button"
                        onClick={() => setBannerImage("")}
                        className="absolute top-3 right-3 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all text-xs font-bold border border-white/10"
                      >
                        ✕
                      </button>
                      <p className="absolute bottom-3 left-4 text-white text-xs font-extrabold drop-shadow">
                        {bannerTitle || store.name}
                      </p>
                    </div>
                  )}

                  {/* Guía de dimensiones */}
                  <div className="flex items-start gap-3 rounded-2xl bg-zinc-50 border px-4 py-3.5">
                    <svg className="w-4 h-4 text-zinc-550 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="text-xs font-bold text-zinc-800">Proporción recomendada: 16:7</span>
                        <span className="text-[9px] bg-primary/10 text-primary font-extrabold rounded-full px-2 py-0.5 uppercase tracking-wide">
                          1920 × 700 px mínimo
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-555 leading-relaxed">
                        El banner se adapta al ancho total del catálogo. Recomendamos imágenes horizontales limpias. Puedes usar la herramienta gratuita{" "}
                        <a href="https://squoosh.app" target="_blank" rel="noreferrer" className="text-primary underline font-bold">squoosh.app</a> para comprimir tus imágenes antes de subirlas.
                      </p>
                    </div>
                  </div>

                  {/* Dropzone */}
                  <div className="relative">
                    <label className={cn(
                      "flex flex-col items-center justify-center gap-2.5 py-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all hover:border-primary hover:bg-primary/5",
                      bannerImage ? "border-primary/20 bg-primary/5" : "border-zinc-200"
                    )}>
                      <Image className="h-7 w-7 text-zinc-400" />
                      <span className="text-xs font-bold text-zinc-800">{bannerImage ? "Reemplazar imagen de portada" : "Subir imagen de portada"}</span>
                      <span className="text-[10px] text-zinc-555">Formatos: JPG, PNG, WEBP — máx 10MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 10 * 1024 * 1024) { toast.error("Imagen muy grande (máx 10 MB)"); return; }
                          try {
                            const { convertImageToWebP } = await import("@/lib/image-utils");
                            const webp = await convertImageToWebP(file);
                            setBannerImage(webp);
                          } catch { toast.error("No se pudo procesar la imagen"); }
                        }}
                      />
                    </label>
                  </div>

                  {/* Título del banner */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Título del banner (opcional)</label>
                    <input
                      type="text"
                      value={bannerTitle}
                      onChange={(e) => setBannerTitle(e.target.value)}
                      placeholder={`Catálogo ${store.name}`}
                      className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3.5 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AJUSTES DE DISEÑO */}
          {activeCustomizerTab === "ajustes" && (
            <div className="rounded-3xl border border-zinc-200/85 bg-white p-6 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: "var(--border)" }}>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Sliders className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900">Ajustes de Diseño</h3>
                  <p className="text-xs text-zinc-555">Ajustes detallados para pulir la apariencia final de tu catálogo.</p>
                </div>
              </div>

              {/* Corte del Banner (Banner Style) */}
              {(selectedModel === "elite" || selectedModel === "portada") ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-0.5">
                    <h4 className="font-bold text-xs text-zinc-955">Estilo del Corte de Portada</h4>
                    <p className="text-[10px] text-zinc-500">Controla cómo se integra la imagen de cabecera con el catálogo.</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "direct", label: "Directo", desc: "Borde recto" },
                      { id: "framed", label: "Con Margen", desc: "Efecto recuadro" },
                      { id: "curved", label: "Curvado", desc: "Curva suave" },
                    ].map((style) => {
                      const active = bannerStyle === style.id;
                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setBannerStyle(style.id as any)}
                          className={cn(
                            "flex flex-col gap-1.5 p-3 rounded-xl border-2 text-left cursor-pointer transition-all hover:border-primary/50",
                            active ? "border-primary bg-primary/5 shadow-sm" : "border-zinc-200 bg-white"
                          )}
                        >
                          <span className="text-[11px] font-bold text-zinc-900">{style.label}</span>
                          <span className="text-[9px] text-zinc-555 leading-snug">{style.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : userLevel >= 2 ? (
                <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-primary" />
                    <h4 className="font-extrabold text-xs text-zinc-955">Personalizador Avanzado Disponible</h4>
                  </div>
                  <p className="text-[10px] text-zinc-650 leading-relaxed">
                    Tu plan **{store.plan.toUpperCase()}** incluye el Personalizador de Diseños Premium. Configura tipografías personalizadas, estilos de tarjetas con sombras, y temas específicos para tu nicho.
                  </p>
                  <Link
                    to="/admin/diseno-premium"
                    className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-white rounded-full text-[10px] font-extrabold py-2 px-4 shadow w-fit transition-all active:scale-95 border-none cursor-pointer"
                  >
                    Ir a Diseño Premium
                  </Link>
                </div>
              ) : (
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50/50 p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4.5 w-4.5 text-zinc-400" />
                    <h4 className="font-extrabold text-xs text-zinc-955">Ajustes Premium Bloqueados</h4>
                  </div>
                  <p className="text-[10px] text-zinc-555 leading-relaxed">
                    Las configuraciones de tipografías premium, estilos de tarjetas de producto (borde flotante, sombra suave) y cortes especiales están reservadas para el personalizador avanzado en los planes <strong>Pro</strong> e <strong>Ilimitado</strong>.
                  </p>
                  <a
                    href="https://wa.me/51925176472?text=Hola,%20quiero%2520saber%2520mas%2520sobre%2520disenos%2520premium"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-[10px] font-extrabold py-2 px-4 shadow w-fit transition-all active:scale-95 border-none"
                  >
                    Desbloquear Diseños Premium
                  </a>
                </div>
              )}

              {/* Información Técnica del Layout Activo */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/30 p-4 space-y-3">
                <h4 className="font-extrabold text-xs text-zinc-800">Especificaciones de la Plantilla</h4>
                <div className="grid grid-cols-2 gap-4 text-[10px]">
                  <div className="space-y-1">
                    <span className="text-zinc-550 block font-semibold">Estructura del Layout:</span>
                    <span className="font-bold text-zinc-800 uppercase tracking-wide bg-zinc-200 px-1.5 py-0.5 rounded-sm">
                      {selectedModelDef?.layout || "grid"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-zinc-550 block font-semibold">Proporción de Producto:</span>
                    {(() => {
                      const layoutKey = selectedModelDef?.layout === "banner_grid" ? "banner_grid" : selectedModelDef?.layout;
                      const spec = LAYOUT_IMAGE_SPECS[layoutKey as any];
                      return (
                        <span className="font-bold text-zinc-800 uppercase tracking-wide">
                          {spec?.label || "Sin especificar"}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Smartphone Mockup Frame */}
        <div className="hidden lg:flex lg:sticky lg:top-6 w-full lg:w-[410px] flex-col items-center shrink-0">
          <div className="relative w-[390px] h-[780px] bg-zinc-950 rounded-[48px] p-3.5 border-[6px] border-zinc-800 ring-1 ring-zinc-700/50 flex flex-col overflow-hidden select-none" style={{
            boxShadow: `0 25px 60px -15px ${brandColor ? brandColor + "25" : "rgba(79, 70, 229, 0.15)"}`
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
                  <div className="w-full h-full bg-zinc-400 rounded-[2px]" />
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
            <Eye className="h-3.5 w-3.5 text-zinc-650" />
            <span>Previsualizar</span>
          </button>

          {isDirty ? (
            <div className="flex items-center gap-2.5 ml-auto text-xs">
              <span className="hidden sm:inline-flex text-[10px] font-bold text-zinc-400 items-center shrink-0">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
                Editado
              </span>
              <Button onClick={save} className="rounded-full bg-primary hover:bg-primary/95 text-white font-bold px-5 py-2 text-xs shadow-lg transition-transform active:scale-95 border-none cursor-pointer">
                <Check className="h-3.5 w-3.5 mr-1" />
                Guardar
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 ml-auto">
              <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
              <span className="text-[10px] sm:text-xs text-zinc-500 font-bold shrink-0">
                Diseño Guardado
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

