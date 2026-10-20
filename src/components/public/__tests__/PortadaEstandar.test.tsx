import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PortadaEstandar } from "../PortadaEstandar";

describe("PortadaEstandar Component (Fase A2)", () => {
  const sampleBanners = [
    "https://storage.example.com/banner1.webp",
    "https://storage.example.com/banner2.webp",
    "https://storage.example.com/banner3.webp",
  ];

  describe("1. Cantidad de Banners (0, 1 y 3 banners)", () => {
    it("con 0 banners: no pinta nada (retorna null / cadena vacía sin espacio residual)", () => {
      const htmlEmpty = renderToStaticMarkup(
        <PortadaEstandar activeBanners={[]} />
      );
      expect(htmlEmpty).toBe("");

      const htmlNull = renderToStaticMarkup(
        <PortadaEstandar activeBanners={null} />
      );
      expect(htmlNull).toBe("");

      const htmlUndefined = renderToStaticMarkup(
        <PortadaEstandar />
      );
      expect(htmlUndefined).toBe("");
    });

    it("con 1 banner: renderiza imagen fija sin puntos de carrusel", () => {
      const html = renderToStaticMarkup(
        <PortadaEstandar activeBanners={[sampleBanners[0]]} />
      );

      // Renderiza la sección
      expect(html).toContain('data-testid="portada-estandar"');
      expect(html).toContain("aspect-[3/1]");

      // Imagen única con optimización a 1200, eager y high priority
      expect(html).toContain("banner1.webp");
      expect(html).toContain('loading="eager"');
      expect(html).toMatch(/fetchpriority="high"/i);
      expect(html).toContain("object-cover object-center");

      // No debe contener paginación (dots)
      expect(html).not.toContain('data-testid="portada-dots"');
    });

    it("con 3 banners: renderiza los 3 slides, primera eager y las demás lazy, y puntos de carrusel", () => {
      const html = renderToStaticMarkup(
        <PortadaEstandar activeBanners={sampleBanners} />
      );

      expect(html).toContain('data-testid="portada-estandar"');
      expect(html).toContain("aspect-[3/1]");

      // 3 slides
      expect(html).toContain('data-testid="portada-slide-0"');
      expect(html).toContain('data-testid="portada-slide-1"');
      expect(html).toContain('data-testid="portada-slide-2"');

      // Primera imagen eager/high
      expect(html).toContain('loading="eager"');
      expect(html).toMatch(/fetchpriority="high"/i);

      // Las demás lazy
      expect(html).toContain('loading="lazy"');

      // Puntos de navegación
      expect(html).toContain('data-testid="portada-dots"');
      expect(html).toContain('aria-label="Ver banner 1 de 3"');
      expect(html).toContain('aria-label="Ver banner 2 de 3"');
      expect(html).toContain('aria-label="Ver banner 3 de 3"');
    });
  });

  describe("2. Renderizado de Textos y Degradado Sutil (con y sin cada texto)", () => {
    it("con todos los textos: renderiza etiqueta arriba, título y subtítulo con degradado", () => {
      const html = renderToStaticMarkup(
        <PortadaEstandar
          activeBanners={sampleBanners}
          bannerBottomTag="NUEVA COLECCIÓN"
          bannerTitle="Primavera Floral 2026"
          bannerTagline="Envíos a todo Lima y provincias"
        />
      );

      expect(html).toContain('data-testid="portada-texts"');
      expect(html).toContain('data-testid="portada-tag"');
      expect(html).toContain("NUEVA COLECCIÓN");
      expect(html).toContain('data-testid="portada-title"');
      expect(html).toContain("Primavera Floral 2026");
      expect(html).toContain('data-testid="portada-tagline"');
      expect(html).toContain("Envíos a todo Lima y provincias");
      expect(html).toContain('data-testid="portada-gradient-overlay"');
    });

    it("con solo título: renderiza solo el título, sin etiqueta ni subtítulo", () => {
      const html = renderToStaticMarkup(
        <PortadaEstandar
          activeBanners={[sampleBanners[0]]}
          bannerTitle="Solo Título Principal"
        />
      );

      expect(html).toContain('data-testid="portada-title"');
      expect(html).toContain("Solo Título Principal");
      expect(html).not.toContain('data-testid="portada-tag"');
      expect(html).not.toContain('data-testid="portada-tagline"');
      // No inventa textos por defecto
      expect(html).not.toContain("Explora nuestra colección");
      expect(html).not.toContain("COLECCIÓN EXCLUSIVA");
    });

    it("con solo subtítulo (tagline): renderiza solo el subtítulo", () => {
      const html = renderToStaticMarkup(
        <PortadaEstandar
          activeBanners={[sampleBanners[0]]}
          bannerTagline="Solo mensaje promocional sin título"
        />
      );

      expect(html).toContain('data-testid="portada-tagline"');
      expect(html).toContain("Solo mensaje promocional sin título");
      expect(html).not.toContain('data-testid="portada-title"');
      expect(html).not.toContain('data-testid="portada-tag"');
    });

    it("con solo etiqueta (bannerBottomTag): renderiza solo la etiqueta", () => {
      const html = renderToStaticMarkup(
        <PortadaEstandar
          activeBanners={[sampleBanners[0]]}
          bannerBottomTag="OFERTA ESPECIAL"
        />
      );

      expect(html).toContain('data-testid="portada-tag"');
      expect(html).toContain("OFERTA ESPECIAL");
      expect(html).not.toContain('data-testid="portada-title"');
      expect(html).not.toContain('data-testid="portada-tagline"');
    });

    it("sin ningún texto: no renderiza capa de textos ni inventa textos por defecto", () => {
      const html = renderToStaticMarkup(
        <PortadaEstandar
          activeBanners={sampleBanners}
          bannerTitle={null}
          bannerTagline={undefined}
          bannerBottomTag=""
        />
      );

      expect(html).not.toContain('data-testid="portada-texts"');
      expect(html).not.toContain('data-testid="portada-gradient-overlay"');
      expect(html).not.toContain("Explora nuestra colección");
      expect(html).not.toContain("COLECCIÓN EXCLUSIVA");
      expect(html).not.toContain("Catálogo");
    });
  });

  describe("3. Modo Resultados (isNarrowing)", () => {
    it("se oculta completamente en modo resultados (isNarrowing=true), retornando null / cadena vacía", () => {
      const htmlNarrowing = renderToStaticMarkup(
        <PortadaEstandar
          activeBanners={sampleBanners}
          bannerTitle="Gran Oferta"
          isNarrowing={true}
        />
      );

      expect(htmlNarrowing).toBe("");
    });

    it("se muestra normalmente cuando isNarrowing=false", () => {
      const htmlNormal = renderToStaticMarkup(
        <PortadaEstandar
          activeBanners={sampleBanners}
          bannerTitle="Gran Oferta"
          isNarrowing={false}
        />
      );

      expect(htmlNormal).toContain('data-testid="portada-estandar"');
      expect(htmlNormal).toContain("Gran Oferta");
    });
  });
});
