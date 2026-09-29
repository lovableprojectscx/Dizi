import { test, expect } from "@playwright/test";

/**
 * Suite E2E - Verificación de tiendas de ejemplo y catalogo en modo móvil Android (360x800)
 * Regla: "HTTP 200" no prueba nada; se comprueba que la página renderiza productos reales.
 */
test.describe("Verificación E2E de tiendas demo y catalogo (360x800)", () => {
  test.use({
    viewport: { width: 360, height: 800 },
  });

  const demoStores = [
    { slug: "grano-miga", name: "Grano & Miga" },
    { slug: "zapatillas-demo", name: "Kickz Premium" },
    { slug: "celulares-demo", name: "GigaTech Mobile" },
    { slug: "ortopedicos-demo", name: "Ortopedia & Bienestar" },
    { slug: "aura-botanicals", name: "Aura Botanicals" },
    { slug: "aura", name: "Aura Boutique" },
    { slug: "nova-setup", name: "Nova Setup" },
    { slug: "floreria-demo", name: "Florería Pétalos & Detalles" },
    { slug: "restaurante-demo", name: "Bocados Gourmet" },
    { slug: "catalogo", name: "ADORNIA | WE HOME" },
  ];

  for (const store of demoStores) {
    test(`Tienda ${store.slug} carga catálogo y muestra productos en el DOM`, async ({ page }) => {
      // Visitar la ruta pública de catálogo /t/:slug
      await page.goto(`/t/${store.slug}`);
      await page.waitForLoadState("domcontentloaded");

      // No debe salir error de tienda no encontrada
      await expect(page.locator("text=Tienda no encontrada")).not.toBeVisible();
      await expect(page.locator("text=No pudimos cargar el catálogo")).not.toBeVisible();

      // Debe mostrar el contenedor de productos y elementos de producto con precio
      const productContainer = page.locator("main, [data-testid='products-grid'], #root");
      await expect(productContainer.first()).toBeVisible({ timeout: 15000 });

      // Verificar que hay al menos un precio (S/ o $) o elemento de producto visible en el catálogo
      const priceOrProduct = page.locator("text=/S\\/|\\$|Añadir|Pedir/i");
      await expect(priceOrProduct.first()).toBeVisible({ timeout: 15000 });
    });
  }
});
