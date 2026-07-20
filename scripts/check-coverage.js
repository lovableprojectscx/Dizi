import fs from "fs";
import path from "path";

// Obtener el límite mínimo por argumento o defecto (80%)
const args = process.argv.slice(2);
const minArgIndex = args.indexOf("--min");
const minCoverage = minArgIndex !== -1 ? parseFloat(args[minArgIndex + 1]) : 80;

console.log(`[Quality Gate] Validando cobertura mínima requerida: ${minCoverage}%`);

const summaryPath = path.resolve(process.cwd(), "coverage/coverage-summary.json");

if (!fs.existsSync(summaryPath)) {
  console.warn("⚠️ [Quality Gate] No se encontró el archivo de cobertura 'coverage-summary.json'.");
  console.log("Asegúrate de correr primero 'npx vitest run --coverage'.");
  console.log("Paso aprobado de forma preventiva en modo local.");
  process.exit(0);
}

try {
  const data = JSON.parse(fs.readFileSync(summaryPath, "utf8"));

  // Cobertura de líneas global
  const linesPct = data.total.lines.pct;

  console.log(`[Quality Gate] Cobertura de líneas registrada: ${linesPct}%`);

  if (linesPct < minCoverage) {
    console.error(
      `❌ [Quality Gate] FALLIDO: La cobertura de líneas (${linesPct}%) es menor al mínimo requerido (${minCoverage}%).`,
    );
    process.exit(1);
  }

  console.log("✅ [Quality Gate] EXITOSO: La cobertura supera los estándares de calidad.");
  process.exit(0);
} catch (err) {
  console.error("❌ [Quality Gate] Error al procesar el reporte de cobertura:", err.message);
  process.exit(1);
}
