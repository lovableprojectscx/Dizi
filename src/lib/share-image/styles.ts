/**
 * @file styles.ts
 * @description Renderizador en Canvas de los 4 estilos aprobados de imágenes para estados e historias (F46).
 * Estilos: 'etiqueta' | 'editorial' | 'marco-color' | 'oferta'.
 * Formatos: 'historia' (1080×1920) | 'cuadrada' (1080×1080).
 * Sin dependencias del DOM obligatorio (soporta contextos Canvas 2D reales y mocks de Node para Vitest).
 */

import type {
  ShareImageData,
  ShareImageFormat,
  ShareImageStyle,
  BoundingBox,
  ValidationResult,
} from "./types";
import { SHARE_IMAGE_SIZES } from "./types";

export interface DrawOptions {
  productImage?: any;
  storeLogoImage?: any;
  qrImage?: any;
  collectBoxes?: boolean;
}

export interface DrawResult {
  boxes: BoundingBox[];
  validation: ValidationResult;
}

/**
 * Carga y espera las fuentes tipográficas necesarias para el renderizado del canvas.
 * Garantiza que Playfair Display (serif editorial) y Plus Jakarta Sans estén disponibles
 * antes de medir y pintar textos.
 */
export async function ensureShareImageFontsLoaded(): Promise<void> {
  if (typeof document === "undefined") return;

  if (!document.querySelector('link[href*="Playfair+Display"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;0,800;0,900;1,600;1,700&display=swap";
    document.head.appendChild(link);
  }

  if (document.fonts && typeof document.fonts.load === "function") {
    try {
      await Promise.all([
        document.fonts.load("700 56px 'Plus Jakarta Sans'"),
        document.fonts.load("800 96px 'Plus Jakarta Sans'"),
        document.fonts.load("600 34px 'Plus Jakarta Sans'"),
        document.fonts.load("900 120px 'Plus Jakarta Sans'"),
        document.fonts.load("700 80px 'Playfair Display'"),
        document.fonts.load("italic 700 80px 'Playfair Display'"),
        document.fonts.load("700 56px 'Playfair Display'"),
        document.fonts.load("700 46px 'Playfair Display'"),
        document.fonts.load("700 32px 'Playfair Display'"),
        document.fonts.load("900 28px 'Playfair Display'"),
        document.fonts.ready,
      ]);
    } catch {
      // Continuar con fuentes del sistema si falla la red
    }
  }
}

/**
 * Formatea un número a moneda en soles peruanos.
 */
export function formatCurrency(amount: number): string {
  return `S/ ${amount.toFixed(2)}`;
}

/**
 * Obtiene el texto representativo del precio.
 * Si el precio es <= 0 o se definió como "A consultar", devuelve "A consultar" sin "S/".
 */
export function getPriceDisplay(data: ShareImageData): string {
  if (data.isConsultPrice || !data.price || data.price <= 0) {
    return "A consultar";
  }
  return formatCurrency(data.price);
}

/**
 * Calcula color de contraste (blanco o azul pizarra) según luminancia YIQ.
 */
export function getContrastColor(hexColor: string): string {
  let hex = (hexColor || "#0F172A").replace("#", "").trim();
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  if (hex.length !== 6) return "#FFFFFF";
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? "#0F172A" : "#FFFFFF";
}

/**
 * Traza un rectángulo con esquinas redondeadas en el contexto Canvas.
 */
export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radii: number | number[]
): void {
  const r = typeof radii === "number" ? [radii, radii, radii, radii] : radii;
  const r0 = r[0] || 0;
  const r1 = r[1] || 0;
  const r2 = r[2] || 0;
  const r3 = r[3] || 0;

  ctx.beginPath();
  ctx.moveTo(x + r0, y);
  ctx.lineTo(x + w - r1, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r1);
  ctx.lineTo(x + w, y + h - r2);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r2, y + h);
  ctx.lineTo(x + r3, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r3);
  ctx.lineTo(x, y + r0);
  ctx.quadraticCurveTo(x, y, x + r0, y);
  ctx.closePath();
}

/**
 * Calcula las coordenadas de ajuste `contain` para dibujar la foto completa sin deformar.
 */
export function getContainedBox(
  imgW: number,
  imgH: number,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number
): { x: number; y: number; width: number; height: number } {
  if (!imgW || !imgH) return { x: boxX, y: boxY, width: boxW, height: boxH };
  const imgRatio = imgW / imgH;
  const boxRatio = boxW / boxH;
  let drawW: number;
  let drawH: number;

  if (imgRatio > boxRatio) {
    drawW = boxW;
    drawH = boxW / imgRatio;
  } else {
    drawH = boxH;
    drawW = boxH * imgRatio;
  }

  return {
    x: Math.round(boxX + (boxW - drawW) / 2),
    y: Math.round(boxY + (boxH - drawH) / 2),
    width: Math.round(drawW),
    height: Math.round(drawH),
  };
}

/**
 * Divide un texto en múltiples líneas respetando un ancho máximo.
 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number = 2
): string[] {
  const words = (text || "").split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length === maxLines - 1) {
        break;
      }
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Dibuja el sello oficial "Hecho con Dizi · dizicatalogo.com" en tiendas Semilla.
 */
export function drawSemillaBadgeSafe(
  ctx: CanvasRenderingContext2D,
  data: ShareImageData,
  format: ShareImageFormat,
  boxes?: BoundingBox[]
): void {
  if (!data.showBranding) return;

  const text = data.brandingText || "Hecho con Dizi · dizicatalogo.com";
  const py = format === "historia" ? 1600 : format === "post-ig" ? 1315 : 1045;

  ctx.save();
  ctx.font = "800 28px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
  const textW = ctx.measureText(text).width;
  const pillW = Math.round(textW + 48);
  const pillH = 46;
  const pillX = Math.round((1080 - pillW) / 2);
  const pillY = Math.round(py - pillH / 2);

  ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
  roundRect(ctx, pillX, pillY, pillW, pillH, 23);
  ctx.fill();

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 540, py);
  ctx.restore();

  if (boxes) {
    boxes.push({
      id: "semillaBadge",
      x: pillX,
      y: pillY,
      width: pillW,
      height: pillH,
    });
  }
}

/**
 * Dibuja la cabecera flotante de la tienda (Logo + Nombre a ~34px).
 */
export function drawStoreHeader(
  ctx: CanvasRenderingContext2D,
  data: ShareImageData,
  format: ShareImageFormat,
  dark: boolean = false,
  boxes?: BoundingBox[],
  logoImg?: any
): void {
  const headerY = format === "historia" ? 265 : 44;

  ctx.save();
  ctx.font = "600 34px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
  const storeName = data.storeName;
  const textW = ctx.measureText(storeName).width;
  const hasLogo = Boolean(logoImg || data.storeLogoUrl);
  const pillW = Math.round(textW + (hasLogo ? 80 : 44));
  const pillH = 60;
  const pillX = 60;
  const pillY = Math.round(headerY - 6);

  ctx.fillStyle = dark ? "rgba(15, 23, 42, 0.85)" : "rgba(255, 255, 255, 0.95)";
  roundRect(ctx, pillX, pillY, pillW, pillH, 30);
  ctx.fill();

  ctx.lineWidth = 1;
  ctx.strokeStyle = dark ? "rgba(255, 255, 255, 0.15)" : "rgba(15, 23, 42, 0.08)";
  ctx.stroke();

  const iconX = pillX + 16;
  const iconY = pillY + 12;
  const iconSize = 36;

  if (logoImg && typeof ctx.drawImage === "function") {
    try {
      ctx.save();
      roundRect(ctx, iconX, iconY, iconSize, iconSize, 18);
      ctx.clip();
      ctx.drawImage(logoImg, iconX, iconY, iconSize, iconSize);
      ctx.restore();
    } catch {
      drawFallbackLogo(ctx, data, iconX, iconY, iconSize);
    }
  } else {
    drawFallbackLogo(ctx, data, iconX, iconY, iconSize);
  }

  ctx.fillStyle = dark ? "#FFFFFF" : "#0F172A";
  ctx.font = "600 34px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(storeName, pillX + (hasLogo ? 62 : 22), headerY + 24);
  ctx.restore();

  if (boxes) {
    boxes.push({
      id: "header",
      x: pillX,
      y: pillY,
      width: pillW,
      height: pillH,
    });
  }
}

function drawFallbackLogo(
  ctx: CanvasRenderingContext2D,
  data: ShareImageData,
  x: number,
  y: number,
  size: number
): void {
  ctx.fillStyle = data.primaryColor || "#0F172A";
  roundRect(ctx, x, y, size, size, 18);
  ctx.fill();

  ctx.fillStyle = getContrastColor(data.primaryColor || "#0F172A");
  ctx.font = "700 20px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const initial = (data.storeName || "D").charAt(0).toUpperCase();
  ctx.fillText(initial, x + size / 2, y + size / 2);
}

/**
 * 1. Estilo Etiqueta (`etiqueta`)
 * Foto a sangre o en vitrina y precio dentro de una etiqueta colgante dinámica.
 */
export function drawStyleEtiqueta(
  ctx: CanvasRenderingContext2D,
  data: ShareImageData,
  format: ShareImageFormat,
  options: DrawOptions = {}
): BoundingBox[] {
  const boxes: BoundingBox[] = [];
  const W = 1080;
  const dims = SHARE_IMAGE_SIZES[format];
  const H = dims.height;
  const isStory = format === "historia";
  const isPostIg = format === "post-ig";
  const isConsult = Boolean(data.isConsultPrice || !data.price || data.price <= 0);

  // Fondo cálido sutil de vitrina
  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(0, 0, W, H);

  // Escenario de la foto
  const stageX = isStory ? 40 : 36;
  const stageY = isStory ? 335 : 96;
  const stageW = isStory ? 1000 : 1008;
  const stageH = isStory ? 940 : (isPostIg ? 920 : 710);

  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, stageX, stageY, stageW, stageH, 36);
  ctx.fill();

  const imgW = options.productImage?.naturalWidth || options.productImage?.width || 1000;
  const imgH = options.productImage?.naturalHeight || options.productImage?.height || 1000;
  const photoBox = getContainedBox(imgW, imgH, stageX + 12, stageY + 12, stageW - 24, stageH - 24);

  if (options.productImage && typeof ctx.drawImage === "function") {
    try {
      ctx.drawImage(options.productImage, photoBox.x, photoBox.y, photoBox.width, photoBox.height);
    } catch {
      // Dibujo en Vitest o fallback
    }
  }

  boxes.push({
    id: "photo",
    x: photoBox.x,
    y: photoBox.y,
    width: photoBox.width,
    height: photoBox.height,
  });

  // Cabecera de la tienda
  drawStoreHeader(ctx, data, format, false, boxes, options.storeLogoImage);

  // Etiqueta de precio colgante calculada dinámicamente
  ctx.save();
  const priceStr = getPriceDisplay(data);
  const priceFontPx = isConsult ? (isStory ? 76 : isPostIg ? 72 : 68) : (isStory ? 96 : isPostIg ? 90 : 88);
  ctx.font = `800 ${priceFontPx}px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`;
  const measuredPrice = ctx.measureText(priceStr).width;

  ctx.font = "700 32px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
  const saleStr = !isConsult && data.isOnSale && data.discountPct ? `-${data.discountPct}% DCTO` : "";
  const measuredSale = saleStr ? ctx.measureText(saleStr).width : 0;

  const ojalSpace = 64;
  const rightPadding = 32;
  const maxContentW = Math.max(measuredPrice, measuredSale);
  const tagW = Math.max(300, Math.ceil(maxContentW + ojalSpace + rightPadding));
  const hasSale = !isConsult && Boolean(data.isOnSale);
  const tagH = hasSale ? (isStory ? 180 : 160) : (isStory ? 140 : 120);
  const tagX = Math.max(48, W - tagW - 48);
  // En cuadrada, post-ig e historia, la etiqueta se ubica en la esquina inferior del escenario para no tapar el producto
  const tagY = stageY + stageH - tagH - (isStory ? 20 : 12);

  // Cordón
  ctx.strokeStyle = "#94A3B8";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(tagX + 32, tagY + tagH / 2);
  ctx.quadraticCurveTo(tagX + 16, tagY - 24, tagX - 10, tagY - 12);
  ctx.stroke();

  // Cuerpo de la etiqueta
  ctx.fillStyle = data.primaryColor || "#0F172A";
  roundRect(ctx, tagX, tagY, tagW, tagH, 24);
  ctx.fill();

  // Ojal
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(tagX + 32, tagY + tagH / 2, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#CBD5E1";
  ctx.stroke();

  const textColor = getContrastColor(data.primaryColor || "#0F172A");
  ctx.fillStyle = textColor;
  ctx.textAlign = "right";

  if (hasSale) {
    ctx.font = "700 28px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
    ctx.fillText(saleStr, tagX + tagW - rightPadding, tagY + (isStory ? 44 : 38));

    ctx.font = `800 ${isStory ? 88 : 80}px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`;
    ctx.fillText(priceStr, tagX + tagW - rightPadding, tagY + (isStory ? 138 : 124));
  } else {
    ctx.font = `800 ${priceFontPx}px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`;
    ctx.fillText(priceStr, tagX + tagW - rightPadding, tagY + (isStory ? (isConsult ? 92 : 102) : (isConsult ? 82 : 90)));
  }
  ctx.restore();

  boxes.push({
    id: "tag",
    x: tagX,
    y: tagY,
    width: tagW,
    height: tagH,
  });

  boxes.push({
    id: "priceInTag",
    x: tagX + tagW - rightPadding - maxContentW,
    y: tagY + 10,
    width: maxContentW,
    height: tagH - 20,
  });

  // Pie de producto y QR
  const footerY = isStory ? 1300 : (isPostIg ? 1040 : 820);
  const footerH = isStory ? 260 : (isPostIg ? 240 : 216);
  const qrSize = 144;
  const qrX = W - qrSize - 60;
  const qrY = footerY + (isStory ? 20 : 14);

  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, 40, footerY, 1000, footerH, 28);
  ctx.fill();

  // QR
  drawQrBlock(ctx, qrX, qrY, qrSize, options.qrImage);
  boxes.push({ id: "qr", x: qrX, y: qrY, width: qrSize, height: qrSize });

  // Textos del footer
  ctx.fillStyle = "#0F172A";
  const titleFontPx = isStory ? 56 : (isPostIg ? 50 : 46);
  ctx.font = `700 ${titleFontPx}px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const titleLines = wrapText(ctx, data.productName, qrX - 80, 2);
  ctx.fillText(titleLines[0] || data.productName, 76, footerY + (isStory ? 28 : 20));

  boxes.push({
    id: "title",
    x: 76,
    y: footerY + (isStory ? 28 : 20),
    width: qrX - 80,
    height: titleFontPx,
  });

  if (!isConsult && data.isOnSale && data.originalPrice) {
    ctx.font = "600 36px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#94A3B8";
    const origStr = `Antes ${formatCurrency(data.originalPrice)}`;
    ctx.fillText(origStr, 76, footerY + 102);

    const origW = ctx.measureText(origStr).width;
    ctx.strokeStyle = "#DC2626";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(76, footerY + 122);
    ctx.lineTo(76 + origW, footerY + 122);
    ctx.stroke();

    boxes.push({
      id: "origPrice",
      x: 76,
      y: footerY + 102,
      width: origW,
      height: 40,
    });
  }

  // Sello Semilla en zona segura
  drawSemillaBadgeSafe(ctx, data, format, boxes);

  return boxes;
}

/**
 * 2. Estilo Editorial (`editorial`)
 * Fondo de marca sofisticado con tipografía amplia y marco blanco elegante.
 */
export function drawStyleEditorial(
  ctx: CanvasRenderingContext2D,
  data: ShareImageData,
  format: ShareImageFormat,
  options: DrawOptions = {}
): BoundingBox[] {
  const boxes: BoundingBox[] = [];
  const W = 1080;
  const dims = SHARE_IMAGE_SIZES[format];
  const H = dims.height;
  const isStory = format === "historia";
  const isPostIg = format === "post-ig";
  const isConsult = Boolean(data.isConsultPrice || !data.price || data.price <= 0);

  // Fondo marfil editorial elegante
  ctx.fillStyle = "#FAF8F5";
  ctx.fillRect(0, 0, W, H);

  // Fina línea de marco editorial
  ctx.strokeStyle = "rgba(15, 23, 42, 0.12)";
  ctx.lineWidth = 1.5;
  if (typeof ctx.strokeRect === "function") {
    ctx.strokeRect(28, 28, W - 56, H - 56);
  }

  // Cabecera aislada (Y = 268 en Historia, Y = 44 en Post-IG y Cuadrada)
  const headerY = isStory ? 268 : 44;
  ctx.save();
  ctx.fillStyle = "#0F172A";
  ctx.font = "900 28px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(data.storeName.toUpperCase(), 48, headerY);
  ctx.restore();

  boxes.push({ id: "header", x: 48, y: headerY - 18, width: 400, height: 36 });

  // Foto inmersiva
  const photoTop = headerY + 36;
  const photoBottom = isStory ? 1230 : (isPostIg ? 890 : 660);
  const photoH = photoBottom - photoTop;
  const photoW = W - 96;

  const imgW = options.productImage?.naturalWidth || options.productImage?.width || 1000;
  const imgH = options.productImage?.naturalHeight || options.productImage?.height || 1000;
  const photoBox = getContainedBox(imgW, imgH, 48, photoTop, photoW, photoH);

  // Sombra arquitectónica editorial en color de marca
  ctx.fillStyle = data.primaryColor || "#0F172A";
  ctx.fillRect(photoBox.x + 12, photoBox.y + 12, photoBox.width, photoBox.height);

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(photoBox.x, photoBox.y, photoBox.width, photoBox.height);

  if (options.productImage && typeof ctx.drawImage === "function") {
    try {
      ctx.drawImage(options.productImage, photoBox.x, photoBox.y, photoBox.width, photoBox.height);
    } catch {
      // Vitest fallback
    }
  }

  boxes.push({
    id: "photo",
    x: photoBox.x,
    y: photoBox.y,
    width: photoBox.width,
    height: photoBox.height,
  });

  // Línea divisoria
  ctx.fillStyle = "#0F172A";
  ctx.fillRect(48, photoBottom + 16, W - 96, 2);

  // Pie editorial distribuido verticalmente
  const qrSize = 144;
  const qrX = W - 48 - qrSize;
  const qrY = photoBottom + 32;

  drawQrBlock(ctx, qrX, qrY, qrSize, options.qrImage);
  boxes.push({ id: "qr", x: qrX, y: qrY, width: qrSize, height: qrSize });

  // Nombre del producto en elegante serif Playfair Display
  const textMaxW = qrX - 48 - 32;
  const titleFontPx = isStory ? 56 : (isPostIg ? 50 : 46);
  const titleLineHeight = isStory ? 62 : (isPostIg ? 56 : 52);
  ctx.fillStyle = "#0F172A";
  ctx.font = `700 ${titleFontPx}px 'Playfair Display', Georgia, serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const lines = wrapText(ctx, data.productName, textMaxW, 2);
  const titleStartY = photoBottom + 24;
  lines.forEach((line, idx) => {
    ctx.fillText(line, 48, titleStartY + idx * titleLineHeight);
  });
  const titleTotalH = lines.length * titleLineHeight;

  boxes.push({
    id: "title",
    x: 48,
    y: titleStartY,
    width: textMaxW,
    height: titleTotalH,
  });

  // Precio anterior tachado si hay oferta (solo si no es A consultar)
  if (!isConsult && data.isOnSale && data.originalPrice) {
    ctx.fillStyle = "#1E293B"; // Slate 800: alto contraste sobre marfil #FAF8F5 (>12:1)
    ctx.font = "700 32px 'Playfair Display', Georgia, serif";
    ctx.textBaseline = "top";
    const origText = `Antes ${formatCurrency(data.originalPrice)}`;
    const origY = isStory ? 1400 : (isPostIg ? 1038 : 798);
    ctx.fillText(origText, 48, origY);
    const ow = ctx.measureText(origText).width;
    ctx.strokeStyle = "#DC2626";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(48, origY + 16);
    ctx.lineTo(48 + ow, origY + 16);
    ctx.stroke();

    boxes.push({ id: "origPrice", x: 48, y: origY, width: ow, height: 34 });
  }

  // Precio final display en Playfair Display Italic
  const priceStr = getPriceDisplay(data);
  const priceFontPx = isConsult ? (isStory ? 84 : 76) : (isStory ? 104 : (isPostIg ? 100 : 96));
  const priceY = isStory ? 1565 : (isPostIg ? 1220 : 965);
  ctx.fillStyle = data.primaryColor || "#0F172A";
  ctx.font = `italic 700 ${priceFontPx}px 'Playfair Display', Georgia, serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText(priceStr, 48, priceY);

  const pw = ctx.measureText(priceStr).width;
  boxes.push({
    id: "price",
    x: 48,
    y: priceY - priceFontPx,
    width: pw,
    height: priceFontPx,
  });

  // Sello Semilla en zona segura
  drawSemillaBadgeSafe(ctx, data, format, boxes);

  return boxes;
}

/**
 * 3. Estilo Marco de color (`marco-color`)
 * Identidad vibrante con marco periférico y cabecera en franja dedicada.
 */
export function drawStyleMarcoColor(
  ctx: CanvasRenderingContext2D,
  data: ShareImageData,
  format: ShareImageFormat,
  options: DrawOptions = {}
): BoundingBox[] {
  const boxes: BoundingBox[] = [];
  const W = 1080;
  const dims = SHARE_IMAGE_SIZES[format];
  const H = dims.height;
  const isStory = format === "historia";
  const isPostIg = format === "post-ig";
  const isConsult = Boolean(data.isConsultPrice || !data.price || data.price <= 0);

  // Fondo del marco de color
  ctx.fillStyle = data.primaryColor || "#0F172A";
  ctx.fillRect(0, 0, W, H);

  // Cabecera en franja aislada (Y = 265 en Historia, Y = 44 en Post-IG y Cuadrada)
  drawStoreHeader(ctx, data, format, true, boxes, options.storeLogoImage);

  // Marco y contenedor blanco para la foto (producto protagonista con mínimo espacio en blanco)
  const frameThick = isStory ? 36 : 24;
  const innerX = frameThick;
  const innerW = W - frameThick * 2;
  const stageY = isStory ? 353 : 96;
  const bottomBlockH = isStory ? 320 : (isPostIg ? 260 : 230);
  const bottomBlockY = isStory ? 1255 : (H - bottomBlockH - frameThick - (data.showBranding ? 55 : 12));
  const photoStageH = bottomBlockY - stageY - 10;

  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, innerX, stageY, innerW, photoStageH, isStory ? 32 : 24);
  ctx.fill();

  const imgW = options.productImage?.naturalWidth || options.productImage?.width || 1000;
  const imgH = options.productImage?.naturalHeight || options.productImage?.height || 1000;
  const photoBox = getContainedBox(imgW, imgH, innerX + 12, stageY + 12, innerW - 24, photoStageH - 24);

  if (options.productImage && typeof ctx.drawImage === "function") {
    try {
      ctx.drawImage(options.productImage, photoBox.x, photoBox.y, photoBox.width, photoBox.height);
    } catch {
      // Vitest fallback
    }
  }

  boxes.push({
    id: "photo",
    x: photoBox.x,
    y: photoBox.y,
    width: photoBox.width,
    height: photoBox.height,
  });

  // Bloque inferior sólido en alto contraste
  ctx.fillStyle = "#0F172A";
  roundRect(ctx, innerX, bottomBlockY, innerW, bottomBlockH, 24);
  ctx.fill();

  const qrSize = 136;
  const qrX = W - frameThick - 26 - qrSize;
  const qrY = bottomBlockY + (bottomBlockH - qrSize) / 2 - 8;

  drawQrBlock(ctx, qrX, qrY, qrSize, options.qrImage);
  boxes.push({ id: "qr", x: qrX, y: qrY, width: qrSize, height: qrSize });

  // Título
  const textW = qrX - innerX - 36;
  const titleFontPx = isStory ? 56 : (isPostIg ? 50 : 46);
  const titleLineHeight = isStory ? 64 : (isPostIg ? 56 : 52);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 ${titleFontPx}px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const lines = wrapText(ctx, data.productName, textW, 2);
  lines.forEach((line, idx) => {
    ctx.fillText(line, innerX + 26, bottomBlockY + 18 + idx * titleLineHeight);
  });
  const titleTotalH = lines.length * titleLineHeight;

  boxes.push({
    id: "title",
    x: innerX + 26,
    y: bottomBlockY + 18,
    width: textW,
    height: titleTotalH,
  });

  // Precio final y antes
  const priceStr = getPriceDisplay(data);
  const priceFontPx = isConsult ? (isStory ? 84 : 76) : (isStory ? 104 : (isPostIg ? 100 : 96));
  const priceY = bottomBlockY + bottomBlockH - 16;
  ctx.font = `800 ${priceFontPx}px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = "#FACC15"; // Acento amarillo brillante sobre bloque oscuro
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText(priceStr, innerX + 26, priceY);

  const pw = ctx.measureText(priceStr).width;
  boxes.push({
    id: "price",
    x: innerX + 26,
    y: priceY - priceFontPx,
    width: pw,
    height: priceFontPx,
  });

  if (!isConsult && data.isOnSale && data.originalPrice) {
    const origStr = `Antes ${formatCurrency(data.originalPrice)}`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.font = "800 24px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
    const origX = innerX + 26 + pw + 20;
    const origY = priceY - 14;
    ctx.fillText(origStr, origX, origY);

    const ow = ctx.measureText(origStr).width;
    ctx.strokeStyle = "#EF4444";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(origX, origY - 10);
    ctx.lineTo(origX + ow, origY - 10);
    ctx.stroke();

    boxes.push({ id: "origPrice", x: origX, y: origY - 24, width: ow, height: 24 });
  }

  // Sello Semilla en zona segura
  drawSemillaBadgeSafe(ctx, data, format, boxes);

  return boxes;
}

/**
 * 4. Estilo Oferta (`oferta`)
 * Impacto comercial de liquidación con flujo secuencial descendente libre de colisiones.
 */
export function drawStyleOferta(
  ctx: CanvasRenderingContext2D,
  data: ShareImageData,
  format: ShareImageFormat,
  options: DrawOptions = {}
): BoundingBox[] {
  const boxes: BoundingBox[] = [];
  const W = 1080;
  const dims = SHARE_IMAGE_SIZES[format];
  const H = dims.height;
  const isStory = format === "historia";
  const isPostIg = format === "post-ig";
  const isConsult = Boolean(data.isConsultPrice || !data.price || data.price <= 0);

  // Fondo gris suave comercial
  ctx.fillStyle = "#F1F5F9";
  ctx.fillRect(0, 0, W, H);

  // Gran cabecera de oferta en color de la tienda
  const bannerH = isStory ? 350 : 200;
  ctx.fillStyle = data.primaryColor || "#0F172A";
  ctx.fillRect(0, 0, W, bannerH);

  // Cabecera aislada (Y = 265 en Historia, Y = 34 en Post-IG y Cuadrada)
  const headerY = isStory ? 265 : 34;
  drawStoreHeader(ctx, data, format, true, boxes, options.storeLogoImage);

  // Badge "-X% DCTO" (solo si no es A consultar y tiene oferta)
  if (!isConsult && data.isOnSale && data.discountPct) {
    const badgeW = 240;
    const badgeH = 60;
    const badgeX = W - badgeW - 44;
    const badgeY = headerY - 6;

    ctx.fillStyle = "#0F172A";
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 30);
    ctx.fill();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 32px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`-${data.discountPct}% DCTO`, badgeX + badgeW / 2, badgeY + badgeH / 2);

    boxes.push({
      id: "saleBadge",
      x: badgeX,
      y: badgeY,
      width: badgeW,
      height: badgeH,
    });
  }

  // Tarjeta inferior de precios y llamado a la acción
  const footerCardH = isStory ? 320 : (isPostIg ? 260 : 280);
  const footerCardY = isStory ? 1250 : (H - footerCardH - (data.showBranding ? (isPostIg ? 65 : 55) : 20));
  const photoTop = isStory ? headerY + 74 : 100;
  const photoH = footerCardY - photoTop - 14;
  const photoW = W - 88;

  // Vitrina blanca del producto
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, 44, photoTop, photoW, photoH, 24);
  ctx.fill();

  const imgW = options.productImage?.naturalWidth || options.productImage?.width || 1000;
  const imgH = options.productImage?.naturalHeight || options.productImage?.height || 1000;
  const photoBox = getContainedBox(imgW, imgH, 64, photoTop + 18, photoW - 40, photoH - 36);

  if (options.productImage && typeof ctx.drawImage === "function") {
    try {
      ctx.drawImage(options.productImage, photoBox.x, photoBox.y, photoBox.width, photoBox.height);
    } catch {
      // Vitest fallback
    }
  }

  boxes.push({
    id: "photo",
    x: photoBox.x,
    y: photoBox.y,
    width: photoBox.width,
    height: photoBox.height,
  });

  // Cucarda flotante "AHORRAS S/ ..." (solo si no es A consultar)
  if (!isConsult && data.isOnSale && data.originalPrice && data.originalPrice > data.price) {
    const saved = data.originalPrice - data.price;
    const saveText = `AHORRAS ${formatCurrency(saved)}`;
    ctx.font = "800 24px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
    const saveW = ctx.measureText(saveText).width + 36;
    const saveH = 48;
    const saveX = 44 + photoW - saveW - 18;
    const saveY = photoTop + photoH - saveH - 18;

    ctx.fillStyle = "#16A34A";
    roundRect(ctx, saveX, saveY, saveW, saveH, 24);
    ctx.fill();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(saveText, saveX + saveW / 2, saveY + saveH / 2);

    boxes.push({
      id: "saveBadge",
      x: saveX,
      y: saveY,
      width: saveW,
      height: saveH,
    });
  }

  // Tarjeta inferior de precios
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, 44, footerCardY, photoW, footerCardH, 24);
  ctx.fill();

  const qrSize = 140;
  const qrX = 44 + photoW - qrSize - 24;
  const qrY = footerCardY + (footerCardH - qrSize) / 2 - 8;

  drawQrBlock(ctx, qrX, qrY, qrSize, options.qrImage);
  boxes.push({ id: "qr", x: qrX, y: qrY, width: qrSize, height: qrSize });

  // Flujo secuencial: Nombre -> Antes S/ ... -> Precio final
  const textMaxW = qrX - 44 - 36;
  const titleFontPx = isStory ? 52 : 44;
  const titleLineHeight = isStory ? 58 : 50;
  ctx.fillStyle = "#0F172A";
  ctx.font = `700 ${titleFontPx}px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const lines = wrapText(ctx, data.productName, textMaxW, 2);
  const titleY = footerCardY + 22;
  lines.forEach((line, idx) => {
    ctx.fillText(line, 68, titleY + idx * titleLineHeight);
  });
  const titleTotalH = lines.length * titleLineHeight;

  boxes.push({
    id: "title",
    x: 68,
    y: titleY,
    width: textMaxW,
    height: titleTotalH,
  });

  let currentY = titleY + titleTotalH + 8;

  if (!isConsult && data.isOnSale && data.originalPrice) {
    ctx.font = "700 28px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#DC2626";
    const origStr = `Antes ${formatCurrency(data.originalPrice)}`;
    ctx.fillText(origStr, 68, currentY);

    const origW = ctx.measureText(origStr).width;
    ctx.strokeStyle = "#DC2626";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(68, currentY + 14);
    ctx.lineTo(68 + origW, currentY + 14);
    ctx.stroke();

    boxes.push({
      id: "origPrice",
      x: 68,
      y: currentY,
      width: origW,
      height: 28,
    });

    currentY += 36;
  }

  // Precio display final
  const priceStr = getPriceDisplay(data);
  const priceFontPx = isConsult ? (isStory ? 76 : 68) : (isStory ? 96 : 84);
  ctx.font = `800 ${priceFontPx}px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = "#0F172A";
  ctx.fillText(priceStr, 68, currentY);

  const priceW = ctx.measureText(priceStr).width;
  boxes.push({
    id: "price",
    x: 68,
    y: currentY,
    width: priceW,
    height: priceFontPx,
  });

  // Sello Semilla en zona segura
  drawSemillaBadgeSafe(ctx, data, format, boxes);

  return boxes;
}

/**
 * Dibuja el bloque del código QR con texto auxiliar "Escanea y pide".
 */
function drawQrBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  qrImg?: any
): void {
  ctx.save();
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, x - 8, y - 8, size + 16, size + 16, 16);
  ctx.fill();

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(15, 23, 42, 0.08)";
  ctx.stroke();

  if (qrImg && typeof ctx.drawImage === "function") {
    try {
      ctx.drawImage(qrImg, x, y, size, size);
    } catch {
      drawMockQrPattern(ctx, x, y, size);
    }
  } else {
    drawMockQrPattern(ctx, x, y, size);
  }

  ctx.fillStyle = "#64748B";
  ctx.font = "700 18px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("Escanea y pide", x + size / 2, y + size + 12);
  ctx.restore();
}

function drawMockQrPattern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
  ctx.fillStyle = "#0F172A";
  const blockSize = Math.round(size / 6);
  ctx.fillRect(x, y, blockSize * 2, blockSize * 2);
  ctx.fillRect(x + size - blockSize * 2, y, blockSize * 2, blockSize * 2);
  ctx.fillRect(x, y + size - blockSize * 2, blockSize * 2, blockSize * 2);
}

/**
 * Renderizador central para cualquiera de los 4 estilos aprobados.
 */
export function drawShareImage(
  ctx: CanvasRenderingContext2D,
  data: ShareImageData,
  style: ShareImageStyle,
  format: ShareImageFormat,
  options: DrawOptions = {}
): DrawResult {
  const dims = SHARE_IMAGE_SIZES[format];
  if (ctx.canvas) {
    ctx.canvas.width = dims.width;
    ctx.canvas.height = dims.height;
  }

  let boxes: BoundingBox[] = [];

  switch (style) {
    case "etiqueta":
      boxes = drawStyleEtiqueta(ctx, data, format, options);
      break;
    case "editorial":
      boxes = drawStyleEditorial(ctx, data, format, options);
      break;
    case "marco-color":
      boxes = drawStyleMarcoColor(ctx, data, format, options);
      break;
    case "oferta":
      boxes = drawStyleOferta(ctx, data, format, options);
      break;
    default:
      boxes = drawStyleEtiqueta(ctx, data, format, options);
  }

  const validation = validateShareImageBoxes(boxes, format);

  return { boxes, validation };
}

/**
 * Validador geométrico de cajas delimitadoras (AABB) y zonas seguras.
 */
export function validateShareImageBoxes(
  boxes: BoundingBox[],
  format: ShareImageFormat
): ValidationResult {
  const collisions: string[] = [];
  const safeZoneViolations: string[] = [];
  const tagViolations: string[] = [];

  // Lista de elementos críticos que no deben colisionar entre sí
  const criticalBoxes = boxes.filter(
    (b) => b.id !== "photo" && b.id !== "tag" && b.id !== "priceInTag"
  );

  for (let i = 0; i < criticalBoxes.length; i++) {
    for (let j = i + 1; j < criticalBoxes.length; j++) {
      const b1 = criticalBoxes[i];
      const b2 = criticalBoxes[j];

      // Verificar si colisionan mediante AABB
      const collides =
        b1.x < b2.x + b2.width &&
        b1.x + b1.width > b2.x &&
        b1.y < b2.y + b2.height &&
        b1.y + b1.height > b2.y;

      if (collides) {
        collisions.push(`Colisión entre '${b1.id}' y '${b2.id}'`);
      }
    }
  }

  // Verificación de contención estricta en el estilo Etiqueta
  const tagBox = boxes.find((b) => b.id === "tag");
  const priceInTag = boxes.find((b) => b.id === "priceInTag");
  if (tagBox && priceInTag) {
    const isContained =
      priceInTag.x >= tagBox.x - 2 &&
      priceInTag.x + priceInTag.width <= tagBox.x + tagBox.width + 2 &&
      priceInTag.y >= tagBox.y - 2 &&
      priceInTag.y + priceInTag.height <= tagBox.y + tagBox.height + 2;

    if (!isContained) {
      tagViolations.push("El precio o 'S/' sobresale de la etiqueta");
    }
  }

  // Verificación de solapamiento: la etiqueta no debe tapar más del 15% del área de la foto
  const photoBox = boxes.find((b) => b.id === "photo");
  if (tagBox && photoBox) {
    const xOverlap = Math.max(
      0,
      Math.min(tagBox.x + tagBox.width, photoBox.x + photoBox.width) -
        Math.max(tagBox.x, photoBox.x)
    );
    const yOverlap = Math.max(
      0,
      Math.min(tagBox.y + tagBox.height, photoBox.y + photoBox.height) -
        Math.max(tagBox.y, photoBox.y)
    );
    const overlapArea = xOverlap * yOverlap;
    const photoArea = photoBox.width * photoBox.height;
    const overlapRatio = photoArea > 0 ? overlapArea / photoArea : 0;
    if (overlapRatio > 0.15) {
      tagViolations.push(
        `La etiqueta tapa el ${(overlapRatio * 100).toFixed(1)}% de la foto (máximo permitido: 15%)`
      );
    }
  }

  // Verificación de zonas seguras en formato Historia (0..250px y 1625..1920px)
  if (format === "historia") {
    for (const b of boxes) {
      if (b.id === "header") {
        if (b.y < 250) {
          safeZoneViolations.push(`Cabecera invade zona segura superior: y=${b.y} < 250`);
        }
      }
      if (b.id === "semillaBadge") {
        if (b.y + b.height > 1630) {
          safeZoneViolations.push(`Sello Semilla invade zona segura inferior: y=${b.y + b.height} > 1630`);
        }
        if (b.y < 1550) {
          safeZoneViolations.push(`Sello Semilla muy arriba: y=${b.y} < 1550`);
        }
      }
    }
  }

  const ok =
    collisions.length === 0 &&
    safeZoneViolations.length === 0 &&
    tagViolations.length === 0;

  return { ok, collisions, safeZoneViolations, tagViolations };
}
