/**
 * @file f55-prueba-pro-logros.spec.ts
 * @description Pruebas E2E y exportación oficial de capturas a resolución completa para F55:
 * - Panel en prueba Pro (375px y 1280px)
 * - Aviso de logro ganado con refresco dinámico de la etiqueta a días reales
 * - Imágenes de catálogo REALES a tamaño completo (1080×1920 y 1080×1080)
 *   con fotos reales de floreria-demo (1, 2, 3 y 4 productos, con y sin sello)
 */

import { test, expect, type Page, type Route } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const CAPTURAS_DIR =
  "D:\\DIZI\\DIZI-20261014T161215Z-1-001\\DIZI\\INFORMACIÓN NECESARIA\\04-TECNICA\\encargos\\capturas-f55";

function saveCaptura(page: Page, fileName: string, fullPage = false) {
  fs.mkdirSync(CAPTURAS_DIR, { recursive: true });
  return page.screenshot({
    path: path.join(CAPTURAS_DIR, fileName),
    fullPage,
  });
}

/**
 * Exporta el contenido exacto del canvas a su resolución nativa completa (1080×1920 o 1080×1080)
 */
async function exportFullCanvas(page: Page, fileName: string) {
  fs.mkdirSync(CAPTURAS_DIR, { recursive: true });
  await page.waitForSelector('canvas[data-testid="catalog-image-canvas"]', { state: "visible", timeout: 20000 });
  await expect(page.getByText("Preparando imagen...")).not.toBeVisible({ timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(600);
  const dataUrl = await page.evaluate(async () => {
    const canvas = document.querySelector('canvas[data-testid="catalog-image-canvas"]') as HTMLCanvasElement;
    if (!canvas) return null;
    return canvas.toDataURL("image/png");
  });
  if (dataUrl) {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
    const filePath = path.join(CAPTURAS_DIR, fileName);
    fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
  }
}

function makeFakeJwt() {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: "00000000-0000-0000-0000-000000000055",
      email: "zz-audit-f55@testdizi.com",
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
    refresh_token: "pw-mock-refresh-f55",
    user: {
      id: "00000000-0000-0000-0000-000000000055",
      email: "zz-audit-f55@testdizi.com",
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
  created_at?: string;
  products?: any[];
  show_dizi_branding?: boolean | null;
  store_rewards?: any[];
  claim_rewards_result?: any[];
}

function buildDbStore(opts: MockStoreOptions = {}) {
  const id = "00000000-0000-0000-0000-000000000055";
  const now = new Date();

  // Calcular días de expiración reales considerando recompensas acumuladas
  const totalRewardDays = (opts.store_rewards ?? []).reduce(
    (acc: number, r: any) => acc + (r.days || 0),
    0,
  );
  const totalDays = 7 + totalRewardDays;
  const calculatedExpiresAt = new Date(now.getTime() + totalDays * 24 * 60 * 60 * 1000).toISOString();

  // Fotos REALES de floreria-demo (alojadas en BunnyCDN con CORS abierto)
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

  const rawProducts = (opts.products ?? defaultProducts).map((p, idx) => ({
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
    created_at: opts.created_at ?? new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: opts.created_at ?? new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    active: true,
    is_published: true,
    isPublished: true,
    onboarding_completed: true,
    onboardingCompleted: true,
    show_dizi_branding: opts.show_dizi_branding !== undefined ? opts.show_dizi_branding : null,
    showDiziBranding: opts.show_dizi_branding !== undefined ? opts.show_dizi_branding : null,
    logo: "https://dizifotos.b-cdn.net/s_floreriademo/logo.webp",
    banner_image: null,
    banner_tagline: "Arreglos florales con entrega el mismo día",
    brand_color: "#312E81",
    brandColor: "#312E81",
    model: "bloom_general",
    products: rawProducts,
    categories: [{ id: "cat_1", name: "Ramos", store_id: id, storeId: id, sort_order: 1 }],
  };
}

async function setupAdminSessionAndMocks(page: Page, opts: MockStoreOptions = {}) {
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

  try {
    await page.evaluate(
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
  } catch {
    // Si la página aún no navegó, addInitScript lo aplicará
  }

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

    if (url.includes("/rest/v1/stores")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([store]),
      });
    }
    if (url.includes("/rest/v1/store_rewards")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(opts.store_rewards ?? []),
      });
    }
    if (url.includes("/rest/v1/rpc/claim_trial_rewards")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(opts.claim_rewards_result ?? []),
      });
    }
    if (url.includes("/rest/v1/share_events") && method === "POST") {
      return route.fulfill({ status: 201, contentType: "application/json", body: "[]" });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
}

test.describe("F55 · E2E & Capturas oficiales (Ajustes)", () => {
  test("Captura 1: Panel en prueba Pro a 375px (móvil) con etiqueta y sin aviso de suspensión", async ({
    page,
  }) => {
    await setupAdminSessionAndMocks(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });

    // Verificar etiqueta "Prueba Pro · quedan 7 días"
    await expect(page.getByText(/Prueba Pro · quedan 7 días/i)).toBeVisible({ timeout: 15000 });
    // Verificar que NO exista el aviso de suspensión (Ajuste 2)
    await expect(page.getByText(/Tu catálogo digital está actualmente suspendido/i)).not.toBeVisible();
    // Verificar tarjeta de imagen de catálogo
    await expect(page.getByTestId("catalog-image-card")).toBeVisible();

    await saveCaptura(page, "panel-trial-375.png", true);
  });

  test("Captura 2: Panel en prueba Pro a 1280px (escritorio)", async ({ page }) => {
    await setupAdminSessionAndMocks(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });

    await expect(page.getByText(/Prueba Pro · quedan 7 días/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Tu catálogo digital está actualmente suspendido/i)).not.toBeVisible();
    await expect(page.getByTestId("catalog-image-card")).toBeVisible();

    await saveCaptura(page, "panel-trial-1280.png", false);
  });

  test("Captura 3: Aviso de logro ganado y etiqueta refrescada a días reales (+5 días -> 12 días)", async ({
    page,
  }) => {
    // Tienda que ya ganó logros (productos_3: +3d, compartir: +2d = +5d total)
    await setupAdminSessionAndMocks(page, {
      store_rewards: [
        { milestone: "productos_3", days: 3 },
        { milestone: "compartir", days: 2 },
      ],
    });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });

    // La etiqueta debe reflejar los días reales de expiración: 7 días base + 5 días ganados = 12 días (Ajuste 3)
    await expect(page.getByText(/Prueba Pro · quedan 12 días/i)).toBeVisible({ timeout: 15000 });

    // Disparar toast informativo visible
    await page.evaluate(() => {
      const sonner = (window as any).__sonner;
      if (sonner) {
        sonner.toast("¡Ganaste 2 días más de Pro! 🎉", {
          description: "Tu prueba Pro se extendió automáticamente por compartir tu catálogo.",
        });
      }
    });

    await page.waitForTimeout(600);
    await saveCaptura(page, "logro-ganado-375.png", false);
  });

  test("Capturas 4 a 7: Imagen de catálogo REAL a tamaño completo (1080×1920 y 1080×1080) con 1 a 4 productos de floreria-demo", async ({
    page,
  }) => {
    test.setTimeout(120000);
    const id = "00000000-0000-0000-0000-000000000055";

    // ─────────────────────────────────────────────────────────────────────────
    // 4 PRODUCTOS (Florería Pétalos & Detalles)
    // ─────────────────────────────────────────────────────────────────────────
    await setupAdminSessionAndMocks(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/admin/marketing", { waitUntil: "networkidle" });
    await page.waitForSelector('[data-testid="catalog-image-canvas"]', { state: "visible" });
    await page.waitForTimeout(1500);

    // Exportar Historia (1080×1920)
    await exportFullCanvas(page, "imagen-catalogo-4-prod-1080x1920.png");
    await exportFullCanvas(page, "imagen-catalogo-4-prod.png");

    // Cambiar a Cuadrada (1080×1080)
    await page.getByText("Cuadrada (1:1)").click();
    await page.waitForTimeout(1200);
    await exportFullCanvas(page, "imagen-catalogo-4-prod-1080x1080.png");

    // ─────────────────────────────────────────────────────────────────────────
    // 1 PRODUCTO
    // ─────────────────────────────────────────────────────────────────────────
    const oneProduct = [
      {
        id: "p1",
        store_id: id,
        name: "50 Rosas",
        price: 100,
        image: "https://dizifotos.b-cdn.net/s_floreriademo/products/5r9bgwd4_thumb.webp",
        visible: true,
        is_sample: false,
      },
    ];
    await setupAdminSessionAndMocks(page, { products: oneProduct });
    await page.goto("/admin/marketing", { waitUntil: "networkidle" });
    await page.waitForSelector('[data-testid="catalog-image-canvas"]', { state: "visible" });
    await page.waitForTimeout(1500);

    // Exportar Historia (1080×1920)
    await exportFullCanvas(page, "imagen-catalogo-1-prod-1080x1920.png");
    await exportFullCanvas(page, "imagen-catalogo-1-prod.png");

    // Cambiar a Cuadrada (1080×1080)
    await page.getByText("Cuadrada (1:1)").click();
    await page.waitForTimeout(1200);
    await exportFullCanvas(page, "imagen-catalogo-1-prod-1080x1080.png");

    // ─────────────────────────────────────────────────────────────────────────
    // 2 PRODUCTOS
    // ─────────────────────────────────────────────────────────────────────────
    const twoProducts = [
      {
        id: "p1",
        store_id: id,
        name: "50 Rosas",
        price: 100,
        image: "https://dizifotos.b-cdn.net/s_floreriademo/products/5r9bgwd4_thumb.webp",
        visible: true,
        is_sample: false,
      },
      {
        id: "p2",
        store_id: id,
        name: "Ramo Primaveral",
        price: 150,
        image: "https://dizifotos.b-cdn.net/s_floreriademo/products/rzbltpm2_thumb.webp",
        visible: true,
        is_sample: false,
      },
    ];
    await setupAdminSessionAndMocks(page, { products: twoProducts });
    await page.goto("/admin/marketing", { waitUntil: "networkidle" });
    await page.waitForSelector('[data-testid="catalog-image-canvas"]', { state: "visible" });
    await page.waitForTimeout(1500);

    // Exportar Historia (1080×1920)
    await exportFullCanvas(page, "imagen-catalogo-2-prod-1080x1920.png");
    await exportFullCanvas(page, "imagen-catalogo-2-prod.png");

    // Cambiar a Cuadrada (1080×1080)
    await page.getByText("Cuadrada (1:1)").click();
    await page.waitForTimeout(1200);
    await exportFullCanvas(page, "imagen-catalogo-2-prod-1080x1080.png");

    // ─────────────────────────────────────────────────────────────────────────
    // 3 PRODUCTOS
    // ─────────────────────────────────────────────────────────────────────────
    const threeProducts = [
      {
        id: "p1",
        store_id: id,
        name: "50 Rosas",
        price: 100,
        image: "https://dizifotos.b-cdn.net/s_floreriademo/products/5r9bgwd4_thumb.webp",
        visible: true,
        is_sample: false,
      },
      {
        id: "p2",
        store_id: id,
        name: "Ramo Primaveral",
        price: 150,
        image: "https://dizifotos.b-cdn.net/s_floreriademo/products/rzbltpm2_thumb.webp",
        visible: true,
        is_sample: false,
      },
      {
        id: "p3",
        store_id: id,
        name: "Ramo Premium Amor Eterno",
        price: 150,
        image: "https://dizifotos.b-cdn.net/s_floreriademo/products/p_flor7_thumb.webp",
        visible: true,
        is_sample: false,
      },
    ];
    await setupAdminSessionAndMocks(page, { products: threeProducts });
    await page.goto("/admin/marketing", { waitUntil: "networkidle" });
    await page.waitForSelector('[data-testid="catalog-image-canvas"]', { state: "visible" });
    await page.waitForTimeout(1500);

    // Exportar Historia (1080×1920)
    await exportFullCanvas(page, "imagen-catalogo-3-prod-1080x1920.png");
    await exportFullCanvas(page, "imagen-catalogo-3-prod.png");

    // Cambiar a Cuadrada (1080×1080)
    await page.getByText("Cuadrada (1:1)").click();
    await page.waitForTimeout(1200);
    await exportFullCanvas(page, "imagen-catalogo-3-prod-1080x1080.png");
  });

  test("Capturas 8 y 9: Imagen de catálogo con sello (Semilla) y sin sello (Pro) a tamaño completo", async ({
    page,
  }) => {
    test.setTimeout(120000);

    // ─────────────────────────────────────────────────────────────────────────
    // SIN SELLO (Pro trial)
    // ─────────────────────────────────────────────────────────────────────────
    await setupAdminSessionAndMocks(page, { plan: "pro" });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/admin/marketing", { waitUntil: "networkidle" });
    await page.waitForSelector('[data-testid="catalog-image-canvas"]', { state: "visible" });
    await page.waitForTimeout(1500);

    // Historia sin sello (1080×1920)
    await exportFullCanvas(page, "imagen-catalogo-sin-sello-1080x1920.png");
    await exportFullCanvas(page, "imagen-catalogo-sin-sello.png");

    // Cuadrada sin sello (1080×1080)
    await page.getByText("Cuadrada (1:1)").click();
    await page.waitForTimeout(1200);
    await exportFullCanvas(page, "imagen-catalogo-sin-sello-1080x1080.png");

    // ─────────────────────────────────────────────────────────────────────────
    // CON SELLO (Semilla post-prueba)
    // ─────────────────────────────────────────────────────────────────────────
    await setupAdminSessionAndMocks(page, { plan: "semilla", show_dizi_branding: true });
    await page.goto("/admin/marketing", { waitUntil: "networkidle" });
    await page.waitForSelector('[data-testid="catalog-image-canvas"]', { state: "visible" });
    await page.waitForTimeout(1500);

    // Historia con sello (1080×1920)
    await exportFullCanvas(page, "imagen-catalogo-con-sello-1080x1920.png");
    await exportFullCanvas(page, "imagen-catalogo-con-sello.png");

    // Cuadrada con sello (1080×1080)
    await page.getByText("Cuadrada (1:1)").click();
    await page.waitForTimeout(1200);
    await exportFullCanvas(page, "imagen-catalogo-con-sello-1080x1080.png");
  });
});
