import { test } from "@playwright/test";
import path from "path";
import fs from "fs";

const DEST_DIRS = [
  "D:\\DIZI\\DIZI-20261014T161215Z-1-001\\DIZI\\INFORMACIÓN NECESARIA\\04-TECNICA\\encargos\\capturas-f41\\nuevo",
  "C:\\Users\\jacks\\.gemini\\antigravity\\brain\\fe693a24-4d67-42fd-9d8b-0d2bb4dd705f",
];

for (const dir of DEST_DIRS) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function saveScreenshot(page: any, filename: string) {
  for (const dir of DEST_DIRS) {
    const filePath = path.join(dir, filename);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`Saved screenshot: ${filePath}`);
  }
}

// Store base cargada con los datos reales de zz-audit-f41-visual
const BASE_STORE = {
  id: "s_zzauditf41",
  slug: "zz-audit-f41-visual",
  name: "Boutique Audit F41",
  phone: "51999888777",
  country_code: "51",
  country_iso: "PE",
  plan: "semilla",
  active: true,
  is_published: true,
  model: "grid",
  niche: "ropa",
  brand_color: "#0d9488",
  accent_color: "#0f766e",
  card_style: "standard",
  show_discount_pct: true,
  photo_format: "square",
  categories: [],
  products: [
    {
      id: "p_zzaudit_1",
      name: "Vestido Floral Seda",
      description: "Vestido midi de verano estampado en seda pura",
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
      id: "p_zzaudit_2",
      name: "Blusa Lino Minimal",
      description: "Blusa cuello en V de lino puro",
      price: 49.0,
      original_price: 49.0,
      originalPrice: 49.0,
      is_on_sale: false,
      isOnSale: false,
      visible: true,
      is_sample: false,
      sort_order: 2,
      image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "p_zzaudit_3",
      name: "Pantalón Palazzo Denim",
      description: "Pantalón tiro alto con caída fluida",
      price: 75.0,
      original_price: 75.0,
      originalPrice: 75.0,
      is_on_sale: false,
      isOnSale: false,
      visible: true,
      is_sample: false,
      sort_order: 3,
      image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "p_zzaudit_4",
      name: "Chaqueta Cuero Biker",
      description: "Chaqueta biker con forro interior térmico",
      price: 159.0,
      original_price: 159.0,
      originalPrice: 159.0,
      is_on_sale: false,
      isOnSale: false,
      visible: true,
      is_sample: false,
      sort_order: 4,
      image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "p_zzaudit_5",
      name: "Bolso Tote Cuero Vegano",
      description: "Bolso amplio con compartimento para laptop",
      price: 65.0,
      original_price: 65.0,
      originalPrice: 65.0,
      is_on_sale: false,
      isOnSale: false,
      visible: true,
      is_sample: false,
      sort_order: 5,
      image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "p_zzaudit_6",
      name: "Sandalias Tacón Bloque",
      description: "Sandalias de cuero suave con plantilla confort",
      price: 55.0,
      original_price: 55.0,
      originalPrice: 55.0,
      is_on_sale: false,
      isOnSale: false,
      visible: true,
      is_sample: false,
      sort_order: 6,
      image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80",
    },
  ],
  total_products_count: 6,
};

test.describe("F41 · Capturas solicitadas en capturas-f41/nuevo/", () => {

  // 1. Grilla Cuadrada (375px)
  test("Grilla con formato Cuadrada a 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...BASE_STORE, model: "grid", photo_format: "square" }),
      });
    });
    await page.goto("/t/zz-audit-f41-visual");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await saveScreenshot(page, "grilla-cuadrada-375px.png");
  });

  // 2. Grilla Vertical (375px)
  test("Grilla con formato Vertical a 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...BASE_STORE, model: "grid", photo_format: "portrait" }),
      });
    });
    await page.goto("/t/zz-audit-f41-visual");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await saveScreenshot(page, "grilla-vertical-375px.png");
  });

  // 3. Grilla Completa (375px)
  test("Grilla con formato Completa a 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...BASE_STORE, model: "grid", photo_format: "contain" }),
      });
    });
    await page.goto("/t/zz-audit-f41-visual");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await saveScreenshot(page, "grilla-completa-375px.png");
  });

  // 4. Bloom Estándar Cuadrada (375px)
  test("Bloom Estándar con formato Cuadrada a 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...BASE_STORE, model: "bloom", card_style: "standard", photo_format: "square" }),
      });
    });
    await page.goto("/t/zz-audit-f41-visual");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await saveScreenshot(page, "bloom-cuadrada-375px.png");
  });

  // 5. Bloom Estándar Vertical (375px)
  test("Bloom Estándar con formato Vertical a 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...BASE_STORE, model: "bloom", card_style: "standard", photo_format: "portrait" }),
      });
    });
    await page.goto("/t/zz-audit-f41-visual");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await saveScreenshot(page, "bloom-vertical-375px.png");
  });

  // 6. Bloom Estándar Completa (375px)
  test("Bloom Estándar con formato Completa a 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...BASE_STORE, model: "bloom", card_style: "standard", photo_format: "contain" }),
      });
    });
    await page.goto("/t/zz-audit-f41-visual");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await saveScreenshot(page, "bloom-completa-375px.png");
  });

  // 7. Vitrina a 375px con color de marca no negro (#0d9488)
  test("Vitrina a 375px con color de marca no negro", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...BASE_STORE, model: "vitrina", brand_color: "#0d9488", photo_format: "portrait" }),
      });
    });
    await page.goto("/t/zz-audit-f41-visual");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await saveScreenshot(page, "vitrina-color-375px.png");
  });

  // 8. Vitrina a 1280px con color de marca no negro (#0d9488)
  test("Vitrina a 1280px con color de marca no negro", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...BASE_STORE, model: "vitrina", brand_color: "#0d9488", photo_format: "portrait" }),
      });
    });
    await page.goto("/t/zz-audit-f41-visual");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await saveScreenshot(page, "vitrina-color-1280px.png");
  });

  // 9. Selector en Diseño a 375px SIN formato elegido (Ahora: como siempre)
  test("Selector en Diseño a 375px sin formato elegido", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const storeSinFormato = {
      id: "s_zzauditf41",
      slug: "zz-audit-f41-visual",
      name: "Boutique Audit F41",
      phone: "51999888777",
      countryCode: "51",
      country_code: "51",
      countryIso: "PE",
      country_iso: "PE",
      plan: "semilla",
      active: true,
      isPublished: true,
      model: "grid",
      niche: "ropa",
      brandColor: "#0d9488",
      accentColor: "#0f766e",
      cardStyle: "standard",
      showDiscountPct: true,
      photoFormat: null,
      photo_format: null,
      onboardingCompleted: true,
      onboarding_completed: true,
      createdAt: new Date().toISOString(),
      whatsappClicks: 0,
      categories: [],
      products: BASE_STORE.products,
    };

    await page.addInitScript((storeData) => {
      localStorage.setItem(
        "dizi-catalogos-v2",
        JSON.stringify({
          state: {
            stores: [storeData],
            currentStoreId: storeData.id,
            fetchError: null,
            lastFetched: Date.now(),
          },
          version: 1,
        })
      );
      localStorage.setItem(
        "sb-audit-auth-token",
        JSON.stringify({
          currentSession: {
            access_token: "fake-audit-token",
            user: { id: "user-audit-123", email: "audit@testdizi.com" },
          },
        })
      );
    }, storeSinFormato);

    await page.route("**/auth/v1/user*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "user-audit-123", email: "audit@testdizi.com" }),
      });
    });

    await page.goto("/admin/diseno");
    await page.waitForLoadState("domcontentloaded");

    const selectorHeading = page.locator("h4:has-text('Formato de fotos')").first();
    await selectorHeading.waitFor({ state: "visible", timeout: 15000 });
    await selectorHeading.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    await saveScreenshot(page, "selector-sin-formato-375px.png");
  });

  // 10. Selector en Diseño a 375px CON formato elegido (Volver al original visible)
  test("Selector en Diseño a 375px con formato elegido", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const storeConFormato = {
      id: "s_zzauditf41",
      slug: "zz-audit-f41-visual",
      name: "Boutique Audit F41",
      phone: "51999888777",
      countryCode: "51",
      country_code: "51",
      countryIso: "PE",
      country_iso: "PE",
      plan: "semilla",
      active: true,
      isPublished: true,
      model: "grid",
      niche: "ropa",
      brandColor: "#0d9488",
      accentColor: "#0f766e",
      cardStyle: "standard",
      showDiscountPct: true,
      photoFormat: "portrait",
      photo_format: "portrait",
      onboardingCompleted: true,
      onboarding_completed: true,
      createdAt: new Date().toISOString(),
      whatsappClicks: 0,
      categories: [],
      products: BASE_STORE.products,
    };

    await page.addInitScript((storeData) => {
      localStorage.setItem(
        "dizi-catalogos-v2",
        JSON.stringify({
          state: {
            stores: [storeData],
            currentStoreId: storeData.id,
            fetchError: null,
            lastFetched: Date.now(),
          },
          version: 1,
        })
      );
      localStorage.setItem(
        "sb-audit-auth-token",
        JSON.stringify({
          currentSession: {
            access_token: "fake-audit-token",
            user: { id: "user-audit-123", email: "audit@testdizi.com" },
          },
        })
      );
    }, storeConFormato);

    await page.route("**/auth/v1/user*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "user-audit-123", email: "audit@testdizi.com" }),
      });
    });

    await page.goto("/admin/diseno");
    await page.waitForLoadState("domcontentloaded");

    const selectorHeading = page.locator("h4:has-text('Formato de fotos')").first();
    await selectorHeading.waitFor({ state: "visible", timeout: 15000 });
    await selectorHeading.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    await saveScreenshot(page, "selector-con-formato-375px.png");
  });

});
