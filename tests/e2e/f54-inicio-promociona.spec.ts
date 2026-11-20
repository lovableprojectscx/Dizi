import { test, expect, type Page, type Route } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const CAPTURAS_DIR =
  "D:\\DIZI\\DIZI-20261014T161215Z-1-001\\DIZI\\INFORMACIÓN NECESARIA\\04-TECNICA\\encargos\\capturas-f54";

function saveCaptura(page: Page, fileName: string, fullPage = true) {
  fs.mkdirSync(CAPTURAS_DIR, { recursive: true });
  return page.screenshot({
    path: path.join(CAPTURAS_DIR, fileName),
    fullPage,
  });
}

function makeFakeJwt() {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: "00000000-0000-0000-0000-000000000054",
      email: "zz-audit-f54@testdizi.com",
      exp: 9999999999,
      app_metadata: { role: "store_owner" },
    }),
  ).toString("base64url");
  return `${header}.${payload}.mock-signature`;
}

function makeMockSession() {
  return {
    access_token: makeFakeJwt(),
    token_type: "bearer",
    expires_in: 3600000,
    expires_at: 9999999999,
    refresh_token: "pw-mock-refresh-f54",
    user: {
      id: "00000000-0000-0000-0000-000000000054",
      email: "zz-audit-f54@testdizi.com",
      aud: "authenticated",
      role: "authenticated",
      app_metadata: { role: "store_owner" },
      user_metadata: { role: "store_owner", full_name: "Florería Audit F54" },
    },
  };
}

interface MockStoreOptions {
  id?: string;
  slug?: string;
  name?: string;
  plan?: "semilla" | "emprendedor" | "pro" | "ilimitado";
  subscription_status?: string;
  plan_expires_at?: string | null;
  created_at?: string;
  views?: number;
  whatsapp_clicks?: number;
  products?: any[];
  surveyResponses?: any[];
}

interface MockTracker {
  shareEventInserts: any[];
}

function buildDbStore(opts: MockStoreOptions = {}) {
  const id = opts.id ?? "s_zz_audit_f54";
  const defaultProducts = [
    {
      id: "p_f54_6",
      store_id: id,
      category_id: "c_f54_1",
      name: "Box Spa Relajante",
      price: 135,
      original_price: null,
      is_on_sale: false,
      image: "/images/demos/regalos-demo/prod_05_box_spa.webp",
      visible: true,
      is_sample: false,
      sort_order: 6,
    },
    {
      id: "p_f54_1",
      store_id: id,
      category_id: "c_f54_1",
      name: "Box Cumpleaños Especial",
      price: 119,
      original_price: null,
      is_on_sale: false,
      image: "/images/demos/regalos-demo/prod_01_box_cumpleanos.webp",
      visible: true,
      is_sample: false,
      sort_order: 1,
    },
    {
      id: "p_f54_2",
      store_id: id,
      category_id: "c_f54_1",
      name: "Caja de Bombones Artesanales",
      price: 65,
      original_price: null,
      is_on_sale: false,
      image: "/images/demos/regalos-demo/prod_02_bombones_caja.webp",
      visible: true,
      is_sample: false,
      sort_order: 2,
    },
    {
      id: "p_f54_3",
      store_id: id,
      category_id: "c_f54_1",
      name: "Arreglo de Rosas en Caja",
      price: 95,
      original_price: null,
      is_on_sale: false,
      image: "/images/demos/regalos-demo/prod_03_arreglo_rosas.webp",
      visible: true,
      is_sample: false,
      sort_order: 3,
    },
    {
      id: "p_f54_4",
      store_id: id,
      category_id: "c_f54_1",
      name: "Taza de Cerámica Artesanal",
      price: 49,
      original_price: null,
      is_on_sale: false,
      image: "/images/demos/regalos-demo/prod_04_taza_ceramica.webp",
      visible: true,
      is_sample: false,
      sort_order: 4,
    },
    {
      id: "p_f54_5",
      store_id: id,
      category_id: "c_f54_1",
      name: "Mini Torta Decorada",
      price: 58,
      original_price: null,
      is_on_sale: false,
      image: "/images/demos/regalos-demo/prod_06_mini_torta.webp",
      visible: true,
      is_sample: false,
      sort_order: 5,
    },
  ];

  return {
    id,
    slug: opts.slug ?? "zz-audit-f54-regalos",
    name: opts.name ?? "Regalos Fiorella",
    phone: "51987654321",
    country_code: "51",
    country_iso: "PE",
    plan: opts.plan ?? "semilla",
    subscription_status: opts.subscription_status ?? "active",
    plan_expires_at: opts.plan_expires_at ?? null,
    active: true,
    is_published: true,
    onboarding_completed: true,
    created_at: opts.created_at ?? "2026-10-01T12:00:00.000Z",
    views: opts.views ?? 248,
    whatsapp_clicks: opts.whatsapp_clicks ?? 37,
    model: "grid",
    brand_color: "#312E81",
    niche: "regalos",
    owner_id: "00000000-0000-0000-0000-000000000054",
    categories: [{ id: "c_f54_1", store_id: id, name: "Regalos", sort_order: 1 }],
    products: opts.products ?? defaultProducts,
  };
}

async function setupAdminSessionAndMocks(
  page: Page,
  opts: MockStoreOptions = {},
): Promise<MockTracker> {
  const tracker: MockTracker = { shareEventInserts: [] };
  const session = makeMockSession();
  const store = buildDbStore(opts);

  await page.addInitScript(
    ({ authSession }) => {
      window.localStorage.setItem(
        "sb-zkqzdwxjthjdjchimmds-auth-token",
        JSON.stringify(authSession),
      );
    },
    { authSession: session },
  );

  await page.route("https://zkqzdwxjthjdjchimmds.supabase.co/**", async (route: Route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();

    if (url.includes("/auth/v1/user")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(session.user),
      });
    }
    if (url.includes("/auth/v1/token")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(session),
      });
    }
    if (url.includes("/rest/v1/stores")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([store]),
      });
    }
    if (url.includes("/rest/v1/survey_responses")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(opts.surveyResponses ?? []),
      });
    }
    if (url.includes("/rest/v1/share_events") && method === "POST") {
      tracker.shareEventInserts.push(req.postDataJSON());
      return route.fulfill({ status: 201, contentType: "application/json", body: "[]" });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });

  return tracker;
}

function parseRgb(css: string): [number, number, number] {
  const m = css.match(/\d+/g)!.map(Number);
  return m.slice(0, 3) as [number, number, number];
}

function contrastRatioFromCss(fgCss: string, bgCss: string): number {
  const lum = ([r, g, b]: [number, number, number]) => {
    const ch = [r, g, b].map((v) => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  };
  const l1 = lum(parseRgb(fgCss));
  const l2 = lum(parseRgb(bgCss));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

test.describe("F54 · Inicio y Promociona con más vida (Escenarios 1 a 14)", () => {
  test("E1 Dado una tienda con 6 productos con foto, cuando abre Inicio, entonces ve 'Hola, {nombre}' y el mosaico con las 4 primeras fotos según sortOrder", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await setupAdminSessionAndMocks(page, {
      surveyResponses: [{ id: "resp-1", version: "2026-11" }],
    });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });

    await expect(page.getByTestId("panel-hero")).toContainText("Hola, Regalos Fiorella");
    const mosaicItems = page.getByTestId("product-mosaic-item");
    await expect(mosaicItems).toHaveCount(4);
    const ids = await mosaicItems.evaluateAll((els) =>
      els.map((el) => el.getAttribute("data-product-id")),
    );
    expect(ids).toEqual(["p_f54_1", "p_f54_2", "p_f54_3", "p_f54_4"]);

    await saveCaptura(page, "f54-inicio-claro-375px.png", true);

    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.waitForTimeout(150);
    await saveCaptura(page, "f54-inicio-oscuro-375px.png", true);

    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(150);
    await saveCaptura(page, "f54-inicio-claro-1280px.png", true);

    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.waitForTimeout(150);
    await saveCaptura(page, "f54-inicio-oscuro-1280px.png", true);
  });

  test("E2 Dado una tienda sin productos, cuando abre Inicio, entonces el siguiente paso es 'Agrega tu primer producto' y el mosaico muestra el estado vacío", async ({
    page,
  }) => {
    await setupAdminSessionAndMocks(page, { products: [] });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });

    await expect(page.getByTestId("next-step-section")).toHaveAttribute(
      "data-next-step-id",
      "no-products",
    );
    await expect(page.getByTestId("next-step-section")).toContainText("Agrega tu primer producto");
    await expect(page.getByTestId("product-mosaic-empty")).toContainText(
      "Aquí aparecerán tus productos",
    );
  });

  test("E3 Dado una tienda elegible para CompletaTuTienda, entonces esa tarjeta ocupa el lugar del siguiente paso y no aparece otra tarjeta de paso", async ({
    page,
  }) => {
    await setupAdminSessionAndMocks(page, {
      created_at: "2026-11-19T12:00:00.000Z",
    });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });

    await expect(page.getByTestId("next-step-section")).toHaveAttribute(
      "data-next-step-id",
      "completa-tu-tienda",
    );
    await expect(page.getByTestId("completa-tu-tienda-card")).toBeVisible();
    await expect(page.getByText("Tu siguiente paso")).toHaveCount(0);
  });

  test("E4 Dado 3 productos incompletos y encuesta disponible, entonces el paso es 'Completa 3 productos' y 'También pendiente' muestra la encuesta", async ({
    page,
  }) => {
    const id = "s_zz_audit_f54";
    await setupAdminSessionAndMocks(page, {
      products: [
        { id: "inc1", store_id: id, category_id: "c_f54_1", name: "IMG 8090", price: 50, image: "", visible: true, is_sample: false },
        { id: "inc2", store_id: id, category_id: "c_f54_1", name: "WhatsApp Image 2026-11-01", price: 60, image: "", visible: true, is_sample: false },
        { id: "inc3", store_id: id, category_id: "c_f54_1", name: "Ramo Especial", price: null, image: "", visible: true, is_sample: false },
      ],
      surveyResponses: [],
    });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });

    await expect(page.getByTestId("next-step-section")).toContainText("Completa 3 productos");
    await expect(page.getByTestId("next-step-also-pending")).toContainText("encuesta");
  });

  test("E5 Dado una prueba con 2 días restantes y nada más pendiente, entonces el paso es 'Elige tu plan' y la etiqueta dice 'Prueba · quedan 2 días'", async ({
    page,
  }) => {
    const twoDaysFromNow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    await setupAdminSessionAndMocks(page, {
      plan: "emprendedor",
      subscription_status: "trial",
      plan_expires_at: twoDaysFromNow,
      surveyResponses: [{ id: "resp-1", version: "2026-11" }],
    });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });

    await expect(page.getByTestId("panel-hero-badge")).toHaveText("Prueba · quedan 2 días");
    await expect(page.getByTestId("next-step-section")).toHaveAttribute(
      "data-next-step-id",
      "trial-ending",
    );
    await expect(page.getByTestId("next-step-section")).toContainText("Elige tu plan");
  });

  test("E6 Dado nada pendiente, entonces el paso es 'Crea una imagen para tus estados' y lleva a /admin/marketing", async ({
    page,
  }) => {
    await setupAdminSessionAndMocks(page, {
      surveyResponses: [{ id: "resp-1", version: "2026-11" }],
    });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });

    await expect(page.getByTestId("next-step-section")).toContainText(
      "Crea una imagen para tus estados",
    );
    await page.getByTestId("next-step-section").getByRole("link", { name: /ir a promociona/i }).click();
    await page.waitForURL(/\/admin\/marketing/, { timeout: 10000 });
  });

  test("E7 Dado Inicio, entonces hay 3 números con 'en total' y no existe 'Plan actual'", async ({
    page,
  }) => {
    await setupAdminSessionAndMocks(page, {
      surveyResponses: [{ id: "resp-1", version: "2026-11" }],
    });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });

    const metrics = page.getByTestId("dashboard-metrics");
    await expect(metrics.getByText("Productos activos").first()).toBeVisible();
    await expect(metrics.getByText("Visitas").first()).toBeVisible();
    await expect(metrics.getByText("Clics a WhatsApp").first()).toBeVisible();
    await expect(metrics.locator("text=en total").first()).toBeVisible();
    await expect(page.getByText(/Plan Actual/i)).toHaveCount(0);
  });

  test("E8 Dado un producto principal sin oferta en Promociona ve 3 miniaturas; con oferta ve 4", async ({
    page,
  }) => {
    test.setTimeout(60000);
    // Sin oferta -> 3 miniaturas
    await setupAdminSessionAndMocks(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/marketing", { waitUntil: "networkidle" });

    await expect(page.getByTestId("style-preview-card-etiqueta")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("style-preview-card-editorial")).toBeVisible();
    await expect(page.getByTestId("style-preview-card-marco-color")).toBeVisible();
    await expect(page.getByTestId("style-preview-card-oferta")).toHaveCount(0);

    // Con oferta real >= 5% -> 4 miniaturas
    const id = "s_zz_audit_f54";
    await setupAdminSessionAndMocks(page, {
      products: [
        {
          id: "p_offer_1",
          store_id: id,
          category_id: "c_f54_1",
          name: "Box Cumpleaños Oferta",
          price: 99,
          original_price: 139,
          is_on_sale: true,
          image: "/images/demos/regalos-demo/prod_01_box_cumpleanos.webp",
          visible: true,
          is_sample: false,
          sort_order: 1,
        },
      ],
    });
    await page.goto("/admin/marketing", { waitUntil: "networkidle" });
    await expect(page.getByTestId("style-preview-card-oferta")).toBeVisible({ timeout: 15000 });
  });

  test("E9 Dado Promociona, cuando toca la miniatura Editorial, el creador abre en Editorial y al exportar registra source='marketing'", async ({
    page,
  }) => {
    test.setTimeout(60000);
    const tracker = await setupAdminSessionAndMocks(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/marketing", { waitUntil: "networkidle" });

    const editorialCard = page.getByTestId("style-preview-card-editorial");
    await expect(editorialCard).toBeVisible({ timeout: 15000 });

    // Esperar a que las miniaturas en canvas terminen de dibujarse antes de las capturas
    await expect
      .poll(
        () =>
          editorialCard
            .locator("canvas")
            .evaluate((c) => window.getComputedStyle(c).opacity),
        { timeout: 15000 },
      )
      .toBe("1");

    await saveCaptura(page, "f54-promociona-claro-375px.png", true);
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.waitForTimeout(150);
    await saveCaptura(page, "f54-promociona-oscuro-375px.png", true);

    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(150);
    await saveCaptura(page, "f54-promociona-claro-1280px.png", true);

    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.waitForTimeout(150);
    await saveCaptura(page, "f54-promociona-oscuro-1280px.png", true);

    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    await page.setViewportSize({ width: 375, height: 812 });

    await editorialCard.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10000 });
    // El botón "Editorial" está seleccionado (border-primary)
    const editorialBtn = dialog.getByRole("button", { name: /editorial/i });
    await expect(editorialBtn).toHaveClass(/border-primary/);

    // Exportar/descargar imagen registra share_events con source='marketing'
    const downloadBtn = dialog.getByRole("button", { name: /descargar imagen/i });
    await expect(downloadBtn).toBeEnabled({ timeout: 15000 });
    await downloadBtn.click();

    await expect
      .poll(() => tracker.shareEventInserts.length, { timeout: 10000 })
      .toBeGreaterThanOrEqual(1);
    expect(tracker.shareEventInserts[0]?.source).toBe("marketing");
    expect(tracker.shareEventInserts[0]?.style).toBe("editorial");
  });

  test("E10 Dado Promociona, entonces muestra 'Ideas para vender' con fecha próxima y botón 'Crear para ...'", async ({
    page,
  }) => {
    await setupAdminSessionAndMocks(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/marketing", { waitUntil: "networkidle" });

    const ideasSection = page.getByTestId("promo-ideas-section");
    await expect(ideasSection).toBeVisible();
    await expect(ideasSection.getByTestId("promo-idea-card").first()).toBeVisible();
    await ideasSection.getByRole("button", { name: /crear para/i }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
  });

  test("E11 Dado Promociona, no aparece 'Comparte tu catálogo'; en Inicio sigue apareciendo", async ({
    page,
  }) => {
    await setupAdminSessionAndMocks(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/marketing", { waitUntil: "networkidle" });

    await expect(page.getByText(/Comparte tu catálogo/i)).toHaveCount(0);
    await expect(page.getByText(/Comparte tu negocio/i)).toHaveCount(0);

    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });
    await expect(page.getByText(/Comparte tu negocio/i)).toBeVisible();
  });

  test("E12 Dado el creador abierto desde Productos, abre en Etiqueta y registra source='productos'", async ({
    page,
  }) => {
    test.setTimeout(60000);
    const tracker = await setupAdminSessionAndMocks(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/admin/productos", { waitUntil: "networkidle" });

    const shareBtn = page.locator('button[title*="imagen"], button[aria-label*="imagen"], button[title*="historia"], button[title*="estado"]').first();
    await expect(shareBtn).toBeVisible({ timeout: 10000 });
    await shareBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByRole("button", { name: /etiqueta/i })).toHaveClass(/border-primary/);

    const downloadBtn = dialog.getByRole("button", { name: /descargar imagen/i });
    await expect(downloadBtn).toBeEnabled({ timeout: 15000 });
    await downloadBtn.click();

    await expect
      .poll(() => tracker.shareEventInserts.length, { timeout: 10000 })
      .toBeGreaterThanOrEqual(1);
    expect(tracker.shareEventInserts[0]?.source).toBe("productos");
    expect(tracker.shareEventInserts[0]?.style).toBe("etiqueta");
  });

  test("E13 Dado el modo oscuro, entonces los textos de la franja y botones CTA pasan 4.5:1", async ({
    page,
  }) => {
    await setupAdminSessionAndMocks(page, {
      surveyResponses: [{ id: "resp-1", version: "2026-11" }],
    });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });
    await page.evaluate(() => document.documentElement.classList.add("dark"));

    const heroColors = await page.getByTestId("panel-hero").evaluate((el) => {
      const h1 = el.querySelector("h1")!;
      return {
        fg: window.getComputedStyle(h1).color,
        bg: window.getComputedStyle(el).backgroundColor,
      };
    });
    expect(contrastRatioFromCss(heroColors.fg, heroColors.bg)).toBeGreaterThanOrEqual(4.5);

    const ctaColors = await page
      .getByTestId("next-step-section")
      .getByRole("link")
      .first()
      .evaluate((el) => {
        const s = window.getComputedStyle(el);
        return { fg: s.color, bg: s.backgroundColor };
      });
    expect(contrastRatioFromCss(ctaColors.fg, ctaColors.bg)).toBeGreaterThanOrEqual(4.5);
  });

  test("E14 Dado 375 px, ni Inicio ni Promociona tienen desplazamiento horizontal", async ({
    page,
  }) => {
    await setupAdminSessionAndMocks(page, {
      surveyResponses: [{ id: "resp-1", version: "2026-11" }],
    });
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });
    const dashOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(dashOverflow).toBeLessThanOrEqual(0);

    await page.goto("/admin/marketing", { waitUntil: "networkidle" });
    await expect(page.getByTestId("style-preview-strip")).toBeVisible({ timeout: 15000 });
    const mktOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(mktOverflow).toBeLessThanOrEqual(0);
  });
});
