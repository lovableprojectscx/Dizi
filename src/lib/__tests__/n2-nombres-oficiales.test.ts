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
import { ALL_MODELS, PALETTE_VARIANT_MODELS } from "../design-catalog";
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

  describe("3. Registro (register.tsx): catálogo de modelos y reglas de guardado", () => {
    it("ALL_MODELS expone exactamente los 7 diseños oficiales activos (N3a)", () => {
      expect(ALL_MODELS.length).toBe(7);
      for (const m of ALL_MODELS) {
        const spec = getDesignSpec(m.id);
        expect(spec).toBeDefined();
        // Cada modelo en el registro mapea a uno de los 7 IDs oficiales activos
        expect([
          "grid",
          "overlay",
          "arch",
          "nature",
          "lookbook",
          "bloom_general",
          "bite",
        ]).toContain(spec.id);
      }
    });

    it("PALETTE_VARIANT_MODELS reconoce clasico, nature_mint, nocturno, sunset_glow y forest_deep", () => {
      expect(PALETTE_VARIANT_MODELS.has("clasico")).toBe(true);
      expect(PALETTE_VARIANT_MODELS.has("nature_mint")).toBe(true);
      expect(PALETTE_VARIANT_MODELS.has("nocturno")).toBe(true);
      expect(PALETTE_VARIANT_MODELS.has("sunset_glow")).toBe(true);
      expect(PALETTE_VARIANT_MODELS.has("forest_deep")).toBe(true);

      // Los IDs oficiales puros NO son variantes de paleta
      expect(PALETTE_VARIANT_MODELS.has("grid")).toBe(false);
      expect(PALETTE_VARIANT_MODELS.has("overlay")).toBe(false);
      expect(PALETTE_VARIANT_MODELS.has("hero")).toBe(false);
      expect(PALETTE_VARIANT_MODELS.has("arch")).toBe(false);
      expect(PALETTE_VARIANT_MODELS.has("banner_grid")).toBe(false);
    });

    it("Regla 1 (Variantes de paleta): guarda el ID viejo tal cual y NO escribe columnas de paleta", async () => {
      const variantsToTest = ["clasico", "nature_mint", "nocturno"] as const;

      for (const selectedModel of variantsToTest) {
        const officialModel = PALETTE_VARIANT_MODELS.has(selectedModel)
          ? selectedModel
          : getDesignSpec(selectedModel).id;

        const storeId = `store_test_${selectedModel}`;
        await useApp.getState().addStore({
          id: storeId,
          slug: `tienda-test-${selectedModel}`,
          name: `Tienda ${selectedModel}`,
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
          categories: [],
          products: [],
        });

        const store = useApp.getState().stores.find((s) => s.id === storeId);
        expect(store).toBeDefined();
        // Guarda el ID viejo tal cual
        expect(store?.model).toBe(selectedModel);
        // NO escribe columnas de paleta (quedan undefined tal como antes de N2)
        expect(store?.bgColor).toBeUndefined();
        expect(store?.textColor).toBeUndefined();
        expect(store?.cardBg).toBeUndefined();
        expect(store?.accentColor).toBeUndefined();
        expect(store?.borderRadius).toBeUndefined();
        expect(store?.imgShape).toBeUndefined();
        expect(store?.isDark).toBeUndefined();
        expect(store?.catalogTypography).toBeUndefined();
        expect(store?.cardStyle).toBeUndefined();
      }
    });

    it("Regla 2 (Opciones oficiales): guarda el ID oficial y NO escribe columnas de paleta", async () => {
      const officialOptionsToTest: Array<{ selectedModel: string; expectedSavedModel: string }> = [
        { selectedModel: "grid", expectedSavedModel: "grid" },
        { selectedModel: "overlay", expectedSavedModel: "overlay" },
        { selectedModel: "hero", expectedSavedModel: "hero" },
        { selectedModel: "arch", expectedSavedModel: "arch" },
        { selectedModel: "portada", expectedSavedModel: "banner_grid" },
      ];

      for (const opt of officialOptionsToTest) {
        const officialModel = PALETTE_VARIANT_MODELS.has(opt.selectedModel)
          ? opt.selectedModel
          : getDesignSpec(opt.selectedModel).id;

        const storeId = `store_test_oficial_${opt.selectedModel}`;
        await useApp.getState().addStore({
          id: storeId,
          slug: `tienda-test-oficial-${opt.selectedModel}`,
          name: `Tienda ${opt.selectedModel}`,
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
          categories: [],
          products: [],
        });

        const store = useApp.getState().stores.find((s) => s.id === storeId);
        expect(store).toBeDefined();
        // Guarda el ID oficial (ej: portada -> banner_grid, grid -> grid)
        expect(store?.model).toBe(opt.expectedSavedModel);
        // NO escribe columnas de paleta
        expect(store?.bgColor).toBeUndefined();
        expect(store?.textColor).toBeUndefined();
        expect(store?.cardBg).toBeUndefined();
        expect(store?.accentColor).toBeUndefined();
        expect(store?.borderRadius).toBeUndefined();
        expect(store?.imgShape).toBeUndefined();
        expect(store?.isDark).toBeUndefined();
        expect(store?.catalogTypography).toBeUndefined();
        expect(store?.cardStyle).toBeUndefined();
      }
    });
  });
});
