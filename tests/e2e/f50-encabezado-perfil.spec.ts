import { test, expect, Page } from "@playwright/test";
import path from "path";
import fs from "fs";

// Carpeta de evidencias configurable por variable de entorno o fallback a test-results/
const outputDir =
  process.env.F50_EVIDENCIAS_DIR || path.join(process.cwd(), "test-results", "capturas-f50");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function buildFakeStore(overrides: Record<string, any> = {}) {
  return {
    id: "f50-mock-store-id",
    slug: "boutique-f50",
    name: "Dionelle Atelier",
    phone: "51999888777",
    country_code: "51",
    country_iso: "PE",
    logo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
    brand_color: "#4f46e5",
    bg_color: "#ffffff",
    text_color: "#1e293b",
    card_bg: "#ffffff",
    accent_color: "#e0e7ff",
    border_radius: "12px",
    img_shape: "rounded",
    photo_format: "square",
    is_dark: false,
    banner_image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200",
    banner_title: "NUEVA COLECCIÓN",
    banner_tagline: "Prendas de alta calidad",
    banner_style: "direct",
    niche: "general",
    catalog_typography: "sans",
    card_style: "standard",
    plan: "pro",
    model: "grid",
    active: true,
    is_published: true,
    created_at: new Date().toISOString(),
    whatsapp_clicks: 0,
    views: 0,
    price_filter_enabled: false,
    libro_reclamaciones_activo: false,
    location_address: "Av. Conquistadores 450, San Isidro, Lima",
    header_style: "profile",
    categories: [
      { id: "cat-1", name: "Vestidos|dress", product_count: 2 },
      { id: "cat-2", name: "Blusas|shirt", product_count: 1 },
    ],
    products: [
      {
        id: "prod-1",
        name: "Vestido Gala Seda",
        price: 189.9,
        category_id: "cat-1",
        image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400",
        description: "Vestido largo de seda con acabado artesanal.",
        is_on_sale: false,
        visible: true,
        sort_order: 1,
        variations: [],
        wholesale_tiers: [],
        created_at: new Date().toISOString(),
      },
    ],
    total_products_count: 1,
    ...overrides,
  };
}

async function setupMockRoute(page: Page, storeData: any) {
  // Limpiar almacenamiento previo para evitar caché Zero-Egress local
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  });

  // Interceptar la llamada RPC a Supabase get_public_store
  await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(storeData),
    });
  });

  // Interceptar llamadas auxiliares que no requieren red viva
  await page.route("**/rest/v1/rpc/increment_views*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "1",
    });
  });
}

test.describe("F50 · Encabezado 'Perfil' en App Real (/t/:slug con intercepción RPC)", () => {
  test("Caso 1: Banner con texto grande (header_style: 'profile') a 375px y 1280px", async ({ page }) => {
    const fakeStore = buildFakeStore({
      banner_title: "HASTA 50% DSCTO",
      banner_tagline: "Gran Liquidación de Verano en prendas seleccionadas",
      header_style: "profile",
    });

    await setupMockRoute(page, fakeStore);

    // Móvil (375 px)
    await page.setViewportSize({ width: 375, height: 780 });
    await page.goto("/t/boutique-f50", { waitUntil: "domcontentloaded" });

    const headerLocator = page.locator('[data-testid="profile-header"]');
    await expect(headerLocator).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Dionelle Atelier" })).toBeVisible();
    await expect(page.getByText("HASTA 50% DSCTO")).toBeVisible();

    await page.screenshot({
      path: path.join(outputDir, "caso1-celular-375px.png"),
      fullPage: false,
    });

    // Escritorio (1280 px)
    await page.setViewportSize({ width: 1280, height: 850 });
    await page.goto("/t/boutique-f50", { waitUntil: "domcontentloaded" });
    await expect(headerLocator).toBeVisible();
    await expect(page.getByText("HASTA 50% DSCTO")).toBeVisible();

    await page.screenshot({
      path: path.join(outputDir, "caso1-escritorio-1280px.png"),
      fullPage: false,
    });
  });

  test("Caso 2: Banner con foto (header_style: 'profile') a 375px y 1280px", async ({ page }) => {
    const fakeStore = buildFakeStore({
      banner_image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200",
      banner_title: null,
      banner_tagline: null,
      header_style: "profile",
    });

    await setupMockRoute(page, fakeStore);

    // Móvil (375 px)
    await page.setViewportSize({ width: 375, height: 780 });
    await page.goto("/t/boutique-f50", { waitUntil: "domcontentloaded" });

    const headerLocator = page.locator('[data-testid="profile-header"]');
    await expect(headerLocator).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Dionelle Atelier" })).toBeVisible();

    await page.screenshot({
      path: path.join(outputDir, "caso2-celular-375px.png"),
      fullPage: false,
    });

    // Escritorio (1280 px)
    await page.setViewportSize({ width: 1280, height: 850 });
    await page.goto("/t/boutique-f50", { waitUntil: "domcontentloaded" });
    await expect(headerLocator).toBeVisible();

    await page.screenshot({
      path: path.join(outputDir, "caso2-escritorio-1280px.png"),
      fullPage: false,
    });
  });

  test("Caso 3: Sin banner (solo color de marca, header_style: 'profile') a 375px y 1280px", async ({ page }) => {
    const fakeStore = buildFakeStore({
      banner_image: null,
      banners: [],
      brand_color: "#4f46e5",
      banner_title: null,
      banner_tagline: null,
      header_style: "profile",
    });

    await setupMockRoute(page, fakeStore);

    // Móvil (375 px)
    await page.setViewportSize({ width: 375, height: 780 });
    await page.goto("/t/boutique-f50", { waitUntil: "domcontentloaded" });

    const headerLocator = page.locator('[data-testid="profile-header"]');
    await expect(headerLocator).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Dionelle Atelier" })).toBeVisible();

    await page.screenshot({
      path: path.join(outputDir, "caso3-celular-375px.png"),
      fullPage: false,
    });

    // Escritorio (1280 px)
    await page.setViewportSize({ width: 1280, height: 850 });
    await page.goto("/t/boutique-f50", { waitUntil: "domcontentloaded" });
    await expect(headerLocator).toBeVisible();

    await page.screenshot({
      path: path.join(outputDir, "caso3-escritorio-1280px.png"),
      fullPage: false,
    });
  });

  test("Caso 4: header_style ausente demuestra que se ve el encabezado estándar", async ({ page }) => {
    // Tienda sin header_style (simula tienda existente histórica)
    const fakeStore = buildFakeStore({
      header_style: null,
      banner_image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200",
    });
    delete (fakeStore as any).header_style;

    await setupMockRoute(page, fakeStore);

    await page.setViewportSize({ width: 375, height: 780 });
    await page.goto("/t/boutique-f50", { waitUntil: "domcontentloaded" });

    // El encabezado 'Perfil' NO debe existir
    const profileHeader = page.locator('[data-testid="profile-header"]');
    await expect(profileHeader).toHaveCount(0);

    // La tienda debe renderizarse con el encabezado clásico y nombre
    await expect(page.getByRole("banner").getByText("Dionelle Atelier")).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: path.join(outputDir, "caso4-encabezado-estandar-375px.png"),
      fullPage: false,
    });
  });
});
