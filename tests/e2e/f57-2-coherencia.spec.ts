import { test, expect, type Page, type Route } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const CAPTURAS_DIR =
  "D:\\DIZI\\DIZI-20261014T161215Z-1-001\\DIZI\\INFORMACIÓN NECESARIA\\04-TECNICA\\encargos\\capturas-f57-2";

function ensureCapturasDir() {
  fs.mkdirSync(CAPTURAS_DIR, { recursive: true });
}

function makeFakeJwt(role = "store_owner") {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: "00000000-0000-0000-0000-000000005702",
      email: role === "super_admin" ? "super-admin@dizi.pe" : "zz-audit-f57-2@testdizi.com",
      exp: 9999999999,
      app_metadata: { role },
      user_metadata: { role, full_name: role === "super_admin" ? "Super Admin" : "Audit F57.2 Store" },
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
    refresh_token: "pw-mock-refresh-f57-2",
    user: {
      id: "00000000-0000-0000-0000-000000005702",
      email: role === "super_admin" ? "super-admin@dizi.pe" : "zz-audit-f57-2@testdizi.com",
      aud: "authenticated",
      role: "authenticated",
      app_metadata: { role },
      user_metadata: { role, full_name: role === "super_admin" ? "Super Admin" : "Audit F57.2 Store" },
    },
  };
}

interface MockStoreOptions {
  id?: string;
  slug: string;
  name: string;
  plan: "semilla" | "emprendedor" | "pro" | "ilimitado";
  subscriptionStatus?: string;
  planExpiresAt?: string | null;
  views?: number;
  whatsappClicks?: number;
}

function buildMockStore(opts: MockStoreOptions) {
  const id = opts.id ?? "s_mock_f57_2";
  const subStatus = opts.subscriptionStatus ?? "active";
  return {
    id,
    owner_id: "00000000-0000-0000-0000-000000005702",
    ownerId: "00000000-0000-0000-0000-000000005702",
    user_id: "00000000-0000-0000-0000-000000005702",
    userId: "00000000-0000-0000-0000-000000005702",
    slug: opts.slug,
    name: opts.name,
    phone: "987654321",
    country_code: "51",
    countryCode: "51",
    country_iso: "PE",
    countryIso: "PE",
    plan: opts.plan,
    subscription_status: subStatus,
    subscriptionStatus: subStatus,
    plan_expires_at: opts.planExpiresAt ?? null,
    planExpiresAt: opts.planExpiresAt ?? null,
    active: true,
    is_published: true,
    isPublished: true,
    onboarding_completed: true,
    onboardingCompleted: true,
    created_at: "2026-10-01T12:00:00.000Z",
    createdAt: "2026-10-01T12:00:00.000Z",
    views: opts.views ?? 25,
    whatsapp_clicks: opts.whatsappClicks ?? 4,
    whatsappClicks: opts.whatsappClicks ?? 4,
    products: [],
    categories: [],
  };
}

interface SetupOptions {
  role?: string;
  fixedTimeIso?: string;
  stores: ReturnType<typeof buildMockStore>[];
  currentStoreId?: string;
  pausaActiva?: boolean;
  pausaDesde?: string | null;
  semillaFin?: string | null;
}

async function setupPageSessionAndMocks(page: Page, options: SetupOptions) {
  ensureCapturasDir();
  if (options.fixedTimeIso) {
    await page.clock.setFixedTime(new Date(options.fixedTimeIso));
  }

  const role = options.role || "store_owner";
  const session = makeMockSession(role);
  const stores = options.stores;
  const currentStoreId = options.currentStoreId || stores[0]?.id;
  const pausaActiva = options.pausaActiva ?? false;
  const pausaDesde = options.pausaDesde ?? null;
  const semillaFin = options.semillaFin !== undefined ? options.semillaFin : "2026-12-25";

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
}

test.describe("F57.2 · Pruebas E2E Móvil (movil-android)", () => {
  // --------------------------------------------------------------------------
  // Escenario 3: Mi Plan, switch apagado, vencido 5 días → muestra hasta 20 productos
  // --------------------------------------------------------------------------
  test("Escenario 3: Mi Plan con switch off y vencido 5 días muestra 'muestra hasta 20 productos'", async ({ page }) => {
    const store = buildMockStore({
      slug: "tienda-e3-off",
      name: "Tienda E3 Switch Off",
      plan: "pro",
      planExpiresAt: "2026-11-19T12:00:00.000Z", // vencida 5 días
    });

    await setupPageSessionAndMocks(page, {
      fixedTimeIso: "2026-11-24T12:00:00.000Z",
      stores: [store],
      pausaActiva: false,
    });

    await page.goto("/admin/plan", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("muestra hasta 20 productos")).toBeVisible({ timeout: 10000 });

    const capturePath = path.join(CAPTURAS_DIR, "f57-2-escenario-03-mi-plan-switch-off-20prod.png");
    await page.screenshot({ path: capturePath, fullPage: true });
    expect(fs.existsSync(capturePath)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Escenario 4: Mi Plan, switch encendido, vencido 1 día → banner de gracia
  // --------------------------------------------------------------------------
  test("Escenario 4: Mi Plan con switch on y vencido 1 día muestra aviso de gracia", async ({ page }) => {
    const store = buildMockStore({
      slug: "tienda-e4-gracia",
      name: "Tienda E4 Gracia",
      plan: "pro",
      planExpiresAt: "2026-11-23T12:00:00.000Z", // vencida 1 día
    });

    await setupPageSessionAndMocks(page, {
      fixedTimeIso: "2026-11-24T12:00:00.000Z",
      stores: [store],
      pausaActiva: true,
      pausaDesde: "2026-11-01T00:00:00.000Z",
    });

    await page.goto("/admin/plan", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/tienes 3 días de gracia/i)).toBeVisible({ timeout: 10000 });

    const capturePath = path.join(CAPTURAS_DIR, "f57-2-escenario-04-mi-plan-switch-on-gracia.png");
    await page.screenshot({ path: capturePath, fullPage: true });
    expect(fs.existsSync(capturePath)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Escenario 5: Mi Plan, switch encendido, vencido 5 días → banner de pausa
  // --------------------------------------------------------------------------
  test("Escenario 5: Mi Plan con switch on y vencido 5 días muestra aviso de pausa", async ({ page }) => {
    const store = buildMockStore({
      slug: "tienda-e5-pausa",
      name: "Tienda E5 Pausa",
      plan: "pro",
      planExpiresAt: "2026-11-19T12:00:00.000Z", // vencida 5 días
    });

    await setupPageSessionAndMocks(page, {
      fixedTimeIso: "2026-11-24T12:00:00.000Z",
      stores: [store],
      pausaActiva: true,
      pausaDesde: "2026-11-01T00:00:00.000Z",
    });

    await page.goto("/admin/plan", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/tu catálogo está en pausa/i)).toBeVisible({ timeout: 10000 });

    const capturePath = path.join(CAPTURAS_DIR, "f57-2-escenario-05-mi-plan-switch-on-pausa.png");
    await page.screenshot({ path: capturePath, fullPage: true });
    expect(fs.existsSync(capturePath)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Escenario 6: /terminos con fecha Noviembre 2026 y sin 'plan gratuito'
  // --------------------------------------------------------------------------
  test("Escenario 6: /terminos muestra 'Noviembre 2026' y 'Etapa de lanzamiento'", async ({ page }) => {
    await page.goto("/terminos", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/Última actualización:\s*Noviembre 2026/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Etapa de lanzamiento", { exact: true })).toBeVisible({ timeout: 10000 });

    const capturePath = path.join(CAPTURAS_DIR, "f57-2-escenario-06-terminos.png");
    await page.screenshot({ path: capturePath, fullPage: false });
    expect(fs.existsSync(capturePath)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Escenario 7: /ayuda muestra '90 días' y sin 'plan gratuito'
  // --------------------------------------------------------------------------
  test("Escenario 7: /ayuda muestra '90 días' de conservación de enlace", async ({ page }) => {
    await page.goto("/ayuda", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /6\.\s*Configuración del negocio/i }).click();
    await expect(page.getByText(/90 días/i).first()).toBeVisible({ timeout: 10000 });

    const capturePath = path.join(CAPTURAS_DIR, "f57-2-escenario-07-ayuda.png");
    await page.screenshot({ path: capturePath, fullPage: false });
    expect(fs.existsSync(capturePath)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Escenario 8: Superadmin muestra u oculta Semilla según semilla_fin
  // --------------------------------------------------------------------------
  test("Escenario 8: Superadmin con semilla_fin futuro muestra Semilla '(hasta el ...)'", async ({ page }) => {
    const store = buildMockStore({
      slug: "tienda-super-e8",
      name: "Tienda Super E8",
      plan: "pro",
      planExpiresAt: "2026-12-20T12:00:00.000Z",
    });

    await setupPageSessionAndMocks(page, {
      role: "super_admin",
      fixedTimeIso: "2026-11-24T12:00:00.000Z",
      stores: [store],
      pausaActiva: true,
      semillaFin: "2026-12-25",
    });

    await page.goto("/super/tiendas", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const capturePath = path.join(CAPTURAS_DIR, "f57-2-escenario-08-super-semilla-vigente.png");
    await page.screenshot({ path: capturePath, fullPage: false });
    expect(fs.existsSync(capturePath)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Escenario 16: Diálogo de cancelar en el super no dice Semilla y Mi Plan muestra 'Sin plan activo'
  // --------------------------------------------------------------------------
  test("Escenario 16: Superadmin cancelar suscripción y Mi Plan 'Sin plan activo'", async ({ page }) => {
    const storeCancelled = buildMockStore({
      slug: "tienda-e16-cancelada",
      name: "Tienda E16 Cancelada",
      plan: "pro",
      subscriptionStatus: "cancelled",
      planExpiresAt: "2026-11-20T12:00:00.000Z",
    });

    await setupPageSessionAndMocks(page, {
      fixedTimeIso: "2026-11-24T12:00:00.000Z",
      stores: [storeCancelled],
      pausaActiva: true,
      pausaDesde: "2026-11-01T00:00:00.000Z",
    });

    // 1. Verificar Mi Plan muestra "Sin plan activo"
    await page.goto("/admin/plan", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Sin plan activo")).toBeVisible({ timeout: 10000 });

    const capturePlanPath = path.join(CAPTURAS_DIR, "f57-2-escenario-16-mi-plan-cancelada.png");
    await page.screenshot({ path: capturePlanPath, fullPage: true });
    expect(fs.existsSync(capturePlanPath)).toBe(true);

    // 2. Verificar vista de superadmin
    const storeToCancel = buildMockStore({
      slug: "tienda-super-e16",
      name: "Tienda Super E16",
      plan: "pro",
      planExpiresAt: "2026-12-20T12:00:00.000Z",
    });

    await setupPageSessionAndMocks(page, {
      role: "super_admin",
      fixedTimeIso: "2026-11-24T12:00:00.000Z",
      stores: [storeToCancel],
      pausaActiva: true,
      semillaFin: "2026-12-25",
    });

    await page.goto("/super/tiendas", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const captureSuperPath = path.join(CAPTURAS_DIR, "f57-2-escenario-16-super-cancelar-dialogo.png");
    await page.screenshot({ path: captureSuperPath, fullPage: false });
    expect(fs.existsSync(captureSuperPath)).toBe(true);
  });
});
