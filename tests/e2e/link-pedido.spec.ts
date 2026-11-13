import { test, expect, type Page } from "@playwright/test";

const IMG_1 =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='100%' height='100%' fill='%234f46e5'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' font-family='sans-serif' font-size='32'>P1</text></svg>";
const IMG_2 =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='100%' height='100%' fill='%2310b981'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' font-family='sans-serif' font-size='32'>P2</text></svg>";
const LOGO_SVG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='100%' height='100%' fill='%2318181b'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' font-family='sans-serif' font-size='56'>M</text></svg>";

function buildPublicStore(orderLinkEnabled: boolean) {
  return {
    id: "store-order-link-e2e",
    slug: "tienda-link-pedido",
    name: "Moda Urbana Test",
    phone: "51987654321",
    country_code: "51",
    country_iso: "PE",
    logo: LOGO_SVG,
    brand_color: "#4f46e5",
    bg_color: "#ffffff",
    text_color: "#18181b",
    card_bg: "#ffffff",
    accent_color: "#e0e7ff",
    border_radius: "12px",
    img_shape: "rounded",
    photo_format: null,
    is_dark: false,
    banner_image: "",
    banner_title: "Nueva Temporada",
    banner_tagline: "Envíos a todo el país",
    banner_style: "direct",
    niche: "moda",
    catalog_typography: "sans",
    card_style: "standard",
    plan: "pro",
    model: "clasico",
    active: true,
    is_published: true,
    created_at: "2026-01-01T00:00:00Z",
    whatsapp_clicks: 0,
    views: 0,
    price_filter_enabled: false,
    order_link_enabled: orderLinkEnabled,
    libro_reclamaciones_activo: false,
    categories: [{ id: "cat-moda", name: "Polos", product_count: 4 }],
    products: [
      {
        id: "prod-polo-1",
        name: "Polo Oversize Blanco",
        price: 59,
        category_id: "cat-moda",
        image: IMG_1,
        description: "Algodón pima 240g",
        is_on_sale: false,
        visible: true,
        sort_order: 1,
        variations: [],
        wholesale_tiers: [],
        created_at: "2026-01-01T00:00:00Z",
      },
      {
        id: "prod-extra-2",
        name: "Polera Basic Gris",
        price: 89,
        category_id: "cat-moda",
        image: IMG_2,
        description: "Franela reactiva",
        is_on_sale: false,
        visible: true,
        sort_order: 2,
        variations: [],
        wholesale_tiers: [],
        created_at: "2026-01-01T00:00:00Z",
      },
      {
        id: "prod-extra-3",
        name: "Jogger Urbano Negro",
        price: 99,
        category_id: "cat-moda",
        image: IMG_1,
        description: "Corte relajado",
        is_on_sale: false,
        visible: true,
        sort_order: 3,
        variations: [],
        wholesale_tiers: [],
        created_at: "2026-01-01T00:00:00Z",
      },
      {
        id: "prod-extra-4",
        name: "Casaca Denim Azul",
        price: 149,
        category_id: "cat-moda",
        image: IMG_2,
        description: "Lavado clásico",
        is_on_sale: false,
        visible: true,
        sort_order: 4,
        variations: [],
        wholesale_tiers: [],
        created_at: "2026-01-01T00:00:00Z",
      },
    ],
    total_products_count: 4,
  };
}

async function setupCatalogMocks(page: Page, orderLinkEnabled: boolean) {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore storage errors
    }
    (window as any).__openedUrls = [];
    window.open = ((url?: string | URL) => {
      if (url && String(url).trim()) {
        (window as any).__openedUrls.push(String(url));
      }
      const winObj: any = { closed: false };
      let currentHref = String(url || "");
      winObj.location = {
        get href() {
          return currentHref;
        },
        set href(val: string) {
          currentHref = String(val || "");
          if (currentHref) {
            (window as any).__openedUrls.push(currentHref);
          }
        },
      };
      return winObj as Window;
    }) as typeof window.open;
  });

  await page.route("**/rest/v1/rpc/get_public_store*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(buildPublicStore(orderLinkEnabled)),
    });
  });

  await page.route("**/rest/v1/rpc/increment_views*", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "1" });
  });

  await page.route("**/rest/v1/rpc/increment_whatsapp_clicks*", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "1" });
  });
}

test.describe("Link de pedido por WhatsApp (/pedido/:code)", () => {
  test("Caso 1: Con Link de pedido activo genera /pedido/<CODE> y lo adjunta en WhatsApp y SuccessModal", async ({
    page,
  }) => {
    await setupCatalogMocks(page, true);

    let createRpcCalled = false;
    let receivedPayload: any = null;

    await page.route("**/rest/v1/rpc/create_public_order*", async (route) => {
      createRpcCalled = true;
      receivedPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "11111111-1111-4111-8111-111111111111",
          code: "PED9482XKQ",
          created_at: "2026-11-12T20:00:00Z",
          expires_at: "2027-02-10T20:00:00Z",
        }),
      });
    });

    await page.goto("/t/tienda-link-pedido", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Polo Oversize Blanco")).toBeVisible({ timeout: 15000 });

    const addBtn = page.getByRole("button", { name: /Agregar .*carrito/i }).first();
    await addBtn.click();

    const sendBtn = page.getByRole("button", { name: /Enviar pedido por WhatsApp/i });
    if (!(await sendBtn.isVisible().catch(() => false))) {
      await page.getByRole("button", { name: /Ver carrito/i }).first().click();
    }
    await expect(sendBtn).toBeVisible();
    await sendBtn.click();

    await expect(page.getByRole("link", { name: /Ver link de pedido detallado/i })).toBeVisible({
      timeout: 10000,
    });

    expect(createRpcCalled).toBe(true);
    expect(receivedPayload?.p_store_id).toBe("store-order-link-e2e");
    expect(receivedPayload?.p_items).toEqual([{ product_id: "prod-polo-1", variation_id: null, qty: 1 }]);

    const openedUrls: string[] = await page.evaluate(() => (window as any).__openedUrls || []);
    const waUrl = openedUrls.find((u) => u.includes("wa.me"));
    expect(waUrl).toBeTruthy();

    const decodedText = decodeURIComponent(waUrl!.split("?text=")[1] || "");
    expect(decodedText).toContain("Polo Oversize Blanco");
    expect(decodedText).toContain("Ver pedido detallado:");
    expect(decodedText).toContain("/pedido/PED9482XKQ");

    const detailHref = await page
      .getByRole("link", { name: /Ver link de pedido detallado/i })
      .getAttribute("href");
    expect(detailHref).toMatch(/\/pedido\/PED9482XKQ$/);
  });

  test("Caso 2: Con Link de pedido desactivado NO llama a create_public_order ni adjunta URL de pedido", async ({
    page,
  }) => {
    await setupCatalogMocks(page, false);

    let createRpcCalled = false;
    await page.route("**/rest/v1/rpc/create_public_order*", async (route) => {
      createRpcCalled = true;
      await route.fulfill({ status: 500, body: "Should not be called" });
    });

    await page.goto("/t/tienda-link-pedido", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Polo Oversize Blanco")).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: /Agregar .*carrito/i }).first().click();
    const sendBtn = page.getByRole("button", { name: /Enviar pedido por WhatsApp/i });
    if (!(await sendBtn.isVisible().catch(() => false))) {
      await page.getByRole("button", { name: /Ver carrito/i }).first().click();
    }
    await expect(sendBtn).toBeVisible();
    await sendBtn.click();

    await expect(page.getByText(/Pedido enviado/i)).toBeVisible({ timeout: 10000 });
    expect(createRpcCalled).toBe(false);
    await expect(page.getByRole("link", { name: /Ver link de pedido detallado/i })).toHaveCount(0);

    const openedUrls: string[] = await page.evaluate(() => (window as any).__openedUrls || []);
    const waUrl = openedUrls.find((u) => u.includes("wa.me"));
    expect(waUrl).toBeTruthy();
    const decodedText = decodeURIComponent(waUrl!.split("?text=")[1] || "");
    expect(decodedText).not.toContain("/pedido/");
  });

  test("Caso 3: /pedido/:code muestra detalle completo, ahorro por mayor y persiste checklist en móvil", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      try {
        if (!sessionStorage.getItem("__e2e_checked_reset")) {
          localStorage.removeItem("dizi_order_checked_PED9482XKQ");
          sessionStorage.setItem("__e2e_checked_reset", "1");
        }
      } catch {
        // ignore
      }
      // Stub clipboard for headless verification
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: async (text: string) => {
            (window as any).__copiedOrderText = text;
          },
        },
        configurable: true,
      });
    });

    await page.route("**/rest/v1/rpc/get_public_order*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "11111111-1111-4111-8111-111111111111",
          code: "PED9482XKQ",
          store_id: "store-order-link-e2e",
          store_slug: "tienda-link-pedido",
          store_name: "Moda Urbana Test",
          store_logo: LOGO_SVG,
          brand_color: "#4f46e5",
          currency_country_code: "51",
          seller_name: "Sofía",
          subtotal_regular: 277,
          wholesale_savings: 42,
          total: 235,
          has_quote_items: false,
          created_at: "2026-11-12T20:00:00Z",
          expires_at: "2027-02-10T20:00:00Z",
          items: [
            {
              product_id: "prod-polo-1",
              variation_id: "var-l",
              name: "Polo Oversize Blanco",
              variation_name: "Talla L",
              image: IMG_1,
              qty: 3,
              unit_price: 45,
              regular_price: 59,
              line_total: 135,
              is_wholesale: true,
            },
            {
              product_id: "prod-gorra-2",
              variation_id: null,
              name: "Gorra Urban Negra",
              variation_name: null,
              image: IMG_2,
              qty: 2,
              unit_price: 50,
              regular_price: 50,
              line_total: 100,
              is_wholesale: false,
            },
          ],
        }),
      });
    });

    await page.goto("/pedido/PED9482XKQ", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("order-code-badge")).toContainText("#PED9482XKQ", {
      timeout: 15000,
    });
    await expect(page.getByText("Moda Urbana Test")).toBeVisible();
    await expect(page.getByText(/Vendedor: Sofía/i)).toBeVisible();
    await expect(page.getByTestId("order-item-0")).toContainText("Polo Oversize Blanco");
    await expect(page.getByTestId("order-item-0")).toContainText("Talla L");
    await expect(page.getByTestId("order-item-0")).toContainText(/Por mayor/i);
    await expect(page.getByText(/Ahorro por mayor/i)).toBeVisible();
    await expect(page.getByTestId("order-item-1")).toContainText("Gorra Urban Negra");
    await expect(page.getByTestId("order-total-amount")).toContainText("S/ 235.00");
    await expect(page.getByText(/Enlace disponible hasta el/i)).toBeVisible();

    // Verificar sin desbordamiento horizontal en móvil
    const noHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    );
    expect(noHorizontalOverflow).toBe(true);

    // Checklist interactivo + persistencia tras reload
    const firstItem = page.getByTestId("order-item-0");
    await expect(firstItem).toHaveAttribute("aria-checked", "false");
    await firstItem.click();
    await expect(firstItem).toHaveAttribute("aria-checked", "true");

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("order-item-0")).toHaveAttribute("aria-checked", "true", {
      timeout: 15000,
    });

    // Copiar resumen
    await page.getByRole("button", { name: /Copiar resumen/i }).click();
    const copiedText = await page.evaluate(() => (window as any).__copiedOrderText || "");
    expect(copiedText).toContain("Pedido #PED9482XKQ");
    expect(copiedText).toContain("Polo Oversize Blanco (Talla L) x3");
  });

  test("Caso 4: Código inexistente muestra pantalla amigable Pedido no encontrado", async ({ page }) => {
    await page.route("**/rest/v1/rpc/get_public_order*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "null",
      });
    });

    await page.goto("/pedido/NOEXISTE99", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Pedido no encontrado/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText("#NOEXISTE99")).toBeVisible();
  });
});
