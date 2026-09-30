import { test, expect } from "@playwright/test";

/**
 * Suite de Verificación de Producción - Fase 3 (en vivo en https://dizi.idenza.site)
 * Viewport: 360x800 (modo celular Android)
 */
test.describe("Verificación en vivo Producción - Fase 3", () => {
  test.use({
    baseURL: "https://dizi.idenza.site",
    viewport: { width: 360, height: 800 },
  });

  test("1. Landing muestra 4 tarjetas con promesas nuevas y botón 'Elegir Plan Pro' lleva a /register?plan=pro", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Verificar sección de planes y promesas canónicas
    const pricingSection = page.locator("#precios, #planes").first();
    if (await pricingSection.isVisible()) {
      await pricingSection.scrollIntoViewIfNeeded();
    }

    // Verificar presencia de nombres de los 4 planes
    await expect(page.locator("text=Semilla").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Emprendedor").first()).toBeVisible();
    await expect(page.locator("text=Pro").first()).toBeVisible();
    await expect(page.locator("text=Ilimitado").first()).toBeVisible();

    // Click en botón Elegir Plan Pro
    const btnPro = page.locator('a[href*="/register?plan=pro"]').first();
    await expect(btnPro).toBeVisible();
    await btnPro.click();

    await page.waitForURL(/\/register\?plan=pro/, { timeout: 15000 });
    expect(page.url()).toContain("plan=pro");
  });

  test("2. Flujo completo de registro ?plan=pro con tienda zz-audit, Términos y confirmación WhatsApp", async ({ page }) => {
    const slug = `zz-audit-pro-${Date.now().toString(36)}`;
    const email = `${slug}@testdizi.com`;

    await page.goto("/register?plan=pro");
    await page.waitForLoadState("domcontentloaded");

    // Paso 1: Negocio
    const nameInput = page.locator('input[placeholder="Ej. Florería María"]');
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.fill("Auditoría Plan Pro");

    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill("987654321");

    const btnPaso1 = page.getByRole("button", { name: /siguiente paso/i });
    await btnPaso1.click();

    // Paso 2: Diseño
    await page.waitForTimeout(500);
    const btnPaso2 = page.getByRole("button", { name: /siguiente paso/i });
    await expect(btnPaso2).toBeVisible({ timeout: 10000 });
    await btnPaso2.click();

    // Paso 3: Cuenta y Términos
    await page.waitForTimeout(500);
    const slugInput = page.locator('input[placeholder="floreria-maria"]');
    await expect(slugInput).toBeVisible({ timeout: 10000 });
    await slugInput.fill(slug);

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(email);

    const passInput = page.locator('input[type="password"]');
    await passInput.fill("AuditPass123!");

    // Validar casilla obligatoria de Términos (G7)
    const termsCheckbox = page.locator("#acceptTerms");
    await expect(termsCheckbox).toBeVisible();
    expect(await termsCheckbox.isChecked()).toBe(false);

    const submitBtn = page.getByRole("button", { name: /lanzar mi catálogo/i });
    await expect(submitBtn).toBeDisabled();

    // Marcar Términos
    await termsCheckbox.check();
    await expect(submitBtn).toBeEnabled();

    // Enviar registro en vivo
    await submitBtn.click();

    // Al terminar, debe mostrar la pantalla de confirmación de plan solicitado con botón de WhatsApp
    const confirmTitle = page.locator("text=¡Tu tienda ha sido creada!");
    await expect(confirmTitle).toBeVisible({ timeout: 40000 });

    // Verificar texto de plan elegido
    const planElegidoBadge = page.locator("text=/Catálogo Pro|Pro/i");
    await expect(planElegidoBadge.first()).toBeVisible();

    // Verificar botón de WhatsApp
    const waBtn = page.locator('a[href*="wa.me"]').filter({ hasText: /activar plan/i });
    await expect(waBtn).toBeVisible();
    const waHref = await waBtn.getAttribute("href");
    console.log("[E2E PROD] waHref capturado:", waHref);
    expect(waHref).toContain("wa.me");
    expect(decodeURIComponent(waHref || "")).toMatch(/activar el plan/i);
  });
});
