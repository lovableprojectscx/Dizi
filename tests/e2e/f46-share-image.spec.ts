/**
 * @file f46-share-image.spec.ts
 * @description Pruebas End-to-End en Playwright (proyecto movil-android - Pixel 7) para F46.
 * Valida:
 * - Demos reales: zapatillas-demo (Semilla con fotos Bunny CDN) y joyeria-demo (Pro con fotos reales).
 * - Espera rigurosa del canvas terminado (sin overlay "Preparando diseño...", botón de acción activo).
 * - Verificación de píxeles no vacíos en el canvas y toDataURL válido.
 * - Alternancia entre formatos (Historia 9:16 vs Cuadrada 1:1) y 4 estilos (Etiqueta, Editorial, Marco, Oferta).
 * - Exportación de PNGs finales en capturas-f46/e2e-final/ para 2 estilos y los 2 tamaños.
 * - Capturas de pantalla completas en capturas-f46/.
 * - Descarga directa (Plan B) cuando Web Share no está disponible en emulador.
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

// ── Demo 1: zapatillas-demo (Semilla con Bunny CDN) ──
const dbStoreZapatillas = {
  id: "s_zapatillasdemo",
  owner_id: "user-audit-f46",
  name: "Kickz Premium",
  slug: "zapatillas-demo",
  phone: "51921585977",
  country_code: "51",
  country_iso: "PE",
  model: "minimalista",
  plan: "semilla",
  brand_color: "#0F172A",
  show_dizi_branding: true,
  active: true,
  is_published: true,
  onboarding_completed: true,
  logo: "https://dizifotos.b-cdn.net/s_zapatillasdemo/logo.webp",
  banner_image: "https://dizifotos.b-cdn.net/s_zapatillasdemo/banners/banner_slider_1.webp",
  created_at: "2026-11-08T00:00:00Z",
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

const localStoreZapatillas = {
  id: "s_zapatillasdemo",
  ownerId: "user-audit-f46",
  name: "Kickz Premium",
  slug: "zapatillas-demo",
  phone: "51921585977",
  countryCode: "51",
  countryIso: "PE",
  model: "minimalista",
  plan: "semilla",
  brandColor: "#0F172A",
  showDiziBranding: true,
  active: true,
  isPublished: true,
  onboardingCompleted: true,
  logo: "https://dizifotos.b-cdn.net/s_zapatillasdemo/logo.webp",
  bannerImage: "https://dizifotos.b-cdn.net/s_zapatillasdemo/banners/banner_slider_1.webp",
  createdAt: "2026-11-08T00:00:00Z",
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

// ── Demo 2: joyeria-demo (Pro) ──
const dbStoreJoyeria = {
  id: "s_joyeriademo",
  owner_id: "user-audit-f46",
  name: "Áurea Joyas",
  slug: "joyeria-demo",
  phone: "51921585977",
  country_code: "51",
  country_iso: "PE",
  model: "minimalista",
  plan: "pro",
  brand_color: "#D97706",
  show_dizi_branding: false,
  active: true,
  is_published: true,
  onboarding_completed: true,
  logo: "https://dizi.idenza.site/images/demos/joyeria-demo/logo.webp",
  banner_image: "https://dizi.idenza.site/images/demos/joyeria-demo/banner_main.webp",
  created_at: "2026-11-08T00:00:00Z",
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
    {
      id: "prod_joy_02",
      store_id: "s_joyeriademo",
      name: "Collar Cadena Eslabones Finos Plata 925",
      price: 189,
      original_price: null,
      is_on_sale: false,
      category_id: "cat-joyas",
      image: "https://dizi.idenza.site/images/demos/joyeria-demo/prod_02_collar_cadena.webp",
      visible: true,
      sort_order: 1,
    },
  ],
};

const localStoreJoyeria = {
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
  createdAt: "2026-11-08T00:00:00Z",
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
    {
      id: "prod_joy_02",
      name: "Collar Cadena Eslabones Finos Plata 925",
      price: 189,
      originalPrice: null,
      isOnSale: false,
      categoryId: "cat-joyas",
      image: "https://dizi.idenza.site/images/demos/joyeria-demo/prod_02_collar_cadena.webp",
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

/**
 * Espera a que el canvas termine de dibujar por completo:
 * 1. Desaparece el overlay "Preparando diseño..."
 * 2. El botón de acción ("Descargar imagen" / "Compartir imagen") está activo
 * 3. El canvas contiene píxeles con datos (no está en blanco ni transparente)
 */
async function waitForCanvasReady(page: Page) {
  // Esperar que desaparezca el cargador
  await expect(page.locator("text=Preparando diseño...")).not.toBeVisible({ timeout: 20_000 });

  // Esperar botón de acción activo (habilitado)
  const actionBtn = page.locator("button:has-text('Descargar imagen'), button:has-text('Compartir imagen')");
  await expect(actionBtn).toBeEnabled({ timeout: 10_000 });

  // Comprobar que el canvas tenga dimensiones y contenido dibujado
  const canvasStats = await page.evaluate(() => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const { width, height } = canvas;
    const imgData = ctx.getImageData(0, 0, width, height);
    let nonZero = 0;
    // Muestreo rápido de píxeles
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
  test.describe("Demo 1: Kickz Premium (zapatillas-demo con fotos Bunny CDN)", () => {
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
        { store: localStoreZapatillas, session: sessionPayload }
      );

      // Mock de Supabase auth y rest
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
            body: JSON.stringify([dbStoreZapatillas]),
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

    test("E1 & RF-46.1: Abre el editor, espera canvas terminado y guarda PNGs en e2e-final/", async ({
      page,
    }) => {
      await page.goto("/admin/productos");
      await page.waitForLoadState("networkidle");

      // Clic en 'Crear imagen' del producto en oferta (Vans Old Skool)
      const shareBtn = page.locator("button[title*='Crear imagen']:visible").first();
      await expect(shareBtn).toBeVisible({ timeout: 10_000 });
      await shareBtn.click();

      // Diálogo abierto
      await expect(page.locator("text=Crear imagen para estados")).toBeVisible();

      // Esperar canvas completamente renderizado (con foto Bunny cargada)
      const statsHistoria = await waitForCanvasReady(page);
      expect(statsHistoria.width).toBe(1080);
      expect(statsHistoria.height).toBe(1920);

      // Captura completa del diálogo activo (sin cargador, botón habilitado)
      await page.screenshot({
        path: path.join(TARGET_DIR, "f46-e2e-01-dialogo-abierto.png"),
      });

      // Alternar a Cuadrada (1:1) con estilo Etiqueta
      const cuadradaBtn = page.locator("button:has-text('Cuadrada')");
      await cuadradaBtn.click();
      const statsCuadrada = await waitForCanvasReady(page);
      expect(statsCuadrada.width).toBe(1080);
      expect(statsCuadrada.height).toBe(1080);

      // Guardar PNG final exportado desde el canvas
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

      // Guardar PNG final de Oferta en Historia
      const base64Oferta = statsOferta.dataUrl.replace(/^data:image\/png;base64,/, "");
      fs.writeFileSync(
        path.join(E2E_FINAL_DIR, "e2e-final-zapatillas-oferta-historia-1080x1920.png"),
        Buffer.from(base64Oferta, "base64")
      );

      await page.screenshot({
        path: path.join(TARGET_DIR, "f46-e2e-03-estilo-oferta-seleccionado.png"),
      });
    });

    test("E6: Plan B de descarga directa genera archivo PNG real", async ({ page }) => {
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

  test.describe("Demo 2: Áurea Joyas (joyeria-demo - Pro con fotos reales)", () => {
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
        { store: localStoreJoyeria, session: sessionPayload }
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
            body: JSON.stringify([dbStoreJoyeria]),
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

    test("Exporta estilos Editorial y Marco de color en Historia y Cuadrada", async ({ page }) => {
      await page.goto("/admin/productos");
      await page.waitForLoadState("networkidle");

      // Clic en 'Crear imagen' del anillo de joyería
      const shareBtn = page.locator("button[title*='Crear imagen']:visible").first();
      await shareBtn.click();

      // Probar estilo Editorial en Historia (9:16)
      const editorialBtn = page.locator("button:has-text('Editorial')");
      await editorialBtn.click();

      const statsEditorial = await waitForCanvasReady(page);
      expect(statsEditorial.width).toBe(1080);
      expect(statsEditorial.height).toBe(1920);

      // Guardar PNG de Editorial en Historia
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

      // Guardar PNG de Marco de color en Cuadrada
      const base64Marco = statsMarco.dataUrl.replace(/^data:image\/png;base64,/, "");
      fs.writeFileSync(
        path.join(E2E_FINAL_DIR, "e2e-final-joyeria-marcolor-cuadrada-1080x1080.png"),
        Buffer.from(base64Marco, "base64")
      );
    });
  });
});
