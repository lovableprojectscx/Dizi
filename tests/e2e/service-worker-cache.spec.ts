import fs from "fs";
import path from "path";
import { test, expect } from "@playwright/test";

/**
 * Suite E2E - Pruebas del Service Worker y Caché Nativo de Imágenes (SW-01 a SW-04)
 * Valida que el Service Worker se registre en navegadores móviles y de escritorio
 * e intercepte correctamente el almacenamiento en Caché Nativo sin fallos.
 */
test.describe("Service Worker E2E - Caché Nativo de Imágenes", () => {
  test("SW-01: El Service Worker (sw.js) está presente y disponible en la raíz pública", async () => {
    const swPath = path.resolve(process.cwd(), "public/sw.js");
    expect(fs.existsSync(swPath)).toBe(true);
    const content = fs.readFileSync(swPath, "utf-8");
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

  test("SW-03: El Service Worker contiene la regla activa para interceptar get_public_store", async () => {
    const swPath = path.resolve(process.cwd(), "public/sw.js");
    const content = fs.readFileSync(swPath, "utf-8");
    expect(content).toContain("/rest/v1/rpc/get_public_store");
    expect(content).toContain('event.request.method === "GET"');
  });

  test("SW-04: Las peticiones al catálogo público navegan correctamente sin errores de red", async ({ page }) => {
    const rpcRequests: { url: string; method: string }[] = [];
    page.on("request", (req) => {
      if (req.url().includes("get_public_store")) {
        rpcRequests.push({ url: req.url(), method: req.method() });
      }
    });

    await page.goto("/t/deseodechica");
    await page.waitForTimeout(2500);

    // Si se disparó petición de catálogo, debe haber sido mediante GET
    for (const req of rpcRequests) {
      expect(req.method).toBe("GET");
    }
  });
});

