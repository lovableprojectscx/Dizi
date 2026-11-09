import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sessionPayload = {
  access_token: "mock-token-f46",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: 9999999999,
  refresh_token: "mock-refresh-f46",
  user: {
    id: "user-audit-f46",
    aud: "authenticated",
    role: "authenticated",
    email: "audit-f46@testdizi.com",
    app_metadata: { role: "store_owner" },
    user_metadata: {},
  },
};

const dbStore = {
  id: "s_zapatillasdemo",
  owner_id: "user-audit-f46",
  name: "Kickz Premium",
  slug: "zapatillas-demo",
  phone: "51921585977",
  country_code: "51",
  country_iso: "PE",
  model: "minimalista",
  plan: "ilimitado",
  brand_color: "#0F172A",
  show_dizi_branding: false,
  active: true,
  is_published: true,
  onboarding_completed: true,
  logo: "https://dizifotos.b-cdn.net/s_zapatillasdemo/logo.webp",
  banner_image: "https://dizifotos.b-cdn.net/s_zapatillasdemo/banners/banner_slider_1.webp",
  created_at: "2026-07-20T13:33:26Z",
  whatsapp_clicks: 0,
  categories: [{ id: "cat-zapas", name: "Zapatillas", store_id: "s_zapatillasdemo" }],
  products: [
    {
      id: "p_zapas7",
      store_id: "s_zapatillasdemo",
      name: "Vans Old Skool Platform",
      price: 249.9,
      original_price: 299.9,
      is_on_sale: true,
      category_id: "cat-zapas",
      image: "https://dizifotos.b-cdn.net/s_zapatillasdemo/products/p_zapas7.webp",
      visible: true,
      sort_order: 0,
    },
  ],
};

const localStore = {
  id: "s_zapatillasdemo",
  ownerId: "user-audit-f46",
  name: "Kickz Premium",
  slug: "zapatillas-demo",
  phone: "51921585977",
  countryCode: "51",
  countryIso: "PE",
  model: "minimalista",
  plan: "ilimitado",
  brandColor: "#0F172A",
  showDiziBranding: false,
  active: true,
  isPublished: true,
  onboardingCompleted: true,
  logo: "https://dizifotos.b-cdn.net/s_zapatillasdemo/logo.webp",
  bannerImage: "https://dizifotos.b-cdn.net/s_zapatillasdemo/banners/banner_slider_1.webp",
  createdAt: "2026-07-20T13:33:26Z",
  whatsappClicks: 0,
  categories: [{ id: "cat-zapas", name: "Zapatillas" }],
  products: [
    {
      id: "p_zapas7",
      name: "Vans Old Skool Platform",
      price: 249.9,
      originalPrice: 299.9,
      isOnSale: true,
      categoryId: "cat-zapas",
      image: "https://dizifotos.b-cdn.net/s_zapatillasdemo/products/p_zapas7.webp",
      visible: true,
      sortOrder: 0,
    },
  ],
};

test.describe("F46.2 · Texto bonito al compartir en celular (375px)", () => {
  test("Abre el diálogo, permite cambiar plantillas y emojis, y muestra vista previa", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.addInitScript(
      ({ store, session }) => {
        localStorage.setItem(
          "sb-zkqzdwxjthjdjchimmds-auth-token",
          JSON.stringify({ ...session, currentSession: session })
        );
        localStorage.setItem("dizi_onboarding_dismissed", "true");
        localStorage.setItem("dizi-onboarding-completed", "true");
        localStorage.setItem(
          "dizi-catalogos-v2",
          JSON.stringify({
            state: {
              stores: [store],
              currentStoreId: store.id,
              fetchError: null,
              lastFetched: Date.now(),
            },
            version: 1,
          })
        );
      },
      { store: localStore, session: sessionPayload }
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
          body: JSON.stringify([dbStore]),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/admin/productos");
    await page.waitForLoadState("networkidle");

    const shareBtn = page.locator("button[title*='Crear imagen']:visible").first();
    await expect(shareBtn).toBeVisible({ timeout: 15_000 });
    await shareBtn.click();

    // Diálogo abierto
    await expect(page.locator("text=Crear imagen para estados")).toBeVisible();
    await expect(page.locator("text=Texto para compartir")).toBeVisible();
    await expect(page.locator("button:has-text('Copiar texto')")).toBeVisible();

    // Selector de emojis visible
    const sneakerEmojiBtn = page.locator("button:has-text('👟')");
    await expect(sneakerEmojiBtn).toBeVisible();
    await sneakerEmojiBtn.click();

    // Textarea debe reflejar el emoji elegido y la plantilla
    const textarea = page.locator("textarea");
    await expect(textarea).toBeVisible();
    const textVal = await textarea.inputValue();
    expect(textVal).toContain("👟 Vans Old Skool");
    expect(textVal).toContain("🔥 OFERTA en Kickz Premium 🔥");
    expect(textVal).toContain("💰 S/ 249.90 (Antes: S/ 299.90 · -16%)");
    expect(textVal).toContain("📲 Pídelo aquí 👇");

    // Guardar captura de pantalla en celular
    const outDir = path.resolve(__dirname, "../../test-results");
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const screenshotPath = path.join(outDir, "captura-f46-2-dialogo-texto.png");
    await page.screenshot({ path: screenshotPath });

    // También hacemos scroll al diálogo para capturar la sección de texto completa
    const dialogContent = page.locator("[role='dialog']");
    await dialogContent.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(300);
    const screenshotScrolledPath = path.join(outDir, "captura-f46-2-dialogo-texto-scrolled.png");
    await page.screenshot({ path: screenshotScrolledPath });

    expect(fs.existsSync(screenshotPath)).toBe(true);
    expect(fs.existsSync(screenshotScrolledPath)).toBe(true);
  });
});
