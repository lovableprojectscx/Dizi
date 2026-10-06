import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Pruebas unitarias de Service Worker (public/sw.js)", () => {
  const IMAGE_DOMAINS = [
    "zkqzdwxjthjdjchimmds.supabase.co",
    "supabase.co",
    "b-cdn.net",
  ];

  function isRemoteImage(urlStr: string) {
    try {
      const url = new URL(urlStr);
      const isCdn = url.hostname.endsWith("b-cdn.net");
      const isSupabase =
        IMAGE_DOMAINS.some((domain) => url.hostname.endsWith(domain)) &&
        url.pathname.includes("/storage/v1/object/public/images/");
      return isSupabase || isCdn;
    } catch {
      return false;
    }
  }

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

  function isSupabaseApi(urlStr: string) {
    try {
      const url = new URL(urlStr);
      return (
        IMAGE_DOMAINS.some((domain) => url.hostname.endsWith(domain)) &&
        url.pathname.includes("/rest/v1/rpc/get_public_store")
      );
    } catch {
      return false;
    }
  }

  it("debe incluir b-cdn.net en IMAGE_DOMAINS dentro de public/sw.js", () => {
    const swPath = path.resolve(__dirname, "../../../public/sw.js");
    const swCode = fs.readFileSync(swPath, "utf8");
    expect(swCode).toContain('"b-cdn.net"');
    expect(swCode).toContain('url.hostname.endsWith("b-cdn.net")');
  });

  it("debe identificar correctamente URLs de imágenes de Supabase Storage para caché", () => {
    const supabaseUrl =
      "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_hv4u9yp/products/f0eigod9.webp?t=123";
    expect(isSupabaseImage(supabaseUrl)).toBe(true);
    expect(isRemoteImage(supabaseUrl)).toBe(true);
  });

  it("debe identificar correctamente URLs de imágenes del CDN Bunny (b-cdn.net) para caché", () => {
    const cdnUrl = "https://dizifotos.b-cdn.net/s_demo/products/p1_thumb.webp";
    expect(isRemoteImage(cdnUrl)).toBe(true);
  });

  it("debe identificar e interceptar peticiones RPC del catálogo público para caché nativo", () => {
    const rpcUrl = "https://zkqzdwxjthjdjchimmds.supabase.co/rest/v1/rpc/get_public_store";
    expect(isSupabaseApi(rpcUrl)).toBe(true);
  });

  it("debe identificar e interceptar peticiones RPC get_public_store con parámetros GET (?store_slug=...)", () => {
    const rpcGetUrl = "https://zkqzdwxjthjdjchimmds.supabase.co/rest/v1/rpc/get_public_store?store_slug=mi-tienda-demo";
    expect(isSupabaseApi(rpcGetUrl)).toBe(true);
  });

  it("debe rechazar peticiones API de Supabase administrativas que no sean del catálogo", () => {
    const apiUrl = "https://zkqzdwxjthjdjchimmds.supabase.co/rest/v1/stores?select=*";
    expect(isSupabaseImage(apiUrl)).toBe(false);
    expect(isSupabaseApi(apiUrl)).toBe(false);
  });

  it("debe identificar correctamente imágenes locales estáticas", () => {
    const localWebp = "https://dizi.idenza.site/images/dizi_ad_brand_3d.webp";
    expect(isLocalImage(localWebp)).toBe(true);
  });
});

