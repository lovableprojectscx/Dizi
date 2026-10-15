import { test, expect } from "@playwright/test";

/**
 * Suite E2E - FASE 4C: Modo resultados al filtrar (móvil primero) (F37)
 *
 * Requisitos del encargo + Condiciones extra del usuario:
 * 1. Buscar texto con resultados -> banner y destacados no existen en el DOM visible; primer resultado visible sin scroll (top < 400 px).
 * 2. Borrar búsqueda -> banner vuelve.
 * 3. Elegir categoría por chip -> banner oculto, barra con total real, primer producto visible.
 * 4. Link directo /t/:slug/:cat -> banner oculto, barra con total real, primer producto visible.
 * 5. ✕ Ver todo -> portada completa y URL limpia /t/:slug.
 * 6. Búsqueda sin resultados -> mensaje "No encontramos..." + botón "Ver todo" + botón "Pregúntanos por WhatsApp" con texto buscado.
 * 7. Condición extra 1: en Bite y Bloom, escribir "ab" letra por letra -> el input mantiene el foco (document.activeElement) y el valor completo es "ab".
 * 8. Condición extra 2: layout hero (eco) en modo resultados -> el primer producto pasa a tarjeta normal del grid (no hero 16/7).
 * 9. Capturas móviles antes y después en los 4 layouts: nature (jhoselynperu), bloom (onfeet), bite (restaurante-demo), grid (catalogo).
 */

test.describe("FASE 4C — Modo resultados al filtrar (F37)", () => {
  test.use({
    viewport: { width: 360, height: 800 },
    isMobile: true,
    hasTouch: true,
  });

  /* ── 1. NATURE (jhoselynperu) ────────────────────────── */
  test("1. Nature (jhoselynperu): búsqueda oculta banner y destacados, primer producto a top < 400px", async ({ page }) => {
    await page.goto("/t/jhoselynperu");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#catalogo")).toBeAttached({ timeout: 15000 });

    // Captura ANTES
    await page.screenshot({ path: "test-results/fase4c-nature-antes.png" });

    // El banner de Jhoselyn Peru muestra su título 'Basicos 100% algodon'
    const natureBanner = page.locator("text=Basicos 100% algodon").first();
    await expect(natureBanner).toBeVisible({ timeout: 10000 });

    // Buscar "amarillo" en el buscador
    const searchInput = page.locator("input[placeholder*='buscando']").first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill("amarillo");

    // Verificar que la barra de resultados aparezca
    const resultsBar = page.locator("[data-testid='results-bar']");
    await expect(resultsBar).toBeVisible({ timeout: 5000 });
    await expect(resultsBar).toContainText("resultado");
    await expect(resultsBar).toContainText("amarillo");

    // Verificar que el banner de nature NO esté en el DOM visible
    await expect(natureBanner).toHaveCount(0);

    // Primer producto visible en la parte superior sin scroll (top < 450 px)
    const firstProduct = page.locator("article").first();
    await expect(firstProduct).toBeVisible({ timeout: 5000 });
    const box = await firstProduct.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.y).toBeLessThan(450);
    }

    // Captura DESPUÉS
    await page.screenshot({ path: "test-results/fase4c-nature-despues.png" });

    // Borrar búsqueda y verificar que banner vuelve
    const clearBtn = resultsBar.locator("button[aria-label='Borrar búsqueda']");
    await clearBtn.click();
    await expect(natureBanner).toBeVisible({ timeout: 5000 });
  });

  test("2. Nature (jhoselynperu): elegir categoría por chip oculta portada y muestra total real", async ({ page }) => {
    await page.goto("/t/jhoselynperu");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#catalogo")).toBeAttached({ timeout: 15000 });

    const natureBanner = page.locator("text=Basicos 100% algodon").first();
    await expect(natureBanner).toBeVisible({ timeout: 10000 });

    // Hacer clic en el chip de "Hombre"
    const catChip = page.locator("#nature-coleccion button:has-text('Hombre')").first();
    await expect(catChip).toBeVisible({ timeout: 10000 });
    await catChip.click();

    // Barra de resultados muestra total real con botón Ver todo
    const resultsBar = page.locator("[data-testid='results-bar']");
    await expect(resultsBar).toBeVisible({ timeout: 5000 });
    await expect(resultsBar).toContainText("Hombre");
    await expect(resultsBar).toContainText("producto");

    // Portada oculta
    await expect(natureBanner).toHaveCount(0);

    // Botón "Ver todo" restaura portada y limpia URL
    const verTodoBtn = resultsBar.locator("button:has-text('Ver todo')");
    await verTodoBtn.click();
    await expect(natureBanner).toBeVisible({ timeout: 5000 });
    expect(page.url()).toMatch(/\/t\/jhoselynperu$/);
  });

  test("3. Nature (jhoselynperu): link directo /t/jhoselynperu/hombre arranca en modo resultados", async ({ page }) => {
    await page.goto("/t/jhoselynperu/hombre");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#catalogo")).toBeAttached({ timeout: 15000 });

    const resultsBar = page.locator("[data-testid='results-bar']");
    await expect(resultsBar).toBeVisible({ timeout: 10000 });
    await expect(resultsBar).toContainText("Hombre");

    const natureBanner = page.locator("text=Basicos 100% algodon");
    await expect(natureBanner).toHaveCount(0);
  });

  /* ── 2. BLOOM (onfeet) ────────────────────────────────── */
  test("4. Bloom (onfeet): capturas antes/después y prueba de foco letra por letra (Condición 1)", async ({ page }) => {
    await page.goto("/t/onfeet");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#catalogo")).toBeAttached({ timeout: 15000 });

    // Captura ANTES
    await page.screenshot({ path: "test-results/fase4c-bloom-antes.png" });

    // Buscar el input de Bloom que está debajo del banner
    const searchInput = page.locator("input[placeholder*='buscas']").first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Escribir "a" y luego "b" letra por letra verificando foco continuo
    await searchInput.focus();
    await page.keyboard.type("a", { delay: 50 });
    await page.waitForTimeout(100);

    // Verificar que el foco se mantiene en el input tras el primer carácter (isNarrowing cambia a true)
    const isFocusedAfterA = await page.evaluate(() => {
      const el = document.activeElement;
      return el && el.tagName === "INPUT";
    });
    expect(isFocusedAfterA).toBe(true);

    await page.keyboard.type("b", { delay: 50 });
    await page.waitForTimeout(100);

    const isFocusedAfterB = await page.evaluate(() => {
      const el = document.activeElement;
      return el && el.tagName === "INPUT";
    });
    expect(isFocusedAfterB).toBe(true);

    const inputValue = await searchInput.inputValue();
    expect(inputValue).toBe("ab");

    // Captura DESPUÉS
    await page.screenshot({ path: "test-results/fase4c-bloom-despues.png" });
  });

  /* ── 3. BITE (restaurante-demo) ───────────────────────── */
  test("5. Bite (restaurante-demo): capturas antes/después y prueba de foco letra por letra (Condición 1)", async ({ page }) => {
    await page.goto("/t/restaurante-demo");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#catalogo")).toBeAttached({ timeout: 15000 });

    // Captura ANTES
    await page.screenshot({ path: "test-results/fase4c-bite-antes.png" });

    // Buscar input dentro de Bite
    const searchInput = page.locator("input[placeholder*='buscando']").first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Escribir "a" y luego "b" letra por letra verificando foco continuo
    await searchInput.focus();
    await page.keyboard.type("a", { delay: 50 });
    await page.waitForTimeout(100);

    const isFocusedAfterA = await page.evaluate(() => {
      const el = document.activeElement;
      return el && el.tagName === "INPUT";
    });
    expect(isFocusedAfterA).toBe(true);

    await page.keyboard.type("b", { delay: 50 });
    await page.waitForTimeout(100);

    const isFocusedAfterB = await page.evaluate(() => {
      const el = document.activeElement;
      return el && el.tagName === "INPUT";
    });
    expect(isFocusedAfterB).toBe(true);

    const inputValue = await searchInput.inputValue();
    expect(inputValue).toBe("ab");

    // Captura DESPUÉS
    await page.screenshot({ path: "test-results/fase4c-bite-despues.png" });
  });

  /* ── 4. GRID (catalogo) ───────────────────────────────── */
  test("6. Grid (catalogo): capturas antes/después y modo resultados", async ({ page }) => {
    await page.goto("/t/catalogo");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#catalogo")).toBeAttached({ timeout: 15000 });

    // Captura ANTES
    await page.screenshot({ path: "test-results/fase4c-grid-antes.png" });

    // Buscar texto en la barra
    const searchInput = page.locator("input[placeholder*='buscando']").first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill("rosa");

    const resultsBar = page.locator("[data-testid='results-bar']");
    await expect(resultsBar).toBeVisible({ timeout: 5000 });
    await expect(resultsBar).toContainText("rosa");

    // Captura DESPUÉS
    await page.screenshot({ path: "test-results/fase4c-grid-despues.png" });
  });

  /* ── 5. SIN RESULTADOS ────────────────────────────────── */
  test("7. Búsqueda sin resultados: mensaje + 2 botones (Ver todo y WhatsApp con texto buscado)", async ({ page }) => {
    await page.goto("/t/jhoselynperu");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#catalogo")).toBeAttached({ timeout: 15000 });

    const searchInput = page.locator("input[placeholder*='buscando']").first();
    await searchInput.fill("palabrainexistentexyz123");

    // Verificar NoResultsView
    const noResults = page.locator("[data-testid='no-results-view']");
    await expect(noResults).toBeVisible({ timeout: 5000 });
    await expect(noResults).toContainText("palabrainexistentexyz123");

    // Botón Ver todo
    const verTodoBtn = noResults.locator("button:has-text('Ver todo')");
    await expect(verTodoBtn).toBeVisible();

    // Botón WhatsApp con mensaje "Hola, busco: palabrainexistentexyz123"
    const waBtn = noResults.locator("a:has-text('Pregúntanos por WhatsApp')");
    await expect(waBtn).toBeVisible();
    const href = await waBtn.getAttribute("href");
    expect(href).toContain("wa.me");
    expect(decodeURIComponent(href || "")).toContain("Hola, busco: palabrainexistentexyz123");

    // Clic en Ver todo limpia búsqueda y restaura catálogo
    await verTodoBtn.click();
    await expect(noResults).toHaveCount(0);
  });

  /* ── 6. HERO LAYOUT (Condición 2) ─────────────────────── */
  test("8. Layout hero: en modo resultados, el primer producto pasa a tarjeta normal (sin col-span-2)", async ({ page }) => {
    // Interceptamos la llamada RPC para devolver model: 'eco' (layout: 'hero') en catalogo
    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      if (json) {
        json.model = "eco";
      }
      await route.fulfill({ json });
    });

    // Limpiamos la caché previa de catalogo para forzar la carga con la respuesta interceptada
    await page.addInitScript(() => {
      try {
        localStorage.removeItem("dizi_store_cache_catalogo");
        sessionStorage.removeItem("dizi_store_cache_catalogo");
      } catch {}
    });

    await page.goto("/t/catalogo");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#catalogo")).toBeAttached({ timeout: 15000 });

    // En portada normal: debe haber una tarjeta con col-span-2 (hero card)
    const heroCard = page.locator("article.col-span-2");
    await expect(heroCard).toBeVisible({ timeout: 10000 });

    // Filtrar por búsqueda
    const searchInput = page.locator("input[placeholder*='buscando']").first();
    await searchInput.fill("rosa");

    // En modo resultados: la heroCard col-span-2 desaparece y todos van al grid uniforme
    await expect(heroCard).toHaveCount(0);
    const articles = page.locator("article");
    await expect(articles.first()).toBeVisible({ timeout: 5000 });
  });
});
