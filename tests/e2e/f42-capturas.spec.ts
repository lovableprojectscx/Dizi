import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const CAPTURAS_DIR = path.resolve(process.cwd(), "capturas");

test.beforeAll(() => {
  if (!fs.existsSync(CAPTURAS_DIR)) {
    fs.mkdirSync(CAPTURAS_DIR, { recursive: true });
  }
});

const mockProducts = [
  {
    id: "prod-polo-1",
    name: "Polo Oversize Heavyweight",
    price: 35.0,
    original_price: null,
    is_on_sale: false,
    visible: true,
    is_sample: false,
    image: "/images/mockups/boutique.png",
    description: "Algodón reactivo 20/1 de alta densidad. Cuello grueso en rib.",
    category_id: "cat-moda",
    sort_order: 1,
    wholesale_tiers: [
      { min_qty: 3, price: 28.0 },
      { min_qty: 12, price: 24.0 },
    ],
    variations: [
      { id: "var-s", name: "Talla S", price: 35.0 },
      { id: "var-m", name: "Talla M", price: 35.0 },
      { id: "var-l", name: "Talla L", price: 35.0 },
    ],
  },
  {
    id: "prod-gorra-2",
    name: "Gorra Urbana Vintage",
    price: 45.0,
    original_price: 55.0,
    is_on_sale: true,
    visible: true,
    is_sample: false,
    image: "/images/mockups/luxury.png",
    description: "Dril lavado con bordado frontal en relieve.",
    category_id: "cat-moda",
    sort_order: 2,
    wholesale_tiers: [],
    variations: [],
  },
];

const mockStoreBase = {
  id: "store_f42_demo",
  phone: "51999888777",
  country_code: "51",
  country_iso: "PE",
  plan: "emprendedor",
  active: true,
  is_published: true,
  primary_color: "#6366f1",
  categories: [{ id: "cat-moda", name: "Moda & Ropa", icon: null, product_count: 2 }],
  total_products_count: 2,
};

test.describe("F42 · Evidencias Fotográficas de Precios por Mayor", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.clear();
    });
  });

  test("1. Interruptor APAGADO: Catálogo idéntico a master (sin labels ni cambios)", async ({ page }) => {
    const slug = "f42-switch-off";
    await page.route(`**/rest/v1/rpc/get_public_store*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...mockStoreBase,
          slug,
          name: "Gamarra Trends",
          wholesale_enabled: false,
          model: "grid-compact",
          products: mockProducts,
        }),
      });
    });

    await page.route("**/rest/v1/rpc/get_public_store_products*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    });

    await page.goto(`/t/${slug}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // No debe mostrar "Precio x mayor"
    const text = await page.locator("body").innerText();
    expect(text).not.toContain("Precio x mayor");

    await page.screenshot({
      path: path.join(CAPTURAS_DIR, "f42-01-catalogo-interruptor-apagado.png"),
      fullPage: false,
    });
  });

  test("2. Interruptor PRENDIDO en layout DIAGONAL (RF-42.5 + Jack: Diagonal)", async ({ page }) => {
    const slug = "f42-diagonal";
    await page.route(`**/rest/v1/rpc/get_public_store*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...mockStoreBase,
          slug,
          name: "Diagonal Dark Store",
          wholesale_enabled: true,
          model: "diagonal",
          primary_color: "#8b5cf6",
          products: mockProducts,
        }),
      });
    });

    await page.route("**/rest/v1/rpc/get_public_store_products*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    });

    await page.goto(`/t/${slug}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Debe mostrar la etiqueta "Precio x mayor"
    await expect(page.locator("body")).toContainText("Precio x mayor");

    await page.screenshot({
      path: path.join(CAPTURAS_DIR, "f42-02-tarjeta-diseno-diagonal.png"),
      fullPage: false,
    });
  });

  test("3. Interruptor PRENDIDO en layout BITE GASTRO (RF-42.5 + Jack: Bite)", async ({ page }) => {
    const slug = "f42-bite";
    await page.route(`**/rest/v1/rpc/get_public_store*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...mockStoreBase,
          slug,
          name: "Bite Gastro Fashion",
          wholesale_enabled: true,
          model: "bite",
          primary_color: "#ea580c",
          products: mockProducts,
        }),
      });
    });

    await page.route("**/rest/v1/rpc/get_public_store_products*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    });

    await page.goto(`/t/${slug}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page.locator("body")).toContainText("Precio x mayor");

    // Scroll al producto para que la tarjeta en Bite sea visible
    const productCard = page.locator("text=Polo Oversize Heavyweight").first();
    await productCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    await page.screenshot({
      path: path.join(CAPTURAS_DIR, "f42-03-tarjeta-diseno-bite.png"),
      fullPage: false,
    });
  });

  test("4. Detalle de Producto con Tabla de Precios por Mayor (Sin Gamarra Deal, Sin Stock)", async ({ page }) => {
    const slug = "f42-modal";
    await page.route(`**/rest/v1/rpc/get_public_store*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...mockStoreBase,
          slug,
          name: "Modal Detail Store",
          wholesale_enabled: true,
          model: "grid-compact",
          products: mockProducts,
        }),
      });
    });

    await page.route("**/rest/v1/rpc/get_public_store_products*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    });

    await page.goto(`/t/${slug}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Abrir modal de detalle haciendo click en el primer producto
    await page.locator("article").first().click();
    await page.waitForTimeout(600);

    // Verificar que la tabla de precios por mayor esté visible
    await expect(page.locator("body")).toContainText("Precios por mayor disponibles");
    await expect(page.locator("body")).toContainText("Desde 3 u.");
    await expect(page.locator("body")).toContainText("S/ 28.00");
    await expect(page.locator("body")).toContainText("Desde 12 u.");
    await expect(page.locator("body")).toContainText("S/ 24.00");

    // Verificar que NO existan etiquetas prohibidas
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toContain("Gamarra Deal");
    expect(bodyText).not.toContain("En Stock");

    await page.screenshot({
      path: path.join(CAPTURAS_DIR, "f42-04-detalle-tabla-precios-sin-stock.png"),
      fullPage: false,
    });
  });

  test("5. Carrito con 2 unidades: Sugerencia 'Agrega 1 más y pagas S/ 28.00 c/u' (missingUnits <= 3)", async ({ page }) => {
    const slug = "f42-cart-2u";
    await page.route(`**/rest/v1/rpc/get_public_store*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...mockStoreBase,
          slug,
          name: "Cart Progress Store",
          wholesale_enabled: true,
          model: "grid-compact",
          products: mockProducts,
        }),
      });
    });

    await page.route("**/rest/v1/rpc/get_public_store_products*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    });

    await page.addInitScript(() => {
      localStorage.setItem(
        "dizi-carts-v1",
        JSON.stringify({
          state: {
            carts: {
              store_f42_demo: [{ productId: "prod-polo-1", qty: 2 }],
            },
          },
          version: 0,
        })
      );
    });

    await page.goto(`/t/${slug}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Abrir el carrito haciendo click en el botón flotante del carrito
    const cartButton = page.locator("button:has(.lucide-shopping-bag)").last();
    await cartButton.click();
    await page.waitForTimeout(600);

    // Verificar sugerencia
    await expect(page.locator("body")).toContainText("Agrega 1 más y pagas");
    await expect(page.locator("body")).toContainText("S/ 28.00 c/u");

    await page.screenshot({
      path: path.join(CAPTURAS_DIR, "f42-05-carrito-falta-poco-2-unidades.png"),
      fullPage: false,
    });
  });

  test("6. Carrito con 3 unidades: 'Precio por mayor aplicado' y Ahorro calculado", async ({ page }) => {
    const slug = "f42-cart-3u";
    await page.route(`**/rest/v1/rpc/get_public_store*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...mockStoreBase,
          slug,
          name: "Cart Applied Store",
          wholesale_enabled: true,
          model: "grid-compact",
          products: mockProducts,
        }),
      });
    });

    await page.route("**/rest/v1/rpc/get_public_store_products*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    });

    await page.addInitScript(() => {
      localStorage.setItem(
        "dizi-carts-v1",
        JSON.stringify({
          state: {
            carts: {
              store_f42_demo: [
                { productId: "prod-polo-1", variationId: "var-m", variationName: "Talla M", variationPrice: 35.0, qty: 2 },
                { productId: "prod-polo-1", variationId: "var-l", variationName: "Talla L", variationPrice: 35.0, qty: 1 },
              ],
            },
          },
          version: 0,
        })
      );
    });

    await page.goto(`/t/${slug}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Abrir el carrito
    const cartButton = page.locator("button:has(.lucide-shopping-bag)").last();
    await cartButton.click();
    await page.waitForTimeout(600);

    // Verificar precio mayorista aplicado y ahorro
    await expect(page.locator("body")).toContainText("Precio x mayor: S/ 28.00 c/u");
    await expect(page.locator("body")).toContainText("Ahorro por mayor");
    await expect(page.locator("body")).toContainText("-S/ 21.00");
    await expect(page.locator("body")).toContainText("S/ 84.00");

    await page.screenshot({
      path: path.join(CAPTURAS_DIR, "f42-06-carrito-mayorista-aplicado-3-unidades.png"),
      fullPage: false,
    });
  });

  test("7. Panel Admin: Editor de Precios por Mayor (Nivel 1/2/3 sin 'Docena', precios con punto)", async ({ page }) => {
    const mockStore = {
      id: "store_admin_f42",
      slug: "admin-f42",
      name: "Admin Wholesale Store",
      phone: "51999888777",
      countryCode: "51",
      plan: "emprendedor",
      wholesaleEnabled: true,
      active: true,
      isPublished: true,
      onboardingCompleted: true,
      logo: "/images/Logo.png",
      bannerImage: "/images/mockups/boutique.png",
      categories: [{ id: "cat-1", name: "Ropa" }],
      products: [
        {
          id: "p1",
          name: "Polo Oversize Premium",
          price: 35.0,
          categoryId: "cat-1",
          image: "/images/mockups/boutique.png",
          visible: true,
          wholesaleTiers: [
            { min_qty: 3, price: 28.0 },
            { min_qty: 12, price: 24.0 },
          ],
          variations: [],
        },
      ],
    };

    const sessionPayload = {
      access_token: "mock-token",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: 9999999999,
      refresh_token: "mock-refresh",
      user: {
        id: "user-123",
        aud: "authenticated",
        role: "authenticated",
        email: "admin@dizi.pe",
        app_metadata: { role: "store_owner" },
        user_metadata: {},
      },
    };

    // Mock auth and store in localStorage
    await page.addInitScript(({ store, session }) => {
      localStorage.setItem("sb-zkqzdwxjthjdjchimmds-auth-token", JSON.stringify(session));
      localStorage.setItem(
        "dizi-catalogos-v2",
        JSON.stringify({
          state: {
            stores: [store],
            currentStoreId: store.id,
            fetchError: false,
          },
          version: 0,
        })
      );
    }, { store: mockStore, session: sessionPayload });

    // Mock Supabase Auth network calls
    await page.route("**/auth/v1/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(sessionPayload),
      });
    });

    // Mock Stores fetch
    await page.route("**/rest/v1/stores*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([mockStore]),
      });
    });

    await page.goto("/admin/productos");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);

    // Click en Editar producto o Nuevo Producto
    const editBtn = page.locator("button:has-text('Editar'), button:has(.lucide-pencil), button[title*='Editar']").first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
    } else {
      await page.locator("button:has-text('Nuevo Producto'), button:has-text('Agregar Producto')").first().click();
    }
    await page.waitForTimeout(800);

    // Asegurar que la sección plegable esté abierta y scrollear al editor
    const nivel1Label = page.locator("text=Nivel 1").first();
    if (!(await nivel1Label.isVisible())) {
      const accordionTrigger = page.locator("button:has-text('Precio por Mayor')").first();
      if (await accordionTrigger.isVisible()) {
        await accordionTrigger.scrollIntoViewIfNeeded();
        await accordionTrigger.click();
        await page.waitForTimeout(600);
      }
    }

    // Scrollear para que el editor de niveles y simulador se vean perfectamente
    await page.locator("text=Nivel 1").first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(CAPTURAS_DIR, "f42-07-admin-editor-precios-por-mayor.png"),
      fullPage: false,
    });
  });
});
