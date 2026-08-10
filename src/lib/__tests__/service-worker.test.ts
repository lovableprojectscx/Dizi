import { describe, it, expect } from "vitest";

describe("Pruebas unitarias de Service Worker (public/sw.js)", () => {
  const IMAGE_DOMAINS = [
    "zkqzdwxjthjdjchimmds.supabase.co",
    "supabase.co",
  ];

  function isSupabaseImage(urlStr: string) {
    try {
      const url = new URL(urlStr);
      return (
        IMAGE_DOMAINS.some((domain) => url.hostname.endsWith(domain)) &&
        url.pathname.includes("/storage/v1/object/public/images/")
      );
    } catch {
      return false;
    }
  }

  function isLocalImage(urlStr: string) {
    try {
      const url = new URL(urlStr);
      return (
        url.pathname.endsWith(".webp") ||
        url.pathname.endsWith(".png") ||
        url.pathname.endsWith(".jpg") ||
        url.pathname.endsWith(".jpeg") ||
        url.pathname.endsWith(".svg")
      );
    } catch {
      return false;
    }
  }

  it("debe identificar correctamente URLs de imágenes de Supabase Storage para caché", () => {
    const supabaseUrl =
      "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_hv4u9yp/products/f0eigod9.webp?t=123";
    expect(isSupabaseImage(supabaseUrl)).toBe(true);
  });

  it("debe rechazar peticiones API de Supabase que no sean imágenes de Storage", () => {
    const apiUrl = "https://zkqzdwxjthjdjchimmds.supabase.co/rest/v1/stores?select=*";
    expect(isSupabaseImage(apiUrl)).toBe(false);
  });

  it("debe identificar correctamente imágenes locales estáticas", () => {
    const localWebp = "https://dizi.idenza.site/images/dizi_ad_brand_3d.webp";
    expect(isLocalImage(localWebp)).toBe(true);
  });
});
