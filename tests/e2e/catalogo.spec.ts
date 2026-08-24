import { test, expect } from "@playwright/test";

test.describe("Pruebas E2E - Flujos Críticos del Catálogo y Administración", () => {
  test("E2E-01: Acceso a la página de login y validación de campos", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("E2E-02: Acceso a la página de registro", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("body")).toContainText("Crea tu catálogo");
  });

  test("E2E-03: Navegación de páginas legales y soporte", async ({ page }) => {
    await page.goto("/privacidad");
    await expect(page.locator("body")).toContainText("Privacidad");

    await page.goto("/terminos");
    await expect(page.locator("body")).toContainText("Términos");

    await page.goto("/ayuda");
    await expect(page.locator("body")).toContainText("Ayuda");
  });

  test("E2E-04: Manejo seguro de catálogos inexistentes", async ({ page }) => {
    await page.goto("/t/tienda-no-existe-xyz");
    await expect(page.locator("body")).toContainText("Tienda no encontrada");
  });

  test("E2E-05: Manejo seguro de bio-links inexistentes", async ({ page }) => {
    await page.goto("/bio/tienda-no-existe-xyz");
    await expect(page.locator("body")).toContainText("Tienda no encontrada");
  });
});
