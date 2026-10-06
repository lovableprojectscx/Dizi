import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  toCdnUrl,
  toSupabaseUrl,
  getThumbnailUrl,
  getOptimizedImageUrl,
  cleanImageCandidates,
  NO_IMAGE_PLACEHOLDER,
  SUPABASE_STORAGE_IMAGES_PREFIX,
} from "../image-utils";

describe("CDN Bunny (Pull Zone) - toCdnUrl, toSupabaseUrl y getThumbnailUrl", () => {
  const originalEnv = import.meta.env.VITE_IMAGE_CDN_BASE;

  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("1. Interruptor apagado: Si VITE_IMAGE_CDN_BASE está vacío, devuelve la URL original intacta", () => {
    vi.stubEnv("VITE_IMAGE_CDN_BASE", "");

    const supUrl = `${SUPABASE_STORAGE_IMAGES_PREFIX}s_jhoselyn/products/p1.webp`;
    expect(toCdnUrl(supUrl)).toBe(supUrl);

    const thumbUrl = getThumbnailUrl(supUrl);
    expect(thumbUrl).toBe(`${SUPABASE_STORAGE_IMAGES_PREFIX}s_jhoselyn/products/p1_thumb.webp`);
  });

  it("2. Plan A (https://<cdn>): Convierte la URL de Supabase al CDN y remueve query params (?t=...)", () => {
    vi.stubEnv("VITE_IMAGE_CDN_BASE", "https://dizifotos.b-cdn.net");

    const supUrlWithQuery = `${SUPABASE_STORAGE_IMAGES_PREFIX}s_ahorro/products/prod1.webp?t=1789456`;
    const cdnUrl = toCdnUrl(supUrlWithQuery);

    expect(cdnUrl).toBe("https://dizifotos.b-cdn.net/s_ahorro/products/prod1.webp");
    expect(cdnUrl).not.toContain("?");
    expect(cdnUrl).not.toContain("supabase.co");
  });

  it("3. Plan B (https://<cdn>/storage/v1/object/public/images): Respeta bases con ruta prefijada", () => {
    vi.stubEnv("VITE_IMAGE_CDN_BASE", "https://dizifotos.b-cdn.net/storage/v1/object/public/images");

    const supUrl = `${SUPABASE_STORAGE_IMAGES_PREFIX}s_ahorro/products/prod1.webp`;
    const cdnUrl = toCdnUrl(supUrl);

    expect(cdnUrl).toBe("https://dizifotos.b-cdn.net/storage/v1/object/public/images/s_ahorro/products/prod1.webp");
  });

  it("4. URLs especiales (base64, blob, externas): No se modifican ni se rompen", () => {
    vi.stubEnv("VITE_IMAGE_CDN_BASE", "https://dizifotos.b-cdn.net");

    const base64 = "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAQAcJaQAA3AA/v39gA==";
    expect(toCdnUrl(base64)).toBe(base64);

    const blobUrl = "blob:https://dizi.idenza.site/1234-5678";
    expect(toCdnUrl(blobUrl)).toBe(blobUrl);

    const extUrl = "https://images.unsplash.com/photo-1234?w=400";
    expect(toCdnUrl(extUrl)).toBe(extUrl);
  });

  it("5. toSupabaseUrl revierte URLs de CDN a su ruta canónica en Supabase Storage", () => {
    vi.stubEnv("VITE_IMAGE_CDN_BASE", "https://dizifotos.b-cdn.net");

    const cdnUrl = "https://dizifotos.b-cdn.net/s_ahorro/products/prod1_thumb.webp";
    const supUrl = toSupabaseUrl(cdnUrl);

    expect(supUrl).toBe(`${SUPABASE_STORAGE_IMAGES_PREFIX}s_ahorro/products/prod1_thumb.webp`);
  });

  it("6. getThumbnailUrl con CDN activo devuelve la URL del CDN terminada en _thumb.webp", () => {
    vi.stubEnv("VITE_IMAGE_CDN_BASE", "https://dizifotos.b-cdn.net");

    const origUrl = `${SUPABASE_STORAGE_IMAGES_PREFIX}s_adornia/products/anillo.webp`;
    const thumbUrl = getThumbnailUrl(origUrl);

    expect(thumbUrl).toBe("https://dizifotos.b-cdn.net/s_adornia/products/anillo_thumb.webp");
  });

  it("7. getOptimizedImageUrl con CDN activo devuelve la URL del CDN limpia", () => {
    vi.stubEnv("VITE_IMAGE_CDN_BASE", "https://dizifotos.b-cdn.net");

    const origUrl = `${SUPABASE_STORAGE_IMAGES_PREFIX}s_adornia/banners/banner_0_abc.webp?t=999`;
    const optUrl = getOptimizedImageUrl(origUrl, 800);

    expect(optUrl).toBe("https://dizifotos.b-cdn.net/s_adornia/banners/banner_0_abc.webp");
  });

  it("8. cleanImageCandidates incluye fallback a Supabase cuando se incluye una URL de CDN", () => {
    vi.stubEnv("VITE_IMAGE_CDN_BASE", "https://dizifotos.b-cdn.net");

    const cdnThumb = "https://dizifotos.b-cdn.net/s_ahorro/products/p1_thumb.webp";
    const supOrig = `${SUPABASE_STORAGE_IMAGES_PREFIX}s_ahorro/products/p1.webp`;

    const candidates = [cdnThumb, supOrig, NO_IMAGE_PLACEHOLDER];
    const cleaned = cleanImageCandidates(candidates);

    // Debe insertar la miniatura de Supabase tras la miniatura de CDN
    const supThumb = `${SUPABASE_STORAGE_IMAGES_PREFIX}s_ahorro/products/p1_thumb.webp`;
    expect(cleaned).toEqual([cdnThumb, supThumb, supOrig, NO_IMAGE_PLACEHOLDER]);
  });

  it("9. CSP en vercel.json: b-cdn.net está incluido en img-src y en connect-src para fetch() del service worker", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const vercelConfigPath = path.resolve(__dirname, "../../../vercel.json");
    const content = fs.readFileSync(vercelConfigPath, "utf-8");
    const vercelJson = JSON.parse(content);

    const allHeaders = (vercelJson.headers || []).flatMap((h: any) => h.headers || []);
    const cspHeader = allHeaders.find(
      (h: any) => h.key === "Content-Security-Policy-Report-Only" || h.key === "Content-Security-Policy",
    );
    expect(cspHeader).toBeDefined();

    const cspValue: string = cspHeader.value;
    const directives = Object.fromEntries(
      cspValue
        .split(";")
        .map((d) => d.trim())
        .filter(Boolean)
        .map((d) => {
          const [name, ...vals] = d.split(/\s+/);
          return [name, vals.join(" ")];
        }),
    );

    // img-src debe incluir *.b-cdn.net
    expect(directives["img-src"]).toContain("https://*.b-cdn.net");

    // connect-src debe incluir *.b-cdn.net (necesario para fetch() en sw.js)
    expect(directives["connect-src"]).toContain("https://*.b-cdn.net");
  });
});

