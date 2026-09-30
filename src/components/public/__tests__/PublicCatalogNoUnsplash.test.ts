import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("D7 / Respaldo neutro: PublicCatalog sin dependencias de Unsplash", () => {
  const publicCatalogPath = path.resolve(__dirname, "../PublicCatalog.tsx");
  const placeholderPath = path.resolve(__dirname, "../../../../public/images/sin-foto.svg");

  it("verifica que el archivo de imagen neutra /images/sin-foto.svg existe físicamente en public/", () => {
    expect(fs.existsSync(placeholderPath)).toBe(true);
    const svgContent = fs.readFileSync(placeholderPath, "utf8");
    expect(svgContent).toContain("<svg");
    expect(svgContent).toContain("Sin foto");
  });

  it("garantiza que PublicCatalog.tsx tiene 0 referencias a images.unsplash.com", () => {
    const code = fs.readFileSync(publicCatalogPath, "utf8");
    const matches = code.match(/images\.unsplash\.com/g) || [];
    
    expect(
      matches.length,
      `Regla de negocio violada: PublicCatalog.tsx no debe contener referencias a images.unsplash.com. Se encontraron ${matches.length} ocurrencias.`
    ).toBe(0);
  });

  it("garantiza que PublicCatalog.tsx usa /images/sin-foto.svg como imagen neutra de respaldo", () => {
    const code = fs.readFileSync(publicCatalogPath, "utf8");
    expect(code).toContain('const NO_IMAGE_PLACEHOLDER = "/images/sin-foto.svg";');
    expect(code).toContain("NO_IMAGE_PLACEHOLDER");
  });
});
