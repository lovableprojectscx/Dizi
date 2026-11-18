import { test, expect, type Page, type Route } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const CAPTURAS_DIR =
  "D:\\DIZI\\DIZI-20261014T161215Z-1-001\\DIZI\\INFORMACIÓN NECESARIA\\04-TECNICA\\encargos\\capturas-f49";

function saveCaptura(page: Page, fileName: string, fullPage = true) {
  if (!fs.existsSync(CAPTURAS_DIR)) return Promise.resolve();
  return page.screenshot({
    path: path.join(CAPTURAS_DIR, fileName),
    fullPage,
  });
}

function makeFakeJwt(role: "store_owner" | "super_admin" = "store_owner") {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: "00000000-0000-0000-0000-000000000099",
      email: "audit-f49@testdizi.com",
      exp: 9999999999,
      app_metadata: { role },
    }),
  ).toString("base64url");
  return `${header}.${payload}.mock-signature`;
}

function makeMockSession(role: "store_owner" | "super_admin" = "store_owner") {
  return {
    access_token: makeFakeJwt(role),
    token_type: "bearer",
    expires_in: 3600000,
    expires_at: 9999999999,
    refresh_token: "pw-mock-refresh",
    user: {
      id: "00000000-0000-0000-0000-000000000099",
      email: "audit-f49@testdizi.com",
      aud: "authenticated",
      role: "authenticated",
      app_metadata: { role },
      user_metadata: { role, full_name: "Florería María" },
    },
  };
}

interface MockTracker {
  initializeStoreBody: any;
  storeUpdateBodies: any[];
  funnelInserts: any[];
  inviteMarkBody: any;
}

async function setupSupabaseMocks(
  page: Page,
  options: {
    role?: "store_owner" | "super_admin";
    slugAvailable?: boolean | ((slug: string) => boolean);
    inviteResult?: any[];
    existingStores?: any[];
  } = {},
): Promise<MockTracker> {
  const tracker: MockTracker = {
    initializeStoreBody: null,
    storeUpdateBodies: [],
    funnelInserts: [],
    inviteMarkBody: null,
  };

  const session = makeMockSession(options.role ?? "store_owner");
  const storesStore: any[] = options.existingStores ? [...options.existingStores] : [];

  await page.route("https://zkqzdwxjthjdjchimmds.supabase.co/**", async (route: Route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();

    if (url.includes("/auth/v1/signup") || url.includes("/auth/v1/token")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(session),
      });
    }
    if (url.includes("/auth/v1/user")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(session.user),
      });
    }

    if (url.includes("/rest/v1/rpc/check_slug_available")) {
      const body = req.postDataJSON() || {};
      const available =
        typeof options.slugAvailable === "function"
          ? options.slugAvailable(body.p_slug)
          : (options.slugAvailable ?? true);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(available),
      });
    }

    if (url.includes("/rest/v1/rpc/check_invite")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(options.inviteResult ?? []),
      });
    }

    if (url.includes("/rest/v1/rpc/initialize_store")) {
      const body = req.postDataJSON() || {};
      tracker.initializeStoreBody = body;
      storesStore.push({
        id: body.p_id,
        slug: body.p_slug,
        name: body.p_name,
        phone: body.p_phone,
        country_code: body.p_country_code,
        country_iso: body.p_country_iso || "PE",
        plan: "semilla",
        model: body.p_model,
        niche: body.p_niche,
        owner_id: body.p_owner_id,
        active: true,
        is_published: true,
        onboarding_completed: true,
        created_at: new Date().toISOString(),
        whatsapp_clicks: 0,
        views: 0,
        categories: [{ id: body.p_category_id, store_id: body.p_id, name: "General" }],
        products: [],
      });
      return route.fulfill({ status: 200, contentType: "application/json", body: "null" });
    }

    if (url.includes("/rest/v1/rpc/activate_subscription_with_invite")) {
      const body = req.postDataJSON() || {};
      tracker.inviteMarkBody = body;
      const inv = options.inviteResult?.[0];
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          inv
            ? [
                {
                  plan: inv.plan,
                  duration_months: inv.duration_months ?? 1,
                  duration_value: inv.duration_value ?? null,
                  duration_unit: inv.duration_unit ?? null,
                  custom_price: inv.custom_price ?? null,
                },
              ]
            : [],
        ),
      });
    }

    if (url.includes("/rest/v1/signup_funnel_events") && method === "POST") {
      tracker.funnelInserts.push(req.postDataJSON());
      return route.fulfill({ status: 201, contentType: "application/json", body: "[]" });
    }

    if (url.includes("/rest/v1/stores")) {
      if (method === "PATCH") {
        const body = req.postDataJSON() || {};
        tracker.storeUpdateBodies.push(body);
        if (storesStore.length > 0) {
          Object.assign(storesStore[storesStore.length - 1], body);
        }
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(storesStore),
        });
      }
      if (method === "GET") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(storesStore),
        });
      }
    }

    if (url.includes("/rest/v1/survey_responses")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    }

    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });

  return tracker;
}

async function fillStep1Negocio(
  page: Page,
  { name = "Florería María", niche = "floreria", phone = "987654321" } = {},
) {
  await page.locator('input[placeholder="Ej. Florería María"]').fill(name);
  await page.locator(`button[data-niche="${niche}"]`).click();
  await page.locator('input[type="tel"]').fill(phone);
}

test.describe("F49 · Registro simple (Escenarios 1 a 12)", () => {
  test("E1 Dado el registro en celular, cuando completo Tu negocio y Tu cuenta, entonces se crea la cuenta y la tienda y veo el formulario de primer producto", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await setupSupabaseMocks(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/register", { waitUntil: "networkidle" });

    // Verificar stepper de 2 pasos (Tu negocio -> Tu cuenta)
    await expect(page.getByText("Tu negocio", { exact: true })).toBeVisible();
    await expect(page.getByText("Tu cuenta", { exact: true })).toBeVisible();
    await expect(page.locator('button[data-niche]')).toHaveCount(12);

    await fillStep1Negocio(page);
    await saveCaptura(page, "f49-tu-negocio-375px.png", true);

    await page.getByRole("button", { name: /siguiente paso/i }).click();

    await expect(page.getByRole("button", { name: /crear mi catálogo/i })).toBeVisible();
    await page.locator('input[type="email"]').fill("maria@testdizi.com");
    await page.locator('input[placeholder="Mínimo 6 caracteres"]').fill("clave123");
    await page.locator('button[data-signup-source="tiktok"]').click();
    await page.locator("#acceptTerms").check();
    await saveCaptura(page, "f49-tu-cuenta-375px.png", true);

    await page.getByRole("button", { name: /crear mi catálogo/i }).click();

    await page.waitForURL(/\/admin\/productos.*bienvenida=1/, { timeout: 15000 });
    await expect(page.getByTestId("first-product-welcome-banner")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /lo hago después/i })).toBeVisible();
    await saveCaptura(page, "f49-primer-producto-375px.png", false);

    // Capturas a 1280 px del flujo nuevo (Tu negocio, Tu cuenta y Primer producto)
    await page.setViewportSize({ width: 1280, height: 800 });
    await saveCaptura(page, "f49-primer-producto-1280px.png", false);

    await page.evaluate(() => localStorage.clear());
    await page.goto("/register", { waitUntil: "networkidle" });
    await fillStep1Negocio(page);
    await saveCaptura(page, "f49-tu-negocio-1280px.png", true);
    await page.getByRole("button", { name: /siguiente paso/i }).click();
    await expect(page.getByRole("button", { name: /crear mi catálogo/i })).toBeVisible();
    await saveCaptura(page, "f49-tu-cuenta-1280px.png", true);
  });

  test("E2 Dado el nombre 'Florería María', entonces el link propuesto es floreria-maria; si ya existe, veo el aviso antes de enviar", async ({
    page,
  }) => {
    await setupSupabaseMocks(page, {
      slugAvailable: (slug) => slug !== "floreria-maria",
    });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/register", { waitUntil: "networkidle" });

    await fillStep1Negocio(page, { name: "Florería María", niche: "floreria", phone: "987654321" });
    await page.getByRole("button", { name: /siguiente paso/i }).click();

    const slugInput = page.locator('input[placeholder="floreria-maria"]');
    await expect(slugInput).toHaveValue("floreria-maria");
    await expect(page.getByTestId("slug-taken-error")).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("button", { name: /crear mi catálogo/i })).toBeDisabled();

    await slugInput.fill("floreria-maria-lima");
    await expect(page.getByTestId("slug-available-msg")).toBeVisible({ timeout: 5000 });
  });

  test("E3 Dado que elijo 'TikTok', entonces la tienda queda con signup_source = 'tiktok'; si no elijo nada, queda vacío y el registro funciona igual", async ({
    page,
    browser,
  }) => {
    test.setTimeout(60000);
    // Caso A: elige TikTok
    const trackerA = await setupSupabaseMocks(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/register", { waitUntil: "networkidle" });
    await fillStep1Negocio(page);
    await page.getByRole("button", { name: /siguiente paso/i }).click();
    await page.locator('button[data-signup-source="tiktok"]').click();
    await page.locator('input[type="email"]').fill("tiktok@testdizi.com");
    await page.locator('input[placeholder="Mínimo 6 caracteres"]').fill("clave123");
    await page.locator("#acceptTerms").check();
    await page.getByRole("button", { name: /crear mi catálogo/i }).click();
    await page.waitForURL(/\/admin\/productos/, { timeout: 15000 });
    expect(trackerA.storeUpdateBodies[0]?.signup_source).toBe("tiktok");

    // Caso B: no elige nada (opcional) en contexto aislado
    const contextB = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const pageB = await contextB.newPage();
    try {
      const trackerB = await setupSupabaseMocks(pageB);
      await pageB.goto("/register", { waitUntil: "networkidle" });
      await fillStep1Negocio(pageB, { name: "Tienda Sin Origen", niche: "general", phone: "987654322" });
      await pageB.getByRole("button", { name: /siguiente paso/i }).click();
      await pageB.locator('input[type="email"]').fill("sinorigen@testdizi.com");
      await pageB.locator('input[placeholder="Mínimo 6 caracteres"]').fill("clave123");
      await pageB.locator("#acceptTerms").check();
      await pageB.getByRole("button", { name: /crear mi catálogo/i }).click();
      await pageB.waitForURL(/\/admin\/productos/, { timeout: 15000 });
      expect(trackerB.storeUpdateBodies[0]?.signup_source).toBeUndefined();
    } finally {
      await contextB.close();
    }
  });

  test("E4 Dado que llego con /register?origen=tiktok-video1, entonces la tienda queda con signup_utm = 'tiktok-video1'", async ({
    page,
  }) => {
    const tracker = await setupSupabaseMocks(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/register?origen=tiktok-video1", { waitUntil: "networkidle" });
    await fillStep1Negocio(page);
    await page.getByRole("button", { name: /siguiente paso/i }).click();
    await page.locator('input[type="email"]').fill("utm@testdizi.com");
    await page.locator('input[placeholder="Mínimo 6 caracteres"]').fill("clave123");
    await page.locator("#acceptTerms").check();
    await page.getByRole("button", { name: /crear mi catálogo/i }).click();
    await page.waitForURL(/\/admin\/productos/, { timeout: 15000 });
    expect(tracker.storeUpdateBodies[0]?.signup_utm).toBe("tiktok-video1");
  });

  test("E5 Dado que llego con ?ref=<código>, entonces el referido se guarda como hoy (referred_by) y no se mezcla con el origen", async ({
    page,
  }) => {
    const tracker = await setupSupabaseMocks(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/register?ref=AMIGO2026", { waitUntil: "networkidle" });
    await fillStep1Negocio(page);
    await page.getByRole("button", { name: /siguiente paso/i }).click();
    await page.locator('input[type="email"]').fill("ref@testdizi.com");
    await page.locator('input[placeholder="Mínimo 6 caracteres"]').fill("clave123");
    await page.locator("#acceptTerms").check();
    await page.getByRole("button", { name: /crear mi catálogo/i }).click();
    await page.waitForURL(/\/admin\/productos/, { timeout: 15000 });
    expect(tracker.storeUpdateBodies[0]?.referred_by).toBe("AMIGO2026");
    expect(tracker.storeUpdateBodies[0]?.signup_utm).toBeUndefined();
  });

  test("E6 Dado ?invite= válido, entonces el plan y la duración de la invitación se aplican como hoy", async ({
    page,
  }) => {
    const tracker = await setupSupabaseMocks(page, {
      inviteResult: [
        {
          plan: "pro",
          duration_months: 3,
          duration_unit: "months",
          duration_value: 3,
          custom_price: null,
        },
      ],
    });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/register?invite=INV-PRO-3M", { waitUntil: "networkidle" });

    await expect(page.getByText(/Invitación activa: Plan PRO por 3 meses/i)).toBeVisible();
    await fillStep1Negocio(page);
    await page.getByRole("button", { name: /siguiente paso/i }).click();
    await page.locator('input[type="email"]').fill("inv@testdizi.com");
    await page.locator('input[placeholder="Mínimo 6 caracteres"]').fill("clave123");
    await page.locator("#acceptTerms").check();
    await page.getByRole("button", { name: /crear mi catálogo/i }).click();
    await page.waitForURL(/\/admin\/productos/, { timeout: 15000 });
    expect(tracker.inviteMarkBody?.p_invite_token).toBe("INV-PRO-3M");
  });

  test("E7 Dado el rubro 'Florería', entonces la tienda queda con el diseño y la paleta por defecto definidos para ese rubro y se ve en Bloom", async ({
    page,
  }) => {
    const tracker = await setupSupabaseMocks(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/register", { waitUntil: "networkidle" });
    await fillStep1Negocio(page, { name: "Florería María", niche: "floreria", phone: "987654321" });
    await page.getByRole("button", { name: /siguiente paso/i }).click();
    await page.locator('input[type="email"]').fill("flor@testdizi.com");
    await page.locator('input[placeholder="Mínimo 6 caracteres"]').fill("clave123");
    await page.locator("#acceptTerms").check();
    await page.getByRole("button", { name: /crear mi catálogo/i }).click();
    await page.waitForURL(/\/admin\/productos/, { timeout: 15000 });

    expect(tracker.initializeStoreBody?.p_model).toBe("bloom_general");
    expect(tracker.initializeStoreBody?.p_niche).toBe("floreria");
    expect(tracker.storeUpdateBodies[0]?.brand_color).toBe("#0d9488");
    expect(tracker.storeUpdateBodies[0]?.bg_color).toBe("#f0fefb");
    expect(tracker.storeUpdateBodies[0]?.onboarding_completed).toBe(true);

    // Captura de una tienda nueva florería en Bloom (375 px y 1280 px)
    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "s_floreria_nueva",
          slug: "floreria-maria",
          name: "Florería María",
          phone: "51987654321",
          country_code: "51",
          country_iso: "PE",
          plan: "semilla",
          model: "bloom_general",
          niche: "floreria",
          brand_color: "#0d9488",
          bg_color: "#f0fefb",
          text_color: "#134e4a",
          card_bg: "#ffffff",
          accent_color: "#99f6e4",
          catalog_typography: "sans",
          card_style: "standard",
          border_radius: "24px",
          img_shape: "rounded",
          photo_format: "square",
          is_dark: false,
          active: true,
          is_published: true,
          show_featured: true,
          show_discount_pct: true,
          show_dizi_branding: true,
          created_at: new Date().toISOString(),
          categories: [{ id: "cat_1", name: "Ramos" }],
          products: [
            {
              id: "prod_1",
              name: "Ramo Primaveral",
              price: 75,
              category_id: "cat_1",
              image: "/images/landing/showcase-floreria.webp",
              description: "Rosas y girasoles frescos del día",
              visible: true,
              is_on_sale: false,
            },
            {
              id: "prod_2",
              name: "Box Tulipanes",
              price: 110,
              category_id: "cat_1",
              image: "/images/landing/showcase-floreria.webp",
              description: "Caja de regalo con 12 tulipanes",
              visible: true,
              is_on_sale: true,
              original_price: 130,
            },
          ],
          total_products_count: 2,
          has_more_products: false,
        }),
      });
    });

    await page.goto("/t/floreria-maria", { waitUntil: "networkidle" });
    await expect(page.getByText("Ramo Primaveral").first()).toBeVisible({ timeout: 10000 });
    await saveCaptura(page, "f49-floreria-bloom-375px.png", true);

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);
    await saveCaptura(page, "f49-floreria-bloom-1280px.png", true);
  });

  test("E8 Dado 'Lo hago después', entonces llego a Inicio y veo 'Completa tu tienda' con 0 o 1 de 5", async ({
    page,
  }) => {
    await setupSupabaseMocks(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/register", { waitUntil: "networkidle" });
    await fillStep1Negocio(page);
    await page.getByRole("button", { name: /siguiente paso/i }).click();
    await page.locator('input[type="email"]').fill("despues@testdizi.com");
    await page.locator('input[placeholder="Mínimo 6 caracteres"]').fill("clave123");
    await page.locator("#acceptTerms").check();
    await page.getByRole("button", { name: /crear mi catálogo/i }).click();

    await page.waitForURL(/\/admin\/productos.*bienvenida=1/, { timeout: 15000 });
    await page.getByRole("button", { name: /lo hago después/i }).click();

    await page.waitForURL(/\/admin\/dashboard/, { timeout: 15000 });
    await expect(page.getByTestId("completa-tu-tienda-card")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("completa-tu-tienda-count")).toHaveText(/^[01] de 5$/);
    await saveCaptura(page, "f49-completa-tu-tienda-375px.png", true);

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);
    await saveCaptura(page, "f49-completa-tu-tienda-1280px.png", true);

    // Cerrar y recargar: recuerda que fue cerrada
    await page.getByRole("button", { name: /cerrar tarjeta completa tu tienda/i }).click();
    await expect(page.getByTestId("completa-tu-tienda-card")).toHaveCount(0);
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByTestId("completa-tu-tienda-card")).toHaveCount(0);
  });

  test("E9 Dada una tienda existente (creada antes de F49), entonces no ve 'Completa tu tienda' ni el asistente", async ({
    page,
  }) => {
    const existingStore = {
      id: "s_existente_pre_f49",
      slug: "tienda-antigua",
      name: "Tienda Antigua",
      phone: "51987654321",
      country_code: "51",
      country_iso: "PE",
      plan: "semilla",
      model: "grid",
      niche: "general",
      owner_id: "00000000-0000-0000-0000-000000000099",
      active: true,
      is_published: true,
      onboarding_completed: false,
      created_at: "2026-10-06T12:00:00Z",
      whatsapp_clicks: 0,
      views: 0,
      categories: [{ id: "cat_old", store_id: "s_existente_pre_f49", name: "General" }],
      products: [],
    };
    await setupSupabaseMocks(page, { existingStores: [existingStore] });
    const session = makeMockSession("store_owner");
    await page.addInitScript((sess) => {
      localStorage.setItem("sb-zkqzdwxjthjdjchimmds-auth-token", JSON.stringify(sess));
    }, session);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });
    await expect(page.getByText("Tienda Antigua")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("completa-tu-tienda-card")).toHaveCount(0);
    await expect(page.getByText("Personaliza tu Marca")).toHaveCount(0);
  });

  test("E10 Dado el registro, entonces la sección de demos dice 'Mira cómo se ven las tiendas en Dizi'", async ({
    page,
  }) => {
    await setupSupabaseMocks(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/register", { waitUntil: "networkidle" });
    await expect(page.getByText("Mira cómo se ven las tiendas en Dizi")).toBeVisible();
    await expect(page.getByText("Negocios que ya usan Dizi")).toHaveCount(0);
  });

  test("E11 Dado un recorrido completo, entonces quedan registrados los pasos del embudo, sin correo ni teléfono", async ({
    page,
  }) => {
    const tracker = await setupSupabaseMocks(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/register?origen=ig-reel", { waitUntil: "networkidle" });
    await fillStep1Negocio(page);
    await page.getByRole("button", { name: /siguiente paso/i }).click();
    await page.locator('input[type="email"]').fill("embudo@testdizi.com");
    await page.locator('input[placeholder="Mínimo 6 caracteres"]').fill("clave123");
    await page.locator("#acceptTerms").check();
    await page.getByRole("button", { name: /crear mi catálogo/i }).click();
    await page.waitForURL(/\/admin\/productos.*bienvenida=1/, { timeout: 15000 });
    await page.getByRole("button", { name: /lo hago después/i }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 15000 });

    await expect
      .poll(() => tracker.funnelInserts.map((e) => e.step), { timeout: 5000 })
      .toContain("salto_producto");

    const steps = tracker.funnelInserts.map((e) => e.step);
    expect(steps).toContain("vio_registro");
    expect(steps).toContain("completo_negocio");
    expect(steps).toContain("creo_cuenta");
    expect(steps).toContain("salto_producto");

    const serialized = JSON.stringify(tracker.funnelInserts);
    expect(serialized).not.toContain("embudo@testdizi.com");
    expect(serialized).not.toContain("987654321");
  });

  test("E12 Dado el superadmin, entonces ve el origen de las tiendas nuevas", async ({ page }) => {
    const storeWithOrigin = {
      id: "s_super_f49",
      slug: "floreria-super",
      name: "Florería Súper",
      phone: "51987654321",
      country_code: "51",
      country_iso: "PE",
      plan: "semilla",
      model: "bloom_general",
      niche: "floreria",
      signup_source: "tiktok",
      signup_utm: "tiktok-video1",
      active: true,
      is_published: true,
      created_at: new Date().toISOString(),
      whatsapp_clicks: 0,
      views: 0,
      categories: [],
      products: [],
    };
    await setupSupabaseMocks(page, {
      role: "super_admin",
      existingStores: [storeWithOrigin],
    });
    const superSession = makeMockSession("super_admin");
    await page.addInitScript((sess) => {
      localStorage.setItem("sb-zkqzdwxjthjdjchimmds-auth-token", JSON.stringify(sess));
    }, superSession);

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/super/tiendas", { waitUntil: "networkidle" });
    await expect(page.getByText("Origen", { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("TikTok", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("?origen=tiktok-video1", { exact: true }).first()).toBeVisible();
  });
});
