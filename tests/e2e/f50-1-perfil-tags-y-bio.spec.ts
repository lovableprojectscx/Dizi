import { test, expect, type Page } from "@playwright/test";
import path from "path";
import fs from "fs";

const outputDir =
  process.env.F50_1_EVIDENCIAS_DIR ||
  path.join(
    process.cwd(),
    "..",
    "..",
    "INFORMACIÓN NECESARIA",
    "04-TECNICA",
    "encargos",
    "capturas-f50-1"
  );

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const DEMO_PRODUCTS = [
  {
    id: "prod-1",
    name: "Polera Crop y Jogger Amarillo",
    price: 119.0,
    category_id: "cat-1",
    image: "/images/demos/boutique-demo/prod_01_polera_crop_jogger_amarillo.webp",
    description: "Conjunto urbano monocromático de dos piezas.",
    is_on_sale: false,
    visible: true,
    sort_order: 1,
    variations: [],
    wholesale_tiers: [],
    created_at: "2026-11-01T00:00:00Z",
  },
  {
    id: "prod-2",
    name: "Abrigo Celeste Largo con Cartera Rosa",
    price: 249.0,
    category_id: "cat-1",
    image: "/images/demos/boutique-demo/prod_02_abrigo_celeste_largo.webp",
    description: "Abrigo elegante de lana con corte recto.",
    is_on_sale: false,
    visible: true,
    sort_order: 2,
    variations: [],
    wholesale_tiers: [],
    created_at: "2026-11-01T00:00:00Z",
  },
  {
    id: "prod-3",
    name: "Vestido Envolvente Floral Blanco",
    price: 139.0,
    category_id: "cat-1",
    image: "/images/demos/boutique-demo/prod_03_vestido_envolvente_floral.webp",
    description: "Vestido fresco con estampado botánico sutil.",
    is_on_sale: true,
    visible: true,
    sort_order: 3,
    variations: [],
    wholesale_tiers: [],
    created_at: "2026-11-01T00:00:00Z",
  },
  {
    id: "prod-4",
    name: "Vestido Midi Rojo Floral con Cinturón",
    price: 159.0,
    category_id: "cat-1",
    image: "/images/demos/boutique-demo/prod_04_vestido_midi_rojo_floral.webp",
    description: "Vestido midi con falda fluida y cinto ajustable.",
    is_on_sale: false,
    visible: true,
    sort_order: 4,
    variations: [],
    wholesale_tiers: [],
    created_at: "2026-11-01T00:00:00Z",
  },
  {
    id: "prod-5",
    name: "Conjunto Top Lentejuelas y Falda Vino",
    price: 189.0,
    category_id: "cat-1",
    image: "/images/demos/boutique-demo/prod_05_conjunto_top_lentejuelas.webp",
    description: "Look de noche sofisticado con brillo sutil.",
    is_on_sale: false,
    visible: true,
    sort_order: 5,
    variations: [],
    wholesale_tiers: [],
    created_at: "2026-11-01T00:00:00Z",
  },
  {
    id: "prod-6",
    name: "Abrigo Negro con Volantes",
    price: 229.0,
    category_id: "cat-1",
    image: "/images/demos/boutique-demo/prod_06_abrigo_negro_volantes.webp",
    description: "Prenda de sastrería femenina con detalles románticos.",
    is_on_sale: true,
    visible: true,
    sort_order: 6,
    variations: [],
    wholesale_tiers: [],
    created_at: "2026-11-01T00:00:00Z",
  },
  {
    id: "prod-7",
    name: "Pantalón Palazzo Blanco Rayas",
    price: 149.0,
    category_id: "cat-1",
    image: "/images/demos/boutique-demo/prod_07_pantalon_palazzo_rayas.webp",
    description: "Pantalón palazzo de tiro alto y caída fluida.",
    is_on_sale: false,
    visible: true,
    sort_order: 7,
    variations: [],
    wholesale_tiers: [],
    created_at: "2026-11-01T00:00:00Z",
  },
];

function buildProfileStore(overrides: Record<string, unknown> = {}) {
  return {
    id: "store-f501-e2e",
    slug: "boutique-demo",
    name: "Atelier Lúa",
    phone: "51987654321",
    country_code: "51",
    country_iso: "PE",
    logo: "/images/demos/boutique-demo/logo.webp",
    brand_color: "#7c2d12",
    bg_color: "#ffffff",
    text_color: "#1e293b",
    card_bg: "#ffffff",
    accent_color: "#fef3c7",
    border_radius: "12px",
    img_shape: "rounded",
    photo_format: "portrait",
    header_style: "standard",
    is_dark: false,
    banner_image: "/images/demos/boutique-demo/banner.webp",
    banner_title: "NUEVA COLECCIÓN",
    banner_tagline: "Elige tus productos y haz tu pedido por WhatsApp.",
    banner_style: "direct",
    niche: "ropa",
    catalog_typography: "sans",
    card_style: "standard",
    plan: "pro",
    model: "perfil",
    active: true,
    is_published: true,
    created_at: "2026-11-01T00:00:00Z",
    whatsapp_clicks: 0,
    views: 0,
    price_filter_enabled: false,
    libro_reclamaciones_activo: false,
    bio_links_enabled: true,
    order_link_enabled: false,
    promo_bar_enabled: true,
    promo_bar_text: "Envíos a todo el Perú · WhatsApp +51 987 654 321",
    location_address: "Av. Conquistadores 410, San Isidro",
    profile_tags: [
      { id: "delivery", value: "Delivery gratis > S/ 99" },
      { id: "recojo" },
      { id: "plin" },
      { id: "custom", value: "Venta por mayor", icon: "package" },
      { id: "horario", value: "Lun–Sáb 9am–7pm" },
    ],
    quick_links: [
      { label: "TikTok", url: "https://tiktok.com/@atelierlua" },
      { label: "Instagram", url: "https://instagram.com/atelierlua" },
    ],
    categories: [{ id: "cat-1", name: "Prendas Femeninas", product_count: 7 }],
    products: DEMO_PRODUCTS,
    total_products_count: 7,
    ...overrides,
  };
}

async function setupPublicStoreMock(page: Page, storeData: Record<string, unknown>) {
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

test.describe("F50.1 · Perfil con Tags, Redes e Integración Link en Bio (Playwright E2E)", () => {
  test("Escenario 9 y 10: Primer pantallazo con tags, redes debajo y botón Info (375px y 1280px)", async ({ page }) => {
    const store = buildProfileStore();
    await setupPublicStoreMock(page, store);

    // Móvil 375 px (full-bleed borde a borde, sin marco lateral)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/t/boutique-demo", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-testid="profile-header"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="profile-tag-delivery"]')).toContainText("Delivery gratis > S/ 99");
    await expect(page.locator('[data-testid="profile-tag-plin"]')).toBeVisible();
    await expect(page.locator('[data-testid="profile-tag-custom-3"]')).toContainText("Venta por mayor");
    await expect(page.locator('[data-testid="profile-tag-horario"]')).toContainText("Lun–Sáb 9am–7pm");
    await expect(page.locator('[data-testid="profile-social-links"]')).toBeVisible();
    await expect(page.locator('[data-testid="profile-social-tiktok"]')).toBeVisible();
    await expect(page.locator('[data-testid="profile-social-instagram"]')).toBeVisible();
    await expect(page.locator('[data-testid="profile-info-mobile-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="catalog-header-brand"]')).toHaveCSS("opacity", "0");

    const mobileBannerBox = await page.locator('[data-testid="profile-banner-container"]').boundingBox();
    expect(mobileBannerBox?.x).toBe(0);
    expect(mobileBannerBox?.width).toBe(375);

    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(outputDir, "f50-1-perfil-completo-375px.png"),
      fullPage: false,
      animations: "disabled",
    });

    // Laptop 1280 x 800 (tarjeta enmarcada alineada, banner 3:1 máx 360px y buscador visible)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/t/boutique-demo", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-testid="profile-header"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="profile-info-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="catalog-header-brand"]')).toHaveCSS("opacity", "0");

    const desktopBannerBox = await page.locator('[data-testid="profile-banner-container"]').boundingBox();
    expect(desktopBannerBox?.height).toBeGreaterThanOrEqual(340);
    expect(desktopBannerBox?.height).toBeLessThanOrEqual(365);
    const searchInputDesktop = page.getByPlaceholder("¿Qué estás buscando hoy?");
    await expect(searchInputDesktop).toBeVisible();
    const searchBox = await searchInputDesktop.boundingBox();
    expect((searchBox?.y || 0) + (searchBox?.height || 0)).toBeLessThanOrEqual(800);

    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(outputDir, "f50-1-perfil-completo-1280px.png"),
      fullPage: false,
      animations: "disabled",
    });

    // PC / Laptop grande 1440 x 900 (sin estirarse de más gracias a max-w-7xl + max-h 360px)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/t/boutique-demo", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-testid="profile-header"]')).toBeVisible({ timeout: 10000 });
    const pcBannerBox = await page.locator('[data-testid="profile-banner-container"]').boundingBox();
    expect(pcBannerBox?.height).toBeGreaterThanOrEqual(340);
    expect(pcBannerBox?.height).toBeLessThanOrEqual(365);
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(outputDir, "f50-1-perfil-completo-1440px.png"),
      fullPage: false,
      animations: "disabled",
    });
  });

  test("Escenario 11: Barra superior controlada por visibilidad real (oculta a 180px si la tarjeta sigue visible; activa al salir + WhatsApp e Info)", async ({ page }) => {
    const store = buildProfileStore();
    await setupPublicStoreMock(page, store);

    // 1. Desktop 1280px con cintillo: scroll corto 180px NO debe activar la barra sobre la tarjeta
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/t/boutique-demo", { waitUntil: "domcontentloaded" });
    const headerCard = page.locator('[data-testid="profile-header"]');
    await expect(headerCard).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="catalog-header-brand"]')).toHaveCSS("opacity", "0");

    await page.evaluate(() => window.scrollTo({ top: 180, behavior: "instant" as ScrollBehavior }));
    await page.waitForTimeout(400);

    // La tarjeta sigue parcialmente en pantalla y la barra NO debe invadirla
    const box180 = await headerCard.boundingBox();
    expect(box180).not.toBeNull();
    expect((box180?.y ?? 0) + (box180?.height ?? 0)).toBeGreaterThan(0);
    await expect(page.locator('[data-testid="catalog-header-brand"]')).toHaveCSS("opacity", "0");

    await page.screenshot({
      path: path.join(outputDir, "f50-1-scroll-180px-barra-oculta-1280px.png"),
      fullPage: false,
      animations: "disabled",
    });

    // 2. Scroll pasando completamente toda la tarjeta Perfil en 1280px
    const fullPassScrollY = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="profile-header"]');
      if (!el) return 700;
      const rect = el.getBoundingClientRect();
      return window.scrollY + rect.bottom + 40;
    });
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior }), fullPassScrollY);
    await expect(page.locator('[data-testid="catalog-header-brand"]')).toHaveCSS("opacity", "1");
    await expect(page.locator('[data-testid="catalog-header-whatsapp"]')).toBeVisible();
    await expect(page.locator('[data-testid="catalog-header-info"]')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(outputDir, "f50-1-scroll-barra-activa-1280px.png"),
      fullPage: false,
      animations: "disabled",
    });

    // 3. Scroll pasando completamente toda la tarjeta Perfil en móvil 375px
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/t/boutique-demo", { waitUntil: "domcontentloaded" });
    await expect(headerCard).toBeVisible({ timeout: 10000 });
    const mobilePassScrollY = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="profile-header"]');
      if (!el) return 700;
      const rect = el.getBoundingClientRect();
      return window.scrollY + rect.bottom + 40;
    });
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior }), mobilePassScrollY);
    await expect(page.locator('[data-testid="catalog-header-brand"]')).toHaveCSS("opacity", "1");
    await expect(page.locator('[data-testid="catalog-header-whatsapp"]')).toBeVisible();
    await expect(page.locator('[data-testid="catalog-header-info"]')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(outputDir, "f50-1-scroll-barra-activa-375px.png"),
      fullPage: false,
      animations: "disabled",
    });
  });

  test("Escenario 12: Perfil sin tags, sin dirección, sin redes ni Link en Bio no deja huecos ni inventa datos", async ({ page }) => {
    const store = buildProfileStore({
      location_address: null,
      profile_tags: [],
      quick_links: [],
      bio_links_enabled: false,
      promo_bar_enabled: false,
    });
    await setupPublicStoreMock(page, store);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/t/boutique-demo", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-testid="profile-header"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="profile-badges"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="profile-social-links"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="profile-info-button"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="profile-info-mobile-button"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="catalog-header-info"]')).toHaveCount(0);
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(outputDir, "f50-1-perfil-limpio-375px.png"),
      fullPage: false,
      animations: "disabled",
    });
  });

  test("Admin /admin/diseno muestra editor de etiquetas únicamente cuando se elige Perfil", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));
    let capturedStorePatch: Record<string, unknown> | null = null;

    const mockAdminStore = {
      id: "store-f501-admin",
      slug: "boutique-demo",
      name: "Atelier Lúa",
      phone: "51987654321",
      countryCode: "51",
      countryIso: "PE",
      logo: "/images/demos/boutique-demo/logo.webp",
      brandColor: "#7c2d12",
      bgColor: "#ffffff",
      textColor: "#1e293b",
      cardBg: "#ffffff",
      accentColor: "#fef3c7",
      borderRadius: "12px",
      imgShape: "rounded",
      photoFormat: "portrait",
      isDark: false,
      bannerImage: "/images/demos/boutique-demo/banner.webp",
      bannerTitle: "NUEVA COLECCIÓN",
      bannerTagline: "Elige tus productos y haz tu pedido por WhatsApp.",
      niche: "ropa",
      catalogTypography: "sans",
      cardStyle: "standard",
      plan: "pro",
      model: "perfil",
      active: true,
      isPublished: true,
      createdAt: "2026-11-01T00:00:00Z",
      whatsappClicks: 0,
      onboardingCompleted: true,
      bioLinksEnabled: true,
      profileTags: [{ id: "delivery" }, { id: "plin" }],
      quickLinks: [{ label: "TikTok", url: "https://tiktok.com/@atelierlua" }],
      categories: [{ id: "cat-1", storeId: "store-f501-admin", name: "Vestidos", order: 0, createdAt: "2026-11-01T00:00:00Z" }],
      products: DEMO_PRODUCTS.map((p) => ({
        id: p.id,
        storeId: "store-f501-admin",
        categoryId: p.category_id,
        name: p.name,
        price: p.price,
        images: [p.image],
        active: true,
        visible: true,
        createdAt: "2026-11-01T00:00:00Z",
      })),
    };

    const fakeUser = {
      id: "user-audit-f501",
      email: "audit@testdizi.com",
      aud: "authenticated",
      role: "authenticated",
      app_metadata: { role: "store_owner" },
      user_metadata: {},
      created_at: "2026-11-01T00:00:00Z",
    };

    await page.addInitScript(
      ({ storeData, user }) => {
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

        const sessionObj = {
          access_token: "fake-audit-token",
          refresh_token: "fake-refresh-token",
          token_type: "bearer",
          expires_in: 36000,
          expires_at: 2524608000,
          user,
          currentSession: {
            access_token: "fake-audit-token",
            refresh_token: "fake-refresh-token",
            token_type: "bearer",
            expires_in: 36000,
            expires_at: 2524608000,
            user,
          },
        };

        localStorage.setItem("sb-dummy-auth-token", JSON.stringify(sessionObj));
      },
      { storeData: mockAdminStore, user: fakeUser }
    );

    await page.route("**/auth/v1/user*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(fakeUser),
      });
    });

    await page.route("**/rest/v1/stores*", async (route) => {
      if (route.request().method() === "PATCH") {
        capturedStorePatch = route.request().postDataJSON() as Record<string, unknown>;
        await route.fulfill({
          status: 204,
          body: "",
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          buildProfileStore({
            id: "store-f501-admin",
            model: "perfil",
            onboarding_completed: true,
            profile_tags: [{ id: "delivery" }, { id: "plin" }],
          }),
        ]),
      });
    });

    await page.route("**/rest/v1/categories*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });

    await page.route("**/rest/v1/products*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/admin/diseno", { waitUntil: "domcontentloaded" });

    const editor = page.locator('[data-testid="profile-tags-editor"]');
    await expect(editor).toBeVisible({ timeout: 10000 });
    await editor.scrollIntoViewIfNeeded();

    // Personalizar texto del preset Delivery y activar Yape
    await page.locator('[data-testid="profile-tag-input-delivery"]').fill("Delivery gratis > S/ 99");
    await page.locator('[data-testid="profile-tag-option-yape"]').click();

    // Agregar etiqueta propia con ícono personalizado ("package")
    await page.locator('[data-testid="profile-tag-add-custom"]').click();
    await page.locator('[data-testid="profile-tag-input-custom-3"]').fill("Venta por mayor");
    await page.locator('[data-testid="profile-tag-icon-3-package"]').click();

    // Verificar Live Preview simulado móvil y contador (4/6)
    await expect(page.locator('[data-testid="profile-tags-counter"]')).toHaveText("4/6");
    await expect(page.locator('[data-testid="profile-tag-delivery"]').first()).toContainText("Delivery gratis > S/ 99");
    await expect(page.locator('[data-testid="profile-tag-yape"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="profile-tag-custom-3"]').first()).toContainText("Venta por mayor");
    await expect(page.locator('[data-testid="profile-info-mobile-button"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="profile-info-button"]')).toHaveCount(0);

    // Reordenar subiendo la etiqueta propia 1 posición (de índice 3 a índice 2)
    await page.locator('[data-testid="profile-tag-move-up-3"]').click();
    await expect(page.locator('[data-testid="profile-tag-custom-2"]').first()).toContainText("Venta por mayor");

    await editor.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(outputDir, "f50-1-admin-editor-tags-perfil-1280px.png"),
      fullPage: false,
      animations: "disabled",
    });

    // Guardar cambios y verificar que el payload enviado a Supabase REST incluya profile_tags ordenado y personalizado
    await page.getByRole("button", { name: "Guardar cambios" }).first().click();
    await expect.poll(() => capturedStorePatch).not.toBeNull();
    expect(capturedStorePatch?.profile_tags).toEqual([
      { id: "delivery", value: "Delivery gratis > S/ 99" },
      { id: "plin" },
      { id: "custom", value: "Venta por mayor", icon: "package" },
      { id: "yape" },
    ]);

    // Cambiar al diseño Overlay Visual y comprobar que el editor de tags ya NO aparece
    await page.locator("h4", { hasText: "Overlay Visual" }).first().click();
    await expect(editor).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });
});
