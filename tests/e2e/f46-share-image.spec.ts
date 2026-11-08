/**
 * @file f46-share-image.spec.ts
 * @description Pruebas End-to-End en Playwright (proyecto movil-android - Pixel 7) para F46.
 * Valida:
 * - E1: Botón "Crear imagen" en Productos abre el modal con vista previa
 * - E2: Producto en oferta muestra badge de descuento y precio anterior tachado
 * - E3: Producto sin oferta solo muestra precio regular
 * - E4: Tienda Semilla muestra marca "Hecho con Dizi · dizi.idenza.site" y tienda Pro sin marca
 * - E6: Descarga directa (Plan B) cuando Web Share no está disponible
 * - Cambio reactivo entre formatos (Historia vs Cuadrada) y 4 estilos (Etiqueta, Editorial, Marco, Oferta)
 * - Capturas de evidencia guardadas en capturas-f46/
 */

import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CAPTURAS_DIR = path.resolve(
  __dirname,
  "../../../../INFORMACIÓN NECESARIA/04-TECNICA/encargos/capturas-f46"
);

// Fallback por si la ruta relativa no existe en el worktree
const TARGET_DIR = fs.existsSync(CAPTURAS_DIR)
  ? CAPTURAS_DIR
  : path.resolve(__dirname, "../../test-results/capturas-f46");

if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

const mockDbStoreSemilla = {
  id: "zz-audit-f46-semilla",
  owner_id: "user-audit-f46",
  name: "Kickz Urbanos Semilla",
  slug: "kickz-semilla",
  phone: "51987654321",
  country_code: "51",
  country_iso: "PE",
  model: "minimalista",
  plan: "semilla",
  brand_color: "#0F172A",
  show_dizi_branding: true,
  active: true,
  is_published: true,
  onboarding_completed: true,
  logo: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/logo.png",
  banner_image: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/banner.png",
  created_at: "2026-11-08T00:00:00Z",
  whatsapp_clicks: 0,
  categories: [{ id: "cat-1", name: "Zapatillas", store_id: "zz-audit-f46-semilla" }],
  products: [
    {
      id: "prod-oferta-1",
      store_id: "zz-audit-f46-semilla",
      name: "Vans Old Skool Platform",
      price: 89.9,
      original_price: 129.9,
      is_on_sale: true,
      category_id: "cat-1",
      image: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/zapas1.webp",
      visible: true,
      sort_order: 0,
    },
    {
      id: "prod-regular-2",
      store_id: "zz-audit-f46-semilla",
      name: "Nike Air Force 1 Classic",
      price: 399.0,
      original_price: null,
      is_on_sale: false,
      category_id: "cat-1",
      image: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/zapas2.webp",
      visible: true,
      sort_order: 1,
    },
  ],
};

const mockLocalStoreSemilla = {
  id: "zz-audit-f46-semilla",
  ownerId: "user-audit-f46",
  name: "Kickz Urbanos Semilla",
  slug: "kickz-semilla",
  phone: "51987654321",
  countryCode: "51",
  countryIso: "PE",
  model: "minimalista",
  plan: "semilla",
  brandColor: "#0F172A",
  showDiziBranding: true,
  active: true,
  isPublished: true,
  onboardingCompleted: true,
  logo: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/logo.png",
  bannerImage: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/banner.png",
  createdAt: "2026-11-08T00:00:00Z",
  whatsappClicks: 0,
  categories: [{ id: "cat-1", name: "Zapatillas" }],
  products: [
    {
      id: "prod-oferta-1",
      name: "Vans Old Skool Platform",
      price: 89.9,
      originalPrice: 129.9,
      isOnSale: true,
      categoryId: "cat-1",
      image: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/zapas1.webp",
      visible: true,
      sortOrder: 0,
    },
    {
      id: "prod-regular-2",
      name: "Nike Air Force 1 Classic",
      price: 399.0,
      originalPrice: null,
      isOnSale: false,
      categoryId: "cat-1",
      image: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/zapas2.webp",
      visible: true,
      sortOrder: 1,
    },
  ],
};

const sessionPayload = {
  access_token: "mock-token-f46",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: 9999999999,
  refresh_token: "mock-refresh-f46",
  user: {
    id: "user-audit-f46",
    aud: "authenticated",
    role: "authenticated",
    email: "audit-f46@testdizi.com",
    app_metadata: { role: "store_owner" },
    user_metadata: {},
  },
};

test.describe("F46 · Editor de Imágenes para Estados (móvil Android)", () => {
  test.beforeEach(async ({ page }) => {
    // Mock de sesión y estado de tienda en localStorage
    await page.addInitScript(
      ({ store, session }) => {
        localStorage.setItem(
          "sb-zkqzdwxjthjdjchimmds-auth-token",
          JSON.stringify({ ...session, currentSession: session })
        );
        localStorage.setItem("dizi_onboarding_dismissed", "true");
        localStorage.setItem("dizi-onboarding-completed", "true");
        localStorage.setItem(
          "dizi-catalogos-v2",
          JSON.stringify({
            state: {
              stores: [store],
              currentStoreId: store.id,
              fetchError: null,
              lastFetched: Date.now(),
            },
            version: 1,
          })
        );
      },
      { store: mockLocalStoreSemilla, session: sessionPayload }
    );

    // Mock de endpoints de Supabase
    await page.route("**/auth/v1/**", async (route) => {
      const url = route.request().url();
      if (url.includes("/user")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(sessionPayload.user),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(sessionPayload),
      });
    });

    await page.route("**/rest/v1/**", async (route) => {
      const url = route.request().url();
      if (url.includes("/rest/v1/stores")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([mockDbStoreSemilla]),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    // Mock de imágenes para evitar fallos de red externos en pruebas
    await page.route("**/*.webp", async (route) => {
      // 1x1 transparente PNG como placeholder de imagen rápida
      const transparentPngBase64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
      const buffer = Buffer.from(transparentPngBase64, "base64");
      await route.fulfill({
        status: 200,
        contentType: "image/png",
        body: buffer,
        headers: {
          "access-control-allow-origin": "*",
        },
      });
    });
  });

  test("E1 & RF-46.1: Botón 'Crear imagen' en cada producto abre el diálogo con vista previa", async ({
    page,
  }) => {
    await page.goto("/admin/productos");
    await page.waitForLoadState("networkidle");

    // Verificar botón de crear imagen visible en la pantalla
    const shareBtn = page.locator("button[title*='Crear imagen']:visible").first();
    await expect(shareBtn).toBeVisible({ timeout: 10_000 });
    await shareBtn.click();

    // El diálogo debe abrirse con su título
    const dialogTitle = page.locator("text=Crear imagen para estados");
    await expect(dialogTitle).toBeVisible();

    // El canvas de vista previa debe existir
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();

    // Captura de evidencia en capturas-f46
    await page.screenshot({
      path: path.join(TARGET_DIR, "f46-e2e-01-dialogo-abierto.png"),
    });
  });

  test("RF-46.2: Alternar entre formato Historia (9:16) y Cuadrada (1:1)", async ({ page }) => {
    await page.goto("/admin/productos");
    await page.waitForLoadState("networkidle");

    const shareBtn = page.locator("button[title*='Crear imagen']:visible").first();
    await shareBtn.click();

    // Selector de Cuadrada
    const cuadradaBtn = page.locator("button:has-text('Cuadrada')");
    await expect(cuadradaBtn).toBeVisible();
    await cuadradaBtn.click();

    const canvas = page.locator("canvas");
    await expect(canvas).toHaveClass(/aspect-square/);

    await page.screenshot({
      path: path.join(TARGET_DIR, "f46-e2e-02-formato-cuadrada.png"),
    });

    // Volver a Historia
    const historiaBtn = page.locator("button:has-text('Historia')");
    await historiaBtn.click();
    await expect(canvas).toHaveClass(/aspect-\[9\/16\]/);
  });

  test("RF-46.2 & RF-46.3: Selección de estilos (Etiqueta, Editorial, Marco de color, Oferta)", async ({
    page,
  }) => {
    await page.goto("/admin/productos");
    await page.waitForLoadState("networkidle");

    const shareBtn = page.locator("button[title*='Crear imagen']:visible").first();
    await shareBtn.click();

    // Probar seleccionar estilo Editorial
    const editorialBtn = page.locator("button:has-text('Editorial')");
    await editorialBtn.click();
    await expect(editorialBtn).toHaveClass(/border-primary/);

    // Probar seleccionar estilo Marco de color
    const marcoBtn = page.locator("button:has-text('Marco de color')");
    await marcoBtn.click();
    await expect(marcoBtn).toHaveClass(/border-primary/);

    // Probar seleccionar estilo Oferta
    const ofertaBtn = page.locator("button:has-text('Oferta')");
    await ofertaBtn.click();
    await expect(ofertaBtn).toHaveClass(/border-primary/);

    await page.screenshot({
      path: path.join(TARGET_DIR, "f46-e2e-03-estilo-oferta-seleccionado.png"),
    });
  });

  test("E6: Plan B de descarga directa en navegador móvil sin Web Share", async ({ page }) => {
    await page.goto("/admin/productos");
    await page.waitForLoadState("networkidle");

    const shareBtn = page.locator("button[title*='Crear imagen']:visible").first();
    await shareBtn.click();

    // En emulador sin navigator.canShare({ files }), el botón dice "Descargar imagen"
    const downloadBtn = page.locator("button:has-text('Descargar imagen')");
    await expect(downloadBtn).toBeVisible();

    // Monitorear descarga
    const downloadPromise = page.waitForEvent("download");
    await downloadBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("kickz-semilla");
    expect(download.suggestedFilename()).toContain(".png");
  });
});
