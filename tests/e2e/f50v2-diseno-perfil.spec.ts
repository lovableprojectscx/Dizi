import { test, expect, Page } from "@playwright/test";
import path from "path";
import fs from "fs";

// Carpeta de evidencias configurable por variable de entorno o fallback a test-results/capturas-f50v2
const outputDir =
  process.env.F50V2_EVIDENCIAS_DIR ||
  path.join(process.cwd(), "test-results", "capturas-f50v2");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const DEMO_PRODUCTS = [
  {
    id: "prod-1",
    name: "Polera Crop y Jogger Amarillo",
    price: 119.0,
    category_id: "cat-1",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600",
    description: "Conjunto urbano monocromático de dos piezas.",
    is_on_sale: false,
    visible: true,
    sort_order: 1,
    variations: [],
    wholesale_tiers: [],
    created_at: new Date().toISOString(),
  },
  {
    id: "prod-2",
    name: "Abrigo Celeste Largo con Cartera Rosa",
    price: 249.0,
    category_id: "cat-1",
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600",
    description: "Abrigo elegante de lana con corte recto.",
    is_on_sale: false,
    visible: true,
    sort_order: 2,
    variations: [],
    wholesale_tiers: [],
    created_at: new Date().toISOString(),
  },
  {
    id: "prod-3",
    name: "Vestido Envolvente Floral Blanco",
    price: 139.0,
    category_id: "cat-1",
    image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600",
    description: "Vestido fresco con estampado botánico sutil.",
    is_on_sale: true,
    visible: true,
    sort_order: 3,
    variations: [],
    wholesale_tiers: [],
    created_at: new Date().toISOString(),
  },
  {
    id: "prod-4",
    name: "Vestido Midi Rojo Floral con Cinturón",
    price: 159.0,
    category_id: "cat-1",
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600",
    description: "Vestido midi con falda fluida y cinto ajustable.",
    is_on_sale: false,
    visible: true,
    sort_order: 4,
    variations: [],
    wholesale_tiers: [],
    created_at: new Date().toISOString(),
  },
  {
    id: "prod-5",
    name: "Conjunto Top Lentejuelas y Falda Vino",
    price: 189.0,
    category_id: "cat-1",
    image: "https://images.unsplash.com/photo-1550614000-4895a10e1bfd?w=600",
    description: "Look de noche sofisticado con brillo sutil.",
    is_on_sale: false,
    visible: true,
    sort_order: 5,
    variations: [],
    wholesale_tiers: [],
    created_at: new Date().toISOString(),
  },
  {
    id: "prod-6",
    name: "Abrigo Negro con Volantes y Botones Aperlados",
    price: 229.0,
    category_id: "cat-1",
    image: "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=600",
    description: "Prenda de sastrería femenina con detalles románticos.",
    is_on_sale: false,
    visible: true,
    sort_order: 6,
    variations: [],
    wholesale_tiers: [],
    created_at: new Date().toISOString(),
  },
  {
    id: "prod-7",
    name: "Pantalón Palazzo a Rayas con Top Blanco",
    price: 145.0,
    category_id: "cat-1",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600",
    description: "Pantalón palazzo de tiro alto con caída fluida.",
    is_on_sale: false,
    visible: true,
    sort_order: 7,
    variations: [],
    wholesale_tiers: [],
    created_at: new Date().toISOString(),
  },
];

function buildStore(overrides: Record<string, any> = {}) {
  return {
    id: "store-atelier-lua",
    slug: "atelier-lua",
    name: "Atelier Lúa",
    phone: "51987654321",
    country_code: "51",
    country_iso: "PE",
    logo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
    brand_color: "#b45309",
    bg_color: "#ffffff",
    text_color: "#1e293b",
    card_bg: "#ffffff",
    accent_color: "#fef3c7",
    border_radius: "12px",
    img_shape: "rounded",
    photo_format: "square",
    is_dark: false,
    banner_image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200",
    banner_title: "NUEVA COLECCIÓN",
    banner_tagline: "Moda femenina y estilo contemporáneo",
    banner_style: "direct",
    niche: "general",
    catalog_typography: "sans",
    card_style: "standard",
    plan: "pro",
    model: "perfil",
    active: true,
    is_published: true,
    created_at: new Date().toISOString(),
    whatsapp_clicks: 0,
    views: 0,
    price_filter_enabled: false,
    libro_reclamaciones_activo: false,
    location_address: "Av. Conquistadores 410, San Isidro, Lima",
    categories: [
      { id: "cat-1", name: "Prendas Femeninas", product_count: 7 },
    ],
    products: DEMO_PRODUCTS,
    total_products_count: 7,
    ...overrides,
  };
}

async function setupMockRoute(page: Page, storeData: any) {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  });

  await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(storeData),
    });
  });

  await page.route("**/rest/v1/rpc/increment_views*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "1",
    });
  });
}

test.describe("F50 v2 · Diseño n.º 9 Perfil (Playwright E2E)", () => {
  // ── Caso 1: Banner con texto grande (375 px y 1280 px) ─────────────
  test("Caso 1: Banner con texto grande (model: 'perfil') a 375px y 1280px", async ({ page }) => {
    const store = buildStore({
      model: "perfil",
      banner_image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200",
      banner_title: "NUEVA COLECCIÓN",
      banner_tagline: "Moda femenina y estilo contemporáneo",
    });
    await setupMockRoute(page, store);

    // Móvil 375 px
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/t/atelier-lua", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-testid="profile-header"]')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(outputDir, "perfil-banner-texto-375px.png"),
      fullPage: false,
    });

    // Escritorio 1280 px
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/t/atelier-lua", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-testid="profile-header"]')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(outputDir, "perfil-banner-texto-1280px.png"),
      fullPage: false,
    });
  });

  // ── Caso 2: Banner con foto (375 px y 1280 px) ─────────────────────
  test("Caso 2: Banner con foto (sin texto en banner) a 375px y 1280px", async ({ page }) => {
    const store = buildStore({
      model: "perfil",
      banner_image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200",
      banner_title: "",
      banner_tagline: "Moda femenina y estilo contemporáneo",
    });
    await setupMockRoute(page, store);

    // Móvil 375 px
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/t/atelier-lua", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-testid="profile-header"]')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(outputDir, "perfil-banner-foto-375px.png"),
      fullPage: false,
    });

    // Escritorio 1280 px
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/t/atelier-lua", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-testid="profile-header"]')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(outputDir, "perfil-banner-foto-1280px.png"),
      fullPage: false,
    });
  });

  // ── Caso 3: Sin banner (solo color de marca) (375 px y 1280 px) ───
  test("Caso 3: Sin banner (solo color de marca) a 375px y 1280px", async ({ page }) => {
    const store = buildStore({
      model: "perfil",
      banner_image: "",
      banner_title: "",
      banner_tagline: "Moda femenina y estilo contemporáneo",
      brand_color: "#b45309",
    });
    await setupMockRoute(page, store);

    // Móvil 375 px
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/t/atelier-lua", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-testid="profile-header"]')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(outputDir, "perfil-sin-banner-375px.png"),
      fullPage: false,
    });

    // Escritorio 1280 px
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/t/atelier-lua", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-testid="profile-header"]')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(outputDir, "perfil-sin-banner-1280px.png"),
      fullPage: false,
    });
  });

  // ── Caso 4: Scroll dinámico (la barra superior revela logo y nombre) ─
  test("Caso 4: Scroll dinámico revela logo y nombre en la barra sticky (375px y 1280px)", async ({ page }) => {
    const store = buildStore({
      model: "perfil",
    });
    await setupMockRoute(page, store);

    // Móvil 375 px con scroll
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/t/atelier-lua", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-testid="profile-header"]')).toBeVisible({ timeout: 10000 });
    // Scrollear hacia abajo para superar el encabezado (> 160 px)
    await page.evaluate(() => window.scrollTo(0, 350));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(outputDir, "perfil-scroll-barra-375px.png"),
      fullPage: false,
    });

    // Escritorio 1280 px con scroll
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/t/atelier-lua", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-testid="profile-header"]')).toBeVisible({ timeout: 10000 });
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(outputDir, "perfil-scroll-barra-1280px.png"),
      fullPage: false,
    });
  });

  // ── Caso 5: Escenario 2: 8 capturas "después" a 375 px de las 8 demos ─
  test("Caso 5: Escenario 2: 8 capturas 'después' a 375px de las 8 demos", async ({ page }) => {
    const DEMOS = [
      { id: "arch", slug: "floreria-demo" },
      { id: "bite", slug: "burger-demo" },
      { id: "bloom_general", slug: "pasteleria-demo" },
      { id: "diagonal", slug: "ferreteria-demo" },
      { id: "grid", slug: "minimarket-demo" },
      { id: "nature", slug: "botanica-demo" },
      { id: "overlay", slug: "cafe-demo" },
      { id: "vitrina", slug: "zapatillas-demo" },
    ];

    await page.setViewportSize({ width: 375, height: 812 });

    for (const d of DEMOS) {
      const storeData = buildStore({
        slug: d.slug,
        model: d.id,
      });
      await setupMockRoute(page, storeData);
      await page.goto(`/t/${d.slug}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(600);
      await page.screenshot({
        path: path.join(outputDir, `demo-${d.id}-despues-375px.png`),
        fullPage: false,
      });
    }
  });

  // ── Caso 6: Panel admin.diseno mostrando los 9 modelos ─────────────
  test("Caso 6: Panel /admin/diseno selector muestra los 9 modelos oficiales a 1280px", async ({ page }) => {
    const mockStore = {
      ...buildStore({ model: "perfil" }),
      photoFormat: "square",
      onboardingCompleted: true,
    };

    await page.addInitScript((storeData) => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
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

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/admin/diseno", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    // Asegurarse de estar en la pestaña estructura
    const tabEstructura = page.locator('button[value="estructura"], [role="tab"]:has-text("Estructura")');
    if (await tabEstructura.isVisible()) {
      await tabEstructura.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({
      path: path.join(outputDir, "panel-admin-diseno-9-modelos-1280px.png"),
      fullPage: false,
    });
  });
});
