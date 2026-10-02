import { describe, it, expect } from "vitest";
import { resolveStructureId } from "../design-catalog";
import { mapStoreFromDB } from "../store";

describe("Fase 3E - Control de Carrusel de Destacados", () => {
  const FEATURED_COMPATIBLE_STRUCTURES = [
    "bite",
    "nature",
    "bloom_general",
    "bloom_floral",
  ];

  const supportsFeaturedProducts = (model?: string, niche?: string) => {
    const structureId = resolveStructureId(model, niche);
    return FEATURED_COMPATIBLE_STRUCTURES.includes(structureId);
  };

  describe("supportsFeaturedProducts & resolveStructureId", () => {
    it("habilita destacados únicamente para los 4 diseños permitidos", () => {
      expect(supportsFeaturedProducts("bite")).toBe(true);
      expect(supportsFeaturedProducts("nature")).toBe(true);
      expect(supportsFeaturedProducts("bloom_general")).toBe(true);
      expect(supportsFeaturedProducts("bloom_floral")).toBe(true);
      // bloom legado desambiguado por rubro
      expect(supportsFeaturedProducts("bloom", "floreria")).toBe(true);
      expect(supportsFeaturedProducts("bloom", "general")).toBe(true);
    });

    it("deshabilita destacados para Tiles (aurora) y los otros 10 diseños", () => {
      expect(supportsFeaturedProducts("tiles")).toBe(false);
      expect(supportsFeaturedProducts("aurora")).toBe(false);
      expect(supportsFeaturedProducts("grid")).toBe(false);
      expect(supportsFeaturedProducts("minimalista")).toBe(false);
      expect(supportsFeaturedProducts("overlay")).toBe(false);
      expect(supportsFeaturedProducts("vibrante")).toBe(false);
      expect(supportsFeaturedProducts("hero")).toBe(false);
      expect(supportsFeaturedProducts("eco")).toBe(false);
      expect(supportsFeaturedProducts("elite")).toBe(false);
      expect(supportsFeaturedProducts("spotlight")).toBe(false);
      expect(supportsFeaturedProducts("boutique")).toBe(false);
      expect(supportsFeaturedProducts("editorial")).toBe(false);
      expect(supportsFeaturedProducts("corporativo")).toBe(false);
      expect(supportsFeaturedProducts("magazine")).toBe(false);
      expect(supportsFeaturedProducts("diagonal")).toBe(false);
      expect(supportsFeaturedProducts("slash")).toBe(false);
      expect(supportsFeaturedProducts("arch")).toBe(false);
      expect(supportsFeaturedProducts("banner_grid")).toBe(false);
      expect(supportsFeaturedProducts("lookbook")).toBe(false);
    });
  });

  describe("mapStoreFromDB showFeatured mapping", () => {
    const mockDbRow = (showFeaturedVal: any) => ({
      id: "store-123",
      slug: "test-store",
      name: "Test Store",
      plan: "pro",
      model: "nature",
      brand_color: "#047857",
      show_featured: showFeaturedVal,
      categories: [],
      products: [],
    });

    it("asigna true por defecto cuando show_featured es null o undefined", () => {
      const storeUndefined = mapStoreFromDB(mockDbRow(undefined));
      expect(storeUndefined.showFeatured).toBe(true);

      const storeNull = mapStoreFromDB(mockDbRow(null));
      expect(storeNull.showFeatured).toBe(true);
    });

    it("respeta el valor false cuando la tienda ha desactivado el carrusel", () => {
      const storeDisabled = mapStoreFromDB(mockDbRow(false));
      expect(storeDisabled.showFeatured).toBe(false);
    });

    it("respeta el valor true cuando la tienda lo mantiene activo", () => {
      const storeEnabled = mapStoreFromDB(mockDbRow(true));
      expect(storeEnabled.showFeatured).toBe(true);
    });

    it("regla anti-rotura de caché: comparar siempre con showFeatured === false", () => {
      const cacheStoreOld: { showFeatured?: boolean } = {}; // de caché antigua sin el campo
      // Si comparáramos con !store.showFeatured fallaría (apagaría el carrusel a clientes viejos)
      expect(!cacheStoreOld.showFeatured).toBe(true); // ERROR: daría true indicando que está apagado
      // Con la regla canónica del encargo:
      const isTurnedOff = cacheStoreOld.showFeatured === false;
      expect(isTurnedOff).toBe(false); // CORRECTO: sigue encendido
    });
  });
});
