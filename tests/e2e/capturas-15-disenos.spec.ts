import { test, expect } from "@playwright/test";
import crypto from "crypto";
import fs from "fs";
import path from "path";
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
const TEST_EMAIL = `zz-audit-capturas-${RUN_ID}@testdizi.com`;
const TEST_PASS = `AuditCap-${crypto.randomUUID()}!`;
const TEST_STORE_SLUG = `zz-audit-capturas-${RUN_ID}`;
const TEST_STORE_ID = crypto.randomUUID();

const STRUCTURES = [
  { id: "grid", name: "Grilla Simétrica" },
  { id: "overlay", name: "Overlay Visual" },
  { id: "hero", name: "Hero Panorámico" },
  { id: "spotlight", name: "Enfoque Spotlight" },
  { id: "editorial", name: "Estilo Editorial" },
  { id: "tiles", name: "Mosaico Tiles" },
  { id: "magazine", name: "Revista Magazine" },
  { id: "diagonal", name: "Diagonal Dynamic" },
  { id: "arch", name: "Arch Studio" },
  { id: "banner_grid", name: "Portada con Banner" },
  { id: "bloom_general", name: "Bloom Estándar Premium" },
  { id: "bloom_floral", name: "Bloom Floral" },
  { id: "bite", name: "Bite Gastronómico" },
  { id: "nature", name: "Nature Orgánico" },
  { id: "lookbook", name: "Lookbook Moda" },
];

const TARGET_DIR = path.resolve(
  process.cwd(),
  "../../INFORMACIÓN NECESARIA/03-PRODUCTO-Y-REQUISITOS/capturas-disenos",
);

test.describe("Generar capturas de los 15 diseños en celular", () => {
  let userToken: string;
  let userId: string;

  test.beforeAll(async () => {
    if (!fs.existsSync(TARGET_DIR)) {
      fs.mkdirSync(TARGET_DIR, { recursive: true });
    }

    // 1. Crear usuario de prueba
    const signupData = await signUpUser(TEST_EMAIL, TEST_PASS);
    userId = signupData.user?.id || signupData.id;

    await executeSql(`
      UPDATE auth.users
      SET email_confirmed_at = now()
      WHERE id = '${userId}';
    `);

    userToken = await getAuthToken(TEST_EMAIL, TEST_PASS);

    // 2. Crear tienda
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/initialize_store`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_id: TEST_STORE_ID,
        p_slug: TEST_STORE_SLUG,
        p_name: "Demo Diseños DIZI",
        p_phone: "51999888777",
        p_country_code: "51",
        p_country_iso: "PE",
        p_category_id: `c_${TEST_STORE_ID}`,
        p_plan: "pro",
        p_owner_id: userId,
        p_model: "grid",
        p_niche: "general",
      }),
    });

    // 3. Crear 4 productos representativos y marcar onboarding completed
    await executeSql(`
      UPDATE stores
      SET onboarding_completed = true,
          show_featured = true,
          banners = ARRAY['https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_cafe/products/croissant_pistacho.png']
      WHERE id = '${TEST_STORE_ID}';

      INSERT INTO products (id, store_id, name, description, price, original_price, image, visible, category_id)
      VALUES 
        ('${crypto.randomUUID()}', '${TEST_STORE_ID}', 'Café Latte Especial', 'Café artesanal con leche vaporizada #destacado', 12.00, 15.00, 'https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_cafe/products/cafe_latte.png', true, 'c_${TEST_STORE_ID}'),
        ('${crypto.randomUUID()}', '${TEST_STORE_ID}', 'Cold Brew Cítrico', 'Macerado en frío por 18 horas con naranja', 14.00, NULL, 'https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_cafe/products/cold_brew.png', true, 'c_${TEST_STORE_ID}'),
        ('${crypto.randomUUID()}', '${TEST_STORE_ID}', 'Croissant de Pistacho', 'Masa hojaldrada con crema de pistacho', 16.00, NULL, 'https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_cafe/products/croissant_pistacho.png', true, 'c_${TEST_STORE_ID}'),
        ('${crypto.randomUUID()}', '${TEST_STORE_ID}', 'Tarta de Queso Vasca', 'Horneada a alta temperatura, centro cremoso', 18.00, NULL, 'https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_cafe/products/tarta_queso.png', true, 'c_${TEST_STORE_ID}');
    `);
  });

  test.afterAll(async () => {
    try {
      if (TEST_STORE_ID) {
        await executeSql(`
          DELETE FROM products WHERE store_id = '${TEST_STORE_ID}';
          DELETE FROM categories WHERE store_id = '${TEST_STORE_ID}';
          DELETE FROM stores WHERE id = '${TEST_STORE_ID}';
        `);
      }
      if (userId) {
        await executeSql(`
          DELETE FROM auth.users WHERE id = '${userId}';
        `);
      }
    } catch (e) {
      console.error("Error during teardown:", e);
    }
  });

  test("Capturar los 15 diseños desde la vista previa de /admin/diseno", async ({ page }) => {
    test.setTimeout(360000); // 6 minutos para los 15 diseños

    // 1. Iniciar sesión e inyectar token en localStorage
    await page.goto("/login");
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASS);
    await page.click('button[type="submit"]');

    // Esperar redirección al panel de administración
    await page.waitForURL(/\/admin/, { timeout: 15000 });

    // 2. Ir a /admin/diseno
    await page.goto("/admin/diseno");
    await page.waitForLoadState("networkidle");

    // Asegurarse de que esté en la pestaña "estructura"
    const tabEstructura = page.locator('button[value="estructura"], [role="tab"]:has-text("Estructura")');
    if (await tabEstructura.isVisible()) {
      await tabEstructura.click();
    }

    for (const struct of STRUCTURES) {
      const outPath = path.join(TARGET_DIR, `${struct.id}.png`);
      if (fs.existsSync(outPath) && fs.statSync(outPath).size > 10000) {
        console.log(`Ya existe ${struct.id}, omitiendo.`);
        continue;
      }
      console.log(`Capturando diseño: ${struct.id} (${struct.name})...`);

      // 1. Click en la tarjeta del diseño
      const cardTitle = page.locator(`h4:has-text("${struct.name}")`).first();
      await cardTitle.scrollIntoViewIfNeeded();
      await cardTitle.click();
      await page.waitForTimeout(300);

      // 2. Click en botón flotante "Vista previa"
      const floatingPreviewBtn = page.locator('div.fixed button:has-text("Vista previa")');
      await floatingPreviewBtn.click({ force: true });

      // 3. Esperar a que el diálogo se abra
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Esperar renderizado visual
      await page.waitForTimeout(500);

      // 4. Capturar el contenido de la vista previa
      const previewArea = dialog.locator(".overflow-y-auto");
      await previewArea.screenshot({ path: outPath });

      // 5. Cerrar diálogo
      const closeBtn = dialog.getByRole("button", { name: /cerrar/i });
      await closeBtn.click();
      await expect(dialog).toBeHidden({ timeout: 5000 });
      await page.waitForTimeout(200);
    }
  });
});
