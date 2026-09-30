import { test, expect } from "@playwright/test";

/**
 * Verificación en vivo de Hotfix /admin/link-bio en producción (https://dizi.idenza.site)
 * en emulación celular (Pixel 7 / 360x800).
 */

const TEST_TIMESTAMP = Date.now();
const AUDIT_EMAIL = `zz-audit-hotfix-${TEST_TIMESTAMP}@idanza.site`;
const AUDIT_PASSWORD = "AuditPassword123!";
const AUDIT_SLUG = `zz-audit-hotfix-${TEST_TIMESTAMP}`;
const AUDIT_STORE_NAME = `Audit Hotfix ${TEST_TIMESTAMP}`;
const AUDIT_PHONE = "987654321";

test.describe("Hotfix Producción: Verificación de /admin/link-bio en modo celular", () => {
  test.use({
    baseURL: "https://dizi.idenza.site",
    viewport: { width: 360, height: 800 },
    isMobile: true,
    hasTouch: true,
  });

  test("Registro, navegación a /admin/link-bio, visualización de enlaces y guardado", async ({
    page,
  }) => {
    test.setTimeout(60000);

    // 1. Registro en producción
    console.log("[Hotfix Prod] Registrando tienda de prueba en https://dizi.idenza.site/register...");
    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");

    const nameInput = page.locator('input[placeholder="Ej. Florería María"]');
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    await nameInput.fill(AUDIT_STORE_NAME);

    const phoneInput = page.locator('input[type="tel"]');
    await expect(phoneInput).toBeVisible({ timeout: 10000 });
    await phoneInput.fill(AUDIT_PHONE);

    const nextBtn1 = page.locator('button:has-text("Siguiente paso")');
    await expect(nextBtn1).toBeEnabled();
    await nextBtn1.click();

    const nextBtn2 = page.locator('button:has-text("Siguiente paso")');
    await expect(nextBtn2).toBeVisible({ timeout: 10000 });
    await nextBtn2.click();

    const slugInput = page.locator('input[placeholder="floreria-maria"]');
    await expect(slugInput).toBeVisible({ timeout: 10000 });
    await slugInput.fill(AUDIT_SLUG);

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill(AUDIT_EMAIL);

    const passInput = page.locator('input[type="password"]');
    await expect(passInput).toBeVisible({ timeout: 10000 });
    await passInput.fill(AUDIT_PASSWORD);

    const submitBtn = page.locator('button:has-text("Lanzar mi Catálogo")');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    await page.waitForURL(/\/admin/, { timeout: 35000 });
    console.log("[Hotfix Prod] Registro exitoso. URL:", page.url());

    // Dismiss onboarding modal if open
    await page.waitForTimeout(1000);
    if (await page.locator('[role="dialog"]').isVisible().catch(() => false)) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }

    // 2. Navegar a /admin/link-bio
    console.log("[Hotfix Prod] Navegando a /admin/link-bio...");
    await page.goto("/admin/link-bio");
    await page.waitForLoadState("domcontentloaded");

    if (await page.locator('[role="dialog"]').isVisible().catch(() => false)) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }

    // Comprobar que NO aparece pantalla de error "Esta página no pudo cargarse"
    const errorHeading = page.locator("text=Esta página no pudo cargarse");
    await expect(errorHeading).not.toBeVisible();

    // Comprobar que carga la cabecera del módulo Link-in-Bio
    const bioTitle = page.locator("text=Enlace en Bio").or(page.locator("text=Bio-Link")).first();
    await expect(bioTitle).toBeVisible({ timeout: 15000 });
    console.log("[Hotfix Prod] /admin/link-bio cargó exitosamente sin errores de runtime.");

    // Activar Bio-Link si no está activo
    const bioSwitch = page.locator('button[role="switch"]').first();
    await expect(bioSwitch).toBeVisible({ timeout: 10000 });
    const isChecked = await bioSwitch.getAttribute("aria-checked");
    if (isChecked === "false") {
      await bioSwitch.click();
      await page.waitForTimeout(500);
    }

    // Verificar que se ven los enlaces y el WhatsApp vinculado automáticamente
    const waInfo = page.locator("text=WhatsApp vinculado automáticamente").first();
    await expect(waInfo).toBeVisible({ timeout: 10000 });
    console.log("[Hotfix Prod] Enlace de WhatsApp vinculado automáticamente visible.");

    // Modificar un campo y guardar cambios
    console.log("[Hotfix Prod] Modificando presentación corta y guardando cambios...");
    const bioDescTextarea = page.locator("textarea").first();
    await expect(bioDescTextarea).toBeVisible({ timeout: 10000 });
    await bioDescTextarea.fill("Bienvenidos a mi tienda oficial en Dizi. Link-in-Bio verificado.");

    const saveBtn = page.locator('button:has-text("Guardar cambios")').first();
    await expect(saveBtn).toBeVisible({ timeout: 10000 });
    await saveBtn.click();

    // Confirmación visual de éxito
    const toastSuccess = page.locator("text=guardad").or(page.locator("text=Guardad")).first();
    await expect(toastSuccess).toBeVisible({ timeout: 15000 });
    console.log("[Hotfix Prod] Cambios de Link-in-Bio guardados exitosamente con toast de confirmación.");
  });
});
