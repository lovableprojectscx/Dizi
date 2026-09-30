import { test, expect } from "@playwright/test";

/**
 * Suite E2E - Verificación de tiendas de ejemplo y catalogo en modo móvil Android (360x800)
 * Regla de oro de Jack: "HTTP 200" no cuenta como prueba: verifica que la RPC devuelva
 * la tienda y que la página muestre productos tanto en /t/ como en /bio/.
 */
test.describe("Verificación E2E de tiendas demo y catalogo (360x800)", () => {
  test.use({
    viewport: { width: 360, height: 800 },
    isMobile: true,
    hasTouch: true,
  });

  const stores = [
    { slug: "catalogo", name: "ADORNIA | WE HOME" },
    { slug: "grano-miga", name: "Grano & Miga · Café & Panadería" },
    { slug: "zapatillas-demo", name: "Kickz Premium" },
    { slug: "celulares-demo", name: "GigaTech Mobile" },
    { slug: "ortopedicos-demo", name: "Ortopedia & Bienestar" },
    { slug: "aura-botanicals", name: "Aura Botanicals · Cosmética Orgánica" },
    { slug: "aura", name: "Aura Boutique" },
    { slug: "nova-setup", name: "Nova Setup · Tech & Gadgets" },
    { slug: "floreria-demo", name: "Florería Pétalos & Detalles" },
    { slug: "restaurante-demo", name: "Bocados Gourmet" },
    { slug: "floresta", name: "DIZI - Catálogos Digitales" },
  ];

  for (const store of stores) {
    test(`[Catálogo /t/] ${store.slug} carga y muestra productos`, async ({ page }) => {
      await page.goto(`/t/${store.slug}`);
      await page.waitForLoadState("domcontentloaded");

      // No debe salir error de tienda no encontrada ni error de carga
      await expect(page.locator("text=Tienda no encontrada")).not.toBeVisible();
      await expect(page.locator("text=No pudimos cargar el catálogo")).not.toBeVisible();

      // Debe mostrar contenedor principal
      const container = page.locator("main, [data-testid='products-grid'], #root");
      await expect(container.first()).toBeVisible({ timeout: 15000 });

      // Verificar que hay productos visibles con precios o botones de compra/pedido
      const productElement = page.locator("text=/S\\/|\\$|Añadir|Pedir/i");
      await expect(productElement.first()).toBeVisible({ timeout: 15000 });
    });

    test(`[Bio-Link /bio/] ${store.slug} carga y muestra vitrina de productos`, async ({ page }) => {
      await page.goto(`/bio/${store.slug}`);
      await page.waitForLoadState("domcontentloaded");

      // No debe salir error de tienda no encontrada ni tienda suspendida
      await expect(page.locator("text=Tienda no encontrada")).not.toBeVisible();
      await expect(page.locator("text=Tienda suspendida")).not.toBeVisible();

      // Debe mostrar contenedor principal del bio
      const container = page.locator("main, [data-testid='products-grid'], #root");
      await expect(container.first()).toBeVisible({ timeout: 15000 });

      // En /bio/, la vitrina de productos muestra precios o botones de compra/pedido
      const productElement = page.locator("text=/S\\/|\\$|Añadir|Pedir/i");
      await expect(productElement.first()).toBeVisible({ timeout: 15000 });
    });
  }
});
