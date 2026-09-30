import { test, expect } from "@playwright/test";

/**
 * Suite E2E - D6.5: Invitación no válida o expirada en el registro
 * Emulación móvil 360x800 según especificación
 */
test.describe("E2E D6.5: Aviso visible de invitación inválida o vencida en /register", () => {
  test.use({
    viewport: { width: 360, height: 800 },
  });

  test("Muestra aviso claro cuando el token de invitación no existe o está vencido", async ({ page }) => {
    // Mockear la respuesta de la RPC check_invite para asegurar retorno vacío (invitación inválida/vencida)
    await page.route("**/rest/v1/rpc/check_invite*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/register?invite=token-inexistente-o-expirado");
    await page.waitForLoadState("domcontentloaded");

    // Verificar que aparece el mensaje explícito en pantalla
    const banner = page.locator("text=Esta invitación ya no es válida. Puedes crear tu tienda gratis igual.");
    await expect(banner.first()).toBeVisible({ timeout: 5000 });

    // Verificar que el usuario no queda bloqueado y puede ingresar datos para su tienda gratis
    const nameInput = page.locator('input[placeholder="Ej. Florería María"]');
    await expect(nameInput).toBeVisible();
    await nameInput.fill("Mi Tienda Gratis");
    await expect(nameInput).toHaveValue("Mi Tienda Gratis");
  });
});
