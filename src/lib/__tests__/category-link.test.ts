import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  categorySlug,
  findCategoryByParam,
  getCategorySlug,
  buildStoreUrl,
  cleanCategoryName,
} from "../category-link";

describe("categorySlug (F25 / Fase 4A)", () => {
  it("procesa los 6 ejemplos reales y casos de borde", () => {
    // 1. Con & y sufijo de ícono
    expect(categorySlug("Flores & follajes|flower")).toBe("flores-follajes");

    // 2. Con tilde, emojis y sufijo
    expect(categorySlug("Cerámica 🇵🇪|flower")).toBe("ceramica");

    // 3. Mayúsculas con tilde y sufijo
    expect(categorySlug("PAÑUELOS|gem")).toBe("panuelos");

    // 4. Guiones existentes y espacios
    expect(categorySlug("Manga Corta - Cuello Uve|shirt")).toBe("manga-corta-cuello-uve");

    // 5. Con tildes compuestas y &
    expect(categorySlug("Bebidas & Coctelería|wine")).toBe("bebidas-cocteleria");

    // 6. Sin sufijo de ícono y con espacios
    expect(categorySlug("Ropa de Baño")).toBe("ropa-de-bano");

    // Caso de borde: nombre vacío con id de fallback
    expect(categorySlug("", "cat_fallback_1")).toBe("cat_fallback_1");
    expect(categorySlug(null, "cat_fallback_2")).toBe("cat_fallback_2");

    // Caso de borde: solo emojis (se eliminan todos los caracteres alfanuméricos)
    expect(categorySlug("🇵🇪🔥✨", "cat_emoji_id")).toBe("cat_emoji_id");
  });

  it("cleanCategoryName extrae el nombre legible sin el ícono", () => {
    expect(cleanCategoryName("Flores & follajes|flower")).toBe("Flores & follajes");
    expect(cleanCategoryName("Cerámica 🇵🇪|flower")).toBe("Cerámica 🇵🇪");
    expect(cleanCategoryName("Sin icono")).toBe("Sin icono");
  });
});

describe("findCategoryByParam (F25 / Fase 4A)", () => {
  const categories = [
    { id: "c_1", name: "Flores & follajes|flower" },
    { id: "c_2", name: "Cerámica 🇵🇪|flower" },
    { id: "c_3", name: "Ropa de Verano|sun" },
    // Slugs duplicados intencionales para verificar resolución
    { id: "c_dup_1", name: "Vestidos|sparkles" },
    { id: "c_dup_2", name: "Vestidos|shirt" },
  ];

  it("encuentra categoría por slug", () => {
    const found = findCategoryByParam(categories, "flores-follajes");
    expect(found).not.toBeNull();
    expect(found?.id).toBe("c_1");
  });

  it("encuentra categoría por id directo", () => {
    const found = findCategoryByParam(categories, "c_2");
    expect(found).not.toBeNull();
    expect(found?.id).toBe("c_2");
  });

  it("reconoce 'ofertas' y devuelve el objeto especial { id: 'sale', name: 'Ofertas' }", () => {
    const found = findCategoryByParam(categories, "ofertas");
    expect(found).toEqual({ id: "sale", name: "Ofertas" });

    const foundUpper = findCategoryByParam(categories, "OFERTAS");
    expect(foundUpper).toEqual({ id: "sale", name: "Ofertas" });
  });

  it("retorna null para categoría inexistente o parámetro vacío", () => {
    expect(findCategoryByParam(categories, "categoria-que-no-existe")).toBeNull();
    expect(findCategoryByParam(categories, "")).toBeNull();
    expect(findCategoryByParam(categories, null)).toBeNull();
  });

  it("resuelve slugs duplicados usando el id para la segunda categoría", () => {
    // La primera categoría 'Vestidos' toma el slug 'vestidos'
    const foundFirst = findCategoryByParam(categories, "vestidos");
    expect(foundFirst?.id).toBe("c_dup_1");

    // La segunda categoría 'Vestidos' usa su id 'c_dup_2'
    const foundSecond = findCategoryByParam(categories, "c_dup_2");
    expect(foundSecond?.id).toBe("c_dup_2");

    expect(getCategorySlug(categories, categories[3])).toBe("vestidos");
    expect(getCategorySlug(categories, categories[4])).toBe("c_dup_2");
  });
});

describe("buildStoreUrl (F25 / Fase 4A)", () => {
  it("arma URLs sin parámetros adicionales", () => {
    const url = buildStoreUrl("catalogo", { origin: "https://dizi.site" });
    expect(url).toBe("https://dizi.site/t/catalogo");
  });

  it("arma URLs con parámetro de categoría ?c=", () => {
    const url = buildStoreUrl("catalogo", {
      c: "flores-follajes",
      origin: "https://dizi.site",
    });
    expect(url).toBe("https://dizi.site/t/catalogo?c=flores-follajes");
  });

  it("arma URLs con parámetro de producto ?p=", () => {
    const url = buildStoreUrl("catalogo", {
      p: "prod_123",
      origin: "https://dizi.site",
    });
    expect(url).toBe("https://dizi.site/t/catalogo?p=prod_123");
  });

  it("arma URLs con categoría y producto juntos", () => {
    const url = buildStoreUrl("catalogo", {
      c: "flores-follajes",
      p: "prod_123",
      origin: "https://dizi.site",
    });
    expect(url).toBe("https://dizi.site/t/catalogo?c=flores-follajes&p=prod_123");
  });

  it("conserva el parámetro ref explícito", () => {
    const url = buildStoreUrl("catalogo", {
      c: "ceramica",
      ref: "influencer1",
      origin: "https://dizi.site",
    });
    expect(url).toBe("https://dizi.site/t/catalogo?ref=influencer1&c=ceramica");
  });

  it("usa fallback de dominio dizi.idenza.site si no hay origin provisto ni window", () => {
    const url = buildStoreUrl("adornia");
    expect(url.startsWith("https://dizi.idenza.site/t/adornia")).toBe(true);
  });
});
