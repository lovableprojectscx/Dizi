import { test, expect } from "@playwright/test";

test.describe("Fase 3A: Tiendas sin productos y estados vacíos", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("Catálogo público vacío vs búsqueda sin resultados y atribución única", async ({ page }) => {
    // 1. Interceptar tienda vacía (0 productos)
    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "store_empty_test",
          slug: "tienda-vacia-test",
          name: "Tienda Vacía Test",
          phone: "51999888777",
          country_code: "51",
          country_iso: "PE",
          plan: "semilla",
          active: true,
          is_published: true,
          categories: [{ id: "cat-1", name: "General", icon: null, product_count: 0 }],
          products: [],
          total_products_count: 0,
        }),
      });
    });

    await page.route("**/rest/v1/rpc/get_public_store_products*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    // 1. Probar /t/tienda-vacia-test (0 productos)
    await page.goto("/t/tienda-vacia-test");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("text=Esta tienda está preparando su catálogo")).toBeVisible({ timeout: 10000 });
    await expect(page.locator('a:has-text("Contactar por WhatsApp")')).toBeVisible();

    // Captura del catálogo vacío en móvil
    await page.screenshot({ path: "test-results/fase3a-catalogo-vacio-movil.png" });

    // 2. Verificar atribución única (A4):
    // La pastilla flotante NO debe existir
    const floatingBadge = page.locator(".fixed.bottom-4:has-text('Crea tu catálogo gratis con')");
    await expect(floatingBadge).not.toBeVisible();

    // El pie de página SÍ contiene el enlace de captación
    const footerAttribution = page.locator("footer, [style*='borderColor'], div:has-text('Crea tu catálogo gratis con')").last();
    await expect(footerAttribution).toContainText("Crea tu catálogo gratis con");
    await expect(footerAttribution).toContainText("Dizi");

    // Captura del pie de página con atribución limpia
    await footerAttribution.scrollIntoViewIfNeeded();
    await page.screenshot({ path: "test-results/fase3a-pie-atribucion-movil.png" });

    // 3. Probar /bio/tienda-vacia-test
    await page.goto("/bio/tienda-vacia-test");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("text=Esta tienda está preparando su catálogo")).toBeVisible({ timeout: 10000 });
    await expect(page.locator('a:has-text("Contactar por WhatsApp")')).toBeVisible();

    // Captura del bio vacío en móvil
    await page.screenshot({ path: "test-results/fase3a-bio-vacio-movil.png" });
  });

  test("Búsqueda sin resultados en tienda con productos muestra 'No encontramos productos'", async ({ page }) => {
    // Interceptar tienda con productos reales
    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "store_with_prods",
          slug: "tienda-con-productos",
          name: "Tienda Con Productos",
          phone: "51999888777",
          country_code: "51",
          country_iso: "PE",
          plan: "semilla",
          active: true,
          is_published: true,
          categories: [{ id: "cat-1", name: "General", icon: null, product_count: 1 }],
          products: [
            {
              id: "p_real_1",
              name: "Zapatos de Cuero",
              price: 150,
              image: "/images/sin-foto.svg",
              visible: true,
              isSample: false,
              categoryId: "cat-1",
            },
          ],
          total_products_count: 1,
        }),
      });
    });

    await page.goto("/t/tienda-con-productos");
    await page.waitForLoadState("domcontentloaded");

    // Buscar término inexistente
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill("TerminoQueNoExiste12345");
      await expect(page.locator("text=No encontramos productos.")).toBeVisible({ timeout: 5000 });
      await expect(page.locator("text=Esta tienda está preparando su catálogo")).not.toBeVisible();
    }
  });
});
