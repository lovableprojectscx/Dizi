import { test, expect, Page } from "@playwright/test";
import path from "path";
import fs from "fs";

const CAPTURAS_DIR = "D:\\DIZI\\DIZI-20261014T161215Z-1-001\\DIZI\\INFORMACIÓN NECESARIA\\04-TECNICA\\encargos\\capturas-f52";

const mockStoreWithProducts = {
  id: "s_audit_f52",
  owner_id: "user-audit-f52",
  ownerId: "user-audit-f52",
  name: "Moda & Estilo Urbano",
  slug: "moda-estilo",
  phone: "51921585977",
  country_code: "51",
  countryCode: "51",
  country_iso: "PE",
  countryIso: "PE",
  model: "minimalista",
  plan: "pro",
  brand_color: "#0F172A",
  brandColor: "#0F172A",
  show_dizi_branding: false,
  showDiziBranding: false,
  active: true,
  is_published: true,
  isPublished: true,
  onboarding_completed: true,
  onboardingCompleted: true,
  bioLinksEnabled: true,
  bio_links_enabled: true,
  created_at: "2026-07-20T13:33:26Z",
  createdAt: "2026-07-20T13:33:26Z",
  whatsapp_clicks: 12,
  whatsappClicks: 12,
  categories: [{ id: "cat-1", name: "Ropa", store_id: "s_audit_f52" }],
  products: [
    {
      id: "prod_1",
      store_id: "s_audit_f52",
      name: "Polo Oversize Heavyweight",
      price: 69.9,
      original_price: 89.9,
      originalPrice: 89.9,
      is_on_sale: true,
      isOnSale: true,
      category_id: "cat-1",
      categoryId: "cat-1",
      image: "https://dizifotos.b-cdn.net/s_zapatillasdemo/products/p_zapas7.webp",
      visible: true,
      sort_order: 0,
      sortOrder: 0,
    },
    {
      id: "prod_2",
      store_id: "s_audit_f52",
      name: "Casaca Denim Vintage",
      price: 159.0,
      original_price: null,
      originalPrice: null,
      is_on_sale: false,
      isOnSale: false,
      category_id: "cat-1",
      categoryId: "cat-1",
      image: "https://dizifotos.b-cdn.net/s_zapatillasdemo/products/p_zapas2.webp",
      visible: true,
      sort_order: 1,
      sortOrder: 1,
    },
    {
      id: "prod_3",
      store_id: "s_audit_f52",
      name: "Zapatillas Urban Platform",
      price: 249.0,
      original_price: 299.0,
      originalPrice: 299.0,
      is_on_sale: true,
      isOnSale: true,
      category_id: "cat-1",
      categoryId: "cat-1",
      image: "https://dizifotos.b-cdn.net/s_zapatillasdemo/products/p_zapas7.webp",
      visible: true,
      sort_order: 2,
      sortOrder: 2,
    },
  ],
};

const mockStoreWithoutProducts = {
  ...mockStoreWithProducts,
  products: [],
};

const sessionPayload = {
  access_token: "mock-token-f52",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: 9999999999,
  refresh_token: "mock-refresh-f52",
  user: {
    id: "user-audit-f52",
    aud: "authenticated",
    role: "authenticated",
    email: "audit-f52@testdizi.com",
    app_metadata: { role: "store_owner" },
    user_metadata: {},
  },
};

async function setupMocks(page: Page, store: any) {
  await page.addInitScript(
    ({ s, session }) => {
      const payload = JSON.stringify({ ...session, currentSession: session });
      localStorage.setItem("sb-zkqzdwxjthjdjchimmds-auth-token", payload);
      localStorage.setItem("sb-dummy-auth-token", payload);
      localStorage.setItem("sb-localhost-auth-token", payload);
      localStorage.setItem("dizi_onboarding_dismissed", "true");
      localStorage.setItem("dizi-onboarding-completed", "true");
      localStorage.setItem(
        "dizi-catalogos-v2",
        JSON.stringify({
          state: {
            stores: [s],
            currentStoreId: s.id,
            fetchError: null,
            lastFetched: Date.now(),
          },
          version: 1,
        })
      );
    },
    { s: store, session: sessionPayload }
  );

  await page.route("**/auth/v1/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/user")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(sessionPayload.user),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(sessionPayload),
    });
  });

  await page.route("**/rest/v1/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/rest/v1/stores")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([store]),
      });
      return;
    }
    if (url.includes("/rest/v1/share_events")) {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify([{ id: "se_mock_1", ...route.request().postDataJSON() }]),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });
}

function ensureCapturasDir() {
  if (!fs.existsSync(CAPTURAS_DIR)) {
    fs.mkdirSync(CAPTURAS_DIR, { recursive: true });
  }
}

test.describe("F52 · Área Promociona en el panel (Escenarios 1 a 6)", () => {
  ensureCapturasDir();

  test("Escenario 1: Panel en celular (375 px) muestra Promociona en la barra inferior (5 ítems) y lleva a /admin/marketing", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await setupMocks(page, mockStoreWithProducts);

    await page.goto("/admin/dashboard");
    await page.waitForLoadState("networkidle");

    // Verificar que la barra inferior móvil está visible
    const navBar = page.locator("nav.fixed.bottom-0");
    await expect(navBar).toBeVisible();

    // 5 ítems exactos en la barra: Inicio, Productos, Promociona, Bio-Link, Más
    const navButtons = navBar.locator("a, button");
    await expect(navButtons).toHaveCount(5);

    const labels = await navButtons.allInnerTexts();
    const cleanLabels = labels.map((l) => l.trim().replace(/\s+/g, " "));
    expect(cleanLabels).toEqual(["Inicio", "Productos", "Promociona", "Bio-Link", "Más"]);

    // Verificar ergonomía táctil: cada ítem debe tener al menos 44 px de ancho y alto
    for (let i = 0; i < 5; i++) {
      const box = await navButtons.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }

    // Clic en 'Promociona' lleva a /admin/marketing
    const promocionaBtn = navButtons.nth(2);
    await promocionaBtn.click();
    await page.waitForURL("**/admin/marketing");
    expect(page.url()).toContain("/admin/marketing");

    // Verificar que 'Ajustes' está dentro de 'Más'
    const masBtn = navBar.locator("button:has-text('Más')");
    await masBtn.click();
    const sheetContent = page.locator("[role='dialog']");
    await expect(sheetContent).toBeVisible();

    const ajustesLink = sheetContent.locator("a[href='/admin/configuracion']");
    await expect(ajustesLink).toBeVisible();
    await expect(ajustesLink).toContainText("Ajustes");

    const disenoLink = sheetContent.locator("a[href='/admin/diseno']");
    await expect(disenoLink).toBeVisible();
    await expect(disenoLink).toContainText("Diseño");

    // Cerrar sheet
    await page.keyboard.press("Escape");

    // En escritorio (1280 px): verificar que el menú lateral incluye Promociona y Configuración
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/admin/marketing");
    await page.waitForLoadState("networkidle");

    const sidebarPromociona = page.locator("a[href='/admin/marketing']").first();
    await expect(sidebarPromociona).toBeVisible();
    await expect(sidebarPromociona).toContainText("Promociona");

    const sidebarConfiguracion = page.locator("a[href='/admin/configuracion']").first();
    await expect(sidebarConfiguracion).toBeVisible();
    await expect(sidebarConfiguracion).toContainText("Configuración");
  });

  test("Escenario 2: Página Marketing con productos permite elegir uno y abre ShareImageDialog", async ({
    page,
  }) => {
    await setupMocks(page, mockStoreWithProducts);

    // 1. En celular (375 px)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/marketing");
    await page.waitForLoadState("networkidle");

    // Verificar título del bloque
    await expect(page.locator("text=Crea una imagen para tus estados e historias")).toBeVisible();

    // Buscador funcional
    const searchInput = page.locator("input[placeholder*='Buscar producto']");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("Denim");

    // Solo debe aparecer 'Casaca Denim Vintage'
    await expect(page.locator("text=Casaca Denim Vintage")).toBeVisible();
    await expect(page.locator("text=Polo Oversize Heavyweight")).not.toBeVisible();

    // Limpiar buscador
    await searchInput.clear();
    await expect(page.locator("text=Polo Oversize Heavyweight")).toBeVisible();

    // Clic en 'Crear' del primer producto
    const crearBtn = page.locator("button:has-text('Crear')").first();
    await expect(crearBtn).toBeVisible();
    await crearBtn.click();

    // El diálogo ShareImageDialog debe abrirse
    const dialog = page.locator("[role='dialog']");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("text=Crear imagen para estados")).toBeVisible();

    // Esperar a que el diálogo esté completamente renderizado
    await page.waitForTimeout(1000);
    await page.addStyleTag({
      content: "*, *::before, *::after { animation: none !important; transition: none !important; }",
    });

    const snapPath375 = path.join(CAPTURAS_DIR, "marketing-dialogo-abierto-375px.png");
    await page.screenshot({ path: snapPath375, fullPage: false });
    console.log(`[Escenario 2] Guardada captura: ${snapPath375}`);
    expect(fs.existsSync(snapPath375)).toBe(true);

    // Cerrar diálogo
    await page.keyboard.press("Escape");

    // 2. En escritorio (1280 px)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/admin/marketing");
    await page.waitForLoadState("networkidle");

    const crearBtnDesk = page.locator("button:has-text('Crear')").first();
    await expect(crearBtnDesk).toBeVisible();
    await crearBtnDesk.click();

    const dialogDesk = page.locator("[role='dialog']");
    await expect(dialogDesk).toBeVisible();
    await expect(dialogDesk.locator("text=Crear imagen para estados")).toBeVisible();
    await page.waitForTimeout(1000);
    await page.addStyleTag({
      content: "*, *::before, *::after { animation: none !important; transition: none !important; }",
    });

    const snapPath1280 = path.join(CAPTURAS_DIR, "marketing-dialogo-abierto-1280px.png");
    await page.screenshot({ path: snapPath1280, fullPage: false });
    console.log(`[Escenario 2] Guardada captura: ${snapPath1280}`);
    expect(fs.existsSync(snapPath1280)).toBe(true);
  });

  test("Escenario 3: Tienda sin productos muestra mensaje claro y botón para agregar", async ({
    page,
  }) => {
    await setupMocks(page, mockStoreWithoutProducts);

    // 1. En celular (375 px)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/marketing");
    await page.waitForLoadState("networkidle");

    // Mensaje de estado vacío
    await expect(page.locator("text=Aún no tienes productos")).toBeVisible();
    await expect(
      page.locator("text=Para crear imágenes promocionales y compartirlas")
    ).toBeVisible();

    // Botón hacia Productos
    const addBtn = page.locator("a[href='/admin/productos']:has-text('Agregar mi primer producto')");
    await expect(addBtn).toBeVisible();

    await page.addStyleTag({
      content: "*, *::before, *::after { animation: none !important; transition: none !important; }",
    });

    const snapPath375 = path.join(CAPTURAS_DIR, "marketing-sin-productos-375px.png");
    await page.screenshot({ path: snapPath375, fullPage: false });
    console.log(`[Escenario 3] Guardada captura: ${snapPath375}`);
    expect(fs.existsSync(snapPath375)).toBe(true);

    // 2. En escritorio (1280 px)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/admin/marketing");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=Aún no tienes productos")).toBeVisible();

    await page.addStyleTag({
      content: "*, *::before, *::after { animation: none !important; transition: none !important; }",
    });

    const snapPath1280 = path.join(CAPTURAS_DIR, "marketing-sin-productos-1280px.png");
    await page.screenshot({ path: snapPath1280, fullPage: false });
    console.log(`[Escenario 3] Guardada captura: ${snapPath1280}`);
    expect(fs.existsSync(snapPath1280)).toBe(true);
  });

  test("Escenario 4: share_events registra source = 'marketing' desde Marketing y 'productos' desde Productos", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    const capturedEvents: any[] = [];
    await setupMocks(page, mockStoreWithProducts);

    // Interceptar share_events específicamente para capturar el payload
    await page.route("**/rest/v1/share_events*", async (route) => {
      const postData = route.request().postDataJSON();
      capturedEvents.push(postData);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify([{ id: "se_mock", ...postData }]),
      });
    });

    // 1. Desde Marketing
    await page.goto("/admin/marketing");
    await page.waitForLoadState("networkidle");

    const crearBtnMarketing = page.locator("button:has-text('Crear')").first();
    await crearBtnMarketing.click();
    await expect(page.locator("text=Crear imagen para estados")).toBeVisible();

    // Esperar a que el canvas termine y botón esté listo
    await expect(page.locator("text=Preparando diseño...")).not.toBeVisible({ timeout: 15_000 });
    const actionBtn = page.locator("button:has-text('Descargar imagen'), button:has-text('Compartir imagen')");
    await expect(actionBtn).toBeEnabled({ timeout: 10_000 });
    await actionBtn.click();

    // Comprobar que se registró con source = 'marketing'
    await page.waitForTimeout(500);
    const marketingEvent = capturedEvents.find((e) => e.source === "marketing");
    expect(marketingEvent).toBeDefined();
    expect(marketingEvent.source).toBe("marketing");
    expect(marketingEvent.store_id).toBe("s_audit_f52");

    // 2. Desde Productos
    capturedEvents.length = 0;
    await page.goto("/admin/productos");
    await page.waitForLoadState("networkidle");

    const crearBtnProductos = page.locator("button[title*='Crear imagen']:visible, button:has-text('Crear imagen'):visible").first();
    await expect(crearBtnProductos).toBeVisible();
    await crearBtnProductos.click();
    await expect(page.locator("text=Crear imagen para estados")).toBeVisible();

    await expect(page.locator("text=Preparando diseño...")).not.toBeVisible({ timeout: 15_000 });
    const actionBtnProd = page.locator("button:has-text('Descargar imagen'), button:has-text('Compartir imagen')");
    await expect(actionBtnProd).toBeEnabled({ timeout: 10_000 });
    await actionBtnProd.click();

    await page.waitForTimeout(500);
    const productosEvent = capturedEvents.find((e) => e.source === "productos");
    expect(productosEvent).toBeDefined();
    expect(productosEvent.source).toBe("productos");
  });

  test("Escenario 5: QR y link del catálogo visibles con botón Copiar funcionando", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await setupMocks(page, mockStoreWithProducts);

    // 1. En celular (375 px)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/marketing");
    await page.waitForLoadState("networkidle");

    // Interceptar clipboard en el navegador por seguridad
    await page.evaluate(() => {
      if (!navigator.clipboard) {
        (navigator as any).clipboard = {};
      }
      navigator.clipboard.writeText = () => Promise.resolve();
    });

    // Verificar título del bloque
    await expect(page.locator("h2:has-text('Comparte tu catálogo')")).toBeVisible();

    // Verificar QR generado
    const qrImg = page.locator("img[alt*='Código QR']");
    await expect(qrImg).toBeVisible({ timeout: 10_000 });
    const qrSrc = await qrImg.getAttribute("src");
    expect(qrSrc).toContain("data:image/png;base64");

    // Verificar link que contiene la ruta de la tienda (no texto estático dizi.pe)
    const linkContainer = page.locator("span.font-mono");
    await expect(linkContainer).toContainText("/t/moda-estilo");

    // Clic en 'Copiar enlace'
    const copyBtn = page.locator("button[title='Copiar enlace']");
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    // Verificar toast 'Enlace copiado'
    await expect(page.locator("text=Enlace copiado")).toBeVisible({ timeout: 5000 });

    // Verificar botón Descargar QR
    const downloadBtn = page.locator("button:has-text('Descargar QR')");
    await expect(downloadBtn).toBeVisible();
    await expect(downloadBtn).toBeEnabled();

    await page.addStyleTag({
      content: "*, *::before, *::after { animation: none !important; transition: none !important; }",
    });

    const snapPath375 = path.join(CAPTURAS_DIR, "marketing-con-productos-375px.png");
    await page.screenshot({ path: snapPath375, fullPage: false });
    console.log(`[Escenario 5] Guardada captura: ${snapPath375}`);
    expect(fs.existsSync(snapPath375)).toBe(true);

    // 2. En escritorio (1280 px)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/admin/marketing");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h2:has-text('Comparte tu catálogo')")).toBeVisible();

    await page.addStyleTag({
      content: "*, *::before, *::after { animation: none !important; transition: none !important; }",
    });

    const snapPath1280 = path.join(CAPTURAS_DIR, "marketing-con-productos-1280px.png");
    await page.screenshot({ path: snapPath1280, fullPage: false });
    console.log(`[Escenario 5] Guardada captura: ${snapPath1280}`);
    expect(fs.existsSync(snapPath1280)).toBe(true);
  });

  test("Escenario 6: Inicio se ve idéntico antes y después de extraer ShareCatalogCard", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await setupMocks(page, mockStoreWithProducts);

    await page.goto("/admin/dashboard");
    await page.waitForLoadState("networkidle");

    // Esperar QR
    await page.waitForSelector("img[alt*='Código QR']", { timeout: 10_000 });
    await page.waitForTimeout(1000);

    // Desactivar animaciones
    await page.addStyleTag({
      content: "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }",
    });

    const despuesPath = path.join(CAPTURAS_DIR, "dashboard-despues-375px.png");
    await page.screenshot({ path: despuesPath, fullPage: false });
    console.log(`[Escenario 6] Guardada captura: ${despuesPath}`);
    expect(fs.existsSync(despuesPath)).toBe(true);

    const antesPath = path.join(CAPTURAS_DIR, "dashboard-antes-375px.png");
    expect(fs.existsSync(antesPath)).toBe(true);

    // Comparar píxeles de antes y después
    const antesBuf = fs.readFileSync(antesPath);
    const despuesBuf = fs.readFileSync(despuesPath);

    console.log(`Tamaño archivo antes: ${antesBuf.length} bytes, después: ${despuesBuf.length} bytes`);

    // Comprobar visualmente la tarjeta extraída
    const cardLocator = page.locator("div.p-4.sm\\:p-6:has-text('Comparte tu Negocio')").locator("..");
    const cardBox = await cardLocator.boundingBox();
    expect(cardBox).not.toBeNull();

    const comparison = await page.evaluate(
      async ({ b64Antes, b64Despues, box }) => {
        const loadImg = (b64: string) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = `data:image/png;base64,${b64}`;
          });

        const [imgA, imgB] = await Promise.all([loadImg(b64Antes), loadImg(b64Despues)]);
        const w = Math.min(imgA.width, imgB.width);
        const h = Math.min(imgA.height, imgB.height);

        const canvas1 = document.createElement("canvas");
        canvas1.width = w;
        canvas1.height = h;
        const ctx1 = canvas1.getContext("2d")!;
        ctx1.drawImage(imgA, 0, 0);

        const canvas2 = document.createElement("canvas");
        canvas2.width = w;
        canvas2.height = h;
        const ctx2 = canvas2.getContext("2d")!;
        ctx2.drawImage(imgB, 0, 0);

        const d1 = ctx1.getImageData(0, 0, w, h).data;
        const d2 = ctx2.getImageData(0, 0, w, h).data;

        let total = w * h;
        let diffTotal = 0;
        let cardTotal = 0;
        let cardDiff = 0;

        const cardTop = Math.floor(box?.y ?? 0);
        const cardBottom = Math.ceil((box?.y ?? 0) + (box?.height ?? 0));

        for (let y = 0; y < h; y++) {
          const inCard = y >= cardTop && y <= cardBottom;
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            const dr = Math.abs(d1[i] - d2[i]);
            const dg = Math.abs(d1[i + 1] - d2[i + 1]);
            const db = Math.abs(d1[i + 2] - d2[i + 2]);
            const da = Math.abs(d1[i + 3] - d2[i + 3]);
            const diff = dr > 8 || dg > 8 || db > 8 || da > 8;

            if (diff) diffTotal++;

            if (inCard) {
              cardTotal++;
              if (diff) cardDiff++;
            }
          }
        }

        return {
          totalPixels: total,
          diffPixelsTotal: diffTotal,
          diffPercentTotal: (diffTotal / total) * 100,
          cardTotalPixels: cardTotal,
          cardDiffPixels: cardDiff,
          diffPercentCard: cardTotal > 0 ? (cardDiff / cardTotal) * 100 : 0,
        };
      },
      { b64Antes: antesBuf.toString("base64"), b64Despues: despuesBuf.toString("base64"), box: cardBox }
    );

    console.log(`[Escenario 6] Total pantalla: ${comparison.diffPercentTotal.toFixed(2)}% diferencia (debido a la barra inferior de 5 botones vs 4)`);
    console.log(`[Escenario 6] Componente ShareCatalogCard: ${comparison.diffPercentCard.toFixed(2)}% diferencia (card idéntica)`);
    expect(comparison.diffPercentCard).toBeLessThanOrEqual(0.5); // Idéntica con tolerancia a anti-aliasing de fuentes
  });
});
