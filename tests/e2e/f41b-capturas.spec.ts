import { test } from "@playwright/test";
import path from "path";
import fs from "fs";

const DEST_DIRS = [
  "D:\\DIZI\\DIZI-20261014T161215Z-1-001\\DIZI\\INFORMACIÓN NECESARIA\\04-TECNICA\\encargos\\capturas-f41b",
  "C:\\Users\\jacks\\.gemini\\antigravity\\brain\\fe693a24-4d67-42fd-9d8b-0d2bb4dd705f\\capturas-f41b",
  "C:\\Users\\jacks\\.gemini\\antigravity\\brain\\fe693a24-4d67-42fd-9d8b-0d2bb4dd705f",
];

for (const dir of DEST_DIRS) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function saveScreenshot(page: any, filename: string) {
  // Esperar a que las imágenes visibles carguen
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
  await page.waitForTimeout(600);

  // Inyectar CSS para congelar animaciones
  await page.addStyleTag({
    content: "*, *::before, *::after { animation: none !important; transition: none !important; }",
  });

  for (const dir of DEST_DIRS) {
    const filePath = path.join(dir, filename);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`Saved screenshot: ${filePath}`);
  }
}

// Datos base reales de zz-audit-f41b-showcase con 6 productos y banner
const BASE_STORE = {
  id: "s_zzauditf41b",
  slug: "zz-audit-f41b-showcase",
  name: "Showcase F41b Boutique",
  phone: "51999888777",
  country_code: "51",
  country_iso: "PE",
  plan: "semilla",
  active: true,
  is_published: true,
  brand_color: "#0d9488",
  accent_color: "#0f766e",
  card_style: "standard",
  show_discount_pct: true,
  niche: "ropa",
  banner_image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80",
  banner_title: "Showcase F41b",
  categories: [],
  products: [
    {
      id: "p_f41b_1",
      name: "Vestido Floral Seda",
      description: "Vestido midi de verano estampado en seda natural",
      price: 89.9,
      original_price: 129.9,
      originalPrice: 129.9,
      is_on_sale: true,
      isOnSale: true,
      visible: true,
      is_sample: false,
      sort_order: 1,
      image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "p_f41b_2",
      name: "Reloj Minimalista",
      description: "Reloj analógico clásico con correa de cuero genuino",
      price: 149.0,
      original_price: 149.0,
      originalPrice: 149.0,
      is_on_sale: false,
      isOnSale: false,
      visible: true,
      is_sample: false,
      sort_order: 2,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "p_f41b_3",
      name: "Zapatillas Urban Runner",
      description: "Calzado deportivo ligero con amortiguación premium",
      price: 199.0,
      original_price: 199.0,
      originalPrice: 199.0,
      is_on_sale: false,
      isOnSale: false,
      visible: true,
      is_sample: false,
      sort_order: 3,
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
    },
    {
      id: "p_f41b_4",
      name: "Chaqueta Cuero Biker",
      description: "Chaqueta biker con forro interior y cremalleras de metal",
      price: 220.0,
      original_price: 220.0,
      originalPrice: 220.0,
      is_on_sale: false,
      isOnSale: false,
      visible: true,
      is_sample: false,
      sort_order: 4,
      image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "p_f41b_5",
      name: "Lentes de Sol Retro",
      description: "Lentes con protección UV400 y marco de acetato carey",
      price: 65.0,
      original_price: 65.0,
      originalPrice: 65.0,
      is_on_sale: false,
      isOnSale: false,
      visible: true,
      is_sample: false,
      sort_order: 5,
      image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "p_f41b_6",
      name: "Café Gourmet Artesanal",
      description: "Granos seleccionados de origen único tostado medio",
      price: 38.0,
      original_price: 38.0,
      originalPrice: 38.0,
      is_on_sale: false,
      isOnSale: false,
      visible: true,
      is_sample: false,
      sort_order: 6,
      image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
    },
  ],
  total_products_count: 6,
};

const DESIGNS = [
  { name: "diagonal", model: "diagonal" },
  { name: "overlay", model: "overlay" },
  { name: "arch", model: "arch" },
  { name: "nature", model: "nature" },
  { name: "bite", model: "bite" },
  { name: "vitrina", model: "vitrina" },
  { name: "grilla", model: "grid" },
  { name: "bloom", model: "bloom" },
];

const FORMATS = [
  { key: "comohoy", photo_format: null },
  { key: "cuadrada", photo_format: "square" },
  { key: "vertical", photo_format: "portrait" },
  { key: "completa", photo_format: "contain" },
];

test.describe("F41b · Evaluación visual de formatos de foto a 375px", () => {
  for (const d of DESIGNS) {
    for (const f of FORMATS) {
      test(`${d.name} - ${f.key} a 375px`, async ({ page }) => {
        test.setTimeout(60000);
        await page.setViewportSize({ width: 375, height: 812 });

        await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              ...BASE_STORE,
              model: d.model,
              photo_format: f.photo_format,
            }),
          });
        });

        await page.goto("/t/zz-audit-f41b-showcase", { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(1500);
        await saveScreenshot(page, `${d.name}-${f.key}.png`);
      });
    }
  }
});

// Control de no regresión en tiendas reales con photo_format = NULL
const CONTROL_STORES = [
  { name: "control-catalogo", path: "/t/catalogo" },
  { name: "control-onfeet", path: "/t/onfeet" },
  { name: "control-urbana-drop-demo", path: "/t/urbana-drop-demo" },
  { name: "control-nova-setup", path: "/t/nova-setup" },
  { name: "control-aura", path: "/t/aura" },
  { name: "control-jhoselynperu", path: "/t/jhoselynperu" },
  { name: "control-restaurante-demo", path: "/t/restaurante-demo" },
];

test.describe("F41b · Verificación de no regresión en tiendas reales (NULL)", () => {
  for (const s of CONTROL_STORES) {
    test(`Control real: ${s.name} a 375px`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(s.path);
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, `${s.name}.png`);
    });
  }
});
