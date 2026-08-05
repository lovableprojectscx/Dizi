import { describe, it, expect } from "vitest";
import { Route as PrivacidadRoute } from "@/routes/privacidad";
import { Route as TerminosRoute } from "@/routes/terminos";

describe("Pruebas Unitarias de Documentos Legales (Privacidad y Términos)", () => {
  describe("Política de Privacidad (/privacidad)", () => {
    it("debe definir los metadatos SEO conforme a la Ley 29733 de Protección de Datos del Perú", () => {
      const head = (PrivacidadRoute.options as any).head();
      const titleMeta = head.meta.find((m: any) => m.title);
      const descMeta = head.meta.find((m: any) => m.name === "description");
      const canonical = head.meta.find((m: any) => m.rel === "canonical");

      expect(titleMeta.title).toBe("Política de Privacidad — Dizi");
      expect(descMeta.content).toContain("Ley 29733 de Protección de Datos Personales del Perú");
      expect(canonical.href).toBe("https://dizi.idenza.site/privacidad");
    });
  });

  describe("Términos y Condiciones (/terminos)", () => {
    it("debe definir los metadatos SEO adecuados para la normativa comercial peruana", () => {
      const head = (TerminosRoute.options as any).head();
      const titleMeta = head.meta.find((m: any) => m.title);
      const descMeta = head.meta.find((m: any) => m.name === "description");
      const canonical = head.meta.find((m: any) => m.rel === "canonical");

      expect(titleMeta.title).toBe("Términos y Condiciones — Dizi");
      expect(descMeta.content).toContain("Términos y Condiciones de uso de Dizi");
      expect(canonical.href).toBe("https://dizi.idenza.site/terminos");
    });
  });
});
