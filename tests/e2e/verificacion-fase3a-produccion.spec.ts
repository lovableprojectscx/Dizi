import { test, expect } from "@playwright/test";

test.describe("Fase 3A: Verificación Integral en Producción Viva", () => {
  test.use({
    baseURL: "https://dizi.idenza.site",
    viewport: { width: 360, height: 800 },
  });

  const AUDIT_SLUG = `zz-audit-f3a-${Date.now().toString().slice(-4)}`;
  const AUDIT_EMAIL = `${AUDIT_SLUG}@testdizi.com`;
  const AUDIT_PASS = "AuditPass123!";

  test("Registro nuevo nace con 0 productos, estado vacío en admin y catálogo público en preparación", async ({ page }) => {
    // 1. Ir al registro
    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");

    // Paso 1: Datos del negocio
    const nameInput = page.locator('input[placeholder="Ej. Florería María"]');
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    await nameInput.fill(`Tienda ${AUDIT_SLUG}`);

    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill("912 345 678");

    const step1Next = page.locator('button:has-text("Siguiente paso")');
    await expect(step1Next).toBeEnabled();
    await step1Next.click();

    // Paso 2: Selección de diseño
    await page.waitForTimeout(600);
    const step2Next = page.locator('button:has-text("Siguiente paso")');
    await expect(step2Next).toBeVisible();
    await step2Next.click();

    // Paso 3: Cuenta y Términos
    await page.waitForTimeout(600);
    const slugInput = page.locator('input[placeholder="floreria-maria"]');
    await expect(slugInput).toBeVisible();
    await slugInput.fill(AUDIT_SLUG);

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(AUDIT_EMAIL);

    const passInput = page.locator('input[type="password"]');
    await passInput.fill(AUDIT_PASS);

    const termsCheckbox = page.locator("#acceptTerms");
    await expect(termsCheckbox).toBeVisible();
    await termsCheckbox.check();

    const submitBtn = page.locator('button:has-text("Lanzar mi Catálogo")');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Redirección al panel
    await page.waitForURL(/\/admin/, { timeout: 35000 });
    await expect(page).toHaveURL(/\/admin/);

    // Cerrar asistente de bienvenida si aparece
    await page.waitForTimeout(1000);
    const closeWizard = page.locator('button[aria-label="Cerrar"], button:has-text("Cerrar"), button:has-text("Saltar")').first();
    if (await closeWizard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await closeWizard.click({ force: true });
    }

    // Ir a /admin/productos
    await page.goto("/admin/productos");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    // 2. Verificar estado vacío en /admin/productos
    await expect(page.locator("text=Aún no tienes productos")).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Carga Rápida por Fotos")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Nuevo Producto")').first()).toBeVisible();

    // 3. Verificar /t/<slug>
    await page.goto(`/t/${AUDIT_SLUG}`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("text=Esta tienda está preparando su catálogo")).toBeVisible({ timeout: 10000 });
    await expect(page.locator('a:has-text("Contactar por WhatsApp")')).toBeVisible();

    // Verificar que NO existe pastilla flotante
    const floatingBadge = page.locator(".fixed.bottom-4:has-text('Crea tu catálogo gratis con')");
    await expect(floatingBadge).not.toBeVisible();

    // 4. Verificar /bio/<slug>
    await page.goto(`/bio/${AUDIT_SLUG}`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("text=Esta tienda está preparando su catálogo")).toBeVisible({ timeout: 10000 });
    await expect(page.locator('a:has-text("Contactar por WhatsApp")')).toBeVisible();
    await expect(floatingBadge).not.toBeVisible();

    console.log(`[VERIFICADO EN VIVO] Tienda creada: ${AUDIT_SLUG} con 0 productos y estados vacíos correctos.`);
  });
});
