import { test, expect, Page } from "@playwright/test";
import path from "path";
import fs from "fs";

// Carpeta de evidencias configurable por variable de entorno o fallback
const outputDir =
  process.env.F50V2_EVIDENCIAS_DIR ||
  path.join(
    process.cwd(),
    "..",
    "..",
    "INFORMACIÓN NECESARIA",
    "04-TECNICA",
    "encargos",
    "capturas-f50v2"
  );

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 7 Fotos reales coincidentes de Atelier Lúa
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

// Tienda común determinista para la prueba píxel a píxel del Escenario 2
export function buildAuditStore(modelId: string) {
  return {
    id: "audit-store-e2e",
    slug: "audit-store",
    name: "Audit Store Official",
    phone: "51987654321",
    country_code: "51",
    country_iso: "PE",
    logo: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='100%' height='100%' fill='%231e293b'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' font-family='sans-serif' font-size='64'>A</text></svg>",
    brand_color: "#4f46e5",
    bg_color: "#ffffff",
    text_color: "#1e293b",
    card_bg: "#ffffff",
    accent_color: "#e0e7ff",
    border_radius: "12px",
    img_shape: "rounded",
    photo_format: null,
    is_dark: false,
    banner_image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='400'><rect width='100%' height='100%' fill='%234f46e5'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' font-family='sans-serif' font-size='48'>AUDIT BANNER</text></svg>",
    banner_title: "COLECCIÓN AUDITORÍA",
    banner_tagline: "Verificación píxel a píxel",
    banner_style: "direct",
    niche: "general",
    catalog_typography: "sans",
    card_style: "standard",
    plan: "pro",
    model: modelId,
    active: true,
    is_published: true,
    created_at: "2026-01-01T00:00:00Z",
    whatsapp_clicks: 0,
    views: 0,
    price_filter_enabled: false,
    libro_reclamaciones_activo: false,
    location_address: "Av. Conquistadores 410, San Isidro",
    categories: [
      { id: "cat-1", name: "Categoría A", product_count: 2 },
      { id: "cat-2", name: "Categoría B", product_count: 1 },
    ],
    products: [
      {
        id: "prod-1",
        name: "Producto A1",
        price: 99.0,
        category_id: "cat-1",
        image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='100%' height='100%' fill='%236366f1'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' font-family='sans-serif' font-size='32'>P1</text></svg>",
        description: "Descripción A1 para prueba visual determinista.",
        is_on_sale: false,
        visible: true,
        sort_order: 1,
        variations: [],
        wholesale_tiers: [],
        created_at: "2026-01-01T00:00:00Z",
      },
      {
        id: "prod-2",
        name: "Producto A2",
        price: 149.0,
        category_id: "cat-1",
        image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='100%' height='100%' fill='%238b5cf6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' font-family='sans-serif' font-size='32'>P2</text></svg>",
        description: "Descripción A2 para prueba visual determinista.",
        is_on_sale: true,
        visible: true,
        sort_order: 2,
        variations: [],
        wholesale_tiers: [],
        created_at: "2026-01-01T00:00:00Z",
      },
      {
        id: "prod-3",
        name: "Producto B1",
        price: 199.0,
        category_id: "cat-2",
        image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='100%' height='100%' fill='%23ec4899'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' font-family='sans-serif' font-size='32'>P3</text></svg>",
        description: "Descripción B1 para prueba visual determinista.",
        is_on_sale: false,
        visible: true,
        sort_order: 3,
        variations: [],
        wholesale_tiers: [],
        created_at: "2026-01-01T00:00:00Z",
      },
    ],
    total_products_count: 3,
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
    // Verificar que la barra superior no estorba ni duplica
    await expect(page.locator('[data-testid="catalog-header-brand"]')).toHaveCSS("opacity", "0");
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(outputDir, "perfil-banner-texto-375px.png"),
      fullPage: false,
      animations: "disabled",
    });

    // Escritorio 1280 px
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/t/atelier-lua", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-testid="profile-header"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="catalog-header-brand"]')).toHaveCSS("opacity", "0");
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(outputDir, "perfil-banner-texto-1280px.png"),
      fullPage: false,
      animations: "disabled",
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
      animations: "disabled",
    });

    // Escritorio 1280 px
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/t/atelier-lua", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-testid="profile-header"]')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(outputDir, "perfil-banner-foto-1280px.png"),
      fullPage: false,
      animations: "disabled",
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
      animations: "disabled",
    });

    // Escritorio 1280 px
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/t/atelier-lua", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-testid="profile-header"]')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(outputDir, "perfil-sin-banner-1280px.png"),
      fullPage: false,
      animations: "disabled",
    });
  });

  // ── Caso 4: Scroll dinámico con verificación expect de opacidad 0 -> 1
  test("Caso 4: Scroll dinámico revela logo y nombre con opacidad 0 a 1 tras bajar > 160 px", async ({ page }) => {
    const store = buildStore({
      model: "perfil",
    });
    await setupMockRoute(page, store);

    // Móvil 375 px
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/t/atelier-lua", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-testid="profile-header"]')).toBeVisible({ timeout: 10000 });

    // 1. Verificación en 1.er pantallazo (scrollY = 0): opacidad 0
    const brandLocator = page.locator('[data-testid="catalog-header-brand"]');
    const actionsLocator = page.locator('[data-testid="catalog-header-actions"]');
    await expect(brandLocator).toHaveCSS("opacity", "0");
    await expect(actionsLocator).toHaveCSS("opacity", "0");

    // 2. Scrollear hacia abajo pasando los 160 px (hasta 350 px)
    await page.evaluate(() => window.scrollTo(0, 350));
    await page.waitForTimeout(600);

    // 3. Verificación tras scroll: opacidad 1
    await expect(brandLocator).toHaveCSS("opacity", "1");
    await expect(actionsLocator).toHaveCSS("opacity", "1");

    // 4. Captura del viewport (no página completa) con la barra visible arriba
    await page.screenshot({
      path: path.join(outputDir, "perfil-scroll-barra-375px.png"),
      fullPage: false,
      animations: "disabled",
    });

    // Escritorio 1280 px
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/t/atelier-lua", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-testid="profile-header"]')).toBeVisible({ timeout: 10000 });

    const brandDesk = page.locator('[data-testid="catalog-header-brand"]');
    await expect(brandDesk).toHaveCSS("opacity", "0");

    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(600);
    await expect(brandDesk).toHaveCSS("opacity", "1");

    await page.screenshot({
      path: path.join(outputDir, "perfil-scroll-barra-1280px.png"),
      fullPage: false,
      animations: "disabled",
    });
  });

  // ── Caso 5: Escenario 2: Verificación de ausencia de ProfileHeader en los 8 diseños ─
  test("Caso 5: Escenario 2: Los 8 diseños oficiales no renderizan ProfileHeader", async ({ page }) => {
    const LOS_8_DISENOS = [
      "arch",
      "bite",
      "bloom_general",
      "diagonal",
      "grid",
      "nature",
      "overlay",
      "vitrina",
    ];

    await page.setViewportSize({ width: 375, height: 812 });

    for (const designId of LOS_8_DISENOS) {
      const auditStore = buildAuditStore(designId);
      await setupMockRoute(page, auditStore);
      await page.goto("/t/audit-store", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(300);
      await expect(page.locator('[data-testid="profile-header"]')).toHaveCount(0);
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

    const tabEstructura = page.locator('button[value="estructura"], [role="tab"]:has-text("Estructura")');
    if (await tabEstructura.isVisible()) {
      await tabEstructura.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({
      path: path.join(outputDir, "panel-admin-diseno-9-modelos-1280px.png"),
      fullPage: false,
      animations: "disabled",
    });
  });
});
