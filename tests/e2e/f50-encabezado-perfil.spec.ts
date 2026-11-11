import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const CAPTURAS_DIRS = [
  path.resolve("D:/DIZI/DIZI-20261014T161215Z-1-001/DIZI/INFORMACIN NECESARIA/04-TECNICA/encargos/capturas-f50"),
  path.resolve("D:/DIZI/04-TECNICA/encargos/capturas-f50"),
];

for (const dir of CAPTURAS_DIRS) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

test.describe("F50 · Encabezado 'Perfil' para el catálogo (Playwright E2E)", () => {
  test("Caso 1: Banner con texto grande - móvil (375px) y escritorio (1280px)", async ({ page }) => {
    const htmlFile = path.join(CAPTURAS_DIRS[0], "caso1-banner-texto.html");
    const fileUrl = `file://${htmlFile.replace(/\\/g, "/")}`;

    // 1. Móvil (375 px)
    await page.setViewportSize({ width: 375, height: 780 });
    await page.goto(fileUrl, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);

    const heading = page.locator("h2", { hasText: "HASTA 50% DSCTO" });
    await expect(heading).toBeVisible();

    for (const dir of CAPTURAS_DIRS) {
      await page.screenshot({ path: path.join(dir, "caso1-celular-375px.png") });
    }

    // 2. Escritorio (1280 px)
    await page.setViewportSize({ width: 1280, height: 850 });
    await page.goto(fileUrl, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);

    await expect(heading).toBeVisible();

    for (const dir of CAPTURAS_DIRS) {
      await page.screenshot({ path: path.join(dir, "caso1-escritorio-1280px.png") });
    }
  });

  test("Caso 2: Banner con foto - móvil (375px) y escritorio (1280px)", async ({ page }) => {
    const htmlFile = path.join(CAPTURAS_DIRS[0], "caso2-banner-foto.html");
    const fileUrl = `file://${htmlFile.replace(/\\/g, "/")}`;

    // 1. Móvil (375 px)
    await page.setViewportSize({ width: 375, height: 780 });
    await page.goto(fileUrl, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);

    const storeTitle = page.locator("h1", { hasText: "Dionelle Atelier" });
    await expect(storeTitle).toBeVisible();

    for (const dir of CAPTURAS_DIRS) {
      await page.screenshot({ path: path.join(dir, "caso2-celular-375px.png") });
    }

    // 2. Escritorio (1280 px)
    await page.setViewportSize({ width: 1280, height: 850 });
    await page.goto(fileUrl, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);

    await expect(storeTitle).toBeVisible();

    for (const dir of CAPTURAS_DIRS) {
      await page.screenshot({ path: path.join(dir, "caso2-escritorio-1280px.png") });
    }
  });

  test("Caso 3: Sin banner (solo color de marca) - móvil (375px) y escritorio (1280px)", async ({ page }) => {
    const htmlFile = path.join(CAPTURAS_DIRS[0], "caso3-sin-banner-color.html");
    const fileUrl = `file://${htmlFile.replace(/\\/g, "/")}`;

    // 1. Móvil (375 px)
    await page.setViewportSize({ width: 375, height: 780 });
    await page.goto(fileUrl, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);

    const storeTitle = page.locator("h1", { hasText: "Studio Minimal Design" });
    await expect(storeTitle).toBeVisible();

    for (const dir of CAPTURAS_DIRS) {
      await page.screenshot({ path: path.join(dir, "caso3-celular-375px.png") });
    }

    // 2. Escritorio (1280 px)
    await page.setViewportSize({ width: 1280, height: 850 });
    await page.goto(fileUrl, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);

    await expect(storeTitle).toBeVisible();

    for (const dir of CAPTURAS_DIRS) {
      await page.screenshot({ path: path.join(dir, "caso3-escritorio-1280px.png") });
    }
  });
});
