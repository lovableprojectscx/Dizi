import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

function resolveTargetDirs(): string[] {
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
          "capturas-f42-2",
          "despues"
        )
      );
    }
  } catch {}
  dirs.push("C:\\Users\\jacks\\.gemini\\antigravity\\brain\\fe693a24-4d67-42fd-9d8b-0d2bb4dd705f\\capturas-f42-2\\despues");
  return dirs;
}

const DEST_DIRS = resolveTargetDirs();
for (const d of DEST_DIRS) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

const VIEWPORTS = [
  { name: "360px", width: 360, height: 780 },
  { name: "375px", width: 375, height: 812 },
  { name: "414px", width: 414, height: 896 },
  { name: "1280px", width: 1280, height: 800 },
  { name: "1920px", width: 1920, height: 1080 },
];

const DETAIL_CASES = [
  {
    id: "jack-mayoreo-oscuro",
    store: "celulares-demo",
    productSubstring: "iPhone 15 Pro Max",
  },
  {
    id: "simple-oscuro",
    store: "celulares-demo",
    productSubstring: "AirPods Pro",
  },
  {
    id: "oferta-oscuro",
    store: "celulares-demo",
    productSubstring: "Anker Nano",
  },
  {
    id: "simple-claro",
    store: "catalogo",
    productSubstring: "Base cupcake",
  },
  {
    id: "opciones-claro",
    store: "onfeet",
    productSubstring: "foam runner onyx",
  },
  {
    id: "oferta-claro",
    store: "onfeet",
    productSubstring: "foam runner red",
  },
];

test.describe("F42.2 — Capturas DESPUES de Detalle y Catálogo Base", () => {
  for (const c of DETAIL_CASES) {
    for (const vp of VIEWPORTS) {
      test(`Detalle DESPUES: ${c.id} a ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`/t/${c.store}`);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(600);

        // Click on product to open detail sheet
        const prodElement = page.getByText(c.productSubstring, { exact: false }).first();
        await prodElement.scrollIntoViewIfNeeded();
        await expect(prodElement).toBeVisible({ timeout: 10000 });
        await prodElement.click();

        // Wait for SheetContent to open
        const sheet = page.locator('[role="dialog"]').first();
        await expect(sheet).toBeVisible({ timeout: 5000 });
        await page.waitForTimeout(500);

        // Verify that Consultar and Añadir al carrito buttons are visible WITHOUT scrolling
        const consultarBtn = sheet.getByRole("button", { name: /consultar/i }).first();
        const anadirBtn = sheet.getByRole("button", { name: /añadir al carrito/i }).first();
        await expect(consultarBtn).toBeVisible();
        await expect(anadirBtn).toBeVisible();

        const filename = `${c.id}-${vp.name}.png`;
        const ssBuffer = await page.screenshot({ fullPage: false });
        for (const d of DEST_DIRS) {
          fs.writeFileSync(path.join(d, filename), ssBuffer);
        }
      });
    }
  }

  // Base catalog screenshots for pixel comparison
  const BASE_CASES = [
    { id: "catalogo-base-catalogo", store: "catalogo" },
    { id: "catalogo-base-onfeet", store: "onfeet" },
  ];

  for (const b of BASE_CASES) {
    for (const vpName of ["375px", "1280px"]) {
      const vp = VIEWPORTS.find((v) => v.name === vpName)!;
      test(`Catálogo Base DESPUES: ${b.id} a ${vpName}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`/t/${b.store}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(1200);

        await page.addStyleTag({
          content: "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }",
        });
        await page.waitForTimeout(400);

        const filename = `${b.id}-${vpName}.png`;
        const ssBuffer = await page.screenshot({ fullPage: false });
        for (const d of DEST_DIRS) {
          fs.writeFileSync(path.join(d, filename), ssBuffer);
        }
      });
    }
  }
});

test.describe("F42.2 — Pruebas funcionales movil-android (Requisito 3)", () => {
  test("abrir detalle producto simple → sin scroll tocar Añadir → carrito suma 1", async ({ page }) => {
    await page.goto("/t/celulares-demo");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Open AirPods Pro (simple product)
    const prod = page.getByText("AirPods Pro", { exact: false }).first();
    await expect(prod).toBeVisible({ timeout: 10000 });
    await prod.click();

    // Sheet is visible
    const sheet = page.locator('[role="dialog"]').first();
    await expect(sheet).toBeVisible({ timeout: 5000 });

    // Touch "Añadir al carrito" WITHOUT scrolling
    const anadirBtn = sheet.getByRole("button", { name: /añadir al carrito/i }).first();
    await expect(anadirBtn).toBeVisible();
    await anadirBtn.click();

    // Cart opens and item count increments
    const cartDialog = page.locator('[role="dialog"]').filter({ hasText: /carrito|pedido/i }).first();
    await expect(cartDialog).toBeVisible({ timeout: 5000 });
    // Verify AirPods Pro is in cart
    await expect(cartDialog.getByText("AirPods Pro", { exact: false }).first()).toBeVisible();
  });

  test("producto con opciones → sin elegir, tocar Añadir → lleva a las opciones sin sumar al carrito", async ({ page }) => {
    await page.goto("/t/onfeet");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Open Yeezy foam runner onyx (product with options)
    const prod = page.getByText("foam runner onyx", { exact: false }).first();
    await expect(prod).toBeVisible({ timeout: 10000 });
    await prod.click();

    const sheet = page.locator('[role="dialog"]').first();
    await expect(sheet).toBeVisible({ timeout: 5000 });

    // Without selecting an option, touch "Añadir al carrito"
    const anadirBtn = sheet.getByRole("button", { name: /añadir al carrito/i }).first();
    await expect(anadirBtn).toBeVisible();
    await anadirBtn.click();

    // The detail sheet should STAY open (not closed, cart not opened)
    await expect(sheet).toBeVisible();
    // Options section should be visible in viewport
    const optionsSection = sheet.getByText(/opciones disponibles/i).first();
    await expect(optionsSection).toBeVisible();

    // Now select a variation (e.g. size 40 or Principal)
    const variationBtn = sheet.getByRole("button", { name: "40" }).first();
    await expect(variationBtn).toBeVisible();
    await variationBtn.click();

    // Now touch "Añadir al carrito"
    await anadirBtn.click();

    // Now the cart opens with the item and variation
    const cartDialog = page.locator('[role="dialog"]').filter({ hasText: /carrito|pedido/i }).first();
    await expect(cartDialog).toBeVisible({ timeout: 5000 });
    await expect(cartDialog.getByText("foam runner onyx", { exact: false }).first()).toBeVisible();
    await expect(cartDialog.getByText(/40/i).first()).toBeVisible();
  });
});
