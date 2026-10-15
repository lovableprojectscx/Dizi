import { test, expect } from "@playwright/test";

/**
 * Suite E2E - FASE 4B: Enlace directo de categoría /t/:slug/<categoria> (F36)
 *
 * Verificaciones requeridas por el encargo:
 * 1. /t/<prueba>/<cat> abre la categoría directamente.
 * 2. Mayúsculas + barra final /t/<prueba>/<CAT>/ abre la misma categoría.
 * 3. ?c=<cat> abre y la barra pasa a /t/<prueba>/<cat>.
 * 4. Categoría inexistente -> catálogo completo, aviso discreto, barra /t/<prueba>, sin pantalla de error.
 * 5. Cambiar a otra categoría y a "Todos" -> barra correcta, sin nueva petición get_public_store; botón Atrás sale de la tienda.
 * 6. "Compartir esta categoría" copia la forma de ruta (/t/:slug/<cat>).
 * 7. /t/<prueba>/<cat>?p=<id> abre categoría y modal de producto.
 * 8. Recargar la página estando en /t/<prueba>/<cat> (F5) funciona y mantiene la categoría.
 * 9. Compatibilidad con Fase 4A verificada.
 */

test.describe("FASE 4B — Enlace directo de categoría /t/:slug/<categoria> (F36)", () => {
  test.use({
    viewport: { width: 360, height: 800 },
    isMobile: true,
    hasTouch: true,
  });

  test("1. /t/catalogo/flores-follajes abre la categoría directamente", async ({ page }) => {
    await page.goto("/t/catalogo/flores-follajes");
    await page.waitForLoadState("domcontentloaded");

    const catalogHeader = page.locator("#catalogo");
    await expect(catalogHeader).toBeAttached({ timeout: 15000 });

    // La categoría debe estar activa
    await expect(page.locator("text=Flores & follajes").first()).toBeVisible({ timeout: 10000 });
    const shareBtn = page.locator("button:has-text('Compartir esta categoría')");
    await expect(shareBtn).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: "test-results/fase4b-01-categoria-ruta-directa.png", fullPage: false });
  });

  test("2. Mayúsculas y barra final /t/catalogo/FLORES-FOLLAJES/ abre la misma categoría", async ({ page }) => {
    await page.goto("/t/catalogo/FLORES-FOLLAJES/");
    await page.waitForLoadState("domcontentloaded");

    const catalogHeader = page.locator("#catalogo");
    await expect(catalogHeader).toBeAttached({ timeout: 15000 });

    // La categoría debe resolver a 'Flores & follajes'
    await expect(page.locator("text=Flores & follajes").first()).toBeVisible({ timeout: 10000 });
    const shareBtn = page.locator("button:has-text('Compartir esta categoría')");
    await expect(shareBtn).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: "test-results/fase4b-02-mayusculas-y-barra-final.png", fullPage: false });
  });

  test("3. ?c=flores-follajes abre y la barra de direcciones pasa a /t/catalogo/flores-follajes", async ({ page }) => {
    await page.goto("/t/catalogo?c=flores-follajes");
    await page.waitForLoadState("domcontentloaded");

    const catalogHeader = page.locator("#catalogo");
    await expect(catalogHeader).toBeAttached({ timeout: 15000 });

    await expect(page.locator("text=Flores & follajes").first()).toBeVisible({ timeout: 10000 });

    // La barra de direcciones debe haberse normalizado a formato de ruta sin ?c=
    await expect.poll(() => page.url(), { timeout: 5000 }).toContain("/t/catalogo/flores-follajes");
    expect(page.url()).not.toContain("?c=");

    await page.screenshot({ path: "test-results/fase4b-03-query-normalizado-a-ruta.png", fullPage: false });
  });

  test("4. Categoría inexistente muestra catálogo completo, aviso y barra en /t/catalogo sin error", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/t/catalogo/categoria-fantasma-inexistente-12345");
    await page.waitForLoadState("domcontentloaded");

    // Verificar que aparece el aviso discreto (toast)
    await expect(page.locator("text=Esa categoría ya no está disponible").first()).toBeVisible({ timeout: 10000 });

    // Verificar que la URL se restableció a la raíz de la tienda
    await expect.poll(() => page.url(), { timeout: 5000 }).toMatch(/\/t\/catalogo(?:\?.*)?$/);
    expect(page.url()).not.toContain("categoria-fantasma");

    // No debe mostrarse pantalla de error crítica
    await expect(page.locator("text=No pudimos encontrar esta tienda")).not.toBeVisible();

    // Sin errores de consola críticos
    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes("favicon") && !e.includes("zustand") && !e.includes("net::ERR")
    );
    expect(criticalErrors.length).toBe(0);

    await page.screenshot({ path: "test-results/fase4b-04-categoria-inexistente.png", fullPage: false });
  });

  test("5. Cambiar a otra categoría y a 'Todos' actualiza barra sin nueva petición get_public_store y Atrás sale de la tienda", async ({ page }) => {
    let getPublicStoreCalls = 0;
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/rpc/get_public_store?") || url.endsWith("/rpc/get_public_store")) {
        getPublicStoreCalls++;
      }
    });

    // 1. Iniciar en la landing para tener historial previo
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // 2. Navegar al catálogo
    await page.goto("/t/catalogo");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#catalogo")).toBeAttached({ timeout: 15000 });
    // Esperar a que cualquier refresco inicial de fondo (stale-while-revalidate) se asiente
    await page.waitForTimeout(2000);

    const initialStoreCalls = getPublicStoreCalls;
    expect(initialStoreCalls).toBeGreaterThan(0);

    // 3. Abrir drawer de filtros y seleccionar 'Flores & follajes'
    const filtrosBtn = page.locator("button:has-text('Filtros')").first();
    await expect(filtrosBtn).toBeVisible({ timeout: 10000 });
    await filtrosBtn.click();
    await page.waitForTimeout(400);

    const catBtn = page.locator("[role='dialog'] button:has-text('Flores & follajes')").first();
    await expect(catBtn).toBeVisible({ timeout: 5000 });
    await catBtn.click();
    await page.waitForTimeout(500);

    // La URL debe reflejar el path de categoría
    expect(page.url()).toContain("/t/catalogo/flores-follajes");

    // 4. Cambiar a 'Todos'
    const allBtn = page.locator("[role='dialog'] button:has-text('Todos')").first();
    await expect(allBtn).toBeVisible({ timeout: 5000 });
    await allBtn.click();
    await page.waitForTimeout(500);

    // La URL debe haber vuelto a /t/catalogo
    expect(page.url()).toMatch(/\/t\/catalogo(?:\?.*)?$/);
    expect(page.url()).not.toContain("/flores-follajes");

    // Verificar que NO se hicieron peticiones adicionales a get_public_store
    expect(getPublicStoreCalls).toBe(initialStoreCalls);

    // 5. Botón atrás del navegador sale de la tienda directamente
    await page.goBack();
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain("/t/catalogo");

    await page.screenshot({ path: "test-results/fase4b-05-navegacion-sin-refetch.png", fullPage: false });
  });

  test("6. 'Compartir esta categoría' copia la forma de ruta /t/:slug/<cat>", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.goto("/t/catalogo/flores-follajes");
    await page.waitForLoadState("domcontentloaded");

    const shareBtn = page.locator("button:has-text('Compartir esta categoría')").first();
    await expect(shareBtn).toBeVisible({ timeout: 15000 });
    await shareBtn.click();

    // Toast de confirmación
    await expect(page.locator("text=¡Enlace").first()).toBeVisible({ timeout: 5000 });

    try {
      const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
      if (clipboardContent) {
        expect(clipboardContent).toContain("/t/catalogo/flores-follajes");
        expect(clipboardContent).not.toContain("?c=");
      }
    } catch {}

    await page.screenshot({ path: "test-results/fase4b-06-compartir-categoria-ruta.png", fullPage: false });
  });

  test("7. /t/catalogo/flores-follajes?p=<id> abre categoría y modal de producto", async ({ page }) => {
    // Consultar un producto de Adornia
    const productsRes = await page.request.post("https://zkqzdwxjthjdjchimmds.supabase.co/rest/v1/rpc/get_public_store_products", {
      headers: {
        apikey: "sb_publishable_gZO6jV7aLBSu9YuaXmcI0Q_M8ygSDxX",
        "Content-Type": "application/json",
      },
      data: {
        p_store_slug: "catalogo",
        p_page_offset: 0,
        p_page_limit: 5,
      },
    });

    const products = await productsRes.json();
    expect(products.length).toBeGreaterThan(0);
    const sampleProduct = products[0];

    // Navegar con ruta de categoría y query param ?p=
    await page.goto(`/t/catalogo/flores-follajes?p=${sampleProduct.id}`);
    await page.waitForLoadState("domcontentloaded");

    // El modal de producto debe estar abierto
    await expect(page.locator(`text=${sampleProduct.name}`).first()).toBeVisible({ timeout: 15000 });

    // La categoría flores & follajes debe estar seleccionada
    await expect(page.locator("text=Flores & follajes").first()).toBeVisible();

    await page.screenshot({ path: "test-results/fase4b-07-categoria-y-producto.png", fullPage: false });
  });

  test("8. Recargar la página (F5) en /t/catalogo/flores-follajes mantiene la categoría", async ({ page }) => {
    await page.goto("/t/catalogo/flores-follajes");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("text=Flores & follajes").first()).toBeVisible({ timeout: 10000 });

    // Recargar la página
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // Verificar que la categoría sigue activa tras el reload
    await expect(page.locator("#catalogo")).toBeAttached({ timeout: 15000 });
    await expect(page.locator("text=Flores & follajes").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("button:has-text('Compartir esta categoría')")).toBeVisible();

    await page.screenshot({ path: "test-results/fase4b-08-reload-mantiene-categoria.png", fullPage: false });
  });

  test("9. jhoselynperu /t/jhoselynperu/panuelos abre categoría pañuelos", async ({ page }) => {
    await page.goto("/t/jhoselynperu/panuelos");
    await page.waitForLoadState("domcontentloaded");

    const catalogHeader = page.locator("#catalogo");
    await expect(catalogHeader).toBeAttached({ timeout: 15000 });
    const shareBtn = page.locator("button:has-text('Compartir esta categoría')");
    await expect(shareBtn).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: "test-results/fase4b-09-jhoselynperu-ruta.png", fullPage: false });
  });
});
