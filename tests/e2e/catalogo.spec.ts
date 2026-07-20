import { test, expect } from "@playwright/test";

test.describe("Pruebas E2E - Flujos Críticos del Catálogo y Administración", () => {
  test("E2E-01: Publicar catálogo y visualizar productos y diseño", async ({ page }) => {
    // 1. Iniciar sesión como administrador
    await page.goto("/login");
    await page.fill('input[type="email"]', "owner@tiendademo.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/admin/productos");

    // 2. Publicar catálogo
    await page.goto("/admin/configuracion");
    await page.click("#toggle-published");
    await page.click("#save-config");
    await expect(page.locator(".toast-success")).toBeVisible();

    // 3. Acceder al catálogo público (/t/:slug)
    await page.goto("/t/tienda-demo");

    // Verificar que los productos, precios y diseño seleccionado sean visibles
    await expect(page.locator(".product-card")).toHaveCount(3);
    await expect(page.locator(".product-price").first()).toContainText("S/");
    await expect(page.locator(".catalog-header")).toBeVisible();
  });

  test("E2E-02: Registro de tienda por invitación", async ({ page }) => {
    // Caso de éxito con token de invitación válido
    await page.goto("/register?token=invite-valido-123");
    await page.fill("#store-name", "Mi Tienda Nueva");
    await page.fill("#store-slug", "tienda-nueva");
    await page.fill("#owner-email", "newowner@gmail.com");
    await page.fill("#owner-password", "securePassword123");
    await page.click("#btn-register");

    // Debe redireccionar al dashboard de onboarding completado
    await expect(page).toHaveURL("/admin/onboarding");

    // Caso de error con token vencido o inválido
    await page.goto("/register?token=token-expirado");
    await expect(page.locator(".alert-error")).toContainText("Invitación inválida o expirada");
  });

  test("E2E-03: Crear pedido y enviar por WhatsApp", async ({ page }) => {
    await page.goto("/t/tienda-demo");

    // Añadir producto al carrito
    await page.click(".btn-add-to-cart:nth-child(1)");
    await page.click(".btn-add-to-cart:nth-child(2)");

    // Abrir el carrito y llenar datos del pedido
    await page.click("#btn-open-cart");
    await page.fill("#client-name", "Juan Pérez");
    await page.fill("#client-notes", "Enviar por la tarde");

    // Interceptar la redirección externa a WhatsApp (wa.me)
    const popupPromise = page.waitForEvent("popup");
    await page.click("#btn-send-whatsapp");
    const popup = await popupPromise;

    // Validar que se intente abrir la URL de wa.me con el texto del pedido codificado
    expect(popup.url()).toContain("https://wa.me/51966123456");
    expect(popup.url()).toContain("text=");
    expect(popup.url()).toContain("Juan%20P%C3%A9rez");
  });

  test("E2E-04: Registrar reclamo en Libro de Reclamaciones y responder desde administración", async ({
    page,
  }) => {
    // 1. Consumidor entra al catálogo y abre el Libro de Reclamaciones (1 click en el footer)
    await page.goto("/t/tienda-demo");
    await page.click("#btn-libro-reclamaciones");
    await expect(page.locator("#modal-reclamaciones")).toBeVisible();

    // 2. Llenar paso 1 (Consumidor)
    await page.fill("#consumidor-nombre", "Carlos Martínez");
    await page.selectOption("#consumidor-tipo-doc", "DNI");
    await page.fill("#consumidor-num-doc", "77665544");
    await page.fill("#consumidor-email", "carlos@gmail.com");
    await page.click("#btn-next-step");

    // 3. Llenar paso 2 (Detalle del reclamo)
    await page.fill("#bien-descripcion", "Compra de Laptop");
    await page.fill("#bien-monto", "3500");
    await page.click('input[value="reclamo"]'); // Tipo Reclamo
    await page.fill("#reclamo-descripcion", "La pantalla vino rayada");
    await page.fill("#reclamo-pedido", "Cambio del producto");
    await page.click("#btn-submit-reclamacion");

    // 4. Se genera el ticket digital correlativo
    await expect(page.locator("#lr-ticket")).toBeVisible();
    await expect(page.locator("#ticket-correlativo")).toContainText("N°");

    // 5. El comerciante inicia sesión para responder al reclamo
    await page.goto("/login");
    await page.fill('input[type="email"]', "owner@tiendademo.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Ir al panel de Reclamaciones
    await page.goto("/admin/reclamaciones");
    await expect(page.locator(".reclamo-row")).toHaveCount(1);
    await page.click(".reclamo-row:nth-child(1)"); // Expandir

    // Escribir respuesta y resolver reclamo
    await page.fill("#respuesta-proveedor", "Se coordinó cambio de equipo para el 10 de julio.");
    await page.selectOption("#estado-reclamo", "resuelto");
    await page.click("#btn-save-respuesta");

    await expect(page.locator(".toast-success")).toBeVisible();
  });

  test("E2E-05: Restricción de Bio-Link y funciones premium según plan", async ({ page }) => {
    // 1. Iniciar sesión con un usuario que tiene Plan Semilla (gratuito)
    await page.goto("/login");
    await page.fill('input[type="email"]', "semilla@tiendademo.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // 2. Ir a la edición de Bio-Link
    await page.goto("/admin/bio-link");

    // 3. Comprobar que las funciones premium (fondos personalizados) están deshabilitadas
    const premiumBgInput = page.locator("#bio-premium-background");
    await expect(premiumBgInput).toBeDisabled();

    // 4. Comprobar que hay una invitación (Upgrade call-to-action)
    await expect(page.locator(".upgrade-cta")).toBeVisible();
  });
});
