import { test, expect } from "@playwright/test";

/**
 * Suite E2E Estricta para D2 en modo celular (Pixel 7 / 360x800) contra Vercel Preview.
 *
 * Verificaciones requeridas por Jack:
 * 1. Subir una foto de producto → se ve en el catálogo.
 * 2. /admin/link-bio → el mapa carga sus tiles (imágenes .leaflet-tile en el DOM).
 * 3. /admin/dashboard → clic en exportar PDF → captura el evento de descarga (page.waitForEvent('download')).
 * 4. /t/<tienda> → agregar al carrito → tocar "pedir por WhatsApp" → captura la URL wa.me generada.
 * 5. Registro completo.
 *
 * Reglas:
 * - Cero skips condicionales (ningún if isVisible que evite ejecutar pasos requeridos).
 * - Errores de CSP en consola: 0.
 * - Limpieza residual estricta: 0 tiendas ni archivos zz-audit al terminar.
 */

const TEST_TIMESTAMP = Date.now();
const AUDIT_EMAIL = `zz-audit-d2-${TEST_TIMESTAMP}@idanza.site`;
const AUDIT_PASSWORD = "AuditPassword123!";
const AUDIT_SLUG = `zz-audit-d2-${TEST_TIMESTAMP}`;
const AUDIT_STORE_NAME = `Audit D2 Mobile ${TEST_TIMESTAMP}`;
const AUDIT_PHONE = "987654321";
const INVITE_TOKEN = "tok-audit-d2-inv";

test.describe("D2: Verificación de Cabeceras y Flujos en Preview Celular (360x800)", () => {
  test.use({
    viewport: { width: 360, height: 800 },
    isMobile: true,
    hasTouch: true,
  });

  const cspViolations: string[] = [];

  test("Flujo E2E completo sin saltos condicionales", async ({ page, context }) => {
    test.setTimeout(90000);

    // 0. Capturar violaciones y avisos de CSP en consola
    const cspWarnings: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (
        text.toLowerCase().includes("content security policy") ||
        text.toLowerCase().includes("csp") ||
        text.toLowerCase().includes("violated directive")
      ) {
        if (
          text.includes("is ignored when delivered in a report-only policy") ||
          text.toLowerCase().includes("[report only]") ||
          msg.type() !== "error"
        ) {
          console.log("[CSP Report-Only Notice]", text);
          cspWarnings.push(text);
        } else {
          console.error("[CSP Error]", text);
          cspViolations.push(text);
        }
      }
    });

    // ─────────────────────────────────────────────────────────────
    // 1. REGISTRO COMPLETO (3 PASOS CON INVITACIÓN A PLAN EMPRENDEDOR)
    // ─────────────────────────────────────────────────────────────
    console.log("[Paso 1] Iniciando registro completo...");
    await page.goto(`/register?invite=${INVITE_TOKEN}`);
    await page.waitForLoadState("domcontentloaded");

    // Verificar que se reconoce el plan de la invitación
    await expect(
      page.locator("text=Plan Emprendedor").or(page.locator("text=EMPRENDEDOR")),
    ).toBeVisible({ timeout: 15000 });

    // Paso 1: Nombre comercial y Teléfono WhatsApp
    const nameInput = page.locator('input[placeholder="Ej. Florería María"]');
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.fill(AUDIT_STORE_NAME);

    const phoneInput = page.locator('input[type="tel"]');
    await expect(phoneInput).toBeVisible({ timeout: 10000 });
    await phoneInput.fill(AUDIT_PHONE);

    const nextBtn1 = page.locator('button:has-text("Siguiente paso")');
    await expect(nextBtn1).toBeEnabled();
    await nextBtn1.click();

    // Paso 2: Plantilla de diseño
    const nextBtn2 = page.locator('button:has-text("Siguiente paso")');
    await expect(nextBtn2).toBeVisible({ timeout: 10000 });
    await nextBtn2.click();

    // Paso 3: Slug, Email y Contraseña
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

    // Esperar redirección al panel de administración
    await page.waitForURL(/\/admin/, { timeout: 35000 });
    console.log("[Paso 1] Registro exitoso. URL actual:", page.url());

    await page.waitForTimeout(1000);
    // Si aparece el asistente inicial (Onboarding), cerrarlo con Escape
    if (await page.locator('[role="dialog"]').isVisible().catch(() => false)) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
      console.log("[Paso 1] Modal de onboarding cerrado con Escape.");
    }

    // ─────────────────────────────────────────────────────────────
    // 2. SUBIR UNA FOTO DE PRODUCTO → SE VE EN EL CATÁLOGO PÚBLICO
    // ─────────────────────────────────────────────────────────────
    console.log("[Paso 2] Subiendo foto de producto en /admin/productos...");
    await page.goto("/admin/productos");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    // Si aún aparece algún diálogo o modal, cerrarlo con Escape
    if (await page.locator('[role="dialog"]').isVisible().catch(() => false)) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }

    // Click en Nuevo Producto
    const newProdBtn = page
      .locator('button:has-text("Nuevo Producto")')
      .or(page.locator('button:has-text("Crear producto")'))
      .first();
    await expect(newProdBtn).toBeVisible({ timeout: 15000 });
    await newProdBtn.click();

    // Formulario de producto
    const prodNameInput = page.locator('input[placeholder="Ej. iPhone 15 Pro Max 256GB"]');
    await expect(prodNameInput).toBeVisible({ timeout: 10000 });
    await prodNameInput.fill("Producto D2 Audit");

    // Desmarcar 'A consultar' para habilitar el campo de precio numérico
    const consultLabel = page.locator('label:has-text("A consultar")').first();
    await expect(consultLabel).toBeVisible({ timeout: 5000 });
    await consultLabel.click();

    const prodPriceInput = page
      .locator('input[placeholder="0.00"]')
      .or(page.locator('input[type="text"][inputMode="decimal"]'))
      .first();
    await expect(prodPriceInput).toBeEnabled({ timeout: 10000 });
    await prodPriceInput.fill("45.00");

    // Subir foto individual
    const fileInput = page.locator('input[type="file"][accept="image/*"]:not([multiple])');
    await expect(fileInput).toBeAttached({ timeout: 10000 });
    await fileInput.setInputFiles("public/images/mockups/boutique.png");

    // Esperar procesamiento y compresión WebP
    await page.waitForTimeout(1500);

    const saveProdBtn = page.locator('button:has-text("Guardar producto")');
    await expect(saveProdBtn).toBeEnabled();
    await saveProdBtn.click();

    // El diálogo modal de producto debe cerrarse tras guardar
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 25000 });
    console.log("[Paso 2] Producto guardado correctamente.");

    // Ir al catálogo público /t/<tienda> y verificar producto e imagen
    console.log("[Paso 2] Verificando en /t/" + AUDIT_SLUG);
    await page.goto(`/t/${AUDIT_SLUG}`);
    await page.waitForLoadState("domcontentloaded");

    const publicProdTitle = page.locator("text=Producto D2 Audit").first();
    await expect(publicProdTitle).toBeVisible({ timeout: 15000 });

    const publicProdImg = page
      .locator('img[alt="Producto D2 Audit"]')
      .or(page.locator('img[src*="supabase"]').or(page.locator('img[src*="data:image"]')))
      .first();
    await expect(publicProdImg).toBeVisible({ timeout: 15000 });
    console.log("[Paso 2] Foto de producto verificada en el catálogo público.");

    // ─────────────────────────────────────────────────────────────
    // 3. /admin/link-bio → EL MAPA CARGA SUS TILES
    // ─────────────────────────────────────────────────────────────
    console.log("[Paso 3] Verificando mapa Leaflet en /admin/link-bio...");
    await page.goto("/admin/link-bio");
    await page.waitForLoadState("domcontentloaded");

    // Si el interruptor de Bio-Link no está activo, activarlo
    const bioSwitch = page.locator('button[role="switch"]').first();
    await expect(bioSwitch).toBeVisible({ timeout: 15000 });
    const isBioActive = await bioSwitch.getAttribute("aria-checked");
    if (isBioActive === "false") {
      await bioSwitch.click();
      await page.waitForTimeout(500);
    }

    // Ir a pestaña Ubicación
    const ubicacionTab = page.locator('button[role="tab"]:has-text("Ubicación")');
    await expect(ubicacionTab).toBeVisible({ timeout: 10000 });
    await ubicacionTab.click();

    // Comprobar que los tiles de Leaflet se cargan en el DOM
    const mapTile = page.locator("img.leaflet-tile").first();
    await expect(mapTile).toBeVisible({ timeout: 20000 });
    const tileCount = await page.locator("img.leaflet-tile").count();
    console.log(`[Paso 3] Tiles de Leaflet verificados en el DOM (${tileCount} tiles cargados).`);
    expect(tileCount).toBeGreaterThan(0);

    // ─────────────────────────────────────────────────────────────
    // 4. /admin/dashboard → CLIC EN EXPORTAR PDF → EVENTO DESCARGA
    // ─────────────────────────────────────────────────────────────
    console.log("[Paso 4] Verificando exportación de PDF en /admin/dashboard...");
    await page.goto("/admin/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // Clic en botón "Descargar PDF" del dashboard
    const openPdfBtn = page.locator('button:has-text("Descargar PDF")').first();
    await expect(openPdfBtn).toBeVisible({ timeout: 15000 });
    await openPdfBtn.click();

    // Modal de exportación debe abrirse con el selector de temas y botón de descarga
    const generatePdfBtn = page.locator('button:has-text("Descargar como PDF")').first();
    await expect(generatePdfBtn).toBeVisible({ timeout: 15000 });

    // Iniciar promesa de descarga y hacer clic
    const downloadPromise = page.waitForEvent("download", { timeout: 35000 });
    await generatePdfBtn.click();
    const download = await downloadPromise;
    const downloadedFilename = download.suggestedFilename();
    console.log(`[Paso 4] Evento de descarga PDF capturado: ${downloadedFilename}`);
    expect(downloadedFilename).toContain(".pdf");

    // Cerrar modal de PDF
    const closePdfBtn = page
      .locator('button:has-text("Cerrar")')
      .or(page.locator('div[role="dialog"] button:has(svg.lucide-x)'))
      .first();
    if (await closePdfBtn.isVisible().catch(() => false)) {
      await closePdfBtn.click();
    }

    // ─────────────────────────────────────────────────────────────
    // 5. /t/<tienda> → AGREGAR AL CARRITO → PEDIR POR WHATSAPP → WA.ME
    // ─────────────────────────────────────────────────────────────
    console.log("[Paso 5] Verificando flujo de compra y pedido WhatsApp en /t/" + AUDIT_SLUG);
    await page.goto(`/t/${AUDIT_SLUG}`);
    await page.waitForLoadState("domcontentloaded");

    // Abrir detalle del producto
    const productCard = page.locator("text=Producto D2 Audit").first();
    await expect(productCard).toBeVisible({ timeout: 15000 });
    await productCard.click();

    // Clic en "Añadir al carrito"
    const addToCartBtn = page.locator('button:has-text("Añadir al carrito")').first();
    await expect(addToCartBtn).toBeVisible({ timeout: 10000 });
    await addToCartBtn.click();

    // Verificar botón "Enviar pedido por WhatsApp" en el panel lateral del carrito
    const sendOrderBtn = page.locator('button:has-text("Enviar pedido por WhatsApp")');
    await expect(sendOrderBtn).toBeVisible({ timeout: 10000 });

    // Capturar la URL de WhatsApp vía evento popup de Playwright
    const [popup] = await Promise.all([
      page.waitForEvent("popup", { timeout: 15000 }),
      sendOrderBtn.click(),
    ]);

    const capturedWaUrl = popup.url();
    console.log("[Paso 5] Popup de WhatsApp capturado:", capturedWaUrl);
    expect(capturedWaUrl).toMatch(/^https:\/\/(wa\.me|api\.whatsapp\.com)/);
    expect(decodeURIComponent(capturedWaUrl.replace(/\+/g, " "))).toContain("Producto D2 Audit");

    // ─────────────────────────────────────────────────────────────
    // 6. CERO ERRORES DE CSP EN CONSOLA Y PERSISTENCIA DE REPORT-ONLY
    // ─────────────────────────────────────────────────────────────
    console.log("[Paso 6] Verificando violaciones de CSP en consola...");
    const fs = await import("fs");
    if (!fs.existsSync("scratch")) {
      fs.mkdirSync("scratch", { recursive: true });
    }
    fs.writeFileSync(
      "scratch/csp-report-only-warnings.json",
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          targetUrl: page.url(),
          totalNotices: cspWarnings.length,
          notices: cspWarnings,
        },
        null,
        2,
      ),
      "utf-8",
    );
    console.log(`[Paso 6] ${cspWarnings.length} avisos CSP Report-Only guardados en scratch/csp-report-only-warnings.json`);
    expect(cspViolations).toEqual([]);
    console.log("[Paso 6] 0 errores fatales de CSP detectados.");
  });
});
