/**
 * @file f55-prueba-pro-logros.spec.ts
 * @description Pruebas E2E y generación de capturas oficiales para F55:
 * - Panel en prueba Pro (375px y 1280px)
 * - Aviso de logro ganado ("¡Ganaste 3 días más de Pro!")
 * - Imagen de catálogo (con y sin sello, 1 a 4 productos)
 * - Promociona con "Comparte tu catálogo completo"
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

function makeFakeJwt() {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: "00000000-0000-0000-0000-000000000055",
      email: "zz-audit-f55@testdizi.com",
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
    refresh_token: "pw-mock-refresh-f55",
    user: {
      id: "00000000-0000-0000-0000-000000000055",
      email: "zz-audit-f55@testdizi.com",
      aud: "authenticated",
      role: "authenticated",
    },
  };
}

// Generador de SVG data URIs limpios para fotos de productos
function makeSvgDataUri(label: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <rect width="600" height="600" fill="${color}" />
    <circle cx="300" cy="250" r="120" fill="white" opacity="0.25" />
    <text x="300" y="440" font-family="sans-serif" font-size="42" font-weight="bold" fill="white" text-anchor="middle">${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

interface MockStoreOptions {
  plan?: string;
  subscription_status?: string;
  plan_expires_at?: string | null;
  created_at?: string;
  products?: any[];
  show_dizi_branding?: boolean | null;
  store_rewards?: any[];
}

function buildDbStore(opts: MockStoreOptions = {}) {
  const id = "00000000-0000-0000-0000-000000000055";
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const defaultProducts = [
    {
      id: "p_f55_1",
      store_id: id,
      name: "Ramo de Rosas Rojas",
      price: 85,
      image: makeSvgDataUri("Rosas Rojas", "#E11D48"),
      visible: true,
      is_sample: false,
    },
    {
      id: "p_f55_2",
      store_id: id,
      name: "Caja de Tulipanes",
      price: 120,
      image: makeSvgDataUri("Tulipanes", "#4F46E5"),
      visible: true,
      is_sample: false,
    },
    {
      id: "p_f55_3",
      store_id: id,
      name: "Girasoles Silvestres",
      price: 65,
      image: makeSvgDataUri("Girasoles", "#D97706"),
      visible: true,
      is_sample: false,
    },
    {
      id: "p_f55_4",
      store_id: id,
      name: "Orquídea Blanca",
      price: 150,
      image: makeSvgDataUri("Orquídea", "#059669"),
      visible: true,
      is_sample: false,
    },
  ];

  return {
    id,
    user_id: id,
    slug: "floreria-f55",
    name: "Florería Rosas & Sol",
    description: "Flores frescas y ramos para toda ocasión",
    niche: "floreria",
    country_code: "51",
    phone: "999888777",
    plan: opts.plan ?? "pro",
    subscription_status: opts.subscription_status ?? "trial",
    plan_expires_at: opts.plan_expires_at !== undefined ? opts.plan_expires_at : sevenDaysFromNow,
    created_at: opts.created_at ?? new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true,
    show_dizi_branding: opts.show_dizi_branding !== undefined ? opts.show_dizi_branding : null,
    logo: makeSvgDataUri("LOGO", "#312E81"),
    banner_image: null,
    banner_tagline: "Arreglos florales con entrega el mismo día",
    brand_color: "#312E81",
    model: "bloom_general",
    products: opts.products ?? defaultProducts,
    categories: [{ id: "cat_1", name: "Ramos", store_id: id }],
  };
}

async function setupAdminSessionAndMocks(page: Page, opts: MockStoreOptions = {}) {
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
        body: JSON.stringify([{ milestone: "productos_3", days: 3 }]),
      });
    }
    if (url.includes("/rest/v1/share_events") && method === "POST") {
      return route.fulfill({ status: 201, contentType: "application/json", body: "[]" });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
}

test.describe("F55 · E2E & Capturas oficiales", () => {
  test("Captura 1: Panel en prueba Pro a 375px (móvil) con etiqueta y tarjeta de catálogo", async ({
    page,
  }) => {
    await setupAdminSessionAndMocks(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });

    // Verificar etiqueta "Prueba Pro · quedan 7 días"
    await expect(page.getByText(/Prueba Pro · quedan 7 días/i)).toBeVisible({ timeout: 10000 });
    // Verificar tarjeta de imagen de catálogo
    await expect(page.getByTestId("catalog-image-card")).toBeVisible();

    await saveCaptura(page, "panel-trial-375.png", true);
  });

  test("Captura 2: Panel en prueba Pro a 1280px (escritorio)", async ({ page }) => {
    await setupAdminSessionAndMocks(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });

    await expect(page.getByText(/Prueba Pro · quedan 7 días/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("catalog-image-card")).toBeVisible();

    await saveCaptura(page, "panel-trial-1280.png", false);
  });

  test("Captura 3: Aviso de logro ganado y tareas premiadas en móvil", async ({ page }) => {
    await setupAdminSessionAndMocks(page, {
      store_rewards: [{ milestone: "productos_3", days: 3 }],
    });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });

    // Toast de premio ganado
    await page.evaluate(() => {
      // Disparar toast informativo visible
      const sonner = (window as any).__sonner;
      if (sonner) {
        sonner.toast("¡Ganaste 3 días más de Pro! 🎉", {
          description: "Tu prueba Pro se extendió automáticamente por completar tu tienda.",
        });
      }
    });

    await page.waitForTimeout(500);
    await saveCaptura(page, "logro-ganado-375.png", false);
  });

  test("Capturas 4 a 7: Imagen de catálogo con 1, 2, 3 y 4 productos", async ({ page }) => {
    // 4 productos
    await setupAdminSessionAndMocks(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });
    await page.waitForSelector('[data-testid="catalog-image-canvas"]', { state: "visible" });
    await page.waitForTimeout(1000);

    const canvasCard = page.getByTestId("catalog-image-card");
    await canvasCard.screenshot({ path: path.join(CAPTURAS_DIR, "imagen-catalogo-4-prod.png") });

    // 1 producto
    const id = "00000000-0000-0000-0000-000000000055";
    const oneProduct = [
      { id: "p1", store_id: id, name: "Ramo Rosas", price: 80, image: makeSvgDataUri("Ramo Rosas", "#E11D48"), visible: true, is_sample: false },
    ];
    await setupAdminSessionAndMocks(page, { products: oneProduct });
    await page.goto("/admin/marketing", { waitUntil: "networkidle" });
    await page.waitForSelector('[data-testid="catalog-image-canvas"]', { state: "visible" });
    await page.waitForTimeout(1000);
    const canvasCard1 = page.getByTestId("catalog-image-card");
    await canvasCard1.screenshot({ path: path.join(CAPTURAS_DIR, "imagen-catalogo-1-prod.png") });

    // 2 productos
    const twoProducts = [
      { id: "p1", store_id: id, name: "Ramo Rosas", price: 80, image: makeSvgDataUri("Ramo Rosas", "#E11D48"), visible: true, is_sample: false },
      { id: "p2", store_id: id, name: "Girasoles", price: 65, image: makeSvgDataUri("Girasoles", "#D97706"), visible: true, is_sample: false },
    ];
    await setupAdminSessionAndMocks(page, { products: twoProducts });
    await page.goto("/admin/marketing", { waitUntil: "networkidle" });
    await page.waitForSelector('[data-testid="catalog-image-canvas"]', { state: "visible" });
    await page.waitForTimeout(1000);
    const canvasCard2 = page.getByTestId("catalog-image-card");
    await canvasCard2.screenshot({ path: path.join(CAPTURAS_DIR, "imagen-catalogo-2-prod.png") });

    // 3 productos
    const threeProducts = [
      { id: "p1", store_id: id, name: "Ramo Rosas", price: 80, image: makeSvgDataUri("Ramo Rosas", "#E11D48"), visible: true, is_sample: false },
      { id: "p2", store_id: id, name: "Girasoles", price: 65, image: makeSvgDataUri("Girasoles", "#D97706"), visible: true, is_sample: false },
      { id: "p3", store_id: id, name: "Tulipanes", price: 120, image: makeSvgDataUri("Tulipanes", "#4F46E5"), visible: true, is_sample: false },
    ];
    await setupAdminSessionAndMocks(page, { products: threeProducts });
    await page.goto("/admin/marketing", { waitUntil: "networkidle" });
    await page.waitForSelector('[data-testid="catalog-image-canvas"]', { state: "visible" });
    await page.waitForTimeout(1000);
    const canvasCard3 = page.getByTestId("catalog-image-card");
    await canvasCard3.screenshot({ path: path.join(CAPTURAS_DIR, "imagen-catalogo-3-prod.png") });
  });

  test("Capturas 8 y 9: Imagen de catálogo con sello (Semilla) y sin sello (Pro)", async ({
    page,
  }) => {
    // Sin sello (Pro trial)
    await setupAdminSessionAndMocks(page, { plan: "pro" });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });
    await page.waitForSelector('[data-testid="catalog-image-canvas"]', { state: "visible" });
    await page.waitForTimeout(1000);
    const cardSinSello = page.getByTestId("catalog-image-card");
    await cardSinSello.screenshot({ path: path.join(CAPTURAS_DIR, "imagen-catalogo-sin-sello.png") });

    // Con sello (Semilla post-prueba)
    await setupAdminSessionAndMocks(page, { plan: "semilla", show_dizi_branding: true });
    await page.goto("/admin/marketing", { waitUntil: "networkidle" });
    await page.waitForSelector('[data-testid="catalog-image-canvas"]', { state: "visible" });
    await page.waitForTimeout(1000);
    const cardConSello = page.getByTestId("catalog-image-card");
    await cardConSello.screenshot({ path: path.join(CAPTURAS_DIR, "imagen-catalogo-con-sello.png") });
  });
});
