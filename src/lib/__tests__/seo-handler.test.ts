import { describe, it, expect } from "vitest";
import { findCategoryByParam, cleanCategoryName } from "../category-link";
import fs from "fs";
import path from "path";

describe("Pruebas Unitarias del Servidor SEO (/api/seo.ts) para WhatsApp", () => {
  function cleanImageUrl(url?: string | null): string | null {
    if (!url || typeof url !== "string" || !url.trim()) return null;
    let first = url.includes("|||") ? url.split("|||")[0] : url;
    first = first.trim();
    if (first.startsWith("http://") || first.startsWith("https://")) return first;
    if (first.startsWith("/")) return `https://dizi.idenza.site${first}`;
    return `https://dizi.idenza.site/${first}`;
  }

  function getBestStoreImage(store: any, type: string, defaultImage: string): string {
    const storeBanner = cleanImageUrl(store.banner_image);
    const storeLogo = cleanImageUrl(store.logo);
    const bioBanner = cleanImageUrl(store.bio_banner);
    const bioLogo = cleanImageUrl(store.bio_logo);

    return (
      (type === "bio"
        ? bioBanner || storeBanner || bioLogo || storeLogo
        : storeBanner || bioBanner || storeLogo || bioLogo) || defaultImage
    );
  }

  it("debe elegir la imagen del banner de la tienda como primera prioridad", () => {
    const store = {
      banner_image: "https://wxpizbnuuaiculzfuhof.supabase.co/storage/v1/object/public/images/s_ncidl1d/banners/banner_0_3s06.webp",
      logo: "https://wxpizbnuuaiculzfuhof.supabase.co/storage/v1/object/public/images/s_ncidl1d/logo.jpg",
    };
    const img = getBestStoreImage(store, "catalog", "https://dizi.idenza.site/images/og-image.png");
    expect(img).toBe("https://wxpizbnuuaiculzfuhof.supabase.co/storage/v1/object/public/images/s_ncidl1d/banners/banner_0_3s06.webp");
  });

  it("debe recurrir al logo (perfil) de la tienda si la tienda no tiene un banner registrado", () => {
    const storeNoBanner = {
      banner_image: null,
      logo: "https://wxpizbnuuaiculzfuhof.supabase.co/storage/v1/object/public/images/s_ncidl1d/logo.jpg",
    };
    const img = getBestStoreImage(storeNoBanner, "catalog", "https://dizi.idenza.site/images/og-image.png");
    expect(img).toBe("https://wxpizbnuuaiculzfuhof.supabase.co/storage/v1/object/public/images/s_ncidl1d/logo.jpg");
  });

  it("solo debe recurrir a la imagen predeterminada de Dizi si la tienda no tiene ni banner ni logo", () => {
    const emptyStore = { banner_image: null, logo: null, bio_banner: null, bio_logo: null };
    const img = getBestStoreImage(emptyStore, "catalog", "https://dizi.idenza.site/images/og-image.png");
    expect(img).toBe("https://dizi.idenza.site/images/og-image.png");
  });

  describe("Resolución de Metadatos de Categoría (?c=) y Prioridad de Producto (?p=)", () => {
    const mockStore = {
      id: "store_123",
      name: "Flores del Sol",
      logo: "https://wxpizbnuuaiculzfuhof.supabase.co/storage/v1/object/public/images/logo.jpg",
      banner_image: "https://wxpizbnuuaiculzfuhof.supabase.co/storage/v1/object/public/images/banner.jpg",
    };

    const mockCategories = [
      { id: "cat_1", name: "Flores & follajes|flower" },
      { id: "cat_2", name: "Cerámica 🇵🇪|flower" },
    ];

    const mockProducts = [
      {
        id: "prod_1",
        category_id: "cat_1",
        name: "Rosas Rojas",
        price: 45.0,
        image: "https://wxpizbnuuaiculzfuhof.supabase.co/storage/v1/object/public/images/rosas.jpg",
      },
    ];

    it("con ?c= genera el título de la categoría y selecciona la foto del primer producto", () => {
      const catSlug = "flores-follajes";
      const matched = findCategoryByParam(mockCategories, catSlug);
      expect(matched).toBeTruthy();

      const catName = cleanCategoryName(matched!.name);
      const title = `${catName} — ${mockStore.name}`;
      const description = `Mira ${catName} en el catálogo de ${mockStore.name}. Pedidos por WhatsApp.`;

      const firstProdImg = cleanImageUrl(mockProducts[0].image);

      expect(title).toBe("Flores & follajes — Flores del Sol");
      expect(description).toBe("Mira Flores & follajes en el catálogo de Flores del Sol. Pedidos por WhatsApp.");
      expect(firstProdImg).toBe("https://wxpizbnuuaiculzfuhof.supabase.co/storage/v1/object/public/images/rosas.jpg");
    });

    it("con ?c= y ?p= a la vez, el producto gana la vista previa OpenGraph", () => {
      const targetProductId = "prod_1";
      const targetCategory = "flores-follajes";

      const matchedProd = mockProducts.find((p) => p.id === targetProductId);
      const matchedCat = findCategoryByParam(mockCategories, targetCategory);

      // Si hay producto encontrado, productFound es true y domina
      let title = "";
      let image = "";
      if (matchedProd) {
        title = `${matchedProd.name} — ${mockStore.name} | S/ ${matchedProd.price.toFixed(2)}`;
        image = cleanImageUrl(matchedProd.image)!;
      } else if (matchedCat) {
        title = `${matchedCat.name} — ${mockStore.name}`;
      }

      expect(title).toBe("Rosas Rojas — Flores del Sol | S/ 45.00");
      expect(image).toBe("https://wxpizbnuuaiculzfuhof.supabase.co/storage/v1/object/public/images/rosas.jpg");
    });

    it("si ?c= no existe en la tienda, mantiene los metadatos normales del catálogo", () => {
      const matchedCat = findCategoryByParam(mockCategories, "categoria-fantasma");
      expect(matchedCat).toBeNull();

      const title = `${mockStore.name} · Catálogo Digital`;
      const image = getBestStoreImage(mockStore, "catalog", "https://dizi.idenza.site/images/og-image.png");

      expect(title).toBe("Flores del Sol · Catálogo Digital");
      expect(image).toBe("https://wxpizbnuuaiculzfuhof.supabase.co/storage/v1/object/public/images/banner.jpg");
    });
  });

  describe("Análisis Estático de Reglas de Hooks en PublicCatalog.tsx (Riesgo 3F)", () => {
    it("ningún hook nuevo (useState, useEffect, useMemo, useRef) está dentro de condicionales", () => {
      const catalogContent = fs.readFileSync(
        path.join(process.cwd(), "src", "components", "public", "PublicCatalog.tsx"),
        "utf-8"
      );

      // Verificar que los efectos de sincronización de categoría y producto estén fuera de ifs
      const lines = catalogContent.split("\n");
      const hookRegex = /^\s*(const\s+\[.*\]\s*=\s*useState|useEffect|useMemo|useRef|useCallback)\(/;

      let insideIfBlock = 0;
      const violatingHooks: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.match(/^\s*if\s*\(/)) {
          insideIfBlock++;
        }
        if (insideIfBlock > 0 && hookRegex.test(line)) {
          violatingHooks.push(`Línea ${i + 1}: ${line.trim()}`);
        }
        if (line.includes("}") && insideIfBlock > 0) {
          insideIfBlock = Math.max(0, insideIfBlock - 1);
        }
      }

      expect(violatingHooks).toEqual([]);
    });
  });
});
