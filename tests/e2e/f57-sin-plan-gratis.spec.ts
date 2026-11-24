import { test, expect, type Page, type Route } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const CAPTURAS_DIR =
  "D:\\DIZI\\DIZI-20261014T161215Z-1-001\\DIZI\\INFORMACIÓN NECESARIA\\04-TECNICA\\encargos\\capturas-f57";

function ensureCapturasDir() {
  fs.mkdirSync(CAPTURAS_DIR, { recursive: true });
}

function makeFakeJwt(role = "store_owner") {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: "00000000-0000-0000-0000-000000000057",
      email: role === "super_admin" ? "super-admin@dizi.pe" : "zz-audit-f57@testdizi.com",
      exp: 9999999999,
      app_metadata: { role },
      user_metadata: { role, full_name: role === "super_admin" ? "Super Admin" : "Audit F57 Store" },
    }),
  ).toString("base64url");
  return `${header}.${payload}.mock-signature`;
}

function makeMockSession(role = "store_owner") {
  return {
    access_token: makeFakeJwt(role),
    token_type: "bearer",
    expires_in: 3600000,
    expires_at: 9999999999,
    refresh_token: "pw-mock-refresh-f57",
    user: {
      id: "00000000-0000-0000-0000-000000000057",
      email: role === "super_admin" ? "super-admin@dizi.pe" : "zz-audit-f57@testdizi.com",
      aud: "authenticated",
      role: "authenticated",
      app_metadata: { role },
      user_metadata: { role, full_name: role === "super_admin" ? "Super Admin" : "Audit F57 Store" },
    },
  };
}

interface SetupOptions {
  role?: string;
  stores: any[];
  currentStoreId?: string;
  pausa_activa?: boolean;
  semilla_fin?: string | null;
}

async function setupAdminSessionAndMocks(page: Page, options: SetupOptions) {
  const role = options.role || "store_owner";
  const session = makeMockSession(role);
  const stores = options.stores;
  const currentStoreId = options.currentStoreId || stores[0]?.id;
  const pausa_activa = options.pausa_activa !== undefined ? options.pausa_activa : true;
  const semilla_fin = options.semilla_fin !== undefined ? options.semilla_fin : null;

  await page.addInitScript(
    ({ authSession, mockStores, activeStoreId }) => {
      const payload = JSON.stringify({ ...authSession, currentSession: authSession });
      window.localStorage.setItem("sb-zkqzdwxjthjdjchimmds-auth-token", payload);
      window.localStorage.setItem("sb-dummy-auth-token", payload);
      window.localStorage.setItem("sb-localhost-auth-token", payload);
      window.localStorage.setItem("dizi_auth_session", JSON.stringify(authSession));
      window.localStorage.setItem("dizi_onboarding_dismissed", "true");
      window.localStorage.setItem("dizi-onboarding-completed", "true");
      window.localStorage.setItem(
        "dizi-catalogos-v2",
        JSON.stringify({
          state: {
            stores: mockStores,
            currentStoreId: activeStoreId,
            fetchError: null,
            lastFetched: Date.now(),
          },
          version: 1,
        }),
      );
    },
    { authSession: session, mockStores: stores, activeStoreId: currentStoreId },
  );

  await page.route("**/auth/v1/**", async (route: Route) => {
    const url = route.request().url();
    if (url.includes("/user")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(session.user),
      });
    }
    if (url.includes("/token")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(session),
      });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  await page.route("**/rest/v1/**", async (route: Route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();

    if (url.includes("/rest/v1/app_config")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { key: "pausa_activa", value: pausa_activa },
          { key: "semilla_fin", value: semilla_fin },
        ]),
      });
    }

    if (url.includes("/rest/v1/stores")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(stores),
      });
    }

    if (url.includes("/rest/v1/store_rewards")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    }

    if (url.includes("/rest/v1/rpc/claim_trial_rewards")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    }

    if (url.includes("/rest/v1/survey_responses")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    }

    if (method === "POST" || method === "PATCH" || method === "PUT") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      });
    }

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    });
  });
}

test.describe("F57: Sin Plan Gratis (Playwright E2E)", () => {
  test.beforeAll(() => {
    ensureCapturasDir();
  });

  // 1. Página pública en pausa (375px y 1280px)
  for (const viewport of [
    { width: 375, height: 667, name: "375" },
    { width: 1280, height: 800, name: "1280" },
  ]) {
    test(`Página en pausa pública a ${viewport.name}px`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      // Interceptar RPC get_public_store simulando tienda en pausa
      await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "s_f57_paused",
            slug: "zz-f57-pausa",
            name: "Moda & Estilo Pausada",
            phone: "987654321",
            country_code: "51",
            country_iso: "PE",
            logo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200",
            brand_color: "#E11D48",
            active: true,
            is_published: true,
            plan: "pro",
            paused: true,
            products: [],
            categories: [],
          }),
        });
      });

      await page.goto("/t/zz-f57-pausa", { waitUntil: "domcontentloaded" });

      // Verificar página en pausa
      const pausedPage = page.locator('[data-testid="paused-store-page"]');
      await expect(pausedPage).toBeVisible({ timeout: 10000 });

      // Verificar elementos clave
      await expect(page.getByText("Catálogo en pausa")).toBeVisible();
      await expect(page.getByText("Moda & Estilo Pausada")).toBeVisible();
      const whatsappBtn = page.locator('[data-testid="paused-whatsapp-btn"]');
      await expect(whatsappBtn).toBeVisible();
      await expect(whatsappBtn).toHaveAttribute("href", /wa\.me\/51987654321/);

      // Verificar meta robots noindex, nofollow
      const robotsMeta = page.locator('meta[name="robots"]');
      await expect(robotsMeta).toHaveAttribute("content", /noindex/);

      // Captura de pantalla
      const shotPath = path.join(CAPTURAS_DIR, `0${viewport.name === "375" ? "1" : "2"}-pagina-en-pausa-${viewport.name}.png`);
      await page.screenshot({ path: shotPath, fullPage: true });
      expect(fs.existsSync(shotPath)).toBe(true);
    });
  }

  // 2. Panel en pausa (aviso fijo con reactivación desde S/ 19.90) a 375px y 1280px
  for (const viewport of [
    { width: 375, height: 667, name: "375" },
    { width: 1280, height: 800, name: "1280" },
  ]) {
    test(`Panel de administración en pausa a ${viewport.name}px`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      const mockStore = {
        id: "00000000-0000-0000-0000-000000000057",
        owner_id: "00000000-0000-0000-0000-000000000057",
        ownerId: "00000000-0000-0000-0000-000000000057",
        user_id: "00000000-0000-0000-0000-000000000057",
        userId: "00000000-0000-0000-0000-000000000057",
        slug: "tienda-admin-pausa",
        name: "Tienda Admin Pausa",
        phone: "987654321",
        country_code: "51",
        countryCode: "51",
        country_iso: "PE",
        countryIso: "PE",
        plan: "pro",
        subscription_status: "active",
        subscriptionStatus: "active",
        plan_expires_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // -4 días (pausa)
        planExpiresAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        active: true,
        is_published: true,
        isPublished: true,
        onboarding_completed: true,
        onboardingCompleted: true,
        created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        views: 50,
        whatsapp_clicks: 10,
        products: [],
        categories: [],
      };

      await setupAdminSessionAndMocks(page, {
        stores: [mockStore],
        pausa_activa: true,
        semilla_fin: null,
      });

      await page.goto("/admin/dashboard", { waitUntil: "domcontentloaded" });

      // Verificar banner de pausa
      const pausedBanner = page.locator('[data-testid="admin-paused-banner"]');
      await expect(pausedBanner).toBeVisible({ timeout: 10000 });
      await expect(pausedBanner).toContainText("Tu catálogo está en pausa. Reactívalo desde S/ 19.90");
      await expect(pausedBanner.getByRole("link", { name: "Elegir mi plan" })).toBeVisible();

      // Captura de pantalla
      const shotPath = path.join(CAPTURAS_DIR, `0${viewport.name === "375" ? "3" : "4"}-panel-en-pausa-${viewport.name}.png`);
      await page.screenshot({ path: shotPath, fullPage: true });
      expect(fs.existsSync(shotPath)).toBe(true);
    });
  }

  // 3. Panel en gracia a 375px y 1280px
  for (const viewport of [
    { width: 375, height: 667, name: "375" },
    { width: 1280, height: 800, name: "1280" },
  ]) {
    test(`Panel de administración en gracia a ${viewport.name}px`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      const mockStoreGrace = {
        id: "00000000-0000-0000-0000-000000000057",
        owner_id: "00000000-0000-0000-0000-000000000057",
        ownerId: "00000000-0000-0000-0000-000000000057",
        user_id: "00000000-0000-0000-0000-000000000057",
        userId: "00000000-0000-0000-0000-000000000057",
        slug: "tienda-admin-gracia",
        name: "Tienda Admin Gracia",
        phone: "987654321",
        country_code: "51",
        countryCode: "51",
        country_iso: "PE",
        countryIso: "PE",
        plan: "pro",
        subscription_status: "active",
        subscriptionStatus: "active",
        plan_expires_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // -2 días (gracia)
        planExpiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        active: true,
        is_published: true,
        isPublished: true,
        onboarding_completed: true,
        onboardingCompleted: true,
        created_at: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString(),
        views: 80,
        whatsapp_clicks: 12,
        products: [],
        categories: [],
      };

      await setupAdminSessionAndMocks(page, {
        stores: [mockStoreGrace],
        pausa_activa: true,
        semilla_fin: null,
      });

      await page.goto("/admin/dashboard", { waitUntil: "domcontentloaded" });

      const graceBanner = page.locator('[data-testid="admin-grace-banner"]');
      await expect(graceBanner).toBeVisible({ timeout: 10000 });
      await expect(graceBanner).toContainText("Tu plan venció, renueva para no pausar tu catálogo");

      const shotPath = path.join(CAPTURAS_DIR, `0${viewport.name === "375" ? "5" : "6"}-panel-en-gracia-${viewport.name}.png`);
      await page.screenshot({ path: shotPath, fullPage: true });
      expect(fs.existsSync(shotPath)).toBe(true);
    });
  }

  // 4. Landing sin tarjeta Semilla a 375px y 1280px
  for (const viewport of [
    { width: 375, height: 667, name: "375" },
    { width: 1280, height: 800, name: "1280" },
  ]) {
    test(`Landing sin Semilla a ${viewport.name}px`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      await page.goto("/", { waitUntil: "domcontentloaded" });

      // Botón principal de Hero
      const heroBtn = page.getByRole("link", { name: "Prueba 7 días gratis" }).first();
      await expect(heroBtn).toBeVisible({ timeout: 10000 });

      // Sección de precios: debe mostrar Emprendedor, Pro, Ilimitado y NO Semilla
      const pricingSection = page.locator("#precios");
      await pricingSection.scrollIntoViewIfNeeded();

      await expect(pricingSection.getByRole("heading", { name: "Emprendedor" })).toBeVisible();
      await expect(pricingSection.getByRole("heading", { name: "Catálogo Pro" })).toBeVisible();
      await expect(pricingSection.getByRole("heading", { name: "Ilimitado" })).toBeVisible();
      await expect(pricingSection.getByRole("heading", { name: "Plan Semilla" })).toHaveCount(0);

      // Pregunta frecuente sobre plan gratis actualizada (abrir acordeón)
      const faqBtn = page.getByRole("button", { name: "¿Puedo empezar gratis sin pagar nada?" });
      await faqBtn.scrollIntoViewIfNeeded();
      await faqBtn.click();
      const faqAnswer = page.getByText(/Sí: 7 días de Pro gratis, sin tarjeta/);
      await expect(faqAnswer).toBeVisible({ timeout: 5000 });

      const shotPath = path.join(CAPTURAS_DIR, `0${viewport.name === "375" ? "7" : "8"}-landing-sin-semilla-${viewport.name}.png`);
      await page.screenshot({ path: shotPath, fullPage: true });
      expect(fs.existsSync(shotPath)).toBe(true);
    });
  }

  // 5. Super Admin con interruptor de pausa y badges de estado a 1280px
  test("Super Admin: visualización de interruptor pausa_activa y badges", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const superMockStoreActive = {
      id: "00000000-0000-0000-0000-000000000058",
      owner_id: "00000000-0000-0000-0000-000000000058",
      ownerId: "00000000-0000-0000-0000-000000000058",
      slug: "super-tienda-activa",
      name: "Tienda Super Activa",
      phone: "999111222",
      country_code: "51",
      countryCode: "51",
      country_iso: "PE",
      countryIso: "PE",
      plan: "pro",
      subscription_status: "active",
      subscriptionStatus: "active",
      plan_expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      planExpiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      active: true,
      is_published: true,
      isPublished: true,
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      views: 120,
      whatsapp_clicks: 25,
      products: [],
      categories: [],
    };

    const superMockStorePaused = {
      id: "00000000-0000-0000-0000-000000000059",
      owner_id: "00000000-0000-0000-0000-000000000059",
      ownerId: "00000000-0000-0000-0000-000000000059",
      slug: "super-tienda-pausada",
      name: "Tienda Super Pausada",
      phone: "999333444",
      country_code: "51",
      countryCode: "51",
      country_iso: "PE",
      countryIso: "PE",
      plan: "pro",
      subscription_status: "active",
      subscriptionStatus: "active",
      plan_expires_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      planExpiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      active: true,
      is_published: true,
      isPublished: true,
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      views: 30,
      whatsapp_clicks: 2,
      products: [],
      categories: [],
    };

    await setupAdminSessionAndMocks(page, {
      role: "super_admin",
      stores: [superMockStoreActive, superMockStorePaused],
      pausa_activa: true,
      semilla_fin: null,
    });

    await page.goto("/super/tiendas", { waitUntil: "domcontentloaded" });

    // Verificar switch de pausa activa
    const switchControl = page.locator('[data-testid="pausa-activa-switch"]');
    await expect(switchControl).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Interruptor Global: Pausa Comercial (F57)")).toBeVisible();

    // Verificar badges de estado F57 en la tabla
    const badges = page.locator('[data-testid="access-state-badge"]');
    await expect(badges.first()).toBeVisible({ timeout: 10000 });

    const shotPath = path.join(CAPTURAS_DIR, "09-super-switch-pausa-1280.png");
    await page.screenshot({ path: shotPath, fullPage: true });
    expect(fs.existsSync(shotPath)).toBe(true);
  });
});
