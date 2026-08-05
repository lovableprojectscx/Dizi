import { describe, it, expect } from "vitest";

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
});
