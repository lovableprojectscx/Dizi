import { describe, it, expect } from "vitest";
import {
  getPhotoAspect,
  suggestPhotoFormat,
  isFlexiblePhotoLayout,
} from "../photo-format";
import { getDesignSpec, DESIGN_SPECS } from "../design-catalog";
import { getImageSpec, Store } from "../types";

describe("F41b · Formato de fotos en más diseños (Escenarios E1–E8)", () => {
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

  // E1: Dado cada diseño de la matriz con photo_format = NULL, entonces la proporción es la de "Como hoy"
  describe("E1: Proporción de 'Como hoy' con photo_format = NULL en los 8 diseños de la matriz", () => {
    it("E1 Grilla con NULL retorna 4/3", () => {
      const store: Store = { ...baseStore, model: "grid", photoFormat: null };
      expect(getPhotoAspect(store, "grid")).toEqual({ ratio: "4/3", contain: false });
    });

    it("E1 Bloom Estándar con NULL retorna 1/1", () => {
      const store: Store = { ...baseStore, model: "bloom_general", photoFormat: null };
      expect(getPhotoAspect(store, "bloom_general")).toEqual({ ratio: "1/1", contain: false });
    });

    it("E1 Diagonal con NULL retorna 4/3", () => {
      const store: Store = { ...baseStore, model: "diagonal", photoFormat: null };
      expect(getPhotoAspect(store, "diagonal")).toEqual({ ratio: "4/3", contain: false });
    });

    it("E1 Overlay con NULL retorna 3/4", () => {
      const store: Store = { ...baseStore, model: "overlay", photoFormat: null };
      expect(getPhotoAspect(store, "overlay")).toEqual({ ratio: "3/4", contain: false });
    });

    it("E1 Arch con NULL retorna 3/4", () => {
      const store: Store = { ...baseStore, model: "arch", photoFormat: null };
      expect(getPhotoAspect(store, "arch")).toEqual({ ratio: "3/4", contain: false });
    });

    it("E1 Nature con NULL retorna 1/1", () => {
      const store: Store = { ...baseStore, model: "nature", photoFormat: null };
      expect(getPhotoAspect(store, "nature")).toEqual({ ratio: "1/1", contain: false });
    });

    it("E1 Bite con NULL retorna 1/1", () => {
      const store: Store = { ...baseStore, model: "bite", photoFormat: null };
      expect(getPhotoAspect(store, "bite")).toEqual({ ratio: "1/1", contain: false });
    });

    it("E1 Vitrina con NULL retorna 3/4", () => {
      const store: Store = { ...baseStore, model: "vitrina", photoFormat: null };
      expect(getPhotoAspect(store, "vitrina")).toEqual({ ratio: "3/4", contain: false });
    });

    it("E1 Perfil con NULL retorna 4/3", () => {
      const store: Store = { ...baseStore, model: "perfil", photoFormat: null };
      expect(getPhotoAspect(store, "perfil")).toEqual({ ratio: "4/3", contain: false });
    });

    it("E1 respeta photo_format snake_case de base de datos", () => {
      const storeDb = { ...baseStore, model: "grid", photo_format: null };
      expect(getPhotoAspect(storeDb as any, "grid")).toEqual({ ratio: "4/3", contain: false });
    });
  });

  // E2: Dado Diagonal, Overlay, Arch o Nature con square o portrait, entonces sus tarjetas usan 1:1 o 3:4
  describe("E2: Diagonal, Overlay, Arch o Nature con 'square' o 'portrait'", () => {
    const limitedModels = ["diagonal", "overlay", "arch", "nature"];

    limitedModels.forEach((m) => {
      it(`E2 ${m} con square retorna 1/1`, () => {
        const store: Store = { ...baseStore, model: m, photoFormat: "square" };
        expect(getPhotoAspect(store, m)).toEqual({ ratio: "1/1", contain: false });
      });

      it(`E2 ${m} con portrait retorna 3/4`, () => {
        const store: Store = { ...baseStore, model: m, photoFormat: "portrait" };
        expect(getPhotoAspect(store, m)).toEqual({ ratio: "3/4", contain: false });
      });
    });
  });

  // E3: Dado Diagonal, Overlay, Arch o Nature con contain guardado, entonces se ven como con NULL (RF-41b.3)
  describe("E3: Diagonal, Overlay, Arch o Nature con 'contain' guardado retornan 'Como hoy' (RF-41b.3)", () => {
    it("E3 Diagonal con contain retorna 4/3 ('Como hoy')", () => {
      const store: Store = { ...baseStore, model: "diagonal", photoFormat: "contain" };
      expect(getPhotoAspect(store, "diagonal")).toEqual({ ratio: "4/3", contain: false });
    });

    it("E3 Overlay con contain retorna 3/4 ('Como hoy')", () => {
      const store: Store = { ...baseStore, model: "overlay", photoFormat: "contain" };
      expect(getPhotoAspect(store, "overlay")).toEqual({ ratio: "3/4", contain: false });
    });

    it("E3 Arch con contain retorna 3/4 ('Como hoy')", () => {
      const store: Store = { ...baseStore, model: "arch", photoFormat: "contain" };
      expect(getPhotoAspect(store, "arch")).toEqual({ ratio: "3/4", contain: false });
    });

    it("E3 Nature con contain retorna 1/1 ('Como hoy')", () => {
      const store: Store = { ...baseStore, model: "nature", photoFormat: "contain" };
      expect(getPhotoAspect(store, "nature")).toEqual({ ratio: "1/1", contain: false });
    });
  });

  // E4: Dado Bite o Vitrina con contain, entonces la foto se ve completa, sin recorte
  describe("E4: Bite, Vitrina, Grilla y Bloom con 'contain' retornan 1/1 contain: true", () => {
    const threeOptionModels = ["bite", "vitrina", "grid", "bloom_general"];

    threeOptionModels.forEach((m) => {
      it(`E4 ${m} con contain retorna 1/1 contain: true`, () => {
        const store: Store = { ...baseStore, model: m, photoFormat: "contain" };
        expect(getPhotoAspect(store, m)).toEqual({ ratio: "1/1", contain: true });
      });
    });
  });

  // E5: Dado el selector en Diagonal, Overlay, Arch o Nature, solo Cuadrada y Vertical. En Grilla, Bloom, Bite y Vitrina las 3
  describe("E5: Opciones permitidas en DESIGN_SPECS (2 opciones vs 3 opciones)", () => {
    it("E5 Diagonal, Overlay, Arch y Nature permiten exactamente ['square', 'portrait']", () => {
      expect(getDesignSpec("diagonal").formatosFoto).toEqual(["square", "portrait"]);
      expect(getDesignSpec("overlay").formatosFoto).toEqual(["square", "portrait"]);
      expect(getDesignSpec("arch").formatosFoto).toEqual(["square", "portrait"]);
      expect(getDesignSpec("nature").formatosFoto).toEqual(["square", "portrait"]);
    });

    it("E5 Grilla, Bloom, Bite y Vitrina permiten exactamente ['square', 'portrait', 'contain']", () => {
      expect(getDesignSpec("grid").formatosFoto).toEqual(["square", "portrait", "contain"]);
      expect(getDesignSpec("bloom_general").formatosFoto).toEqual(["square", "portrait", "contain"]);
      expect(getDesignSpec("bite").formatosFoto).toEqual(["square", "portrait", "contain"]);
      expect(getDesignSpec("vitrina").formatosFoto).toEqual(["square", "portrait", "contain"]);
    });
  });

  // E6: Dado una tienda con contain en Grilla, cuando cambia a Overlay se ve como Overlay de hoy. Cuando vuelve a Grilla, Completa.
  describe("E6: Protección al cambiar de diseño sin borrar valor guardado (RF-41b.3)", () => {
    it("E6 con photoFormat='contain' guardado: en Grilla es Completa, en Overlay es 3/4, al volver a Grilla es Completa", () => {
      const storeWithContain: Store = {
        ...baseStore,
        photoFormat: "contain",
      };

      // 1. En Grilla: contain es permitido
      expect(getPhotoAspect(storeWithContain, "grid")).toEqual({ ratio: "1/1", contain: true });

      // 2. Al cambiar temporalmente el diseño a Overlay: contain no es permitido -> retorna 3/4 ("como hoy")
      expect(getPhotoAspect(storeWithContain, "overlay")).toEqual({ ratio: "3/4", contain: false });

      // 3. Al volver a Grilla: el valor "contain" sigue intacto en store -> vuelve a ser Completa
      expect(storeWithContain.photoFormat).toBe("contain");
      expect(getPhotoAspect(storeWithContain, "grid")).toEqual({ ratio: "1/1", contain: true });
    });
  });

  // E7: Dado Bloom Floral, Lookbook u otro diseño fuera de la matriz con cualquier formato, se ve igual que con NULL
  describe("E7: Diseños no flexibles fuera de la matriz ignoran photo_format", () => {
    it("E7 Bloom Floral (bloom con niche floreria) retorna null (no es flexible)", () => {
      const storeFloral: Store = {
        ...baseStore,
        model: "bloom",
        niche: "floreria",
        photoFormat: "portrait",
      };
      expect(isFlexiblePhotoLayout("bloom", "floreria")).toBe(false);
      expect(getPhotoAspect(storeFloral, "bloom")).toBeNull();
    });

    it("E7 Lookbook retorna null", () => {
      const storeLookbook: Store = { ...baseStore, model: "lookbook", photoFormat: "square" };
      expect(isFlexiblePhotoLayout("lookbook")).toBe(false);
      expect(getPhotoAspect(storeLookbook, "lookbook")).toBeNull();
    });

    it("E7 Hero, Spotlight, Editorial, Tiles, Magazine y Banner Grid no son flexibles", () => {
      const nonFlexible = ["hero", "spotlight", "editorial", "tiles", "magazine", "banner_grid"];
      nonFlexible.forEach((m) => {
        expect(isFlexiblePhotoLayout(m)).toBe(false);
        expect(getPhotoAspect({ ...baseStore, model: m, photoFormat: "portrait" }, m)).toBeNull();
      });
    });
  });

  // E8: Dado cada diseño de la matriz y cada formato permitido, getImageSpec recomienda la misma proporción que se dibuja
  describe("E8: getImageSpec recomienda la proporción efectiva real", () => {
    it("E8 Grilla con 'portrait' recomienda 3/4", () => {
      const store: Store = { ...baseStore, model: "grid", photoFormat: "portrait" };
      const spec = getImageSpec(store);
      expect(spec.ratio).toBe("3/4");
    });

    it("E8 Vitrina con 'square' recomienda 1/1", () => {
      const store: Store = { ...baseStore, model: "vitrina", photoFormat: "square" };
      const spec = getImageSpec(store);
      expect(spec.ratio).toBe("1/1");
    });

    it("E8 Nature con 'portrait' recomienda 3/4", () => {
      const store: Store = { ...baseStore, model: "nature", photoFormat: "portrait" };
      const spec = getImageSpec(store);
      expect(spec.ratio).toBe("3/4");
    });

    it("E8 Bite con 'contain' recomienda 1/1 Completa", () => {
      const store: Store = { ...baseStore, model: "bite", photoFormat: "contain" };
      const spec = getImageSpec(store);
      expect(spec.ratio).toBe("1/1");
      expect(spec.label).toContain("Completa");
    });

    it("E8 Overlay con 'contain' (no permitido) recomienda su proporción base 3/4", () => {
      const store: Store = { ...baseStore, model: "overlay", photoFormat: "contain" };
      const spec = getImageSpec(store);
      expect(spec.ratio).toBe("3/4");
    });

    it("E8 Grilla con NULL recomienda 4/3", () => {
      const store: Store = { ...baseStore, model: "grid", photoFormat: null };
      const spec = getImageSpec(store);
      expect(spec.ratio).toBe("4/3");
    });

    it("E8 Perfil con NULL recomienda 4/3", () => {
      const store: Store = { ...baseStore, model: "perfil", photoFormat: null };
      const spec = getImageSpec(store);
      expect(spec.ratio).toBe("4/3");
    });
  });

  // Registro y sugerencia por rubro (RF-41.6 / RF-41b.5)
  describe("Sugerencia de formato al registrarse según rubro (RF-41b.5)", () => {
    it("Rubros 'ropa', 'moda', 'boutique' sugieren 'portrait'", () => {
      expect(suggestPhotoFormat("ropa")).toBe("portrait");
      expect(suggestPhotoFormat("ROPA")).toBe("portrait");
      expect(suggestPhotoFormat("moda")).toBe("portrait");
      expect(suggestPhotoFormat("boutique")).toBe("portrait");
    });

    it("Cualquier otro rubro sugiere 'square'", () => {
      expect(suggestPhotoFormat("comida")).toBe("square");
      expect(suggestPhotoFormat("bisuteria")).toBe("square");
      expect(suggestPhotoFormat("tech")).toBe("square");
      expect(suggestPhotoFormat("servicios")).toBe("square");
      expect(suggestPhotoFormat("general")).toBe("square");
      expect(suggestPhotoFormat(null)).toBe("square");
      expect(suggestPhotoFormat(undefined)).toBe("square");
    });
  });
});
