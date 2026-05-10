import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { useState } from "react";
import { toast } from "sonner";
import { Lock, Check, Sparkles, Crown, Palette } from "lucide-react";
import { type PlanId } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/diseno")({
  component: DisenoPage,
});

/* ─────────────────────────────────────────────────────────
   PLAN LEVELS
───────────────────────────────────────────────────────── */
const PLAN_LEVELS: Record<PlanId, number> = {
  semilla: 0,
  emprendedor: 1,
  pro: 2,
  ilimitado: 3,
};

/* ─────────────────────────────────────────────────────────
   BRAND COLORS  (real hex values — what you see is what you get)
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
   MODEL DEFINITIONS
   imgShape: "square" | "rounded" | "circle"
   cardStyle: "flat" | "elevated" | "bordered" | "glassmorphism"
───────────────────────────────────────────────────────── */
interface ModelDef {
  id: string;
  name: string;
  desc: string;
  planLevel: number;
  badge?: string;
  imgShape: "square" | "rounded" | "circle";
  layout: "grid" | "overlay" | "editorial" | "hero" | "magazine" | "tiles" | "spotlight" | "diagonal" | "arch";
  // Preview theme colors
  bg: string;
  cardBg: string;
  primaryColor: string;
  textColor: string;
  accentColor: string;
  borderRadius: string;
  isDark?: boolean;
}

const MODELS: ModelDef[] = [
  /* ════════════════════════════════════════════
     PLAN SEMILLA — Gratis (2 modelos)
     Grillas limpias, funcionales, para empezar
  ════════════════════════════════════════════ */
  {
    id: "minimalista", name: "Minimalista", layout: "grid",
    desc: "Limpio, moderno y atemporal. Funciona para cualquier tipo de negocio.",
    planLevel: 0, badge: "⚡ Más popular", imgShape: "rounded",
    bg: "#ffffff", cardBg: "#f8fafc", primaryColor: "#4f46e5", textColor: "#1e293b", accentColor: "#e0e7ff", borderRadius: "12px",
  },
  {
    id: "clasico", name: "Clásico Cálido", layout: "grid",
    desc: "Tipografía elegante y tonos terrosos. Ideal para artesanías, comida y cultura.",
    planLevel: 0, imgShape: "square",
    bg: "#fdfaf5", cardBg: "#fef9ef", primaryColor: "#92400e", textColor: "#451a03", accentColor: "#fef3c7", borderRadius: "6px",
  },

  /* ════════════════════════════════════════════
     PLAN EMPRENDEDOR (5 modelos)
     Overlay portrait, hero banner, colores vivos
  ════════════════════════════════════════════ */
  {
    id: "nature_mint", name: "Nature Mint", layout: "grid",
    desc: "Verde teal fresco y moderno. Ideal para salud, bienestar, cafés y naturáles.",
    planLevel: 1, badge: "🌿 Fresh", imgShape: "rounded",
    bg: "#f0fefb", cardBg: "#ffffff", primaryColor: "#0d9488", textColor: "#134e4a", accentColor: "#99f6e4", borderRadius: "24px",
  },
  {
    id: "vibrante", name: "Vibrante", layout: "overlay",
    desc: "Energético y audaz. Layout tipo Instagram Shopping con imágenes 3:4.",
    planLevel: 1, badge: "⭐ Premium", imgShape: "rounded",
    bg: "#fff7ed", cardBg: "#ffffff", primaryColor: "#ea580c", textColor: "#431407", accentColor: "#ffedd5", borderRadius: "20px",
  },
  {
    id: "eco", name: "Eco Nature", layout: "hero",
    desc: "Primer producto destacado tipo hero banner + galería circular.",
    planLevel: 1, badge: "⭐ Premium", imgShape: "circle",
    bg: "#f0fdf4", cardBg: "#ffffff", primaryColor: "#16a34a", textColor: "#14532d", accentColor: "#dcfce7", borderRadius: "999px",
  },
  {
    id: "terracotta", name: "Terracotta", layout: "editorial",
    desc: "Mercado artesanal: lista horizontal con imagen cuadrada + nombre y precio visibles. Cálido, íntimo, hecho a mano.",
    planLevel: 1, badge: "🏺 Artisan", imgShape: "square",
    bg: "#faf5f0", cardBg: "#f5ece3", primaryColor: "#c2410c", textColor: "#431407", accentColor: "#fed7aa", borderRadius: "6px",
  },
  {
    id: "pastel", name: "Pastel Dream", layout: "hero",
    desc: "Hero banner destacado + galería de productos con imágenes circulares.",
    planLevel: 1, imgShape: "circle",
    bg: "#fdf2f8", cardBg: "#ffffff", primaryColor: "#db2777", textColor: "#831843", accentColor: "#fce7f3", borderRadius: "999px",
  },

  /* ════════════════════════════════════════════
     PLAN PRO (7 modelos)
     Editorial, tiles, dark modes moderados
  ════════════════════════════════════════════ */
  {
    id: "nocturno", name: "Nocturno", layout: "overlay",
    desc: "Dark mode de alto impacto. Cards en portrait con texto sobre imagen.",
    planLevel: 2, badge: "💎 Pro", imgShape: "rounded", isDark: true,
    bg: "#0f172a", cardBg: "#1e293b", primaryColor: "#818cf8", textColor: "#f1f5f9", accentColor: "#312e81", borderRadius: "16px",
  },
  {
    id: "boutique", name: "Boutique", layout: "spotlight",
    desc: "Editorial fashion: 1 producto estrella grande + 2 complementarios apilados. Inspirado en escaparates de moda.",
    planLevel: 2, badge: "💎 Pro", imgShape: "rounded",
    bg: "#faf9f7", cardBg: "#f5efe8", primaryColor: "#9333ea", textColor: "#2d1b69", accentColor: "#ede9fe", borderRadius: "16px",
  },
  {
    id: "moderno", name: "Moderno Bold", layout: "overlay",
    desc: "Cards portrait en blanco y negro. Inspirado en ZARA editorial.",
    planLevel: 2, badge: "🔥 Tendencia", imgShape: "square",
    bg: "#fafafa", cardBg: "#18181b", primaryColor: "#27272a", textColor: "#fafafa", accentColor: "#27272a", borderRadius: "2px",
  },
  {
    id: "tropical", name: "Tropical", layout: "grid",
    desc: "Luminoso y veraniego con imágenes circulares. Para turismo y comida caribeña.",
    planLevel: 2, badge: "💎 Pro", imgShape: "circle",
    bg: "#ecfdf5", cardBg: "#ffffff", primaryColor: "#d97706", textColor: "#064e3b", accentColor: "#d1fae5", borderRadius: "999px",
  },
  {
    id: "corporativo", name: "Corporativo", layout: "editorial",
    desc: "Lista profesional con descripción visible. Para servicios y consultoras B2B.",
    planLevel: 2, badge: "💎 Pro", imgShape: "rounded",
    bg: "#eff6ff", cardBg: "#ffffff", primaryColor: "#1d4ed8", textColor: "#1e3a5f", accentColor: "#dbeafe", borderRadius: "8px",
  },
  {
    id: "sakura", name: "Sakura Edit", layout: "editorial",
    desc: "Minimalismo japonés: lista horizontal, tipografía ultraligera ALL CAPS, rosa sutil.",
    planLevel: 2, badge: "🌸 Wabi-Sabi", imgShape: "square",
    bg: "#fff5f7", cardBg: "#fdf2f8", primaryColor: "#be185d", textColor: "#4a1942", accentColor: "#fce7f3", borderRadius: "0px",
  },
  {
    id: "retro_pop", name: "Retro Pop", layout: "tiles",
    desc: "Bauhaus meets Memphis: banners anchos alternados con cuadros dinámicos. Audaz y memorable.",
    planLevel: 2, badge: "🎵 Retro", imgShape: "rounded",
    bg: "#fffbeb", cardBg: "#fef3c7", primaryColor: "#dc2626", textColor: "#1c1917", accentColor: "#fcd34d", borderRadius: "8px",
  },

  /* ════════════════════════════════════════════
     PLAN ILIMITADO — Elite (9 modelos)
     Layouts únicos: magazine, spotlight, diagonal,
     arch, tiles glass, neon, moda oscura
  ════════════════════════════════════════════ */
  {
    id: "luxury", name: "Luxury Gold", layout: "editorial",
    desc: "Lista horizontal tipo Net-a-Porter. Imagen + info detallada al lado.",
    planLevel: 3, badge: "👑 Elite", imgShape: "square", isDark: true,
    bg: "#09090b", cardBg: "#18181b", primaryColor: "#ca8a04", textColor: "#fafafa", accentColor: "#292524", borderRadius: "4px",
  },
  {
    id: "neon", name: "Neon City", layout: "overlay",
    desc: "Cards portrait cyberpunk con texto neón sobre imagen oscura.",
    planLevel: 3, badge: "👑 Elite", imgShape: "square", isDark: true,
    bg: "#030712", cardBg: "#0c1120", primaryColor: "#06b6d4", textColor: "#e0f2fe", accentColor: "#083344", borderRadius: "0px",
  },
  {
    id: "dark_fashion", name: "Dark Fashion", layout: "magazine",
    desc: "Revista editorial: banners full-width alternados con pares verticales 3:4. Inspirado en Vogue.",
    planLevel: 3, badge: "👑 Elite", imgShape: "square", isDark: true,
    bg: "#111111", cardBg: "#1c1c1c", primaryColor: "#f5f5f5", textColor: "#f5f5f5", accentColor: "#2a2a2a", borderRadius: "0px",
  },
  {
    id: "miami", name: "Miami Nights", layout: "overlay",
    desc: "Neon púrpura/fucsia sobre dark profundo. Cards portrait al ritmo de la noche.",
    planLevel: 3, badge: "👑 Elite", imgShape: "rounded", isDark: true,
    bg: "#0f0520", cardBg: "#1a0a35", primaryColor: "#f0abfc", textColor: "#fdf4ff", accentColor: "#4c1d95", borderRadius: "16px",
  },
  {
    id: "monochrome", name: "Monochrome", layout: "magazine",
    desc: "Blanco y negro puro estilo fotografía editorial. Para marcas de alta moda sin color.",
    planLevel: 3, badge: "👑 Elite", imgShape: "square",
    bg: "#ffffff", cardBg: "#f5f5f5", primaryColor: "#0a0a0a", textColor: "#0a0a0a", accentColor: "#e5e5e5", borderRadius: "0px",
  },
  {
    id: "aurora", name: "Aurora Dark", layout: "tiles",
    desc: "Glassmorphism oscuro con acentos púrpura. Tiles anchos + cuadros. Inspirado en Apple Vision Pro.",
    planLevel: 3, badge: "👑 Elite", imgShape: "rounded", isDark: true,
    bg: "#0d0d1a", cardBg: "#1a1040", primaryColor: "#a855f7", textColor: "#e2d9f3", accentColor: "#2d1b6e", borderRadius: "24px",
  },
  {
    id: "obsidian", name: "Obsidian Spot", layout: "spotlight",
    desc: "Layout Spotlight: 1 producto grande a la izquierda + 2 pequeños apilados. Inspirado en Farfetch.",
    planLevel: 3, badge: "👑 Elite", imgShape: "rounded", isDark: true,
    bg: "#0a0a14", cardBg: "#12122a", primaryColor: "#4f8ef7", textColor: "#e0e0e0", accentColor: "#1e2050", borderRadius: "12px",
  },
  {
    id: "slash", name: "Slash / Diagonal", layout: "diagonal",
    desc: "Cortes diagonales con clip-path en cada imagen. Estilo Nike / Adidas / Streetwear de alto impacto.",
    planLevel: 3, badge: "👑 Elite", imgShape: "square", isDark: true,
    bg: "#0d1117", cardBg: "#1c2128", primaryColor: "#faec45", textColor: "#f0f0f0", accentColor: "#21262d", borderRadius: "0px",
  },
  {
    id: "arch_studio", name: "Arch Studio", layout: "arch",
    desc: "Marcos en arco tipo ventana gótica. Imagen en arco 3:4 + texto debajo. Estilo AESOP / Byredo / perfumería de lujo.",
    planLevel: 3, badge: "👑 Elite", imgShape: "rounded",
    bg: "#faf9f6", cardBg: "#f4f2ed", primaryColor: "#9c6b4e", textColor: "#2c1a0e", accentColor: "#e8e0d5", borderRadius: "999px",
  },
];


/* ─────────────────────────────────────────────────────────
   MINI PREVIEW COMPONENT
───────────────────────────────────────────────────────── */
function ModelPreview({ model, storeName }: { model: ModelDef; storeName: string }) {
  const imgR = model.borderRadius;
  const mini = { backgroundColor: model.primaryColor, opacity: 0.75 };
  const muted = { backgroundColor: model.textColor, opacity: 0.18 };

  // Shared header
  const Header = () => (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 shrink-0" style={{ backgroundColor: model.bg, borderBottom: `1px solid ${model.accentColor}` }}>
      <div className="h-4 w-4 flex items-center justify-center text-[7px] font-black text-white shrink-0" style={{ borderRadius: model.imgShape === "circle" ? "999px" : "4px", backgroundColor: model.primaryColor }}>
        {storeName.charAt(0).toUpperCase()}
      </div>
      <div className="h-1.5 rounded-full w-10" style={{ backgroundColor: model.textColor, opacity: 0.5 }} />
      <div className="flex-1" />
      <div className="h-3 rounded-full px-1.5 text-[5px] font-bold flex items-center" style={{ backgroundColor: model.primaryColor, color: "#fff" }}>Contacto</div>
    </div>
  );

  // Search bar
  const Search = () => (
    <div className="px-2.5 py-1 shrink-0">
      <div className="h-3 rounded-full w-full" style={{ backgroundColor: model.accentColor }} />
    </div>
  );

  // ── OVERLAY preview: portrait 3:4 cards, text over gradient
  if (model.layout === "overlay") {
    return (
      <div className="h-48 w-full overflow-hidden flex flex-col" style={{ backgroundColor: model.bg, fontFamily: "Inter, sans-serif" }}>
        <Header />
        <div className="flex gap-1 px-2 py-1.5 flex-1 overflow-hidden">
          {[model.primaryColor, model.accentColor, model.primaryColor].map((col, i) => (
            <div key={i} className="flex-1 relative overflow-hidden" style={{ borderRadius: imgR, aspectRatio: "3/4" }}>
              {/* Image simulation */}
              <div className="absolute inset-0" style={{ backgroundColor: i % 2 === 0 ? model.primaryColor : model.accentColor, opacity: i % 2 === 0 ? 0.8 : 0.6 }} />
              {/* Gradient overlay */}
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 40%, transparent 80%)" }} />
              {/* Text on image */}
              <div className="absolute bottom-0 left-0 right-0 p-1">
                <div className="h-1 rounded-full mb-0.5 w-4/5" style={{ backgroundColor: "#fff", opacity: 0.8 }} />
                <div className="h-1.5 rounded-full w-1/2" style={{ backgroundColor: model.primaryColor }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── EDITORIAL preview: horizontal list rows
  if (model.layout === "editorial") {
    return (
      <div className="h-48 w-full overflow-hidden flex flex-col" style={{ backgroundColor: model.bg, fontFamily: "Inter, sans-serif" }}>
        <Header />
        <div className="flex-1 overflow-hidden px-2 py-1.5 space-y-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-2 items-center py-1" style={{ borderBottom: `1px solid ${model.accentColor}` }}>
              {/* Square image */}
              <div className="shrink-0" style={{ width: "30px", height: "30px", borderRadius: imgR, backgroundColor: i === 0 ? model.primaryColor : model.accentColor, opacity: i === 0 ? 0.9 : 0.7 }} />
              {/* Text stack */}
              <div className="flex-1 space-y-1">
                <div className="h-1.5 rounded-full w-3/4" style={{ backgroundColor: model.textColor, opacity: 0.5 }} />
                <div className="h-1 rounded-full w-full" style={{ backgroundColor: model.textColor, opacity: 0.25 }} />
              </div>
              {/* Price */}
              <div className="shrink-0 h-2 rounded-full w-6" style={{ backgroundColor: model.primaryColor, opacity: 0.9 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── HERO preview: wide banner + small 4-col grid
  if (model.layout === "hero") {
    return (
      <div className="h-48 w-full overflow-hidden flex flex-col" style={{ backgroundColor: model.bg, fontFamily: "Inter, sans-serif" }}>
        <Header />
        <div className="px-2 pt-1.5 shrink-0">
          {/* Hero banner */}
          <div className="relative w-full overflow-hidden mb-1.5" style={{ height: "56px", borderRadius: imgR }}>
            <div className="absolute inset-0" style={{ backgroundColor: model.primaryColor, opacity: 0.8 }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.6) 40%, transparent)" }} />
            <div className="absolute bottom-0 left-0 p-1.5">
              <div className="h-1 rounded-full w-12 mb-0.5" style={{ backgroundColor: "#fff", opacity: 0.5 }} />
              <div className="h-2 rounded-full w-8" style={{ backgroundColor: "#fff", opacity: 0.9 }} />
            </div>
          </div>
        </div>
        {/* Small grid */}
        <div className="flex gap-1 px-2 pb-1.5 flex-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex-1 flex flex-col gap-0.5 overflow-hidden" style={{ backgroundColor: model.cardBg, borderRadius: imgR, padding: "4px" }}>
              <div style={{ ...muted, height: "22px", borderRadius: imgR, backgroundColor: i === 0 ? model.primaryColor : model.accentColor, opacity: 0.65 }} />
              <div className="h-1 rounded-full w-4/5" style={{ ...muted }} />
              <div className="h-1.5 rounded-full w-1/2" style={{ ...mini }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── MAGAZINE preview: wide panoramic banner + 2 portrait cards
  if (model.layout === "magazine") {
    return (
      <div className="h-48 w-full overflow-hidden flex flex-col" style={{ backgroundColor: model.bg, fontFamily: "Inter, sans-serif" }}>
        <Header />
        <div className="px-2 pt-1.5 space-y-1 flex-1 overflow-hidden">
          {/* Wide banner */}
          <div className="relative overflow-hidden" style={{ height: "40px" }}>
            <div className="absolute inset-0" style={{ backgroundColor: model.primaryColor, opacity: 0.7 }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }} />
            <div className="absolute bottom-1 left-2 right-2 flex items-center justify-between">
              <div className="h-1.5 rounded-full w-16" style={{ backgroundColor: "#fff", opacity: 0.9 }} />
              <div className="h-3 rounded px-1 text-[5px] flex items-center font-bold" style={{ backgroundColor: "#fff", color: model.bg }}>VER</div>
            </div>
          </div>
          {/* 2 portrait cards side-by-side */}
          <div className="flex gap-1 flex-1 pb-1">
            {[0, 1].map((i) => (
              <div key={i} className="flex-1 relative overflow-hidden" style={{ borderRadius: "2px" }}>
                <div className="absolute inset-0" style={{ backgroundColor: i === 0 ? model.accentColor : model.primaryColor, opacity: 0.65 }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent 60%)" }} />
                <div className="absolute bottom-0 left-0 right-0 p-1">
                  <div className="h-1 rounded-full w-3/4 mb-0.5" style={{ backgroundColor: "#fff", opacity: 0.8 }} />
                  <div className="h-1.5 rounded-full w-1/2" style={{ backgroundColor: "#fff", opacity: 0.9 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── TILES preview: 1 wide banner + 2 squares below
  if (model.layout === "tiles") {
    return (
      <div className="h-48 w-full overflow-hidden flex flex-col" style={{ backgroundColor: model.bg, fontFamily: "Inter, sans-serif" }}>
        <Header />
        <div className="px-2 pt-1.5 space-y-1 flex-1 overflow-hidden">
          {/* Wide tile */}
          <div className="relative overflow-hidden w-full" style={{ height: "52px", borderRadius: imgR }}>
            <div className="absolute inset-0" style={{ backgroundColor: model.primaryColor, opacity: 0.85 }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.6) 40%, transparent)" }} />
            <div className="absolute bottom-0 left-0 p-2">
              <div className="h-2 rounded-full w-20 mb-0.5" style={{ backgroundColor: "#fff", opacity: 0.9 }} />
              <div className="h-1.5 rounded-full w-12" style={{ backgroundColor: model.primaryColor }} />
            </div>
          </div>
          {/* 2 squares */}
          <div className="flex gap-1 flex-1 pb-1">
            {[0, 1].map((i) => (
              <div key={i} className="flex-1 relative overflow-hidden" style={{ borderRadius: imgR, minHeight: "50px" }}>
                <div className="absolute inset-0" style={{ backgroundColor: i === 0 ? model.accentColor : model.primaryColor, opacity: 0.75 }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 40%, transparent)" }} />
                <div className="absolute bottom-0 left-0 right-0 p-1">
                  <div className="h-1 rounded-full w-3/4 mb-0.5" style={{ backgroundColor: "#fff", opacity: 0.8 }} />
                  <div className="h-1.5 rounded-full w-1/2" style={{ backgroundColor: model.primaryColor }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── SPOTLIGHT preview: 1 tall left + 2 stacked right
  if (model.layout === "spotlight") {
    return (
      <div className="h-48 w-full overflow-hidden flex flex-col" style={{ backgroundColor: model.bg, fontFamily: "Inter, sans-serif" }}>
        <Header />
        <div className="flex gap-1 px-2 pb-2 pt-1.5 flex-1 overflow-hidden">
          {/* Large left card */}
          <div className="flex-1 relative overflow-hidden" style={{ borderRadius: imgR }}>
            <div className="absolute inset-0" style={{ backgroundColor: model.primaryColor, opacity: 0.85 }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 30%, rgba(0,0,0,0.1) 70%)" }} />
            <div className="absolute bottom-0 left-0 right-0 p-1.5">
              <div className="h-1 rounded-full w-3/4 mb-0.5" style={{ backgroundColor: "#fff", opacity: 0.5 }} />
              <div className="h-2 rounded-full w-1/2 mb-1" style={{ backgroundColor: "#fff", opacity: 0.9 }} />
              <div className="h-1.5 rounded-full w-8" style={{ backgroundColor: model.primaryColor }} />
            </div>
          </div>
          {/* 2 stacked right */}
          <div className="flex-1 flex flex-col gap-1">
            {[0, 1].map((i) => (
              <div key={i} className="flex-1 relative overflow-hidden" style={{ borderRadius: imgR }}>
                <div className="absolute inset-0" style={{ backgroundColor: i === 0 ? model.accentColor : model.primaryColor, opacity: 0.7 }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 40%, transparent)" }} />
                <div className="absolute bottom-0 left-0 right-0 p-1">
                  <div className="h-1 rounded-full w-3/4 mb-0.5" style={{ backgroundColor: "#fff", opacity: 0.8 }} />
                  <div className="h-1.5 rounded-full w-1/2" style={{ backgroundColor: model.primaryColor }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── DIAGONAL preview: slanted image + text row
  if (model.layout === "diagonal") {
    return (
      <div className="h-48 w-full overflow-hidden flex flex-col" style={{ backgroundColor: model.bg, fontFamily: "Inter, sans-serif" }}>
        <Header />
        <div className="flex-1 overflow-hidden space-y-0">
          {[0, 1].map((i) => (
            <div key={i} className="flex" style={{ height: "45%" }}>
              {/* Slanted image block */}
              <div className="flex-1 relative overflow-hidden" style={{
                clipPath: i % 2 === 0 ? "polygon(0 0, 100% 0, 100% 80%, 0 100%)" : "polygon(0 0, 100% 0, 100% 100%, 0 80%)",
                backgroundColor: i === 0 ? model.primaryColor : model.accentColor,
                opacity: 0.85,
              }}>
                {/* Sale tag sim */}
                <div className="absolute top-1 left-2 text-[5px] font-black px-1" style={{ backgroundColor: model.primaryColor, color: "#000" }}>SALE</div>
              </div>
              {/* Text col */}
              <div className="w-2/5 px-2 py-1 flex flex-col justify-center gap-0.5" style={{ backgroundColor: model.cardBg }}>
                <div className="h-1 rounded-full w-full" style={{ ...muted }} />
                <div className="h-2 rounded-full w-3/4" style={{ backgroundColor: model.primaryColor, opacity: 0.9 }} />
                <div className="h-3 rounded w-10 mt-0.5" style={{ backgroundColor: model.primaryColor }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── ARCH preview: arched portrait frames in a row
  if (model.layout === "arch") {
    return (
      <div className="h-48 w-full overflow-hidden flex flex-col" style={{ backgroundColor: model.bg, fontFamily: "Inter, sans-serif" }}>
        <Header />
        <div className="flex gap-2 px-2 py-2 flex-1 overflow-hidden items-start">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              {/* Arch shape */}
              <div className="relative overflow-hidden w-full" style={{
                aspectRatio: "3/4",
                borderRadius: "999px 999px 4px 4px",
                backgroundColor: i === 0 ? model.primaryColor : model.accentColor,
                opacity: i === 0 ? 0.85 : 0.65,
                border: `1px solid ${model.accentColor}`,
              }} />
              {/* Caption lines */}
              <div className="h-1 rounded-full w-4/5" style={{ ...muted }} />
              <div className="h-1.5 rounded-full w-1/2" style={{ ...mini }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── GRID preview (default): 2×2 cards
  return (
    <div className="h-48 w-full overflow-hidden flex flex-col" style={{ backgroundColor: model.bg, fontFamily: "Inter, sans-serif" }}>
      <Header />
      <Search />
      <div className="grid grid-cols-3 gap-1 px-2 pb-2 flex-1 overflow-hidden">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col gap-0.5 overflow-hidden" style={{ backgroundColor: model.cardBg, borderRadius: imgR, padding: "4px", border: model.id === "clasico" || model.id === "corporativo" ? `1px solid ${model.accentColor}` : "none" }}>
            <div style={{ height: "28px", borderRadius: imgR, backgroundColor: i % 3 === 0 ? model.primaryColor : model.accentColor, opacity: i % 3 === 0 ? 0.85 : 0.65 }} />
            <div className="h-1 rounded-full w-4/5" style={{ ...muted }} />
            <div className="h-1.5 rounded-full w-1/2" style={{ ...mini }} />
          </div>
        ))}
      </div>
    </div>
  );
}


/* ─────────────────────────────────────────────────────────
   PAGE COMPONENT
───────────────────────────────────────────────────────── */
function DisenoPage() {
  const id = useApp((s) => s.currentStoreId)!;
  const store = useApp((s) => s.stores.find((st) => st.id === id))!;
  const update = useApp((s) => s.updateStore);

  const [selectedModel, setSelectedModel] = useState(store.model || "minimalista");
  const [brandColor, setBrandColor] = useState(store.brandColor || "");
  const userLevel = PLAN_LEVELS[store.plan];

  const isDirty =
    selectedModel !== (store.model || "minimalista") ||
    brandColor !== (store.brandColor || "");

  const save = () => {
    update(store.id, {
      model: selectedModel as any,
      brandColor: brandColor || undefined,
    });
    toast.success("🎨 Diseño aplicado a tu catálogo");
  };

  const planGroups = [
    { label: "Gratis — Plan Semilla", level: 0, color: "text-gray-600 bg-gray-100" },
    { label: "Plan Emprendedor", level: 1, color: "text-blue-700 bg-blue-50 border border-blue-200" },
    { label: "Plan Pro", level: 2, color: "text-purple-700 bg-purple-50 border border-purple-200" },
    { label: "Plan Ilimitado", level: 3, color: "text-amber-700 bg-amber-50 border border-amber-200" },
  ];

  return (
    <div className="max-w-5xl pb-24 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Palette className="h-6 w-6 text-primary" />
          Diseño del Catálogo
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Escoge el modelo visual y el color de marca. Los cambios se aplican en tu catálogo público al instante.
        </p>
      </div>

      {/* ── Color de Marca ───────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-base">Color de Marca</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            Opcional — sobreescribe el color principal del modelo
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {BRAND_COLORS.map((c) => {
            const active = brandColor === c.hex;
            return (
              <button
                key={c.id}
                type="button"
                title={c.name}
                onClick={() => setBrandColor(c.hex)}
                className={cn(
                  "relative h-10 w-10 rounded-full border-2 transition-all hover:scale-110",
                  active
                    ? "border-foreground ring-2 ring-foreground/20 scale-110 shadow-lg"
                    : "border-transparent shadow-sm"
                )}
                style={{ backgroundColor: c.display }}
              >
                {active && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check
                      className="h-4 w-4 drop-shadow"
                      style={{ color: c.hex === "" ? "#64748b" : "#ffffff" }}
                    />
                  </div>
                )}
              </button>
            );
          })}
          
          {/* ── Custom Color Picker ── */}
          <div className="flex items-center gap-2 border-l pl-3 ml-1" style={{ borderColor: "var(--border)" }}>
            <div 
              className={cn(
                "relative h-10 w-10 rounded-full overflow-hidden transition-all hover:scale-110 flex-shrink-0 shadow-sm border-2",
                brandColor && !BRAND_COLORS.find(c => c.hex === brandColor) 
                  ? "border-foreground ring-2 ring-foreground/20 scale-110 shadow-lg" 
                  : "border-transparent"
              )}
              title="Color personalizado"
            >
              <input
                type="color"
                value={brandColor || "#000000"}
                onChange={(e) => setBrandColor(e.target.value)}
                className="absolute -inset-4 h-20 w-20 cursor-pointer"
              />
              {brandColor && !BRAND_COLORS.find(c => c.hex === brandColor) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Check className="h-4 w-4 drop-shadow text-white mix-blend-difference" />
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold">Personalizado</span>
              {brandColor && !BRAND_COLORS.find(c => c.hex === brandColor) && (
                <span className="text-[10px] font-mono text-muted-foreground uppercase">{brandColor}</span>
              )}
            </div>
          </div>
        </div>
        {brandColor && (
          <p className="text-xs text-muted-foreground">
            Color personalizado activo: <span className="font-mono font-bold">{brandColor}</span>{" "}
            <button onClick={() => setBrandColor("")} className="text-destructive hover:underline ml-1">Quitar</button>
          </p>
        )}
      </div>

      {/* ── Model Grid ──────────────────────────────── */}
      {planGroups.map((group) => {
        const groupModels = MODELS.filter((m) => m.planLevel === group.level);
        const locked = group.level > userLevel;

        return (
          <div key={group.level} className="space-y-4">
            {/* Section label */}
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${group.color}`}>
                {group.label}
              </span>
              {locked && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Requiere plan superior
                </span>
              )}
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupModels.map((model) => {
                const isLocked = model.planLevel > userLevel;
                const isSelected = selectedModel === model.id;
                const isActive = (store.model || "minimalista") === model.id;

                return (
                  <div
                    key={model.id}
                    onClick={() => !isLocked && setSelectedModel(model.id)}
                    className={cn(
                      "relative rounded-2xl overflow-hidden border-2 transition-all duration-200",
                      isLocked
                        ? "opacity-50 cursor-not-allowed grayscale-[30%]"
                        : "cursor-pointer hover:shadow-xl hover:-translate-y-0.5",
                      isSelected
                        ? "border-primary shadow-xl shadow-primary/20 -translate-y-1"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    {/* Selection checkmark */}
                    {isSelected && !isLocked && (
                      <div className="absolute top-3 right-3 z-10 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                        <Check className="h-4 w-4" />
                      </div>
                    )}

                    {/* Lock icon */}
                    {isLocked && (
                      <div className="absolute top-3 right-3 z-10 h-7 w-7 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur">
                        <Lock className="h-3.5 w-3.5" />
                      </div>
                    )}

                    {/* Badge */}
                    {model.badge && !isSelected && !isLocked && (
                      <div className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur text-white text-[9px] font-bold tracking-wide">
                        {model.badge}
                      </div>
                    )}

                    {/* Preview */}
                    <ModelPreview model={model} storeName={store.name} />

                    {/* Info footer */}
                    <div className="px-4 py-3 bg-card border-t flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm truncate">{model.name}</p>
                          {isActive && (
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">
                              ACTIVO
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                          {model.desc}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: model.primaryColor + "20", color: model.primaryColor }}>
                            {model.imgShape === "circle" ? "🔵 Circular" : model.imgShape === "square" ? "◼ Cuadrada" : "⬛ Redondeada"}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {model.layout === "overlay" ? "📸 Portrait overlay" : model.layout === "editorial" ? "📋 Lista editorial" : model.layout === "hero" ? "⭐ Hero + galería" : model.layout === "magazine" ? "📖 Revista editorial" : model.layout === "tiles" ? "🖼️ Tiles dinámicos" : model.layout === "spotlight" ? "🎯 Spotlight" : model.layout === "diagonal" ? "⚡ Diagonal slash" : model.layout === "arch" ? "🏛️ Arch studio" : "▦ Grilla"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* ── Upgrade CTA ─────────────────────────────── */}
      {store.plan !== "ilimitado" && (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 flex items-center gap-4">
          <Crown className="h-9 w-9 text-amber-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-amber-900">¿Quieres todos los diseños?</p>
            <p className="text-sm text-amber-800 mt-0.5">
              Actualiza tu plan y desbloquea los {MODELS.filter(m => m.planLevel > userLevel).length} modelos premium restantes.
            </p>
          </div>
          <a
            href="https://wa.me/51925176472?text=Hola,%20quiero%20actualizar%20mi%20plan%20en%20Dizi"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-full text-sm font-bold transition shadow-lg"
          >
            Actualizar plan
          </a>
        </div>
      )}

      {/* ── Sticky save button ──────────────────────── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-3 items-center">
        <div className="bg-card rounded-full shadow-2xl border px-4 py-2 flex items-center gap-4">
          {isDirty ? (
            <>
              <span className="text-sm font-medium text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-400 mr-1.5 animate-pulse" />
                Cambios sin guardar
              </span>
              <Button onClick={save} className="rounded-full px-6 font-bold gap-2 shadow-lg">
                <Check className="h-4 w-4" />
                Aplicar diseño
              </Button>
            </>
          ) : (
            <span className="text-sm text-muted-foreground flex items-center gap-2 px-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Diseño guardado — <span className="font-bold text-foreground">{MODELS.find(m => m.id === selectedModel)?.name}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
