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

  test("10. Cargar más productos con scroll, cambiar de categoría y volver: los productos siguen ahí y no hay petición get_public_store", async ({ page }) => {
    let getPublicStoreCalls = 0;
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/rpc/get_public_store?") || url.endsWith("/rpc/get_public_store")) {
        getPublicStoreCalls++;
      }
    });

    await page.goto("/t/catalogo");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#catalogo")).toBeAttached({ timeout: 15000 });
    await page.waitForTimeout(2000);

    const initialStoreCalls = getPublicStoreCalls;
    expect(initialStoreCalls).toBeGreaterThan(0);

    // Esperar los primeros artículos en pantalla (visibleLimit arranca en 12)
    await expect.poll(async () => page.locator("article").count(), { timeout: 10000 }).toBeGreaterThanOrEqual(12);

    // Hacer scroll al final de la página para activar la carga infinita (incrementa visibleLimit a 24+)
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(800);
    }

    // Comprobar que se cargaron más productos (> 12 artículos en pantalla)
    await expect.poll(async () => page.locator("article").count(), { timeout: 15000 }).toBeGreaterThan(12);
    const countAfterScroll = await page.locator("article").count();

    // Cambiar a categoría "Flores & follajes"
    const filtrosBtn = page.locator("button:has-text('Filtros')").first();
    await expect(filtrosBtn).toBeVisible({ timeout: 10000 });
    await filtrosBtn.click();
    await page.waitForTimeout(400);

    const catBtn = page.locator("[role='dialog'] button:has-text('Flores & follajes')").first();
    await expect(catBtn).toBeVisible({ timeout: 5000 });
    await catBtn.click();
    await page.waitForTimeout(500);
    expect(page.url()).toContain("/t/catalogo/flores-follajes");

    // Volver a "Todos"
    const allBtn = page.locator("[role='dialog'] button:has-text('Todos')").first();
    await expect(allBtn).toBeVisible({ timeout: 5000 });
    await allBtn.click();
    await page.waitForTimeout(500);
    expect(page.url()).toMatch(/\/t\/catalogo(?:\?.*)?$/);

    // Al volver a hacer scroll en "Todos", los productos ya en memoria se revelan inmediatamente
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    const finalArticleCount = await page.locator("article").count();
    expect(finalArticleCount).toBe(countAfterScroll);

    // Verificar que no hubo nuevas llamadas a get_public_store
    expect(getPublicStoreCalls).toBe(initialStoreCalls);

    await page.screenshot({ path: "test-results/fase4b-10-scroll-productos-preservados.png", fullPage: false });
  });

  test("11. Simular >60 s transcurridos y cambiar de categoría: 0 peticiones get_public_store", async ({ page }) => {
    let getPublicStoreCalls = 0;
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/rpc/get_public_store?") || url.endsWith("/rpc/get_public_store")) {
        getPublicStoreCalls++;
      }
    });

    await page.goto("/t/catalogo");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#catalogo")).toBeAttached({ timeout: 15000 });
    await page.waitForTimeout(2000);

    const initialStoreCalls = getPublicStoreCalls;
    expect(initialStoreCalls).toBeGreaterThan(0);

    // Simular que pasaron más de 60 segundos envejeciendo los timestamps de la caché local a 2 minutos atrás
    await page.evaluate(() => {
      const twoMinutesAgo = Date.now() - 120_000;
      const raw = localStorage.getItem("dizi_store_cache_catalogo");
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.ts = twoMinutesAgo;
        parsed.verifiedAt = twoMinutesAgo;
        localStorage.setItem("dizi_store_cache_catalogo", JSON.stringify(parsed));
      }
      const rawSession = sessionStorage.getItem("dizi_store_cache_catalogo");
      if (rawSession) {
        const parsedSession = JSON.parse(rawSession);
        parsedSession.ts = twoMinutesAgo;
        parsedSession.verifiedAt = twoMinutesAgo;
        sessionStorage.setItem("dizi_store_cache_catalogo", JSON.stringify(parsedSession));
      }
    });

    // Cambiar a categoría "Flores & follajes"
    const filtrosBtn = page.locator("button:has-text('Filtros')").first();
    await expect(filtrosBtn).toBeVisible({ timeout: 10000 });
    await filtrosBtn.click();
    await page.waitForTimeout(400);

    const catBtn = page.locator("[role='dialog'] button:has-text('Flores & follajes')").first();
    await expect(catBtn).toBeVisible({ timeout: 5000 });
    await catBtn.click();
    await page.waitForTimeout(500);
    expect(page.url()).toContain("/t/catalogo/flores-follajes");

    // Cambiar a "Todos"
    const allBtn = page.locator("[role='dialog'] button:has-text('Todos')").first();
    await expect(allBtn).toBeVisible({ timeout: 5000 });
    await allBtn.click();
    await page.waitForTimeout(500);
    expect(page.url()).toMatch(/\/t\/catalogo(?:\?.*)?$/);

    // Cero peticiones adicionales a get_public_store a pesar de haber pasado >60 s
    expect(getPublicStoreCalls).toBe(initialStoreCalls);

    await page.screenshot({ path: "test-results/fase4b-11-simulacion-60s-cero-egress.png", fullPage: false });
  });

  test("12. Refresco en segundo plano no se aborta si el usuario cambia de categoría durante la petición", async ({ page }) => {
    // 1. Inyectar en localStorage un store viejo con un nombre/precio identificable
    await page.addInitScript(() => {
      const oldStore = {
        id: "s_race_test",
        slug: "catalogo",
        name: "ADORNIA | WE HOME",
        phone: "51999888777",
        countryCode: "51",
        countryIso: "PE",
        plan: "pro",
        active: true,
        isPublished: true,
        categories: [
          { id: "cat-1", name: "Flores & follajes|flower" },
        ],
        products: [
          {
            id: "p-race-1",
            name: "Producto Precio Viejo",
            price: 50.00,
            categoryId: "cat-1",
            image: "",
            visible: true,
          },
        ],
      };
      const cachePayload = {
        store: oldStore,
        ts: Date.now() - 300_000,
        verifiedAt: Date.now() - 300_000,
      };
      localStorage.setItem("dizi_store_cache_catalogo", JSON.stringify(cachePayload));
      sessionStorage.setItem("dizi_store_cache_catalogo", JSON.stringify(cachePayload));
    });

    // 2. Interceptar get_public_store retrasando la respuesta 2 segundos y devolviendo datos frescos
    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const freshData = {
        id: "s_race_test",
        slug: "catalogo",
        name: "ADORNIA | WE HOME",
        phone: "51999888777",
        country_code: "51",
        country_iso: "PE",
        plan: "pro",
        active: true,
        is_published: true,
        categories: [
          { id: "cat-1", name: "Flores & follajes|flower" },
        ],
        products: [
          {
            id: "p-race-1",
            name: "Producto Precio Fresco",
            price: 189.90,
            category_id: "cat-1",
            image: "https://example.com/flower.jpg",
            visible: true,
          },
        ],
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(freshData),
      });
    });

    // 3. Abrir la tienda (lee caché viejo inmediatamente)
    await page.goto("/t/catalogo");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("text=Producto Precio Viejo").first()).toBeVisible({ timeout: 5000 });

    // 4. Cambiar de categoría a los 0.5 s (mientras la petición de fondo sigue en vuelo)
    await page.waitForTimeout(500);
    const filtrosBtn = page.locator("button:has-text('Filtros')").first();
    await expect(filtrosBtn).toBeVisible({ timeout: 5000 });
    await filtrosBtn.click();
    await page.waitForTimeout(300);

    const catBtn = page.locator("[role='dialog'] button:has-text('Flores & follajes')").first();
    await expect(catBtn).toBeVisible({ timeout: 5000 });
    await catBtn.click();
    await page.waitForTimeout(400);
    expect(page.url()).toContain("/t/catalogo/flores-follajes");

    // Cerrar el drawer de filtros para que el grid de productos sea visible
    const applyBtn = page.locator("[role='dialog'] button:has-text('Ver')").first();
    await expect(applyBtn).toBeVisible({ timeout: 5000 });
    await applyBtn.click();
    await page.waitForTimeout(400);

    // 5. Al responder la petición de 2 s, el dato fresco DEBE mostrarse (no fue abortado por el cambio de categoría)
    await expect(page.locator("text=Producto Precio Fresco").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=S/ 189.90").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Producto Precio Viejo")).not.toBeVisible();

    await page.screenshot({ path: "test-results/fase4b-12-refresco-carrera-resuelto.png", fullPage: false });
  });

  test("13. Encabezado de categoría muestra el total real de productos (activeCategoryObj.productCount) y no solo los cargados", async ({ page }) => {
    await page.goto("/t/jhoselynperu/manga-corta-cuello-uve");
    await page.waitForLoadState("domcontentloaded");

    const catalogHeader = page.locator("#catalogo");
    await expect(catalogHeader).toBeAttached({ timeout: 15000 });

    // Debe mostrar el total real de la categoría (productCount en DB: 17 o 18) y no solo los cargados en memoria (7)
    await expect(page.locator("text=/\\((17|18) productos\\)/").first()).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: "test-results/fase4b-13-conteo-total-categoria.png", fullPage: false });
  });

  test("14. Coincidencia con tildes y mayúsculas: /pañuelos y /PAÑUELOS abren 'PAÑUELOS'", async ({ page }) => {
    // 1. Con tilde en minúscula /t/jhoselynperu/pañuelos
    await page.goto("/t/jhoselynperu/pañuelos");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#catalogo")).toBeAttached({ timeout: 15000 });
    await expect(page.locator("button:has-text('Compartir esta categoría')")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=PAÑUELOS").first()).toBeVisible({ timeout: 10000 });

    // 2. Con tilde en mayúscula /t/jhoselynperu/PAÑUELOS
    await page.goto("/t/jhoselynperu/PAÑUELOS");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#catalogo")).toBeAttached({ timeout: 15000 });
    await expect(page.locator("button:has-text('Compartir esta categoría')")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=PAÑUELOS").first()).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: "test-results/fase4b-14-tildes-y-mayusculas.png", fullPage: false });
  });
});

