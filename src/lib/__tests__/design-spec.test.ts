import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DESIGN_SPECS,
  DESIGN_STRUCTURES,
  ALL_MODELS,
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

    it("verifica temaEditable según N3a: lookbook, bite, bloom_floral y nature solo colores; bloom_general todos; demás sin tarjeta", () => {
      const fixedColorOnly: OfficialDesignId[] = ["lookbook", "bite", "bloom_floral", "nature"];
      for (const id of fixedColorOnly) {
        const spec = DESIGN_SPECS[id];
        expect(spec.temaEditable).toEqual(["colores"]);
      }

      expect(DESIGN_SPECS.bloom_general.temaEditable).toEqual(["colores", "tipografia", "tarjeta", "oscuro"]);

      const standardOther = ALL_OFFICIAL_IDS.filter(
        (id) => !fixedColorOnly.includes(id) && id !== "bloom_general"
      );
      for (const id of standardOther) {
        const spec = DESIGN_SPECS[id];
        expect(spec.temaEditable).toEqual(["colores", "tipografia", "oscuro"]);
      }
    });

    it("verifica estiloFijo según N3a para plantillas con estilo visual inmutable", () => {
      expect(DESIGN_SPECS.lookbook.estiloFijo).toEqual({
        tipografia: "serif",
        tarjeta: "flat",
        corteBanner: "direct",
      });
      expect(DESIGN_SPECS.bite.estiloFijo).toEqual({
        tipografia: "sans",
        tarjeta: "standard",
        corteBanner: "framed",
      });
      expect(DESIGN_SPECS.bloom_floral.estiloFijo).toEqual({
        tipografia: "serif",
        tarjeta: "curved",
        corteBanner: "curved",
      });
      expect(DESIGN_SPECS.nature.estiloFijo).toEqual({
        tipografia: "serif",
        tarjeta: "curved",
        corteBanner: "curved",
      });

      const withoutFixed = ALL_OFFICIAL_IDS.filter(
        (id) => !["lookbook", "bite", "bloom_floral", "nature"].includes(id)
      );
      for (const id of withoutFixed) {
        expect(DESIGN_SPECS[id].estiloFijo).toBeUndefined();
      }
    });

    it("verifica enSelector según N3a: exactamente 7 en selector y 8 ocultos", () => {
      const enSelectorExpected: OfficialDesignId[] = [
        "nature",
        "lookbook",
        "bloom_general",
        "bite",
        "grid",
        "arch",
        "overlay",
      ];
      for (const id of ALL_OFFICIAL_IDS) {
        const spec = DESIGN_SPECS[id];
        if (enSelectorExpected.includes(id)) {
          expect(spec.enSelector, `${id} debe tener enSelector=true`).toBe(true);
        } else {
          expect(spec.enSelector, `${id} debe tener enSelector=false`).toBe(false);
        }
      }
    });

    it("verifica textosDeEjemplo: false en todos los 15 diseños", () => {
      for (const id of ALL_OFFICIAL_IDS) {
        expect(DESIGN_SPECS[id].textosDeEjemplo).toBe(false);
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

  describe("5. Decisiones Jack N3a — Estilo Fijo, Textos y Selector", () => {
    const makeStoreWithStyle = (
      model: string,
      typography = "sans",
      cardStyle = "standard",
      extra: Partial<Store> = {}
    ): Store =>
      ({
        id: "store-test-n3a",
        name: "Tienda Moda & Gourmet",
        slug: "tienda-n3a",
        model,
        niche: "general",
        plan: "pro",
        catalogTypography: typography,
        cardStyle: cardStyle,
        bannerImage: "https://storage.example.com/banner-n3a.webp",
        bannerTitle: "Colección Exclusiva 2026",
        bannerTagline: "Piezas Limitadas",
        bannerBottomTag: "Edición Limitada",
        categories: [{ id: "cat-1", name: "Cat Principal" } as Category],
        products: [
          {
            id: "prod-1",
            name: "Producto 1",
            price: 50,
            categoryId: "cat-1",
            image: "https://storage.example.com/prod1.webp",
            visible: true,
          } as Product,
        ],
        ...extra,
      } as unknown as Store);

    it("el estilo fijo en PublicCatalog ignora los valores guardados de catalogTypography y cardStyle", () => {
      // Lookbook: fijado a serif y flat
      const lookbookStore = makeStoreWithStyle("lookbook", "sans", "curved");
      const lookbookHtml = renderToStaticMarkup(
        React.createElement(PublicCatalog, { store: lookbookStore, isMockup: true, mode: "catalog" })
      );
      expect(lookbookHtml.includes("typography-serif")).toBe(true);
      expect(lookbookHtml.includes("typography-sans")).toBe(false);

      // Bite: fijado a sans y standard
      const biteStore = makeStoreWithStyle("bite", "serif", "curved");
      const biteHtml = renderToStaticMarkup(
        React.createElement(PublicCatalog, { store: biteStore, isMockup: true, mode: "catalog" })
      );
      expect(biteHtml.includes("typography-sans")).toBe(true);

      // Nature con catalogTypography default 'sans': se fuerza a su estilo fijo 'serif'
      const natureSansStore = makeStoreWithStyle("nature", "sans", "standard");
      const natureSansHtml = renderToStaticMarkup(
        React.createElement(PublicCatalog, { store: natureSansStore, isMockup: true, mode: "catalog" })
      );
      expect(natureSansHtml.includes("typography-serif")).toBe(true);
    });

    it("excepción temporal jhoselynperu: si catalogTypography guardado es distinto de 'sans', se respeta", () => {
      // Tienda jhoselynperu eligió 'modern' a propósito
      const jhoselynStore = makeStoreWithStyle("nature", "modern", "curved", {
        slug: "jhoselynperu",
        name: "Jhoselyn Joyería",
      });
      const html = renderToStaticMarkup(
        React.createElement(PublicCatalog, { store: jhoselynStore, isMockup: true, mode: "catalog" })
      );
      // Debe conservar modern y no cambiar a serif
      expect(html.includes("typography-modern")).toBe(true);
      expect(html.includes("typography-serif")).toBe(false);
    });

    it("sin textos inventados en Nature ni Lookbook cuando los campos están vacíos", () => {
      const emptyNatureStore = makeStoreWithStyle("nature", "sans", "standard", {
        bannerTitle: undefined,
        bannerTagline: undefined,
        bannerBottomTag: undefined,
        name: "Aura Botanicals",
      });
      const natureHtml = renderToStaticMarkup(
        React.createElement(PublicCatalog, { store: emptyNatureStore, isMockup: true, mode: "catalog" })
      );
      // No debe contener textos inventados
      expect(natureHtml.includes("Abraza la pureza de la naturaleza")).toBe(false);
      expect(natureHtml.includes("Cosmética Natural & Cuidado Orgánico")).toBe(false);
      expect(natureHtml.includes("Hecho con Amor")).toBe(false);
      // Debe usar el nombre propio de la tienda
      expect(natureHtml.includes("Aura Botanicals")).toBe(true);

      const emptyLookbookStore = makeStoreWithStyle("lookbook", "serif", "flat", {
        bannerTitle: undefined,
        bannerTagline: undefined,
        bannerBottomTag: undefined,
        name: "Florería Demo",
      });
      const lookbookHtml = renderToStaticMarkup(
        React.createElement(PublicCatalog, { store: emptyLookbookStore, isMockup: true, mode: "catalog" })
      );
      expect(lookbookHtml.includes("COLECCIÓN EXCLUSIVA")).toBe(false);
      expect(lookbookHtml.includes("Piezas exclusivas seleccionadas con un diseño atemporal.")).toBe(false);
      expect(lookbookHtml.includes("Florería Demo")).toBe(true);
    });

    it("Bloom Estándar pinta solo su título sobre el banner", () => {
      const bloomGeneralStore = makeStoreWithStyle("bloom_general", "sans", "standard", {
        bannerTitle: "Distribuidores autorizados de Crocs 🐊",
        bannerTagline: "TAGLINE_IGNORADO",
        bannerBottomTag: "ETIQUETA_IGNORADA",
      });
      const html = renderToStaticMarkup(
        React.createElement(PublicCatalog, { store: bloomGeneralStore, isMockup: true, mode: "catalog" })
      );
      expect(html.includes("Distribuidores autorizados de Crocs 🐊")).toBe(true);
      expect(html.includes("TAGLINE_IGNORADO")).toBe(false);
      expect(html.includes("ETIQUETA_IGNORADA")).toBe(false);
    });

    it("Bloom Floral pinta título, subtítulo y etiqueta si están presentes", () => {
      const bloomFloralStore = makeStoreWithStyle("bloom_floral", "serif", "curved", {
        bannerTitle: "Flores Frescas Cada Día",
        bannerTagline: "Envío express a Lima",
        bannerBottomTag: "100% Garantía de frescura",
      });
      const html = renderToStaticMarkup(
        React.createElement(PublicCatalog, { store: bloomFloralStore, isMockup: true, mode: "catalog" })
      );
      expect(html.includes("Flores Frescas Cada Día")).toBe(true);
      expect(html.includes("Envío express a Lima")).toBe(true);
      expect(html.includes("100% Garantía de frescura")).toBe(true);
    });

    it("el catálogo ALL_MODELS de registro ofrece exactamente los 7 diseños oficiales con enSelector: true", () => {
      expect(ALL_MODELS).toHaveLength(7);
      const expectedIds = ["grid", "overlay", "arch", "nature", "lookbook", "bloom_general", "bite"];
      const actualIds = ALL_MODELS.map((m) => m.id);
      expect(actualIds.sort()).toEqual(expectedIds.sort());

      // Todos los modelos en ALL_MODELS deben tener enSelector=true en DESIGN_SPECS
      for (const model of ALL_MODELS) {
        const spec = DESIGN_SPECS[model.id as OfficialDesignId];
        expect(spec.enSelector).toBe(true);
      }
    });

    it("el selector de admin.diseno muestra 7 estructuras si la tienda usa oficial, o 8 si usa oculta", () => {
      // Tienda con diseño oficial activo
      const officialModel = "nature";
      const officialStructId = resolveStructureId(officialModel);
      const visibleOfficial = DESIGN_STRUCTURES.filter(
        (s) => s.spec.enSelector || s.id === officialStructId
      );
      expect(visibleOfficial).toHaveLength(7);

      // Tienda con diseño legado/oculto (ej: tiles)
      const hiddenModel = "tiles";
      const hiddenStructId = resolveStructureId(hiddenModel);
      const visibleHidden = DESIGN_STRUCTURES.filter(
        (s) => s.spec.enSelector || s.id === hiddenStructId
      );
      expect(visibleHidden).toHaveLength(8);
      const hiddenItem = visibleHidden.find((s) => s.id === "tiles");
      expect(hiddenItem).toBeDefined();
      expect(hiddenItem?.spec.enSelector).toBe(false);
    });
  });
});
