import { test, expect } from "@playwright/test";

/**
 * Suite E2E - HOTFIX: Verificación de recuperación de fotos sin miniatura
 * Modo celular (Pixel 7 / 360x800)
 *
 * Verificaciones requeridas por el encargo:
 * 1. Tiendas sin _thumb.webp (/t/ahorro, /t/zapatillas-demo, /t/floresta) -> 0 sin-foto.svg, naturalWidth > 0.
 * 2. Tiendas con miniatura (/t/jhoselynperu, /t/catalogo) -> piden _thumb.webp y NO bajan originales en la grilla.
 * 3. /bio/ahorro -> 0 sin-foto.svg, naturalWidth > 0.
 */

test.describe("HOTFIX: Fotos sin miniatura cargan fotos originales en lugar de 'Sin foto' (Pixel 7 / 360x800)", () => {
  test.use({
    viewport: { width: 360, height: 800 },
    isMobile: true,
    hasTouch: true,
  });

  // 1. Tiendas donde los productos no tienen _thumb.webp deben mostrar sus fotos reales (0 sin-foto.svg, naturalWidth > 0)
  const storesWithoutThumbs = [
    { slug: "ahorro", name: "Ahorro" },
    { slug: "zapatillas-demo", name: "Kickz Premium" },
    { slug: "floresta", name: "Floresta" },
  ];

  for (const store of storesWithoutThumbs) {
    test(`1. [Catálogo /t/${store.slug}] muestra fotos reales sin caer a sin-foto.svg`, async ({ page }) => {
      await page.goto(`/t/${store.slug}`);
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("text=Tienda no encontrada")).not.toBeVisible();
      await expect(page.locator("text=No pudimos cargar el catálogo")).not.toBeVisible();

      const main = page.locator("main, [data-testid='products-grid'], #root").first();
      await expect(main).toBeVisible({ timeout: 15000 });

      // Esperar imágenes y hacer scroll sobre cada una para disparar lazy loading
      const images = page.locator("img");
      await expect(images.first()).toBeVisible({ timeout: 15000 });

      // Scroll gradual por toda la página para disparar IntersectionObserver y lazy loading
      await page.evaluate(async () => {
        const distance = 300;
        const totalHeight = document.body.scrollHeight;
        let currentPosition = 0;
        while (currentPosition < totalHeight) {
          window.scrollBy(0, distance);
          currentPosition += distance;
          await new Promise((r) => setTimeout(r, 100));
        }
      });

      // Asegurar que cada imagen haya sido llevada a viewport
      for (const img of await images.all()) {
        await img.scrollIntoViewIfNeeded();
      }

      // Esperar a que todas las imágenes completen su carga física (y fallbacks si aplican)
      await page.waitForFunction(() => {
        const imgs = Array.from(document.querySelectorAll("img")) as HTMLImageElement[];
        return imgs.length > 0 && imgs.every((i) => i.complete && i.naturalWidth > 0);
      }, { timeout: 15000 });

      const imgSources = await images.evaluateAll((imgs: HTMLImageElement[]) => imgs.map((i) => i.src));

      // 0 sin-foto.svg cuando los productos tienen fotos
      const sinFotoImages = imgSources.filter((src) => src.includes("sin-foto.svg"));
      expect(
        sinFotoImages,
        `[t/${store.slug}] Se detectaron ${sinFotoImages.length} imágenes mostrando sin-foto.svg.`
      ).toEqual([]);

      // Debe haber al menos una foto de Supabase Storage
      const supabaseImages = imgSources.filter((src) =>
        src.includes("supabase.co/storage/v1/object/public/images")
      );
      expect(supabaseImages.length).toBeGreaterThan(0);

      // Comprobar que todas las fotos cargaron físicamente (naturalWidth > 0)
      const brokenImages = await images.evaluateAll((imgs: HTMLImageElement[]) =>
        imgs.filter((i) => i.naturalWidth === 0).map((i) => i.src)
      );
      expect(
        brokenImages,
        `[t/${store.slug}] Fotos rotas detectadas con naturalWidth === 0: ${JSON.stringify(brokenImages)}`
      ).toEqual([]);

      console.log(`[t/${store.slug}] OK: ${supabaseImages.length} fotos reales cargadas, 0 sin-foto.svg, todas con naturalWidth > 0.`);
    });
  }

  // 2. Productos que sí tienen miniatura (/t/jhoselynperu, /t/catalogo) siguen pidiendo _thumb.webp (la grilla NO baja originales)
  const storesWithThumbs = [
    { slug: "jhoselynperu", name: "Jhoselyn Peru" },
    { slug: "catalogo", name: "Adornia Catálogo" },
  ];

  for (const store of storesWithThumbs) {
    test(`2. [Catálogo /t/${store.slug}] grilla solicita miniaturas _thumb.webp y no originales`, async ({ page }) => {
      const requestedThumbnails: string[] = [];
      const requestedOriginals: string[] = [];

      page.on("request", (req) => {
        const url = req.url();
        if (url.includes("/storage/v1/object/public/images/")) {
          if (url.includes("_thumb.webp")) {
            requestedThumbnails.push(url);
          } else if (
            url.includes("/products/") &&
            url.endsWith(".webp") &&
            !url.includes("_var_")
          ) {
            requestedOriginals.push(url);
          }
        }
      });

      await page.goto(`/t/${store.slug}`);
      await page.waitForLoadState("domcontentloaded");

      const main = page.locator("main, [data-testid='products-grid'], #root").first();
      await expect(main).toBeVisible({ timeout: 15000 });

      // Esperar a que carguen las primeras imágenes de la grilla
      const images = page.locator("img");
      await expect(images.first()).toBeVisible({ timeout: 15000 });

      await page.waitForTimeout(1500);

      // Verificar que se pidieron miniaturas
      expect(requestedThumbnails.length).toBeGreaterThan(0);

      // En la grilla normal, no debe haber bajado originales porque las miniaturas existen y funcionan
      expect(
        requestedOriginals,
        `[t/${store.slug}] Se solicitaron originales innecesariamente en la grilla: ${JSON.stringify(requestedOriginals)}`
      ).toEqual([]);

      console.log(`[t/${store.slug}] OK: ${requestedThumbnails.length} miniaturas _thumb.webp descargadas, 0 originales.`);
    });
  }

  // 3. /bio/ahorro muestra fotos reales sin caer a sin-foto.svg
  test("3. [Bio-Link /bio/ahorro] muestra fotos reales sin caer a sin-foto.svg", async ({ page }) => {
    await page.goto("/bio/ahorro");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("text=Tienda no encontrada")).not.toBeVisible();
    await expect(page.locator("text=Tienda suspendida")).not.toBeVisible();

    const main = page.locator("main, [data-testid='products-grid'], #root").first();
    await expect(main).toBeVisible({ timeout: 15000 });

    const images = page.locator("img");
    await expect(images.first()).toBeVisible({ timeout: 15000 });

    // Scroll gradual y scrollIntoView para asegurar carga física
    for (const img of await images.all()) {
      await img.scrollIntoViewIfNeeded();
    }

    await page.waitForFunction(() => {
      const imgs = Array.from(document.querySelectorAll("img")) as HTMLImageElement[];
      return imgs.length > 0 && imgs.every((i) => i.complete && i.naturalWidth > 0);
    }, { timeout: 15000 });

    const imgSources = await images.evaluateAll((imgs: HTMLImageElement[]) => imgs.map((i) => i.src));

    const sinFotoImages = imgSources.filter((src) => src.includes("sin-foto.svg"));
    expect(
      sinFotoImages,
      `[/bio/ahorro] Se detectaron ${sinFotoImages.length} imágenes mostrando sin-foto.svg.`
    ).toEqual([]);

    const supabaseImages = imgSources.filter((src) =>
      src.includes("supabase.co/storage/v1/object/public/images")
    );
    expect(supabaseImages.length).toBeGreaterThan(0);

    const brokenImages = await images.evaluateAll((imgs: HTMLImageElement[]) =>
      imgs.filter((i) => i.naturalWidth === 0).map((i) => i.src)
    );
    expect(
      brokenImages,
      `[/bio/ahorro] Fotos rotas detectadas con naturalWidth === 0: ${JSON.stringify(brokenImages)}`
    ).toEqual([]);

    console.log(`[/bio/ahorro] OK: ${supabaseImages.length} fotos reales cargadas, 0 sin-foto.svg, todas con naturalWidth > 0.`);
  });
});
