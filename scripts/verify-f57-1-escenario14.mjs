/**
 * @file verify-f57-1-escenario14.mjs
 * @description Escenario 14 (F57.1, solo lectura):
 * Exporta en memoria (id, slug, plan, plan_expires_at, active) de todas las tiendas de producción
 * junto con el resultado de la regla SQL exacta de `public.semilla_sunset_targets('2026-12-09')`
 * (o la función misma si ya está aplicada en la base), ejecuta la función real del cliente
 * `shouldShowSemillaNotice` desde `/src/lib/semilla-notice.ts` con fecha simulada
 * `2026-12-08 23:00:00` hora Lima (`2026-12-09T04:00:00.000Z`), y certifica 0 diferencias.
 *
 * Reglas de seguridad (AGENTS.md):
 * - Solo lectura (SELECT).
 * - No lee `.env` ni expone claves.
 * - No imprime nombres, correos, teléfonos ni slugs de clientes reales (solo conteos;
 *   si existiera alguna diferencia, solo muestra slug si es `*-demo` o `zz-*`).
 */

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

// El directorio principal mantiene el vínculo `.temp/project-ref` de Supabase CLI
const linkedSupabaseDir = path.resolve(repoRoot, "..", "catalog-connect-main");

const READ_ONLY_SQL = `
SELECT
  s.id,
  s.slug,
  s.plan,
  s.plan_expires_at,
  s.active,
  (
    (
      s.plan = 'semilla'
      OR (
        s.plan <> 'semilla'
        AND s.plan_expires_at IS NOT NULL
        AND (s.plan_expires_at + interval '3 days') < ('2026-12-09'::date::timestamp AT TIME ZONE 'America/Lima')
      )
    )
    AND s.slug NOT LIKE '%-demo'
    AND s.slug NOT LIKE 'zz-%'
    AND NOT (s.plan = 'ilimitado' AND s.plan_expires_at IS NULL)
  ) AS sql_rule_matches
FROM public.stores s
ORDER BY s.id;
`
  .replace(/\s+/g, " ")
  .trim();

function queryProductionStoresReadOnly() {
  const psSingleQuotedSql = READ_ONLY_SQL.replace(/'/g, "''");
  const psCommand = `& npx.cmd supabase db query --remote --agent=no --yes -o json '${psSingleQuotedSql}'`;
  const raw = execFileSync(
    "powershell.exe",
    ["-NoProfile", "-Command", psCommand],
    {
      cwd: linkedSupabaseDir,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    },
  );

  // Extraer el bloque JSON del stdout de Supabase CLI
  const lines = raw.split(/\r?\n/);
  const startLineIdx = lines.findIndex((l) => l.trim() === "[" || l.trim().startsWith("{"));
  if (startLineIdx === -1) {
    throw new Error(`No se encontró salida JSON válida en supabase db query:\n${raw}`);
  }
  const parsed = JSON.parse(lines.slice(startLineIdx).join("\n"));
  return Array.isArray(parsed) ? parsed : (parsed.rows ?? []);
}

async function main() {
  // 1. Cargar la función REAL del cliente mediante Vite SSR (sin duplicar lógica)
  const vite = await createServer({
    root: repoRoot,
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: "silent",
  });

  let shouldShowSemillaNotice;
  try {
    const mod = await vite.ssrLoadModule("/src/lib/semilla-notice.ts");
    shouldShowSemillaNotice = mod.shouldShowSemillaNotice;
  } finally {
    await vite.close();
  }

  // 2. Consultar las tiendas reales en solo lectura
  const rows = queryProductionStoresReadOnly();

  // Fecha simulada: 8 dic 2026 23:00:00 Lima (UTC-5) = 2026-12-09T04:00:00.000Z
  const simulatedNow = new Date("2026-12-09T04:00:00.000Z");
  const config = {
    pausaActiva: false,
    pausaDesde: null,
    semillaFin: "2026-12-09",
  };

  let clientMatchCount = 0;
  let sqlMatchCount = 0;
  let semillaTargetCount = 0;
  let nonSemillaTargetCount = 0;
  let demoExcludedCount = 0;
  let zzExcludedCount = 0;
  let internalIlimitadoExcludedCount = 0;
  let activeOrGraceAfterDec6Count = 0;

  const differences = [];

  for (const row of rows) {
    const storeInput = {
      slug: row.slug,
      plan: row.plan,
      planExpiresAt: row.plan_expires_at,
      active: row.active,
    };

    const clientMatches = shouldShowSemillaNotice(storeInput, config, simulatedNow);
    const sqlMatches = Boolean(row.sql_rule_matches);

    if (clientMatches) clientMatchCount++;
    if (sqlMatches) {
      sqlMatchCount++;
      if (row.plan === "semilla") semillaTargetCount++;
      else nonSemillaTargetCount++;
    } else {
      const slug = String(row.slug || "");
      if (slug.endsWith("-demo")) demoExcludedCount++;
      else if (slug.startsWith("zz-")) zzExcludedCount++;
      else if (row.plan === "ilimitado" && !row.plan_expires_at) internalIlimitadoExcludedCount++;
      else activeOrGraceAfterDec6Count++;
    }

    if (clientMatches !== sqlMatches) {
      const isPublicTestSlug =
        String(row.slug || "").endsWith("-demo") || String(row.slug || "").startsWith("zz-");
      differences.push({
        id: row.id,
        slug: isPublicTestSlug ? row.slug : "[enmascarado]",
        plan: row.plan,
        clientMatches,
        sqlMatches,
      });
    }
  }

  const summary = {
    escenario: "Escenario 14 — Comparación cliente (2026-12-08 23:00 Lima) vs regla SQL (p_s = 2026-12-09)",
    total_tiendas_evaluadas: rows.length,
    cliente_mostrar_8dic_23h_lima: clientMatchCount,
    sql_semilla_sunset_targets_2026_12_09: sqlMatchCount,
    desglose_objetivo: {
      plan_semilla: semillaTargetCount,
      pagadas_o_prueba_vencidas_mas_3d_al_9dic: nonSemillaTargetCount,
    },
    desglose_excluidas: {
      demos: demoExcludedCount,
      zz_pruebas: zzExcludedCount,
      ilimitado_sin_vencimiento_no_demo: internalIlimitadoExcludedCount,
      vigentes_o_en_gracia_al_9dic: activeOrGraceAfterDec6Count,
    },
    diferencias_encontradas: differences.length,
    detalle_diferencias: differences,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (differences.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
