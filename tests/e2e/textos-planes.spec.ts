import { test, expect, type Page, type Route } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const CAPTURAS_DIR =
  "D:\\DIZI\\DIZI-20261014T161215Z-1-001\\DIZI\\INFORMACIÓN NECESARIA\\04-TECNICA\\encargos\\capturas-textos-planes";

function ensureCapturasDir() {
  fs.mkdirSync(CAPTURAS_DIR, { recursive: true });
}

function makeFakeJwt() {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: "00000000-0000-0000-0000-000000000091",
      email: "zz-audit-textos-planes@testdizi.com",
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
    refresh_token: "pw-mock-refresh-tp",
    user: {
      id: "00000000-0000-0000-0000-000000000091",
      email: "zz-audit-textos-planes@testdizi.com",
      aud: "authenticated",
      role: "authenticated",
      app_metadata: { role: "store_owner" },
      user_metadata: { role: "store_owner", full_name: "Tienda Audit Planes" },
    },
  };
}

function buildDbStore(plan: "semilla" | "pro") {
  const id = `s_zz_audit_tp_${plan}`;
  return {
    id,
    slug: `zz-audit-tp-${plan}`,
    name: plan === "semilla" ? "Tienda Audit Semilla" : "Tienda Audit Pro",
    phone: "51987654321",
    country_code: "51",
    country_iso: "PE",
    plan,
    subscription_status: "active",
    plan_expires_at: plan === "pro" ? "2027-01-20T00:00:00.000Z" : null,
    active: true,
    is_published: true,
    onboarding_completed: true,
    created_at: "2026-10-01T12:00:00.000Z",
    views: 120,
    whatsapp_clicks: 18,
    model: "grid",
    brand_color: "#FF6B4A",
    niche: "general",
    owner_id: "00000000-0000-0000-0000-000000000091",
    categories: [{ id: `c_${plan}_1`, store_id: id, name: "General", sort_order: 1 }],
    products: [
      {
        id: `p_${plan}_1`,
        store_id: id,
        category_id: `c_${plan}_1`,
        name: "Producto Demo",
        price: 59,
        original_price: null,
        is_on_sale: false,
        image: "/images/demos/regalos-demo/prod_01_box_cumpleanos.webp",
        visible: true,
        is_sample: false,
        sort_order: 1,
      },
    ],
  };
}

async function setupAdminMocks(page: Page, plan: "semilla" | "pro") {
  const session = makeMockSession();
  const store = buildDbStore(plan);

  await page.addInitScript(
    ({ authSession }) => {
      window.localStorage.setItem("sb-example-auth-token", JSON.stringify(authSession));
    },
    { authSession: session },
  );

  await page.route("https://*.supabase.co/**", async (route: Route) => {
    const url = route.request().url();
    if (url.includes("/auth/v1/user")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(session.user) });
    }
    if (url.includes("/auth/v1/token")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(session) });
    }
    if (url.includes("/rest/v1/stores")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([store]) });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
}

test.describe("Textos de planes (landing + Mi Plan)", () => {
  test("Landing: menú Diseños (9), bloque beneficios sin S/ 19.90 y sección planes (375 y 1280 px)", async ({ page }) => {
    ensureCapturasDir();

    // 1280 px
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });

    await expect(page.locator("header nav a[href='#modelos']")).toHaveText("Diseños (9)");
    await expect(
      page.getByText("Todo lo que tu negocio necesita para vender y cumplir con la normativa del Perú, desde el plan gratuito."),
    ).toBeVisible();

    const preciosSection = page.locator("#precios");
    await preciosSection.scrollIntoViewIfNeeded();
    await expect(preciosSection.getByText("Con el sello «Hecho con Dizi»")).toBeVisible();
    await expect(preciosSection.getByText("Libro de Reclamaciones")).toBeVisible();
    await expect(preciosSection.getByText("Imágenes para estados e historias")).toBeVisible();
    await expect(preciosSection.getByText("Todo lo de Semilla, sin el sello")).toBeVisible();
    await expect(preciosSection.getByText("Link de pedido para tus clientes")).toBeVisible();
    await expect(preciosSection.getByText("Soporte prioritario por WhatsApp")).toBeVisible();

    await preciosSection.screenshot({ path: path.join(CAPTURAS_DIR, "landing-planes-1280px.png") });

    // 375 px
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator("#precios").scrollIntoViewIfNeeded();
    await page.locator("#precios").screenshot({ path: path.join(CAPTURAS_DIR, "landing-planes-375px.png") });
  });

  test("Mi Plan tienda Semilla (zz-audit-tp-semilla): 375 y 1280 px", async ({ page }) => {
    ensureCapturasDir();
    await setupAdminMocks(page, "semilla");

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/admin/plan", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Mi Plan" })).toBeVisible();
    await expect(page.getByText("Plan Activo", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Solicitar Emprendedor" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Solicitar Catálogo Pro" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Solicitar Ilimitado" })).toBeVisible();
    await expect(page.getByText("Por cada tienda que recomiendes y contrate un plan de pago,")).toBeVisible();
    await expect(page.getByText("de forma automática")).toHaveCount(0);

    await page.screenshot({ path: path.join(CAPTURAS_DIR, "mi-plan-semilla-1280px.png"), fullPage: true });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/plan", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Mi Plan" })).toBeVisible();
    await page.screenshot({ path: path.join(CAPTURAS_DIR, "mi-plan-semilla-375px.png"), fullPage: true });
  });

  test("Mi Plan tienda Pro (zz-audit-tp-pro): enlaces discretos en planes inferiores, 375 y 1280 px", async ({ page }) => {
    ensureCapturasDir();
    await setupAdminMocks(page, "pro");

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/admin/plan", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Mi Plan" })).toBeVisible();
    await expect(page.getByText("Plan Activo", { exact: true })).toBeVisible();

    const cambiarSemilla = page.getByRole("link", { name: "Cambiar a Semilla" });
    const cambiarEmprendedor = page.getByRole("link", { name: "Cambiar a Emprendedor" });
    const solicitarIlimitado = page.getByRole("link", { name: "Solicitar Ilimitado" });

    await expect(cambiarSemilla).toBeVisible();
    await expect(cambiarEmprendedor).toBeVisible();
    await expect(solicitarIlimitado).toBeVisible();
    await expect(cambiarSemilla).not.toHaveClass(/bg-primary/);
    await expect(cambiarEmprendedor).not.toHaveClass(/bg-primary/);
    await expect(solicitarIlimitado).toHaveClass(/bg-primary/);

    await page.screenshot({ path: path.join(CAPTURAS_DIR, "mi-plan-pro-1280px.png"), fullPage: true });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/plan", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Mi Plan" })).toBeVisible();
    await page.screenshot({ path: path.join(CAPTURAS_DIR, "mi-plan-pro-375px.png"), fullPage: true });
  });
});
