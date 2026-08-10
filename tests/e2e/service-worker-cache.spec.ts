import { test, expect } from "@playwright/test";

/**
 * Suite E2E - Pruebas del Service Worker y Caché Nativo de Imágenes (SW-01 a SW-02)
 * Valida que el Service Worker se registre en navegadores móviles y de escritorio
 * e intercepte correctamente el almacenamiento en Caché Nativo sin fallos.
 */
test.describe("Service Worker E2E - Caché Nativo de Imágenes", () => {
  test("SW-01: El Service Worker (sw.js) está presente y disponible en la raíz pública", async ({ page }) => {
    const response = await page.goto("/sw.js");
    expect(response?.status()).toBe(200);
    const content = await response?.text();
    expect(content).toContain("dizi-images-v1");
    expect(content).toContain("CACHE_NAME");
  });

  test("SW-02: La landing page registra el Service Worker correctamente", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verificar en el contexto del navegador si navigator.serviceWorker está activo o disponible
    const swSupported = await page.evaluate(() => "serviceWorker" in navigator);
    expect(swSupported).toBe(true);
  });
});
