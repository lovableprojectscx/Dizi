import { test } from "@playwright/test";
import path from "path";
import fs from "fs";

function resolveCapturasDir(): string {
  const parent = path.resolve(process.cwd(), "..", "..");
  try {
    const entries = fs.readdirSync(parent);
    const infoDir = entries.find((e) => e.startsWith("INFORMAC"));
    if (infoDir) {
      const target = path.join(parent, infoDir, "04-TECNICA", "encargos", "capturas-f41", "despues");
      if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });
      return target;
    }
  } catch {}
  const fallback = path.resolve(process.cwd(), "capturas-despues");
  if (!fs.existsSync(fallback)) fs.mkdirSync(fallback, { recursive: true });
  return fallback;
}

const DEST_DIR = resolveCapturasDir();

const STORES = [
  { name: "catalogo", path: "/t/catalogo", model: "grid" },
  { name: "jhoselynperu", path: "/t/jhoselynperu", model: "nature" },
  { name: "onfeet", path: "/t/onfeet", model: "bloom_general" },
  { name: "milance", path: "/bio/milance", model: "bio-link" },
  { name: "aura", path: "/t/aura", model: "arch" },
  { name: "shuoko", path: "/t/shuoko", model: "banner_grid" },
  { name: "restaurante-demo", path: "/t/restaurante-demo", model: "bite" },
  { name: "palmerafit", path: "/t/palmerafit", model: "clasico" },
  { name: "urbana-drop-demo", path: "/t/urbana-drop-demo", model: "diagonal" },
  { name: "liora", path: "/t/liora", model: "editorial" },
  { name: "invitaya", path: "/t/invitaya", model: "magazine" },
  { name: "jj-hb-one-stily", path: "/t/jj-hb-one-stily", model: "nocturno" },
  { name: "nova-setup", path: "/t/nova-setup", model: "overlay" },
];

test.describe("Capturas DESPUÉS de f41-formato-fotos-vitrina (photo_format = NULL)", () => {
  for (const s of STORES) {
    test(`Después: ${s.name} (${s.model}) a 375px`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(s.path);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1200);
      await page.addStyleTag({
        content: `*, *::before, *::after { animation: none !important; transition: none !important; }`,
      });
      await page.screenshot({
        path: path.join(DEST_DIR, `despues-${s.name}-375px.png`),
        fullPage: false,
      });
    });

    test(`Después: ${s.name} (${s.model}) a 1280px`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(s.path);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1200);
      await page.addStyleTag({
        content: `*, *::before, *::after { animation: none !important; transition: none !important; }`,
      });
      await page.screenshot({
        path: path.join(DEST_DIR, `despues-${s.name}-1280px.png`),
        fullPage: false,
      });
    });
  }
});
