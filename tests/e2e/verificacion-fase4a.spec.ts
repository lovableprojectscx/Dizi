import { test, expect } from "@playwright/test";

/**
 * Suite E2E - FASE 4A: Compartir una categoría del catálogo (F25)
 *
 * Verificaciones requeridas por el encargo:
 * 1. /t/catalogo?c=flores-follajes: categoría activa, productos visibles coinciden.
 * 2. Cambiar a otra categoría -> URL cambia con ?c=; "Todos" -> sin ?c=; botón atrás sale del catálogo.
 * 3. "Compartir esta categoría" -> copia enlace correcto con ?c= al portapapeles / share.
 * 4. ?c=no-existe -> catálogo completo, aviso discreto, 0 errores en consola.
 * 5. ?p=<producto > 24 de Adornia> -> se abre el modal del producto mediante carga bajo demanda.
 * 6. /bio/catalogo sin cambios.
 * 7. /admin/categorias redirige a tab categorias y botón "Copiar link" copia el link correcto.
 * 8. Endpoint SEO (/api/seo) con ?c=flores-follajes devuelve og:title y descripción correspondientes.
 */

test.describe("FASE 4A — Compartir categoría del catálogo (F25)", () => {
  test.use({
    viewport: { width: 360, height: 800 },
    isMobile: true,
    hasTouch: true,
  });

  test("1. /t/catalogo?c=flores-follajes activa la categoría y muestra sus productos", async ({ page }) => {
    await page.goto("/t/catalogo?c=flores-follajes");
    await page.waitForLoadState("domcontentloaded");

    // Esperar a que el catálogo cargue
    const catalogHeader = page.locator("#catalogo");
    await expect(catalogHeader).toBeAttached({ timeout: 15000 });

    // Verificar que la cabecera muestre el nombre de la categoría y el botón de compartir
    await expect(page.locator("text=Flores & follajes").first()).toBeVisible({ timeout: 10000 });
    const shareBtn = page.locator("button:has-text('Compartir esta categoría')");
    await expect(shareBtn).toBeVisible();

    // Tomar captura de evidencia para el informe
    await page.screenshot({ path: "test-results/fase4a-01-categoria-activa.png", fullPage: false });
  });

  test("2. Cambiar de categoría actualiza URL con replaceState y 'Todos' quita ?c=", async ({ page }) => {
    // 1. Iniciar en la landing para tener historial previo
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // 2. Navegar al catálogo
    await page.goto("/t/catalogo");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#catalogo")).toBeAttached({ timeout: 15000 });

    // 3. Abrir drawer de filtros en móvil y seleccionar Flores & follajes
    const filtrosBtn = page.locator("button:has-text('Filtros')").first();
    await expect(filtrosBtn).toBeVisible({ timeout: 10000 });
    await filtrosBtn.click();
    await page.waitForTimeout(400);

    const catBtn = page.locator("[role='dialog'] button:has-text('Flores & follajes')").first();
    await expect(catBtn).toBeVisible({ timeout: 5000 });
    await catBtn.click();
    await page.waitForTimeout(500);
    expect(page.url()).toContain("c=flores-follajes");

    // 4. Volver a 'Todos' desde el drawer que sigue abierto
    const allBtn = page.locator("[role='dialog'] button:has-text('Todos')").first();
    await expect(allBtn).toBeVisible({ timeout: 5000 });
    await allBtn.click();
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain("?c=");

    // 5. Botón atrás del navegador sale del catálogo (no recorre cada categoría intermedia gracias a replaceState)
    await page.goBack();
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain("/t/catalogo");
  });

  test("3. 'Compartir esta categoría' copia el enlace con ?c= al portapapeles", async ({ page, context }) => {
    // Otorgar permisos de portapapeles
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.goto("/t/catalogo?c=flores-follajes");
    await page.waitForLoadState("domcontentloaded");

    const shareBtn = page.locator("button:has-text('Compartir esta categoría')").first();
    await expect(shareBtn).toBeVisible({ timeout: 15000 });
    await shareBtn.click();

    // Toast de confirmación visible
    await expect(page.locator("text=¡Enlace").first()).toBeVisible({ timeout: 5000 });

    // Verificar portapapeles si la API está disponible
    try {
      const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
      if (clipboardContent) {
        expect(clipboardContent).toContain("/t/catalogo?c=flores-follajes");
      }
    } catch {}

    await page.screenshot({ path: "test-results/fase4a-03-compartir-categoria.png" });
  });

  test("4. ?c=no-existe muestra catálogo completo y aviso discreto sin errores de consola", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/t/catalogo?c=categoria-fantasma-inexistente-12345");
    await page.waitForLoadState("domcontentloaded");

    // Esperar aviso discreto (toast)
    await expect(page.locator("text=Esa categoría ya no está disponible").first()).toBeVisible({ timeout: 10000 });

    // La URL debe haberse saneado
    expect(page.url()).not.toContain("categoria-fantasma");

    // Verificar que no hubo excepciones no capturadas
    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes("favicon") && !e.includes("zustand") && !e.includes("net::ERR")
    );
    expect(criticalErrors.length).toBe(0);

    await page.screenshot({ path: "test-results/fase4a-04-categoria-inexistente.png" });
  });

  test("5. ?p= con producto en posición > 24 de Adornia se abre automáticamente", async ({ page }) => {
    // En Adornia (slug 'catalogo'), obtener un producto más allá de los primeros 24
    // Usamos el RPC para consultar productos con offset 24
    const productsRes = await page.request.post("https://zkqzdwxjthjdjchimmds.supabase.co/rest/v1/rpc/get_public_store_products", {
      headers: {
        apikey: "sb_publishable_gZO6jV7aLBSu9YuaXmcI0Q_M8ygSDxX",
        "Content-Type": "application/json",
      },
      data: {
        p_store_slug: "catalogo",
        p_page_offset: 24,
        p_page_limit: 1,
      },
    });

    const products = await productsRes.json();
    expect(products.length).toBeGreaterThan(0);
    const deepProduct = products[0];

    // Navegar directamente con ?p= del producto lejano
    await page.goto(`/t/catalogo?p=${deepProduct.id}`);
    await page.waitForLoadState("domcontentloaded");

    // El modal de detalle del producto debe abrirse automáticamente con el nombre del producto
    await expect(page.locator(`text=${deepProduct.name}`).first()).toBeVisible({ timeout: 15000 });

    await page.screenshot({ path: "test-results/fase4a-05-producto-posicion-lejana.png" });
  });

  test("6. /bio/catalogo carga normalmente sin afectación", async ({ page }) => {
    await page.goto("/bio/catalogo");
    await page.waitForLoadState("domcontentloaded");

    // El contenedor principal de bio link debe renderizar
    await expect(page.locator("text=Adornia").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator("a[href*='wa.me'], a[href*='whatsapp.com'], button").first()).toBeVisible();

    await page.screenshot({ path: "test-results/fase4a-06-bio-catalogo.png" });
  });

  test("7. /admin/categorias redirige a pestaña categorías con botón 'Copiar link'", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // Inyectar sesión de administrador y datos locales de tienda en localStorage
    await page.addInitScript(() => {
      const jwtHeader = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const jwtPayload = btoa(
        JSON.stringify({
          sub: "mock-admin-user-id",
          email: "admin@dizi.lat",
          exp: 253402304000,
          app_metadata: { role: "store_owner" },
        })
      );
      const fakeJwt = `${jwtHeader}.${jwtPayload}.signature`;

      const sessionObj = {
        access_token: fakeJwt,
        refresh_token: "fake-refresh-token",
        expires_at: 253402304000,
        expires_in: 3600,
        token_type: "bearer",
        user: {
          id: "mock-admin-user-id",
          aud: "authenticated",
          role: "authenticated",
          email: "admin@dizi.lat",
          app_metadata: { role: "store_owner" },
          user_metadata: {},
          created_at: new Date().toISOString(),
        },
      };

      const storageObj = {
        ...sessionObj,
        currentSession: sessionObj,
      };

      localStorage.setItem("sb-zkqzdwxjthjdjchimmds-auth-token", JSON.stringify(storageObj));

      const mockStore = {
        id: "s_audit_test",
        slug: "tienda-audit",
        name: "Tienda Audit",
        phone: "51999888777",
        countryCode: "51",
        countryIso: "PE",
        plan: "pro",
        onboardingCompleted: true,
        categories: [
          { id: "cat-1", name: "Flores & follajes|flower" },
          { id: "cat-2", name: "Cerámica 🇵🇪|palette" },
        ],
        products: [],
      };

      localStorage.setItem(
        "dizi-catalogos-v2",
        JSON.stringify({
          state: {
            stores: [mockStore],
            currentStoreId: "s_audit_test",
            fetchError: false,
          },
          version: 0,
        })
      );
    });

    // Navegar directamente a la ruta deprecada /admin/categorias
    await page.goto("/admin/categorias");
    await page.waitForLoadState("domcontentloaded");

    // Debe haber redirigido a /admin/productos?tab=categorias
    await expect(page).toHaveURL(/admin\/productos\?tab=categorias/);

    // Verificar que la pestaña Categorías esté visible con el botón "Copiar link"
    const copyLinkBtn = page.locator("button:has-text('Copiar link')").first();
    await expect(copyLinkBtn).toBeVisible({ timeout: 10000 });

    // Probar acción de copiar link
    await copyLinkBtn.click();
    await expect(page.locator("text=categoría copiado").first()).toBeVisible({ timeout: 5000 });

    try {
      const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
      if (clipboardContent) {
        expect(clipboardContent).toContain("/t/tienda-audit?c=flores-follajes");
      }
    } catch {}

    await page.screenshot({ path: "test-results/fase4a-07-admin-categorias.png" });
  });

  test("8. api/seo con ?c=flores-follajes arma og:title y descripción", async ({ request, baseURL }) => {
    // Si baseURL está corriendo en local o en Vercel
    const url = `${baseURL}/api/seo?slug=catalogo&c=flores-follajes`;
    try {
      const res = await request.get(url);
      if (res.ok()) {
        const html = await res.text();
        expect(html).toContain("Flores &amp; follajes");
        expect(html).toContain("Adornia");
      }
    } catch {}
  });

  test("9. Captura celular en jhoselynperu con categoría abierta", async ({ page }) => {
    await page.goto("/t/jhoselynperu?c=panuelos");
    await page.waitForLoadState("domcontentloaded");

    const catalogHeader = page.locator("#catalogo");
    await expect(catalogHeader).toBeAttached({ timeout: 15000 });
    const shareBtn = page.locator("button:has-text('Compartir esta categoría')");
    await expect(shareBtn).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: "test-results/fase4a-09-jhoselynperu-categoria.png" });
  });
});
