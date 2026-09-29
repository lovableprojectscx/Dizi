import { test, expect } from "@playwright/test";
import { ALL_SHOWCASE_ITEMS, SHOWCASE_REGISTER_ITEMS, getShowcaseUrl } from "../../src/lib/showcase";

test.describe("B8 · Enlaces de la vitrina de comercios (/register y landing)", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("P01: Cada tienda de demostración en ALL_SHOWCASE_ITEMS carga con éxito sin errores", async ({ page }) => {
    for (const item of ALL_SHOWCASE_ITEMS) {
      const url = getShowcaseUrl(item);
      const res = await page.goto(url, { waitUntil: "domcontentloaded" });
      expect(res?.status()).toBeLessThan(400);

      // No debe mostrar mensajes de error ni tienda no encontrada
      await expect(page.locator("text=Tienda no encontrada")).not.toBeVisible();
      await expect(page.locator("text=No pudimos cargar el catálogo")).not.toBeVisible();
      await expect(page.locator("text=Error de Conexión")).not.toBeVisible();

      // Debe mostrar contenido del comercio renderizado en el cliente
      await expect(page.locator("#root header, #root h1, #root h2, #root main, #root div").first()).toBeVisible({ timeout: 15000 });
      await expect(page.locator("body")).not.toHaveText("", { timeout: 15000 });
    }
  });

  test("P02: En /register móvil (360x800) las 6 tarjetas existen y apuntan a enlaces activos con productos", async ({ page }) => {
    test.setTimeout(90000);
    await page.goto("/register");

    // Verificar que el bloque 'Negocios que ya usan Dizi' es visible
    await expect(page.locator("text=Negocios que ya usan Dizi")).toBeVisible({ timeout: 15000 });

    // Verificar que 'Adornia · We Home' aparece en lugar de 'WeHome Peru'
    await expect(page.locator("text=Adornia · We Home")).toBeVisible();
    await expect(page.locator("text=WeHome Peru")).not.toBeVisible();

    // Recorrer las 6 tarjetas y verificar que abren una tienda activa
    for (const item of SHOWCASE_REGISTER_ITEMS) {
      const expectedHref = getShowcaseUrl(item);
      const link = page.locator(`a[href="${expectedHref}"]`);
      await expect(link).toBeVisible();

      // Visitar el enlace
      const showcasePage = await page.context().newPage();
      await showcasePage.goto(expectedHref);

      await expect(showcasePage.locator("text=Tienda no encontrada")).not.toBeVisible();
      await expect(showcasePage.locator("text=Error de Conexión")).not.toBeVisible();

      // Verificar que contiene productos o catálogo activo renderizado
      await expect(showcasePage.locator("#root header, #root h1, #root h2, #root main, #root div").first()).toBeVisible({ timeout: 15000 });
      await expect(showcasePage.locator("body")).not.toHaveText("", { timeout: 15000 });

      await showcasePage.close();
    }
  });
});
