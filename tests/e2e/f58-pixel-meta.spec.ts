import { test, expect, type Page } from "@playwright/test";

const PROD_ORIGIN = "https://dizi.idenza.site";
const LOCAL_ORIGIN = "http://localhost:5173";

interface CapturedMetaNetwork {
  scriptRequests: string[];
  eventUrls: string[];
}

/**
 * Intercepta toda comunicación con Meta (facebook.net / facebook.com) y simula el host productivo
 * redirigiendo `https://dizi.idenza.site/*` al servidor local de pruebas sin tocar Meta ni DNS.
 */
async function setupMetaAndProdHostRoutes(
  page: Page,
  options: { simulateProdHost?: boolean; mockSupabase?: boolean } = {},
): Promise<CapturedMetaNetwork> {
  const { simulateProdHost = true, mockSupabase = false } = options;
  const captured: CapturedMetaNetwork = {
    scriptRequests: [],
    eventUrls: [],
  };

  await page.route("https://connect.facebook.net/**", async (route) => {
    const url = route.request().url();
    captured.scriptRequests.push(url);
    const stubJs = `
      (function () {
        var prev = window.fbq;
        var queue = (prev && prev.queue) ? prev.queue.slice() : [];
        var pixelId = "1453347423533488";
        function sendBeacon(args) {
          var cmd = args[0];
          if (cmd === "init") {
            pixelId = String(args[1] || pixelId);
            return;
          }
          if (cmd === "track") {
            var ev = encodeURIComponent(String(args[1] || ""));
            var params = args[2] || {};
            var qs = "id=" + encodeURIComponent(pixelId) + "&ev=" + ev;
            for (var k in params) {
              if (Object.prototype.hasOwnProperty.call(params, k)) {
                qs += "&cd[" + encodeURIComponent(k) + "]=" + encodeURIComponent(String(params[k]));
              }
            }
            fetch("https://www.facebook.com/tr/?" + qs).catch(function () {});
          }
        }
        function fbq() {
          sendBeacon(arguments);
        }
        fbq.push = fbq;
        fbq.loaded = true;
        fbq.version = "2.0";
        fbq.queue = [];
        fbq.callMethod = function () { sendBeacon(arguments); };
        window.fbq = fbq;
        window._fbq = fbq;
        for (var i = 0; i < queue.length; i++) {
          sendBeacon(queue[i]);
        }
      })();
    `;
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: stubJs,
    });
  });

  await page.route("https://www.facebook.com/**", async (route) => {
    captured.eventUrls.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: "image/gif",
      body: "",
    });
  });

  if (simulateProdHost) {
    await page.route(`${PROD_ORIGIN}/**`, async (route) => {
      const reqUrl = route.request().url();
      const targetUrl = reqUrl.replace(PROD_ORIGIN, LOCAL_ORIGIN);
      const response = await route.fetch({ url: targetUrl });
      await route.fulfill({ response });
    });
  }

  if (mockSupabase) {
    await page.route("https://*.supabase.co/**", async (route) => {
      const url = route.request().url();
      if (url.includes("/auth/v1/signup") || url.includes("/auth/v1/token")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            access_token: "mock-access-token",
            refresh_token: "mock-refresh-token",
            expires_in: 3600,
            token_type: "bearer",
            user: {
              id: "u_zz_audit_f58",
              email: "zz-audit-f58@testdizi.com",
              app_metadata: { role: "store_owner" },
            },
          }),
        });
        return;
      }
      if (url.includes("/rest/v1/rpc/check_slug_available")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(true),
        });
        return;
      }
      if (url.includes("/rest/v1/rpc/initialize_store")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(null),
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

  return captured;
}

test.describe("F58 · Píxel de Meta en DIZI (movil-android)", () => {
  test("E1 carga en / con host productivo dispara fbevents.js una vez y PageView sin duplicar", async ({
    page,
  }) => {
    const captured = await setupMetaAndProdHostRoutes(page, { simulateProdHost: true });

    await page.goto(`${PROD_ORIGIN}/`, { waitUntil: "domcontentloaded" });
    await expect.poll(() => captured.scriptRequests.length, { timeout: 10_000 }).toBe(1);
    await expect
      .poll(() => captured.eventUrls.filter((u) => u.includes("ev=PageView")).length, {
        timeout: 10_000,
      })
      .toBe(1);

    // Esperar un breve ciclo para confirmar que no se duplica el primer PageView
    await page.waitForTimeout(400);
    expect(captured.scriptRequests).toHaveLength(1);
    expect(captured.eventUrls.filter((u) => u.includes("ev=PageView"))).toHaveLength(1);
  });

  test("E2 /t/<demo> y /bio/<demo> generan 0 pedidos a Meta", async ({ page }) => {
    const captured = await setupMetaAndProdHostRoutes(page, {
      simulateProdHost: true,
      mockSupabase: true,
    });

    await page.goto(`${PROD_ORIGIN}/t/floreriademo`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    await page.goto(`${PROD_ORIGIN}/bio/floreriademo`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);

    expect(captured.scriptRequests).toHaveLength(0);
    expect(captured.eventUrls).toHaveLength(0);
  });

  test("E3 /pedido/<x> genera 0 pedidos a Meta", async ({ page }) => {
    const captured = await setupMetaAndProdHostRoutes(page, {
      simulateProdHost: true,
      mockSupabase: true,
    });

    await page.goto(`${PROD_ORIGIN}/pedido/DEMO123`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);

    expect(captured.scriptRequests).toHaveLength(0);
    expect(captured.eventUrls).toHaveLength(0);
  });

  test("E4 /admin y /super generan 0 pedidos a Meta", async ({ page }) => {
    const captured = await setupMetaAndProdHostRoutes(page, {
      simulateProdHost: true,
      mockSupabase: true,
    });

    // Simular sesión de dueño para que /admin no redirija a /login
    await page.addInitScript(() => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      localStorage.setItem(
        "sb-e2e-auth-token",
        JSON.stringify({
          currentSession: {
            access_token: "mock-access-token",
            refresh_token: "mock-refresh-token",
            expires_at: exp,
            expires_in: 3600,
            token_type: "bearer",
            user: {
              id: "u_owner_audit",
              email: "zz-audit-owner@testdizi.com",
              app_metadata: { role: "store_owner" },
            },
          },
        }),
      );
    });

    await page.goto(`${PROD_ORIGIN}/admin`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    await page.goto(`${PROD_ORIGIN}/super/login`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);

    expect(captured.scriptRequests).toHaveLength(0);
    expect(captured.eventUrls).toHaveLength(0);
  });

  test("E5 /register al pasar WhatsApp (goFromStep3) dispara Lead una sola vez", async ({
    page,
  }) => {
    const captured = await setupMetaAndProdHostRoutes(page, {
      simulateProdHost: true,
      mockSupabase: true,
    });

    await page.goto(`${PROD_ORIGIN}/register`, { waitUntil: "domcontentloaded" });
    await expect.poll(() => captured.eventUrls.filter((u) => u.includes("ev=PageView")).length).toBe(
      1,
    );

    // Paso 1: nombre
    await page.getByPlaceholder("Ej. Florería María").fill("Florería Audit F58");
    await page.getByRole("button", { name: "Continuar" }).click();

    // Paso 2: rubro
    await page.locator('[data-niche="floreria"]').click();
    await expect(page.getByText(/WhatsApp/i).first()).toBeVisible({ timeout: 10_000 });

    // Paso 3: WhatsApp -> goFromStep3
    await page.locator('input[type="tel"]').fill("987654321");
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect
      .poll(() => captured.eventUrls.filter((u) => u.includes("ev=Lead")).length, {
        timeout: 10_000,
      })
      .toBe(1);
    expect(captured.eventUrls.filter((u) => u.includes("ev=CompleteRegistration"))).toHaveLength(0);
  });

  test("E6 /register tras initialize_store exitoso dispara CompleteRegistration con content_category y sin PII", async ({
    page,
  }) => {
    const captured = await setupMetaAndProdHostRoutes(page, {
      simulateProdHost: true,
      mockSupabase: true,
    });

    const storeName = "Florería Secreta Audit";
    const phone = "987654321";
    const email = "cliente-privado-f58@testdizi.com";

    await page.goto(`${PROD_ORIGIN}/register`, { waitUntil: "domcontentloaded" });

    // Paso 1: nombre
    await page.getByPlaceholder("Ej. Florería María").fill(storeName);
    await page.getByRole("button", { name: "Continuar" }).click();

    // Paso 2: rubro
    await page.locator('[data-niche="floreria"]').click();
    await expect(page.locator('input[type="tel"]')).toBeVisible({ timeout: 10_000 });

    // Paso 3: WhatsApp -> Lead
    await page.locator('input[type="tel"]').fill(phone);
    await page.getByRole("button", { name: "Continuar" }).click();

    // Paso 4: omitir datos opcionales
    await page.getByTestId("step4-skip-btn").click();

    // Paso 5: cuenta y crear catálogo
    await page.getByPlaceholder("tu@correo.com").fill(email);
    await page.getByPlaceholder("Mínimo 6 caracteres").fill("ClaveSegura123!");
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole("button", { name: /Crear mi catálogo/i }).click();

    await expect
      .poll(
        () => captured.eventUrls.filter((u) => u.includes("ev=CompleteRegistration")).length,
        { timeout: 10_000 },
      )
      .toBe(1);

    const completeUrls = captured.eventUrls.filter((u) => u.includes("ev=CompleteRegistration"));
    expect(completeUrls).toHaveLength(1);
    expect(completeUrls[0]).toContain("cd[content_category]=floreria");

    // Verificar que ninguna URL de evento a Meta contenga teléfono, correo, nombre ni slug
    for (const url of captured.eventUrls) {
      const decoded = decodeURIComponent(url).toLowerCase();
      expect(decoded).not.toContain(phone);
      expect(decoded).not.toContain(email.toLowerCase());
      expect(decoded).not.toContain("secreta");
      expect(decoded).not.toContain("floreria-secreta-audit");
    }

    await page.screenshot({ path: "capturas-f58/e6-registro-completo.png" });
  });

  test("E7 navegación SPA entre rutas permitidas dispara PageView por cada ruta sin recargar fbevents.js", async ({
    page,
  }) => {
    const captured = await setupMetaAndProdHostRoutes(page, { simulateProdHost: true });

    await page.goto(`${PROD_ORIGIN}/`, { waitUntil: "domcontentloaded" });
    await expect.poll(() => captured.eventUrls.filter((u) => u.includes("ev=PageView")).length).toBe(
      1,
    );

    // Navegación SPA mediante enlaces reales del footer/landing
    await page.getByRole("link", { name: /Privacidad/i }).first().click();
    await expect.poll(() => captured.eventUrls.filter((u) => u.includes("ev=PageView")).length).toBe(
      2,
    );

    await page.getByRole("link", { name: /Volver al inicio/i }).first().click();
    await expect.poll(() => captured.eventUrls.filter((u) => u.includes("ev=PageView")).length).toBe(
      3,
    );

    expect(captured.scriptRequests).toHaveLength(1);
  });

  test("E8 host no productivo (localhost / preview) genera 0 pedidos a Meta", async ({ page }) => {
    const captured = await setupMetaAndProdHostRoutes(page, { simulateProdHost: false });

    await page.goto(`${LOCAL_ORIGIN}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    await page.goto(`${LOCAL_ORIGIN}/register`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);

    expect(captured.scriptRequests).toHaveLength(0);
    expect(captured.eventUrls).toHaveLength(0);
  });

  test("E9 rol super_admin (getRoleSync) genera 0 pedidos a Meta en rutas permitidas", async ({
    page,
  }) => {
    const captured = await setupMetaAndProdHostRoutes(page, { simulateProdHost: true });

    await page.addInitScript(() => {
      localStorage.setItem(
        "sb-e2e-auth-token",
        JSON.stringify({
          currentSession: {
            user: {
              id: "u_super_audit",
              app_metadata: { role: "super_admin" },
            },
          },
        }),
      );
    });

    await page.goto(`${PROD_ORIGIN}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    await page.goto(`${PROD_ORIGIN}/ayuda`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);

    expect(captured.scriptRequests).toHaveLength(0);
    expect(captured.eventUrls).toHaveLength(0);
  });

  test("E10 /privacidad muestra el aviso del píxel de Meta", async ({ page }) => {
    await setupMetaAndProdHostRoutes(page, { simulateProdHost: true });

    await page.goto(`${PROD_ORIGIN}/privacidad`, { waitUntil: "domcontentloaded" });
    const notice = page.getByText(
      "Usamos el píxel de Meta solo en las páginas de DIZI (inicio, registro, ayuda y similares) para medir nuestros anuncios. Nunca en los catálogos de las tiendas ni en sus pedidos. No enviamos tu nombre, teléfono ni correo.",
    );
    await expect(notice).toBeVisible();
    await notice.scrollIntoViewIfNeeded();
    await page.screenshot({ path: "capturas-f58/e10-privacidad.png" });
  });
});
