import { test, expect } from "@playwright/test";

/**
 * Suite E2E - Verificación en celular (360x800) de:
 * 1. Registro: avance por pasos y casilla obligatoria de Términos (G7)
 * 2. Registro con ?invite= (emprendedor) + ?plan=pro: prevalencia de invitación y términos
 */
test.describe("Registro en modo celular: planes solicitados, invitaciones y términos", () => {
  test.use({
    viewport: { width: 360, height: 800 },
  });

  test("1. Registro con ?plan=pro: valida flujo de pasos y casilla de términos obligatoria", async ({ page }) => {
    await page.goto("/register?plan=pro");
    await page.waitForLoadState("domcontentloaded");

    // Paso 1: completar datos de la tienda
    const nameInput = page.locator('input[placeholder="Ej. Florería María"]');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill("Boutique Celular Test");

    const phoneInput = page.locator('input[type="tel"]');
    await expect(phoneInput).toBeVisible();
    await phoneInput.fill("987654321");

    // Continuar a Paso 2 (Diseño)
    const btnPaso2 = page.getByRole("button", { name: /siguiente paso/i });
    await expect(btnPaso2).toBeVisible();
    await btnPaso2.click();

    // En paso 2, continuar a Paso 3
    const btnPaso3 = page.getByRole("button", { name: /siguiente paso/i });
    await expect(btnPaso3).toBeVisible({ timeout: 5000 });
    await btnPaso3.click();

    // En paso 3 (Credenciales y Términos):
    // Debe existir la casilla de Términos y Condiciones obligatoria (G7)
    const termsCheckbox = page.locator("#acceptTerms");
    await expect(termsCheckbox).toBeVisible({ timeout: 5000 });

    const termsLabel = page.locator("text=Acepto los");
    await expect(termsLabel.first()).toBeVisible();

    // El botón de submit debe estar deshabilitado hasta marcar los términos
    const submitBtn = page.getByRole("button", { name: /lanzar mi catálogo/i });
    await expect(submitBtn).toBeDisabled();

    // Al marcar los términos, se habilita el botón
    await termsCheckbox.check();
    await expect(submitBtn).toBeEnabled();
  });

  test("2. Registro con ?invite=(emprendedor) + ?plan=pro: muestra banner de invitación activo", async ({ page }) => {
    // Mockear check_invite para responder invitación de plan emprendedor
    await page.route("**/rest/v1/rpc/check_invite*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            plan: "emprendedor",
            duration_months: 1,
            duration_unit: "months",
            duration_value: 1,
            custom_price: null,
            notes: "Invitacion de prueba",
          },
        ]),
      });
    });

    await page.goto("/register?invite=inv-emprendedor-123&plan=pro");
    await page.waitForLoadState("domcontentloaded");

    // Debe mostrar la bienvenida del plan invitado
    const inviteBanner = page.locator("text=/Invitación activa: Plan EMPRENDEDOR/i");
    await expect(inviteBanner.first()).toBeVisible({ timeout: 5000 });
  });
});
