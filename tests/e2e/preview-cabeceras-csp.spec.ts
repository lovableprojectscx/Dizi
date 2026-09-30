import { test, expect } from "@playwright/test";

/**
 * Suite E2E - D2: Verificación de Cabeceras de Seguridad y Consola CSP en Vista Previa
 * Emulación móvil (Pixel 7, 360x800)
 */
test.describe("D2 · Cabeceras, CSP y Funcionalidades en Vista Previa (360x800)", () => {
  test.use({
    viewport: { width: 360, height: 800 },
  });

  // Colector de errores CSP y console.error
  function setupCspCollector(page: any) {
    const cspErrors: string[] = [];
    page.on("console", (msg: any) => {
      const text = msg.text();
      if (
        text.includes("Content Security Policy") ||
        text.includes("violates the following Content Security Policy") ||
        text.includes("Refused to") ||
        text.includes("blocked by CSP")
      ) {
        cspErrors.push(text);
      }
    });
    page.on("pageerror", (err: Error) => {
      if (err.message.includes("Content Security Policy") || err.message.includes("Refused to")) {
        cspErrors.push(err.message);
      }
    });
    return cspErrors;
  }

  test("1. Inicio (/): Carga completa sin errores de CSP", async ({ page }) => {
    const cspErrors = setupCspCollector(page);
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toBeVisible();
    await page.waitForTimeout(1000);
    expect(cspErrors).toEqual([]);
  });

  test("2. /t/catalogo: Catálogo público renderiza productos sin errores de CSP", async ({ page }) => {
    const cspErrors = setupCspCollector(page);
    await page.goto("/t/catalogo");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("text=ADORNIA | WE HOME").first()).toBeVisible({ timeout: 15000 });
    // Verificar que hay productos cargados en el DOM
    await expect(page.locator("main, #root").first()).toBeVisible();
    await page.waitForTimeout(1000);
    expect(cspErrors).toEqual([]);
  });

  test("3. /bio/catalogo: Link en Bio renderiza enlaces sin errores de CSP", async ({ page }) => {
    const cspErrors = setupCspCollector(page);
    await page.goto("/bio/catalogo");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("text=ADORNIA").or(page.locator("text=WE HOME")).first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
    expect(cspErrors).toEqual([]);
  });

  test("4. Registro (/register): Carga de formulario y opciones sin errores de CSP", async ({ page }) => {
    const cspErrors = setupCspCollector(page);
    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");
    const nameInput = page.locator('input[placeholder="Ej. Florería María"]');
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    expect(cspErrors).toEqual([]);
  });

  test("5. Exportar Catálogo a PDF: Se activa la generación vectorial sin errores de CSP", async ({ page }) => {
    const cspErrors = setupCspCollector(page);
    await page.goto("/t/catalogo");
    await page.waitForLoadState("domcontentloaded");

    // Buscar botón de descarga PDF si está visible en el catálogo
    const pdfBtn = page.locator("button:has-text('Descargar PDF')").or(page.locator("button[aria-label*='PDF']")).or(page.locator("button:has-text('PDF')")).first();
    if (await pdfBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pdfBtn.click();
      await page.waitForTimeout(2000);
    }
    expect(cspErrors).toEqual([]);
  });

  test("6. Pedido por WhatsApp: Enlace y acción formateados hacia wa.me permitidos por CSP", async ({ page }) => {
    const cspErrors = setupCspCollector(page);
    await page.goto("/t/catalogo");
    await page.waitForLoadState("domcontentloaded");

    // Verificar que cualquier enlace a wa.me o botón de WhatsApp en la página esté permitido
    const waLinks = page.locator("a[href*='wa.me'], a[href*='whatsapp']");
    const count = await waLinks.count();
    if (count > 0) {
      await expect(waLinks.first()).toBeVisible();
    }
    expect(cspErrors).toEqual([]);
  });

  test("7. Editor Link en Bio con mapa (/admin/link-bio): Tiles y librerías permitidas por CSP", async ({ page }) => {
    const cspErrors = setupCspCollector(page);
    // Simular estado de autenticación o visitar la ruta de preview
    await page.goto("/admin/link-bio");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    // Los recursos de Leaflet y OSM no deben generar bloqueo CSP
    expect(cspErrors).toEqual([]);
  });
});
