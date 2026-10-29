import { test } from "@playwright/test";
import path from "path";
import fs from "fs";

function resolveCapturasDir(): string {
  const parent = path.resolve(process.cwd(), "..");
  try {
    const entries = fs.readdirSync(parent);
    const infoDir = entries.find((e) => e.startsWith("INFORMAC"));
    if (infoDir) {
      const target = path.join(parent, infoDir, "04-TECNICA", "encargos", "capturas-f42");
      if (fs.existsSync(target)) return target;
    }
  } catch {}
  return path.resolve(process.cwd(), "capturas");
}

const DEST_DIR = resolveCapturasDir();

test.describe("Tiendas Reales a 375px (Sin modificar DB, interruptor apagado)", () => {
  test.use({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
  });

  test("1. Tienda /t/catalogo a 375px", async ({ page }) => {
    await page.goto("/t/catalogo");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: path.join(DEST_DIR, "despues-catalogo-375px.png"),
      fullPage: false,
    });
  });

  test("2. Tienda /t/jhoselynperu a 375px", async ({ page }) => {
    await page.goto("/t/jhoselynperu");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: path.join(DEST_DIR, "despues-jhoselynperu-375px.png"),
      fullPage: false,
    });
  });

  test("3. Tienda /bio/milance a 375px", async ({ page }) => {
    await page.goto("/bio/milance");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: path.join(DEST_DIR, "despues-milance-375px.png"),
      fullPage: false,
    });
  });
});
