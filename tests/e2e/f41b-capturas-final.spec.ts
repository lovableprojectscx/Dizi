import { test } from "@playwright/test";
import path from "path";
import fs from "fs";

const DEST_DIRS = [
  "D:\\DIZI\\DIZI-20261014T161215Z-1-001\\DIZI\\INFORMACIÓN NECESARIA\\04-TECNICA\\encargos\\capturas-f41b\\final",
  "C:\\Users\\jacks\\.gemini\\antigravity\\brain\\fe693a24-4d67-42fd-9d8b-0d2bb4dd705f\\capturas-f41b\\final",
];

for (const dir of DEST_DIRS) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function saveScreenshot(page: any, filename: string) {
  await page.evaluate(async () => {
    const selectors = Array.from(document.querySelectorAll("img"));
    await Promise.all(
      selectors.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.addEventListener("load", resolve);
          img.addEventListener("error", resolve);
          setTimeout(resolve, 3000);
        });
      })
    );
  });
  await page.waitForTimeout(1000);
  await page.addStyleTag({
    content: "*, *::before, *::after { animation: none !important; transition: none !important; }",
  });

  for (const dir of DEST_DIRS) {
    const filePath = path.join(dir, filename);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`Saved screenshot: ${filePath}`);
  }
}

const STORES = [
  { name: "catalogo", path: "/t/catalogo" },
  { name: "onfeet", path: "/t/onfeet" },
  { name: "urbana-drop-demo", path: "/t/urbana-drop-demo" },
  { name: "nova-setup", path: "/t/nova-setup" },
  { name: "aura", path: "/t/aura" },
  { name: "jhoselynperu", path: "/t/jhoselynperu" },
  { name: "restaurante-demo", path: "/t/restaurante-demo" },
  { name: "milance", path: "/bio/milance" },
];

test.describe("F41b · Capturas DESPUÉS con NULL (RNF-41b.1)", () => {
  for (const s of STORES) {
    test(`Después: ${s.name} a 375px`, async ({ page }) => {
      test.setTimeout(60000);
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(s.path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      await saveScreenshot(page, `despues-${s.name}-375px.png`);
    });

    test(`Después: ${s.name} a 1280px`, async ({ page }) => {
      test.setTimeout(60000);
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(s.path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      await saveScreenshot(page, `despues-${s.name}-1280px.png`);
    });
  }
});
