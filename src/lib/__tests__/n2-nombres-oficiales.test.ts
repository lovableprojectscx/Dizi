import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  getDesignSpec,
  resolveStructureId,
  resolveRenderModel,
  type OfficialDesignId,
} from "../design-catalog";
import { SEMILLA_MODEL, getImageSpec } from "../types";
import type { Store, Product, Category } from "../types";
import { ALL_MODELS, PALETTE_PRESETS_BY_MODEL } from "../design-catalog";
import { useApp } from "../store";
import { PublicCatalog } from "@/components/public/PublicCatalog";

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    })),
  },
  invokeRpcWithRetry: vi.fn().mockResolvedValue({ data: null, error: null }),
}));

describe("Encargo N2 — Nombres Oficiales de Diseño y Migración Segura", () => {
  beforeEach(() => {
    useApp.setState({ stores: [], currentStoreId: null });
    vi.clearAllMocks();
  });

  describe("1. Valores por defecto y Semilla actualizados a 'grid'", () => {
    it("SEMILLA_MODEL es 'grid'", () => {
      expect(SEMILLA_MODEL).toBe("grid");
    });

    it("getImageSpec para tienda con model 'grid' o sin model retorna ratio 1/1 (1000x1000)", () => {
      const gridStoreSpec = getImageSpec({ model: "grid" } as any);
      expect(gridStoreSpec.ratio).toBe("1/1");
      expect(gridStoreSpec.width).toBe(1000);
      expect(gridStoreSpec.height).toBe(1000);

      const defaultSpec = getImageSpec({} as any);
      expect(defaultSpec.ratio).toBe("1/1");
      expect(defaultSpec.width).toBe(1000);
      expect(defaultSpec.height).toBe(1000);
    });
  });

  describe("2. Grupo Seguro: Equivalencia exacta de dibujo entre nombres viejos y oficiales", () => {
    const SAFE_GROUP_PAIRS: Array<{
      oldName: string;
      officialId: OfficialDesignId;
      expectedRenderModel: string;
      expectedLayout: string;
    }> = [
      {
        oldName: "minimalista",
        officialId: "grid",
        expectedRenderModel: "minimalista",
        expectedLayout: "grid",
      },
      {
        oldName: "arch_studio",
        officialId: "arch",
        expectedRenderModel: "arch_studio",
        expectedLayout: "arch",
      },
      {
        oldName: "vibrante",
        officialId: "overlay",
        expectedRenderModel: "vibrante",
        expectedLayout: "overlay",
      },
      {
        oldName: "dark_fashion",
        officialId: "magazine",
        expectedRenderModel: "dark_fashion",
        expectedLayout: "magazine",
      },
      {
        oldName: "eco",
        officialId: "hero",
        expectedRenderModel: "eco",
        expectedLayout: "hero",
      },
      {
        oldName: "elite",
        officialId: "banner_grid",
        expectedRenderModel: "portada",
        expectedLayout: "grid",
      },
    ];

    for (const pair of SAFE_GROUP_PAIRS) {
      it(`par '${pair.oldName}' -> '${pair.officialId}' resuelve a la misma ficha, modelo de render y layout`, () => {
        // 1. Ficha oficial
        const specOld = getDesignSpec(pair.oldName);
        const specNew = getDesignSpec(pair.officialId);
        expect(specOld.id).toBe(pair.officialId);
        expect(specNew.id).toBe(pair.officialId);
        expect(resolveStructureId(pair.oldName)).toBe(pair.officialId);
        expect(resolveStructureId(pair.officialId)).toBe(pair.officialId);

        // 2. Modelo de render efectivo en PublicCatalog
        const getFinalModelId = (model: string) => {
          const raw = resolveRenderModel(model);
          return raw === "portada" ? "elite" : raw;
        };
        const modelIdOld = getFinalModelId(pair.oldName);
        const modelIdNew = getFinalModelId(pair.officialId);
        expect(modelIdOld).toBe(modelIdNew);
      });

      it(`renderizado de PublicCatalog es idéntico para '${pair.oldName}' y '${pair.officialId}'`, () => {
        const dummyCategory: Category = { id: "cat-1", name: "Ropa" };
        const dummyProduct: Product = {
          id: "prod-1",
          name: "Camisa Oxford",
          price: 99,
          categoryId: "cat-1",
          visible: true,
          image: "https://example.com/camisa.jpg",
        };

        const baseStore = {
          id: "store-test-safe-group",
          slug: "tienda-test-safe-group",
          name: "Tienda Test Equivalencia",
          plan: "ilimitado",
          active: true,
          isPublished: true,
          categories: [dummyCategory],
          products: [dummyProduct],
        };

        const storeWithOld: Store = {
          ...baseStore,
          model: pair.oldName as any,
        } as Store;

        const storeWithNew: Store = {
          ...baseStore,
          model: pair.officialId as any,
        } as Store;

        const htmlOld = renderToStaticMarkup(
          React.createElement(PublicCatalog, {
            store: storeWithOld,
            mode: "catalog",
            isMockup: true,
          })
        );

        const htmlNew = renderToStaticMarkup(
          React.createElement(PublicCatalog, {
            store: storeWithNew,
            mode: "catalog",
            isMockup: true,
          })
        );

        expect(htmlOld).toBe(htmlNew);
      });
    }
  });

  describe("3. Registro (register.tsx): catálogo de modelos y guardado de IDs oficiales con paleta", () => {
    it("ALL_MODELS expone IDs oficiales y variantes de paleta reconocidas", () => {
      expect(ALL_MODELS.length).toBeGreaterThanOrEqual(10);
      for (const m of ALL_MODELS) {
        const spec = getDesignSpec(m.id);
        expect(spec).toBeDefined();
        // Cada modelo en el registro mapea a un ID oficial válido
        expect([
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
        ]).toContain(spec.id);
      }
    });

    it("variantes de paleta (clasico, nature_mint, nocturno) definen colores finos y tipografía", () => {
      // Clásico Cálido
      expect(getDesignSpec("clasico").id).toBe("grid");
      expect(PALETTE_PRESETS_BY_MODEL.clasico).toBeDefined();
      expect(PALETTE_PRESETS_BY_MODEL.clasico.bgColor).toBe("#fdfaf5");
      expect(PALETTE_PRESETS_BY_MODEL.clasico.textColor).toBe("#451a03");
      expect(PALETTE_PRESETS_BY_MODEL.clasico.catalogTypography).toBe("serif");

      // Nature Mint
      expect(getDesignSpec("nature_mint").id).toBe("grid");
      expect(PALETTE_PRESETS_BY_MODEL.nature_mint).toBeDefined();
      expect(PALETTE_PRESETS_BY_MODEL.nature_mint.bgColor).toBe("#f0fefb");
      expect(PALETTE_PRESETS_BY_MODEL.nature_mint.brandColor).toBe("#0d9488");
      expect(PALETTE_PRESETS_BY_MODEL.nature_mint.textColor).toBe("#134e4a");

      // Nocturno
      expect(getDesignSpec("nocturno").id).toBe("overlay");
      expect(PALETTE_PRESETS_BY_MODEL.nocturno).toBeDefined();
      expect(PALETTE_PRESETS_BY_MODEL.nocturno.bgColor).toBe("#0f172a");
      expect(PALETTE_PRESETS_BY_MODEL.nocturno.textColor).toBe("#f8fafc");
      expect(PALETTE_PRESETS_BY_MODEL.nocturno.isDark).toBe(true);
      expect(PALETTE_PRESETS_BY_MODEL.nocturno.catalogTypography).toBe("modern");
    });

    it("addStore persiste el ID oficial y las columnas de tema cuando se selecciona una paleta", async () => {
      const selectedModel = "clasico";
      const spec = getDesignSpec(selectedModel);
      const officialModel = spec.id; // 'grid'
      const palette = PALETTE_PRESETS_BY_MODEL[selectedModel];

      await useApp.getState().addStore({
        id: "store_paleta_clasico",
        slug: "tienda-paleta-clasico",
        name: "Tienda Clásica",
        phone: "987654321",
        countryCode: "51",
        countryIso: "PE",
        plan: "semilla",
        termsAcceptedAt: new Date().toISOString(),
        active: true,
        isPublished: true,
        createdAt: "2026-10-21",
        whatsappClicks: 0,
        model: officialModel as any,
        brandColor: palette.brandColor,
        bgColor: palette.bgColor,
        textColor: palette.textColor,
        cardBg: palette.cardBg,
        accentColor: palette.accentColor,
        borderRadius: palette.borderRadius,
        imgShape: palette.imgShape,
        isDark: palette.isDark,
        catalogTypography: palette.catalogTypography,
        cardStyle: palette.cardStyle,
        categories: [],
        products: [],
      });

      const store = useApp.getState().stores.find((s) => s.id === "store_paleta_clasico");
      expect(store).toBeDefined();
      expect(store?.model).toBe("grid"); // ID oficial guardado
      expect(store?.bgColor).toBe("#fdfaf5");
      expect(store?.textColor).toBe("#451a03");
      expect(store?.cardBg).toBe("#fef9ef");
      expect(store?.brandColor).toBe("#92400e");
      expect(store?.catalogTypography).toBe("serif");
      expect(store?.isDark).toBe(false);
    });
  });
});
