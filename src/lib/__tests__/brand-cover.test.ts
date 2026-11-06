import { describe, it, expect } from "vitest";
import {
  shouldShowBrandCover,
  getDefaultTagline,
  getEffectiveTagline,
  shouldShowGridAd,
  shouldShowContactStripe,
  getBrandCoverStyles,
  getContrastRatio,
  hexToRgb,
} from "../brand-cover";
import { Store } from "../types";

describe("F45 · Portada de Marca y Escenarios (brand-cover.ts)", () => {
  // E1: Dado una tienda Semilla sin portada visible, entonces veo la portada de marca con su logo, nombre y eslogan
  it("E1: Tienda Semilla sin portada visible activa shouldShowBrandCover", () => {
    const storeSemillaSinBanners: Partial<Store> = {
      plan: "semilla",
      banners: [],
      bannerImage: null,
    };
    expect(shouldShowBrandCover(storeSemillaSinBanners as Store)).toBe(true);

    // Tienda Semilla que subió un banner_image pero el plan devuelve 0 banners permitidos
    const storeSemillaConBannerSubido: Partial<Store> = {
      plan: "semilla",
      banners: ["https://example.com/banner.webp"],
      bannerImage: "https://example.com/banner.webp",
    };
    expect(shouldShowBrandCover(storeSemillaConBannerSubido as Store)).toBe(true);
  });

  // E2: Dado una tienda sin eslogan y rubro ropa, entonces el eslogan es el texto de ese rubro
  it("E2: Tienda sin eslogan y rubro ropa asigna eslogan predeterminado del rubro", () => {
    const storeRopa: Partial<Store> = {
      niche: "ropa",
      bannerTagline: null,
    };
    expect(getEffectiveTagline(storeRopa)).toBe("Moda que te queda, directo a tu WhatsApp");

    const storeModa: Partial<Store> = {
      niche: "moda",
      bannerTagline: "",
    };
    expect(getEffectiveTagline(storeModa)).toBe("Moda que te queda, directo a tu WhatsApp");

    // Si la dueña ya tiene eslogan configurado, se respeta el suyo
    const storeConEslogan: Partial<Store> = {
      niche: "ropa",
      bannerTagline: "Mi marca propia de vestidos",
    };
    expect(getEffectiveTagline(storeConEslogan)).toBe("Mi marca propia de vestidos");

    // Rubro comida
    expect(getDefaultTagline("comida")).toBe("Hecho con cariño, listo para pedir");
    // Rubro tech
    expect(getDefaultTagline("tech")).toBe("Tecnología con garantía, a un mensaje");
    // Rubro bisutería / joyería
    expect(getDefaultTagline("bisuteria")).toBe("Detalles que brillan contigo");
  });

  // E4: Dado un color de marca muy claro (#ffffff) o muy oscuro (#000000), entonces el texto de la portada sigue legible (contraste AA)
  it("E4: Colores extremos (#ffffff o #000000) mantienen contraste AA >= 4.5:1", () => {
    // Caso 1: Blanco puro (#ffffff)
    const stylesBlanco = getBrandCoverStyles("#ffffff", "grid", false);
    expect(stylesBlanco.isLightBg).toBe(true);
    expect(stylesBlanco.textColor).toBe("#0f172a");

    const rgbBlanco = hexToRgb("#ffffff")!;
    const rgbTextoBlanco = hexToRgb(stylesBlanco.textColor)!;
    const contrastBlanco = getContrastRatio(rgbBlanco, rgbTextoBlanco);
    expect(contrastBlanco).toBeGreaterThanOrEqual(4.5); // Cumple WCAG AA

    // Caso 2: Negro puro (#000000)
    const stylesNegro = getBrandCoverStyles("#000000", "grid", true);
    expect(stylesNegro.isLightBg).toBe(false);
    expect(stylesNegro.textColor).toBe("#ffffff");

    const rgbNegro = hexToRgb("#000000")!;
    const rgbTextoNegro = hexToRgb(stylesNegro.textColor)!;
    const contrastNegro = getContrastRatio(rgbNegro, rgbTextoNegro);
    expect(contrastNegro).toBeGreaterThanOrEqual(4.5); // Cumple WCAG AA

    // Caso 3: Colores de tiendas reales (#ec4899, #b45309, #be185d, #0ea5e9)
    const stylesLuz = getBrandCoverStyles("#ec4899", "grid");
    const contrastLuz = getContrastRatio(hexToRgb("#ec4899")!, hexToRgb(stylesLuz.textColor)!);
    expect(contrastLuz).toBeGreaterThanOrEqual(3.0); // Contraste adecuado para encabezado grande
  });

  // E6: Dado una tienda Semilla con 1 producto, entonces no hay tarjeta de publicidad en la grilla y sí la franja de contacto y el pie de Dizi
  it("E6: Con 1 a 3 productos no hay publicidad en grilla y sí se activa la franja de contacto", () => {
    // 1 producto
    expect(shouldShowGridAd(1, "semilla")).toBe(false);
    expect(shouldShowContactStripe(1)).toBe(true);

    // 2 productos
    expect(shouldShowGridAd(2, "semilla")).toBe(false);
    expect(shouldShowContactStripe(2)).toBe(true);

    // 3 productos
    expect(shouldShowGridAd(3, "semilla")).toBe(false);
    expect(shouldShowContactStripe(3)).toBe(true);
  });

  // E7: Dado una tienda Semilla con 5 productos, entonces la publicidad sale en la grilla y no la franja de contacto
  it("E7: A partir de 4 productos la publicidad sale en la grilla y la franja de contacto no aplica", () => {
    // 4 productos
    expect(shouldShowGridAd(4, "semilla")).toBe(true);
    expect(shouldShowContactStripe(4)).toBe(false);

    // 5 productos
    expect(shouldShowGridAd(5, "semilla")).toBe(true);
    expect(shouldShowContactStripe(5)).toBe(false);

    // Si es mockup o plan pro, no sale publicidad en grilla
    expect(shouldShowGridAd(5, "semilla", true)).toBe(false);
    expect(shouldShowGridAd(5, "pro")).toBe(false);
  });

  it("TIENDAS_CON_ESTILO_ANTERIOR (emessentials, jhoselynperu, onfeet, aura-botanicals) no muestran BrandCover", () => {
    expect(shouldShowBrandCover({ slug: "emessentials", plan: "semilla" } as Store)).toBe(false);
    expect(shouldShowBrandCover({ slug: "jhoselynperu", plan: "semilla" } as Store)).toBe(false);
    expect(shouldShowBrandCover({ slug: "onfeet", plan: "semilla" } as Store)).toBe(false);
    expect(shouldShowBrandCover({ slug: "aura-botanicals", plan: "semilla" } as Store)).toBe(false);
  });
});
