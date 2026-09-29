import { describe, it, expect } from "vitest";
import {
  SHOWCASE_REGISTER_ITEMS,
  SHOWCASE_LANDING_ITEM,
  ALL_SHOWCASE_ITEMS,
  getShowcaseUrl,
} from "../showcase";

describe("Showcase / Vitrinas de Comercios (Bug B8)", () => {
  it("no contiene slugs repetidos en las listas de vitrinas", () => {
    const slugs = ALL_SHOWCASE_ITEMS.map((item) => item.slug);
    const uniqueSlugs = new Set(slugs);
    expect(slugs.length).toBe(uniqueSlugs.size);

    const registerSlugs = SHOWCASE_REGISTER_ITEMS.map((item) => item.slug);
    const uniqueRegisterSlugs = new Set(registerSlugs);
    expect(registerSlugs.length).toBe(uniqueRegisterSlugs.size);
  });

  it("cada elemento tiene campos válidos y no vacíos", () => {
    for (const item of ALL_SHOWCASE_ITEMS) {
      expect(item.id.trim()).not.toBe("");
      expect(item.name.trim()).not.toBe("");
      expect(item.desc.trim()).not.toBe("");
      expect(item.slug.trim()).not.toBe("");
      expect(["bio", "t"]).toContain(item.route);
    }
  });

  it("la tarjeta de WeHome usa el slug 'catalogo' y el nombre 'Adornia · We Home'", () => {
    const wehome = SHOWCASE_REGISTER_ITEMS.find((item) => item.id === "wehome");
    expect(wehome).toBeDefined();
    expect(wehome?.slug).toBe("catalogo");
    expect(wehome?.name).toBe("Adornia · We Home");
    expect(wehome?.route).toBe("bio");
    expect(getShowcaseUrl(wehome!)).toBe("/bio/catalogo");
  });

  it("getShowcaseUrl genera la ruta relativa correcta", () => {
    expect(getShowcaseUrl({ route: "bio", slug: "floreria-demo" })).toBe("/bio/floreria-demo");
    expect(getShowcaseUrl({ route: "t", slug: "grano-miga" })).toBe("/t/grano-miga");
    expect(getShowcaseUrl(SHOWCASE_LANDING_ITEM)).toBe("/t/grano-miga");
  });
});
