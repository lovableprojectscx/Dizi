import { describe, it, expect } from "vitest";
import {
  getPhotoAspect,
  suggestPhotoFormat,
  isFlexiblePhotoLayout,
} from "../photo-format";
import { getImageSpec, Store } from "../types";

describe("F41 · Formato de fotos y recomendación de imágenes", () => {
  // Mock base de tienda para pruebas
  const baseStore: Store = {
    id: "test-store-1",
    slug: "tienda-test",
    name: "Tienda Test",
    phone: "51999888777",
    countryCode: "51",
    plan: "semilla",
    active: true,
    createdAt: new Date().toISOString(),
    whatsappClicks: 0,
    model: "grid",
    categories: [],
    products: [],
  };

  describe("E1: Grilla sin formato (NULL histórico)", () => {
    it("E1 retorna ratio 4/3 y contain false cuando photoFormat es null o undefined", () => {
      const storeWithoutFormat: Store = { ...baseStore, model: "grid", photoFormat: null };
      const aspect = getPhotoAspect(storeWithoutFormat, "grid");

      expect(aspect).toEqual({ ratio: "4/3", contain: false });
    });

    it("E1 también respeta photo_format en snake_case si viene de la base de datos", () => {
      const storeDb = { ...baseStore, model: "grid", photo_format: null };
      const aspect = getPhotoAspect(storeDb as any, "grid");

      expect(aspect).toEqual({ ratio: "4/3", contain: false });
    });
  });

  describe("E2: Bloom Estándar sin formato (NULL histórico)", () => {
    it("E2 retorna ratio 1/1 y contain false cuando photoFormat es null o undefined", () => {
      const storeBloom: Store = {
        ...baseStore,
        model: "bloom_general",
        photoFormat: null,
      };
      const aspect = getPhotoAspect(storeBloom, "bloom_general");

      expect(aspect).toEqual({ ratio: "1/1", contain: false });
    });

    it("E2 funciona con alias de layout 'bloom'", () => {
      const storeBloomAlias: Store = {
        ...baseStore,
        model: "bloom",
        niche: "general",
        photoFormat: null,
      };
      const aspect = getPhotoAspect(storeBloomAlias, "bloom");

      expect(aspect).toEqual({ ratio: "1/1", contain: false });
    });
  });

  describe("E3: Grilla con formatos explícitos (square, portrait, contain)", () => {
    it("E3 Cuadrada (square) retorna 1/1", () => {
      const store: Store = { ...baseStore, model: "grid", photoFormat: "square" };
      expect(getPhotoAspect(store, "grid")).toEqual({ ratio: "1/1", contain: false });
    });

    it("E3 Vertical (portrait) retorna 3/4", () => {
      const store: Store = { ...baseStore, model: "grid", photoFormat: "portrait" };
      expect(getPhotoAspect(store, "grid")).toEqual({ ratio: "3/4", contain: false });
    });

    it("E3 Completa (contain) retorna 1/1 con contain: true", () => {
      const store: Store = { ...baseStore, model: "grid", photoFormat: "contain" };
      expect(getPhotoAspect(store, "grid")).toEqual({ ratio: "1/1", contain: true });
    });
  });

  describe("E4: Bloom Estándar con formatos explícitos", () => {
    it("E4 Cuadrada (square) en Bloom retorna 1/1", () => {
      const store: Store = { ...baseStore, model: "bloom_general", photoFormat: "square" };
      expect(getPhotoAspect(store, "bloom_general")).toEqual({ ratio: "1/1", contain: false });
    });

    it("E4 Vertical (portrait) en Bloom retorna 3/4", () => {
      const store: Store = { ...baseStore, model: "bloom_general", photoFormat: "portrait" };
      expect(getPhotoAspect(store, "bloom_general")).toEqual({ ratio: "3/4", contain: false });
    });

    it("E4 Completa (contain) en Bloom retorna 1/1 con contain: true", () => {
      const store: Store = { ...baseStore, model: "bloom_general", photoFormat: "contain" };
      expect(getPhotoAspect(store, "bloom_general")).toEqual({ ratio: "1/1", contain: true });
    });
  });

  describe("E5: Diseños no flexibles ignoran photo_format", () => {
    it("E5 Arch retorna null incluso con photo_format = 'portrait'", () => {
      const storeArch: Store = { ...baseStore, model: "arch", photoFormat: "portrait" };
      expect(getPhotoAspect(storeArch, "arch")).toBeNull();
    });

    it("E5 Nature retorna null con cualquier photoFormat", () => {
      const storeNature: Store = { ...baseStore, model: "nature", photoFormat: "portrait" };
      expect(getPhotoAspect(storeNature, "nature")).toBeNull();
    });

    it("E5 Vitrina (layout propio 3:4 fijo) retorna null", () => {
      const storeVitrina: Store = { ...baseStore, model: "vitrina", photoFormat: "square" };
      expect(getPhotoAspect(storeVitrina, "vitrina")).toBeNull();
    });

    it("E5 Bloom Floral (fijo para florerías) no es flexible", () => {
      const storeFloral: Store = {
        ...baseStore,
        model: "bloom",
        niche: "floreria",
        photoFormat: "portrait",
      };
      expect(isFlexiblePhotoLayout("bloom", "floreria")).toBe(false);
      expect(getPhotoAspect(storeFloral, "bloom")).toBeNull();
    });
  });

  describe("E6: Sugerencia de formato al registrarse según rubro (RF-41.6)", () => {
    it("E6 'ropa' sugiere 'portrait'", () => {
      expect(suggestPhotoFormat("ropa")).toBe("portrait");
      expect(suggestPhotoFormat("ROPA")).toBe("portrait");
      expect(suggestPhotoFormat("moda")).toBe("portrait");
      expect(suggestPhotoFormat("boutique")).toBe("portrait");
    });

    it("E6 cualquier otro rubro sugiere 'square'", () => {
      expect(suggestPhotoFormat("comida")).toBe("square");
      expect(suggestPhotoFormat("bisuteria")).toBe("square");
      expect(suggestPhotoFormat("tech")).toBe("square");
      expect(suggestPhotoFormat("servicios")).toBe("square");
      expect(suggestPhotoFormat("general")).toBe("square");
      expect(suggestPhotoFormat(null)).toBe("square");
      expect(suggestPhotoFormat(undefined)).toBe("square");
    });
  });

  describe("E8: Volver al original (reversión a NULL)", () => {
    it("E8 una tienda que tenía 'portrait' vuelve a comportarse como NULL histórico al setear null", () => {
      const storeUpdated: Store = { ...baseStore, model: "grid", photoFormat: null };
      expect(getPhotoAspect(storeUpdated, "grid")).toEqual({ ratio: "4/3", contain: false });
    });
  });

  describe("E11: Recomendación de tamaño (getImageSpec) dice la verdad (RF-41.9)", () => {
    it("E11 Grilla sin formato recomienda Horizontal 4:3", () => {
      const store: Store = { ...baseStore, model: "grid", photoFormat: null };
      const spec = getImageSpec(store);
      expect(spec.ratio).toBe("4/3");
      expect(spec.label).toBe("Horizontal 4:3");
    });

    it("E11 Grilla con 'square' recomienda Cuadrada 1:1", () => {
      const store: Store = { ...baseStore, model: "grid", photoFormat: "square" };
      const spec = getImageSpec(store);
      expect(spec.ratio).toBe("1/1");
      expect(spec.label).toBe("Cuadrada 1:1");
    });

    it("E11 Grilla con 'portrait' recomienda Vertical 3:4", () => {
      const store: Store = { ...baseStore, model: "grid", photoFormat: "portrait" };
      const spec = getImageSpec(store);
      expect(spec.ratio).toBe("3/4");
      expect(spec.label).toBe("Vertical 3:4");
    });

    it("E11 Grilla con 'contain' recomienda Completa (sin recorte)", () => {
      const store: Store = { ...baseStore, model: "grid", photoFormat: "contain" };
      const spec = getImageSpec(store);
      expect(spec.ratio).toBe("1/1");
      expect(spec.label).toBe("Completa (sin recorte)");
    });

    it("E11 Bloom Estándar sin formato recomienda Cuadrada 1:1", () => {
      const store: Store = { ...baseStore, model: "bloom_general", photoFormat: null };
      const spec = getImageSpec(store);
      expect(spec.ratio).toBe("1/1");
      expect(spec.label).toBe("Cuadrada 1:1");
    });

    it("E11 Bloom Estándar con 'portrait' recomienda Vertical 3:4", () => {
      const store: Store = { ...baseStore, model: "bloom_general", photoFormat: "portrait" };
      const spec = getImageSpec(store);
      expect(spec.ratio).toBe("3/4");
      expect(spec.label).toBe("Vertical 3:4");
    });

    it("E11 Vitrina recomienda Vertical 3:4 fija", () => {
      const store: Store = { ...baseStore, model: "vitrina" };
      const spec = getImageSpec(store);
      expect(spec.ratio).toBe("3/4");
      expect(spec.label).toBe("Vertical 3:4");
    });

    it("E11 Nature Orgánico recomienda Cuadrada 1:1", () => {
      const store: Store = { ...baseStore, model: "nature" };
      const spec = getImageSpec(store);
      expect(spec.ratio).toBe("1/1");
      expect(spec.label).toBe("Cuadrada 1:1");
    });

    it("E11 Bite Gastronómico recomienda Cuadrada 1:1", () => {
      const store: Store = { ...baseStore, model: "bite" };
      const spec = getImageSpec(store);
      expect(spec.ratio).toBe("1/1");
      expect(spec.label).toBe("Cuadrada 1:1");
    });
  });
});
