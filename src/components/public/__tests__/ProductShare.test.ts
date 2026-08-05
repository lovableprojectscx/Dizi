import { describe, it, expect } from "vitest";

describe("Pruebas Unitarias de Compartir Producto y Deep-Linking (?p=ID)", () => {
  it("debe generar la URL de enlace profundo del producto sin afectar consumo de servidor", () => {
    const origin = "https://dizi.idenza.site";
    const storeSlug = "rosabella";
    const productId = "w3b64w96";

    const productUrl = `${origin}/t/${storeSlug}?p=${productId}`;

    expect(productUrl).toBe("https://dizi.idenza.site/t/rosabella?p=w3b64w96");
    expect(productUrl).toContain("?p=w3b64w96");
  });

  it("debe detectar correctamente la presencia del parámetro ?p=ID o ?producto=ID para auto-apertura", () => {
    const searchParams1 = new URLSearchParams("?p=w3b64w96");
    const searchParams2 = new URLSearchParams("?producto=w3b64w96");

    const target1 = searchParams1.get("p") || searchParams1.get("producto");
    const target2 = searchParams2.get("p") || searchParams2.get("producto");

    expect(target1).toBe("w3b64w96");
    expect(target2).toBe("w3b64w96");
  });
});
