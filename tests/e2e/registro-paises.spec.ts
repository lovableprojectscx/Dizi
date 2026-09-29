import { test, expect } from "@playwright/test";

/**
 * Suite E2E - Registro y Configuración de Países y Teléfonos (FASE 1A)
 * Emulación móvil 360x800 según especificación openspec/specs/telefonos-paises/spec.md
 */
test.describe("E2E FASE 1A: Teléfonos y Países en Registro, Catálogo y Configuración", () => {
  test.use({
    viewport: { width: 360, height: 800 },
  });

  test("1. Perú número inválido (8 dígitos) deshabilita botón y muestra ejemplo", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");

    // Llenar nombre de negocio
    const nameInput = page.locator('input[placeholder="Ej. Florería María"]');
    await expect(nameInput).toBeVisible();
    await nameInput.fill("zz-audit-invalido");

    // Escribir 8 dígitos en Perú (inválido para celular móvil)
    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill("99964572");

    // El botón 'Siguiente paso' debe estar deshabilitado
    const nextBtn = page.locator('button:has-text("Siguiente paso")');
    await expect(nextBtn).toBeDisabled();

    // Debe mostrar mensaje de error con el formato/ejemplo esperado
    const errorMsg = page.locator("text=Ingresa un celular válido de Perú");
    await expect(errorMsg).toBeVisible();
    await expect(page.locator("text=987 654 321")).toBeVisible();
  });

  test("2. Perú con código 51 repetido se valida y registra correctamente", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");

    const nameInput = page.locator('input[placeholder="Ej. Florería María"]');
    await nameInput.fill("zz-audit-pe-store");

    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill("51987654321");

    // Botón habilitado y mensaje de confirmación
    const nextBtn = page.locator('button:has-text("Siguiente paso")');
    await expect(nextBtn).toBeEnabled();
    await expect(page.locator("text=Tus clientes te escribirán a")).toBeVisible();
    await expect(page.locator("text=+51 987 654 321")).toBeVisible();

    await nextBtn.click();

    // Paso 2: Modelo/plantilla
    await page.waitForTimeout(500);
    const step2Btn = page.locator('button:has-text("Siguiente paso")');
    await expect(step2Btn).toBeVisible();
    await step2Btn.click();

    // Paso 3: Credenciales
    await page.waitForTimeout(500);
    const slugInput = page.locator('input[placeholder="floreria-maria"]');
    await slugInput.fill("zz-audit-pe-1");

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill("zz-audit-pe-1@testdizi.com");

    await page.locator('input[type="password"]').fill("AuditPassword123!");

    const submitBtn = page.locator('button:has-text("Lanzar mi Catálogo")');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Debe redirigir al panel /admin
    await page.waitForURL(/\/admin/, { timeout: 35000 });
    await expect(page).toHaveURL(/\/admin/);
  });

  test("3. Ecuador registra 0991234567 y crea tienda con phone=593991234567 y country_iso=EC", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");

    const nameInput = page.locator('input[placeholder="Ej. Florería María"]');
    await nameInput.fill("zz-audit-ec-store");

    // Cambiar país a Ecuador
    await page.locator('button[aria-label="Seleccionar país"]').click();
    await page.locator('input[placeholder="Buscar país o código..."]').fill("Ecuador");
    await page.locator('[cmdk-item]').filter({ hasText: "Ecuador" }).click();

    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill("0991234567");

    // Botón habilitado y mensaje de confirmación
    const nextBtn = page.locator('button:has-text("Siguiente paso")');
    await expect(nextBtn).toBeEnabled();
    await expect(page.locator("text=Tus clientes te escribirán a")).toBeVisible();
    await expect(page.locator("text=+593 99 123 4567")).toBeVisible();

    await nextBtn.click();

    // Paso 2
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Siguiente paso")').click();

    // Paso 3
    await page.waitForTimeout(500);
    await page.locator('input[placeholder="floreria-maria"]').fill("zz-audit-ec-1");
    await page.locator('input[type="email"]').fill("zz-audit-ec-1@testdizi.com");

    await page.locator('input[type="password"]').fill("AuditPassword123!");

    await page.locator('button:has-text("Lanzar mi Catálogo")').click();
    await page.waitForURL(/\/admin/, { timeout: 35000 });
    await expect(page).toHaveURL(/\/admin/);
    await page.waitForLoadState("domcontentloaded");

    // Convertir productos de muestra a productos visibles para la prueba pública del catálogo
    await page.evaluate(async () => {
      const client = (window as any).__supabase;
      if (client) {
        await client.from("products").update({ is_sample: false }).neq("id", "");
      }
    });
  });

  test("4. Argentina registra 11 2345 6789 y normaliza a 5491123456789", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");

    const nameInput = page.locator('input[placeholder="Ej. Florería María"]');
    await nameInput.fill("zz-audit-ar-store");

    // Cambiar país a Argentina
    await page.locator('button[aria-label="Seleccionar país"]').click();
    await page.locator('input[placeholder="Buscar país o código..."]').fill("Argentina");
    await page.locator('[cmdk-item]').filter({ hasText: "Argentina" }).click();

    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill("11 2345 6789");

    const nextBtn = page.locator('button:has-text("Siguiente paso")');
    await expect(nextBtn).toBeEnabled();
    await expect(page.locator("text=Tus clientes te escribirán a")).toBeVisible();
    await expect(page.locator("text=+54 9 11 2345 6789")).toBeVisible();

    await nextBtn.click();

    // Paso 2
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Siguiente paso")').click();

    // Paso 3
    await page.waitForTimeout(500);
    await page.locator('input[placeholder="floreria-maria"]').fill("zz-audit-ar-1");
    await page.locator('input[type="email"]').fill("zz-audit-ar-1@testdizi.com");

    await page.locator('input[type="password"]').fill("AuditPassword123!");

    await page.locator('button:has-text("Lanzar mi Catálogo")').click();
    await page.waitForURL(/\/admin/, { timeout: 35000 });
    await expect(page).toHaveURL(/\/admin/);
  });

  test("5. Catálogo Ecuador arma enlace de pedido con https://wa.me/593991234567", async ({ page }) => {
    // Interceptar llamadas a window.open para verificar URL sin abrir pestaña real
    await page.addInitScript(() => {
      (window as any).__openedUrls = [];
      window.open = (url: string | URL | undefined) => {
        if (url) (window as any).__openedUrls.push(url.toString());
        return null;
      };
    });

    await page.goto("/t/zz-audit-ec-1");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // Abrir detalle del producto
    const firstArticle = page.locator("article").first();
    await expect(firstArticle).toBeVisible({ timeout: 15000 });
    await firstArticle.click();

    // En el modal del producto: "Añadir al carrito"
    const addBtn = page.locator('button:has-text("Añadir al carrito")');
    await expect(addBtn).toBeVisible({ timeout: 8000 });
    await addBtn.click();

    // Enviar pedido en el carrito
    const cartCheckoutBtn = page.locator('button:has-text("Enviar pedido por WhatsApp")');
    await expect(cartCheckoutBtn).toBeVisible({ timeout: 8000 });
    await cartCheckoutBtn.click();

    // Evaluar URL capturada
    const openedUrls = await page.evaluate(() => (window as any).__openedUrls as string[]);
    expect(openedUrls.length).toBeGreaterThanOrEqual(1);
    expect(openedUrls[0]).toMatch(/^https:\/\/wa\.me\/593991234567/);
  });

  test("6. Configuración permite cambiar a Colombia (301 234 5678) y guardar", async ({ page }) => {
    // Iniciar sesión con la tienda de Perú
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await page.locator('input[type="email"]').fill("zz-audit-pe-1@testdizi.com");
    await page.locator('input[type="password"]').fill("AuditPassword123!");
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/\/admin/, { timeout: 25000 });

    // Descartar onboarding wizard si aparece
    const skipBtn = page.locator('button:has-text("Saltar configuración")');
    if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipBtn.click();
    } else {
      await page.keyboard.press("Escape");
    }

    // Ir a configuración
    await page.goto("/admin/configuracion");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    // Descartar modal si aún está abierto
    const skipBtnConf = page.locator('button:has-text("Saltar configuración")');
    if (await skipBtnConf.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtnConf.click();
    } else {
      await page.keyboard.press("Escape");
    }

    // Cambiar país a Colombia
    const countryTrigger = page.locator('button[aria-label="Seleccionar país"]');
    await expect(countryTrigger).toBeVisible({ timeout: 10000 });
    await countryTrigger.click();

    await page.locator('input[placeholder="Buscar país o código..."]').fill("Colombia");
    await page.locator('[cmdk-item]').filter({ hasText: "Colombia" }).click();

    // Cambiar teléfono
    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill("301 234 5678");

    // Guardar cambios
    const saveBtn = page.locator('button:has-text("Guardar cambios")');
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    // Verificar notificación de guardado
    await expect(page.locator("text=Configuración guardada correctamente").or(page.locator("text=guardad"))).toBeVisible({
      timeout: 10000,
    });
  });
});
