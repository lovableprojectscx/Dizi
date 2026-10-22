import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  TIENDAS_CON_ESTILO_ANTERIOR,
  DESIGN_SPECS,
  DESIGN_STRUCTURES,
  ALL_MODELS,
  OfficialDesignId,
  resolveStructureId,
} from "@/lib/design-catalog";
import { PublicCatalog } from "@/components/public/PublicCatalog";
import type { Store } from "@/lib/types";

function makeTestStore(overrides: Partial<Store>): Store {
  return {
    id: "store_test_restaurar",
    slug: "tienda-test",
    name: "Tienda Test",
    phone: "51999999999",
    model: "nature",
    plan: "pro",
    active: true,
    isPublished: true,
    brandColor: "#059669",
    bgColor: "#fafaf7",
    textColor: "#1e293b",
    cardBg: "#ffffff",
    accentColor: "#10b981",
    borderRadius: "16px",
    imgShape: "rounded",
    isDark: false,
    categories: [
      { id: "cat_1", name: "Cuidado Facial", visible: true, productCount: 2 },
    ],
    products: [
      {
        id: "prod_1",
        name: "Serum Hidratante",
        price: 89,
        originalPrice: 110,
        categoryId: "cat_1",
        visible: true,
        image: "https://example.com/serum.webp",
        description: "Fórmula botánica concentrada",
        isOnSale: true,
      },
      {
        id: "prod_2",
        name: "Crema Reparadora",
        price: 95,
        categoryId: "cat_1",
        visible: true,
        image: "https://example.com/crema.webp",
        description: "Nutrición intensa diaria",
      },
    ],
    bannerImage: "https://example.com/banner.webp",
    ...overrides,
  } as Store;
}

describe("Encargo — Restaurar Tiendas N3a, Diagonal al Selector y Regla AGENTS.md", () => {
  describe("1. Lista de tiendas con estilo anterior (TIENDAS_CON_ESTILO_ANTERIOR)", () => {
    it("contiene exactamente las 4 tiendas preexistentes identificadas", () => {
      expect(TIENDAS_CON_ESTILO_ANTERIOR.size).toBe(4);
      expect(TIENDAS_CON_ESTILO_ANTERIOR.has("jhoselynperu")).toBe(true);
      expect(TIENDAS_CON_ESTILO_ANTERIOR.has("onfeet")).toBe(true);
      expect(TIENDAS_CON_ESTILO_ANTERIOR.has("aura-botanicals")).toBe(true);
      expect(TIENDAS_CON_ESTILO_ANTERIOR.has("emessentials")).toBe(true);
    });
  });

  describe("2. Comportamiento de las 4 tiendas de la lista (idéntico a a72f797)", () => {
    it("jhoselynperu: conserva tipografía 'modern' y tarjeta 'flat' (no sobreescritas por estiloFijo)", () => {
      const store = makeTestStore({
        slug: "jhoselynperu",
        name: "Jhoselyn Joyería",
        model: "nature",
        catalogTypography: "modern",
        cardStyle: "flat",
        bannerTitle: "Basicos 100% algodon",
        bannerTagline: "Envíos a todo el Perú",
      });
      const html = renderToStaticMarkup(
        React.createElement(PublicCatalog, { store, isMockup: true, mode: "catalog" })
      );
      expect(html.includes("typography-modern")).toBe(true);
      expect(html.includes("typography-serif")).toBe(false);
      expect(html.includes("Basicos 100% algodon")).toBe(true);
    });

    it("aura-botanicals: conserva tipografía 'sans' y tarjeta 'standard' (no sobreescritas por estiloFijo)", () => {
      const store = makeTestStore({
        slug: "aura-botanicals",
        name: "Aura Botanicals",
        model: "nature",
        niche: "cosmetica",
        catalogTypography: "sans",
        cardStyle: "standard",
        bannerTitle: "Belleza Consciente & Botánica",
        bannerTagline: "Fórmulas limpias y efectivas",
      });
      const html = renderToStaticMarkup(
        React.createElement(PublicCatalog, { store, isMockup: true, mode: "catalog" })
      );
      expect(html.includes("typography-sans")).toBe(true);
      expect(html.includes("typography-serif")).toBe(false);
      expect(html.includes("Belleza Consciente &amp; Botánica") || html.includes("Belleza Consciente & Botánica")).toBe(true);
    });

    it("emessentials: conserva tipografía 'sans' y restaura los textos de ejemplo anteriores (nicheTags)", () => {
      const store = makeTestStore({
        slug: "emessentials",
        name: "EM essentials",
        model: "nature",
        niche: "general",
        catalogTypography: "sans",
        cardStyle: "standard",
        bannerTitle: null as any,
        bannerTagline: null as any,
        bannerBottomTag: null as any,
      });
      const html = renderToStaticMarkup(
        React.createElement(PublicCatalog, { store, isMockup: true, mode: "catalog" })
      );
      // Letra guardada sans
      expect(html.includes("typography-sans")).toBe(true);
      expect(html.includes("typography-serif")).toBe(false);
      // Textos de ejemplo restaurados de a72f797
      expect(html.includes("Abraza la pureza de la naturaleza")).toBe(true);
      expect(html.includes("Catálogo Exclusivo")).toBe(true);
      expect(html.includes("Calidad &amp; Detalle") || html.includes("Calidad & Detalle")).toBe(true);
      expect(html.includes("Garantía &amp; Calidad") || html.includes("Garantía & Calidad")).toBe(true);
      expect(html.includes("Exclusivo")).toBe(true);
    });

    it("onfeet: Bloom sin textos sobre el banner (conserva portada limpia sin overlay)", () => {
      const store = makeTestStore({
        slug: "onfeet",
        name: "On Feet Sneakers",
        model: "bloom",
        niche: "moda",
        catalogTypography: "sans",
        cardStyle: "standard",
        bannerTitle: "Distribuidores autorizados de Crocs 🐊",
        bannerTagline: "CALZADO URBANO Y EXCLUSIVO",
        bannerBottomTag: "ENVÍOS A TODO EL PAÍS",
      });
      const html = renderToStaticMarkup(
        React.createElement(PublicCatalog, { store, isMockup: true, mode: "catalog" })
      );
      // No debe renderizar el bloque de overlay con textos y gradiente sobre el banner
      expect(html.includes("from-black/75 via-black/25 to-transparent")).toBe(false);
      expect(html.includes("CALZADO URBANO Y EXCLUSIVO")).toBe(false);
      expect(html.includes("ENVÍOS A TODO EL PAÍS")).toBe(false);
      expect(html.includes("<h2")).toBe(false);
    });
  });

  describe("3. Tiendas nuevas o estándar (aplican reglas N3a completas)", () => {
    it("tienda nueva con Nature tiene tipografía fija 'serif', tarjeta fija 'curved' y NO inventa textos", () => {
      const nuevaStore = makeTestStore({
        slug: "botanica-nueva-2026",
        name: "Botánica Silvestre",
        model: "nature",
        niche: "general",
        bannerTitle: null as any,
        bannerTagline: null as any,
        bannerBottomTag: null as any,
      });
      const html = renderToStaticMarkup(
        React.createElement(PublicCatalog, { store: nuevaStore, isMockup: true, mode: "catalog" })
      );
      // Tipografía fija serif
      expect(html.includes("typography-serif")).toBe(true);
      // NO contiene textos inventados
      expect(html.includes("Abraza la pureza de la naturaleza")).toBe(false);
      expect(html.includes("Catálogo Exclusivo")).toBe(false);
    });

    it("tienda nueva con Bloom Floral sí muestra textos de portada si están configurados", () => {
      const bloomStore = makeTestStore({
        slug: "floreria-nueva",
        name: "Florería Magnolia",
        model: "bloom_floral",
        niche: "floreria",
        bannerTitle: "Arreglos Florales Frescos",
        bannerTagline: "Envío hoy en Lima",
      });
      const html = renderToStaticMarkup(
        React.createElement(PublicCatalog, { store: bloomStore, isMockup: true, mode: "catalog" })
      );
      expect(html.includes("Arreglos Florales Frescos")).toBe(true);
      expect(html.includes("Envío hoy en Lima")).toBe(true);
    });
  });

  describe("4. Diagonal vuelve al selector oficial (8 diseños en total)", () => {
    it("diagonal.enSelector es true", () => {
      expect(DESIGN_SPECS.diagonal.enSelector).toBe(true);
    });

    it("ALL_MODELS de registro expone exactamente 8 diseños", () => {
      expect(ALL_MODELS).toHaveLength(8);
      const expectedIds = ["grid", "overlay", "arch", "diagonal", "nature", "lookbook", "bloom_general", "bite"];
      const actualIds = ALL_MODELS.map((m) => m.id);
      expect(actualIds.sort()).toEqual(expectedIds.sort());
    });

    it("el selector de admin.diseno muestra 8 estructuras oficiales", () => {
      const officialModel = "diagonal";
      const officialStructId = resolveStructureId(officialModel);
      const visibleOfficial = DESIGN_STRUCTURES.filter(
        (s) => s.spec.enSelector || s.id === officialStructId
      );
      expect(visibleOfficial).toHaveLength(8);
      expect(visibleOfficial.some((s) => s.id === "diagonal")).toBe(true);
    });
  });
});
