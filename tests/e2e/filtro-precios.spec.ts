import { test, expect, type Page, type Locator } from "@playwright/test";

const IMG_BLUE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><rect width='100%' height='100%' fill='%234f46e5'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' font-family='sans-serif' font-size='24'>IMG</text></svg>";
const LOGO_SVG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='100%' height='100%' fill='%2318181b'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' font-family='sans-serif' font-size='40'>D</text></svg>";

function makeProd(
  id: string,
  name: string,
  price: number,
  categoryId = "cat-1",
  variations: Array<{ id: string; name: string; price?: number }> = [],
) {
  return {
    id,
    name,
    price,
    category_id: categoryId,
    image: IMG_BLUE,
    description: "",
    is_on_sale: false,
    visible: true,
    is_sample: false,
    sort_order: 1,
    variations,
    wholesale_tiers: [],
    created_at: "2026-01-01T00:00:00Z",
  };
}

function makeStorePayload(overrides: Record<string, any>) {
  return {
    id: overrides.id || "store-zz-audit-fp",
    slug: overrides.slug || "zz-audit-fp-test",
    name: overrides.name || "Tienda Audit FP",
    phone: "51987654321",
    country_code: "51",
    country_iso: "PE",
    logo: LOGO_SVG,
    brand_color: "#4f46e5",
    bg_color: overrides.is_dark ? "#141414" : "#ffffff",
    text_color: overrides.is_dark ? "#ffffff" : "#18181b",
    card_bg: overrides.is_dark ? "#1f1f1f" : "#ffffff",
    accent_color: "#e0e7ff",
    border_radius: "12px",
    img_shape: "rounded",
    photo_format: null,
    header_style: "standard",
    is_dark: overrides.is_dark ?? false,
    banner_image: IMG_BLUE,
    banner_title: "Colección Audit",
    banner_tagline: "Prueba Filtro Precios",
    banner_style: "direct",
    niche: "moda",
    catalog_typography: "sans",
    card_style: "standard",
    plan: "pro",
    model: "bloom_general",
    active: true,
    is_published: true,
    created_at: "2026-01-01T00:00:00Z",
    whatsapp_clicks: 0,
    views: 0,
    price_filter_enabled: true,
    libro_reclamaciones_activo: false,
    wholesale_enabled: false,
    order_link_enabled: false,
    show_featured: false,
    show_discount_pct: false,
    categories: [{ id: "cat-1", name: "Polos", product_count: 4 }],
    products: [],
    total_products_count: 4,
    ...overrides,
  };
}

async function setupCommonMocks(
  page: Page,
  storePayload: Record<string, any>,
  onProductsRpc?: (body: Record<string, any>) => { status?: number; json: unknown },
) {
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
      body: JSON.stringify(storePayload),
    });
  });

  await page.route("**/rest/v1/rpc/get_public_store_products*", async (route) => {
    const reqBody = route.request().postDataJSON() || {};
    if (onProductsRpc) {
      const res = onProductsRpc(reqBody);
      await route.fulfill({
        status: res.status ?? 200,
        contentType: "application/json",
        body: JSON.stringify(res.json),
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });

  await page.route("**/rest/v1/rpc/increment_views*", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "1" });
  });
}

async function setRangeValue(locator: Locator, val: number) {
  await locator.fill(String(val));
}

test.describe("Filtro de Precios (E1–E7)", () => {
  test("E1: Con price_filter_enabled=false mantiene 0 px de UI nueva en PC y móvil", async ({
    browser,
  }) => {
    const storeOff = makeStorePayload({
      slug: "zz-audit-fp-off",
      model: "bite",
      is_dark: true,
      price_filter_enabled: false,
      products: [makeProd("p1", "Café Negro", 12), makeProd("p2", "Torta Chocolate", 22)],
      total_products_count: 2,
      categories: [{ id: "cat-1", name: "Bebidas", product_count: 2 }],
    });

    // Móvil 375px en bite apagado -> no debe mostrar botón Filtros ni slider
    const mobileCtx = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileCtx.newPage();
    await setupCommonMocks(mobilePage, storeOff);
    await mobilePage.goto("/t/zz-audit-fp-off", { waitUntil: "domcontentloaded" });
    await expect(mobilePage.getByText("Café Negro").first()).toBeVisible({ timeout: 15000 });
    await expect(mobilePage.getByRole("button", { name: /^Filtros$/i })).toHaveCount(0);
    await expect(mobilePage.getByTestId("price-range-slider")).toHaveCount(0);
    const hasOverflow = await mobilePage.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
    await mobileCtx.close();

    // Escritorio 1280px con diseño estándar y filtro apagado -> aside sin Rango de precio
    const desktopCtx = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      isMobile: false,
    });
    const desktopPage = await desktopCtx.newPage();
    await setupCommonMocks(
      desktopPage,
      makeStorePayload({
        ...storeOff,
        model: "bloom_general",
        is_dark: false,
      }),
    );
    await desktopPage.goto("/t/zz-audit-fp-off", { waitUntil: "domcontentloaded" });
    await expect(desktopPage.getByText("Café Negro").first()).toBeVisible({ timeout: 15000 });
    await expect(desktopPage.locator("aside").getByText("Categorías")).toBeVisible();
    await expect(desktopPage.locator("aside").getByTestId("price-range-slider")).toHaveCount(0);
    await desktopCtx.close();
  });

  test("E2: En escritorio (1280px) el aside muestra slider dual Min–Max funcional y limpiable", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      isMobile: false,
    });
    const page = await context.newPage();
    const store = makeStorePayload({
      slug: "zz-audit-fp-e2",
      products: [
        makeProd("p1", "Polo Básico", 20),
        makeProd("p2", "Polo Pima", 55),
        makeProd("p3", "Casaca Urban", 120),
        makeProd("p4", "Abrigo Lana", 200),
      ],
      total_products_count: 4,
    });

    await setupCommonMocks(page, store);
    await page.goto("/t/zz-audit-fp-e2", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Abrigo Lana")).toBeVisible({ timeout: 15000 });

    const aside = page.locator("aside");
    await expect(aside.getByText("Rango de precio")).toBeVisible();
    const minSlider = aside.getByTestId("price-slider-min");
    const maxSlider = aside.getByTestId("price-slider-max");

    await setRangeValue(minSlider, 50);
    await setRangeValue(maxSlider, 130);

    await expect(page.getByTestId("results-bar")).toContainText("S/ 50 – S/ 130");
    await expect(page.getByText("Polo Pima")).toBeVisible();
    await expect(page.getByText("Casaca Urban")).toBeVisible();
    await expect(page.getByText("Polo Básico")).toHaveCount(0);
    await expect(page.getByText("Abrigo Lana")).toHaveCount(0);

    await aside.getByTestId("price-slider-reset").click();
    await expect(page.getByTestId("results-bar")).toHaveCount(0);
    await expect(page.getByText("Polo Básico")).toBeVisible();
    await expect(page.getByText("Abrigo Lana")).toBeVisible();
    await context.close();
  });

  test("E3: En móvil (375px) cumple objetivos táctiles >= 44px y filtra desde el Drawer", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    const store = makeStorePayload({
      slug: "zz-audit-fp-e3",
      products: [
        makeProd("p1", "Vincha Seda", 20),
        makeProd("p2", "Cartera Día", 85),
        makeProd("p3", "Bolso Viaje", 180),
      ],
      total_products_count: 3,
      categories: [{ id: "cat-1", name: "Accesorios", product_count: 3 }],
    });

    await setupCommonMocks(page, store);
    await page.goto("/t/zz-audit-fp-e3", { waitUntil: "domcontentloaded" });
    const filterBtn = page.getByRole("button", { name: /Filtros/i }).first();
    await expect(filterBtn).toBeVisible({ timeout: 15000 });
    const btnBox = await filterBtn.boundingBox();
    expect(btnBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    await filterBtn.click();
    const drawer = page.getByRole("dialog");
    const maxSlider = drawer.getByTestId("price-slider-max");
    await expect(maxSlider).toBeVisible();
    const sliderBox = await maxSlider.boundingBox();
    expect(sliderBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    await setRangeValue(maxSlider, 90);
    const applyBtn = drawer.getByRole("button", { name: /Ver 2 productos/i });
    const applyBox = await applyBtn.boundingBox();
    expect(applyBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    await applyBtn.click();

    await expect(page.getByText("Vincha Seda")).toBeVisible();
    await expect(page.getByText("Cartera Día")).toBeVisible();
    await expect(page.getByText("Bolso Viaje")).toHaveCount(0);
    await expect(page.getByTestId("results-bar")).toContainText("S/ 20 – S/ 90");

    const overflowX = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflowX).toBe(false);
    await context.close();
  });

  test("E4: Diseño bite con filtro encendido mantiene buscador full-width, muestra Filtros junto a Categorías y filtra correctamente", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    const store = makeStorePayload({
      slug: "zz-audit-fp-bite",
      model: "bite",
      is_dark: true,
      products: [
        makeProd("b1", "Espresso Simple", 12),
        makeProd("b2", "Box Brunch Dulce", 45),
      ],
      total_products_count: 2,
      categories: [{ id: "cat-1", name: "Cafetería", product_count: 2 }],
    });

    await setupCommonMocks(page, store);
    await page.goto("/t/zz-audit-fp-bite", { waitUntil: "domcontentloaded" });
    const searchInput = page.getByPlaceholder("¿Qué estás buscando hoy?");
    const filterBtn = page.getByRole("button", { name: /Filtros/i }).first();
    await expect(searchInput).toBeVisible({ timeout: 15000 });
    await expect(filterBtn).toBeVisible({ timeout: 15000 });

    const searchBox = await searchInput.boundingBox();
    const filterBox = await filterBtn.boundingBox();
    expect(searchBox?.width ?? 0).toBeGreaterThanOrEqual(320);
    expect(filterBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect((filterBox?.y ?? 0)).toBeGreaterThan((searchBox?.y ?? 0) + (searchBox?.height ?? 0) - 2);

    await filterBtn.click();
    const drawer = page.getByRole("dialog");
    await setRangeValue(drawer.getByTestId("price-slider-max"), 20);
    await drawer.getByRole("button", { name: /Ver 1 producto/i }).click();

    await expect(page.getByText("Espresso Simple")).toBeVisible();
    await expect(page.getByText("Box Brunch Dulce")).toHaveCount(0);
    await context.close();
  });

  test("E5: Excluye A consultar al filtrar, incluye coincidencia por variación y vuelve a neutro en extremos", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      isMobile: false,
    });
    const page = await context.newPage();
    const store = makeStorePayload({
      slug: "zz-audit-fp-e5",
      products: [
        makeProd("v0", "Diseño A Medida", 0),
        makeProd("v1", "Zapatilla Running", 190, "cat-1", [
          { id: "var-s", name: "Talla 36", price: 65 },
          { id: "var-l", name: "Talla 42", price: 190 },
        ]),
        makeProd("v2", "Medias Sport", 40),
        makeProd("v3", "Casaca Termica", 250),
      ],
      total_products_count: 4,
    });

    await setupCommonMocks(page, store);
    await page.goto("/t/zz-audit-fp-e5", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Diseño A Medida")).toBeVisible({ timeout: 15000 });

    const aside = page.locator("aside");
    const minSlider = aside.getByTestId("price-slider-min");
    const maxSlider = aside.getByTestId("price-slider-max");

    await setRangeValue(minSlider, 55);
    await setRangeValue(maxSlider, 100);

    // "Diseño A Medida" (price=0) desaparece; "Zapatilla Running" coincide vía variación S/ 65
    await expect(page.getByText("Zapatilla Running")).toBeVisible();
    await expect(page.getByText("Diseño A Medida")).toHaveCount(0);
    await expect(page.getByText("Medias Sport")).toHaveCount(0);
    await expect(page.getByText("Casaca Termica")).toHaveCount(0);

    // Devolver ambos extremos a [40, 250] -> normaliza a null y restaura "Diseño A Medida"
    await setRangeValue(minSlider, 40);
    await setRangeValue(maxSlider, 250);
    await expect(page.getByTestId("results-bar")).toHaveCount(0);
    await expect(page.getByText("Diseño A Medida")).toBeVisible();
    await context.close();
  });

  test("E6: En catálogos > 36 ítems usa price_bounds reales y soporta fallback legacy PGRST202", async ({
    browser,
  }) => {
    const first36 = Array.from({ length: 36 }, (_, idx) =>
      makeProd(`p-${idx + 1}`, `Cartera Top ${idx + 1}`, 80 + idx * 5),
    );
    const tail6 = [
      makeProd("p-37", "Monedero Retro", 95),
      makeProd("p-38", "Llavero Cuero", 48),
      makeProd("p-39", "Tarjetero Mini", 45),
      makeProd("p-40", "Billetera Pos40", 52),
      makeProd("p-41", "Bolso Midi", 110),
      makeProd("p-42", "Bandolera", 130),
    ];

    // 6a: RPC nuevo con p_min_price / p_max_price
    {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, isMobile: false });
      const page = await ctx.newPage();
      let seenPriceRpc = false;

      const storeBig = makeStorePayload({
        slug: "zz-audit-fp-big",
        price_bounds: { min: 45, max: 255 },
        products: first36,
        total_products_count: 42,
        categories: [{ id: "cat-1", name: "Carteras", product_count: 42 }],
      });

      await setupCommonMocks(page, storeBig, (body) => {
        if (body.p_min_price !== undefined || body.p_max_price !== undefined) {
          seenPriceRpc = true;
          const minP = Number(body.p_min_price ?? 0);
          const maxP = Number(body.p_max_price ?? 99999);
          return {
            json: [...first36, ...tail6].filter((p) => p.price >= minP && p.price <= maxP),
          };
        }
        return { json: [] };
      });

      await page.goto("/t/zz-audit-fp-big", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "Cartera Top 1", exact: true })).toBeVisible({
        timeout: 15000,
      });

      const aside = page.locator("aside");
      await expect(aside.getByText("Desde S/ 45")).toBeVisible();
      await setRangeValue(aside.getByTestId("price-slider-max"), 55);

      await expect(page.getByText("Llavero Cuero")).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("Billetera Pos40")).toBeVisible();
      expect(seenPriceRpc).toBe(true);
      await ctx.close();
    }

    // 6b: Fallback automático cuando producción todavía responde PGRST202 al llamar 7 parámetros
    {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, isMobile: false });
      const page = await ctx.newPage();
      let legacyFallbackCalled = false;

      const storeLegacy = makeStorePayload({
        slug: "zz-audit-fp-legacy",
        products: first36,
        total_products_count: 42,
        categories: [{ id: "cat-1", name: "Carteras", product_count: 42 }],
      });

      await setupCommonMocks(page, storeLegacy, (body) => {
        if ("p_min_price" in body || "p_max_price" in body) {
          return {
            status: 404,
            json: { code: "PGRST202", message: "Could not find the function public.get_public_store_products" },
          };
        }
        legacyFallbackCalled = true;
        return { json: tail6 };
      });

      await page.goto("/t/zz-audit-fp-legacy", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "Cartera Top 1", exact: true })).toBeVisible({
        timeout: 15000,
      });

      await expect(page.locator("aside").getByText("Desde S/ 80")).toBeVisible();
      await setRangeValue(page.locator("aside").getByTestId("price-slider-max"), 85);
      await expect(page.getByText("Billetera Pos40")).toBeVisible({ timeout: 10000 });
      await expect(page.locator("aside").getByText("Desde S/ 45")).toBeVisible();
      await setRangeValue(page.locator("aside").getByTestId("price-slider-max"), 55);
      await expect(page.getByText("Cartera Top 1")).not.toBeVisible();
      await expect(page.getByText("Billetera Pos40")).toBeVisible();
      expect(legacyFallbackCalled).toBe(true);
      await ctx.close();
    }
  });

  test("E7: Categoría + rango de precio simultáneos muestran conteo real de la intersección", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      isMobile: false,
    });
    const page = await context.newPage();
    const store = makeStorePayload({
      slug: "zz-audit-fp-e7",
      categories: [
        { id: "cat-carteras", name: "Carteras", product_count: 3 },
        { id: "cat-billeteras", name: "Billeteras", product_count: 1 },
      ],
      products: [
        makeProd("c1", "Cartera Mini", 40, "cat-carteras"),
        makeProd("c2", "Cartera Media", 80, "cat-carteras"),
        makeProd("c3", "Cartera Lujo", 160, "cat-carteras"),
        makeProd("b1", "Billetera Sol", 50, "cat-billeteras"),
      ],
      total_products_count: 4,
    });

    await setupCommonMocks(page, store);
    await page.goto("/t/zz-audit-fp-e7", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Cartera Lujo")).toBeVisible({ timeout: 15000 });

    const aside = page.locator("aside");
    await aside.getByRole("button", { name: /Carteras/i }).click();
    const resultsBar = page.getByTestId("results-bar");
    await expect(resultsBar).toContainText("(3 productos)");

    await setRangeValue(aside.getByTestId("price-slider-max"), 100);
    await expect(resultsBar).toContainText("(2 productos)");
    await expect(resultsBar).toContainText("S/ 40 – S/ 100");
    await expect(page.getByText("Cartera Lujo")).toHaveCount(0);
    await expect(page.getByText("Billetera Sol")).toHaveCount(0);

    await resultsBar.getByRole("button", { name: /Quitar filtro de precio/i }).click();
    await expect(resultsBar).toContainText("(3 productos)");
    await expect(page.getByText("Cartera Lujo")).toBeVisible();
    await context.close();
  });
});
