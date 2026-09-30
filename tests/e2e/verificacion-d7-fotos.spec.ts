import { test, expect } from "@playwright/test";

/**
 * Suite E2E - Verificación D7: Independencia de Unsplash en las 7 tiendas demo
 * Modo celular (Pixel 7 / 360x800) contra producción https://dizi.idenza.site
 *
 * Verificaciones requeridas por Jack:
 * 1. Cada una de las 7 tiendas muestra sus fotos en /t/ y /bio/.
 * 2. 0 URLs de unsplash en los elementos de imagen renderizados.
 * 3. Las imágenes cargan exitosamente desde Supabase Storage.
 */

test.describe("D7: Verificación de fotos en 7 tiendas demo en modo celular (360x800)", () => {
  test.use({
    viewport: { width: 360, height: 800 },
    isMobile: true,
    hasTouch: true,
  });

  const demoStores = [
    { slug: "aura-botanicals", name: "Aura Botanicals" },
    { slug: "celulares-demo", name: "GigaTech Mobile" },
    { slug: "floreria-demo", name: "Florería Pétalos & Detalles" },
    { slug: "nova-setup", name: "Nova Setup" },
    { slug: "ortopedicos-demo", name: "Ortopedia & Bienestar" },
    { slug: "restaurante-demo", name: "Bocados Gourmet" },
    { slug: "zapatillas-demo", name: "Kickz Premium" },
  ];

  for (const store of demoStores) {
    test(`[Catálogo /t/] ${store.slug} renderiza fotos desde Supabase Storage (0 Unsplash)`, async ({ page }) => {
      await page.goto(`/t/${store.slug}`);
      await page.waitForLoadState("domcontentloaded");

      // No debe mostrar errores
      await expect(page.locator("text=Tienda no encontrada")).not.toBeVisible();
      await expect(page.locator("text=No pudimos cargar el catálogo")).not.toBeVisible();

      // Contenedor visible
      const main = page.locator("main, [data-testid='products-grid'], #root").first();
      await expect(main).toBeVisible({ timeout: 15000 });

      // Esperar a que las imágenes se inserten en el DOM
      const images = page.locator("img");
      await expect(images.first()).toBeVisible({ timeout: 15000 });

      // Evaluar todas las imágenes de la página: ninguna debe apuntar a Unsplash
      const imgSources = await images.evaluateAll((imgs: HTMLImageElement[]) => imgs.map(i => i.src));
      const unsplashImages = imgSources.filter(src => src.includes("unsplash.com"));
      expect(unsplashImages).toEqual([]);

      // Debe haber al menos una imagen servida desde Supabase Storage
      const supabaseImages = imgSources.filter(src => src.includes("supabase.co/storage/v1/object/public/images"));
      expect(supabaseImages.length).toBeGreaterThan(0);
      console.log(`[t/${store.slug}] OK: ${supabaseImages.length} fotos de Supabase Storage, 0 de Unsplash.`);
    });

    test(`[Bio-Link /bio/] ${store.slug} renderiza fotos desde Supabase Storage (0 Unsplash)`, async ({ page }) => {
      await page.goto(`/bio/${store.slug}`);
      await page.waitForLoadState("domcontentloaded");

      // No debe mostrar errores
      await expect(page.locator("text=Tienda no encontrada")).not.toBeVisible();
      await expect(page.locator("text=Tienda suspendida")).not.toBeVisible();

      // Contenedor visible
      const main = page.locator("main, [data-testid='products-grid'], #root").first();
      await expect(main).toBeVisible({ timeout: 15000 });

      // Esperar a que las imágenes se inserten en el DOM
      const images = page.locator("img");
      await expect(images.first()).toBeVisible({ timeout: 15000 });

      // Evaluar todas las imágenes de la página: ninguna debe apuntar a Unsplash
      const imgSources = await images.evaluateAll((imgs: HTMLImageElement[]) => imgs.map(i => i.src));
      const unsplashImages = imgSources.filter(src => src.includes("unsplash.com"));
      expect(unsplashImages).toEqual([]);

      // Debe haber imágenes de logo/banners o productos servidas desde Supabase Storage
      const supabaseImages = imgSources.filter(src => src.includes("supabase.co/storage/v1/object/public/images"));
      expect(supabaseImages.length).toBeGreaterThan(0);
      console.log(`[bio/${store.slug}] OK: ${supabaseImages.length} fotos de Supabase Storage, 0 de Unsplash.`);
    });
  }
});
