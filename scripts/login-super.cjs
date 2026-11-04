const { chromium } = require("@playwright/test");
const path = require("path");

const STORAGE_PATH = process.env.SUPER_SESSION_PATH || path.resolve(process.env.TEMP || "C:\\Windows\\Temp", "super-session.json");
const BASE_URL = process.env.PW_BASE_URL || "https://dizi.idenza.site";

(async () => {
  console.log(`[Super Login] Destino del archivo de sesión: ${STORAGE_PATH}`);
  console.log(`[Super Login] Abriendo navegador visible en ${BASE_URL}/super/login...`);
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/super/login`);
  console.log("==> Por favor inicia sesión a mano como super admin en la ventana del navegador...");

  // Esperar a que el usuario complete el login y llegue al panel de super admin
  await page.waitForURL((url) => url.pathname.startsWith("/super") && !url.pathname.includes("/login"), {
    timeout: 300000, // 5 minutos de espera máxima
  });

  console.log("==> Sesión detectada con éxito. Guardando estado en:", STORAGE_PATH);
  await context.storageState({ path: STORAGE_PATH });
  await browser.close();
  console.log("==> Navegador cerrado. Sesión guardada lista para las pruebas E2E.");
})();
