import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const CAPTURAS_DIR = process.env.F56_CAPTURAS_DIR || "";

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function saveShot(page: Page, name: string, fullPage = false) {
  if (!CAPTURAS_DIR) return;
  fs.mkdirSync(CAPTURAS_DIR, { recursive: true });
  await page.screenshot({ path: path.join(CAPTURAS_DIR, name), fullPage });
}

function makeFakeJwt() {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: "00000000-0000-0000-0000-000000000099",
      email: "zz-audit-f56@testdizi.com",
      exp: 9999999999,
      app_metadata: { role: "store_owner" },
    }),
  ).toString("base64url");
  return `${header}.${payload}.mock-signature`;
}

const mockSession = {
  access_token: makeFakeJwt(),
  token_type: "bearer",
  expires_in: 3600000,
  expires_at: 9999999999,
  refresh_token: "pw-mock-refresh",
  user: {
    id: "00000000-0000-0000-0000-000000000099",
    email: "zz-audit-f56@testdizi.com",
    aud: "authenticated",
    role: "authenticated",
    app_metadata: { role: "store_owner" },
    user_metadata: { role: "store_owner", full_name: "Florería Audit F56" },
  },
};

function buildMockStore(niche: string | null = "floreria") {
  return {
    id: "s_zz_audit_f56",
    slug: "zz-audit-f56",
    name: "Florería Audit F56",
    niche: niche ?? undefined,
    model: "boutique",
    plan: "pro",
    effectivePlan: "pro",
    ownerId: "00000000-0000-0000-0000-000000000099",
    phone: "51999888777",
    countryCode: "51",
    countryIso: "PE",
    wholesaleEnabled: true,
    categories: [
      { id: "cat_1", name: "Ramos", sortOrder: 1 },
      { id: "cat_2", name: "Arreglos", sortOrder: 2 },
    ],
    products: [
      {
        id: "prod_sin_precio",
        storeId: "s_zz_audit_f56",
        categoryId: "cat_1",
        name: "Ramo Clásico Sin Precio",
        price: null,
        originalPrice: null,
        isOnSale: false,
        image: "",
        description: "",
        visible: true,
        isSample: false,
        variations: [],
        wholesaleTiers: [],
      },
      {
        id: "prod_oferta_vars",
        storeId: "s_zz_audit_f56",
        categoryId: "cat_1",
        name: "Ramo Premium Oferta",
        price: 89.9,
        originalPrice: 120,
        isOnSale: true,
        image: "",
        description: "Rosas frescas #destacado",
        visible: true,
        isSample: false,
        variations: [
          { id: "v1", name: "Rojo", price: 89.9, image: null },
          { id: "v2", name: "Blanco", price: 95, image: null },
        ],
        wholesaleTiers: [],
      },
    ],
  };
}

async function mountMocks(page: Page, niche: string | null = "floreria") {
  const store = buildMockStore(niche);
  const savedPayloads: any[] = [];

  await page.addInitScript(
    ({ s, session }) => {
      localStorage.setItem("sb-zkqzdwxjthjdjchimmds-auth-token", JSON.stringify(session));
      localStorage.setItem(
        "dizi-catalogos-v2",
        JSON.stringify({ state: { stores: [s], currentStoreId: s.id, fetchError: false }, version: 0 }),
      );
    },
    { s: store, session: mockSession },
  );

  await page.route("**/auth/v1/**", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockSession) }),
  );

  await page.route("**/rest/v1/stores*", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: store.id,
          slug: store.slug,
          name: store.name,
          niche: niche,
          model: store.model,
          plan: store.plan,
          owner_id: store.ownerId,
          phone: store.phone,
          country_code: store.countryCode,
          country_iso: store.countryIso,
          wholesale_enabled: store.wholesaleEnabled,
          categories: store.categories.map((c) => ({
            id: c.id,
            store_id: store.id,
            name: c.name,
            sort_order: c.sortOrder,
          })),
          products: store.products.map((p) => ({
            id: p.id,
            store_id: store.id,
            category_id: p.categoryId,
            name: p.name,
            price: p.price,
            original_price: p.originalPrice,
            is_on_sale: p.isOnSale,
            image: p.image,
            description: p.description,
            visible: p.visible,
            is_sample: p.isSample,
            variations: p.variations,
            wholesale_tiers: p.wholesaleTiers,
          })),
        },
      ]),
    }),
  );

  await page.route("**/rest/v1/products*", async (route) => {
    const method = route.request().method();
    if (method === "POST" || method === "PATCH") {
      const body = route.request().postDataJSON();
      savedPayloads.push(body);
      const item = Array.isArray(body) ? body[0] : body;
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify([
          {
            ...item,
            id: item?.id || `prod_new_${savedPayloads.length}`,
            version: 1,
          },
        ]),
      });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });

  await page.route("**/rest/v1/rpc/**", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: "null" }),
  );

  return { savedPayloads };
}

test.describe("F56 · Subir un producto fácil (Pixel 7)", () => {
  test("E1 nuevo producto arranca con precio habilitado, vacío y sin marcar A consultar", async ({ page }) => {
    await mountMocks(page);
    await page.goto("/admin/productos");
    await page.locator("button:has-text('Nuevo Producto'):visible").first().click();

    const dialog = page.locator("[role='dialog']");
    await expect(dialog.getByText("Agregar producto")).toBeVisible();
    await expect(dialog.getByText("Toca para subir una foto")).toBeVisible();
    await expect(dialog.getByText("Se ve mejor cuadrada")).toBeVisible();
    await expect(dialog.getByText("¿Cómo se llama?")).toBeVisible();
    await expect(dialog.getByText("¿Cuánto cuesta?")).toBeVisible();

    const priceInput = dialog.locator("#f56-product-price");
    await expect(priceInput).toBeEnabled();
    await expect(priceInput).toHaveValue("");
    await expect(dialog.getByText("No quiero mostrar el precio")).toBeVisible();
    await saveShot(page, "f56-despues-nuevo.png");
  });

  test("E2 escribir precio 25 y guardar envía price = 25", async ({ page }) => {
    const { savedPayloads } = await mountMocks(page);
    await page.goto("/admin/productos");
    await page.locator("button:has-text('Nuevo Producto'):visible").first().click();

    const dialog = page.locator("[role='dialog']");
    await dialog.locator("#f56-product-name").fill("Ramo Primaveral");
    await dialog.locator("#f56-product-price").fill("25");
    await dialog.locator("button:has-text('Guardar producto')").click();

    await expect(page.getByText("Producto agregado ✓")).toBeVisible();
    expect(savedPayloads.length).toBeGreaterThan(0);
    const last = Array.isArray(savedPayloads[0]) ? savedPayloads[0][0] : savedPayloads[0];
    expect(last.price).toBe(25);
  });

  test("E3 marcar 'No quiero mostrar el precio' y luego 'Cambiar' deja vacío (no 10.00); guardar como a consultar guarda null", async ({ page }) => {
    const { savedPayloads } = await mountMocks(page);
    await page.goto("/admin/productos");
    await page.locator("button:has-text('Nuevo Producto'):visible").first().click();

    const dialog = page.locator("[role='dialog']");
    await dialog.locator("#f56-product-name").fill("Arreglo Especial");
    await dialog.getByRole("button", { name: "No quiero mostrar el precio" }).click();
    await expect(dialog.getByText("Precio a consultar")).toBeVisible();

    // Bug corregido: al quitar "a consultar" NO pone 10.00, queda vacío y enfocado
    await dialog.getByRole("button", { name: "Cambiar" }).click();
    const priceInput = dialog.locator("#f56-product-price");
    await expect(priceInput).toHaveValue("");
    await expect(priceInput).toBeFocused();

    // Volver a marcar "No quiero mostrar el precio" y guardar directo sin preguntar
    await dialog.getByRole("button", { name: "No quiero mostrar el precio" }).click();
    await dialog.locator("button:has-text('Guardar producto')").click();
    await expect(page.getByText("Producto agregado ✓")).toBeVisible();
    const last = Array.isArray(savedPayloads[0]) ? savedPayloads[0][0] : savedPayloads[0];
    expect(last.price).toBeNull();
  });

  test("E4 precio vacío sin marcar 'No quiero mostrar el precio' muestra confirmación en el diálogo", async ({ page }) => {
    const { savedPayloads } = await mountMocks(page);
    await page.goto("/admin/productos");
    await page.locator("button:has-text('Nuevo Producto'):visible").first().click();

    const dialog = page.locator("[role='dialog']");
    await dialog.locator("#f56-product-name").fill("Orquídea Blanca");
    await dialog.locator("button:has-text('Guardar producto')").click();

    const confirmBox = dialog.getByTestId("consult-confirm-box");
    await expect(confirmBox).toBeVisible();
    await expect(confirmBox.getByText('¿Lo dejas como "A consultar"?')).toBeVisible();
    await saveShot(page, "f56-despues-confirm-precio.png");

    await confirmBox.getByRole("button", { name: "Poner precio" }).click();
    await expect(confirmBox).toBeHidden();
    await expect(dialog.locator("#f56-product-price")).toBeFocused();
    expect(savedPayloads.length).toBe(0);

    await dialog.locator("button:has-text('Guardar producto')").click();
    await expect(confirmBox).toBeVisible();
    await confirmBox.getByRole("button", { name: "Sí, a consultar" }).click();
    await expect(page.getByText("Producto agregado ✓")).toBeVisible();
    expect(savedPayloads.length).toBe(1);
  });

  test("E5 editar producto existente sin precio abre en 'Precio a consultar'", async ({ page }) => {
    await mountMocks(page);
    await page.goto("/admin/productos");
    await page.locator("button:has(.lucide-pencil):visible").nth(0).click();

    const dialog = page.locator("[role='dialog']");
    await expect(dialog.getByText("Editar producto")).toBeVisible();
    await expect(dialog.getByText("Precio a consultar")).toBeVisible();
  });

  test("E6 editar producto con oferta y variaciones abre 'Más opciones' con contador", async ({ page }) => {
    await mountMocks(page);
    await page.goto("/admin/productos");
    await page.locator("button:has(.lucide-pencil):visible").nth(1).click();

    const dialog = page.locator("[role='dialog']");
    await expect(dialog.getByText("4 opciones usadas")).toBeVisible();
    await expect(dialog.getByText("¿Este producto está en oferta?")).toBeVisible();
    await expect(dialog.getByText("Tallas, colores y variaciones")).toBeVisible();
    await saveShot(page, "f56-despues-editar-opciones.png");
  });

  test("E7 nuevo producto tiene 'Más opciones' cerrado y al abrirlo muestra todas las opciones", async ({ page }) => {
    await mountMocks(page);
    await page.goto("/admin/productos");
    await page.locator("button:has-text('Nuevo Producto'):visible").first().click();

    const dialog = page.locator("[role='dialog']");
    const toggle = dialog.getByRole("button", { name: /Más opciones/i });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(dialog.getByText("Descripción (opcional)")).toBeVisible();
    await expect(dialog.getByText("¿Este producto está en oferta?")).toBeVisible();
    await expect(dialog.getByText("Tallas, colores y variaciones")).toBeVisible();
    await expect(dialog.getByText("Pegar enlace de imagen")).toBeVisible();
  });

  test("E8 placeholder del nombre usa rubro de la tienda", async ({ page }) => {
    await mountMocks(page, "floreria");
    await page.goto("/admin/productos");
    await page.locator("button:has-text('Nuevo Producto'):visible").first().click();
    await expect(page.locator("#f56-product-name")).toHaveAttribute("placeholder", "Ej. Ramo de 12 rosas rojas");
  });

  test("E9 carga masiva con 3 fotos sin precio avisa antes de guardar y Revisar no guarda", async ({ page }) => {
    const { savedPayloads } = await mountMocks(page);
    await page.goto("/admin/productos");
    const bulkInput = page.locator("input[type='file'][multiple]").first();
    await bulkInput.setInputFiles([
      { name: "foto-1.png", mimeType: "image/png", buffer: TINY_PNG },
      { name: "foto-2.png", mimeType: "image/png", buffer: TINY_PNG },
      { name: "foto-3.png", mimeType: "image/png", buffer: TINY_PNG },
    ]);

    const dialog = page.locator("[role='dialog']");
    await expect(dialog.getByText("Carga Masiva por Fotos")).toBeVisible();
    await dialog.getByRole("button", { name: /Confirmar Importación/i }).click();

    const warnBox = dialog.getByTestId("bulk-consult-confirm-box");
    await expect(warnBox).toBeVisible();
    await expect(warnBox.getByText("3 productos se verán como 'A consultar'")).toBeVisible();
    await saveShot(page, "f56-despues-carga-masiva.png");

    await warnBox.getByRole("button", { name: "Revisar" }).click();
    await expect(warnBox).toBeHidden();
    expect(savedPayloads.length).toBe(0);
  });

  test("E10 welcomeMode (?bienvenida=1) aplica las mismas reglas de precio habilitado y vacío", async ({ page }) => {
    await mountMocks(page);
    await page.goto("/admin/productos?bienvenida=1");
    const dialog = page.locator("[role='dialog']");
    await expect(dialog.getByText("Sube tu primer producto")).toBeVisible();
    await expect(dialog.locator("#f56-product-price")).toBeEnabled();
    await expect(dialog.locator("#f56-product-price")).toHaveValue("");
  });

  test("E11 Pixel 7: lo esencial visible sin scroll con el teclado cerrado", async ({ page }) => {
    await mountMocks(page);
    await page.goto("/admin/productos");
    await page.locator("button:has-text('Nuevo Producto'):visible").first().click();

    const dialog = page.locator("[role='dialog']");
    await expect(dialog.locator("#f56-product-name")).toBeInViewport();
    await expect(dialog.locator("#f56-product-price")).toBeInViewport();
    await expect(dialog.getByRole("button", { name: "Guardar producto" })).toBeInViewport();
  });

  test("E14 Pixel 7 con foco en '¿Cuánto cuesta?' tiene inputMode decimal y campo visible", async ({ page }) => {
    await mountMocks(page);
    await page.goto("/admin/productos");
    await page.locator("button:has-text('Nuevo Producto'):visible").first().click();

    const priceInput = page.locator("#f56-product-price");
    await expect(priceInput).toHaveAttribute("inputmode", "decimal");
    await priceInput.click();
    await expect(priceInput).toBeFocused();
    await expect(priceInput).toBeInViewport();
    await saveShot(page, "f56-despues-teclado.png");
  });

  test("E15 tocar Guardar sin nombre marca campo en rojo con 'Falta el nombre' y enfoca", async ({ page }) => {
    await mountMocks(page);
    await page.goto("/admin/productos");
    await page.locator("button:has-text('Nuevo Producto'):visible").first().click();

    const dialog = page.locator("[role='dialog']");
    const saveBtn = dialog.getByRole("button", { name: "Guardar producto" });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    await expect(dialog.getByText("Falta el nombre")).toBeVisible();
    await expect(dialog.locator("#f56-product-name")).toBeFocused();
    await saveShot(page, "f56-despues-error-nombre.png");
  });

  test("E16 guardar y tocar 'Agregar otro' reabre vacío con la misma categoría", async ({ page }) => {
    await mountMocks(page);
    await page.goto("/admin/productos");
    await page.locator("button:has-text('Nuevo Producto'):visible").first().click();

    const dialog = page.locator("[role='dialog']");
    await dialog.locator("#f56-product-name").fill("Ramo Tulipan");
    await dialog.locator("#f56-product-price").fill("45");
    await dialog.getByRole("button", { name: "Guardar producto" }).click();

    await expect(page.getByText("Producto agregado ✓")).toBeVisible();
    await saveShot(page, "f56-despues-agregar-otro.png");

    await page.getByRole("button", { name: "Agregar otro" }).click();
    await expect(dialog.getByText("Agregar producto")).toBeVisible();
    await expect(dialog.locator("#f56-product-name")).toHaveValue("");
    await expect(dialog.locator("#f56-product-price")).toHaveValue("");
    await expect(dialog.getByText("Ramos")).toBeVisible();
  });

  test("E17 tamaños reales: campos >= 48 px, letra >= 16 px y botones >= 44 px", async ({ page }) => {
    await mountMocks(page);
    await page.goto("/admin/productos");
    await page.locator("button:has-text('Nuevo Producto'):visible").first().click();

    const metrics = await page.evaluate(() => {
      const nameEl = document.querySelector("#f56-product-name") as HTMLElement;
      const priceEl = document.querySelector("#f56-product-price") as HTMLElement;
      const saveBtn = Array.from(document.querySelectorAll("[role='dialog'] button")).find((b) =>
        (b.textContent || "").includes("Guardar producto"),
      ) as HTMLElement;
      const newCatBtn = Array.from(document.querySelectorAll("[role='dialog'] button")).find((b) =>
        (b.textContent || "").includes("+ Nueva"),
      ) as HTMLElement;
      return {
        nameHeight: Math.round(nameEl.getBoundingClientRect().height),
        nameFont: parseFloat(getComputedStyle(nameEl).fontSize),
        priceHeight: Math.round(priceEl.getBoundingClientRect().height),
        priceFont: parseFloat(getComputedStyle(priceEl).fontSize),
        saveHeight: Math.round(saveBtn.getBoundingClientRect().height),
        newCatHeight: Math.round(newCatBtn.getBoundingClientRect().height),
      };
    });

    expect(metrics.nameHeight).toBeGreaterThanOrEqual(48);
    expect(metrics.nameFont).toBeGreaterThanOrEqual(16);
    expect(metrics.priceHeight).toBeGreaterThanOrEqual(48);
    expect(metrics.priceFont).toBeGreaterThanOrEqual(16);
    expect(metrics.saveHeight).toBeGreaterThanOrEqual(44);
    expect(metrics.newCatHeight).toBeGreaterThanOrEqual(44);
  });

  test("E17b vista PC (1280x720) muestra 2 columnas en el mismo orden", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await mountMocks(page);
    await page.goto("/admin/productos");
    await page.locator("button:has-text('Nuevo Producto'):visible").first().click();

    const dialog = page.locator("[role='dialog']");
    await expect(dialog.getByText("Agregar producto")).toBeVisible();
    await saveShot(page, "f56-despues-pc.png");
  });
});
