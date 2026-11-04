import { test, expect } from "@playwright/test";

const STORE_DATA = {
  id: "s_zzaudit_f42_1",
  slug: "zz-audit-f42-1-movil",
  name: "GigaTech Store",
  phone: "51999888777",
  country_code: "51",
  country_iso: "PE",
  plan: "ilimitado",
  wholesale_enabled: true,
  active: true,
  is_published: true,
  is_dark: false,
  brand_color: "#2563eb",
  card_style: "standard",
  model: "grid",
  total_products_count: 3,
  categories: [],
  products: [
    {
      id: "p_1",
      name: "iPhone 15 Pro Max 256GB - Titanio Natural (Distribución Oficial Autorizada)",
      description: "Smartphone Apple con chip A17 Pro y cámara de 48MP",
      price: 4999.0,
      original_price: 4999.0,
      originalPrice: 4999.0,
      is_on_sale: false,
      isOnSale: false,
      visible: true,
      is_sample: false,
      sort_order: 1,
      image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80",
      wholesale_tiers: [
        { min_qty: 3, price: 4249.15 },
        { min_qty: 6, price: 3824.23 },
      ],
    },
    {
      id: "p_2",
      name: "Hoodie Oversize Heavyweight Fleece Edición Invierno",
      description: "Polera térmica con capucha y bolsillo canguro",
      price: 189.0,
      original_price: 189.0,
      originalPrice: 189.0,
      is_on_sale: false,
      isOnSale: false,
      visible: true,
      is_sample: false,
      sort_order: 2,
      image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80",
      variations: [
        { id: "v_negro_l", name: "Negro / Talla L", price: null },
      ],
      wholesale_tiers: [
        { min_qty: 3, price: 149.0 },
        { min_qty: 5, price: 129.0 },
      ],
    },
    {
      id: "p_3",
      name: "Funda Silicona Líquida MagSafe Premium",
      description: "Protección contra caídas con imanes integrados",
      price: 79.9,
      original_price: 79.9,
      originalPrice: 79.9,
      is_on_sale: false,
      isOnSale: false,
      visible: true,
      is_sample: false,
      sort_order: 3,
      image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&auto=format&fit=crop&q=80",
      wholesale_tiers: [],
    },
  ],
};

test.describe("F42.1 · Carrito móvil en Android (movil-android)", () => {
  test.beforeEach(async ({ page }) => {
    // Sembrar carrito con 3 productos
    await page.addInitScript((storeId) => {
      const cartData = {
        state: {
          carts: {
            [storeId]: [
              {
                productId: "p_1",
                qty: 1,
                variationId: null,
                variationName: null,
                variationPrice: null,
                variationImage: null,
              },
              {
                productId: "p_2",
                qty: 3,
                variationId: "v_negro_l",
                variationName: "Negro / Talla L",
                variationPrice: null,
                variationImage: null,
              },
              {
                productId: "p_3",
                qty: 1,
                variationId: null,
                variationName: null,
                variationPrice: null,
                variationImage: null,
              },
            ],
          },
        },
        version: 0,
      };
      localStorage.setItem("dizi-carts-v1", JSON.stringify(cartData));
    }, STORE_DATA.id);

    // Mock RPC
    await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(STORE_DATA),
      });
    });

    await page.goto(`/t/${STORE_DATA.slug}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    // Abrir carrito
    const cartButton = page.locator('button[aria-label="Ver carrito"]');
    await cartButton.waitFor({ state: "visible", timeout: 10000 });
    await cartButton.click();
    await page.waitForSelector('text="Tu pedido"', { timeout: 10000 });
  });

  test("1. Estructura de 3 filas, precios formateados con separador de miles y subtotales", async ({ page }) => {
    const cart = page.locator('[role="dialog"]');

    // Fila 1: Foto 64px (h-16 w-16 = 64x64)
    const imgProduct1 = cart.locator('img[alt^="iPhone 15 Pro Max"]').first();
    await expect(imgProduct1).toBeVisible();
    const imgBox = await imgProduct1.boundingBox();
    expect(imgBox?.width).toBeCloseTo(64, 1);
    expect(imgBox?.height).toBeCloseTo(64, 1);

    // Precio unitario con separador de miles
    await expect(cart.getByText(/S\/\s*4,999\.00/).first()).toBeVisible();

    // Fila 2: Subtotal de la línea
    await expect(cart.locator('text="Subtotal"').first()).toBeVisible();

    // Fila 3: WholesaleProgress a todo el ancho
    await expect(cart.locator('text=Agrega 2 más y pagas').first()).toBeVisible();
    await expect(cart.locator('text="1 de 3"')).toBeVisible();

    // Línea 2 con opción de talla y precio mayor aplicado
    await expect(cart.locator('text="Opción: Negro / Talla L"')).toBeVisible();
    await expect(cart.locator('text=Precio x mayor: S/ 149.00 c/u')).toBeVisible();
    await expect(cart.locator('text=Agrega 2 u. más y pagas')).toBeVisible();
  });

  test("2. Subir y bajar cantidad actualiza subtotal y progreso de mayorista", async ({ page }) => {
    const cart = page.locator('[role="dialog"]');

    // Localizar botones de la primera tarjeta dentro del carrito
    const btnPlus = cart.locator('button[aria-label="Aumentar cantidad"]').first();
    const btnMinus = cart.locator('button[aria-label="Disminuir cantidad"]').first();

    // Cantidad inicial = 1
    // Clic en + para subir a 2
    await btnPlus.click();
    await page.waitForTimeout(300);

    // Subtotal de p_1 sube a S/ 9,998.00 (2 * 4999)
    await expect(cart.locator('text="S/ 9,998.00"')).toBeVisible();
    // Progreso actualiza a "2 de 3"
    await expect(cart.locator('text="2 de 3"')).toBeVisible();
    await expect(cart.locator('text=Agrega 1 más y pagas')).toBeVisible();

    // Clic en + para subir a 3 (alcanza precio por mayor: S/ 4,249.15 c/u)
    await btnPlus.click();
    await page.waitForTimeout(300);

    // Subtotal pasa a 3 * 4249.15 = 12747.45 -> "S/ 12,747.45"
    await expect(cart.locator('text="S/ 12,747.45"')).toBeVisible();
    await expect(cart.locator('text=Precio x mayor: S/ 4,249.15 c/u · 3 u.')).toBeVisible();

    // Clic en - para bajar a 2
    await btnMinus.click();
    await page.waitForTimeout(300);

    // Vuelve a S/ 9,998.00
    await expect(cart.locator('text="S/ 9,998.00"')).toBeVisible();
    await expect(cart.locator('text="2 de 3"')).toBeVisible();
  });

  test("3. Borrar una línea elimina la tarjeta del carrito", async ({ page }) => {
    const cart = page.locator('[role="dialog"]');

    // Hay 3 tarjetas inicialmente dentro del carrito
    const trashButtons = cart.locator('button[aria-label^="Eliminar"]');
    await expect(trashButtons).toHaveCount(3);

    // Borrar la última tarjeta (Funda Silicona)
    await trashButtons.nth(2).click();
    await page.waitForTimeout(300);

    // Ahora quedan 2 tarjetas en el carrito
    await expect(cart.locator('button[aria-label^="Eliminar"]')).toHaveCount(2);
    await expect(cart.locator('text="Funda Silicona Líquida MagSafe Premium"')).not.toBeVisible();
  });

  test("4. Botones táctiles de cantidad y papelera miden al menos 36 px (R3)", async ({ page }) => {
    const cart = page.locator('[role="dialog"]');

    const btnPlus = cart.locator('button[aria-label="Aumentar cantidad"]').first();
    const btnMinus = cart.locator('button[aria-label="Disminuir cantidad"]').first();
    const btnTrash = cart.locator('button[aria-label^="Eliminar"]').first();

    const boxPlus = await btnPlus.boundingBox();
    const boxMinus = await btnMinus.boundingBox();
    const boxTrash = await btnTrash.boundingBox();

    expect(boxPlus?.width).toBeGreaterThanOrEqual(36);
    expect(boxPlus?.height).toBeGreaterThanOrEqual(36);

    expect(boxMinus?.width).toBeGreaterThanOrEqual(36);
    expect(boxMinus?.height).toBeGreaterThanOrEqual(36);

    expect(boxTrash?.width).toBeGreaterThanOrEqual(36);
    expect(boxTrash?.height).toBeGreaterThanOrEqual(36);
  });
});
