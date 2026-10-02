import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { PLANS } from "@/lib/types";

describe("G1: Unificación de Precios Canónicos (Single Source of Truth)", () => {
  it("debe contener los precios oficiales de Jack en src/lib/types.ts", () => {
    expect(PLANS.semilla).toMatchObject({
      id: "semilla",
      name: "Semilla",
      productLimit: 20,
      price: 0,
      annualPrice: 0,
    });
    expect(PLANS.emprendedor).toMatchObject({
      id: "emprendedor",
      name: "Emprendedor",
      productLimit: 100,
      price: 19.9,
      annualPrice: 179,
    });
    expect(PLANS.pro).toMatchObject({
      id: "pro",
      name: "Catálogo Pro",
      productLimit: 300,
      price: 39.9,
      annualPrice: 359,
    });
    expect(PLANS.ilimitado).toMatchObject({
      id: "ilimitado",
      name: "Ilimitado",
      productLimit: 1000,
      price: 69.9,
      annualPrice: 629,
    });
  });

  it("calcula dinámicamente el equivalente mensual del pago anual con 2 decimales", () => {
    // 179 / 12 = 14.9166... -> "14.92"
    expect((PLANS.emprendedor.annualPrice / 12).toFixed(2)).toBe("14.92");
    // 359 / 12 = 29.9166... -> "29.92"
    expect((PLANS.pro.annualPrice / 12).toFixed(2)).toBe("29.92");
    // 629 / 12 = 52.4166... -> "52.42"
    expect((PLANS.ilimitado.annualPrice / 12).toFixed(2)).toBe("52.42");
  });

  it("falla si algún archivo de src/ contiene precios hardcodeados fuera de types.ts", () => {
    const srcDir = path.resolve(__dirname, "../..");
    const forbiddenPrices = ["19.90", "39.90", "69.90", "179", "359", "629"];

    function getFiles(dir: string): string[] {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const files: string[] = [];
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          // Excluir carpetas de tests
          if (entry.name !== "__tests__" && entry.name !== "node_modules") {
            files.push(...getFiles(fullPath));
          }
        } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
          // Excluir archivos de test y types.ts
          if (!entry.name.includes(".test.") && !entry.name.includes(".spec.") && entry.name !== "types.ts") {
            files.push(fullPath);
          }
        }
      }
      return files;
    }

    const files = getFiles(srcDir);
    const violations: { file: string; line: number; text: string }[] = [];

    // Regex que busca precios textuales o números aislados de precios, ignorando coordenadas SVG o códigos hexadecimales (#f06292)
    const priceRegex = /(?<![#a-zA-Z0-9_\-.])(19\.90|39\.90|69\.90|179|359|629)(?![a-zA-Z0-9_\-.])/;


    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      const lines = content.split("\n");
      lines.forEach((lineText, idx) => {
        // Ignorar líneas de comentarios explicativos o SVG path coordinates
        if (lineText.trim().startsWith("//") || lineText.trim().startsWith("*") || lineText.includes("<path") || lineText.includes("stopColor")) {
          return;
        }
        if (priceRegex.test(lineText)) {
          violations.push({
            file: path.relative(srcDir, file),
            line: idx + 1,
            text: lineText.trim(),
          });
        }
      });
    }

    expect(
      violations,
      `Se encontraron precios hardcodeados fuera de types.ts:\n${violations.map((v) => `${v.file}:${v.line} -> ${v.text}`).join("\n")}`
    ).toEqual([]);
  });
});
