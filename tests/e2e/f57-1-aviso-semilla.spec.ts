import { test, expect, type Page, type Route } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const CAPTURAS_DIR =
  "D:\\DIZI\\DIZI-20261014T161215Z-1-001\\DIZI\\INFORMACIÓN NECESARIA\\04-TECNICA\\encargos\\capturas-f57-1";

function ensureCapturasDir() {
  fs.mkdirSync(CAPTURAS_DIR, { recursive: true });
}

function makeFakeJwt(role = "store_owner") {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: "00000000-0000-0000-0000-000000005701",
      email: "zz-audit-f57-1@testdizi.com",
      exp: 9999999999,
      app_metadata: { role },
      user_metadata: { role, full_name: "Audit F57.1 Store" },
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
    refresh_token: "pw-mock-refresh-f57-1",
    user: {
      id: "00000000-0000-0000-0000-000000005701",
      email: "zz-audit-f57-1@testdizi.com",
      aud: "authenticated",
      role: "authenticated",
      app_metadata: { role },
      user_metadata: { role, full_name: "Audit F57.1 Store" },
    },
  };
}

interface MockStoreOverrides {
  id?: string;
  slug: string;
  name: string;
  plan: "semilla" | "emprendedor" | "pro" | "ilimitado";
  subscriptionStatus?: string;
  planExpiresAt?: string | null;
}

function buildMockStore(overrides: MockStoreOverrides) {
  const id = overrides.id ?? "s_f57_1_mock";
  const subscriptionStatus = overrides.subscriptionStatus ?? "active";
  const planExpiresAt =
    overrides.planExpiresAt !== undefined ? overrides.planExpiresAt : null;

  return {
    id,
    owner_id: "00000000-0000-0000-0000-000000005701",
    ownerId: "00000000-0000-0000-0000-000000005701",
    user_id: "00000000-0000-0000-0000-000000005701",
    userId: "00000000-0000-0000-0000-000000005701",
    slug: overrides.slug,
    name: overrides.name,
    phone: "987654321",
    country_code: "51",
    countryCode: "51",
    country_iso: "PE",
    countryIso: "PE",
    plan: overrides.plan,
    subscription_status: subscriptionStatus,
    subscriptionStatus,
    plan_expires_at: planExpiresAt,
    planExpiresAt,
    active: true,
    is_published: true,
    isPublished: true,
    onboarding_completed: true,
    onboardingCompleted: true,
    created_at: "2026-10-01T12:00:00.000Z",
    createdAt: "2026-10-01T12:00:00.000Z",
    views: 42,
    whatsapp_clicks: 8,
    whatsappClicks: 8,
    products: [],
    categories: [],
  };
}

interface SetupOptions {
  fixedTimeIso: string;
  store: ReturnType<typeof buildMockStore>;
  pausaActiva?: boolean;
  pausaDesde?: string | null;
  semillaFin?: string | null;
}

async function openPanelWithMocks(page: Page, options: SetupOptions) {
  await page.clock.setFixedTime(new Date(options.fixedTimeIso));

  const session = makeMockSession("store_owner");
  const stores = [options.store];
  const pausaActiva = options.pausaActiva ?? false;
  const pausaDesde = options.pausaDesde ?? null;
  const semillaFin = options.semillaFin !== undefined ? options.semillaFin : "2026-12-09";

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
    { authSession: session, mockStores: stores, activeStoreId: options.store.id },
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
    const url = route.request().url();
    if (url.includes("/rest/v1/app_config")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { key: "pausa_activa", value: pausaActiva },
          { key: "semilla_fin", value: semillaFin },
          { key: "pausa_desde", value: pausaDesde },
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
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    });
  });

  const appConfigResponse = page.waitForResponse(
    (res) => res.url().includes("/rest/v1/app_config") && res.status() === 200,
  );
  await page.goto("/admin/dashboard", { waitUntil: "domcontentloaded" });
  await appConfigResponse;
  await expect(page.getByTestId("panel-hero")).toBeVisible();
}

// 24 nov 2026 10:00 hora Lima = 2026-11-24T15:00:00.000Z
const TIME_24_NOV_LIMA = "2026-11-24T15:00:00.000Z";

test.describe("F57.1: Aviso en el panel a quienes están en plan gratis (escenarios 1–13)", () => {
  test.beforeAll(() => {
    ensureCapturasDir();
  });

  test('Escenario 1: Semilla, semilla_fin = 9 dic, hoy 24 nov → ventana + franja "9 de diciembre", "Faltan 15 días"', async ({
    page,
  }) => {
    const store = buildMockStore({
      id: "s_f57_1_e1",
      slug: "bazar-aurora",
      name: "Bazar Aurora",
      plan: "semilla",
    });

    await openPanelWithMocks(page, {
      fixedTimeIso: TIME_24_NOV_LIMA,
      store,
      semillaFin: "2026-12-09",
    });

    const dialog = page.getByTestId("semilla-notice-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Cambia el plan gratis");
    await expect(page.getByTestId("semilla-notice-date")).toHaveText("9 de diciembre");
    await expect(page.getByTestId("semilla-notice-countdown")).toHaveText("Faltan 15 días");
    await expect(dialog).toContainText("Hasta el 8 de diciembre todo sigue igual.");
    await expect(dialog).toContainText("El 9 de diciembre te regalamos 7 días de Pro.");
    await expect(dialog).toContainText(
      "Después eliges tu plan desde S/ 19.90. Si no, tu catálogo queda en pausa; no se borra nada.",
    );

    // RNF-57.1.2: verificar que la ventana entra completa en el celular sin desbordarse
    const viewport = page.viewportSize()!;
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);

    const banner = page.getByTestId("admin-semilla-countdown-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("El plan gratis termina el 9 de diciembre");
    await expect(page.getByTestId("admin-semilla-countdown-days")).toHaveText("Faltan 15 días");

    const shot = path.join(CAPTURAS_DIR, "e01-semilla-ventana-24nov.png");
    await page.screenshot({ path: shot });
    expect(fs.existsSync(shot)).toBe(true);
  });

  test("Escenario 2: Pro pagado vigente → nada", async ({ page }) => {
    const store = buildMockStore({
      id: "s_f57_1_e2",
      slug: "moda-sol-pro",
      name: "Moda Sol",
      plan: "pro",
      subscriptionStatus: "active",
      planExpiresAt: "2026-12-20T15:00:00.000Z",
    });

    await openPanelWithMocks(page, {
      fixedTimeIso: TIME_24_NOV_LIMA,
      store,
      semillaFin: "2026-12-09",
    });

    await expect(page.getByTestId("semilla-notice-dialog")).toHaveCount(0);
    await expect(page.getByTestId("admin-semilla-countdown-banner")).toHaveCount(0);

    const shot = path.join(CAPTURAS_DIR, "e02-pro-pagado-vigente.png");
    await page.screenshot({ path: shot });
    expect(fs.existsSync(shot)).toBe(true);
  });

  test("Escenario 3: Pro en prueba vigente → nada", async ({ page }) => {
    const store = buildMockStore({
      id: "s_f57_1_e3",
      slug: "calzado-norte-trial",
      name: "Calzado Norte",
      plan: "pro",
      subscriptionStatus: "trial",
      planExpiresAt: "2026-11-30T15:00:00.000Z",
    });

    await openPanelWithMocks(page, {
      fixedTimeIso: TIME_24_NOV_LIMA,
      store,
      semillaFin: "2026-12-09",
    });

    await expect(page.getByTestId("panel-hero-badge")).toContainText("Prueba Pro");
    await expect(page.getByTestId("semilla-notice-dialog")).toHaveCount(0);
    await expect(page.getByTestId("admin-semilla-countdown-banner")).toHaveCount(0);

    const shot = path.join(CAPTURAS_DIR, "e03-pro-prueba-vigente.png");
    await page.screenshot({ path: shot });
    expect(fs.existsSync(shot)).toBe(true);
  });

  test("Escenario 4: Pagado vencido hace 1 día (gracia) → solo su aviso de gracia, no el de plan gratis", async ({
    page,
  }) => {
    const store = buildMockStore({
      id: "s_f57_1_e4",
      slug: "joyas-brillo-gracia",
      name: "Joyas Brillo",
      plan: "pro",
      subscriptionStatus: "active",
      planExpiresAt: "2026-11-23T15:00:00.000Z", // venció hace 1 día
    });

    await openPanelWithMocks(page, {
      fixedTimeIso: TIME_24_NOV_LIMA,
      store,
      pausaActiva: true,
      pausaDesde: "2026-11-18T00:00:00.000Z",
      semillaFin: "2026-12-09",
    });

    const graceBanner = page.getByTestId("admin-grace-banner");
    await expect(graceBanner).toBeVisible();
    await expect(graceBanner).toContainText("Tu plan venció, renueva para no pausar tu catálogo");

    await expect(page.getByTestId("semilla-notice-dialog")).toHaveCount(0);
    await expect(page.getByTestId("admin-semilla-countdown-banner")).toHaveCount(0);

    const shot = path.join(CAPTURAS_DIR, "e04-pagado-gracia-1dia.png");
    await page.screenshot({ path: shot });
    expect(fs.existsSync(shot)).toBe(true);
  });

  test("Escenario 5: Pagado vencido hace 5 días → ventana + franja", async ({ page }) => {
    const store = buildMockStore({
      id: "s_f57_1_e5",
      slug: "deco-hogar-vencida",
      name: "Deco Hogar",
      plan: "emprendedor",
      subscriptionStatus: "active",
      planExpiresAt: "2026-11-19T15:00:00.000Z", // venció hace 5 días (> 3 días de gracia)
    });

    await openPanelWithMocks(page, {
      fixedTimeIso: TIME_24_NOV_LIMA,
      store,
      pausaActiva: false,
      semillaFin: "2026-12-09",
    });

    const dialog = page.getByTestId("semilla-notice-dialog");
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId("semilla-notice-date")).toHaveText("9 de diciembre");
    await expect(page.getByTestId("semilla-notice-countdown")).toHaveText("Faltan 15 días");

    const banner = page.getByTestId("admin-semilla-countdown-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("El plan gratis termina el 9 de diciembre");

    const shot = path.join(CAPTURAS_DIR, "e05-pagado-vencido-5dias.png");
    await page.screenshot({ path: shot });
    expect(fs.existsSync(shot)).toBe(true);
  });

  test("Escenario 6: Semilla con slug *-demo → nada", async ({ page }) => {
    const store = buildMockStore({
      id: "s_f57_1_e6",
      slug: "pasteleria-demo",
      name: "Pastelería Demo",
      plan: "semilla",
    });

    await openPanelWithMocks(page, {
      fixedTimeIso: TIME_24_NOV_LIMA,
      store,
      semillaFin: "2026-12-09",
    });

    await expect(page.getByTestId("semilla-notice-dialog")).toHaveCount(0);
    await expect(page.getByTestId("admin-semilla-countdown-banner")).toHaveCount(0);
  });

  test("Escenario 7: Semilla con slug zz-* → nada", async ({ page }) => {
    const store = buildMockStore({
      id: "s_f57_1_e7",
      slug: "zz-audit-f57-1-semilla",
      name: "Tienda ZZ Audit",
      plan: "semilla",
    });

    await openPanelWithMocks(page, {
      fixedTimeIso: TIME_24_NOV_LIMA,
      store,
      semillaFin: "2026-12-09",
    });

    await expect(page.getByTestId("semilla-notice-dialog")).toHaveCount(0);
    await expect(page.getByTestId("admin-semilla-countdown-banner")).toHaveCount(0);
  });

  test("Escenario 8: Ilimitado sin vencimiento → nada", async ({ page }) => {
    const store = buildMockStore({
      id: "s_f57_1_e8",
      slug: "interna-dizi-ilimitado",
      name: "Cuenta Interna Dizi",
      plan: "ilimitado",
      planExpiresAt: null,
    });

    await openPanelWithMocks(page, {
      fixedTimeIso: TIME_24_NOV_LIMA,
      store,
      semillaFin: "2026-12-09",
    });

    await expect(page.getByTestId("semilla-notice-dialog")).toHaveCount(0);
    await expect(page.getByTestId("admin-semilla-countdown-banner")).toHaveCount(0);
  });

  test("Escenario 9: semilla_fin vacío → nada para nadie", async ({ page }) => {
    const store = buildMockStore({
      id: "s_f57_1_e9",
      slug: "bazar-aurora",
      name: "Bazar Aurora",
      plan: "semilla",
    });

    await openPanelWithMocks(page, {
      fixedTimeIso: TIME_24_NOV_LIMA,
      store,
      semillaFin: null,
    });

    await expect(page.getByTestId("semilla-notice-dialog")).toHaveCount(0);
    await expect(page.getByTestId("admin-semilla-countdown-banner")).toHaveCount(0);
  });

  test("Escenario 10: Hoy = 9 dic (hora Lima) o después → nada", async ({ page }) => {
    const store = buildMockStore({
      id: "s_f57_1_e10",
      slug: "bazar-aurora",
      name: "Bazar Aurora",
      plan: "semilla",
    });

    // 9 dic 2026 00:00:00 Lima = 2026-12-09T05:00:00.000Z
    await openPanelWithMocks(page, {
      fixedTimeIso: "2026-12-09T05:00:00.000Z",
      store,
      semillaFin: "2026-12-09",
    });

    await expect(page.getByTestId("semilla-notice-dialog")).toHaveCount(0);
    await expect(page.getByTestId("admin-semilla-countdown-banner")).toHaveCount(0);

    const shot = path.join(CAPTURAS_DIR, "e10-dia-s-9dic-oculto.png");
    await page.screenshot({ path: shot });
    expect(fs.existsSync(shot)).toBe(true);
  });

  test('Escenario 11: 8 dic 23:30 Lima → todavía se ve ("Falta 1 día")', async ({ page }) => {
    const store = buildMockStore({
      id: "s_f57_1_e11",
      slug: "bazar-aurora",
      name: "Bazar Aurora",
      plan: "semilla",
    });

    // 8 dic 2026 23:30:00 Lima = 2026-12-09T04:30:00.000Z
    await openPanelWithMocks(page, {
      fixedTimeIso: "2026-12-09T04:30:00.000Z",
      store,
      semillaFin: "2026-12-09",
    });

    const dialog = page.getByTestId("semilla-notice-dialog");
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId("semilla-notice-date")).toHaveText("9 de diciembre");
    await expect(page.getByTestId("semilla-notice-countdown")).toHaveText("Falta 1 día");

    const banner = page.getByTestId("admin-semilla-countdown-banner");
    await expect(banner).toBeVisible();
    await expect(page.getByTestId("admin-semilla-countdown-days")).toHaveText("Falta 1 día");

    const shot = path.join(CAPTURAS_DIR, "e11-8dic-2330-falta-1dia.png");
    await page.screenshot({ path: shot });
    expect(fs.existsSync(shot)).toBe(true);
  });

  test('Escenario 12: Cerrar con "Entendido" y recargar → no vuelve la ventana; la franja sí', async ({
    page,
  }) => {
    const store = buildMockStore({
      id: "s_f57_1_e12",
      slug: "bazar-aurora",
      name: "Bazar Aurora",
      plan: "semilla",
    });

    await openPanelWithMocks(page, {
      fixedTimeIso: TIME_24_NOV_LIMA,
      store,
      semillaFin: "2026-12-09",
    });

    const dialog = page.getByTestId("semilla-notice-dialog");
    await expect(dialog).toBeVisible();

    await page.getByTestId("semilla-notice-entendido").click();
    await expect(dialog).toHaveCount(0);

    const banner = page.getByTestId("admin-semilla-countdown-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("El plan gratis termina el 9 de diciembre");

    const shotAfterDismiss = path.join(CAPTURAS_DIR, "e12a-franja-tras-entendido.png");
    await page.screenshot({ path: shotAfterDismiss });
    expect(fs.existsSync(shotAfterDismiss)).toBe(true);

    // Recargar y esperar a que app_config responda de nuevo
    const reloadConfigResp = page.waitForResponse(
      (res) => res.url().includes("/rest/v1/app_config") && res.status() === 200,
    );
    await page.reload({ waitUntil: "domcontentloaded" });
    await reloadConfigResp;

    await expect(page.getByTestId("panel-hero")).toBeVisible();
    await expect(banner).toBeVisible();
    await expect(page.getByTestId("admin-semilla-countdown-days")).toHaveText("Faltan 15 días");
    await expect(page.getByTestId("semilla-notice-dialog")).toHaveCount(0);

    const shotAfterReload = path.join(CAPTURAS_DIR, "e12b-recarga-sin-ventana-con-franja.png");
    await page.screenshot({ path: shotAfterReload });
    expect(fs.existsSync(shotAfterReload)).toBe(true);
  });

  test('Escenario 13: "Ver planes" lleva a /admin/plan', async ({ page }) => {
    const store = buildMockStore({
      id: "s_f57_1_e13",
      slug: "bazar-aurora",
      name: "Bazar Aurora",
      plan: "semilla",
    });

    await openPanelWithMocks(page, {
      fixedTimeIso: TIME_24_NOV_LIMA,
      store,
      semillaFin: "2026-12-09",
    });

    const dialog = page.getByTestId("semilla-notice-dialog");
    await expect(dialog).toBeVisible();

    await page.getByTestId("semilla-notice-ver-planes").click();
    await expect(page).toHaveURL(/\/admin\/plan/);
    await expect(page.getByRole("heading", { name: "Mi Plan" })).toBeVisible();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId("admin-semilla-countdown-banner")).toBeVisible();

    const shot = path.join(CAPTURAS_DIR, "e13-navegacion-admin-plan.png");
    await page.screenshot({ path: shot });
    expect(fs.existsSync(shot)).toBe(true);
  });
});
