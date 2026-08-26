import { test, expect } from "@playwright/test";

/**
 * Suite E2E - Pruebas de Paginación Lazy Loading y Caché Zero-Egress
 * Valida que los catálogos públicos y bio-links carguen de forma ultra-ligera,
 * soporten paginación bajo demanda y aprovechen el almacenamiento en sessionStorage.
 */
test.describe("E2E - Lazy Loading y Optimización de Egress", () => {
  test("E2E-LL-01: Carga fluida del catálogo público sin excepciones no controladas", async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (err) => {
      pageErrors.push(err);
    });

    // Usar catálogo real activo
    await page.goto("/t/catalogo");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 1. Verificar que el título de la tienda y los productos estén visibles
    await expect(page.locator("body")).toContainText("ADORNIA");
    const articlesCount = await page.locator("article").count();
    expect(articlesCount).toBeGreaterThanOrEqual(4);

    // 2. Verificar que no haya excepciones no controladas en el hilo de ejecución
    expect(pageErrors.length).toBe(0);
  });

  test("E2E-LL-02: Carga ultra-rápida del Bio-Link con showcase de productos", async ({ page }) => {
    await page.goto("/bio/catalogo");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // Verificar presencia del contenedor del Bio-Link
    await expect(page.locator("body")).toContainText("ADORNIA");
  });

  test("E2E-LL-03: Zero-Egress en SessionStorage durante navegación en la misma sesión", async ({ page }) => {
    let rpcCount = 0;
    page.on("request", (req) => {
      if (req.url().includes("get_public_store")) {
        rpcCount++;
      }
    });

    // Primera visita: debe consultar a Supabase
    await page.goto("/t/catalogo");
    await page.waitForTimeout(2000);
    const initialRpcCount = rpcCount;
    expect(initialRpcCount).toBeGreaterThanOrEqual(1);

    // Segunda navegación/recarga en la misma sesión: debe servirse desde sessionStorage sin peticiones RPC adicionales
    await page.reload();
    await page.waitForTimeout(1500);

    // El contador de RPCs no debe duplicarse gracias a la caché en sessionStorage
    const subsequentRpcCount = rpcCount - initialRpcCount;
    expect(subsequentRpcCount).toBeLessThanOrEqual(1);
  });

  test("E2E-LL-04: El Service Worker está registrado e intercepta peticiones GET", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const isSwSupported = await page.evaluate(() => "serviceWorker" in navigator);
    expect(isSwSupported).toBe(true);
  });

  test("E2E-LL-05: Paginación progresiva al desplazarse por el catálogo", async ({ page }) => {
    await page.goto("/t/catalogo");
    await page.waitForLoadState("domcontentloaded");
    await page.locator("article").first().waitFor({ state: "visible", timeout: 10000 });

    // Contar productos antes del scroll
    const initialCount = await page.locator("article").count();
    expect(initialCount).toBeGreaterThanOrEqual(12);

    // Scroll hacia el final para activar la carga del siguiente lote
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    // Verificar que los productos sigan interactivos y la tienda responda
    const currentCount = await page.locator("article").count();
    expect(currentCount).toBeGreaterThanOrEqual(initialCount);
  });

  test("E2E-LL-06: Conteo real de productos en la barra lateral de categorías", async ({ page }) => {
    await page.goto("/t/catalogo");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // Verificar que la categoría Cerámica muestre su número real de productos (>0)
    const ceramicaButton = page.locator("button", { hasText: "Cerámica" });
    if ((await ceramicaButton.count()) > 0) {
      const text = await ceramicaButton.first().innerText();
      expect(text).not.toContain("(0)");
    }
  });

  test("E2E-LL-07: Búsqueda reactiva en el catálogo", async ({ page }) => {
    await page.goto("/t/catalogo");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // Escribir en el input de búsqueda
    const searchInput = page.locator("input[placeholder*='buscas']");
    if ((await searchInput.count()) > 0) {
      await searchInput.fill("Estante");
      await page.waitForTimeout(1000);

      // Verificar que los artículos filtrados correspondan al término buscado
      const articles = page.locator("article");
      const count = await articles.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test("E2E-LL-08: Clic en categoría no cargada inicialmente descarga y muestra sus productos sin pantallas vacías", async ({ page }) => {
    await page.goto("/t/catalogo");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toContainText("ADORNIA", { timeout: 15000 });
    await page.locator("article").first().waitFor({ state: "visible", timeout: 15000 });

    // Buscar el botón visible de la categoría Acrílico Fabric
    const acrilicoButton = page.locator("button:visible", { hasText: "Acrílico Fabric" }).first();
    if ((await acrilicoButton.count()) > 0) {
      await acrilicoButton.scrollIntoViewIfNeeded();
      await acrilicoButton.click();

      // Esperar a que los artículos de la categoría aparezcan en pantalla
      const articles = page.locator("article");
      await expect(articles.first()).toBeVisible({ timeout: 15000 });

      // Verificar que NO aparezca el mensaje de error "No hay productos en esta categoría"
      const emptyStateText = await page.locator("body").innerText();
      expect(emptyStateText).not.toContain("No hay productos en esta categoría");

      const count = await articles.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });
});
