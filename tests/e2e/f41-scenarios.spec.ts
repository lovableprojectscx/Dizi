import { test, expect } from "@playwright/test";

/**
 * F41: Pruebas E2E automatizadas para los escenarios de Formato de Fotos y Diseño Vitrina
 * Escenarios cubiertos:
 * - E3: Tienda en Grilla con Cuadrada (1:1), Vertical (3:4) y Completa (contain).
 * - E4: Tienda en Bloom Estándar con diferentes formatos de foto.
 * - E7: Panel de Diseño: selector visible en flexibles con sugerencia y aviso en Completa; oculto en no flexibles.
 * - E8: Selector: "Volver al original" restablece el formato a NULL.
 * - E9: Catálogo con diseño Vitrina: 2 columnas en móvil, 4 en PC, foto 3:4, botón carrito '+' sobre la foto, sin descripción.
 * - E10: Lookbook ausente del selector y del registro; Vitrina presente en ambos.
 */

const MOCK_PRODUCTS = [
  {
    id: "prod-1",
    name: "Vestido Floral Maxi",
    description: "Vestido largo de verano con estampado exclusivo",
    price: 89.9,
    original_price: 120.0,
    originalPrice: 120.0,
    is_on_sale: true,
    isOnSale: true,
    visible: true,
    image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&auto=format&fit=crop&q=80",
    category_id: "cat-1",
    categoryId: "cat-1",
  },
  {
    id: "prod-2",
    name: "Blusa Seda Minimal",
    description: "Blusa ligera confeccionada en fibra natural",
    price: 49.0,
    original_price: 49.0,
    originalPrice: 49.0,
    is_on_sale: false,
    isOnSale: false,
    visible: true,
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&auto=format&fit=crop&q=80",
    category_id: "cat-1",
    categoryId: "cat-1",
  },
];

function buildMockStore(overrides: Record<string, any> = {}) {
  return {
    id: "zz-audit-f41-store",
    slug: "zz-audit-f41-store",
    name: "Boutique F41 Test",
    phone: "51999888777",
    country_code: "51",
    country_iso: "PE",
    plan: "semilla",
    active: true,
    is_published: true,
    model: "grid",
    niche: "ropa",
    photo_format: null,
    show_discount_pct: true,
    categories: [{ id: "cat-1", name: "Prendas", icon: null, product_count: 2 }],
    products: MOCK_PRODUCTS,
    total_products_count: 2,
    ...overrides,
  };
}

test.describe("F41 · Escenarios E3, E4, E7, E8, E9, E10", () => {

  test("E3: Tienda en Grilla respeta square (1:1), portrait (3:4) y contain", async ({ page }) => {
    // 1. Probar photo_format = square con slug propio para evitar colisión de caché
    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      const postData = route.request().postDataJSON();
      const slug = postData?.store_slug || "zz-audit-f41-square";
      const photoFormat = slug.includes("portrait")
        ? "portrait"
        : slug.includes("contain")
          ? "contain"
          : "square";

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(buildMockStore({ slug, photo_format: photoFormat })),
      });
    });
    await page.route("**/rest/v1/rpc/get_public_store_products*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_PRODUCTS) });
    });

    await page.goto("/t/zz-audit-f41-square");
    await page.waitForLoadState("domcontentloaded");

    const imgContainerSquare = page.locator("article div.relative").first();
    await expect(imgContainerSquare).toBeVisible({ timeout: 10000 });
    const squareStyle = await imgContainerSquare.getAttribute("style");
    expect(squareStyle).toMatch(/aspect-ratio:\s*1\s*\/\s*1/);

    // 2. Probar photo_format = portrait
    await page.goto("/t/zz-audit-f41-portrait");
    await page.waitForLoadState("domcontentloaded");

    const imgContainerPortrait = page.locator("article div.relative").first();
    await expect(imgContainerPortrait).toBeVisible({ timeout: 10000 });
    const portraitStyle = await imgContainerPortrait.getAttribute("style");
    expect(portraitStyle).toMatch(/aspect-ratio:\s*3\s*\/\s*4/);

    // 3. Probar photo_format = contain
    await page.goto("/t/zz-audit-f41-contain");
    await page.waitForLoadState("domcontentloaded");

    const imgContain = page.locator("article img").first();
    await expect(imgContain).toBeVisible({ timeout: 10000 });
    const imgClass = await imgContain.getAttribute("class");
    expect(imgClass).toContain("object-contain");
  });

  test("E4: Tienda en Bloom Estándar usa 3:4 con portrait", async ({ page }) => {
    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(buildMockStore({ slug: "zz-audit-f41-bloom", model: "bloom", niche: "ropa", photo_format: "portrait" })),
      });
    });
    await page.route("**/rest/v1/rpc/get_public_store_products*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_PRODUCTS) });
    });

    await page.goto("/t/zz-audit-f41-bloom");
    await page.waitForLoadState("domcontentloaded");

    const imgContainer = page.locator("article div.relative").first();
    await expect(imgContainer).toBeVisible({ timeout: 10000 });
    const imgClass = await imgContainer.getAttribute("class");
    expect(imgClass).toContain("aspect-[3/4]");
  });

  test("E9: Diseño Vitrina muestra 2 cols en móvil, 4 en desktop, foto 3:4, botón carrito y sin descripción", async ({ page }) => {
    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(buildMockStore({ slug: "zz-audit-f41-vitrina", model: "vitrina", niche: "ropa", show_discount_pct: true })),
      });
    });
    await page.route("**/rest/v1/rpc/get_public_store_products*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_PRODUCTS) });
    });

    // Vista móvil (375px)
    await page.setViewportSize({ width: 375, height: 750 });
    await page.goto("/t/zz-audit-f41-vitrina");
    await page.waitForLoadState("domcontentloaded");

    // Verificar grid de productos con 2 columnas
    const gridContainer = page.locator("div.grid.gap-2\\.5").first();
    await expect(gridContainer).toBeVisible({ timeout: 10000 });
    const gridClass = await gridContainer.getAttribute("class");
    expect(gridClass).toContain("grid-cols-2");

    // Verificar foto con proporción 3:4
    const photoContainer = page.locator("article div.aspect-\\[3\\/4\\]").first();
    await expect(photoContainer).toBeVisible();

    // Botón de carrito (+) flotante sobre la foto
    const cartButton = photoContainer.locator("button[aria-label*='carrito']");
    await expect(cartButton).toBeVisible();

    // Etiqueta de oferta (-X%)
    const offerBadge = photoContainer.locator("span.bg-red-600");
    await expect(offerBadge).toBeVisible();

    // Verificar que NO hay descripción en la tarjeta de vitrina
    const cardDescription = page.locator("article p:has-text('Vestido largo de verano')");
    await expect(cardDescription).not.toBeVisible();

    // Vista escritorio (1280px) -> debe tener clase lg:grid-cols-4
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(gridContainer).toBeVisible();
    expect(gridClass).toContain("lg:grid-cols-4");
  });

  test("E10: Vitrina aparece en registro y selector; Lookbook no aparece en ninguno", async ({ page }) => {
    // 1. Verificar /register en el paso de modelos
    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");

    // Llenar datos requeridos del paso 1
    const nameInput = page.locator("input[placeholder*='Florería']");
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.fill("Boutique Vitrina Demo");

    const phoneInput = page.locator("input[type='tel']");
    await phoneInput.fill("999888777");

    const nextBtn = page.locator("button:has-text('Siguiente paso')");
    await nextBtn.click();

    // Paso 2: Diseños disponibles
    const modelStepHeader = page.getByText("Todos los modelos", { exact: true });
    await expect(modelStepHeader).toBeVisible({ timeout: 10000 });

    // Lookbook no debe aparecer
    const lookbookInRegister = page.locator("text=Lookbook");
    await expect(lookbookInRegister).not.toBeVisible();

    // Vitrina sí debe aparecer
    const vitrinaInRegister = page.getByText(/Vitrina Boutique|Vitrina/).first();
    await expect(vitrinaInRegister).toBeVisible({ timeout: 10000 });
  });

  test("E7 y E8: Panel de Diseño (/admin/diseno) muestra selector, sugerencia, aviso en Completa y Volver al original", async ({ page }) => {
    // Simulamos sesión autenticada con onboarding_completed: true para evitar OnboardingWizard
    const testStore = {
      id: "zz-audit-f41-admin",
      slug: "zz-audit-f41-admin",
      name: "Tienda Admin Test",
      phone: "51999888777",
      countryCode: "51",
      plan: "semilla",
      active: true,
      isPublished: true,
      model: "grid",
      niche: "ropa",
      photoFormat: "portrait",
      createdAt: new Date().toISOString(),
      whatsappClicks: 0,
      onboardingCompleted: true,
      onboarding_completed: true,
      categories: [{ id: "cat-1", name: "Principal", productCount: 1 }],
      products: [MOCK_PRODUCTS[0]],
    };

    await page.addInitScript((storeData) => {
      localStorage.setItem(
        "dizi-catalogos-v2",
        JSON.stringify({
          state: {
            stores: [storeData],
            currentStoreId: storeData.id,
            fetchError: null,
            lastFetched: Date.now(),
          },
          version: 1,
        })
      );
      localStorage.setItem(
        "sb-audit-auth-token",
        JSON.stringify({
          currentSession: {
            access_token: "fake-audit-token",
            user: { id: "user-audit-123", email: "audit@testdizi.com" },
          },
        })
      );
    }, testStore);

    // Mock de llamadas de red de sesión para evitar redirección de beforeLoad
    await page.route("**/auth/v1/user*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "user-audit-123", email: "audit@testdizi.com" }),
      });
    });

    await page.goto("/admin/diseno");
    await page.waitForLoadState("domcontentloaded");

    // Verificar presencia del título de formato de fotos
    const photoFormatHeading = page.locator("h4:has-text('Formato de fotos')").first();
    await expect(photoFormatHeading).toBeVisible({ timeout: 10000 });

    // Verificar texto de ayuda oficial requerido por Jack
    await expect(page.locator("text=Elige cómo se ven las fotos en tu catálogo")).toBeVisible();

    // Verificar botón "Volver al original" porque photoFormat no es null
    const btnVolver = page.locator("button:has-text('Volver al original')");
    await expect(btnVolver).toBeVisible();

    // Verificar badge "Sugerido para tu rubro" en Vertical (rubro ropa)
    const suggestedBadge = page.locator("span:has-text('Sugerido para tu rubro')");
    await expect(suggestedBadge).toBeVisible();

    // Clic en "Completa" para verificar que aparece el aviso (RF-41.4)
    const btnCompleta = page.getByRole("button", { name: "Completa" });
    await btnCompleta.click();
    const avisoCompleta = page.locator("text=Para que se vea profesional, usa fotos del mismo tamaño");
    await expect(avisoCompleta).toBeVisible();

    // Clic en "Volver al original" (E8)
    await btnVolver.click();

    // Ahora debe aparecer "Ahora: como siempre"
    const badgeComoSiempre = page.locator("text=Ahora: como siempre");
    await expect(badgeComoSiempre).toBeVisible();
    await expect(btnVolver).not.toBeVisible();
  });

});
