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
import { formatPrice, buildWaUrl } from "@/lib/whatsapp";
import { supabase } from "@/lib/supabase";

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

/** Descarga una imagen, la recorta (object-fit: cover) al aspect ratio objetivo (y opcionalmente a un círculo) y la convierte a JPEG/PNG comprimido */
export async function urlToBase64(
  url: string,
  targetAspectRatio?: number,
  maxDim = 400,
  isCircle = false,
): Promise<string | null> {
  try {
    let blob: Blob | null = null;
    let useBlobUrl = false;

    // 1. Intentar descargar mediante el cliente de Supabase si aplica
    const storageMatch = url.match(/\/storage\/v1\/object\/(public|sign)\/([^/]+)\/(.+)$/);
    if (storageMatch) {
      const bucket = storageMatch[2];
      let path = storageMatch[3];
      const qIndex = path.indexOf("?");
      if (qIndex !== -1) {
        path = path.substring(0, qIndex);
      }
      try {
        const { data, error } = await supabase.storage.from(bucket).download(path);
        if (!error && data) {
          blob = data;
          useBlobUrl = true;
        }
      } catch (e) {
        console.warn("[PDF Supabase Download Exception]", e);
      }
    }

    // 2. Si no es de Supabase o falló la descarga por SDK, intentar fetch tradicional (sin y con cache buster)
    if (!blob) {
      try {
        const res = await fetch(url, { mode: "cors" });
        if (res.ok) {
          blob = await res.blob();
          useBlobUrl = true;
        }
      } catch (e) {
        try {
          const separator = url.includes("?") ? "&" : "?";
          const cacheBusterUrl = `${url}${separator}t_pdf=${Date.now()}`;
          const res = await fetch(cacheBusterUrl, { mode: "cors" });
          if (res.ok) {
            blob = await res.blob();
            useBlobUrl = true;
          }
        } catch (e2) {
          console.warn("[PDF Fetch Failed]", e2);
        }
      }
    }

    // 3. Cargar en objeto Image para procesar en canvas
    const img = new Image();
    if (useBlobUrl && blob) {
      const blobUrl = URL.createObjectURL(blob);
      try {
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = blobUrl;
        });
      } finally {
        URL.revokeObjectURL(blobUrl);
      }
    } else {
      // FALLBACK DIRECTO: Si los métodos de descarga directa fallaron (por CORS, headers, CDN),
      // intentamos cargar la imagen directamente con crossOrigin = anonymous.
      img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });
    }

    // Calcular dimensiones del canvas final respetando el aspect ratio objetivo
    let canvasWidth = maxDim;
    let canvasHeight = maxDim;

    if (targetAspectRatio) {
      if (targetAspectRatio > 1) {
        // Ancho es mayor que alto (ej. Rústico)
        canvasWidth = maxDim;
        canvasHeight = Math.round(maxDim / targetAspectRatio);
      } else {
        // Alto es mayor que ancho
        canvasHeight = maxDim;
        canvasWidth = Math.round(maxDim * targetAspectRatio);
      }
    } else {
      // Mantener aspect ratio original
      if (img.width > img.height) {
        canvasHeight = Math.round((img.height * maxDim) / img.width);
        canvasWidth = maxDim;
      } else {
        canvasWidth = Math.round((img.width * maxDim) / img.height);
        canvasHeight = maxDim;
      }
    }

    // Calcular de qué parte de la imagen origen cortar (cropping en el centro al estilo 'object-fit: cover')
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = img.width;
    let sourceHeight = img.height;

    if (targetAspectRatio) {
      const imgAspectRatio = img.width / img.height;
      if (imgAspectRatio > targetAspectRatio) {
        // La imagen origen es más ancha de lo requerido, cortamos a los lados
        sourceWidth = img.height * targetAspectRatio;
        sourceX = (img.width - sourceWidth) / 2;
      } else {
        // La imagen origen es más alta de lo requerido, cortamos arriba y abajo
        sourceHeight = img.width / targetAspectRatio;
        sourceY = (img.height - sourceHeight) / 2;
      }
    }

    // Dibujar en canvas
    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    if (isCircle) {
      // Recorte circular
      ctx.beginPath();
      ctx.arc(canvasWidth / 2, canvasHeight / 2, canvasWidth / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
    } else {
      // Fondo blanco por si la imagen tiene transparencia (ej. PNG/WebP transparentes)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Dibujar recortado y centrado
    ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvasWidth, canvasHeight);

    // Exportar. Si es círculo, exportamos como PNG para conservar transparencia en las esquinas
    const compressedBase64 = isCircle
      ? canvas.toDataURL("image/png")
      : canvas.toDataURL("image/jpeg", 0.75); // 75% calidad para JPEGs

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
export async function generateCatalogPdf(
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

  // Descargar y comprimir logo una sola vez al inicio. Si el tema usa círculo, hacemos un recorte circular
  let logoB64: string | null = null;
  const isCircleLogo = theme.id === "rustico" || theme.id === "oscuro";
  const logoFormat = isCircleLogo ? "PNG" : "JPEG";
  if (store.logo) {
    logoB64 = await urlToBase64(store.logo, 1, 400, isCircleLogo);
  }

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

  if (theme.id === "elegante") {
    // ---- PORTADA ELEGANTE (Luxury Gold & Cream) ----
    doc.setDrawColor(t.accent);
    doc.setLineWidth(0.3);
    doc.rect(10, 10, PAGE_W - 20, PAGE_H - 20, "S");
    doc.rect(11.5, 11.5, PAGE_W - 23, PAGE_H - 23, "S");

    const logoY = 45;
    let logoLoaded = false;
    if (logoB64) {
      try {
        doc.setFillColor("#ffffff");
        doc.roundedRect(logoX - 1, logoY - 1, logoSize + 2, logoSize + 2, 2, 2, "F");
        doc.addImage(logoB64, logoFormat, logoX, logoY, logoSize, logoSize, undefined, "FAST");
        logoLoaded = true;
      } catch {}
    }
    if (!logoLoaded) {
      doc.setFillColor(t.card);
      doc.roundedRect(logoX, logoY, logoSize, logoSize, 2, 2, "F");
      doc.setDrawColor(t.accent);
      doc.setLineWidth(0.35);
      doc.roundedRect(logoX, logoY, logoSize, logoSize, 2, 2, "S");
      setFont("bold");
      doc.setFontSize(18);
      doc.setTextColor(t.accent);
      doc.text(safe(store.name.charAt(0).toUpperCase()), PAGE_W / 2, logoY + logoSize / 2 + 3, {
        align: "center",
      });
    }

    setFont("bold");
    doc.setFontSize(26);
    doc.setTextColor(t.header);
    doc.text(safe(store.name.toUpperCase()), PAGE_W / 2, 92, { align: "center" });

    doc.setDrawColor(t.accent);
    doc.setLineWidth(0.4);
    doc.line(PAGE_W / 2 - 30, 99, PAGE_W / 2 - 4, 99);
    doc.line(PAGE_W / 2 + 4, 99, PAGE_W / 2 + 30, 99);
    doc.setFillColor(t.accent);
    doc.triangle(PAGE_W / 2, 97.5, PAGE_W / 2 - 2, 99, PAGE_W / 2 + 2, 99, "FD");
    doc.triangle(PAGE_W / 2, 100.5, PAGE_W / 2 - 2, 99, PAGE_W / 2 + 2, 99, "FD");

    setFont("italic");
    doc.setFontSize(10);
    doc.setTextColor(t.subtext);
    doc.text("Catálogo Oficial de Productos", PAGE_W / 2, 108, { align: "center" });

    y = 125;

  } else if (theme.id === "oscuro") {
    // ---- PORTADA PREMIUM DARK ----
    doc.setDrawColor(t.accent);
    doc.setLineWidth(0.35);
    doc.rect(10, 10, PAGE_W - 20, PAGE_H - 20, "S");

    const logoY = 42;
    let logoLoaded = false;
    if (logoB64) {
      try {
        doc.addImage(logoB64, logoFormat, logoX, logoY, logoSize, logoSize, undefined, "FAST");
        logoLoaded = true;
      } catch {}
    }
    doc.setDrawColor(t.accent);
    doc.setLineWidth(0.5);
    doc.circle(PAGE_W / 2, logoY + logoSize / 2, logoSize / 2 + 4, "S");

    if (!logoLoaded) {
      setFont("bold");
      doc.setFontSize(20);
      doc.setTextColor(t.accent);
      doc.text(safe(store.name.charAt(0).toUpperCase()), PAGE_W / 2, logoY + logoSize / 2 + 3, {
        align: "center",
      });
    }

    setFont("bold");
    doc.setFontSize(26);
    doc.setTextColor(t.accent);
    doc.text(safe(store.name.toUpperCase()), PAGE_W / 2, 92, { align: "center" });

    setFont("normal");
    doc.setFontSize(9);
    doc.setTextColor("#ffffffcc");
    doc.text("COLECCIÓN EXCLUSIVA DE PRODUCTOS", PAGE_W / 2, 100, { align: "center" });

    doc.setFillColor(t.accent);
    doc.rect(PAGE_W / 2 - 20, 106, 40, 0.4, "F");

    y = 125;

  } else if (theme.id === "rustico") {
    // ---- PORTADA CÁLIDO RÚSTICO (Artisan & Cozy) ----
    doc.setFillColor(t.accent);
    doc.rect(0, 0, 6, PAGE_H, "F");
    doc.rect(PAGE_W - 6, 0, 6, PAGE_H, "F");

    doc.setFillColor(t.accent);
    doc.rect(6, 35, PAGE_W - 12, 50, "F");

    const logoY = 46;
    let logoLoaded = false;
    if (logoB64) {
      try {
        doc.setFillColor("#ffffff");
        doc.circle(PAGE_W / 2, logoY + logoSize / 2, logoSize / 2 + 2, "F");
        doc.addImage(logoB64, logoFormat, logoX, logoY, logoSize, logoSize, undefined, "FAST");
        logoLoaded = true;
      } catch {}
    }
    if (!logoLoaded) {
      doc.setFillColor("#ffffff");
      doc.circle(PAGE_W / 2, logoY + logoSize / 2, logoSize / 2 + 2, "F");
      setFont("bold");
      doc.setFontSize(18);
      doc.setTextColor(t.accent);
      doc.text(safe(store.name.charAt(0).toUpperCase()), PAGE_W / 2, logoY + logoSize / 2 + 3, {
        align: "center",
      });
    }

    setFont("bold");
    doc.setFontSize(24);
    doc.setTextColor(t.header);
    doc.text(safe(store.name.toUpperCase()), PAGE_W / 2, 102, { align: "center" });

    setFont("italic");
    doc.setFontSize(9.5);
    doc.setTextColor(t.subtext);
    doc.text("Hecho con amor · Catálogo de Productos", PAGE_W / 2, 109, { align: "center" });

    doc.setDrawColor(t.accent);
    doc.setLineWidth(0.3);
    doc.line(PAGE_W / 2 - 30, 116, PAGE_W / 2 + 30, 116);
    doc.setFillColor(t.accent);
    doc.circle(PAGE_W / 2, 116, 1.2, "FD");
    doc.circle(PAGE_W / 2 - 10, 116, 0.8, "FD");
    doc.circle(PAGE_W / 2 + 10, 116, 0.8, "FD");

    y = 130;

  } else if (theme.id === "nordico") {
    // ---- PORTADA NÓRDICO ORGÁNICO (Clean Scandinavian) ----
    doc.setFillColor(t.accent);
    doc.rect(0, 0, 14, PAGE_H, "F");

    const logoY = 48;
    let logoLoaded = false;
    if (logoB64) {
      try {
        doc.setFillColor("#ffffff");
        doc.roundedRect(logoX - 1, logoY - 1, logoSize + 2, logoSize + 2, 3, 3, "F");
        doc.addImage(logoB64, logoFormat, logoX, logoY, logoSize, logoSize, undefined, "FAST");
        logoLoaded = true;
      } catch {}
    }
    if (!logoLoaded) {
      doc.setFillColor("#ffffff");
      doc.roundedRect(logoX, logoY, logoSize, logoSize, 3, 3, "F");
      setFont("bold");
      doc.setFontSize(18);
      doc.setTextColor(t.accent);
      doc.text(safe(store.name.charAt(0).toUpperCase()), PAGE_W / 2 + 7, logoY + logoSize / 2 + 3, {
        align: "center",
      });
    }

    setFont("bold");
    doc.setFontSize(22);
    doc.setTextColor(t.header);
    doc.text(safe(store.name.toUpperCase()), PAGE_W / 2 + 7, 98, { align: "center" });

    setFont("normal");
    doc.setFontSize(8.5);
    doc.setTextColor(t.subtext);
    doc.text("DISEÑO Y SELECCIÓN NATURAL", PAGE_W / 2 + 7, 105, { align: "center" });

    doc.setFillColor(t.accent);
    doc.rect(MARGIN + 10, 112, PAGE_W - (MARGIN + 10) * 2 - 10, 0.3, "F");

    y = 125;

  } else {
    // ---- PORTADA MODERNO (Indigo Editorial) ----
    doc.setFillColor(t.accent);
    doc.rect(0, 0, PAGE_W, 65, "F");

    const logoY = 51;
    let logoLoaded = false;
    if (logoB64) {
      try {
        doc.setFillColor("#ffffff");
        doc.roundedRect(logoX - 1, logoY - 1, logoSize + 2, logoSize + 2, 3, 3, "F");
        doc.addImage(logoB64, logoFormat, logoX, logoY, logoSize, logoSize, undefined, "FAST");
        logoLoaded = true;
      } catch {}
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

    setFont("bold");
    doc.setFontSize(24);
    doc.setTextColor(t.header);
    doc.text(safe(store.name.toUpperCase()), PAGE_W / 2, 94, { align: "center" });

    setFont("normal");
    doc.setFontSize(9);
    doc.setTextColor(t.subtext);
    doc.text("CATALOGO DIGITAL DE PRODUCTOS", PAGE_W / 2, 102, { align: "center" });

    y = 112;
    doc.setFillColor(t.accent);
    doc.rect(MARGIN + 20, y, PAGE_W - (MARGIN + 20) * 2, 0.4, "F");
    y += 10;
  }

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
    doc.text(safe(item!), theme.id === "nordico" ? PAGE_W / 2 + 7 : PAGE_W / 2, y + i * 7, { align: "center" });
  });

  y += summaryItems.length * 7 + 12;

  // Divider
  doc.setFillColor(t.accent);
  doc.rect(theme.id === "nordico" ? MARGIN + 10 : MARGIN + 30, y, theme.id === "nordico" ? PAGE_W - (MARGIN + 10) * 2 - 10 : PAGE_W - (MARGIN + 30) * 2, 0.3, "F");
  y += 10;

  // Info "cómo pedir"
  setFont("normal");
  doc.setFontSize(8.5);
  doc.setTextColor(t.text);
  doc.text("Para realizar tu pedido o consultar disponibilidad,", theme.id === "nordico" ? PAGE_W / 2 + 7 : PAGE_W / 2, y, {
    align: "center",
  });
  y += 5.5;
  doc.text("contactanos por WhatsApp con el nombre del producto.", theme.id === "nordico" ? PAGE_W / 2 + 7 : PAGE_W / 2, y, {
    align: "center",
  });

  // ── PÁGINA 2: ÍNDICE DE CATEGORÍAS ──
  newPage();
  const indexPageNum = doc.internal.getNumberOfPages();

  /* ── PÁGINAS DE PRODUCTOS POR CATEGORÍA ── */
  // Agrupar: primero por categoría, luego sin categoría
  const grouped: Array<{ catName: string; products: Product[] }> = [];
  const categoryPageNumbers: Array<{ name: string; page: number }> = [];

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
    categoryPageNumbers.push({ name: group.catName, page: doc.internal.getNumberOfPages() });

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

    /* ── Configuración de tarjeta según el estilo de diseño ── */
    const isNordico = theme.id === "nordico";
    const isRustico = theme.id === "rustico";

    const CARD_H = isNordico ? 46 : (isRustico ? 68 : 54);
    const COLS = isNordico ? 1 : 2;
    const GAP = 6;
    const CARD_W = isNordico ? (PAGE_W - MARGIN * 2) : COL_W;
    
    // Dimensiones de la imagen
    const IMG_W = isRustico ? (CARD_W - 6) : (isNordico ? 40 : 34);
    const IMG_H = isRustico ? 36 : (isNordico ? 40 : 34);

    let col = 0; // 0 = izq, 1 = der (solo aplica cuando COLS es 2)

    for (let pi = 0; pi < group.products.length; pi++) {
      const prod = group.products[pi];

      // Coordenadas
      const cardX = MARGIN + col * (CARD_W + GAP);
      checkY(CARD_H + 4);
      const actualCardY = y; // puede haber cambiado tras checkY

      // ---- 1. DIBUJAR TARJETA (FONDO Y BORDE) ----
      doc.setFillColor(t.card);
      doc.roundedRect(cardX, actualCardY, CARD_W, CARD_H, 2.5, 2.5, "F");

      // Borde de la tarjeta
      doc.setDrawColor(blendColors(t.accent, t.bg, theme.id === "oscuro" ? 0.3 : 0.25));
      doc.setLineWidth(0.2);
      doc.roundedRect(cardX, actualCardY, CARD_W, CARD_H, 2.5, 2.5, "S");

      // ---- 2. DIBUJAR IMAGEN O PLACEHOLDER (ENCIMA DE LA TARJETA) ----
      const imgX = cardX + 3;
      const imgY = actualCardY + 3;
      let imgLoaded = false;

      if (prod.image) {
        const b64 = await urlToBase64(prod.image, IMG_W / IMG_H);
        if (b64) {
          try {
            doc.addImage(b64, "JPEG", imgX, imgY, IMG_W, IMG_H, undefined, "FAST");
            imgLoaded = true;
          } catch {
            /* fallback */
          }
        }
      }

      if (!imgLoaded) {
        // Placeholder con inicial
        doc.setFillColor(blendColors(t.accent, t.card, 0.13));
        doc.roundedRect(imgX, imgY, IMG_W, IMG_H, 2, 2, "F");
        setFont("bold");
        doc.setFontSize(14);
        doc.setTextColor(t.accent);
        doc.text(
          safe(prod.name.charAt(0).toUpperCase()),
          imgX + IMG_W / 2,
          imgY + IMG_H / 2 + 2,
          { align: "center" },
        );
      }

      // ---- 3. DIBUJAR TEXTOS DE PRODUCTO ----
      let textX, textW, nameY, descY, priceY;

      if (isRustico) {
        // Rústico: Textos debajo de la imagen
        textX = cardX + 4;
        textW = CARD_W - 8;
        nameY = actualCardY + IMG_H + 6;
        descY = nameY + 5;
        priceY = actualCardY + CARD_H - 3;
      } else if (isNordico) {
        // Nórdico: Imagen a la izquierda (grande), textos a la derecha
        textX = imgX + IMG_W + 5;
        textW = CARD_W - IMG_W - 11;
        nameY = actualCardY + 6;
        descY = nameY + 6;
        priceY = actualCardY + CARD_H - 5;
      } else {
        // Moderno, Oscuro, Elegante: Imagen izquierda, textos derecha
        textX = imgX + IMG_W + 3;
        textW = CARD_W - IMG_W - 9;
        nameY = imgY + 2;
        descY = nameY + 6;
        priceY = actualCardY + CARD_H - 6;
      }

      // Badge de oferta sobre la imagen (previene solapamientos con el texto)
      if (prod.isOnSale) {
        const badgeX = imgX + 1.5;
        const badgeY = imgY + 1.5;
        doc.setFillColor("#ef4444");
        doc.roundedRect(badgeX, badgeY, 14, 4.5, 1, 1, "F");
        setFont("bold");
        doc.setFontSize(5.5);
        doc.setTextColor("#ffffff");
        doc.text("OFERTA", badgeX + 7, badgeY + 3.2, { align: "center" });
      }

      // Nombre producto (más grande y destacado)
      setFont("bold");
      doc.setFontSize(8.5);
      doc.setTextColor(t.text);
      const nameLines = doc.splitTextToSize(safe(prod.name), textW);
      doc.text(nameLines.slice(0, 2), textX, nameY);

      // Descripción (más legible)
      if (prod.description) {
        setFont("normal");
        doc.setFontSize(6.5);
        doc.setTextColor(t.subtext);
        const maxLines = isNordico ? 4 : 2; // Más líneas en Nórdico por el ancho
        const descLines = doc.splitTextToSize(safe(prod.description), textW);
        doc.text(descLines.slice(0, maxLines), textX, descY);
      }

      // Precio y Precio de Oferta (más grandes y con mejor separación)
      if (prod.isOnSale && prod.originalPrice) {
        setFont("normal");
        doc.setFontSize(7);
        doc.setTextColor(t.subtext);
        const origText = formatPrice(prod.originalPrice);

        if (isRustico || isNordico) {
          // Rústico/Nórdico: Precios en horizontal (Tachado, Actual)
          const origW = doc.getTextWidth(safe(origText));
          doc.text(safe(origText), textX, priceY);
          // Línea de tachado
          doc.setDrawColor(t.subtext);
          doc.setLineWidth(0.3);
          doc.line(textX, priceY - 1, textX + origW, priceY - 1);

          setFont("bold");
          doc.setFontSize(10);
          doc.setTextColor(t.accent);
          doc.text(safe(formatPrice(prod.price)), textX + origW + 4, priceY);
        } else {
          // Estilo original vertical (Tachado arriba, Actual abajo)
          doc.text(safe(origText), textX, priceY - 4);
          const origW = doc.getTextWidth(safe(origText));
          doc.setDrawColor(t.subtext);
          doc.setLineWidth(0.3);
          doc.line(textX, priceY - 5, textX + origW, priceY - 5);

          setFont("bold");
          doc.setFontSize(10);
          doc.setTextColor(t.accent);
          doc.text(safe(formatPrice(prod.price)), textX, priceY);
        }
      } else {
        setFont("bold");
        doc.setFontSize(10);
        doc.setTextColor(t.accent);
        doc.text(safe(formatPrice(prod.price)), textX, priceY);
      }

      // ---- 4. DIBUJAR BOTÓN COMPRAR (WHATSAPP) ----
      if (store.phone) {
        const msg = `Hola, me interesa el producto "${prod.name}" del catálogo.`;
        const waUrl = buildWaUrl(store.phone, msg);

        let btnX, btnY, btnW, btnH;
        if (isRustico) {
          btnW = 20;
          btnH = 5.5;
          btnX = cardX + CARD_W - btnW - 4;
          btnY = priceY - 4.5;
        } else if (isNordico) {
          btnW = 22;
          btnH = 6;
          btnX = cardX + CARD_W - btnW - 6;
          btnY = priceY - 4.8;
        } else {
          btnW = 20;
          btnH = 5.5;
          btnX = cardX + CARD_W - btnW - 4;
          btnY = priceY - 4.5;
        }

        // Fondo del botón (verde whatsapp redondeado)
        doc.setFillColor("#16a34a");
        doc.roundedRect(btnX, btnY, btnW, btnH, 1, 1, "F");

        // Texto del botón
        setFont("bold");
        doc.setFontSize(6);
        doc.setTextColor("#ffffff");
        doc.text("PEDIR", btnX + btnW / 2, btnY + btnH / 2 + 1, { align: "center" });

        // Link clickable
        doc.link(btnX, btnY, btnW, btnH, { url: waUrl });
      }

      // Avanzar columna / fila
      if (COLS === 1) {
        y += CARD_H + 4;
      } else {
        if (col === 0) {
          col = 1;
        } else {
          col = 0;
          y += CARD_H + 4;
        }
      }

      processedCount++;
      if (onProgress) {
        onProgress(processedCount, totalCount);
        // Permitir re-renderizar la barra de progreso en React
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    // Si quedó col izquierda sin par al terminar, avanzar fila
    if (COLS === 2 && col === 1) y += CARD_H + 4;
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

  /* ── DIBUJAR CONTENIDO EN EL ÍNDICE (PÁGINA 2) ── */
  doc.setPage(indexPageNum);

  // Margen superior
  let indexY = 24;

  // Encabezado de la página de Índice
  doc.setFillColor(t.accent);
  doc.rect(MARGIN, indexY, 3, 10, "F");

  setFont("bold");
  doc.setFontSize(18);
  doc.setTextColor(theme.id === "oscuro" ? t.accent : t.header);
  doc.text("ÍNDICE DE CATEGORÍAS", MARGIN + 6, indexY + 7.5);

  indexY += 16;

  setFont("normal");
  doc.setFontSize(9);
  doc.setTextColor(theme.id === "oscuro" ? "#ffffffb3" : t.subtext);
  doc.text("Haz clic en cualquier categoría para ir directamente a la página correspondiente.", MARGIN, indexY);

  indexY += 8;

  // Línea separadora
  doc.setFillColor(t.accent);
  doc.rect(MARGIN, indexY, PAGE_W - MARGIN * 2, 0.4, "F");

  indexY += 16;

  categoryPageNumbers.forEach((item) => {
    // Dibujar nombre de la categoría
    setFont("bold");
    doc.setFontSize(10);
    doc.setTextColor(t.text);
    doc.text(safe(item.name.toUpperCase()), MARGIN, indexY);

    const nameW = doc.getTextWidth(safe(item.name.toUpperCase()));

    // Dibujar número de página alineado a la derecha
    setFont("bold");
    doc.setFontSize(10);
    doc.setTextColor(t.accent);
    const pageText = `Pág. ${item.page}`;
    const pageW = doc.getTextWidth(pageText);
    const pageX = PAGE_W - MARGIN - pageW;
    doc.text(pageText, pageX, indexY);

    // Dibujar puntos de relleno (dotted leaders)
    setFont("normal");
    doc.setFontSize(8.5);
    doc.setTextColor(theme.id === "oscuro" ? "#ffffff4d" : t.subtext + "80");
    const dotsStart = MARGIN + nameW + 3;
    const dotsEnd = pageX - 3;
    let dotsText = "";
    let currentDotsW = 0;
    const dotW = doc.getTextWidth(".");
    while (dotsStart + currentDotsW < dotsEnd) {
      dotsText += ".";
      currentDotsW += dotW + 0.3; // Espaciador de puntos
    }
    doc.text(dotsText, dotsStart, indexY - 0.5);

    // Link clickable que cubre toda la fila para saltar de página en el PDF
    doc.link(MARGIN, indexY - 6, PAGE_W - MARGIN * 2, 8, { pageNumber: item.page });

    indexY += 12;
  });

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
