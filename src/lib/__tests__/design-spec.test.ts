import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DESIGN_SPECS,
  DESIGN_STRUCTURES,
  getDesignSpec,
  resolveStructureId,
  resolveRenderModel,
  modelSupportsCategoryIcons,
  type OfficialDesignId,
} from "../design-catalog";
import { PublicCatalog } from "@/components/public/PublicCatalog";
import type { Store, Product, Category } from "@/lib/types";

describe("Encargo N1 — Ficha Única de Diseños (DesignSpec)", () => {
  const ALL_OFFICIAL_IDS: OfficialDesignId[] = [
    "grid",
    "overlay",
    "hero",
    "spotlight",
    "editorial",
    "tiles",
    "magazine",
    "diagonal",
    "arch",
    "banner_grid",
    "bloom_general",
    "bloom_floral",
    "bite",
    "nature",
    "lookbook",
  ];

  describe("1. Integridad de la Ficha Única (15 diseños oficiales)", () => {
    it("los 15 IDs oficiales tienen una ficha técnica completa y válida", () => {
      expect(Object.keys(DESIGN_SPECS)).toHaveLength(15);
      expect(DESIGN_STRUCTURES).toHaveLength(15);

      for (const id of ALL_OFFICIAL_IDS) {
        const spec = DESIGN_SPECS[id];
        expect(spec, `Ficha no encontrada para ${id}`).toBeDefined();
        expect(spec.id).toBe(id);
        expect(spec.nombre.length).toBeGreaterThan(0);
        expect(["estandar", "premium"]).toContain(spec.familia);
        expect(["ninguna", "carrusel"]).toContain(spec.portada);
        expect(Array.isArray(spec.textosPortada)).toBe(true);
        expect(typeof spec.textosDeEjemplo).toBe("boolean");
        expect(typeof spec.corteBanner).toBe("boolean");
        expect(typeof spec.destacados).toBe("boolean");
        expect(typeof spec.iconosCategoria).toBe("boolean");
        expect(Array.isArray(spec.temaEditable)).toBe(true);
        expect(typeof spec.oscuroDeFabrica).toBe("boolean");
        expect(spec.rubroSugerido.length).toBeGreaterThan(0);
        expect(typeof spec.enSelector).toBe("boolean");
      }
    });

    it("verifica el modo oscuro de fábrica según MODEL_CONFIGS", () => {
      expect(DESIGN_SPECS.tiles.oscuroDeFabrica).toBe(true);
      expect(DESIGN_SPECS.magazine.oscuroDeFabrica).toBe(true);
      expect(DESIGN_SPECS.diagonal.oscuroDeFabrica).toBe(true);
      expect(DESIGN_SPECS.bite.oscuroDeFabrica).toBe(true);

      const lightDesigns: OfficialDesignId[] = [
        "grid",
        "overlay",
        "hero",
        "spotlight",
        "editorial",
        "arch",
        "banner_grid",
        "bloom_general",
        "bloom_floral",
        "nature",
        "lookbook",
      ];
      for (const id of lightDesigns) {
        expect(DESIGN_SPECS[id].oscuroDeFabrica, `${id} debería ser claro`).toBe(false);
      }
    });

    it("verifica la regla de íconos de categoría (tiles = false; premium = true)", () => {
      expect(DESIGN_SPECS.tiles.iconosCategoria).toBe(false);
      expect(DESIGN_SPECS.bloom_general.iconosCategoria).toBe(true);
      expect(DESIGN_SPECS.bloom_floral.iconosCategoria).toBe(true);
      expect(DESIGN_SPECS.bite.iconosCategoria).toBe(true);
      expect(DESIGN_SPECS.nature.iconosCategoria).toBe(true);

      expect(modelSupportsCategoryIcons("tiles")).toBe(false);
      expect(modelSupportsCategoryIcons("bloom_general")).toBe(true);
      expect(modelSupportsCategoryIcons("bloom_floral")).toBe(true);
      expect(modelSupportsCategoryIcons("bite")).toBe(true);
      expect(modelSupportsCategoryIcons("nature")).toBe(true);
    });

    it("verifica corteBanner (solo Bloom)", () => {
      expect(DESIGN_SPECS.bloom_general.corteBanner).toBe(true);
      expect(DESIGN_SPECS.bloom_floral.corteBanner).toBe(true);

      const otherDesigns = ALL_OFFICIAL_IDS.filter(
        (id) => id !== "bloom_general" && id !== "bloom_floral"
      );
      for (const id of otherDesigns) {
        expect(DESIGN_SPECS[id].corteBanner, `${id} no debe usar corteBanner`).toBe(false);
      }
    });

    it("verifica temaEditable: tarjeta solo en Bloom; colores, tipografía y oscuro en todos", () => {
      for (const id of ALL_OFFICIAL_IDS) {
        const spec = DESIGN_SPECS[id];
        expect(spec.temaEditable).toContain("colores");
        expect(spec.temaEditable).toContain("tipografia");
        expect(spec.temaEditable).toContain("oscuro");
        expect(spec.temaEditable).not.toContain("formaFoto");
        expect(spec.temaEditable).not.toContain("radio");

        if (id === "bloom_general" || id === "bloom_floral") {
          expect(spec.temaEditable).toContain("tarjeta");
        } else {
          expect(spec.temaEditable).not.toContain("tarjeta");
        }
      }
    });
  });

  describe("2. Resolución de nombres legados y adaptadores", () => {
    it("resuelve todos los nombres de LEGACY_STRUCTURE_MAP", () => {
      const legacyMap: Record<string, OfficialDesignId> = {
        minimalista: "grid",
        clasico: "grid",
        nature_mint: "grid",
        forest_deep: "grid",
        vibrante: "overlay",
        nocturno: "overlay",
        sunset_glow: "overlay",
        eco: "hero",
        elite: "banner_grid",
        boutique: "spotlight",
        corporativo: "editorial",
        aurora: "tiles",
        dark_fashion: "magazine",
        luxury: "magazine",
        slash: "diagonal",
        arch_studio: "arch",
        portada: "banner_grid",
        bite: "bite",
        nature: "nature",
        lookbook: "lookbook",
      };

      for (const [legacyName, expectedId] of Object.entries(legacyMap)) {
        const spec = getDesignSpec(legacyName);
        expect(spec.id, `Fallo al resolver ${legacyName}`).toBe(expectedId);
      }
    });

    it("desambigua bloom histórico por rubro comercial (floreria vs otro)", () => {
      const floralSpec = getDesignSpec("bloom", "floreria");
      expect(floralSpec.id).toBe("bloom_floral");

      const generalSpec = getDesignSpec("bloom", "moda");
      expect(generalSpec.id).toBe("bloom_general");

      const defaultSpec = getDesignSpec("bloom");
      expect(defaultSpec.id).toBe("bloom_general");
    });

    it("resuelve modelos directamente desde RENDER_MODEL_MAP", () => {
      const renderModels = [
        "minimalista",
        "vibrante",
        "eco",
        "boutique",
        "corporativo",
        "aurora",
        "dark_fashion",
        "slash",
        "arch_studio",
        "portada",
        "bite",
        "nature",
        "lookbook",
      ];
      for (const rm of renderModels) {
        const spec = getDesignSpec(rm);
        expect(spec).toBeDefined();
        expect(ALL_OFFICIAL_IDS).toContain(spec.id);
      }
    });
  });

  describe("3. Prueba de contrato: PublicCatalog respeta la Ficha Única", () => {
    const testProducts: Product[] = [
      {
        id: "prod-1",
        name: "Producto Normal",
        price: 25,
        categoryId: "cat-1",
        image: "https://storage.example.com/prod1.webp",
        storeId: "store-test-1",
        visible: true,
      } as Product,
      {
        id: "prod-2",
        name: "Combo Especial #destacado",
        price: 45,
        categoryId: "cat-1",
        image: "https://storage.example.com/prod2.webp",
        description: "Contiene papas y gaseosa #destacado",
        storeId: "store-test-1",
        visible: true,
      } as Product,
    ];

    const makeTestStore = (model: string, niche = "general"): Store =>
      ({
        id: "store-test-1",
        name: "Tienda de Prueba",
        slug: "tienda-prueba",
        model,
        niche,
        plan: "pro",
        bannerImage:
          "https://storage.example.com/banner-alpha.webp|||https://storage.example.com/banner-beta.webp",
        bannerTitle: "TITULO_TEST_UNICO",
        bannerTagline: "TAGLINE_TEST_UNICO",
        bannerBottomTag: "ETIQUETA_TEST_UNICA",
        showFeatured: true,
        brandColor: "#4f46e5",
        categories: [
          { id: "cat-1", name: "Hamburguesas [burger]", storeId: "store-test-1" } as Category,
        ],
        products: testProducts,
      } as unknown as Store);

    for (const designId of ALL_OFFICIAL_IDS) {
      it(`diseño "${designId}": respeta portada, textos de portada y destacados según su ficha`, () => {
        const niche = designId === "bloom_floral" ? "floreria" : "general";
        const store = makeTestStore(designId, niche);
        const spec = DESIGN_SPECS[designId];

        const html = renderToStaticMarkup(
          React.createElement(PublicCatalog, {
            store,
            isMockup: true,
            mode: "catalog",
          })
        );

        // 1. Portada: si 'ninguna', el banner no debe pintarse
        if (spec.portada === "ninguna") {
          expect(
            html.includes("banner-alpha.webp"),
            `El diseño ${designId} tiene portada="ninguna" pero renderizó el banner`
          ).toBe(false);
        } else {
          expect(
            html.includes("banner-alpha.webp"),
            `El diseño ${designId} tiene portada="carrusel" pero NO renderizó el banner`
          ).toBe(true);
        }

        // 2. Textos de portada: solo deben aparecer los que estén en spec.textosPortada
        if (spec.textosPortada.includes("titulo")) {
          expect(
            html.includes("TITULO_TEST_UNICO"),
            `El diseño ${designId} incluye "titulo" pero no lo renderizó`
          ).toBe(true);
        } else {
          // Si no está en textosPortada, no debe salir en el texto renderizado
          // (en Bloom o Bite solo podría estar en alt de img, nunca como texto en pantalla)
          const textMatch = html.match(/<[^>]*>TITULO_TEST_UNICO<\/[^>]*>/);
          expect(
            Boolean(textMatch),
            `El diseño ${designId} NO incluye "titulo" pero lo renderizó como texto`
          ).toBe(false);
        }

        if (spec.textosPortada.includes("subtitulo")) {
          expect(
            html.includes("TAGLINE_TEST_UNICO"),
            `El diseño ${designId} incluye "subtitulo" pero no lo renderizó`
          ).toBe(true);
        } else {
          expect(
            html.includes("TAGLINE_TEST_UNICO"),
            `El diseño ${designId} NO incluye "subtitulo" pero lo renderizó`
          ).toBe(false);
        }

        if (spec.textosPortada.includes("etiqueta")) {
          expect(
            html.includes("ETIQUETA_TEST_UNICA"),
            `El diseño ${designId} incluye "etiqueta" pero no la renderizó`
          ).toBe(true);
        } else {
          expect(
            html.includes("ETIQUETA_TEST_UNICA"),
            `El diseño ${designId} NO incluye "etiqueta" pero la renderizó`
          ).toBe(false);
        }

        // 3. Destacados: carrusel solo si destacados = true
        if (spec.destacados) {
          expect(
            html.includes("Destacados") ||
              html.includes("Recomendamos") ||
              html.includes("Ofertas") ||
              html.includes("data-carousel"),
            `El diseño ${designId} tiene destacados=true pero no renderizó la sección de destacados`
          ).toBe(true);
        }
      });
    }
  });

  describe("4. Reglas del Panel de Diseño (admin.diseno)", () => {
    it("para diseños sin portada, spec.portada === 'ninguna' (ocultando subida de banners)", () => {
      const sinPortada: OfficialDesignId[] = [
        "overlay",
        "hero",
        "spotlight",
        "editorial",
        "tiles",
        "magazine",
        "diagonal",
        "arch",
      ];
      for (const id of sinPortada) {
        const spec = getDesignSpec(id);
        expect(spec.portada).toBe("ninguna");
        expect(spec.textosPortada).toHaveLength(0);
      }
    });

    it("para diseños con portada, spec.portada === 'carrusel' (permitiendo subida de banners)", () => {
      const conPortada: OfficialDesignId[] = [
        "grid",
        "banner_grid",
        "bloom_general",
        "bloom_floral",
        "bite",
        "nature",
        "lookbook",
      ];
      for (const id of conPortada) {
        const spec = getDesignSpec(id);
        expect(spec.portada).toBe("carrusel");
      }
    });
  });
});
