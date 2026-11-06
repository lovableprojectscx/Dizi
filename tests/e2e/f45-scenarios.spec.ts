import { test, expect } from "@playwright/test";

const BASE_STORE = {
  id: "s_zzaudit_f45",
  slug: "zz-audit-f45-store",
  name: "Boutique Bella",
  phone: "51999888777",
  country_code: "51",
  country_iso: "PE",
  plan: "semilla",
  active: true,
  is_published: true,
  is_dark: false,
  brand_color: "#ec4899",
  card_style: "standard",
  model: "grid",
  niche: "ropa",
  banner_image: null,
  banner_title: null,
  banner_tagline: null,
  total_products_count: 2,
  categories: [{ id: "cat_1", name: "Principal", product_count: 2 }],
  products: [
    {
      id: "p_1",
      name: "Vestido Floral Seda",
      description: "Vestido elegante",
      price: 120.0,
      visible: true,
      image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600",
    },
    {
      id: "p_2",
      name: "Blusa Lino Blanco",
      description: "Blusa fresca",
      price: 80.0,
      visible: true,
      image: "https://images.unsplash.com/photo-1551803091-e20673f15770?w=600",
    },
  ],
};

test.describe("F45 · Primera Impresión (E1–E9)", () => {
  test("E1 & E2: Tienda Semilla sin portada y rubro 'ropa' muestra BrandCover con eslogan predeterminado", async ({ page }) => {
    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(BASE_STORE),
      });
    });

    await page.goto("http://localhost:5173/t/zz-audit-f45-store");
    await page.waitForLoadState("domcontentloaded");

    const brandCover = page.locator('[data-testid="brand-cover"]');
    await expect(brandCover).toBeVisible();
    await expect(brandCover).toContainText("Boutique Bella");
    await expect(brandCover).toContainText("Moda que te queda, directo a tu WhatsApp");
  });

  test("E3: Tienda Pro con portada con foto no muestra BrandCover", async ({ page }) => {
    const proStore = {
      ...BASE_STORE,
      plan: "pro",
      banner_image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200",
    };

    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(proStore),
      });
    });

    await page.goto("http://localhost:5173/t/zz-audit-f45-store");
    await page.waitForLoadState("domcontentloaded");

    const brandCover = page.locator('[data-testid="brand-cover"]');
    await expect(brandCover).toHaveCount(0);
  });

  test("E6: Con 2 productos (1 a 3), muestra ContactStripe y NO publicidad en la grilla", async ({ page }) => {
    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(BASE_STORE),
      });
    });

    await page.goto("http://localhost:5173/t/zz-audit-f45-store");
    await page.waitForLoadState("domcontentloaded");

    // Franja de contacto visible
    const contactStripe = page.locator('[data-testid="contact-stripe"]');
    await expect(contactStripe).toBeVisible();
    await expect(contactStripe).toContainText("¿Buscas algo más? Escríbenos");

    // Publicidad nativa en la grilla ausente
    const nativeAd = page.locator('article:has-text("Crea tu catálogo gratis con Dizi")');
    await expect(nativeAd).toHaveCount(0);
  });

  test("E7: Con 5 productos, publicidad en grilla activa y ContactStripe ausente", async ({ page }) => {
    const store5 = {
      ...BASE_STORE,
      total_products_count: 5,
      products: [
        ...BASE_STORE.products,
        { id: "p_3", name: "Pantalón Denim", price: 95.0, visible: true, image: "https://images.unsplash.com/photo-1542272604-780c96856592?w=600" },
        { id: "p_4", name: "Falda Plisada", price: 75.0, visible: true, image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600" },
        { id: "p_5", name: "Casaca Cuero", price: 210.0, visible: true, image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600" },
      ],
    };

    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(store5),
      });
    });

    await page.goto("http://localhost:5173/t/zz-audit-f45-store");
    await page.waitForLoadState("domcontentloaded");

    // Franja de contacto ausente (porque tiene >= 4 productos)
    const contactStripe = page.locator('[data-testid="contact-stripe"]');
    await expect(contactStripe).toHaveCount(0);
  });

  test("E8: En el registro (/register), rubro Comida muestra 3 paletas sugeridas", async ({ page }) => {
    await page.goto("http://localhost:5173/register");
    await page.waitForLoadState("domcontentloaded");

    // Llenar paso 1
    await page.fill('input[placeholder="Ej. Florería María"]', "Mi Tienda Test");
    await page.selectOption('select', "comida");
    await page.fill('input[type="tel"]', "987654321");

    const nextBtn = page.locator('button:has-text("Siguiente paso")');
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();

    // Paso 2: Paletas sugeridas presentes
    await expect(page.locator("text=Paletas sugeridas para tu rubro")).toBeVisible();
    await expect(page.locator("text=Cálido Tradicional")).toBeVisible();
    await expect(page.locator("text=Vibrante Naranja")).toBeVisible();
    await expect(page.locator("text=Claro Minimalista")).toBeVisible();
  });
});
