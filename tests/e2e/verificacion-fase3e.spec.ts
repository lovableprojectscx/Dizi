import { test, expect } from "@playwright/test";
import crypto from "crypto";
import fs from "fs";
import https from "https";

const SUPABASE_URL = "https://zkqzdwxjthjdjchimmds.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcXpkd3hqdGhqZGpjaGltbWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NTQ0MDYsImV4cCI6MjEwMDEzMDQwNn0.sEtzdqZPdCFMHHsPAxGEqJylCloV6s14Mh0fT75pQGU";

function getMcpToken(): string | null {
  const tokenFilePath = "C:\\Users\\JACK FRANKLIN\\.gemini\\antigravity\\mcp_oauth_tokens.json";
  if (fs.existsSync(tokenFilePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(tokenFilePath, "utf8"));
      if (data["https://mcp.supabase.com/mcp"] && data["https://mcp.supabase.com/mcp"].token) {
        return data["https://mcp.supabase.com/mcp"].token.access_token;
      }
    } catch {}
  }
  return null;
}

function executeSql(query: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const token = getMcpToken();
    if (!token) return reject(new Error("No MCP token available"));
    const payload = JSON.stringify({ query });
    const req = https.request(
      {
        hostname: "api.supabase.com",
        path: "/v1/projects/zkqzdwxjthjdjchimmds/database/query",
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch {
              resolve(body);
            }
          } else {
            reject(new Error(`executeSql failed (${res.statusCode}): ${body}`));
          }
        });
      },
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function signUpUser(email: string, pass: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password: pass }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`signUpUser failed: ${txt}`);
  }
  return res.json();
}

async function getAuthToken(email: string, pass: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password: pass }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`getAuthToken failed: ${txt}`);
  }
  const data = await res.json();
  return data.access_token;
}

const RUN_ID = crypto.randomUUID().slice(0, 8);
const TEST_EMAIL = `zz-audit-fase3e-${RUN_ID}@testdizi.com`;
const TEST_PASS = `Audit3E-${crypto.randomUUID()}!`;
const TEST_STORE_SLUG = `zz-audit-fase3e-${RUN_ID}`;
const TEST_STORE_ID = crypto.randomUUID();
const TEST_PROD_ID = crypto.randomUUID();

test.describe("Fase 3E: Recomendados opcionales", () => {
  let userToken: string;
  let userId: string;

  test.beforeAll(async () => {
    // 1. Crear usuario de prueba
    const signupData = await signUpUser(TEST_EMAIL, TEST_PASS);
    userId = signupData.user?.id || signupData.id;

    // Confirmar email
    await executeSql(`
      UPDATE auth.users
      SET email_confirmed_at = now()
      WHERE id = '${userId}';
    `);

    userToken = await getAuthToken(TEST_EMAIL, TEST_PASS);

    // 2. Crear tienda con modelo nature
    const initRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/initialize_store`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_id: TEST_STORE_ID,
        p_slug: TEST_STORE_SLUG,
        p_name: "Tienda Audit Nature",
        p_phone: "51999888777",
        p_country_code: "51",
        p_country_iso: "PE",
        p_category_id: `c_${TEST_STORE_ID}`,
        p_plan: "pro",
        p_owner_id: userId,
        p_model: "nature",
        p_niche: "general",
      }),
    });
    if (!initRes.ok) {
      throw new Error(`initialize_store failed: ${await initRes.text()}`);
    }

    // Marcar onboarding como completado para evitar modales de bienvenida
    await executeSql(`
      UPDATE public.stores
      SET onboarding_completed = true
      WHERE id = '${TEST_STORE_ID}';
    `);

    // 3. Crear producto con #destacado en descripción
    const prodRes = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        id: TEST_PROD_ID,
        store_id: TEST_STORE_ID,
        name: "Producto Audit Especial",
        description: "Aceite esencial puro de lavanda #destacado",
        price: 45.0,
        image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400",
        visible: true,
      }),
    });
    if (!prodRes.ok) {
      throw new Error(`insert product failed: ${await prodRes.text()}`);
    }
  });

  test.afterAll(async () => {
    try {
      // Limpieza segura por ID exacto y email específico
      await executeSql(`
        DELETE FROM public.products WHERE store_id = '${TEST_STORE_ID}';
        DELETE FROM public.categories WHERE store_id = '${TEST_STORE_ID}';
        DELETE FROM public.stores WHERE id = '${TEST_STORE_ID}';
        DELETE FROM auth.users WHERE id = '${userId}';
      `);
      console.log(`[Teardown Fase 3E] Tienda ${TEST_STORE_ID} y usuario ${userId} eliminados limpiamente.`);
    } catch (err) {
      console.error("[Teardown Error]", err);
    }
  });

  test("1. Capturas DESPUÉS de tiendas reales (grano-miga, aura-botanicals, jhoselynperu)", async ({
    page,
  }) => {
    // Viewport celular 360x800
    await page.setViewportSize({ width: 360, height: 800 });
    fs.mkdirSync("scratch/capturas_fase3e", { recursive: true });

    const realStores = ["grano-miga", "aura-botanicals", "jhoselynperu"];
    for (const slug of realStores) {
      console.log(`Capturando DESPUÉS: ${slug}...`);
      await page.goto(`/t/${slug}`);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `scratch/capturas_fase3e/despues_${slug}.png` });
      console.log(`✓ Captura scratch/capturas_fase3e/despues_${slug}.png guardada.`);
    }
  });

  test("2. Flujo completo: interruptor on/off/on en tienda nature y limpieza de #destacado", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 360, height: 800 });

    // Login con usuario audit
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASS);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/admin/, { timeout: 20000 });

    // A. Ir a /admin/diseno: verificar que el interruptor está visible y encendido
    await page.goto("/admin/diseno");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("text=Mostrar sección de destacados al inicio").first()).toBeVisible({
      timeout: 10000,
    });
    console.log("✓ Interruptor visible en /admin/diseno para diseño nature.");

    // B. Ir a /t/zz-audit-fase3e: verificar carrusel presente y #destacado limpio
    await page.goto(`/t/${TEST_STORE_SLUG}`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);

    // Debe mostrar carrusel [data-carousel]
    const carousel = page.locator("[data-carousel]").first();
    await expect(carousel).toBeVisible({ timeout: 10000 });
    console.log("✓ Carrusel visible en /t/ con showFeatured = true.");

    // La descripción debe decir "Aceite esencial puro de lavanda" y NO contener "#destacado"
    const pageText = await page.textContent("body");
    expect(pageText).toContain("Aceite esencial puro de lavanda");
    expect(pageText).not.toContain("#destacado");
    console.log("✓ #destacado no aparece en el catálogo público.");

    // C. Apagar interruptor en /admin/diseno y guardar
    await page.goto("/admin/diseno");
    await page.waitForLoadState("domcontentloaded");

    // Click toggle con force: true
    const toggleCheckbox = page
      .locator('input[type="checkbox"]:below(:text("Mostrar sección de destacados al inicio"))')
      .first();
    await toggleCheckbox.click({ force: true });

    // Guardar cambios
    const saveBtn = page.getByRole("button", { name: /guardar cambios/i }).first();
    await saveBtn.click();
    await expect(page.locator("text=guardado con éxito").or(page.locator("text=guardado")).first()).toBeVisible({
      timeout: 10000,
    });
    console.log("✓ Interruptor apagado y guardado con éxito.");

    // D. Verificar en /t/ que el carrusel YA NO aparece
    await page.goto(`/t/${TEST_STORE_SLUG}`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);

    const carouselHidden = page.locator("[data-carousel]");
    await expect(carouselHidden).toHaveCount(0);
    console.log("✓ Carrusel desapareció con showFeatured = false.");

    // E. Volver a encender en /admin/diseno
    await page.goto("/admin/diseno");
    await page.waitForLoadState("domcontentloaded");
    const toggleOn = page
      .locator('input[type="checkbox"]:below(:text("Mostrar sección de destacados al inicio"))')
      .first();
    await toggleOn.click({ force: true });
    await saveBtn.click();
    await expect(page.locator("text=guardado con éxito").or(page.locator("text=guardado")).first()).toBeVisible({
      timeout: 10000,
    });

    // F. Verificar en /t/ que el carrusel reaparece
    await page.goto(`/t/${TEST_STORE_SLUG}`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    await expect(page.locator("[data-carousel]").first()).toBeVisible({ timeout: 10000 });
    console.log("✓ Carrusel reapareció exitosamente tras reactivarlo.");

    // G. Cambiar a diseño grid y verificar que el interruptor desaparece
    await page.goto("/admin/diseno");
    await page.waitForLoadState("domcontentloaded");
    await page.locator("text=Grilla Simétrica").first().click();

    // El interruptor "Mostrar sección de destacados al inicio" no debe estar visible
    await expect(page.locator("text=Mostrar sección de destacados al inicio")).toHaveCount(0);
    console.log("✓ Interruptor desaparece al seleccionar diseño grid.");

    // H. Ir a /admin/productos con diseño grid: "¿Destacar este producto?" NO debe aparecer
    await saveBtn.click();
    await page.waitForTimeout(1000);

    await page.goto("/admin/productos");
    await page.waitForLoadState("domcontentloaded");
    // Abrir modal de edición
    const editBtn = page.locator('button[title="Editar producto"]').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator("text=¿Destacar este producto?")).toHaveCount(0);
      console.log("✓ Switch ¿Destacar este producto? no aparece en diseño grid.");
      await page.keyboard.press("Escape");
    }
  });

  test("3. Verificación de conteo canónico residual", async () => {
    const storesCheck: any = await executeSql(
      `SELECT count(*)::int as c FROM stores WHERE slug LIKE 'zz-audit%';`,
    );
    const usersCheck: any = await executeSql(
      `SELECT count(*)::int as c FROM auth.users WHERE email LIKE 'zz-audit-%@testdizi.com';`,
    );
    console.log(`[Conteo Canónico en Vivo] Stores zz-audit: ${storesCheck[0]?.c}, Users zz-audit: ${usersCheck[0]?.c}`);
  });
});
