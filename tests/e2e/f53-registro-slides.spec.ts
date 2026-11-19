import { test, expect, type Page, type Route } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const CAPTURAS_DIR =
  "D:\\DIZI\\DIZI-20261014T161215Z-1-001\\DIZI\\INFORMACIÓN NECESARIA\\04-TECNICA\\encargos\\capturas-f53";

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
      email: "audit-f53@testdizi.com",
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
      email: "audit-f53@testdizi.com",
      aud: "authenticated",
      role: "authenticated",
      app_metadata: { role },
      user_metadata: { role, full_name: "Florería María" },
    },
  };
}

interface MockTracker {
  signUpCalls: number;
  initializeStoreBody: any;
  storeUpdateBodies: any[];
  funnelInserts: any[];
  inviteMarkBody: any;
}

/**
 * Enruta `https://dizi.idenza.site/**` hacia el servidor Vite local para probar
 * el comportamiento productivo real (donde `window.location.hostname === "dizi.idenza.site"`).
 */
async function mountProductionDomainProxy(page: Page) {
  await page.route("https://dizi.idenza.site/**", async (route: Route) => {
    const req = route.request();
    const parsed = new URL(req.url());
    const localUrl = `http://localhost:5173${parsed.pathname}${parsed.search}`;
    let res;
    try {
      res = await page.request.fetch(localUrl, { method: req.method() });
    } catch {
      res = await page.request.fetch(localUrl, { method: req.method() });
    }
    const headers = { ...res.headers() };
    delete headers["content-encoding"];
    delete headers["content-length"];
    delete headers["transfer-encoding"];
    const body = await res.body();
    return route.fulfill({
      status: res.status(),
      headers,
      body,
    });
  });
}

async function setupSupabaseMocks(
  page: Page,
  options: {
    slugAvailable?: boolean | ((slug: string) => boolean);
    inviteResult?: any[];
  } = {},
): Promise<MockTracker> {
  const tracker: MockTracker = {
    signUpCalls: 0,
    initializeStoreBody: null,
    storeUpdateBodies: [],
    funnelInserts: [],
    inviteMarkBody: null,
  };

  const session = makeMockSession("store_owner");
  const storesStore: any[] = [];

  await page.route("https://zkqzdwxjthjdjchimmds.supabase.co/**", async (route: Route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();

    if (url.includes("/auth/v1/signup")) {
      tracker.signUpCalls += 1;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(session),
      });
    }
    if (url.includes("/auth/v1/token")) {
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
        categories: [{ id: body.p_category_id, store_id: body.p_id, name: "Principal" }],
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
        body: JSON.stringify(inv ? [inv] : []),
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
    if (url.includes("/storage/v1/object/public/images/")) {
      return route.continue();
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });

  return tracker;
}

async function advanceStep1(page: Page, name = "Florería María") {
  await page.locator("#register-store-name").fill(name);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByTestId("register-step-counter")).toHaveText("Paso 2 de 5");
}

async function advanceStep2(page: Page, niche = "floreria") {
  await page.locator(`button[data-niche="${niche}"]`).click();
  await expect(page.getByTestId("register-step-counter")).toHaveText("Paso 3 de 5", {
    timeout: 5000,
  });
}

async function advanceStep3(page: Page, phone = "987654321") {
  await page.locator('input[type="tel"]').fill(phone);
  await expect(page.getByRole("button", { name: "Continuar" })).toBeEnabled({ timeout: 5000 });
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByTestId("register-step-counter")).toHaveText("Paso 4 de 5");
}

test.describe("F53 · Registro en slides con vista previa en vivo (Escenarios 1 a 13)", () => {
  test("E1 Dado el celular, cuando completo las 6 pantallas, entonces se crea la cuenta y veo la celebración con el nombre de mi tienda", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await mountProductionDomainProxy(page);
    const tracker = await setupSupabaseMocks(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("https://dizi.idenza.site/register", { waitUntil: "networkidle" });

    // Pantalla 1
    await expect(page.getByTestId("register-step-counter")).toHaveText("Paso 1 de 5");
    await page.locator("#register-store-name").fill("Florería María");
    const step1Continuar = page.getByRole("button", { name: "Continuar" });
    await expect(step1Continuar).toBeEnabled();
    await expect
      .poll(() =>
        step1Continuar.evaluate((el) => {
          const s = window.getComputedStyle(el);
          return { opacity: s.opacity, bg: s.backgroundColor };
        }),
      )
      .toEqual({ opacity: "1", bg: "rgb(255, 92, 57)" });
    await saveCaptura(page, "f53-p1-nombre-375px.png", true);
    await step1Continuar.click();

    // Pantalla 2
    await expect(page.getByTestId("register-step-counter")).toHaveText("Paso 2 de 5");
    await expect(page.locator("button[data-niche]")).toHaveCount(12);
    await page.locator('button[data-niche="floreria"]').click();
    await expect(page.getByTestId("register-step-counter")).toHaveText("Paso 3 de 5", {
      timeout: 5000,
    });

    // Pantalla 3
    await page.locator('input[type="tel"]').fill("987654321");
    await expect(page.getByTestId("live-preview-whatsapp-btn")).toBeVisible({ timeout: 5000 });
    const step3Continuar = page.getByRole("button", { name: "Continuar" });
    await expect(step3Continuar).toBeEnabled();
    await expect
      .poll(() =>
        step3Continuar.evaluate((el) => {
          const s = window.getComputedStyle(el);
          return { opacity: s.opacity, bg: s.backgroundColor };
        }),
      )
      .toEqual({ opacity: "1", bg: "rgb(255, 92, 57)" });
    await saveCaptura(page, "f53-p3-whatsapp-375px.png", true);
    await step3Continuar.click();

    // Pantalla 4
    await expect(page.getByTestId("register-step-counter")).toHaveText("Paso 4 de 5");
    await page.locator('button[data-signup-city="lima"]').click();
    await saveCaptura(page, "f53-p4-datos-375px.png", true);
    await page.locator('button[data-signup-source="tiktok"]').click();
    await expect(page.getByTestId("register-step-counter")).toHaveText("Paso 5 de 5", {
      timeout: 5000,
    });

    // Pantalla 5 (sin campo editable de link)
    await expect(page.locator("#register-store-link")).toHaveCount(0);
    await page.locator("#register-email").fill("maria@testdizi.com");
    await page.locator("#register-password").fill("clave123");
    await page.locator("#acceptTerms").check();
    const createBtn375 = page.getByRole("button", { name: /crear mi catálogo/i });
    await expect(createBtn375).toBeEnabled();
    await expect
      .poll(() => createBtn375.evaluate((el) => window.getComputedStyle(el).opacity))
      .toBe("1");
    await saveCaptura(page, "f53-p5-cuenta-375px.png", true);
    await createBtn375.click();

    // Pantalla 6
    await expect(page.getByTestId("register-celebration-slide")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Florería María ya está/i)).toBeVisible();
    await expect(page.getByTestId("celebration-store-link")).toContainText(
      /Tu link:\s*dizi\.idenza\.site\/t\/floreria-maria/,
    );
    await expect(page.getByText("Puedes cambiarlo cuando quieras en Configuración")).toBeVisible();
    await expect(page.getByTestId("preview-test-mode-banner")).toHaveCount(0);
    await expect(page.getByTestId("celebration-preview-notice")).toHaveCount(0);
    await expect(page.getByText(/Tienda creada con éxito/i)).toHaveCount(0);
    await page.waitForTimeout(200);
    await saveCaptura(page, "f53-p6-celebracion-375px.png", true);

    expect(tracker.signUpCalls).toBe(1);
    expect(tracker.initializeStoreBody?.p_slug).toBe("floreria-maria");
    expect(tracker.storeUpdateBodies[0]?.signup_city).toBe("lima");
    expect(tracker.storeUpdateBodies[0]?.signup_source).toBe("tiktok");
  });

  test("E2 Dado que escribo 'Florería María', entonces la vista previa muestra ese nombre y la inicial 'F'", async ({
    page,
  }) => {
    await mountProductionDomainProxy(page);
    await setupSupabaseMocks(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("https://dizi.idenza.site/register", { waitUntil: "networkidle" });

    await page.locator("#register-store-name").fill("Florería María");
    await expect(page.getByTestId("preview-store-name")).toHaveText("Florería María");
    await expect(page.getByTestId("preview-store-initial")).toHaveText("F");
  });

  test("E3 Dado que toco Florería, entonces avanza solo y la vista previa cambia al diseño y los colores de Florería, con productos de ejemplo de flores", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await mountProductionDomainProxy(page);
    await setupSupabaseMocks(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("https://dizi.idenza.site/register", { waitUntil: "networkidle" });

    await advanceStep1(page, "Florería María");

    // Capturas de Pantalla 2 con 3 rubros distintos (Comida, Servicios y Florería)
    // En 375 px hacemos pausa antes del autoavance seleccionando con flecha/teclado o capturando justo tras seleccionar
    await page.locator('button[data-niche="comida"]').focus();
    await page.keyboard.press("ArrowRight"); // pasa a pasteleria
    await page.keyboard.press("ArrowLeft"); // vuelve a comida con selección sin click
    await expect(page.getByTestId("live-preview-compact").getByText("Hamburguesa Monster Cheese").first()).toBeVisible({
      timeout: 5000,
    });
    await expect
      .poll(
        () =>
          page
            .locator('[data-testid="live-preview-compact"] img')
            .first()
            .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
        { timeout: 10000 },
      )
      .toBe(true);
    await saveCaptura(page, "f53-p2-rubro-comida-375px.png", true);

    await page.locator('button[data-niche="servicios"]').focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByTestId("live-preview-compact").getByText("Sesión de Asesoría 60 min").first()).toBeVisible({
      timeout: 5000,
    });
    await saveCaptura(page, "f53-p2-rubro-servicios-375px.png", true);

    await page.locator('button[data-niche="floreria"]').focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByTestId("live-preview-compact").getByText("50 Rosas").first()).toBeVisible({
      timeout: 5000,
    });
    await saveCaptura(page, "f53-p2-rubro-floreria-375px.png", true);

    // Al tocar Florería, avanza solo al Paso 3 manteniendo productos de flores
    await page.locator('button[data-niche="floreria"]').click();
    await expect(page.getByTestId("register-step-counter")).toHaveText("Paso 3 de 5", {
      timeout: 5000,
    });
    await expect(page.getByTestId("live-preview-compact").getByText("50 Rosas").first()).toBeVisible();
  });

  test("E4 Dado que vuelvo atrás desde la pantalla 4, entonces mis respuestas siguen ahí", async ({
    page,
  }) => {
    await mountProductionDomainProxy(page);
    await setupSupabaseMocks(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("https://dizi.idenza.site/register", { waitUntil: "networkidle" });

    await advanceStep1(page, "Florería María");
    await advanceStep2(page, "floreria");
    await advanceStep3(page, "987654321");

    // Volver desde pantalla 4 -> 3 -> 2 -> 1
    await page.getByRole("button", { name: "Volver al paso anterior" }).click();
    await expect(page.getByTestId("register-step-counter")).toHaveText("Paso 3 de 5");
    await expect(page.locator('input[type="tel"]')).not.toHaveValue("");

    await page.getByRole("button", { name: "Volver al paso anterior" }).click();
    await expect(page.getByTestId("register-step-counter")).toHaveText("Paso 2 de 5");
    await expect(page.locator('button[data-niche="floreria"]')).toHaveAttribute(
      "aria-checked",
      "true",
    );

    await page.getByRole("button", { name: "Volver al paso anterior" }).click();
    await expect(page.getByTestId("register-step-counter")).toHaveText("Paso 1 de 5");
    await expect(page.locator("#register-store-name")).toHaveValue("Florería María");
  });

  test("E5 Dado que toco 'Saltar' en 'Dos datos rápidos', entonces la tienda queda con ciudad y origen vacíos y el registro sigue", async ({
    page,
  }) => {
    await mountProductionDomainProxy(page);
    const tracker = await setupSupabaseMocks(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("https://dizi.idenza.site/register", { waitUntil: "networkidle" });

    await advanceStep1(page, "Florería Saltar");
    await advanceStep2(page, "floreria");
    await advanceStep3(page, "987654321");

    await page.locator('button[data-signup-city="cusco"]').click();
    await page.getByTestId("step4-skip-btn").click();
    await expect(page.getByTestId("register-step-counter")).toHaveText("Paso 5 de 5");

    await page.locator("#register-email").fill("saltar@testdizi.com");
    await page.locator("#register-password").fill("clave123");
    await page.locator("#acceptTerms").check();
    await page.getByRole("button", { name: /crear mi catálogo/i }).click();

    await expect(page.getByTestId("register-celebration-slide")).toBeVisible({ timeout: 10000 });
    expect(tracker.storeUpdateBodies[0]?.signup_city).toBeUndefined();
    expect(tracker.storeUpdateBodies[0]?.signup_source).toBeUndefined();
  });

  test("E6 Dado país distinto de Perú, entonces no se pregunta la ciudad", async ({ page }) => {
    await mountProductionDomainProxy(page);
    await setupSupabaseMocks(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("https://dizi.idenza.site/register", { waitUntil: "networkidle" });

    await advanceStep1(page, "Moda Bogotá");
    await advanceStep2(page, "ropa");

    // Cambiar país a Colombia (+57)
    await page.getByRole("button", { name: "Seleccionar país" }).click();
    await page.getByText("Colombia").first().click();
    await page.locator('input[type="tel"]').fill("3001234567");
    await expect(page.getByRole("button", { name: "Continuar" })).toBeEnabled({ timeout: 5000 });
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page.getByTestId("register-step-counter")).toHaveText("Paso 4 de 5");
    await expect(page.getByTestId("step4-city-section")).toHaveCount(0);
    await expect(page.getByTestId("step4-source-section")).toBeVisible();
  });

  test("E7 Dado ?origen=tiktok, ?ref=, ?invite= y ?plan=, entonces se comportan igual que en F49", async ({
    page,
  }) => {
    await mountProductionDomainProxy(page);
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
    await page.goto(
      "https://dizi.idenza.site/register?origen=tiktok&ref=AMIGO26&invite=INV-PRO-3M&plan=pro",
      { waitUntil: "networkidle" },
    );

    await expect(page.getByTestId("active-invite-banner")).toContainText("Plan PRO por 3 meses");
    await advanceStep1(page, "Florería Params");
    await advanceStep2(page, "floreria");
    await advanceStep3(page, "987654321");
    await page.getByTestId("step4-skip-btn").click();

    await page.locator("#register-email").fill("params@testdizi.com");
    await page.locator("#register-password").fill("clave123");
    await page.locator("#acceptTerms").check();
    await page.getByRole("button", { name: /crear mi catálogo/i }).click();

    await expect(page.getByTestId("register-celebration-slide")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Activar plan por WhatsApp/i)).toBeVisible();

    expect(tracker.storeUpdateBodies[0]?.signup_utm).toBe("tiktok");
    expect(tracker.storeUpdateBodies[0]?.referred_by).toBe("AMIGO26");
    expect(tracker.storeUpdateBodies[0]?.requested_plan).toBe("pro");
    expect(tracker.inviteMarkBody?.p_invite_token).toBe("INV-PRO-3M");
  });

  test("E8 Dado el escritorio a 1280 px, entonces veo la pantalla partida con el celular en vivo", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await mountProductionDomainProxy(page);
    await setupSupabaseMocks(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("https://dizi.idenza.site/register", { waitUntil: "networkidle" });

    // Pantalla 1 (1280 px)
    await expect(page.getByLabel("Vista previa en vivo de tu tienda")).toBeVisible();
    await page.locator("#register-store-name").fill("Florería María");
    await saveCaptura(page, "f53-p1-nombre-1280px.png", true);
    await page.getByRole("button", { name: "Continuar" }).click();

    // Pantalla 2 (1280 px)
    await expect(page.getByTestId("live-preview-desktop")).toBeVisible({ timeout: 5000 });
    await page.locator('button[data-niche="floreria"]').focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowLeft");
    await saveCaptura(page, "f53-p2-rubro-1280px.png", true);
    await page.locator('button[data-niche="floreria"]').click();
    await expect(page.getByTestId("register-step-counter")).toHaveText("Paso 3 de 5", {
      timeout: 5000,
    });

    // Pantalla 3 (1280 px)
    await page.locator('input[type="tel"]').fill("987654321");
    await expect(page.getByTestId("live-preview-whatsapp-btn")).toBeVisible({ timeout: 5000 });
    await saveCaptura(page, "f53-p3-whatsapp-1280px.png", true);
    await page.getByRole("button", { name: "Continuar" }).click();

    // Pantalla 4 (1280 px)
    await page.locator('button[data-signup-city="lima"]').click();
    await saveCaptura(page, "f53-p4-datos-1280px.png", true);
    await page.locator('button[data-signup-source="tiktok"]').click();
    await expect(page.getByTestId("register-step-counter")).toHaveText("Paso 5 de 5", {
      timeout: 5000,
    });

    // Pantalla 5 (1280 px)
    await expect(page.locator("#register-store-link")).toHaveCount(0);
    await page.locator("#register-email").fill("escritorio@testdizi.com");
    await page.locator("#register-password").fill("clave123");
    await page.locator("#acceptTerms").check();
    const createBtn1280 = page.getByRole("button", { name: /crear mi catálogo/i });
    await expect(createBtn1280).toBeEnabled();
    await expect
      .poll(() => createBtn1280.evaluate((el) => window.getComputedStyle(el).opacity))
      .toBe("1");
    await saveCaptura(page, "f53-p5-cuenta-1280px.png", true);
    await createBtn1280.click();

    // Pantalla 6 (1280 px)
    await expect(page.getByTestId("register-celebration-slide")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("celebration-store-link")).toContainText(
      /Tu link:\s*dizi\.idenza\.site\/t\/floreria-maria/,
    );
    // El emoji 🎉 debe quedar en la misma línea que "en línea!" (sin quedar solo en una línea)
    const nowrapRects = await page
      .locator('[data-testid="register-celebration-slide"] h1 .whitespace-nowrap')
      .evaluate((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return range.getClientRects().length;
      });
    expect(nowrapRects).toBe(1);
    await saveCaptura(page, "f53-p6-celebracion-1280px.png", true);
  });

  test("E9 Dada la pantalla 6, cuando toco 'Sube tu primer producto', entonces llego al formulario de bienvenida de F49", async ({
    page,
  }) => {
    await mountProductionDomainProxy(page);
    await setupSupabaseMocks(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("https://dizi.idenza.site/register", { waitUntil: "networkidle" });

    await advanceStep1(page, "Florería Bienvenida");
    await advanceStep2(page, "floreria");
    await advanceStep3(page, "987654321");
    await page.getByTestId("step4-skip-btn").click();
    await page.locator("#register-email").fill("bienvenida@testdizi.com");
    await page.locator("#register-password").fill("clave123");
    await page.locator("#acceptTerms").check();
    await page.getByRole("button", { name: /crear mi catálogo/i }).click();

    await expect(page.getByTestId("register-celebration-slide")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /sube tu primer producto/i }).click();
    await page.waitForURL(/\/admin\/productos.*bienvenida=1/, { timeout: 15000 });
    await expect(page.getByTestId("first-product-welcome-banner")).toBeVisible({ timeout: 10000 });
  });

  test("E10 Dado un recorrido, entonces el embudo registra cada pantalla, sin datos personales", async ({
    page,
  }) => {
    await mountProductionDomainProxy(page);
    const tracker = await setupSupabaseMocks(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("https://dizi.idenza.site/register?origen=ig-f53", { waitUntil: "networkidle" });

    await advanceStep1(page, "Florería Embudo");
    await advanceStep2(page, "floreria");
    await advanceStep3(page, "987654321");
    await page.getByTestId("step4-skip-btn").click();
    await page.locator("#register-email").fill("embudo@testdizi.com");
    await page.locator("#register-password").fill("clave123");
    await page.locator("#acceptTerms").check();
    await page.getByRole("button", { name: /crear mi catálogo/i }).click();

    await expect(page.getByTestId("register-celebration-slide")).toBeVisible({ timeout: 10000 });
    await expect
      .poll(() => tracker.funnelInserts.map((e) => e.step), { timeout: 5000 })
      .toContain("creo_cuenta");

    const steps = tracker.funnelInserts.map((e) => e.step);
    expect(steps).toEqual(
      expect.arrayContaining([
        "vio_registro",
        "completo_nombre",
        "completo_rubro",
        "completo_whatsapp",
        "completo_datos",
        "creo_cuenta",
      ]),
    );
    const raw = JSON.stringify(tracker.funnelInserts);
    expect(raw).not.toContain("embudo@testdizi.com");
    expect(raw).not.toContain("987654321");
  });

  test("E11 Dado prefers-reduced-motion, entonces no hay animaciones de deslizamiento", async ({
    page,
  }) => {
    await mountProductionDomainProxy(page);
    await setupSupabaseMocks(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("https://dizi.idenza.site/register", { waitUntil: "networkidle" });

    const progressFill = page.locator('[role="progressbar"] > div');
    const transitionDuration = await progressFill.evaluate(
      (el) => window.getComputedStyle(el).transitionDuration,
    );
    expect(transitionDuration).toBe("0s");
  });

  test("E12 Dado el texto sobre coral, entonces cumple el contraste de la regla de marca", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/register", { waitUntil: "networkidle" });

    const btn = page.getByRole("button", { name: "Continuar" });
    const colors = await btn.evaluate((el) => {
      const st = window.getComputedStyle(el);
      return { color: st.color, bg: st.backgroundColor, fontSize: parseFloat(st.fontSize) };
    });

    const parseRgb = (css: string) => {
      const m = css.match(/\d+/g)!.map(Number);
      return m.slice(0, 3) as [number, number, number];
    };
    const lum = ([r, g, b]: [number, number, number]) => {
      const ch = [r, g, b].map((v) => {
        const x = v / 255;
        return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
    };
    const l1 = lum(parseRgb(colors.color));
    const l2 = lum(parseRgb(colors.bg));
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  test("E13 Dado el entorno Preview (o localhost), cuando toco 'Crear mi catálogo', entonces no se crea cuenta ni tienda y veo la celebración con el aviso de modo prueba", async ({
    page,
  }) => {
    const tracker = await setupSupabaseMocks(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/register", { waitUntil: "networkidle" });

    await expect(page.getByTestId("preview-test-mode-banner")).toContainText(
      "Modo prueba: no se crea ninguna cuenta",
    );

    await advanceStep1(page, "Florería Preview");
    await advanceStep2(page, "floreria");
    await advanceStep3(page, "987654321");
    await page.getByTestId("step4-skip-btn").click();
    await page.locator("#register-email").fill("preview@testdizi.com");
    await page.locator("#register-password").fill("clave123");
    await page.locator("#acceptTerms").check();
    await page.getByRole("button", { name: /crear mi catálogo/i }).click();

    await expect(page.getByTestId("register-celebration-slide")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("celebration-preview-notice")).toContainText(
      "Modo prueba: no se crea ninguna cuenta",
    );
    await expect(page.getByText(/Tienda creada con éxito/i)).toHaveCount(0);
    await expect(page.getByText(/Catálogo publicado/i)).toHaveCount(0);
    await expect(page.getByText(/Florería Preview ya está/i)).toBeVisible();
    await saveCaptura(page, "f53-p6-celebracion-preview-375px.png", true);

    expect(tracker.signUpCalls).toBe(0);
    expect(tracker.initializeStoreBody).toBeNull();
    expect(tracker.funnelInserts).toHaveLength(0);
  });
});
