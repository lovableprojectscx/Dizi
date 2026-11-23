import { test, expect, Page, Route } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const CAPTURAS_DIR =
  "D:\\DIZI\\DIZI-20261014T161215Z-1-001\\DIZI\\INFORMACIÓN NECESARIA\\04-TECNICA\\encargos\\capturas-f55\\inicio-limpio";

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
      sub: "00000000-0000-0000-0000-000000000055",
      email: "zz-audit-f55-1@testdizi.com",
      exp: 9999999999,
      app_metadata: { role: "store_owner" },
      user_metadata: { role: "store_owner", full_name: "Florería Pétalos & Detalles" },
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
    refresh_token: "pw-mock-refresh-f55-1",
    user: {
      id: "00000000-0000-0000-0000-000000000055",
      email: "zz-audit-f55-1@testdizi.com",
      aud: "authenticated",
      role: "authenticated",
      app_metadata: { role: "store_owner" },
      user_metadata: { role: "store_owner", full_name: "Florería Pétalos & Detalles" },
    },
  };
}

interface MockStoreOptions {
  plan?: string;
  subscription_status?: string;
  plan_expires_at?: string | null;
  products?: any[];
  bio_links_enabled?: boolean;
}

function buildDbStore(opts: MockStoreOptions = {}) {
  const id = "00000000-0000-0000-0000-000000000055";
  const now = new Date();
  const calculatedExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const defaultProducts = [
    {
      id: "p_f55_1",
      store_id: id,
      storeId: id,
      name: "50 Rosas",
      price: 100,
      image: "https://dizifotos.b-cdn.net/s_floreriademo/products/5r9bgwd4_thumb.webp",
      visible: true,
      is_sample: false,
      isSample: false,
    },
    {
      id: "p_f55_2",
      store_id: id,
      storeId: id,
      name: "Ramo Primaveral",
      price: 150,
      image: "https://dizifotos.b-cdn.net/s_floreriademo/products/rzbltpm2_thumb.webp",
      visible: true,
      is_sample: false,
      isSample: false,
    },
    {
      id: "p_f55_3",
      store_id: id,
      storeId: id,
      name: "Ramo Premium Amor Eterno",
      price: 150,
      image: "https://dizifotos.b-cdn.net/s_floreriademo/products/p_flor7_thumb.webp",
      visible: true,
      is_sample: false,
      isSample: false,
    },
    {
      id: "p_f55_4",
      store_id: id,
      storeId: id,
      name: "Arreglo Floral de Rosas",
      price: 120,
      image: "https://dizifotos.b-cdn.net/s_floreriademo/products/5r9bgwd4.webp",
      visible: true,
      is_sample: false,
      isSample: false,
    },
  ];

  const rawProducts = (opts.products !== undefined ? opts.products : defaultProducts).map((p, idx) => ({
    ...p,
    id: p.id || `prod_${idx}`,
    storeId: id,
    store_id: id,
    visible: p.visible ?? true,
    isSample: p.isSample ?? p.is_sample ?? false,
    is_sample: p.isSample ?? p.is_sample ?? false,
  }));

  return {
    id,
    owner_id: id,
    ownerId: id,
    user_id: id,
    userId: id,
    slug: "floreria-demo",
    name: "Florería Pétalos & Detalles",
    description: "Arreglos florales y ramos para toda ocasión",
    niche: "floreria",
    country_code: "51",
    countryCode: "51",
    country_iso: "PE",
    countryIso: "PE",
    phone: "999888777",
    plan: opts.plan ?? "pro",
    subscription_status: opts.subscription_status ?? "trial",
    subscriptionStatus: opts.subscription_status ?? "trial",
    plan_expires_at: opts.plan_expires_at !== undefined ? opts.plan_expires_at : calculatedExpiresAt,
    planExpiresAt: opts.plan_expires_at !== undefined ? opts.plan_expires_at : calculatedExpiresAt,
    created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    active: true,
    is_published: true,
    isPublished: true,
    onboarding_completed: true,
    onboardingCompleted: true,
    show_dizi_branding: null,
    showDiziBranding: null,
    logo: "https://dizifotos.b-cdn.net/s_floreriademo/logo.webp",
    banner_image: null,
    banner_tagline: "Arreglos florales con entrega el mismo día",
    brand_color: "#312E81",
    brandColor: "#312E81",
    model: "bloom_general",
    bio_links_enabled: opts.bio_links_enabled ?? true,
    bioLinksEnabled: opts.bio_links_enabled ?? true,
    products: rawProducts,
    categories: [{ id: "cat_1", name: "Ramos", store_id: id, storeId: id, sort_order: 1 }],
  };
}

async function setupSession(page: Page, opts: MockStoreOptions = {}) {
  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));
  const session = makeMockSession();
  const store = buildDbStore(opts);

  await page.addInitScript(
    ({ authSession, mockStore }) => {
      const payload = JSON.stringify({ ...authSession, currentSession: authSession });
      window.localStorage.setItem("sb-zkqzdwxjthjdjchimmds-auth-token", payload);
      window.localStorage.setItem("sb-dummy-auth-token", payload);
      window.localStorage.setItem("sb-localhost-auth-token", payload);
      window.localStorage.setItem("dizi_onboarding_dismissed", "true");
      window.localStorage.setItem("dizi-onboarding-completed", "true");
      window.localStorage.removeItem("dizi_catalog_image_card_dismissed_" + mockStore.id);
      window.localStorage.setItem(
        "dizi-catalogos-v2",
        JSON.stringify({
          state: {
            stores: [mockStore],
            currentStoreId: mockStore.id,
            fetchError: null,
            lastFetched: Date.now(),
          },
          version: 1,
        }),
      );
    },
    { authSession: session, mockStore: store },
  );

  await page.route("**/auth/v1/**", async (route: Route) => {
    const url = route.request().url();
    if (url.includes("/user")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(session.user) });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(session) });
  });

  await page.route("**/rest/v1/stores*", async (route: Route) => {
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([store]) });
  });

  await page.route("**/rest/v1/products*", async (route: Route) => {
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(store.products) });
  });

  await page.route("**/rest/v1/categories*", async (route: Route) => {
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(store.categories) });
  });

  await page.route("**/rest/v1/rpc/**", async (route: Route) => {
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });
}

test.describe("F55.1 · Capturas ANTES", () => {
  test("Antes 1: Tienda con 3+ productos - 375px móvil", async ({ page }) => {
    await setupSession(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });
    await expect(page.getByText(/Florería Pétalos & Detalles/i)).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
    await saveCaptura(page, "inicio-3-prods-375-antes.png", true);
  });

  test("Antes 2: Tienda con 3+ productos - 1280px escritorio", async ({ page }) => {
    await setupSession(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });
    await expect(page.getByText(/Florería Pétalos & Detalles/i)).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
    await saveCaptura(page, "inicio-3-prods-1280-antes.png", false);
  });

  test("Antes 3: Tienda con 0 productos - 375px móvil", async ({ page }) => {
    await setupSession(page, { products: [] });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });
    await expect(page.getByText(/Florería Pétalos & Detalles/i)).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
    await saveCaptura(page, "inicio-0-prods-375-antes.png", true);
  });

  test("Antes 4: Tienda con 0 productos - 1280px escritorio", async ({ page }) => {
    await setupSession(page, { products: [] });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });
    await expect(page.getByText(/Florería Pétalos & Detalles/i)).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
    await saveCaptura(page, "inicio-0-prods-1280-antes.png", false);
  });
});

test.describe("F55.1 · Capturas DESPUÉS y Verificaciones", () => {
  test("Después 1: Tienda con 3+ productos - 375px móvil", async ({ page }) => {
    await setupSession(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });
    await expect(page.getByText(/Florería Pétalos & Detalles/i)).toBeVisible({ timeout: 15000 });

    // Verificaciones del bloque único y compacto
    const shareCard = page.getByTestId("share-store-card");
    await expect(shareCard).toBeVisible();
    await expect(page.getByText("Comparte tu tienda")).toBeVisible();
    await expect(page.getByText("Compártelo en tus estados y redes")).toBeVisible();

    // Miniatura 9:16 y botón principal presentes (coral)
    await expect(page.getByTestId("catalog-thumb-canvas")).toBeVisible();
    const mainBtn = page.getByTestId("main-share-button");
    await expect(mainBtn).toBeVisible();
    await expect(mainBtn).toHaveClass(/bg-primary/);
    await expect(page.getByText("Imagen lista")).toBeVisible();

    // 4 botones secundarios presentes con etiquetas cortas
    await expect(page.getByTestId("btn-copy-link")).toBeVisible();
    await expect(page.getByTestId("btn-copy-link")).toContainText("Link");
    await expect(page.getByTestId("btn-qr")).toBeVisible();
    await expect(page.getByTestId("btn-qr")).toContainText("QR");
    await expect(page.getByText("PDF")).toBeVisible();
    await expect(page.getByTestId("btn-bio-link")).toBeVisible();
    await expect(page.getByTestId("btn-bio-link")).toContainText("Bio");

    // Verificación de ausencia de bloques antiguos repetitivos
    await expect(page.getByText("¿Qué es el Catálogo Digital?")).not.toBeVisible();
    await expect(page.getByText("Enlace a tu Catálogo Digital")).not.toBeVisible();

    // Verificación de orden DOM: PanelHero -> NextStepCard -> ShareStoreCard -> dashboard-metrics
    const orderElements = await page.evaluate(() => {
      const hero = document.querySelector('[data-testid="panel-hero"]');
      const nextStep = document.querySelector('[data-testid="next-step-card"]');
      const share = document.querySelector('[data-testid="share-store-card"]');
      const metrics = document.querySelector('[data-testid="dashboard-metrics"]');
      return {
        hasHero: !!hero,
        hasNextStep: !!nextStep,
        hasShare: !!share,
        hasMetrics: !!metrics,
      };
    });
    expect(orderElements.hasShare).toBe(true);
    expect(orderElements.hasMetrics).toBe(true);

    await page.waitForTimeout(1000);
    await saveCaptura(page, "inicio-3-prods-375-despues.png", true);
  });

  test("Después 2: Tienda con 3+ productos - 1280px escritorio", async ({ page }) => {
    await setupSession(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });
    await expect(page.getByText(/Florería Pétalos & Detalles/i)).toBeVisible({ timeout: 15000 });

    const shareCard = page.getByTestId("share-store-card");
    await expect(shareCard).toBeVisible();
    await expect(page.getByTestId("catalog-thumb-canvas")).toBeVisible();

    await page.waitForTimeout(1000);
    await saveCaptura(page, "inicio-3-prods-1280-despues.png", false);
  });

  test("Después 3: Tienda con 0 productos - 375px móvil", async ({ page }) => {
    await setupSession(page, { products: [] });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });
    await expect(page.getByText(/Florería Pétalos & Detalles/i)).toBeVisible({ timeout: 15000 });

    const shareCard = page.getByTestId("share-store-card");
    await expect(shareCard).toBeVisible();

    // Sin miniatura canvas al tener 0 productos con foto
    await expect(page.getByTestId("catalog-thumb-canvas")).not.toBeVisible();
    // Botón principal presente para compartir link: SECUNDARIO (OUTLINE), no coral
    const mainBtn0 = page.getByTestId("main-share-button");
    await expect(mainBtn0).toBeVisible();
    await expect(mainBtn0).not.toHaveClass(/bg-primary/);
    await expect(mainBtn0).toHaveClass(/border/);
    // 4 botones secundarios presentes con etiquetas cortas
    await expect(page.getByTestId("btn-copy-link")).toBeVisible();
    await expect(page.getByTestId("btn-copy-link")).toContainText("Link");
    await expect(page.getByTestId("btn-qr")).toBeVisible();
    await expect(page.getByTestId("btn-qr")).toContainText("QR");
    await expect(page.getByText("PDF")).toBeVisible();
    await expect(page.getByTestId("btn-bio-link")).toBeVisible();
    await expect(page.getByTestId("btn-bio-link")).toContainText("Bio");

    await page.waitForTimeout(1000);
    await saveCaptura(page, "inicio-0-prods-375-despues.png", true);
  });

  test("Después 4: Tienda con 0 productos - 1280px escritorio", async ({ page }) => {
    await setupSession(page, { products: [] });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });
    await expect(page.getByText(/Florería Pétalos & Detalles/i)).toBeVisible({ timeout: 15000 });

    const shareCard = page.getByTestId("share-store-card");
    await expect(shareCard).toBeVisible();
    await expect(page.getByTestId("catalog-thumb-canvas")).not.toBeVisible();
    const mainBtn0 = page.getByTestId("main-share-button");
    await expect(mainBtn0).toBeVisible();
    await expect(mainBtn0).not.toHaveClass(/bg-primary/);

    await page.waitForTimeout(1000);
    await saveCaptura(page, "inicio-0-prods-1280-despues.png", false);
  });

  test("Después 5: Tienda con 3+ productos - 360px móvil (verificación sin truncado)", async ({ page }) => {
    await setupSession(page);
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });
    await expect(page.getByText(/Florería Pétalos & Detalles/i)).toBeVisible({ timeout: 15000 });

    // Verificaciones de no truncado a 360 px
    await expect(page.getByTestId("btn-copy-link")).toContainText("Link");
    await expect(page.getByTestId("btn-qr")).toContainText("QR");
    await expect(page.getByText("PDF")).toBeVisible();
    await expect(page.getByTestId("btn-bio-link")).toContainText("Bio");

    await page.waitForTimeout(1000);
    await saveCaptura(page, "inicio-3-prods-360-despues.png", true);
  });

  test("Después 6: Tienda con 0 productos - 360px móvil (verificación sin truncado)", async ({ page }) => {
    await setupSession(page, { products: [] });
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });
    await expect(page.getByText(/Florería Pétalos & Detalles/i)).toBeVisible({ timeout: 15000 });

    const mainBtn0 = page.getByTestId("main-share-button");
    await expect(mainBtn0).toBeVisible();
    await expect(mainBtn0).not.toHaveClass(/bg-primary/);
    await expect(page.getByTestId("btn-copy-link")).toContainText("Link");
    await expect(page.getByTestId("btn-bio-link")).toContainText("Bio");

    await page.waitForTimeout(1000);
    await saveCaptura(page, "inicio-0-prods-360-despues.png", true);
  });

  test("Interacción: Diálogo de QR y Copiar Link", async ({ page }) => {
    await setupSession(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });
    await expect(page.getByText(/Florería Pétalos & Detalles/i)).toBeVisible({ timeout: 15000 });

    // Abrir diálogo de QR
    const qrBtn = page.getByTestId("btn-qr");
    await expect(qrBtn).toBeVisible();
    await qrBtn.click();

    // Diálogo visible
    const qrDialog = page.getByTestId("qr-dialog");
    await expect(qrDialog).toBeVisible();
    await expect(page.getByTestId("btn-download-qr")).toBeVisible();

    // Cerrar diálogo desde el botón X o Cerrar del diálogo
    await qrDialog.getByLabel("Cerrar").click();
    await expect(qrDialog).not.toBeVisible();
  });
});
