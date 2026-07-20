import { describe, it, expect } from "vitest";
import { renderErrorPage } from "../error-page";

describe("renderErrorPage (error-page.ts)", () => {
  it("debe retornar la plantilla HTML básica para páginas de error en formato string", () => {
    const html = renderErrorPage();

    // Verificamos elementos obligatorios del markup HTML
    expect(html).toContain("<!doctype html>");
    expect(html).toContain('<html lang="en">');
    expect(html).toContain("<head>");
    expect(html).toContain("<body>");
  });

  it("debe contener el título y mensajes descriptivos en inglés para el usuario", () => {
    const html = renderErrorPage();

    expect(html).toContain("This page didn't load");
    expect(html).toContain("Something went wrong on our end.");
    expect(html).toContain("location.reload()"); // El script del botón refrescar
  });
});
