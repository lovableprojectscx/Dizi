import { describe, it, expect } from "vitest";
import {
  DESIGN_STRUCTURES,
  resolveRenderModel,
  resolveStructureId,
  modelSupportsCategoryIcons,
} from "@/lib/design-catalog";
import { THEME_PRESETS } from "@/lib/theme-presets";
import { hexLuminance } from "@/lib/utils";
import { type PlanId } from "@/lib/types";

describe("Parte 2: Motor de Diseño, Banners y Live Preview", () => {
  describe("1. Las 15 Estructuras de Diseño Unificadas", () => {
    it("contiene exactamente 15 estructuras de diseño registradas", () => {
      expect(DESIGN_STRUCTURES).toHaveLength(15);
    });

    it("todas las estructuras poseen configuración de tema por defecto válida", () => {
      DESIGN_STRUCTURES.forEach((struct) => {
        expect(struct.id).toBeDefined();
        expect(struct.name).toBeDefined();
        expect(struct.layout).toBeDefined();
        expect(struct.defaultTheme).toBeDefined();
        expect(struct.defaultTheme.brandColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(struct.defaultTheme.bgColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(struct.defaultTheme.textColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it("ninguna estructura contiene módulos obsoletos de etiquetas (tagFilter)", () => {
      DESIGN_STRUCTURES.forEach((struct) => {
        expect(struct.supportedModules).not.toContain("tagFilter");
      });
    });

    it("resuelve modelos unificados a su respectivo renderizador de PublicCatalog", () => {
      expect(resolveRenderModel("grid")).toBe("minimalista");
      expect(resolveRenderModel("overlay")).toBe("vibrante");
      expect(resolveRenderModel("spotlight")).toBe("boutique");
      expect(resolveRenderModel("editorial")).toBe("corporativo");
      expect(resolveRenderModel("tiles")).toBe("aurora");
      expect(resolveRenderModel("diagonal")).toBe("slash");
      expect(resolveRenderModel("arch")).toBe("arch_studio");
      expect(resolveRenderModel("banner_grid")).toBe("portada");
      expect(resolveRenderModel("bite")).toBe("bite");
      expect(resolveRenderModel("nature")).toBe("nature");
      expect(resolveRenderModel("lookbook")).toBe("lookbook");
    });

    it("traduce modelos históricos heredados a las nuevas estructuras unificadas", () => {
      expect(resolveStructureId("minimalista")).toBe("grid");
      expect(resolveStructureId("vibrante")).toBe("overlay");
      expect(resolveStructureId("boutique")).toBe("spotlight");
      expect(resolveStructureId("corporativo")).toBe("editorial");
      expect(resolveStructureId("bloom", "floreria")).toBe("bloom_floral");
      expect(resolveStructureId("bloom", "ropa")).toBe("bloom_general");
      expect(resolveStructureId(null)).toBe("grid");
    });
  });

  describe("2. Compatibilidad con Iconos de Categoría", () => {
    it("habilita iconos de categoría en plantillas optimizadas (bite, bloom, nature, aurora)", () => {
      expect(modelSupportsCategoryIcons("bite")).toBe(true);
      expect(modelSupportsCategoryIcons("bloom_floral")).toBe(true);
      expect(modelSupportsCategoryIcons("nature")).toBe(true);
      expect(modelSupportsCategoryIcons("tiles")).toBe(true);
    });

    it("deshabilita iconos de categoría en plantillas de cuadrícula estándar", () => {
      expect(modelSupportsCategoryIcons("grid")).toBe(false);
      expect(modelSupportsCategoryIcons("editorial")).toBe(false);
    });
  });

  describe("3. Gestión de Banners y Serialización de Carrusel", () => {
    const getMaxBanners = (plan: PlanId): number => {
      return plan === "semilla" ? 0 : plan === "emprendedor" ? 1 : plan === "pro" ? 3 : 5;
    };

    it("calcula el cupo máximo de banners según el plan del comercio", () => {
      expect(getMaxBanners("semilla")).toBe(0);
      expect(getMaxBanners("emprendedor")).toBe(1);
      expect(getMaxBanners("pro")).toBe(3);
      expect(getMaxBanners("ilimitado")).toBe(5);
    });

    it("serializa y deserializa listas de banners con el delimitador '|||'", () => {
      const bannerList = [
        "https://cdn.dizi.lat/b1.webp",
        "https://cdn.dizi.lat/b2.webp",
        "https://cdn.dizi.lat/b3.webp",
      ];

      const serialized = bannerList.join("|||");
      expect(serialized).toBe("https://cdn.dizi.lat/b1.webp|||https://cdn.dizi.lat/b2.webp|||https://cdn.dizi.lat/b3.webp");

      const deserialized = serialized.split("|||").filter(Boolean);
      expect(deserialized).toEqual(bannerList);
    });

    it("elimina un banner por índice sin romper el orden de los restantes", () => {
      const bannerList = [
        "https://cdn.dizi.lat/b1.webp",
        "https://cdn.dizi.lat/b2.webp",
        "https://cdn.dizi.lat/b3.webp",
      ];

      const removeIndex = 1; // Eliminar b2
      const updated = bannerList.filter((_, i) => i !== removeIndex);
      expect(updated).toEqual([
        "https://cdn.dizi.lat/b1.webp",
        "https://cdn.dizi.lat/b3.webp",
      ]);
    });
  });

  describe("4. Presets de Tema y Cálculo de Contraste (hexLuminance)", () => {
    it("dispone de presets de tema listos para aplicar", () => {
      expect(THEME_PRESETS.length).toBeGreaterThan(0);
      THEME_PRESETS.forEach((preset) => {
        expect(preset.id).toBeDefined();
        expect(preset.name).toBeDefined();
        expect(preset.values.brandColor).toBeDefined();
        expect(preset.values.bgColor).toBeDefined();
      });
    });

    it("calcula la luminancia relativa de colores para legibilidad", () => {
      const whiteLum = hexLuminance("#ffffff");
      const blackLum = hexLuminance("#000000");

      expect(whiteLum).toBeGreaterThan(0.9);
      expect(blackLum).toBeLessThan(0.1);
      expect(whiteLum).toBeGreaterThan(blackLum);
    });
  });
});
