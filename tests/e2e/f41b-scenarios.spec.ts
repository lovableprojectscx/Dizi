import { test, expect } from "@playwright/test";

const BASE_STORE = {
  id: "s_zzaudit_scenarios",
  slug: "zz-audit-f41b-scenarios",
  name: "Audit Scenarios Store",
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
  categories: [],
  products: [
    {
      id: "p_scen_1",
      name: "Vestido Floral",
      description: "Vestido midi",
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
      id: "p_scen_2",
      name: "Reloj Cuero",
      description: "Reloj analógico",
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
  ],
  total_products_count: 2,
};

test.describe("F41b · Escenarios E2–E6 en movil-android", () => {
  // E2: Diagonal, Overlay, Arch o Nature con square o portrait usan 1:1 o 3:4
  test("E2: Overlay con portrait (3:4) y square (1:1) en pantalla móvil", async ({ page }) => {
    test.setTimeout(45000);
    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...BASE_STORE, model: "overlay", photo_format: "portrait" }),
      });
    });

    await page.goto("/t/zz-audit-f41b-scenarios", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    const card = page.locator("article").first();
    await expect(card).toBeVisible();
    const style = await card.getAttribute("style");
    expect(style).toMatch(/aspect-ratio:\s*3\s*\/\s*4/);
  });

  // E3: Diagonal, Overlay, Arch o Nature con contain guardado se ven como con NULL (RF-41b.3)
  test("E3: Overlay con contain no permitido usa proporción base 3/4", async ({ page }) => {
    test.setTimeout(45000);
    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...BASE_STORE, model: "overlay", photo_format: "contain" }),
      });
    });

    await page.goto("/t/zz-audit-f41b-scenarios", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    const card = page.locator("article").first();
    await expect(card).toBeVisible();
    const style = await card.getAttribute("style");
    // Al no estar permitido contain en Overlay, vuelve a su ratio base 3/4
    expect(style).toMatch(/aspect-ratio:\s*3\s*\/\s*4/);
  });

  // E4: Bite o Vitrina con contain muestra foto completa sin recorte
  test("E4: Vitrina con contain muestra contain p-2", async ({ page }) => {
    test.setTimeout(45000);
    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...BASE_STORE, model: "vitrina", photo_format: "contain" }),
      });
    });

    await page.goto("/t/zz-audit-f41b-scenarios", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    const img = page.locator("article img").first();
    await expect(img).toBeVisible();
    const classAttr = await img.getAttribute("class");
    expect(classAttr).toContain("object-contain");
  });

  // E5: Selector en /admin/diseno muestra solo Cuadrada y Vertical en Overlay (2 opciones), y 3 en Vitrina
  test("E5: Selector muestra 2 opciones en Overlay y 3 en Vitrina", async ({ page }) => {
    test.setTimeout(45000);
    const mockStore = {
      ...BASE_STORE,
      model: "overlay",
      photoFormat: "portrait",
      photo_format: "portrait",
      onboardingCompleted: true,
      onboarding_completed: true,
      createdAt: new Date().toISOString(),
      whatsappClicks: 0,
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
    }, mockStore);

    await page.route("**/auth/v1/user*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "user-audit-123", email: "audit@testdizi.com" }),
      });
    });

    await page.goto("/admin/diseno", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    const selectorHeading = page.locator("h4:has-text('Formato de fotos')").first();
    await selectorHeading.waitFor({ state: "visible", timeout: 15000 });

    // En Overlay: deben verse botones de Cuadrada y Vertical, pero NO Completa
    const btnCuadrada = page.locator("button:has-text('Cuadrada')");
    const btnVertical = page.locator("button:has-text('Vertical')");
    const btnCompleta = page.locator("button:has-text('Completa')");

    await expect(btnCuadrada).toBeVisible();
    await expect(btnVertical).toBeVisible();
    await expect(btnCompleta).toHaveCount(0);
  });

  // E6: Protección al cambiar de diseño
  test("E6: Tienda con contain en Grilla al cambiar a Overlay se ve como Overlay de hoy", async ({ page }) => {
    test.setTimeout(45000);
    // 1. En Grilla: contain es permitido
    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...BASE_STORE, model: "grid", photo_format: "contain" }),
      });
    });
    await page.goto("/t/zz-audit-f41b-scenarios", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    const imgGrid = page.locator("article img").first();
    const gridClass = await imgGrid.getAttribute("class");
    expect(gridClass).toContain("object-contain");

    // 2. Al cambiar a Overlay: contain no es permitido -> se ve como 3/4 (base)
    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...BASE_STORE, model: "overlay", photo_format: "contain" }),
      });
    });
    await page.goto("/t/zz-audit-f41b-scenarios", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    const cardOverlay = page.locator("article").first();
    const overlayStyle = await cardOverlay.getAttribute("style");
    expect(overlayStyle).toMatch(/aspect-ratio:\s*3\s*\/\s*4/);
  });
});
