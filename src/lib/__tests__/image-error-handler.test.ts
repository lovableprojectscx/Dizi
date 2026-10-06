import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  handleImageError,
  cleanImageCandidates,
  NO_IMAGE_PLACEHOLDER,
} from "../image-utils";

function createMockImg(initialSrc: string = "") {
  const attrs: Record<string, string> = {};
  return {
    src: initialSrc,
    onerror: null as any,
    getAttribute(name: string) {
      return attrs[name] ?? null;
    },
    setAttribute(name: string, value: string) {
      attrs[name] = value;
    },
  };
}

describe("HOTFIX: Manejador resiliente de errores de imagen y fallback en cascada", () => {
  it("1. Miniatura falla -> src pasa a la original; original falla -> placeholder; placeholder falla -> no cambia nada (sin bucle)", () => {
    const thumbUrl =
      "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_ahorro/products/prod1_thumb.webp";
    const origUrl =
      "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_ahorro/products/prod1.webp";
    const candidates = [thumbUrl, origUrl, NO_IMAGE_PLACEHOLDER];

    const img = createMockImg(thumbUrl);

    // 1er fallo: miniatura no existe o 404 -> avanza a la original
    handleImageError({ currentTarget: img } as any, candidates);
    expect(img.src).toBe(origUrl);
    expect(img.getAttribute("data-img-step")).toBe("1");

    // 2do fallo: original tampoco existe -> avanza al placeholder neutro
    handleImageError({ currentTarget: img } as any, candidates);
    expect(img.src).toContain(NO_IMAGE_PLACEHOLDER);
    expect(img.getAttribute("data-img-step")).toBe("2");

    // 3er fallo: placeholder falla o re-dispara -> no cambia nada, bucle detenido
    const srcAtPlaceholder = img.src;
    handleImageError({ currentTarget: img } as any, candidates);
    expect(img.src).toBe(srcAtPlaceholder);
    expect(img.getAttribute("data-img-step")).toBe("2");
  });

  it("2. Lista con vacíos y repetidos -> se limpian", () => {
    const thumb =
      "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_demo/p1_thumb.webp";
    const orig =
      "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_demo/p1.webp";

    const rawCandidates = [
      thumb,
      "",
      null,
      undefined,
      "   ",
      thumb,
      orig,
      orig,
      NO_IMAGE_PLACEHOLDER,
    ];

    const cleaned = cleanImageCandidates(rawCandidates);
    expect(cleaned).toEqual([thumb, orig, NO_IMAGE_PLACEHOLDER]);
  });

  it("3. URL base64 / externa -> se respeta", () => {
    const base64Img =
      "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAQAcJaQAA3AA/v39gA==";
    const externalUrl =
      "https://cdn.externo.com/catalogo/foto-hd.jpg?w=800&q=80";

    const cleaned = cleanImageCandidates([base64Img, externalUrl]);
    expect(cleaned).toEqual([base64Img, externalUrl, NO_IMAGE_PLACEHOLDER]);

    const img = createMockImg(base64Img);

    // Si falla el base64, debe avanzar a la URL externa
    handleImageError({ currentTarget: img } as any, [base64Img, externalUrl]);
    expect(img.src).toBe(externalUrl);
    expect(img.getAttribute("data-img-step")).toBe("1");

    // Si falla la externa, debe avanzar al placeholder
    handleImageError({ currentTarget: img } as any, [base64Img, externalUrl]);
    expect(img.src).toContain(NO_IMAGE_PLACEHOLDER);
    expect(img.getAttribute("data-img-step")).toBe("2");
  });

  it("4. Test de código: en PublicCatalog.tsx no queda ningún onError que ponga NO_IMAGE_PLACEHOLDER directo sin pasar por el manejador", () => {
    const catalogPath = path.resolve(
      __dirname,
      "../../components/public/PublicCatalog.tsx"
    );
    const code = fs.readFileSync(catalogPath, "utf8");

    // Comprobar que no existen asignaciones directas a placeholder o fallback dentro de onError
    const directAssignments =
      code.match(
        /onError\s*=\s*\{[^}]*(\.src\s*=\s*(NO_IMAGE_PLACEHOLDER|fallback))[^}]*\}/g
      ) || [];
    expect(
      directAssignments,
      `Se encontraron asignaciones directas a placeholder en onError: ${JSON.stringify(
        directAssignments
      )}`
    ).toEqual([]);

    // Verificar que todas las imágenes públicas usan handleImageError
    const handleImageErrorCalls = code.match(/handleImageError\(/g) || [];
    expect(handleImageErrorCalls.length).toBeGreaterThanOrEqual(24);
  });

  it("5. Mismo <img> con dos listas distintas seguidas (cambio de variación por React) -> cada una recorre su cadena completa", () => {
    const list1_thumb = "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_demo/p1_v1_thumb.webp";
    const list1_orig = "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_demo/p1_v1.webp";
    const list1 = [list1_thumb, list1_orig, NO_IMAGE_PLACEHOLDER];

    const list2_thumb = "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_demo/p1_v2_thumb.webp";
    const list2_orig = "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_demo/p1_v2.webp";
    const list2 = [list2_thumb, list2_orig, NO_IMAGE_PLACEHOLDER];

    const img = createMockImg(list1_thumb);

    // Lista 1: recorre paso 1 y paso 2
    handleImageError({ currentTarget: img } as any, list1);
    expect(img.src).toBe(list1_orig);
    expect(img.getAttribute("data-img-step")).toBe("1");

    handleImageError({ currentTarget: img } as any, list1);
    expect(img.src).toContain(NO_IMAGE_PLACEHOLDER);
    expect(img.getAttribute("data-img-step")).toBe("2");

    // React reutiliza el mismo elemento <img> para una variación distinta
    // img.src se actualiza a list2_thumb, pero el atributo data-img-step anterior era "2"
    img.src = list2_thumb;

    // Primer fallo de la lista 2: debe avanzar a list2_orig (paso 1), NO saltársela ni ir directo a placeholder
    handleImageError({ currentTarget: img } as any, list2);
    expect(img.src).toBe(list2_orig);
    expect(img.getAttribute("data-img-step")).toBe("1");

    // Segundo fallo de la lista 2: avanza a placeholder
    handleImageError({ currentTarget: img } as any, list2);
    expect(img.src).toContain(NO_IMAGE_PLACEHOLDER);
    expect(img.getAttribute("data-img-step")).toBe("2");
  });

  it("6. Manejador con la cadena de 4 intentos: [miniatura CDN -> miniatura Supabase -> original Supabase -> placeholder]", () => {
    const cdnThumb = "https://dizifotos.b-cdn.net/s_demo/products/p1_thumb.webp";
    const supThumb = "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_demo/products/p1_thumb.webp";
    const supOrig = "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_demo/products/p1.webp";
    const chain = [cdnThumb, supThumb, supOrig, NO_IMAGE_PLACEHOLDER];

    const img = createMockImg(cdnThumb);

    // 1er intento: falla CDN -> pasa a miniatura de Supabase
    handleImageError({ currentTarget: img } as any, chain);
    expect(img.src).toBe(supThumb);
    expect(img.getAttribute("data-img-step")).toBe("1");

    // 2do intento: falla miniatura Supabase -> pasa a original Supabase
    handleImageError({ currentTarget: img } as any, chain);
    expect(img.src).toBe(supOrig);
    expect(img.getAttribute("data-img-step")).toBe("2");

    // 3er intento: falla original Supabase -> pasa al placeholder
    handleImageError({ currentTarget: img } as any, chain);
    expect(img.src).toContain(NO_IMAGE_PLACEHOLDER);
    expect(img.getAttribute("data-img-step")).toBe("3");

    // 4to intento: placeholder no genera bucle
    handleImageError({ currentTarget: img } as any, chain);
    expect(img.src).toContain(NO_IMAGE_PLACEHOLDER);
  });
});
