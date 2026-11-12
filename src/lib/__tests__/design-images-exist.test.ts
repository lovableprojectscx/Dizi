import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { LANDING_SHOWCASE_DESIGNS } from "../landing-disenos";
import { DESIGN_SPECS, DESIGN_STRUCTURES } from "../design-catalog";

describe("Verificación de imágenes de diseños en public/", () => {
  const publicDir = path.resolve(__dirname, "../../../public");

  it("cada imagen que referencia LANDING_SHOWCASE_DESIGNS existe en public/", () => {
    expect(LANDING_SHOWCASE_DESIGNS.length).toBe(9);

    for (const design of LANDING_SHOWCASE_DESIGNS) {
      expect(design.image).toBeDefined();
      const relativePath = design.image.replace(/^\//, "");
      const fullPath = path.join(publicDir, relativePath);

      expect(
        fs.existsSync(fullPath),
        `La imagen de landing para ${design.id} no existe: ${fullPath}`
      ).toBe(true);

      const stats = fs.statSync(fullPath);
      expect(stats.size).toBeGreaterThan(0);
    }
  });

  it("cada previewImage que referencia DESIGN_SPECS existe en public/", () => {
    const specs = Object.values(DESIGN_SPECS);
    expect(specs.length).toBeGreaterThanOrEqual(9);

    for (const spec of specs) {
      if (spec.previewImage) {
        const relativePath = spec.previewImage.replace(/^\//, "");
        const fullPath = path.join(publicDir, relativePath);

        expect(
          fs.existsSync(fullPath),
          `El previewImage de ${spec.id} no existe: ${fullPath}`
        ).toBe(true);

        const stats = fs.statSync(fullPath);
        expect(stats.size).toBeGreaterThan(0);
      }
    }
  });

  it("cada previewImage que referencia DESIGN_STRUCTURES existe en public/", () => {
    const structures = Object.values(DESIGN_STRUCTURES);
    expect(structures.length).toBeGreaterThanOrEqual(9);

    for (const struct of structures) {
      if (struct.previewImage) {
        const relativePath = struct.previewImage.replace(/^\//, "");
        const fullPath = path.join(publicDir, relativePath);

        expect(
          fs.existsSync(fullPath),
          `El previewImage de estructura ${struct.id} no existe: ${fullPath}`
        ).toBe(true);

        const stats = fs.statSync(fullPath);
        expect(stats.size).toBeGreaterThan(0);
      }
    }
  });

  it("la imagen landing perfil.webp existe y pesa menos de 120 KB", () => {
    const perfilLanding = path.join(publicDir, "images/landing/disenos/perfil.webp");
    expect(fs.existsSync(perfilLanding)).toBe(true);

    const stats = fs.statSync(perfilLanding);
    const sizeKb = stats.size / 1024;
    expect(sizeKb).toBeLessThan(120);
    expect(sizeKb).toBeGreaterThan(10);
  });

  it("la miniatura designs perfil.webp existe y pesa menos de 150 KB", () => {
    const perfilDesign = path.join(publicDir, "images/designs/perfil.webp");
    expect(fs.existsSync(perfilDesign)).toBe(true);

    const stats = fs.statSync(perfilDesign);
    const sizeKb = stats.size / 1024;
    expect(sizeKb).toBeLessThan(150);
    expect(sizeKb).toBeGreaterThan(5);
  });

  it("las 7 fotos, banner y logo de boutique-demo existen en public/ y pesan menos de 150 KB cada una", () => {
    const demoDir = path.join(publicDir, "images/demos/boutique-demo");
    expect(fs.existsSync(demoDir)).toBe(true);

    const requiredFiles = [
      "logo.webp",
      "banner.webp",
      "prod_01_polera_crop_jogger_amarillo.webp",
      "prod_02_abrigo_celeste_largo.webp",
      "prod_03_vestido_envolvente_floral.webp",
      "prod_04_vestido_midi_rojo_floral.webp",
      "prod_05_conjunto_top_lentejuelas.webp",
      "prod_06_abrigo_negro_volantes.webp",
      "prod_07_pantalon_palazzo_rayas.webp",
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(demoDir, file);
      expect(fs.existsSync(filePath), `Falta archivo demo: ${file}`).toBe(true);

      const stats = fs.statSync(filePath);
      const sizeKb = stats.size / 1024;
      expect(sizeKb).toBeLessThan(150);
      expect(sizeKb).toBeGreaterThan(1);
    }
  });
});
