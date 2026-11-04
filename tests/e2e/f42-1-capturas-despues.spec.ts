import { test } from "@playwright/test";
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
          "capturas-f42-1",
          "despues"
        )
      );
    }
  } catch {}
  dirs.push("C:\\Users\\jacks\\.gemini\\antigravity\\brain\\fe693a24-4d67-42fd-9d8b-0d2bb4dd705f\\capturas-f42-1\\despues");
  return dirs;
}

const DEST_DIRS = resolveTargetDirs();
for (const d of DEST_DIRS) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

async function saveScreenshot(page: any, filename: string) {
  await page.waitForTimeout(600);
  await page.addStyleTag({
    content: "*, *::before, *::after { animation: none !important; transition: none !important; }",
  });
  for (const dir of DEST_DIRS) {
    const filePath = path.join(dir, filename);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`Saved screenshot: ${filePath}`);
  }
}

const PRODUCTS = [
  {
    id: "p_1",
    name: "iPhone 15 Pro Max 256GB - Titanio Natural (Distribución Oficial Autorizada)",
    description: "Smartphone Apple con chip A17 Pro y cámara de 48MP",
    price: 4999.0,
    original_price: 4999.0,
    originalPrice: 4999.0,
    is_on_sale: false,
    isOnSale: false,
    visible: true,
    is_sample: false,
    sort_order: 1,
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80",
    wholesale_tiers: [
      { min_qty: 3, price: 4249.15 },
      { min_qty: 6, price: 3824.23 },
    ],
  },
  {
    id: "p_2",
    name: "Hoodie Oversize Heavyweight Fleece Edición Invierno",
    description: "Polera térmica con capucha y bolsillo canguro",
    price: 189.0,
    original_price: 189.0,
    originalPrice: 189.0,
    is_on_sale: false,
    isOnSale: false,
    visible: true,
    is_sample: false,
    sort_order: 2,
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80",
    variations: [
      { id: "v_negro_l", name: "Negro / Talla L", price: null },
    ],
    wholesale_tiers: [
      { min_qty: 3, price: 149.0 },
      { min_qty: 5, price: 129.0 },
    ],
  },
  {
    id: "p_3",
    name: "Funda Silicona Líquida MagSafe Premium",
    description: "Protección contra caídas con imanes integrados",
    price: 79.9,
    original_price: 79.9,
    originalPrice: 79.9,
    is_on_sale: false,
    isOnSale: false,
    visible: true,
    is_sample: false,
    sort_order: 3,
    image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&auto=format&fit=crop&q=80",
    wholesale_tiers: [],
  },
];

const STORES = [
  {
    slug: "zz-audit-f42-1-claro",
    name: "Boutique Urbana",
    themeName: "claro",
    storeData: {
      id: "s_claro",
      slug: "zz-audit-f42-1-claro",
      name: "Boutique Urbana",
      phone: "51999888777",
      country_code: "51",
      country_iso: "PE",
      plan: "ilimitado",
      wholesale_enabled: true,
      active: true,
      is_published: true,
      is_dark: false,
      isDark: false,
      brand_color: "#2563eb",
      card_style: "standard",
      model: "grid",
      total_products_count: 3,
      categories: [],
      products: PRODUCTS,
    },
  },
  {
    slug: "zz-audit-f42-1-oscuro",
    name: "GigaTech Mobile",
    themeName: "oscuro",
    storeData: {
      id: "s_oscuro",
      slug: "zz-audit-f42-1-oscuro",
      name: "GigaTech Mobile",
      phone: "51999888777",
      country_code: "51",
      country_iso: "PE",
      plan: "ilimitado",
      wholesale_enabled: true,
      active: true,
      is_published: true,
      is_dark: true,
      isDark: true,
      brand_color: "#3b82f6",
      bg_color: "#000000",
      text_color: "#ffffff",
      card_style: "dark",
      model: "vitrina",
      total_products_count: 3,
      categories: [],
      products: PRODUCTS,
    },
  },
];

const VIEWPORTS = [
  { name: "360px", width: 360, height: 800 },
  { name: "375px", width: 375, height: 812 },
  { name: "414px", width: 414, height: 896 },
  { name: "1280px", width: 1280, height: 800 },
  { name: "1920px", width: 1920, height: 1080 },
];

test.describe("F42.1 · Capturas DESPUÉS con línea del carrito mejorada y R5", () => {
  for (const store of STORES) {
    for (const vp of VIEWPORTS) {
      test(`Después: ${store.themeName} a ${vp.name}`, async ({ page }) => {
        test.setTimeout(60000);
        await page.setViewportSize({ width: vp.width, height: vp.height });

        // Sembrar el carrito con los 3 productos en localStorage
        await page.addInitScript((storeId) => {
          const cartData = {
            state: {
              carts: {
                [storeId]: [
                  {
                    productId: "p_1",
                    qty: 1,
                    variationId: null,
                    variationName: null,
                    variationPrice: null,
                    variationImage: null,
                  },
                  {
                    productId: "p_2",
                    qty: 3,
                    variationId: "v_negro_l",
                    variationName: "Negro / Talla L",
                    variationPrice: null,
                    variationImage: null,
                  },
                  {
                    productId: "p_3",
                    qty: 1,
                    variationId: null,
                    variationName: null,
                    variationPrice: null,
                    variationImage: null,
                  },
                ],
              },
            },
            version: 0,
          };
          localStorage.setItem("dizi-carts-v1", JSON.stringify(cartData));
        }, store.storeData.id);

        // Interceptar RPC
        await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(store.storeData),
          });
        });

        await page.goto(`/t/${store.slug}`, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(1000);

        // Abrir el carrito haciendo clic en el botón flotante
        const cartButton = page.locator('button[aria-label="Ver carrito"]');
        await cartButton.waitFor({ state: "visible", timeout: 10000 });
        await cartButton.click();

        // Esperar a que la hoja del carrito esté abierta
        await page.waitForSelector('text="Tu pedido"', { timeout: 10000 });
        await page.waitForTimeout(800);

        await saveScreenshot(page, `despues-${store.themeName}-${vp.name}.png`);
      });
    }
  }
});
