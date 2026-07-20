import { describe, it, expect } from "vitest";
import { cn } from "../utils";

describe("cn utility (utils.ts)", () => {
  it("debe combinar nombres de clases de CSS simples", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
  });

  it("debe omitir valores falsy como null, undefined, false y strings vacíos", () => {
    expect(cn("class1", null, undefined, false, "", "class2")).toBe("class1 class2");
  });

  it("debe fusionar correctamente clases en conflicto de Tailwind CSS (gana la última)", () => {
    // p-4 y p-8 están en conflicto; twMerge debe dejar p-8
    expect(cn("p-4 p-8")).toBe("p-8");
    // text-red-500 y text-blue-500; debe quedar text-blue-500
    expect(cn("text-red-500 text-blue-500")).toBe("text-blue-500");
  });
});
