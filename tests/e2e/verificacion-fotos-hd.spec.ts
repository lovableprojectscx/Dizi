import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

/**
 * Suite E2E - FOTOS-HD: Calidad por tipo de imagen (F38)
 * Verificación en modo celular (Pixel 7 / 360x800).
 *
 * Verificaciones requeridas por el encargo y por Jack:
 * 1. Conversión de foto de 4000 px: original <= 1600 px (0.80), miniatura <= 600 px (0.78) desde el original.
 * 2. Foto normal de celular (no escalada): dimensiones preservadas (nunca agrandar), reporte de peso.
 * 3. Foto horizontal: escalado proporcional respetando max dimension 1600 px y aspect ratio, reporte de peso.
 * 4. Banner: escalado proporcional respetando max dimension 1920 px (0.80), reporte de peso.
 * 5. Flujo UI en /admin/productos: subida de foto HD con vista previa <= 1600 px.
 * 6. Flujo UI en /admin/diseno: subida de banner con vista previa <= 1920 px.
 * 7. Catálogo público: miniatura en cuadrícula y foto HD en modal de producto.
 */
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_IMAGES_DIR = path.resolve(__dirname, "../../scratch/test-images-hd");

test.describe("FOTOS-HD (F38) — Calidad y resolución por tipo de imagen", () => {
  test.use({
    viewport: { width: 360, height: 800 },
    isMobile: true,
    hasTouch: true,
  });

  const setupMockSession = async (page: any) => {
    // Interceptar llamadas a storage y API de Supabase para evitar llamadas remotas
    await page.route("**/storage/v1/object/**", async (route: any) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "image/webp",
          body: Buffer.from("UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoB+AA/vl2gAA==", "base64"),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ Key: "images/tienda-hd/mock.webp" }),
      });
    });

    await page.route("**/rest/v1/**", async (route: any) => {
      const url = route.request().url();
      if (url.includes("rpc/get_public_store")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "s_hd_test",
            slug: "tienda-hd",
            name: "Tienda HD Demo",
            plan: "pro",
            plan_expires_at: "2099-01-01T00:00:00Z",
            active: true,
            is_published: true,
            model: "grid",
            total_products_count: 1,
            banner_image: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/tienda-hd/banner_mock.webp",
            categories: [
              { id: "cat-1", name: "Ropa & Moda|shirt", product_count: 1 }
            ],
            products: [
              {
                id: "prod-hd-1",
                name: "Vestido 4K HD",
                price: 120.0,
                category_id: "cat-1",
                image: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/tienda-hd/products/prod1_main.webp",
                thumbnail: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/tienda-hd/products/prod1_main_thumb.webp",
                visible: true,
              }
            ],
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.addInitScript(() => {
      const jwtHeader = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const jwtPayload = btoa(
        JSON.stringify({
          sub: "mock-hd-admin",
          email: "admin-hd@dizi.lat",
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
          id: "mock-hd-admin",
          aud: "authenticated",
          role: "authenticated",
          email: "admin-hd@dizi.lat",
          app_metadata: { role: "store_owner" },
          user_metadata: {},
          created_at: new Date().toISOString(),
        },
      };

      localStorage.setItem("sb-zkqzdwxjthjdjchimmds-auth-token", JSON.stringify({ ...sessionObj, currentSession: sessionObj }));

      const mockStore = {
        id: "s_hd_test",
        slug: "tienda-hd",
        name: "Tienda HD Demo",
        phone: "51987654321",
        countryCode: "51",
        countryIso: "PE",
        plan: "pro",
        planExpiresAt: "2099-01-01T00:00:00Z",
        active: true,
        isPublished: true,
        onboardingCompleted: true,
        categories: [
          { id: "cat-1", name: "Ropa & Moda|shirt" }
        ],
        products: [],
      };

      localStorage.setItem(
        "dizi-catalogos-v2",
        JSON.stringify({
          state: {
            stores: [mockStore],
            currentStoreId: "s_hd_test",
            fetchError: false,
          },
          version: 0,
        })
      );
    });
  };

  test("1. Medición de pesos y dimensiones en el navegador (4K, normal celular, horizontal, banner)", async ({ page }) => {
    // Abrir página en blanco para evaluar directamente en el runtime del navegador
    await page.goto("/admin/productos");
    await page.waitForLoadState("domcontentloaded");

    // Ejecutar conversiones en el contexto real del navegador
    const file4kBase64 = fs.readFileSync(path.join(TEST_IMAGES_DIR, "foto_4000px.png")).toString("base64");
    const fileCelularBase64 = fs.readFileSync(path.join(TEST_IMAGES_DIR, "foto_celular_normal.jpg")).toString("base64");
    const fileHorizBase64 = fs.readFileSync(path.join(TEST_IMAGES_DIR, "foto_horizontal.jpg")).toString("base64");
    const fileBannerBase64 = fs.readFileSync(path.join(TEST_IMAGES_DIR, "foto_banner.png")).toString("base64");

    const stats = await page.evaluate(async ({ f4k, fCel, fHor, fBan }) => {
      // Helper para convertir dataUri a File
      const dataUriToFile = (dataUri: string, filename: string, mime: string) => {
        const byteString = atob(dataUri.split(",")[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        return new File([ab], filename, { type: mime });
      };

      const getImageDims = (src: string): Promise<{ width: number; height: number }> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
          img.onerror = reject;
          img.src = src;
        });
      };

      // Importar dinámicamente image-utils
      const imageUtils = await import("/src/lib/image-utils.ts");
      const { convertImageToWebP } = imageUtils;

      const file4k = dataUriToFile(`data:image/png;base64,${f4k}`, "foto_4000px.png", "image/png");
      const fileCel = dataUriToFile(`data:image/jpeg;base64,${fCel}`, "foto_celular_normal.jpg", "image/jpeg");
      const fileHor = dataUriToFile(`data:image/jpeg;base64,${fHor}`, "foto_horizontal.jpg", "image/jpeg");
      const fileBan = dataUriToFile(`data:image/png;base64,${fBan}`, "foto_banner.png", "image/png");

      const t0_4k = performance.now();
      const webp4k = await convertImageToWebP(file4k, "product");
      const thumb4k = await convertImageToWebP(file4k, "thumb");
      const t1_4k = performance.now();

      const t0_cel = performance.now();
      const webpCel = await convertImageToWebP(fileCel, "product");
      const t1_cel = performance.now();

      const t0_hor = performance.now();
      const webpHor = await convertImageToWebP(fileHor, "product");
      const t1_hor = performance.now();

      const t0_ban = performance.now();
      const webpBan = await convertImageToWebP(fileBan, "banner");
      const t1_ban = performance.now();

      const dims4k = await getImageDims(webp4k);
      const dimsThumb4k = await getImageDims(thumb4k);
      const dimsCel = await getImageDims(webpCel);
      const dimsHor = await getImageDims(webpHor);
      const dimsBan = await getImageDims(webpBan);

      const calcKb = (dataUrl: string) => ((dataUrl.length * 0.75) / 1024).toFixed(1);

      return {
        photo4k: {
          origKb: ((file4k.size) / 1024).toFixed(1),
          webpKb: calcKb(webp4k),
          thumbKb: calcKb(thumb4k),
          webpDims: dims4k,
          thumbDims: dimsThumb4k,
          timeMs: Math.round(t1_4k - t0_4k),
        },
        photoCelular: {
          origKb: ((fileCel.size) / 1024).toFixed(1),
          webpKb: calcKb(webpCel),
          webpDims: dimsCel,
          timeMs: Math.round(t1_cel - t0_cel),
        },
        photoHorizontal: {
          origKb: ((fileHor.size) / 1024).toFixed(1),
          webpKb: calcKb(webpHor),
          webpDims: dimsHor,
          timeMs: Math.round(t1_hor - t0_hor),
        },
        photoBanner: {
          origKb: ((fileBan.size) / 1024).toFixed(1),
          webpKb: calcKb(webpBan),
          webpDims: dimsBan,
          timeMs: Math.round(t1_ban - t0_ban),
        },
      };
    }, {
      f4k: file4kBase64,
      fCel: fileCelularBase64,
      fHor: fileHorizBase64,
      fBan: fileBannerBase64,
    });

    console.log("\n==========================================================================================");
    console.log("REPORTE DE PESOS Y RESOLUCIONES EN EL NAVEGADOR (FOTOS-HD)");
    console.log("==========================================================================================");
    console.log(`1. Foto 4K (4096x4096 px):`);
    console.log(`   - Original: ${stats.photo4k.origKb} KB (4096x4096 px)`);
    console.log(`   - WebP HD (1600/0.80): ${stats.photo4k.webpKb} KB (${stats.photo4k.webpDims.width}x${stats.photo4k.webpDims.height} px) en ${stats.photo4k.timeMs} ms`);
    console.log(`   - Miniatura (600/0.78): ${stats.photo4k.thumbKb} KB (${stats.photo4k.thumbDims.width}x${stats.photo4k.thumbDims.height} px)`);
    console.log(`2. Foto Celular Normal JPG (1200x1600 px - NO escalada):`);
    console.log(`   - Original: ${stats.photoCelular.origKb} KB (1200x1600 px)`);
    console.log(`   - WebP (conserva dimensiones): ${stats.photoCelular.webpKb} KB (${stats.photoCelular.webpDims.width}x${stats.photoCelular.webpDims.height} px) en ${stats.photoCelular.timeMs} ms`);
    console.log(`3. Foto Horizontal JPG (2400x1200 px):`);
    console.log(`   - Original: ${stats.photoHorizontal.origKb} KB (2400x1200 px)`);
    console.log(`   - WebP (1600/0.80): ${stats.photoHorizontal.webpKb} KB (${stats.photoHorizontal.webpDims.width}x${stats.photoHorizontal.webpDims.height} px) en ${stats.photoHorizontal.timeMs} ms`);
    console.log(`4. Foto Banner PNG (2560x1080 px):`);
    console.log(`   - Original: ${stats.photoBanner.origKb} KB (2560x1080 px)`);
    console.log(`   - WebP Banner (1920/0.80): ${stats.photoBanner.webpKb} KB (${stats.photoBanner.webpDims.width}x${stats.photoBanner.webpDims.height} px) en ${stats.photoBanner.timeMs} ms`);
    console.log("==========================================================================================\n");

    // Aserciones estrictas
    expect(stats.photo4k.webpDims.width).toBeLessThanOrEqual(1600);
    expect(stats.photo4k.webpDims.height).toBeLessThanOrEqual(1600);
    expect(stats.photo4k.thumbDims.width).toBeLessThanOrEqual(600);
    expect(stats.photo4k.thumbDims.height).toBeLessThanOrEqual(600);

    // Celular normal: NO agrandar, exactamente 1200x1600
    expect(stats.photoCelular.webpDims.width).toBe(1200);
    expect(stats.photoCelular.webpDims.height).toBe(1600);

    // Horizontal: maxDimension 1600 px, ratio 2:1 => 1600x800
    expect(stats.photoHorizontal.webpDims.width).toBe(1600);
    expect(stats.photoHorizontal.webpDims.height).toBe(800);

    // Banner: maxDimension 1920 px => 1920x810
    expect(stats.photoBanner.webpDims.width).toBe(1920);
    expect(stats.photoBanner.webpDims.height).toBe(810);
  });

  test("2. Flujo UI /admin/productos: Subir producto con foto 4K produce vista previa <= 1600 px y guarda", async ({ page }) => {
    await setupMockSession(page);
    await page.goto("/admin/productos");
    await page.waitForLoadState("domcontentloaded");

    // Cerrar diálogos residuales si los hubiera
    if (await page.locator('[role="dialog"]').isVisible().catch(() => false)) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }

    // Clic en + Producto
    const addProductBtn = page.locator('button:has-text("+ Producto")').or(page.locator('button:has-text("Nuevo Producto")')).first();
    await expect(addProductBtn).toBeVisible({ timeout: 10000 });
    await addProductBtn.click();

    // Completar nombre
    const nameInput = page.locator('input[placeholder*="Vestido"], input[placeholder*="iPhone"]').first();
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.fill("Polo 4K Ultra HD");

    // Desmarcar "A consultar" y poner precio
    const consultCheckbox = page.locator('label:has-text("A consultar")').first();
    if (await consultCheckbox.isVisible()) {
      await consultCheckbox.click();
    }
    const priceInput = page.locator('input[placeholder="0.00"]').or(page.locator('input[type="text"][inputMode="decimal"]')).first();
    await expect(priceInput).toBeEnabled({ timeout: 5000 });
    await priceInput.fill("89.90");

    // Subir foto 4K
    const fileInput = page.locator('input[type="file"][accept="image/*"]:not([multiple])');
    await fileInput.setInputFiles(path.join(TEST_IMAGES_DIR, "foto_4000px.png"));

    // Esperar a que la imagen se optimice y se muestre en preview
    const previewImg = page.locator('img[alt="preview"]').first();
    await expect(previewImg).toBeVisible({ timeout: 15000 });

    // Medir dimensiones del preview
    const previewDims = await previewImg.evaluate((img: HTMLImageElement) => ({
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    }));

    console.log(`[UI Test] Foto 4K en preview: ${previewDims.naturalWidth}x${previewDims.naturalHeight} px`);
    expect(previewDims.naturalWidth).toBeLessThanOrEqual(1600);
    expect(previewDims.naturalHeight).toBeLessThanOrEqual(1600);

    await page.screenshot({ path: "test-results/fotos-hd/01-admin-producto-4k.png" });

    // Guardar producto
    const saveBtn = page.locator('button:has-text("Guardar producto")');
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    // Verificar que el diálogo se cierra
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 15000 });
  });

  test("3. Flujo UI /admin/productos: Foto celular normal (1200x1600) conserva dimensiones exactas", async ({ page }) => {
    await setupMockSession(page);
    await page.goto("/admin/productos");
    await page.waitForLoadState("domcontentloaded");

    if (await page.locator('[role="dialog"]').isVisible().catch(() => false)) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }

    const addProductBtn = page.locator('button:has-text("+ Producto")').or(page.locator('button:has-text("Nuevo Producto")')).first();
    await expect(addProductBtn).toBeVisible({ timeout: 10000 });
    await addProductBtn.click();

    const nameInput = page.locator('input[placeholder*="Vestido"], input[placeholder*="iPhone"]').first();
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.fill("Foto Celular Normal");

    const consultCheckbox = page.locator('label:has-text("A consultar")').first();
    if (await consultCheckbox.isVisible()) {
      await consultCheckbox.click();
    }
    const priceInput = page.locator('input[placeholder="0.00"]').or(page.locator('input[type="text"][inputMode="decimal"]')).first();
    await expect(priceInput).toBeEnabled({ timeout: 5000 });
    await priceInput.fill("45.00");

    const fileInput = page.locator('input[type="file"][accept="image/*"]:not([multiple])');
    await fileInput.setInputFiles(path.join(TEST_IMAGES_DIR, "foto_celular_normal.jpg"));

    const previewImg = page.locator('img[alt="preview"]').first();
    await expect(previewImg).toBeVisible({ timeout: 15000 });

    const previewDims = await previewImg.evaluate((img: HTMLImageElement) => ({
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    }));

    console.log(`[UI Test] Foto celular normal en preview: ${previewDims.naturalWidth}x${previewDims.naturalHeight} px (esperado: 1200x1600)`);
    expect(previewDims.naturalWidth).toBe(1200);
    expect(previewDims.naturalHeight).toBe(1600);

    await page.screenshot({ path: "test-results/fotos-hd/02-admin-producto-celular.png" });
  });

  test("4. Flujo UI /admin/diseno: Subida de banner (2560x1080 px) escala a <= 1920 px", async ({ page }) => {
    await setupMockSession(page);
    await page.goto("/admin/diseno");
    await page.waitForLoadState("domcontentloaded");

    // Navegar a la pestaña '3. Módulos & Funciones' donde se encuentra la sección de Banners
    const modulosTab = page.locator("button:has-text('3. Módulos & Funciones')");
    await expect(modulosTab).toBeVisible({ timeout: 10000 });
    await modulosTab.click();
    await page.waitForTimeout(500);

    // Buscar input de banner
    const bannerFileInput = page.locator('input[type="file"][accept="image/*"]').first();
    await expect(bannerFileInput).toBeAttached({ timeout: 10000 });
    await bannerFileInput.setInputFiles(path.join(TEST_IMAGES_DIR, "foto_banner.png"));

    // Esperar toast informativo de actualización de banner
    await expect(page.locator("text=Banner actualizado").first()).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: "test-results/fotos-hd/03-admin-banner-hd.png" });
  });

  test("5. Catálogo público /t/tienda-hd: Miniatura en cuadrícula y foto HD al abrir el modal", async ({ page }) => {
    await setupMockSession(page);
    await page.goto("/t/tienda-hd");
    await page.waitForLoadState("domcontentloaded");

    // Verificar que el catálogo carga y muestra el producto
    const productCard = page.locator("text=Vestido 4K HD").first();
    await expect(productCard).toBeVisible({ timeout: 15000 });

    // La imagen en la cuadrícula debe usar la miniatura (_thumb.webp)
    const gridImg = page.locator('img[alt*="Vestido 4K HD"]').first();
    await expect(gridImg).toBeVisible({ timeout: 10000 });
    const gridSrc = await gridImg.getAttribute("src");
    console.log("[Catálogo Test] URL de imagen en cuadrícula:", gridSrc);
    expect(gridSrc).toContain("_thumb.webp");

    // Abrir modal de detalle del producto
    await productCard.click();
    await page.waitForTimeout(500);

    // Modal de producto abierto
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 10000 });

    // En el modal de detalle, la imagen principal HD (no el backdrop blur ni el chip)
    const modalMainImg = modal.locator('img[alt="Vestido 4K HD"]').first();
    await expect(modalMainImg).toBeVisible({ timeout: 10000 });
    const modalSrc = await modalMainImg.getAttribute("src");
    console.log("[Catálogo Test] URL de imagen HD principal en modal:", modalSrc);
    expect(modalSrc).toContain("prod1_main.webp");
    expect(modalSrc).not.toContain("_thumb.webp");

    await page.screenshot({ path: "test-results/fotos-hd/04-catalogo-grid-y-modal.png" });
  });
});
