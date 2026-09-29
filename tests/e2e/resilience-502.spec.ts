import { test, expect } from "@playwright/test";

test.describe("B7 · Resiliencia ante Supabase 502 e intermitencias de red", () => {
  test("Caso 1: get_public_store responde 502 dos veces y 200 a la tercera -> carga sin mostrar error", async ({ page }) => {
    let callCount = 0;
    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      callCount++;
      if (callCount <= 2) {
        // Responder 502 Bad Gateway las 2 primeras veces
        await route.fulfill({
          status: 502,
          contentType: "application/json",
          body: JSON.stringify({ message: "Bad Gateway", code: "502" }),
        });
      } else {
        // A la tercera vez, continuar con la respuesta real de Supabase
        await route.continue();
      }
    });

    await page.goto("/t/catalogo");

    // Verificar que el catálogo cargó exitosamente y se ve el nombre de la tienda
    await expect(page.locator("body")).toContainText("ADORNIA", { timeout: 15000 });
    // Verificar que nunca se mostró la pantalla de error
    await expect(page.locator("text=No pudimos cargar el catálogo")).not.toBeVisible();
    await expect(page.locator("text=Error de Conexión")).not.toBeVisible();
  });

  test("Caso 2: get_public_store responde 502 siempre pero con copia guardada -> muestra catálogo y franja discreta", async ({ page }) => {
    // 1. Inyectar copia previa en localStorage
    await page.addInitScript(() => {
      const mockStore = {
        id: "mock-cache-id",
        slug: "demo-guardada",
        name: "Tienda en Caché",
        active: true,
        phone: "51999888777",
        countryCode: "51",
        countryIso: "PE",
        plan: "semilla",
        categories: [],
        products: [
          {
            id: "prod-cached-1",
            name: "Producto Guardado en Memoria",
            price: 59.9,
            categoryId: "cat-1",
            visible: true,
            isSample: false,
          },
        ],
      };
      const cacheData = {
        store: mockStore,
        updated_at: new Date().toISOString(),
        ts: Date.now(),
        verifiedAt: Date.now(),
      };
      localStorage.setItem("dizi_store_cache_demo-guardada", JSON.stringify(cacheData));
    });

    // 2. Interceptar todas las llamadas para responder 502
    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      await route.fulfill({
        status: 502,
        contentType: "application/json",
        body: JSON.stringify({ message: "Bad Gateway", code: "502" }),
      });
    });

    await page.goto("/t/demo-guardada");

    // El catálogo se muestra de inmediato gracias a la copia en caché
    await expect(page.locator("body")).toContainText("Tienda en Caché", { timeout: 5000 });
    await expect(page.locator("body")).toContainText("Producto Guardado en Memoria");

    // Al fallar el refresco en segundo plano tras los reintentos, aparece la franja discreta
    const banner = page.locator('[data-testid="cached-version-banner"]');
    await expect(banner).toBeVisible({ timeout: 15000 });
    await expect(banner).toContainText("Mostrando la última versión guardada");
  });

  test("Caso 3: get_public_store responde 502 siempre sin copia guardada -> mensaje neutro y botón Reintentar", async ({ page }) => {
    // Interceptar todas las llamadas a Supabase para responder 502
    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      await route.fulfill({
        status: 502,
        contentType: "application/json",
        body: JSON.stringify({ message: "Bad Gateway", code: "502" }),
      });
    });

    await page.goto("/t/sin-cache-502");

    // Debe mostrar la pantalla de error neutro
    await expect(page.getByRole("heading", { name: "No pudimos cargar el catálogo" })).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=No pudimos cargar el catálogo. Revisa tu conexión y vuelve a intentar.")).toBeVisible();
    await expect(page.locator("button:has-text('Reintentar')")).toBeVisible();
    // No debe culpar a Movistar/Claro cuando es un error 502 del servidor
    await expect(page.locator("text=Movistar")).not.toBeVisible();
  });
});
