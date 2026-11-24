import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const infoNecesariaDir = path.resolve(
  repoRoot,
  "../../INFORMACIÓN NECESARIA",
);

const pairs = [
  {
    name: "planes-suscripciones/spec.md",
    repoFile: path.join(repoRoot, "openspec/specs/planes-suscripciones/spec.md"),
    infoFile: path.join(
      infoNecesariaDir,
      "03-PRODUCTO-Y-REQUISITOS/especificaciones-openspec/planes-suscripciones/spec.md",
    ),
  },
  {
    name: "registro-invitaciones/spec.md",
    repoFile: path.join(repoRoot, "openspec/specs/registro-invitaciones/spec.md"),
    infoFile: path.join(
      infoNecesariaDir,
      "03-PRODUCTO-Y-REQUISITOS/especificaciones-openspec/registro-invitaciones/spec.md",
    ),
  },
];

let hasDiff = false;

for (const pair of pairs) {
  if (!fs.existsSync(pair.repoFile)) {
    console.error(`[ERROR] No existe en repo: ${pair.repoFile}`);
    hasDiff = true;
    continue;
  }
  if (!fs.existsSync(pair.infoFile)) {
    console.error(`[ERROR] No existe en INFORMACIÓN NECESARIA: ${pair.infoFile}`);
    hasDiff = true;
    continue;
  }

  const repoContent = fs.readFileSync(pair.repoFile, "utf-8").replace(/\r\n/g, "\n").trim();
  const infoContent = fs.readFileSync(pair.infoFile, "utf-8").replace(/\r\n/g, "\n").trim();

  if (repoContent === infoContent) {
    console.log(`[OK] ${pair.name}: diff vacío (idéntico)`);
  } else {
    hasDiff = true;
    console.error(`[DIFF] ${pair.name} difiere entre repo e INFORMACIÓN NECESARIA`);
    const repoLines = repoContent.split("\n");
    const infoLines = infoContent.split("\n");
    const maxLen = Math.max(repoLines.length, infoLines.length);
    for (let i = 0; i < maxLen; i++) {
      if (repoLines[i] !== infoLines[i]) {
        console.error(`  Línea ${i + 1}:`);
        console.error(`    repo: ${repoLines[i] ?? "<EOF>"}`);
        console.error(`    info: ${infoLines[i] ?? "<EOF>"}`);
      }
    }
  }
}

if (hasDiff) {
  process.exit(1);
} else {
  console.log("RESULTADO: diff vacío — openspec/specs sincronizado con INFORMACIÓN NECESARIA.");
}
