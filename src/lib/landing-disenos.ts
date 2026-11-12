/**
 * @file landing-disenos.ts
 * @description Modelos de diseño oficiales de DIZI destacados en la sección #modelos de la landing page.
 * Solo incluye estructuras con enSelector: true en el catálogo de diseño.
 */

import type { OfficialDesignId } from "@/lib/design-catalog";

export interface LandingShowcaseDesign {
  id: OfficialDesignId;
  name: string;
  niche: string;
  desc: string;
  slug: string;
  demoUrl: string;
  image: string;
}

export const LANDING_SHOWCASE_DESIGNS: LandingShowcaseDesign[] = [
  {
    id: "vitrina",
    name: "Vitrina Boutique",
    niche: "Moda & Calzado",
    desc: "Fotos verticales 3:4 con botón directo de compra y etiqueta de oferta destacada.",
    slug: "zapatillas-demo",
    demoUrl: "https://dizi.idenza.site/t/zapatillas-demo",
    image: "/images/landing/disenos/vitrina.webp",
  },
  {
    id: "bite",
    name: "Bite Gastronómico",
    niche: "Gastronomía & Carta",
    desc: "Tema oscuro de fábrica, carrusel de recomendados y botones rápidos de adición.",
    slug: "restaurante-demo",
    demoUrl: "https://dizi.idenza.site/t/restaurante-demo",
    image: "/images/landing/disenos/bite.webp",
  },
  {
    id: "arch",
    name: "Arch Studio",
    niche: "Florerías & Regalos",
    desc: "Marcos arquitectónicos en arco superior que realzan ramos, arreglos y artesanía fina.",
    slug: "floreria-demo",
    demoUrl: "https://dizi.idenza.site/t/floreria-demo",
    image: "/images/landing/disenos/arch.webp",
  },
  {
    id: "grid",
    name: "Grilla Simétrica",
    niche: "Comercio General",
    desc: "Cuadrícula 2 columnas rápida y equilibrada. Ideal para tecnología, bazar y catálogos amplios.",
    slug: "celulares-demo",
    demoUrl: "https://dizi.idenza.site/t/celulares-demo",
    image: "/images/landing/disenos/grid.webp",
  },
  {
    id: "overlay",
    name: "Overlay Visual",
    niche: "Moda & Calzado",
    desc: "Texto y precio superpuestos con degradado oscuro sobre fotos completas de alta moda.",
    slug: "bella-moda-demo",
    demoUrl: "https://dizi.idenza.site/t/bella-moda-demo",
    image: "/images/landing/disenos/overlay.webp",
  },
  {
    id: "diagonal",
    name: "Diagonal Dynamic",
    niche: "Joyería & Boutique",
    desc: "Corte diagonal vanguardista en cabecera para marcas jóvenes, joyería y accesorios.",
    slug: "joyeria-demo",
    demoUrl: "https://dizi.idenza.site/t/joyeria-demo",
    image: "/images/landing/disenos/diagonal.webp",
  },
  {
    id: "nature",
    name: "Nature Orgánico",
    niche: "Salud & Cosmética",
    desc: "Curvas suaves, paleta verde salvia relajante y estética natural para cosmética y botánica.",
    slug: "cosmetica-demo",
    demoUrl: "https://dizi.idenza.site/t/cosmetica-demo",
    image: "/images/landing/disenos/nature.webp",
  },
  {
    id: "bloom_general",
    name: "Bloom Estándar",
    niche: "Florerías & Regalos",
    desc: "Esquinas redondeadas, acentos sutiles y tarjetas suaves para regalos, repostería y detalles.",
    slug: "regalos-demo",
    demoUrl: "https://dizi.idenza.site/t/regalos-demo",
    image: "/images/landing/disenos/bloom_general.webp",
  },
  {
    id: "perfil",
    name: "Perfil",
    niche: "Moda & Ropa",
    desc: "Banner ancho con logo superpuesto, nombre destacado y grilla simétrica para boutiques y tiendas de autor.",
    slug: "boutique-demo",
    demoUrl: "https://dizi.idenza.site/t/boutique-demo",
    image: "/images/landing/disenos/perfil.webp",
  },
];
