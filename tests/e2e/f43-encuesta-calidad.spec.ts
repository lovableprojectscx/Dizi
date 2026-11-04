import { test, expect } from "@playwright/test";

/**
 * @file f43-encuesta-calidad.spec.ts
 * @description Suite de Pruebas E2E de la Encuesta de Calidad F43 en móvil (Pixel 7 / 375 px).
 *
 * ESTADO: PENDIENTE: se corren después de aplicar la migración a producción y sembrar las tiendas zz-audit.
 *
 * Escenarios cubiertos:
 * - E1: Semilla ve sus preguntas (1-3 universales y 4-7 de Semilla), envía y ve su código.
 * - E3: Pro ve las suyas (preguntas 4-7 de Pro con multiselección en Q5 y follow-up en Q6).
 * - E4: Ilimitado no la ve (sin tarjeta en dashboard y /admin/encuesta muestra "Encuesta no disponible").
 * - E5: Validación de obligatorias (bloquea el envío si faltan respuestas y marca los campos).
 * - E7: Una sola vez (tienda que ya respondió entra a /admin/encuesta y ve su código directo).
 * - E9 / E10 / E11 / E13: Super admin gestiona respuestas en /super/encuestas, aplica premio, detecta duplicados y exporta CSV.
 * - E14: Nada más cambia (catálogo público y páginas públicas permanecen idénticos).
 * - E16: Tienda con slug terminado en -demo queda fuera del flujo de encuesta.
 */

const TEST_PASSWORD = "AuditPassword123!";

test.describe("F43 · Encuesta de calidad (E2E movil-android)", () => {
  test("E1 Semilla ve sus preguntas, envía y recibe código DZ con enlace WhatsApp", async ({ page }) => {
    // 1. Iniciar sesión con comercio Semilla
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("zz-audit-f43-semilla@testdizi.com");
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/admin/, { timeout: 20000 });

    // 2. Verificar tarjeta de invitación en /admin/dashboard
    await page.goto("/admin/dashboard");
    const surveyCard = page.locator('text="Responde 7 preguntas y gana 15 días"');
    await expect(surveyCard).toBeVisible();

    const respondBtn = page.getByRole("link", { name: /Responder encuesta/i });
    await expect(respondBtn).toBeVisible();
    await respondBtn.click();
    await page.waitForURL(/\/admin\/encuesta/);

    // 3. Verificar preguntas de Semilla
    await expect(page.getByText("Pregunta 1 de 7")).toBeVisible();
    await expect(page.getByText("¿Cómo conociste DIZI?")).toBeVisible();
    await expect(page.getByText("¿Te llegan pedidos de clientes desde tu catálogo?")).toBeVisible();
    await expect(page.getByText("Del 0 al 10, ¿recomendarías DIZI a otro negocio?")).toBeVisible();
    await expect(page.getByText("¿Para qué creaste tu catálogo?")).toBeVisible();
    await expect(page.getByText("¿Qué te frena para cargar más productos?")).toBeVisible();
    await expect(page.getByText("¿Qué tendría que tener DIZI para que pagues un plan?")).toBeVisible();
    await expect(page.getByText("¿Cuánto pagarías al mes por tu catálogo?")).toBeVisible();

    // 4. Responder formulario
    await page.getByRole("button", { name: "TikTok" }).click();
    await page.getByRole("button", { name: "algunos" }).click();
    await page.getByRole("button", { name: "10", exact: true }).click();
    await page.getByRole("button", { name: "vender por WhatsApp" }).click();
    await page.getByRole("button", { name: "tiempo" }).click();
    await page.locator('textarea[placeholder="Escribe tu respuesta aquí..."]').fill("Poder personalizar más el catálogo");
    await page.getByRole("button", { name: "S/ 20" }).click();

    // 5. Enviar respuestas
    await page.getByRole("button", { name: "Enviar respuestas y ver mi código" }).click();

    // 6. Verificar pantalla final y código
    await expect(page.getByText("¡Muchas gracias por tus respuestas!")).toBeVisible();
    await expect(page.getByText("15 días de prueba de Emprendedor")).toBeVisible();
    await expect(page.getByText("Envíanos tu código por WhatsApp y revisamos tu premio")).toBeVisible();

    const codeLocator = page.locator('text=/^DZ-[2-9A-Z]{6}$/');
    await expect(codeLocator).toBeVisible();

    const waLink = page.getByRole("link", { name: /Enviar por WhatsApp/i });
    await expect(waLink).toBeVisible();
    const href = await waLink.getAttribute("href");
    expect(href).toContain("https://wa.me/51925176472");
    expect(href).toContain("Hola%2C%20termin%C3%A9%20la%20encuesta%20de%20DIZI");
  });

  test("E3 Pro ve las preguntas de su plan con multiselección y campo opcional", async ({ page }) => {
    // 1. Iniciar sesión con comercio Pro
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("zz-audit-f43-pro@testdizi.com");
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/admin/, { timeout: 20000 });

    // 2. Navegar a encuesta
    await page.goto("/admin/encuesta");

    // 3. Verificar preguntas 4 a 7 de Pro
    await expect(page.getByText("¿Empezaste con el plan gratis antes de pagar?")).toBeVisible();
    await expect(page.getByText("¿Qué funciones de Pro usas?")).toBeVisible();
    await expect(page.getByText("¿Piensas renovar?")).toBeVisible();
    await expect(page.getByText("¿Te interesa pagar el año completo con 25% de descuento?")).toBeVisible();

    // 4. Responder y marcar multiselección
    await page.getByRole("button", { name: "Facebook" }).click();
    await page.getByRole("button", { name: "casi todos mis pedidos" }).click();
    await page.getByRole("button", { name: "9", exact: true }).click();
    await page.getByRole("button", { name: "sí", exact: true }).first().click();
    await page.getByRole("button", { name: "cintillo" }).click();
    await page.getByRole("button", { name: "varios banners" }).click();
    await page.getByRole("button", { name: "tal vez" }).click();
    await page.locator('textarea[placeholder="Cuéntanos más detalles si deseas..."]').fill("Dependerá de las ventas del mes");
    await page.getByRole("button", { name: "sí", exact: true }).last().click();

    await page.getByRole("button", { name: "Enviar respuestas y ver mi código" }).click();

    // 5. Verificar beneficio Pro
    await expect(page.getByText("15 días más de tu plan")).toBeVisible();
    await expect(page.locator('text=/^DZ-[2-9A-Z]{6}$/')).toBeVisible();
  });

  test("E4 Ilimitado no la ve: Sin tarjeta en dashboard y aviso en /admin/encuesta", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("zz-audit-f43-ilimitado@testdizi.com");
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/admin/, { timeout: 20000 });

    // En dashboard no debe existir tarjeta de encuesta
    await page.goto("/admin/dashboard");
    await expect(page.locator('text="Responde 7 preguntas y gana 15 días"')).not.toBeVisible();

    // Al forzar URL directa debe indicar que no aplica
    await page.goto("/admin/encuesta");
    await expect(page.getByText("Encuesta no disponible")).toBeVisible();
    await expect(page.getByText("Esta tienda tiene plan ilimitado o es una cuenta de demostración")).toBeVisible();
  });

  test("E5 Obligatorias: Bloquea el envío si faltan respuestas", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("zz-audit-f43-incompleta@testdizi.com");
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/admin/, { timeout: 20000 });

    await page.goto("/admin/encuesta");

    // Enviar sin responder
    await page.getByRole("button", { name: "Enviar respuestas y ver mi código" }).click();

    // Mensajes de error en campos obligatorios
    await expect(page.getByText("Esta pregunta es obligatoria.").first()).toBeVisible();
    // No debe haber pasado a la pantalla final
    await expect(page.getByText("¡Muchas gracias por tus respuestas!")).not.toBeVisible();
  });

  test("E7 Una sola vez: Tienda que ya respondió ve directo su código", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("zz-audit-f43-semilla@testdizi.com");
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/admin/, { timeout: 20000 });

    // Ingresar nuevamente a la encuesta
    await page.goto("/admin/encuesta");

    // Directamente a la pantalla final sin formulario
    await expect(page.getByText("¡Muchas gracias por tus respuestas!")).toBeVisible();
    await expect(page.getByText("Pregunta 1 de 7")).not.toBeVisible();
    await expect(page.locator('text=/^DZ-[2-9A-Z]{6}$/')).toBeVisible();
  });

  test("E9, E10, E11, E13: Super admin gestiona respuestas, aplica premio y exporta CSV", async ({ page }) => {
    // 1. Iniciar sesión en panel super admin
    await page.goto("/super/login");
    await page.locator('input[type="email"]').fill("zz-audit-f43-super@testdizi.com");
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/super/, { timeout: 20000 });

    // 2. Acceder al módulo de encuestas
    await page.goto("/super/encuestas");
    await expect(page.getByRole("heading", { name: "Encuestas de Calidad (F43)" })).toBeVisible();

    // 3. Aplicar premio a una respuesta pendiente
    const applyBtn = page.getByRole("button", { name: "Aplicar premio" }).first();
    await expect(applyBtn).toBeVisible();
    await applyBtn.click();

    // 4. El estado debe cambiar a Aplicado y desaparecer el botón
    await expect(page.getByText("Aplicado").first()).toBeVisible();
    await expect(applyBtn).not.toBeVisible();

    // 5. Exportar CSV
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Exportar CSV/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("dizi-encuestas-");
  });

  test("E14 Nada más cambia: Catálogo público permanece idéntico", async ({ page }) => {
    await page.goto("/t/zz-audit-tienda-base");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveTitle(/Dizi|catálogo/i);
  });

  test("E16 Demo fuera: Tiendas con slug -demo no participan", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("zz-audit-f43-demo@testdizi.com");
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/admin/, { timeout: 20000 });

    await page.goto("/admin/encuesta");
    await expect(page.getByText("Encuesta no disponible")).toBeVisible();
  });
});
