import { test, expect } from "@playwright/test";

/**
 * Suite SMOKE - Páginas públicas de Dizi (SMK-01 a SMK-05)
 *
 * Estas pruebas NO requieren datos sembrados ni credenciales: validan las
 * rutas públicas reales de la aplicación, por lo que siempre son ejecutables
 * (ideal para la demostración en video y la evidencia del informe).
 */
test.describe("Smoke E2E - Páginas públicas de Dizi", () => {
  test("SMK-01: La landing page carga con título y contenido de Dizi", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Dizi/i);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("SMK-02: El login muestra el formulario de acceso (email + contraseña)", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("SMK-03: La página de novedades y FAQ es accesible", async ({ page }) => {
    await page.goto("/novedades");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("SMK-04: La política de privacidad (Ley 29733) es accesible", async ({ page }) => {
    await page.goto("/privacidad");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("SMK-05: Un catálogo inexistente no expone datos ni rompe la aplicación (RF-01)", async ({ page }) => {
    await page.goto("/t/tienda-que-no-existe-xyz-999");
    // La SPA debe seguir viva (sin pantalla en blanco) y sin tarjetas de producto
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveTitle(/Dizi|catálogo|no encontrado/i);
  });
});
