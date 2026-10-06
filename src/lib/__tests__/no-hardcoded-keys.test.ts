import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Test estático de seguridad:
 * Garantiza que ninguna clave JWT antigua (eyJhbGciOi...) ni clave secreta (sb_secret_...)
 * quede escrita en el código de src/, api/ o tests/.
 */
describe("Seguridad estática - Ninguna clave hardcodeada en el repositorio", () => {
  const FORBIDDEN_PATTERNS = [
    { name: "JWT antigua (eyJhbGciOi)", pattern: /eyJhbGciOi/ },
    { name: "Secret Key (sb_secret_)", pattern: /sb_secret_/ },
  ];

  const TARGET_DIRS = ["src", "api", "tests"];

  function getFilesRecursively(dir: string): string[] {
    const fullDir = path.resolve(process.cwd(), dir);
    if (!fs.existsSync(fullDir)) return [];

    let results: string[] = [];
    const entries = fs.readdirSync(fullDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(fullDir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(getFilesRecursively(fullPath));
      } else if (
        entry.isFile() &&
        /\.(ts|tsx|js|jsx|json|sql|html|css|md)$/i.test(entry.name) &&
        !entry.name.includes("no-hardcoded-keys.test.ts") // excluir este mismo archivo de prueba
      ) {
        results.push(fullPath);
      }
    }
    return results;
  }

  it("Garantiza que ningún archivo en src/, api/ o tests/ contiene eyJhbGciOi ni sb_secret_", () => {
    const violations: { file: string; pattern: string }[] = [];

    for (const dir of TARGET_DIRS) {
      const files = getFilesRecursively(dir);
      for (const file of files) {
        const content = fs.readFileSync(file, "utf8");
        for (const { name, pattern } of FORBIDDEN_PATTERNS) {
          if (pattern.test(content)) {
            violations.push({
              file: path.relative(process.cwd(), file),
              pattern: name,
            });
          }
        }
      }
    }

    expect(
      violations,
      `Se encontraron claves hardcodeadas en los siguientes archivos: ${JSON.stringify(violations, null, 2)}`
    ).toEqual([]);
  });
});
