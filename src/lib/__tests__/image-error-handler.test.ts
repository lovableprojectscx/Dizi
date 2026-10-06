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
});
