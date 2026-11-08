/**
 * @file share-image.test.ts
 * @description Pruebas unitarias de Vitest para el generador de imágenes de estados e historias (F46).
 * Valida sobre el código real:
 * - E2: Descuento y oferta con discount.ts
 * - E3: Producto sin oferta
 * - E4: Sello "Hecho con Dizi · dizi.idenza.site" solo en Semilla
 * - E5: URL corta con ?p=
 * - E7: Ajuste de fotos vertical, cuadrada y horizontal sin deformar
 * - Validación geométrica de cajas delimitadoras (0 colisiones, zonas seguras y contención)
 */

import { describe, it, expect } from "vitest";
import { prepareShareImageData } from "../data";
import {
  drawShareImage,
  formatCurrency,
  getContrastColor,
  getContainedBox,
  validateShareImageBoxes,
} from "../styles";
import type { ShareImageData, ShareImageFormat, ShareImageStyle } from "../types";
import type { Product, Store } from "@/lib/types";

// Mock representativo de CanvasRenderingContext2D para entorno Node de Vitest
function createMockCanvasContext() {
  const currentFont = "16px sans-serif";
  return {
    canvas: { width: 1080, height: 1920 },
    font: currentFont,
    fillStyle: "#000000",
    strokeStyle: "#000000",
    lineWidth: 1,
    textAlign: "left",
    textBaseline: "alphabetic",
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    quadraticCurveTo: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    clip: () => {},
    drawImage: () => {},
    fillText: () => {},
    measureText: (text: string) => {
      // Estimación fiel para fuentes sans-serif / Plus Jakarta Sans
      const match = (currentFont || "").match(/(\d+)px/);
      const fontSize = match ? parseInt(match[1], 10) : 32;
      return {
        width: Math.round(text.length * fontSize * 0.56),
      };
    },
  } as unknown as CanvasRenderingContext2D;
}

const mockStoreSemilla: Store = {
  id: "store_semilla_1",
  ownerId: "user_1",
  name: "Zapatillas Urbanas",
  slug: "zapatillas-urbanas",
  phone: "51987654321",
  countryCode: "pe",
  model: "minimalista",
  plan: "semilla",
  brandColor: "#0F172A",
  showDiziBranding: true,
  active: true,
  isPublished: true,
  createdAt: "2026-01-01T00:00:00Z",
  categories: [],
  products: [],
  whatsappClicks: 0,
};

const mockStorePro: Store = {
  ...mockStoreSemilla,
  id: "store_pro_1",
  name: "Áurea Joyas",
  slug: "aurea-joyas",
  plan: "pro",
  brandColor: "#FACC15",
  showDiziBranding: false,
};

const mockProductOferta: Product = {
  id: "prod_zapas_1",
  name: "Vans Old Skool Classic Black",
  price: 89.9,
  originalPrice: 129.9,
  isOnSale: true,
  categoryId: "cat_1",
  image: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/zapas1.webp",
  visible: true,
};

const mockProductSinOferta: Product = {
  id: "prod_zapas_2",
  name: "Nike Air Force 1 '07",
  price: 399.0,
  originalPrice: null,
  isOnSale: false,
  categoryId: "cat_1",
  image: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/zapas2.webp",
  visible: true,
};

describe("F46 · Lógica de datos de imagen para estados (data.ts)", () => {
  it("E2: Producto en oferta calcula porcentaje de ahorro real con discount.ts (S/ 129.90 -> S/ 89.90)", () => {
    const data = prepareShareImageData({
      product: mockProductOferta,
      store: mockStoreSemilla,
    });

    expect(data.isOnSale).toBe(true);
    expect(data.price).toBe(89.9);
    expect(data.originalPrice).toBe(129.9);
    expect(data.discountPct).toBe(30); // Math.floor((40 / 129.9) * 100) = 30%
  });

  it("E3: Producto sin oferta no muestra precio tachado ni etiqueta de descuento", () => {
    const data = prepareShareImageData({
      product: mockProductSinOferta,
      store: mockStoreSemilla,
    });

    expect(data.isOnSale).toBe(false);
    expect(data.originalPrice).toBeNull();
    expect(data.discountPct).toBeNull();
    expect(data.price).toBe(399.0);
  });

  it("E4: Tienda Semilla incluye sello oficial 'Hecho con Dizi · dizi.idenza.site'; tienda Pro no lo incluye", () => {
    const dataSemilla = prepareShareImageData({
      product: mockProductSinOferta,
      store: mockStoreSemilla,
    });
    expect(dataSemilla.showBranding).toBe(true);
    expect(dataSemilla.brandingText).toBe("Hecho con Dizi · dizi.idenza.site");
    expect(dataSemilla.brandingText).not.toContain("dizi.pe");

    const dataPro = prepareShareImageData({
      product: mockProductSinOferta,
      store: mockStorePro,
    });
    expect(dataPro.showBranding).toBe(false);

    const storeIlimitado: Store = {
      ...mockStorePro,
      plan: "ilimitado",
    };
    const dataIlimitado = prepareShareImageData({
      product: mockProductSinOferta,
      store: storeIlimitado,
    });
    expect(dataIlimitado.showBranding).toBe(false);
  });

  it("E5: Genera URL corta con ?p=<id> para abrir directamente el producto en el catálogo", () => {
    const data = prepareShareImageData({
      product: mockProductOferta,
      store: mockStoreSemilla,
      baseUrl: "https://dizi.idenza.site",
    });

    expect(data.catalogProductUrl).toBe(
      "https://dizi.idenza.site/t/zapatillas-urbanas?p=prod_zapas_1"
    );
  });

  it("Obtiene la foto original en alta resolución despojando el sufijo _thumb.webp", () => {
    const productWithThumb: Product = {
      ...mockProductSinOferta,
      image:
        "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/zapas2_thumb.webp",
    };
    const data = prepareShareImageData({
      product: productWithThumb,
      store: mockStoreSemilla,
    });

    expect(data.productImageUrl).not.toContain("_thumb.webp");
    expect(data.productImageUrl).toContain("zapas2.webp");
  });
});

describe("F46 · Ajuste de foto y reglas de contraste (styles.ts)", () => {
  it("E7: Fotos vertical, cuadrada y horizontal se encajan completas sin deformar (contain)", () => {
    const boxW = 1000;
    const boxH = 1200;

    // Foto vertical (1000x1500, ratio 0.66)
    const vert = getContainedBox(1000, 1500, 40, 300, boxW, boxH);
    expect(vert.height).toBe(boxH);
    expect(vert.width).toBe(Math.round(boxH * (1000 / 1500)));
    expect(vert.width / vert.height).toBeCloseTo(1000 / 1500, 2);

    // Foto cuadrada (800x800, ratio 1.0)
    const cuad = getContainedBox(800, 800, 40, 300, boxW, boxH);
    expect(cuad.width).toBe(boxW);
    expect(cuad.height).toBe(boxW);

    // Foto horizontal (1200x800, ratio 1.5)
    const horiz = getContainedBox(1200, 800, 40, 300, boxW, boxH);
    expect(horiz.width).toBe(boxW);
    expect(horiz.height).toBe(Math.round(boxW / 1.5));
    expect(horiz.width / horiz.height).toBeCloseTo(1200 / 800, 2);
  });

  it("Calcula contraste YIQ perfecto para colores difíciles (amarillo, negro y pastel)", () => {
    expect(getContrastColor("#FACC15")).toBe("#0F172A"); // Amarillo vibrante -> texto oscuro
    expect(getContrastColor("#111111")).toBe("#FFFFFF"); // Negro profundo -> texto blanco
    expect(getContrastColor("#FFFFFF")).toBe("#0F172A"); // Blanco -> texto oscuro
    expect(getContrastColor("#C06B72")).toBe("#FFFFFF"); // Rosa pastel medio -> texto blanco
  });

  it("Formatea precios en soles peruanos con 2 decimales", () => {
    expect(formatCurrency(89.9)).toBe("S/ 89.90");
    expect(formatCurrency(399)).toBe("S/ 399.00");
  });
});

describe("F46 · Validación automática de cajas delimitadoras y zonas seguras (validador integrado)", () => {
  const styles: ShareImageStyle[] = ["etiqueta", "editorial", "marco-color", "oferta"];
  const formats: ShareImageFormat[] = ["historia", "cuadrada"];

  styles.forEach((style) => {
    formats.forEach((format) => {
      it(`Estilo '${style}' en formato '${format}': CERO colisiones y zonas seguras respetadas`, () => {
        const ctx = createMockCanvasContext();
        const data = prepareShareImageData({
          product: mockProductOferta,
          store: mockStoreSemilla,
        });

        const { boxes, validation } = drawShareImage(ctx, data, style, format);

        expect(boxes.length).toBeGreaterThan(3);
        expect(validation.collisions).toEqual([]);
        expect(validation.safeZoneViolations).toEqual([]);
        expect(validation.tagViolations).toEqual([]);
        expect(validation.ok).toBe(true);
      });
    });
  });

  it("Detecta colisiones artificiales cuando dos cajas se solapan", () => {
    const invalidBoxes = [
      { id: "title", x: 60, y: 300, width: 300, height: 60 },
      { id: "price", x: 100, y: 320, width: 200, height: 80 },
    ];
    const res = validateShareImageBoxes(invalidBoxes, "historia");
    expect(res.ok).toBe(false);
    expect(res.collisions.length).toBe(1);
    expect(res.collisions[0]).toContain("Colisión entre 'title' y 'price'");
  });

  it("Detecta violación de zona segura si la cabecera se ubica por encima de 250px en Historia", () => {
    const invalidBoxes = [
      { id: "header", x: 60, y: 220, width: 250, height: 60 }, // < 250px
    ];
    const res = validateShareImageBoxes(invalidBoxes, "historia");
    expect(res.ok).toBe(false);
    expect(res.safeZoneViolations.length).toBe(1);
    expect(res.safeZoneViolations[0]).toContain("Cabecera invade zona segura");
  });

  it("Detecta cuando la etiqueta tapa más del 15% del área de la foto", () => {
    const photoBox = { id: "photo", x: 100, y: 100, width: 500, height: 500 }; // Área: 250,000
    // Etiqueta que cubre 300x200 = 60,000 (24% del área de la foto)
    const tagBox = { id: "tag", x: 200, y: 200, width: 300, height: 200 };
    const res = validateShareImageBoxes([photoBox, tagBox], "cuadrada");
    expect(res.ok).toBe(false);
    expect(res.tagViolations.some((v) => v.includes("tapa el"))).toBe(true);
  });

  it("Permite cuando la etiqueta solo tapa una esquina pequeña de la foto (<= 15%)", () => {
    const photoBox = { id: "photo", x: 40, y: 100, width: 1000, height: 700 }; // Área: 700,000
    // Etiqueta en esquina inferior derecha que solapa 200x100 = 20,000 (2.8%)
    const tagBox = { id: "tag", x: 800, y: 700, width: 250, height: 120 };
    const res = validateShareImageBoxes([photoBox, tagBox], "cuadrada");
    expect(res.tagViolations).toEqual([]);
  });
});
