import { test, expect } from "@playwright/test";

/**
 * B6 · Recorrido completo del usuario nuevo (E2E Journey en emulación 360x800)
 * Requisitos del encargo FASE 1B:
 * registro -> onboarding -> subir 1 producto con foto -> carga masiva de 5 fotos ->
 * editar precio -> cambiar diseño -> compartir link -> abrir catálogo como cliente ->
 * carrito -> "Enviar pedido por WhatsApp" (verificar mensaje armado) -> Link en Bio.
 */
test.describe("B6 · Recorrido completo del usuario nuevo", () => {
  test.use({
    viewport: { width: 360, height: 800 },
  });

  // Timeout generoso para todo el recorrido completo
  test.setTimeout(180_000);

  const SLUG = "zz-audit-b6-journey";
  const EMAIL = "zz-audit-b6-journey@testdizi.com";
  const PASSWORD = "AuditPassword123!";
  const STORE_NAME = "Moda & Estilo Audit";
  const PHONE = "51912345678";

  test("Recorrido completo de usuario de extremo a extremo", async ({ page }) => {
    const timings: Record<string, number> = {};

    // Interceptar llamadas a window.open para capturar la URL de WhatsApp sin abrir pestañas reales
    await page.addInitScript(() => {
      (window as any).__openedUrls = [];
      window.open = (url?: string | URL) => {
        if (url) (window as any).__openedUrls.push(url.toString());
        return null;
      };
    });

    console.log("\n=======================================================");
    console.log("INICIANDO RECORRIDO B6: Usuario Nuevo (360x800)");
    console.log("=======================================================\n");

    // ─────────────────────────────────────────────────────────────
    // 1. REGISTRO
    // ─────────────────────────────────────────────────────────────
    console.log("[Paso 1] Iniciando Registro...");
    const t1_start = Date.now();
    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");

    // Paso 1 de registro: Nombre y teléfono
    const nameInput = page.locator('input[placeholder="Ej. Florería María"]');
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    await nameInput.fill(STORE_NAME);

    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill(PHONE);

    const nextBtn1 = page.locator('button:has-text("Siguiente paso")');
    await expect(nextBtn1).toBeEnabled();
    await nextBtn1.click();

    // Paso 2: Modelo/Plantilla
    await page.waitForTimeout(500);
    const nextBtn2 = page.locator('button:has-text("Siguiente paso")');
    await expect(nextBtn2).toBeVisible({ timeout: 10000 });
    await nextBtn2.click();

    // Paso 3: Credenciales
    await page.waitForTimeout(500);
    const slugInput = page.locator('input[placeholder="floreria-maria"]');
    await slugInput.fill(SLUG);

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(EMAIL);

    const passInput = page.locator('input[type="password"]');
    await passInput.fill(PASSWORD);

    const submitRegister = page.locator('button:has-text("Lanzar mi Catálogo")');
    await expect(submitRegister).toBeEnabled();
    await submitRegister.click();

    // Esperar redirección al panel /admin
    await page.waitForURL(/\/admin/, { timeout: 35000 });
    await expect(page).toHaveURL(/\/admin/);
    timings["1_registro"] = (Date.now() - t1_start) / 1000;
    console.log(`[Paso 1] Registro completado en ${timings["1_registro"].toFixed(2)}s`);

    await page.screenshot({ path: "test-results/capturas-fase1b/01_registro_exitoso.png" });

    // ─────────────────────────────────────────────────────────────
    // 2. ONBOARDING
    // ─────────────────────────────────────────────────────────────
    console.log("[Paso 2] Verificando Asistente de Onboarding...");
    const t2_start = Date.now();
    
    // El asistente modal se abre automáticamente para cuentas nuevas
    const wizardModal = page.locator('text=Bienvenido a Dizi').or(page.locator('text=Asistente de Bienvenida')).or(page.locator('text=Identidad Visual'));
    const isWizardVisible = await wizardModal.isVisible({ timeout: 8000 }).catch(() => false);
    
    if (isWizardVisible) {
      console.log("Onboarding modal visible. Completando etapas...");
      await page.screenshot({ path: "test-results/capturas-fase1b/02_onboarding_paso1.png" });

      // Paso 1: Identidad Visual -> Siguiente
      const nextStepBtn = page.locator('button:has-text("Siguiente")').first();
      if (await nextStepBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nextStepBtn.click();
        await page.waitForTimeout(500);
      }

      // Paso 2: Bio-Link -> Siguiente
      if (await nextStepBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nextStepBtn.click();
        await page.waitForTimeout(500);
      }

      // Paso 3: Saltar configuración para completar el asistente
      const skipConfigBtn = page.locator('button:has-text("Saltar configuración")');
      if (await skipConfigBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
        await skipConfigBtn.click({ force: true });
      }

      // Asegurar que el diálogo modal quede cerrado
      await page.waitForTimeout(1000);
      const openDialog = page.locator('[role="dialog"]');
      if (await openDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.keyboard.press("Escape");
        await page.waitForTimeout(500);
      }
    } else {
      console.log("Onboarding modal no apareció o fue omitido.");
    }

    timings["2_onboarding"] = (Date.now() - t2_start) / 1000;
    console.log(`[Paso 2] Onboarding finalizado en ${timings["2_onboarding"].toFixed(2)}s`);
    await page.screenshot({ path: "test-results/capturas-fase1b/02_onboarding_completado.png" });

    // ─────────────────────────────────────────────────────────────
    // 3. SUBIR 1 PRODUCTO CON FOTO INDIVIDUAL
    // ─────────────────────────────────────────────────────────────
    console.log("[Paso 3] Subiendo 1 producto individual con foto...");
    const t3_start = Date.now();

    // Navegar a /admin/productos
    await page.goto("/admin/productos");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    // Si aún hay algún diálogo abierto, cerrarlo con Escape
    const residualDialog = page.locator('[role="dialog"]');
    if (await residualDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }

    // Abrir diálogo de nuevo producto
    const newProductBtn = page.locator('button:has-text("+ Producto")').or(page.locator('button:has-text("Nuevo Producto")')).first();
    await expect(newProductBtn).toBeVisible({ timeout: 10000 });
    await newProductBtn.click();

    // Completar nombre
    const prodNameInput = page.locator('input[placeholder="Ej. iPhone 15 Pro Max 256GB"]');
    await expect(prodNameInput).toBeVisible({ timeout: 10000 });
    await prodNameInput.fill("Vestido Floral Artesanal");

    // Desmarcar "A consultar" para habilitar el campo numérico de precio
    const consultCheckbox = page.locator('label:has-text("A consultar")').first();
    await expect(consultCheckbox).toBeVisible({ timeout: 10000 });
    await consultCheckbox.click();

    // Completar precio
    const prodPriceInput = page.locator('input[placeholder="0.00"]').or(page.locator('input[type="text"][inputMode="decimal"]')).first();
    await expect(prodPriceInput).toBeEnabled({ timeout: 5000 });
    await prodPriceInput.fill("45.00");

    // Subir foto desde archivo local (simula cámara / galería)
    const singleFileInput = page.locator('input[type="file"][accept="image/*"]:not([multiple])');
    await singleFileInput.setInputFiles("public/images/mockups/boutique.png");

    // Esperar a que la imagen se convierta a WebP y aparezca en la vista previa
    await page.waitForTimeout(1500);

    // Guardar producto
    const saveSingleProdBtn = page.locator('button:has-text("Guardar producto")');
    await expect(saveSingleProdBtn).toBeEnabled({ timeout: 10000 });
    await saveSingleProdBtn.click();

    // Esperar a que el diálogo se cierre y aparezca mensaje de éxito
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Producto guardado").or(page.locator("text=guardado"))).toBeVisible({ timeout: 15000 });
    timings["3_producto_individual"] = (Date.now() - t3_start) / 1000;
    console.log(`[Paso 3] Producto individual guardado en ${timings["3_producto_individual"].toFixed(2)}s`);
    await page.screenshot({ path: "test-results/capturas-fase1b/03_producto_individual.png" });

    // ─────────────────────────────────────────────────────────────
    // 4. CARGA MASIVA DE 5 FOTOS
    // ─────────────────────────────────────────────────────────────
    console.log("[Paso 4] Ejecutando Carga Masiva de 5 fotos...");
    const t4_start = Date.now();

    const bulkFiles = [
      "public/images/mockups/eco.png",
      "public/images/mockups/luxury.png",
      "public/images/mockups/pastel.png",
      "public/images/mockups/restaurant.png",
      "public/images/mockups/tech.png",
    ];

    // Cargar los 5 archivos en el input múltiple
    const multipleFileInput = page.locator('input[type="file"][multiple]');
    await multipleFileInput.setInputFiles(bulkFiles);

    // Debe abrirse el diálogo de carga masiva
    const bulkDialogTitle = page.locator("text=Carga Masiva por Fotos");
    await expect(bulkDialogTitle).toBeVisible({ timeout: 15000 });

    // Confirmar importación de las 5 fotos
    const confirmImportBtn = page.locator('button:has-text("Confirmar Importación")');
    await expect(confirmImportBtn).toBeVisible();
    await confirmImportBtn.click();

    // Esperar a que termine de procesar las 5 fotos
    await expect(bulkDialogTitle).not.toBeVisible({ timeout: 45000 });

    // Verificar si aparece el diálogo de productos incompletos (B3)
    const completeDialog = page.locator("text=Completa tus productos").or(page.locator("text=Completar detalles"));
    if (await completeDialog.isVisible({ timeout: 6000 }).catch(() => false)) {
      console.log("Diálogo B3 'Completa tus productos' detectado. Cerrando...");
      const laterBtn = page.locator('button:has-text("Hacerlo más tarde")').or(page.locator('button:has-text("Guardar todos los cambios")')).first();
      await laterBtn.click({ force: true });
      await expect(completeDialog).not.toBeVisible({ timeout: 10000 });
    }

    // Asegurar que no quede ningún modal cubriendo la tabla
    await page.waitForTimeout(1000);
    const residualBulk = page.locator('[role="dialog"]');
    if (await residualBulk.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }

    timings["4_carga_masiva"] = (Date.now() - t4_start) / 1000;
    console.log(`[Paso 4] Carga masiva de 5 fotos completada en ${timings["4_carga_masiva"].toFixed(2)}s`);
    await page.screenshot({ path: "test-results/capturas-fase1b/04_carga_masiva_5_fotos.png" });

    // ─────────────────────────────────────────────────────────────
    // 5. EDITAR PRECIO
    // ─────────────────────────────────────────────────────────────
    console.log("[Paso 5] Editando precio de un producto...");
    const t5_start = Date.now();

    // En vista móvil (360x800), los productos se muestran en cards dentro de .md:hidden
    const mobileCard = page.locator('.md\\:hidden .bg-card').filter({ hasText: "Vestido Floral Artesanal" }).first();
    await mobileCard.scrollIntoViewIfNeeded();
    await expect(mobileCard).toBeVisible({ timeout: 10000 });
    const editBtn = mobileCard.locator('button:has(svg.lucide-pencil)');
    await editBtn.click();

    // En edición, el precio ya no está en 'A consultar', sino en 45.00
    const editPriceInput = page.locator('input[placeholder="0.00"]').or(page.locator('input[type="text"][inputMode="decimal"]')).first();
    await expect(editPriceInput).toBeEnabled({ timeout: 5000 });
    await editPriceInput.fill("59.90");

    const saveChangesBtn = page.locator('button:has-text("Guardar cambios")');
    await expect(saveChangesBtn).toBeEnabled({ timeout: 10000 });
    await saveChangesBtn.click();

    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Producto guardado").or(page.locator("text=guardado")).first()).toBeVisible({ timeout: 15000 });
    timings["5_editar_precio"] = (Date.now() - t5_start) / 1000;
    console.log(`[Paso 5] Edición de precio guardada en ${timings["5_editar_precio"].toFixed(2)}s`);
    await page.screenshot({ path: "test-results/capturas-fase1b/05_editar_precio.png" });

    // ─────────────────────────────────────────────────────────────
    // 6. CAMBIAR DISEÑO
    // ─────────────────────────────────────────────────────────────
    console.log("[Paso 6] Cambiando diseño en /admin/diseno...");
    const t6_start = Date.now();

    await page.goto("/admin/diseno");
    await page.waitForLoadState("domcontentloaded");

    // Seleccionar una plantilla de estructura
    const boutiqueModelCard = page.locator('text=Overlay Visual').or(page.locator('text=Grilla Simétrica')).or(page.locator('text=Hero Panorámico')).first();
    await boutiqueModelCard.scrollIntoViewIfNeeded();
    await expect(boutiqueModelCard).toBeVisible({ timeout: 10000 });
    await boutiqueModelCard.click();

    // Guardar cambios de diseño
    const saveDesignBtn = page.locator('button:has-text("Guardar cambios")');
    await saveDesignBtn.scrollIntoViewIfNeeded();
    await expect(saveDesignBtn).toBeVisible({ timeout: 10000 });
    await saveDesignBtn.click();

    await expect(page.locator("text=guardado").or(page.locator("text=actualizado")).first()).toBeVisible({ timeout: 15000 });
    timings["6_cambiar_diseno"] = (Date.now() - t6_start) / 1000;
    console.log(`[Paso 6] Diseño cambiado y guardado en ${timings["6_cambiar_diseno"].toFixed(2)}s`);
    await page.screenshot({ path: "test-results/capturas-fase1b/06_cambiar_diseno.png" });

    // ─────────────────────────────────────────────────────────────
    // 7. COMPARTIR LINK
    // ─────────────────────────────────────────────────────────────
    console.log("[Paso 7] Probando Compartir / Copiar Link...");
    const t7_start = Date.now();

    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");

    const copyBtn = page.locator('button[title="Copiar enlace"]').first();
    await copyBtn.scrollIntoViewIfNeeded();
    await expect(copyBtn).toBeVisible({ timeout: 10000 });
    await copyBtn.click();

    await page.waitForTimeout(500);
    timings["7_compartir_link"] = (Date.now() - t7_start) / 1000;
    console.log(`[Paso 7] Link copiado en ${timings["7_compartir_link"].toFixed(2)}s`);
    await page.screenshot({ path: "test-results/capturas-fase1b/07_compartir_link.png" });

    // ─────────────────────────────────────────────────────────────
    // 8. ABRIR CATÁLOGO COMO CLIENTE
    // ─────────────────────────────────────────────────────────────
    console.log("[Paso 8] Abriendo catálogo público como cliente (/t/zz-audit-b6-journey)...");
    const t8_start = Date.now();

    await page.goto(`/t/${SLUG}`);
    await page.waitForLoadState("domcontentloaded");

    // Verificar nombre de tienda y productos renderizados
    await expect(page.locator("body")).toContainText(STORE_NAME, { timeout: 20000 });
    const prodCatalog = page.locator("text=Vestido Floral Artesanal").first();
    await prodCatalog.scrollIntoViewIfNeeded();
    await expect(prodCatalog).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=59.90").first()).toBeVisible({ timeout: 15000 });

    timings["8_abrir_catalogo"] = (Date.now() - t8_start) / 1000;
    console.log(`[Paso 8] Catálogo público abierto y renderizado en ${timings["8_abrir_catalogo"].toFixed(2)}s`);
    await page.screenshot({ path: "test-results/capturas-fase1b/08_catalogo_cliente.png" });

    // ─────────────────────────────────────────────────────────────
    // 9. CARRITO DE COMPRAS
    // ─────────────────────────────────────────────────────────────
    console.log("[Paso 9] Probando Carrito de compras...");
    const t9_start = Date.now();

    // Agregar "Vestido Floral Artesanal" al carrito
    const prodCard = page.locator("text=Vestido Floral Artesanal").first();
    await prodCard.scrollIntoViewIfNeeded();
    await prodCard.click();

    // En modal de detalle, click "Añadir al carrito" o "Agregar al carrito"
    const modalAddBtn = page.locator('button:has-text("Añadir al carrito")').or(page.locator('button:has-text("Agregar al carrito")')).or(page.locator('button:has-text("Añadir")')).or(page.locator('button:has-text("Agregar")')).first();
    await expect(modalAddBtn).toBeVisible({ timeout: 10000 });
    await modalAddBtn.click();

    // Cerrar modal de detalle si sigue abierto
    const closeDetailBtn = page.locator('button[aria-label="Cerrar"]').or(page.locator('button:has-text("Cerrar")')).first();
    if (await closeDetailBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeDetailBtn.click();
    }

    // Abrir drawer del carrito si no se abrió automáticamente
    const isCartOpen = await page.locator('text=Enviar pedido por WhatsApp').isVisible({ timeout: 2000 }).catch(() => false);
    if (!isCartOpen) {
      const cartFloatingBtn = page.locator('button:has-text("Ver pedido")').or(page.locator('button:has-text("Carrito")')).or(page.locator('[data-testid="floating-cart"]')).first();
      if (await cartFloatingBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await cartFloatingBtn.click();
      }
    }

    // Verificar que el producto y su precio aparecen en el carrito
    await expect(page.locator("text=Vestido Floral Artesanal").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=59.90").first()).toBeVisible({ timeout: 10000 });

    timings["9_carrito"] = (Date.now() - t9_start) / 1000;
    console.log(`[Paso 9] Carrito verificado en ${timings["9_carrito"].toFixed(2)}s`);
    await page.screenshot({ path: "test-results/capturas-fase1b/09_carrito_compras.png" });

    // ─────────────────────────────────────────────────────────────
    // 10. ENVIAR PEDIDO POR WHATSAPP
    // ─────────────────────────────────────────────────────────────
    console.log("[Paso 10] Probando 'Enviar pedido por WhatsApp'...");
    const t10_start = Date.now();

    const checkoutBtn = page.locator('button:has-text("Enviar pedido por WhatsApp")');
    await expect(checkoutBtn).toBeVisible({ timeout: 10000 });
    await checkoutBtn.click();

    // Obtener la URL capturada por window.open
    await page.waitForTimeout(1000);
    const openedUrls = await page.evaluate(() => (window as any).__openedUrls as string[]);
    console.log("URLs capturadas:", openedUrls);

    expect(openedUrls.length).toBeGreaterThanOrEqual(1);
    const waUrl = openedUrls[0];
    expect(waUrl).toContain("https://wa.me/51912345678");

    // Decodificar el mensaje
    const urlObj = new URL(waUrl);
    const messageText = urlObj.searchParams.get("text") || "";
    console.log("Mensaje armado para WhatsApp:\n", messageText);

    expect(messageText).toContain(STORE_NAME);
    expect(messageText).toContain("Vestido Floral Artesanal");
    expect(messageText).toContain("59.90");

    timings["10_pedido_whatsapp"] = (Date.now() - t10_start) / 1000;
    console.log(`[Paso 10] Mensaje WhatsApp verificado en ${timings["10_pedido_whatsapp"].toFixed(2)}s`);
    await page.screenshot({ path: "test-results/capturas-fase1b/10_pedido_whatsapp.png" });

    // ─────────────────────────────────────────────────────────────
    // 11. LINK EN BIO
    // ─────────────────────────────────────────────────────────────
    console.log("[Paso 11] Abriendo Link en Bio (/bio/zz-audit-b6-journey)...");
    const t11_start = Date.now();

    await page.goto(`/bio/${SLUG}`);
    await page.waitForLoadState("domcontentloaded");

    // Verificar nombre de tienda y botón al catálogo
    await expect(page.locator("body")).toContainText(STORE_NAME, { timeout: 15000 });
    await expect(page.getByRole("link", { name: /Catálogo/i }).first()).toBeVisible({ timeout: 15000 });

    timings["11_link_en_bio"] = (Date.now() - t11_start) / 1000;
    console.log(`[Paso 11] Link en Bio abierto y renderizado en ${timings["11_link_en_bio"].toFixed(2)}s`);
    await page.screenshot({ path: "test-results/capturas-fase1b/11_link_en_bio.png" });

    // ─────────────────────────────────────────────────────────────
    // RESUMEN DE TIEMPOS
    // ─────────────────────────────────────────────────────────────
    console.log("\n=======================================================");
    console.log("RESUMEN DE TIEMPOS - RECORRIDO B6");
    console.log("=======================================================");
    for (const [paso, segs] of Object.entries(timings)) {
      const alerta = segs > 3.0 ? "⚠️ [> 3s]" : "✅ [<= 3s]";
      console.log(`${alerta} ${paso}: ${segs.toFixed(2)}s`);
    }
    console.log("=======================================================\n");
  });
});
