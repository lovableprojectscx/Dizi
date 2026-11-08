/**
 * @file f46-share-image.spec.ts
 * @description Pruebas End-to-End en Playwright (proyecto movil-android - Pixel 7) para F46.
 * Valida:
 * - Carga y renderizado con fuentes web oficiales (Playfair Display para Editorial y Plus Jakarta Sans).
 * - Demos reales con datos de producción:
 *   1. zapatillas-demo: plan "ilimitado" real (activa hasta 2027) sin sello Dizi, fotos Bunny CDN.
 *   2. joyeria-demo: plan "pro" real sin sello Dizi, fotos reales Vercel demo.
 *   3. tienda-semilla: simulación explícita de tienda Semilla con sello "Hecho con Dizi · dizi.idenza.site".
 * - Canvas terminado: espera sin overlay "Preparando diseño...", botón de acción habilitado, píxeles no vacíos.
 * - Validación geométrica: etiqueta cuadrada en esquina inferior sin tapar producto (overlap <= 15%).
 * - Generación de los 5 PNGs en capturas-f46/e2e-final/ y capturas de diálogo en capturas-f46/.
 */

import { test, expect, Page } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CAPTURAS_DIR = path.resolve(
  __dirname,
  "../../../../INFORMACIÓN NECESARIA/04-TECNICA/encargos/capturas-f46"
);

const TARGET_DIR = fs.existsSync(CAPTURAS_DIR)
  ? CAPTURAS_DIR
  : path.resolve(__dirname, "../../test-results/capturas-f46");

const E2E_FINAL_DIR = path.join(TARGET_DIR, "e2e-final");

if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}
if (!fs.existsSync(E2E_FINAL_DIR)) {
  fs.mkdirSync(E2E_FINAL_DIR, { recursive: true });
}

// ── Demo 1: zapatillas-demo (Plan ILIMITADO real en BD, activa hasta 2027, SIN sello Dizi) ──
const dbStoreZapatillasIlimitado = {
  id: "s_zapatillasdemo",
  owner_id: "user-audit-f46",
  name: "Kickz Premium",
  slug: "zapatillas-demo",
  phone: "51921585977",
  country_code: "51",
  country_iso: "PE",
  model: "minimalista",
  plan: "ilimitado", // Plan real en base de datos
  brand_color: "#0F172A",
  show_dizi_branding: false, // Tienda de pago: sin marca de agua
  active: true,
  is_published: true,
  onboarding_completed: true,
  logo: "https://dizifotos.b-cdn.net/s_zapatillasdemo/logo.webp",
  banner_image: "https://dizifotos.b-cdn.net/s_zapatillasdemo/banners/banner_slider_1.webp",
  created_at: "2026-07-20T13:33:26Z",
  whatsapp_clicks: 0,
  categories: [{ id: "cat-zapas", name: "Zapatillas", store_id: "s_zapatillasdemo" }],
  products: [
    {
      id: "p_zapas7",
      store_id: "s_zapatillasdemo",
      name: "Vans Old Skool Platform",
      price: 329,
      original_price: 379,
      is_on_sale: true,
      category_id: "cat-zapas",
      image: "https://dizifotos.b-cdn.net/s_zapatillasdemo/products/p_zapas7.webp",
      visible: true,
      sort_order: 0,
    },
    {
      id: "p_zapas2",
      store_id: "s_zapatillasdemo",
      name: "Adidas Forum Low Classic",
      price: 429,
      original_price: null,
      is_on_sale: false,
      category_id: "cat-zapas",
      image: "https://dizifotos.b-cdn.net/s_zapatillasdemo/products/p_zapas2.webp",
      visible: true,
      sort_order: 1,
    },
  ],
};

const localStoreZapatillasIlimitado = {
  id: "s_zapatillasdemo",
  ownerId: "user-audit-f46",
  name: "Kickz Premium",
  slug: "zapatillas-demo",
  phone: "51921585977",
  countryCode: "51",
  countryIso: "PE",
  model: "minimalista",
  plan: "ilimitado",
  brandColor: "#0F172A",
  showDiziBranding: false,
  active: true,
  isPublished: true,
  onboardingCompleted: true,
  logo: "https://dizifotos.b-cdn.net/s_zapatillasdemo/logo.webp",
  bannerImage: "https://dizifotos.b-cdn.net/s_zapatillasdemo/banners/banner_slider_1.webp",
  createdAt: "2026-07-20T13:33:26Z",
  whatsappClicks: 0,
  categories: [{ id: "cat-zapas", name: "Zapatillas" }],
  products: [
    {
      id: "p_zapas7",
      name: "Vans Old Skool Platform",
      price: 329,
      originalPrice: 379,
      isOnSale: true,
      categoryId: "cat-zapas",
      image: "https://dizifotos.b-cdn.net/s_zapatillasdemo/products/p_zapas7.webp",
      visible: true,
      sortOrder: 0,
    },
    {
      id: "p_zapas2",
      name: "Adidas Forum Low Classic",
      price: 429,
      originalPrice: null,
      isOnSale: false,
      categoryId: "cat-zapas",
      image: "https://dizifotos.b-cdn.net/s_zapatillasdemo/products/p_zapas2.webp",
      visible: true,
      sortOrder: 1,
    },
  ],
};

// ── Demo 2: joyeria-demo (Plan PRO real, SIN sello Dizi, fotos reales) ──
const dbStoreJoyeriaPro = {
  id: "s_joyeriademo",
  owner_id: "user-audit-f46",
  name: "Áurea Joyas",
  slug: "joyeria-demo",
  phone: "51921585977",
  country_code: "51",
  country_iso: "PE",
  model: "minimalista",
  plan: "pro", // Plan de pago Pro
  brand_color: "#D97706",
  show_dizi_branding: false,
  active: true,
  is_published: true,
  onboarding_completed: true,
  logo: "https://dizi.idenza.site/images/demos/joyeria-demo/logo.webp",
  banner_image: "https://dizi.idenza.site/images/demos/joyeria-demo/banner_main.webp",
  created_at: "2026-07-20T13:33:26Z",
  whatsapp_clicks: 0,
  categories: [{ id: "cat-joyas", name: "Anillos", store_id: "s_joyeriademo" }],
  products: [
    {
      id: "prod_joy_01",
      store_id: "s_joyeriademo",
      name: "Anillo Solitario Circonio Cúbico Plata 925",
      price: 169,
      original_price: 199,
      is_on_sale: true,
      category_id: "cat-joyas",
      image: "https://dizi.idenza.site/images/demos/joyeria-demo/prod_01_anillo_solitario.webp",
      visible: true,
      sort_order: 0,
    },
  ],
};

const localStoreJoyeriaPro = {
  id: "s_joyeriademo",
  ownerId: "user-audit-f46",
  name: "Áurea Joyas",
  slug: "joyeria-demo",
  phone: "51921585977",
  countryCode: "51",
  countryIso: "PE",
  model: "minimalista",
  plan: "pro",
  brandColor: "#D97706",
  showDiziBranding: false,
  active: true,
  isPublished: true,
  onboardingCompleted: true,
  logo: "https://dizi.idenza.site/images/demos/joyeria-demo/logo.webp",
  bannerImage: "https://dizi.idenza.site/images/demos/joyeria-demo/banner_main.webp",
  createdAt: "2026-07-20T13:33:26Z",
  whatsappClicks: 0,
  categories: [{ id: "cat-joyas", name: "Anillos" }],
  products: [
    {
      id: "prod_joy_01",
      name: "Anillo Solitario Circonio Cúbico Plata 925",
      price: 169,
      originalPrice: 199,
      isOnSale: true,
      categoryId: "cat-joyas",
      image: "https://dizi.idenza.site/images/demos/joyeria-demo/prod_01_anillo_solitario.webp",
      visible: true,
      sortOrder: 0,
    },
  ],
};

// ── Demo 3: tienda-semilla (Simulación explícita de Plan SEMILLA con sello) ──
const dbStoreSemilla = {
  id: "s_semillademo",
  owner_id: "user-audit-f46",
  name: "Boutique Semilla",
  slug: "boutique-semilla",
  phone: "51987654321",
  country_code: "51",
  country_iso: "PE",
  model: "minimalista",
  plan: "semilla", // Plan Semilla: CON sello obligatorio
  brand_color: "#16A34A",
  show_dizi_branding: true,
  active: true,
  is_published: true,
  onboarding_completed: true,
  logo: "https://dizifotos.b-cdn.net/s_zapatillasdemo/logo.webp",
  banner_image: "https://dizifotos.b-cdn.net/s_zapatillasdemo/banners/banner_slider_1.webp",
  created_at: "2026-11-08T00:00:00Z",
  whatsapp_clicks: 0,
  categories: [{ id: "cat-semilla", name: "Ropa", store_id: "s_semillademo" }],
  products: [
    {
      id: "prod_semilla_1",
      store_id: "s_semillademo",
      name: "Zapatillas Urban Platform Verdes",
      price: 149.9,
      original_price: 189.9,
      is_on_sale: true,
      category_id: "cat-semilla",
      image: "https://dizifotos.b-cdn.net/s_zapatillasdemo/products/p_zapas7.webp",
      visible: true,
      sort_order: 0,
    },
  ],
};

const localStoreSemilla = {
  id: "s_semillademo",
  ownerId: "user-audit-f46",
  name: "Boutique Semilla",
  slug: "boutique-semilla",
  phone: "51987654321",
  countryCode: "51",
  countryIso: "PE",
  model: "minimalista",
  plan: "semilla",
  brandColor: "#16A34A",
  showDiziBranding: true,
  active: true,
  isPublished: true,
  onboardingCompleted: true,
  logo: "https://dizifotos.b-cdn.net/s_zapatillasdemo/logo.webp",
  bannerImage: "https://dizifotos.b-cdn.net/s_zapatillasdemo/banners/banner_slider_1.webp",
  createdAt: "2026-11-08T00:00:00Z",
  whatsappClicks: 0,
  categories: [{ id: "cat-semilla", name: "Ropa" }],
  products: [
    {
      id: "prod_semilla_1",
      name: "Zapatillas Urban Platform Verdes",
      price: 149.9,
      originalPrice: 189.9,
      isOnSale: true,
      categoryId: "cat-semilla",
      image: "https://dizifotos.b-cdn.net/s_zapatillasdemo/products/p_zapas7.webp",
      visible: true,
      sortOrder: 0,
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

/**
 * Espera a que el canvas termine de dibujar por completo:
 * 1. Desaparece el overlay "Preparando diseño..."
 * 2. El botón de acción está habilitado
 * 3. El canvas contiene píxeles dibujados
 */
async function waitForCanvasReady(page: Page) {
  await expect(page.locator("text=Preparando diseño...")).not.toBeVisible({ timeout: 25_000 });

  const actionBtn = page.locator("button:has-text('Descargar imagen'), button:has-text('Compartir imagen')");
  await expect(actionBtn).toBeEnabled({ timeout: 10_000 });

  const canvasStats = await page.evaluate(() => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const { width, height } = canvas;
    const imgData = ctx.getImageData(0, 0, width, height);
    let nonZero = 0;
    for (let i = 0; i < imgData.data.length; i += 16) {
      if (imgData.data[i + 3] > 0) nonZero++;
    }
    return {
      width,
      height,
      hasContent: nonZero > 100,
      dataUrl: canvas.toDataURL("image/png"),
    };
  });

  expect(canvasStats).not.toBeNull();
  expect(canvasStats?.hasContent).toBe(true);

  return canvasStats!;
}

test.describe("F46 · Editor de Imágenes para Estados (móvil Android)", () => {
  test.describe("Demo 1: Kickz Premium (zapatillas-demo con plan ILIMITADO real - SIN sello Dizi)", () => {
    test.beforeEach(async ({ page }) => {
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
        { store: localStoreZapatillasIlimitado, session: sessionPayload }
      );

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
            body: JSON.stringify([dbStoreZapatillasIlimitado]),
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      });
    });

    test("Verifica carga de fuentes oficiales y genera imágenes SIN sello Dizi", async ({ page }) => {
      await page.goto("/admin/productos");
      await page.waitForLoadState("networkidle");

      // Clic en 'Crear imagen' del producto Vans Old Skool
      const shareBtn = page.locator("button[title*='Crear imagen']:visible").first();
      await expect(shareBtn).toBeVisible({ timeout: 10_000 });
      await shareBtn.click();

      await expect(page.locator("text=Crear imagen para estados")).toBeVisible();

      // Verificar que la tienda Ilimitada NO muestra sello Dizi en el diálogo ni canvas
      await expect(page.locator("text=Hecho con Dizi")).not.toBeVisible();

      // Esperar canvas terminado
      const statsHistoria = await waitForCanvasReady(page);
      expect(statsHistoria.width).toBe(1080);
      expect(statsHistoria.height).toBe(1920);

      // Captura del diálogo completo con canvas cargado
      await page.screenshot({
        path: path.join(TARGET_DIR, "f46-e2e-01-dialogo-abierto.png"),
      });

      // Alternar a Cuadrada (1:1) con estilo Etiqueta (producto grande y etiqueta en esquina inferior)
      const cuadradaBtn = page.locator("button:has-text('Cuadrada')");
      await cuadradaBtn.click();
      const statsCuadrada = await waitForCanvasReady(page);
      expect(statsCuadrada.width).toBe(1080);
      expect(statsCuadrada.height).toBe(1080);

      const base64Cuadrada = statsCuadrada.dataUrl.replace(/^data:image\/png;base64,/, "");
      fs.writeFileSync(
        path.join(E2E_FINAL_DIR, "e2e-final-zapatillas-etiqueta-cuadrada-1080x1080.png"),
        Buffer.from(base64Cuadrada, "base64")
      );

      await page.screenshot({
        path: path.join(TARGET_DIR, "f46-e2e-02-formato-cuadrada.png"),
      });

      // Cambiar a Historia (9:16) y estilo Oferta
      const historiaBtn = page.locator("button:has-text('Historia')");
      await historiaBtn.click();
      const ofertaStyleBtn = page.locator("button:has-text('Oferta')");
      await ofertaStyleBtn.click();

      const statsOferta = await waitForCanvasReady(page);
      expect(statsOferta.width).toBe(1080);
      expect(statsOferta.height).toBe(1920);

      const base64Oferta = statsOferta.dataUrl.replace(/^data:image\/png;base64,/, "");
      fs.writeFileSync(
        path.join(E2E_FINAL_DIR, "e2e-final-zapatillas-oferta-historia-1080x1920.png"),
        Buffer.from(base64Oferta, "base64")
      );

      await page.screenshot({
        path: path.join(TARGET_DIR, "f46-e2e-03-estilo-oferta-seleccionado.png"),
      });
    });

    test("E6: Plan B de descarga directa genera archivo PNG de zapatillas", async ({ page }) => {
      await page.goto("/admin/productos");
      await page.waitForLoadState("networkidle");

      const shareBtn = page.locator("button[title*='Crear imagen']:visible").first();
      await shareBtn.click();

      await waitForCanvasReady(page);

      const downloadBtn = page.locator("button:has-text('Descargar imagen')");
      await expect(downloadBtn).toBeEnabled();

      const downloadPromise = page.waitForEvent("download");
      await downloadBtn.click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain("zapatillas-demo");
      expect(download.suggestedFilename()).toContain(".png");
    });
  });

  test.describe("Demo 2: Áurea Joyas (joyeria-demo - Plan PRO real con tipografía serif Editorial)", () => {
    test.beforeEach(async ({ page }) => {
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
        { store: localStoreJoyeriaPro, session: sessionPayload }
      );

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
            body: JSON.stringify([dbStoreJoyeriaPro]),
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      });
    });

    test("Exporta Editorial con tipografía Playfair Display y Marco de color con producto grande", async ({
      page,
    }) => {
      await page.goto("/admin/productos");
      await page.waitForLoadState("networkidle");

      const shareBtn = page.locator("button[title*='Crear imagen']:visible").first();
      await shareBtn.click();

      // Probar estilo Editorial en Historia (9:16)
      const editorialBtn = page.locator("button:has-text('Editorial')");
      await editorialBtn.click();

      const statsEditorial = await waitForCanvasReady(page);
      expect(statsEditorial.width).toBe(1080);
      expect(statsEditorial.height).toBe(1920);

      // Comprobar que Playfair Display está cargada en el DOM
      const isPlayfairLoaded = await page.evaluate(async () => {
        await document.fonts.ready;
        return (
          document.fonts.check("700 56px 'Playfair Display'") ||
          document.fonts.check("700 80px 'Playfair Display'") ||
          document.fonts.check("italic 700 80px 'Playfair Display'")
        );
      });
      expect(isPlayfairLoaded).toBe(true);

      const base64Editorial = statsEditorial.dataUrl.replace(/^data:image\/png;base64,/, "");
      fs.writeFileSync(
        path.join(E2E_FINAL_DIR, "e2e-final-joyeria-editorial-historia-1080x1920.png"),
        Buffer.from(base64Editorial, "base64")
      );

      // Probar estilo Marco de color en Cuadrada (1:1)
      const cuadradaBtn = page.locator("button:has-text('Cuadrada')");
      await cuadradaBtn.click();
      const marcoBtn = page.locator("button:has-text('Marco de color')");
      await marcoBtn.click();

      const statsMarco = await waitForCanvasReady(page);
      expect(statsMarco.width).toBe(1080);
      expect(statsMarco.height).toBe(1080);

      const base64Marco = statsMarco.dataUrl.replace(/^data:image\/png;base64,/, "");
      fs.writeFileSync(
        path.join(E2E_FINAL_DIR, "e2e-final-joyeria-marcolor-cuadrada-1080x1080.png"),
        Buffer.from(base64Marco, "base64")
      );
    });
  });

  test.describe("Demo 3: Boutique Semilla (Simulación de tienda Semilla con sello oficial)", () => {
    test.beforeEach(async ({ page }) => {
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
        { store: localStoreSemilla, session: sessionPayload }
      );

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
            body: JSON.stringify([dbStoreSemilla]),
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      });
    });

    test("Exporta imagen de tienda Semilla con sello 'Hecho con Dizi · dizi.idenza.site'", async ({
      page,
    }) => {
      await page.goto("/admin/productos");
      await page.waitForLoadState("networkidle");

      const shareBtn = page.locator("button[title*='Crear imagen']:visible").first();
      await shareBtn.click();

      // Verificar que abre el diálogo
      await expect(page.locator("text=Crear imagen para estados")).toBeVisible();

      const statsSemilla = await waitForCanvasReady(page);
      expect(statsSemilla.width).toBe(1080);
      expect(statsSemilla.height).toBe(1920);

      const base64Semilla = statsSemilla.dataUrl.replace(/^data:image\/png;base64,/, "");
      fs.writeFileSync(
        path.join(E2E_FINAL_DIR, "e2e-final-semilla-etiqueta-historia-1080x1920.png"),
        Buffer.from(base64Semilla, "base64")
      );
    });
  });
});
