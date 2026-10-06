import { test, expect } from "@playwright/test";

/**
 * Suite E2E - Verificación de Rotación de Claves Supabase (Paso 5)
 * Ejecuta contra producción (https://dizi.idenza.site)
 *
 * Verificaciones:
 * 1. Network: Las llamadas a Supabase llevan la cabecera apikey: sb_publishable_... (no JWT antigua).
 * 2. Catálogos públicos: /t/jhoselynperu, /t/catalogo y /bio/catalogo cargan con la publishable.
 * 3. /t/ahorro solicita miniaturas _thumb.webp tras la creación de las 57 miniaturas.
 * 4. Endpoint WhatsApp /api/seo?slug=catalogo responde 200 con meta tags OG.
 * 5. Pantallas de login: /login y /super/login renderizan y están operativas con la nueva clave.
 */

test.describe("Rotación de Claves Supabase - Verificación en Producción", () => {
  test.use({
    viewport: { width: 360, height: 800 },
    isMobile: true,
    hasTouch: true,
  });

  test("1. Network inspección: Las peticiones a Supabase usan apikey sb_publishable_...", async ({ page }) => {
    const supabaseRequests: { url: string; apiKey: string | undefined }[] = [];

    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("supabase.co")) {
        const headers = req.headers();
        const apiKey = headers["apikey"];
        if (apiKey) {
          supabaseRequests.push({ url, apiKey });
        }
      }
    });

    await page.goto("/t/jhoselynperu");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("main, [data-testid='products-grid'], #root").first()).toBeVisible({ timeout: 15000 });

    expect(supabaseRequests.length).toBeGreaterThan(0);

    for (const req of supabaseRequests) {
      expect(
        req.apiKey?.startsWith("sb_publishable_"),
        `Petición a ${req.url} no usó sb_publishable_. Clave detectada: ${req.apiKey?.slice(0, 15)}...`
      ).toBe(true);
    }

    console.log(`[Network OK] ${supabaseRequests.length} peticiones verificadas con apikey sb_publishable_...`);
  });

  test("2. Catálogo /t/jhoselynperu y /t/catalogo cargan productos correctamente", async ({ page }) => {
    for (const slug of ["jhoselynperu", "catalogo"]) {
      await page.goto(`/t/${slug}`);
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("text=Tienda no encontrada")).not.toBeVisible();
      await expect(page.locator("text=No pudimos cargar el catálogo")).not.toBeVisible();

      const main = page.locator("main, [data-testid='products-grid'], #root").first();
      await expect(main).toBeVisible({ timeout: 15000 });

      const images = page.locator("img");
      await expect(images.first()).toBeVisible({ timeout: 15000 });
      console.log(`[t/${slug}] OK: Catálogo renderizado correctamente con la clave publishable.`);
    }
  });

  test("3. Bio-Link /bio/catalogo carga correctamente con la publishable", async ({ page }) => {
    await page.goto("/bio/catalogo");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("text=Tienda no encontrada")).not.toBeVisible();
    await expect(page.locator("text=Tienda suspendida")).not.toBeVisible();

    const main = page.locator("main, [data-testid='products-grid'], #root").first();
    await expect(main).toBeVisible({ timeout: 15000 });
    console.log("[bio/catalogo] OK: Bio-link renderizado correctamente.");
  });

  test("4. /t/ahorro solicita miniaturas _thumb.webp en lugar de originales en la grilla", async ({ page }) => {
    const requestedThumbnails: string[] = [];
    const requestedOriginals: string[] = [];

    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/storage/v1/object/public/images/")) {
        if (url.includes("_thumb.webp")) {
          requestedThumbnails.push(url);
        } else if (url.includes("/products/") && url.endsWith(".webp") && !url.includes("_var_")) {
          requestedOriginals.push(url);
        }
      }
    });

    await page.goto("/t/ahorro");
    await page.waitForLoadState("domcontentloaded");

    const main = page.locator("main, [data-testid='products-grid'], #root").first();
    await expect(main).toBeVisible({ timeout: 15000 });

    const images = page.locator("img");
    await expect(images.first()).toBeVisible({ timeout: 15000 });

    // Scroll para activar las primeras imágenes
    await page.evaluate(async () => {
      window.scrollTo(0, 400);
      await new Promise((r) => setTimeout(r, 600));
    });

    expect(requestedThumbnails.length).toBeGreaterThan(0);
    expect(
      requestedOriginals,
      `[t/ahorro] Se solicitaron fotos originales innecesariamente: ${JSON.stringify(requestedOriginals)}`
    ).toEqual([]);

    console.log(`[t/ahorro] OK: ${requestedThumbnails.length} miniaturas _thumb.webp solicitadas, 0 originales.`);
  });

  test("5. Endpoint WhatsApp /api/seo responde 200 con meta tags Open Graph", async ({ request }) => {
    const res = await request.get("/api/seo?slug=catalogo");
    expect(res.status()).toBe(200);

    const html = await res.text();
    expect(html).toContain("og:title");
    expect(html).toContain("og:image");
    expect(html).toContain("ADORNIA");
    console.log("[api/seo OK] Vista previa de WhatsApp funcionando con la clave publishable.");
  });

  test("6. Vistas de Login /login y /super/login están operativas", async ({ page }) => {
    // /login
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator('input[type="email"], input[type="text"]').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 15000 });

    // /super/login
    await page.goto("/super/login");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 15000 });

    console.log("[Login Views OK] /login y /super/login cargan y están listas.");
  });
});
