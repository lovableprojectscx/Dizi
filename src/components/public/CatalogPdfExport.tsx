/**
 * CatalogPdfExport.tsx
 * ─────────────────────────────────────────────────────────
 * Botón + modal de descarga de catálogo en PDF.
 * Genera un PDF con diseño profesional diferente al catálogo
 * visual: logo/nombre, productos por categoría, precios.
 * El usuario elige entre 3 estilos visuales antes de descargar.
 */

import { useState, useRef } from "react";
import { Download, X, Loader2, Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Store, Product } from "@/lib/types";
import { formatPrice } from "@/lib/whatsapp";

/* ─────────────────────────────────────────────────────────
   PDF STYLE THEMES
───────────────────────────────────────────────────────── */
type PdfTheme = {
  id: string;
  name: string;
  desc: string;
  preview: {
    bg: string;
    header: string;
    accent: string;
    card: string;
    text: string;
    subtext: string;
  };
};

const PDF_THEMES: PdfTheme[] = [
  {
    id: "elegante",
    name: "Elegante",
    desc: "Fondo crema, tipografía serif, líneas doradas",
    preview: {
      bg: "#fdfaf5",
      header: "#1a0a00",
      accent: "#b8860b",
      card: "#fef9ef",
      text: "#2d1a00",
      subtext: "#92700a",
    },
  },
  {
    id: "moderno",
    name: "Moderno",
    desc: "Blanco limpio, acentos índigo, estilo editorial",
    preview: {
      bg: "#ffffff",
      header: "#0f0f0f",
      accent: "#4f46e5",
      card: "#f8f9ff",
      text: "#1e293b",
      subtext: "#4f46e5",
    },
  },
  {
    id: "oscuro",
    name: "Premium Dark",
    desc: "Fondo negro profundo, detalles en dorado",
    preview: {
      bg: "#0a0a0a",
      header: "#f5f5f5",
      accent: "#ca8a04",
      card: "#1a1a1a",
      text: "#e5e5e5",
      subtext: "#ca8a04",
    },
  },
  {
    id: "rustico",
    name: "Cálido Rústico",
    desc: "Tonos terracota y marrón, estilo artesanal y acogedor",
    preview: {
      bg: "#fdf8f5",
      header: "#451a03",
      accent: "#c2410c",
      card: "#fffdfc",
      text: "#572507",
      subtext: "#9a3412",
    },
  },
  {
    id: "nordico",
    name: "Nórdico Orgánico",
    desc: "Tonos salvia y arena, estilo escandinavo, limpio y natural",
    preview: {
      bg: "#fafaf7",
      header: "#1c2b24",
      accent: "#486554",
      card: "#ffffff",
      text: "#2f3e36",
      subtext: "#708075",
    },
  },
];

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */

/** Mezcla dos colores hexadecimales con una opacidad dada (0 a 1) para simular transparencia en jsPDF */
function blendColors(fg: string, bg: string, alpha: number): string {
  const parse = (hex: string) => {
    const h = hex.replace("#", "");
    if (h.length === 3) {
      return [
        parseInt(h[0] + h[0], 16),
        parseInt(h[1] + h[1], 16),
        parseInt(h[2] + h[2], 16),
      ];
    }
    return [
      parseInt(h.substring(0, 2), 16),
      parseInt(h.substring(2, 4), 16),
      parseInt(h.substring(4, 6), 16),
    ];
  };

  try {
    const [r1, g1, b1] = parse(fg);
    const [r2, g2, b2] = parse(bg);

    const r = Math.round(r1 * alpha + r2 * (1 - alpha));
    const g = Math.round(g1 * alpha + g2 * (1 - alpha));
    const b = Math.round(b1 * alpha + b2 * (1 - alpha));

    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  } catch {
    return fg;
  }
}

/** Descarga una imagen, la redimensiona a un tamaño máximo (400px) y la convierte a JPEG Base64 comprimido */
async function urlToBase64(url: string, maxDim = 400): Promise<string | null> {
  try {
    // Evitamos problemas de caché del navegador que causan errores de CORS ficticios
    const separator = url.includes("?") ? "&" : "?";
    const cacheBusterUrl = `${url}${separator}t_pdf=${Date.now()}`;
    const res = await fetch(cacheBusterUrl, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();

    // Crear objeto Image para dibujar en Canvas
    const img = new Image();
    const blobUrl = URL.createObjectURL(blob);
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = blobUrl;
    });

    // Calcular nuevas dimensiones manteniendo la relación de aspecto
    let width = img.width;
    let height = img.height;
    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    // Dibujar en canvas y exportar como JPEG comprimido
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      URL.revokeObjectURL(blobUrl);
      return null;
    }

    // Fondo blanco por si la imagen tiene transparencia (ej. PNG/WebP transparentes)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    ctx.drawImage(img, 0, 0, width, height);
    const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75); // 75% calidad

    URL.revokeObjectURL(blobUrl);
    return compressedBase64;
  } catch (err) {
    console.error("[PDF Image Compress Error]", err);
    return null;
  }
}

/** Sanitiza texto para evitar problemas con jsPDF */
function safe(str: string | undefined | null): string {
  if (!str) return "";
  return str.replace(/[^\x00-\x7F]/g, (c) => {
    const map: Record<string, string> = {
      á: "a",
      é: "e",
      í: "i",
      ó: "o",
      ú: "u",
      Á: "A",
      É: "E",
      Í: "I",
      Ó: "O",
      Ú: "U",
      ñ: "n",
      Ñ: "N",
      ü: "u",
      Ü: "U",
      "¡": "!",
      "¿": "?",
      "—": "-",
      "–": "-",
      "’": "'",
      "“": '"',
      "”": '"',
    };
    return map[c] ?? c;
  });
}

/* ─────────────────────────────────────────────────────────
   PDF GENERATOR CORE
   Genera el PDF puro con jsPDF (sin html2canvas, 100% vectorial)
───────────────────────────────────────────────────────── */
async function generateCatalogPdf(
  store: Store,
  theme: PdfTheme,
  onProgress?: (current: number, total: number) => void,
) {
  // Dynamic import — no aumenta el bundle inicial
  const { default: jsPDF } = await import("jspdf");

  const t = theme.preview;
  const PAGE_W = 210; // A4 mm
  const PAGE_H = 297;
  const MARGIN = 14;
  const COL_W = (PAGE_W - MARGIN * 2 - 6) / 2; // 2 columnas con gap

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  let y = 0; // cursor vertical

  // Forzamos "helvetica" para mantener un diseño moderno y uniforme como el original
  const fontName = "helvetica";
  const setFont = (style: "normal" | "bold" | "italic" | "bolditalic" = "normal") => {
    doc.setFont(fontName, style);
  };

  /* ── Helpers de dibujo ─────────────────── */
  const newPage = () => {
    doc.addPage();
    y = 0;
    drawPageBg();
  };

  const drawPageBg = () => {
    // Fondo de la página
    doc.setFillColor(t.bg);
    doc.rect(0, 0, PAGE_W, PAGE_H, "F");
    // Franja superior de acento
    doc.setFillColor(t.accent);
    doc.rect(0, 0, PAGE_W, 1.5, "F");
    // Footer con nombre de tienda y fecha
    setFont("normal");
    doc.setFontSize(7);
    doc.setTextColor(t.subtext);
    doc.text(safe(store.name), MARGIN, PAGE_H - 5);
    doc.text(
      `Catalogo Digital - ${new Date().toLocaleDateString("es")}`,
      PAGE_W - MARGIN,
      PAGE_H - 5,
      { align: "right" },
    );
  };

  const checkY = (needed: number) => {
    if (y + needed > PAGE_H - 12) newPage();
  };

  /* ── PORTADA ────────────────────────────── */
  drawPageBg();

  const logoSize = 28;
  const logoX = PAGE_W / 2 - logoSize / 2;
  const logoY = 51; // Overlapping en el borde del bloque decorativo

  // Bloque decorativo superior
  doc.setFillColor(t.accent);
  doc.rect(0, 0, PAGE_W, 65, "F");

  // Cargar logo centrado
  let logoLoaded = false;
  if (store.logo) {
    const b64 = await urlToBase64(store.logo);
    if (b64) {
      try {
        // Fondo blanco redondeado para resaltar el logo
        doc.setFillColor("#ffffff");
        doc.roundedRect(logoX - 1, logoY - 1, logoSize + 2, logoSize + 2, 3, 3, "F");
        doc.addImage(b64, "JPEG", logoX, logoY, logoSize, logoSize, undefined, "FAST");
        logoLoaded = true;
      } catch {
        /* fallback */
      }
    }
  }
  if (!logoLoaded) {
    doc.setFillColor("#ffffff");
    doc.roundedRect(logoX, logoY, logoSize, logoSize, 3, 3, "F");
    setFont("bold");
    doc.setFontSize(18);
    doc.setTextColor(t.accent);
    doc.text(safe(store.name.charAt(0).toUpperCase()), PAGE_W / 2, logoY + logoSize / 2 + 3, {
      align: "center",
    });
  }

  // Nombre de la tienda
  setFont("bold");
  doc.setFontSize(24);
  doc.setTextColor(theme.id === "oscuro" ? t.accent : t.header);
  doc.text(safe(store.name.toUpperCase()), PAGE_W / 2, 94, { align: "center" });

  // Subtítulo
  setFont("normal");
  doc.setFontSize(9);
  doc.setTextColor(t.subtext);
  doc.text("CATALOGO DIGITAL DE PRODUCTOS", PAGE_W / 2, 102, { align: "center" });

  // Separador elegante
  y = 112;
  doc.setFillColor(t.accent);
  doc.rect(MARGIN + 20, y, PAGE_W - (MARGIN + 20) * 2, 0.4, "F");
  y += 10;

  // Resumen de portada
  const visibleProds = (store.products || []).filter((p) => p.visible);
  const cats = store.categories || [];

  setFont("normal");
  doc.setFontSize(10);
  doc.setTextColor(t.text);

  const summaryItems = [
    `${visibleProds.length} productos`,
    `${cats.length} categorias`,
    store.phone ? `WhatsApp: ${store.phone}` : null,
  ].filter(Boolean);

  summaryItems.forEach((item, i) => {
    setFont("normal");
    doc.setFontSize(9);
    doc.setTextColor(t.subtext);
    doc.text(safe(item!), PAGE_W / 2, y + i * 7, { align: "center" });
  });

  y += summaryItems.length * 7 + 12;

  // Divider
  doc.setFillColor(t.accent);
  doc.rect(MARGIN + 30, y, PAGE_W - (MARGIN + 30) * 2, 0.3, "F");
  y += 10;

  // Info "cómo pedir"
  setFont("normal");
  doc.setFontSize(8.5);
  doc.setTextColor(t.text);
  doc.text("Para realizar tu pedido o consultar disponibilidad,", PAGE_W / 2, y, {
    align: "center",
  });
  y += 5.5;
  doc.text("contactanos por WhatsApp con el nombre del producto.", PAGE_W / 2, y, {
    align: "center",
  });

  /* ── PÁGINAS DE PRODUCTOS POR CATEGORÍA ── */
  // Agrupar: primero por categoría, luego sin categoría
  const grouped: Array<{ catName: string; products: Product[] }> = [];

  if (cats.length > 0) {
    cats.forEach((cat) => {
      const prods = visibleProds.filter((p) => p.categoryId === cat.id);
      if (prods.length > 0) grouped.push({ catName: cat.name, products: prods });
    });
    const uncategorized = visibleProds.filter(
      (p) => !p.categoryId || !cats.find((c) => c.id === p.categoryId),
    );
    if (uncategorized.length > 0)
      grouped.push({ catName: "Otros productos", products: uncategorized });
  } else {
    grouped.push({ catName: "Nuestros Productos", products: visibleProds });
  }

  let processedCount = 0;
  const totalCount = visibleProds.length;

  for (const group of grouped) {
    newPage();

    /* ── Encabezado de categoría ── */
    // Bloque de color a la izquierda
    doc.setFillColor(t.accent);
    doc.rect(MARGIN, 14, 3, 10, "F");

    setFont("bold");
    doc.setFontSize(15);
    doc.setTextColor(theme.id === "oscuro" ? t.accent : t.header);
    doc.text(safe(group.catName.toUpperCase()), MARGIN + 6, 22);

    setFont("normal");
    doc.setFontSize(7.5);
    doc.setTextColor(theme.id === "oscuro" ? "#ffffff99" : t.subtext);
    doc.text(
      `${group.products.length} producto${group.products.length !== 1 ? "s" : ""}`,
      MARGIN + 6,
      27,
    );

    // Línea separadora
    doc.setDrawColor(theme.id === "oscuro" ? t.accent + "80" : t.accent);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, 30, PAGE_W - MARGIN, 30);

    y = 36;

    /* ── Grid de productos: 2 columnas ── */
    const CARD_H = 54; // altura por tarjeta en mm
    const IMG_SIZE = 34;
    const GAP = 6;

    let col = 0; // 0 = izq, 1 = der

    for (let pi = 0; pi < group.products.length; pi++) {
      const prod = group.products[pi];

      // Coordenadas
      const cardX = MARGIN + col * (COL_W + GAP);

      checkY(CARD_H + 4);
      const actualCardY = y; // puede haber cambiado tras checkY

      // ---- 1. DIBUJAR TARJETA (FONDO Y BORDE) ----
      doc.setFillColor(t.card);
      doc.roundedRect(cardX, actualCardY, COL_W, CARD_H, 2.5, 2.5, "F");

      // Borde de la tarjeta
      doc.setDrawColor(blendColors(t.accent, t.bg, theme.id === "oscuro" ? 0.3 : 0.25));
      doc.setLineWidth(0.2);
      doc.roundedRect(cardX, actualCardY, COL_W, CARD_H, 2.5, 2.5, "S");

      // ---- 2. DIBUJAR IMAGEN O PLACEHOLDER (ENCIMA DE LA TARJETA) ----
      const imgX = cardX + 3;
      const imgY = actualCardY + 3;
      let imgLoaded = false;

      if (prod.image) {
        const b64 = await urlToBase64(prod.image);
        if (b64) {
          try {
            doc.addImage(b64, "JPEG", imgX, imgY, IMG_SIZE, IMG_SIZE, undefined, "FAST");
            imgLoaded = true;
          } catch {
            /* fallback */
          }
        }
      }

      if (!imgLoaded) {
        // Placeholder con inicial
        doc.setFillColor(blendColors(t.accent, t.card, 0.13));
        doc.roundedRect(imgX, imgY, IMG_SIZE, IMG_SIZE, 2, 2, "F");
        setFont("bold");
        doc.setFontSize(14);
        doc.setTextColor(t.accent);
        doc.text(
          safe(prod.name.charAt(0).toUpperCase()),
          imgX + IMG_SIZE / 2,
          imgY + IMG_SIZE / 2 + 2,
          { align: "center" },
        );
      }

      // ---- 3. DIBUJAR TEXTOS DE PRODUCTO ----
      const textX = imgX + IMG_SIZE + 3;
      const textW = COL_W - IMG_SIZE - 9;

      // Badge oferta
      if (prod.isOnSale) {
        doc.setFillColor("#ef4444");
        doc.roundedRect(textX, imgY, 14, 4.5, 1, 1, "F");
        setFont("bold");
        doc.setFontSize(5.5);
        doc.setTextColor("#ffffff");
        doc.text("OFERTA", textX + 7, imgY + 3.2, { align: "center" });
      }

      // Nombre producto
      const nameY = prod.isOnSale ? imgY + 7 : imgY + 2;
      setFont("bold");
      doc.setFontSize(7.5);
      doc.setTextColor(t.text);
      const nameLines = doc.splitTextToSize(safe(prod.name), textW);
      doc.text(nameLines.slice(0, 2), textX, nameY);

      // Descripción
      if (prod.description) {
        setFont("normal");
        doc.setFontSize(6);
        doc.setTextColor(t.subtext);
        const descLines = doc.splitTextToSize(safe(prod.description), textW);
        doc.text(descLines.slice(0, 3), textX, nameY + 8);
      }

      // Precio
      const priceY = actualCardY + CARD_H - 6;
      if (prod.isOnSale && prod.originalPrice) {
        // Precio original tachado
        setFont("normal");
        doc.setFontSize(6);
        doc.setTextColor(t.subtext);
        const origText = formatPrice(prod.originalPrice);
        doc.text(safe(origText), textX, priceY - 4);
        // Línea tachado
        const origW = doc.getTextWidth(safe(origText));
        doc.setDrawColor(t.subtext);
        doc.setLineWidth(0.3);
        doc.line(textX, priceY - 5, textX + origW, priceY - 5);
      }
      setFont("bold");
      doc.setFontSize(9);
      doc.setTextColor(t.accent);
      doc.text(safe(formatPrice(prod.price)), textX, priceY);

      // Avanzar columna / fila
      if (col === 0) {
        col = 1;
      } else {
        col = 0;
        y += CARD_H + 4;
      }

      processedCount++;
      if (onProgress) {
        onProgress(processedCount, totalCount);
        // Permitir re-renderizar la barra de progreso en React
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    // Si quedó col izquierda sin par, avanzar fila
    if (col === 1) y += CARD_H + 4;
  }

  /* ── PÁGINA FINAL: CTA ─────────────────── */
  newPage();

  // Bloque decorativo central
  doc.setFillColor(t.accent);
  doc.rect(0, PAGE_H / 2 - 45, PAGE_W, 90, "F");

  doc.setFontSize(20);
  doc.setTextColor("#ffffff");
  doc.text("Haz tu pedido ahora", PAGE_W / 2, PAGE_H / 2 - 12, { align: "center" });

  doc.setFontSize(10);
  doc.text("Envianos un mensaje por WhatsApp", PAGE_W / 2, PAGE_H / 2, { align: "center" });

  if (store.phone) {
    doc.setFontSize(13);
    doc.text(`+${store.phone}`, PAGE_W / 2, PAGE_H / 2 + 12, { align: "center" });
  }

  doc.setFontSize(8);
  doc.setTextColor(t.text);
  doc.text(
    `Catalogo generado por Dizi — ${new Date().toLocaleDateString("es")}`,
    PAGE_W / 2,
    PAGE_H - 20,
    { align: "center" },
  );

  /* ── GUARDAR ─────────────────────────────── */
  const filename = `${safe(store.name).replace(/\s+/g, "_")}_catalogo_${theme.id}.pdf`;
  doc.save(filename);
}

/* ─────────────────────────────────────────────────────────
   MODAL DE SELECCIÓN DE TEMA
───────────────────────────────────────────────────────── */
function ThemeCard({
  theme,
  selected,
  onClick,
}: {
  theme: PdfTheme;
  selected: boolean;
  onClick: () => void;
}) {
  const t = theme.preview;
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-full rounded-2xl border-2 overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-xl text-left",
        selected
          ? "border-primary shadow-xl shadow-primary/20 scale-[1.02]"
          : "border-border hover:border-primary/40",
      )}
    >
      {/* Mini preview del PDF */}
      <div className="h-32 relative overflow-hidden" style={{ backgroundColor: t.bg }}>
        {/* Header strip */}
        <div
          className="absolute top-0 left-0 right-0 h-12 flex flex-col items-center justify-center gap-1"
          style={{ backgroundColor: t.accent }}
        >
          <div className="h-5 w-5 rounded-sm bg-white/30" />
          <div className="h-1.5 rounded-full w-16 bg-white/80" />
        </div>
        {/* Product cards */}
        <div className="absolute bottom-0 left-0 right-0 p-2 grid grid-cols-2 gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg p-1.5 flex items-center gap-1.5"
              style={{ backgroundColor: t.card }}
            >
              <div
                className="h-5 w-5 rounded shrink-0"
                style={{ backgroundColor: t.accent + "44" }}
              />
              <div className="flex-1 space-y-0.5">
                <div
                  className="h-1 rounded-full"
                  style={{ backgroundColor: t.text, opacity: 0.6, width: "70%" }}
                />
                <div
                  className="h-1 rounded-full"
                  style={{ backgroundColor: t.accent, width: "45%" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 bg-card">
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm">{theme.name}</span>
          {selected && (
            <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
              <Check className="h-3 w-3 text-primary-foreground" />
            </div>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">{theme.desc}</p>
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN EXPORT BUTTON COMPONENT
───────────────────────────────────────────────────────── */
export function CatalogPdfExportButton({
  store,
  variant = "admin",
}: {
  store: Store;
  variant?: "admin" | "catalog";
}) {
  const [open, setOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string>("moderno");
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const theme = PDF_THEMES.find((t) => t.id === selectedTheme) ?? PDF_THEMES[1];

  const handleGenerate = async () => {
    setGenerating(true);
    setDone(false);
    setProgress({ current: 0, total: visibleCount });
    try {
      await generateCatalogPdf(store, theme, (current, total) => {
        setProgress({ current, total });
      });
      setDone(true);
      setTimeout(() => {
        setDone(false);
        setOpen(false);
        setProgress(null);
      }, 1800);
    } catch (err) {
      console.error("[PDF Export]", err);
      setProgress(null);
    } finally {
      setGenerating(false);
    }
  };

  const visibleCount = (store.products || []).filter((p) => p.visible).length;

  return (
    <>
      {variant === "admin" ? (
        <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
          <Download className="h-4 w-4" />
          Descargar PDF
        </Button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          title="Descargar catálogo PDF"
          className={cn(
            "shrink-0 h-8 px-3 rounded-full border border-primary/20 bg-primary/5 text-primary",
            "text-[11px] font-bold uppercase tracking-wider hover:bg-primary/10 transition",
            "flex items-center gap-1.5",
          )}
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">PDF</span>
        </button>
      )}

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-background rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b sticky top-0 bg-background z-10">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Download className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-base">Descargar Catálogo PDF</h2>
                  <p className="text-[11px] text-muted-foreground">
                    {visibleCount} productos · {store.categories?.length || 0} categorías
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-5 space-y-5">
              {/* Elige el estilo */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="h-4 w-4 text-primary" />
                  <span className="font-bold text-sm">Elige el estilo del PDF</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PDF_THEMES.map((t) => (
                    <ThemeCard
                      key={t.id}
                      theme={t}
                      selected={selectedTheme === t.id}
                      onClick={() => setSelectedTheme(t.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Qué incluye */}
              <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  El PDF incluye
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    "Logo y nombre de tu tienda",
                    "Productos divididos por categoría",
                    "Fotos de cada producto",
                    "Nombre y precio de cada producto",
                    "Descuentos y ofertas marcados",
                    "Descripción breve",
                    "Número de WhatsApp",
                    "Página de contacto final",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-1.5 text-[11px]">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nota sobre imágenes */}
              <p className="text-[10px] text-muted-foreground text-center">
                Las imágenes se descargan al generar el PDF. Puede tardar unos segundos según la
                cantidad de productos.
              </p>

              {/* Barra de progreso */}
              {generating && progress && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                    <span>Procesando productos...</span>
                    <span>
                      {progress.current} de {progress.total} ({Math.round((progress.current / progress.total) * 100)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 ease-out"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Botón de generación */}
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full h-12 rounded-full text-sm font-bold gap-2 shadow-lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generando PDF...
                  </>
                ) : done ? (
                  <>
                    <Check className="h-4 w-4" />
                    ¡Descargado!
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Descargar como PDF — {theme.name}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
