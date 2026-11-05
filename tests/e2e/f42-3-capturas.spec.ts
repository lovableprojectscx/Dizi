import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

function resolveTargetDirs(phase: "antes" | "despues"): string[] {
  const dirs: string[] = [];
  try {
    const parent = path.resolve(process.cwd(), "..", "..");
    const entries = fs.readdirSync(parent);
    const infoDir = entries.find((e) => {
      const full = path.join(parent, e);
      return e.startsWith("INFORMAC") && fs.statSync(full).isDirectory();
    });
    if (infoDir) {
      dirs.push(
        path.join(
          parent,
          infoDir,
          "04-TECNICA",
          "encargos",
          "capturas-f42-3",
          phase
        )
      );
    }
  } catch {}
  dirs.push(`C:\\Users\\jacks\\.gemini\\antigravity\\brain\\fe693a24-4d67-42fd-9d8b-0d2bb4dd705f\\capturas-f42-3\\${phase}`);
  return dirs;
}

const PHASE: "antes" | "despues" = (process.env.F42_PHASE as "antes" | "despues") || "despues";
const TARGET_DIRS = resolveTargetDirs(PHASE);
for (const d of TARGET_DIRS) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

const VIEWPORTS = [
  { name: "375px", width: 375, height: 812 },
  { name: "1280px", width: 1280, height: 800 },
];

interface CaseConfig {
  id: string;
  storeSlug: string;
  productSubstring: string;
  overrideModel?: string;
  overrideIsDark?: boolean;
}

const CASES: CaseConfig[] = [
  // 1. Grilla Claro (estilo grilla en tema claro)
  {
    id: "grilla-claro",
    storeSlug: "nova-setup",
    productSubstring: "Mouse Gamer Pulsar RGB",
    overrideModel: "grid",
    overrideIsDark: false,
  },
  // 2. Grilla Oscuro (estilo grilla en tema oscuro)
  {
    id: "grilla-oscuro",
    storeSlug: "nova-setup",
    productSubstring: "Mouse Gamer Pulsar RGB",
    overrideModel: "grid",
    overrideIsDark: true,
  },
  // 3. Overlay Claro (tienda real nova-setup, estilo overlay en tema claro)
  {
    id: "overlay-claro",
    storeSlug: "nova-setup",
    productSubstring: "Mouse Gamer Pulsar RGB",
    overrideModel: "overlay",
    overrideIsDark: false,
  },
  // 4. Overlay Oscuro (estilo overlay en tema oscuro)
  {
    id: "overlay-oscuro",
    storeSlug: "nova-setup",
    productSubstring: "Mouse Gamer Pulsar RGB",
    overrideModel: "overlay",
    overrideIsDark: true,
  },
  // 5. Magazine Oscuro (estilo magazine en tema oscuro)
  {
    id: "magazine-oscuro",
    storeSlug: "nova-setup",
    productSubstring: "Mouse Gamer Pulsar RGB",
    overrideModel: "magazine",
    overrideIsDark: true,
  },
  // 6. Bite Oscuro (tienda real grano-miga, estilo bite en tema oscuro)
  {
    id: "bite-oscuro",
    storeSlug: "grano-miga",
    productSubstring: "Café Latte",
  },
  // 7. Bite Claro (estilo bite en tema claro)
  {
    id: "bite-claro",
    storeSlug: "grano-miga",
    productSubstring: "Café Latte",
    overrideModel: "bite",
    overrideIsDark: false,
  },
];

test.describe(`F42.3 — Capturas de Detalle de Producto (${PHASE.toUpperCase()})`, () => {
  for (const c of CASES) {
    for (const vp of VIEWPORTS) {
      test(`${c.id} a ${vp.name} (${PHASE})`, async ({ page }) => {
        test.setTimeout(60000);
        await page.setViewportSize({ width: vp.width, height: vp.height });

        if (c.overrideModel !== undefined || c.overrideIsDark !== undefined) {
          await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
            const response = await route.fetch();
            const json = await response.json();
            if (c.overrideModel !== undefined) {
              json.model = c.overrideModel;
            }
            if (c.overrideIsDark !== undefined) {
              json.is_dark = c.overrideIsDark;
              json.isDark = c.overrideIsDark;
            }
            await route.fulfill({
              response,
              body: JSON.stringify(json),
            });
          });
        }

        await page.goto(`/t/${c.storeSlug}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(600);

        // Click on product to open detail sheet
        const prodElement = page.getByText(c.productSubstring, { exact: false }).first();
        await prodElement.scrollIntoViewIfNeeded();
        await expect(prodElement).toBeVisible({ timeout: 10000 });
        await prodElement.click();

        // Wait for SheetContent to open
        const sheet = page.locator('[role="dialog"]').first();
        await expect(sheet).toBeVisible({ timeout: 5000 });
        await page.waitForTimeout(600);

        // Sin bajar: screenshot of current viewport without scrolling
        const filename = `${c.id}-${vp.name}.png`;
        const ssBuffer = await page.screenshot({ fullPage: false });
        for (const d of TARGET_DIRS) {
          fs.writeFileSync(path.join(d, filename), ssBuffer);
        }
      });
    }
  }
});
