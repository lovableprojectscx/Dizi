/**
 * @file showcase.ts
 * @description Catálogo centralizado de tiendas de demostración y vitrinas públicas
 * utilizadas en el flujo de registro (/register) y página de inicio (landing).
 */

export interface ShowcaseItem {
  id: string;
  name: string;
  desc: string;
  slug: string;
  route: "bio" | "t";
}

/**
 * Genera la URL relativa de la vitrina según su ruta y slug.
 */
export function getShowcaseUrl(item: Pick<ShowcaseItem, "route" | "slug">): string {
  return `/${item.route}/${item.slug}`;
}

/**
 * Vitrinas de ejemplo destacadas en el Paso 1 de registro (/register).
 */
export const SHOWCASE_REGISTER_ITEMS: ShowcaseItem[] = [
  {
    id: "floreria",
    name: "Florería",
    desc: "Arreglos florales",
    slug: "floreria-demo",
    route: "bio",
  },
  {
    id: "wehome",
    name: "Adornia · We Home",
    desc: "Decoración & Hogar",
    slug: "catalogo",
    route: "bio",
  },
  {
    id: "restaurante",
    name: "Restaurante",
    desc: "Menú digital",
    slug: "restaurante-demo",
    route: "bio",
  },
  {
    id: "ortopedicos",
    name: "Ortopédicos",
    desc: "Productos y precios",
    slug: "ortopedicos-demo",
    route: "bio",
  },
  {
    id: "gigatech",
    name: "GigaTech",
    desc: "Celulares & Tecnología",
    slug: "celulares-demo",
    route: "bio",
  },
  {
    id: "kickz",
    name: "Kickz Premium",
    desc: "Zapatillas Urbanas",
    slug: "zapatillas-demo",
    route: "bio",
  },
];

/**
 * Tienda de demostración destacada en la página de inicio (landing / index).
 */
export const SHOWCASE_LANDING_ITEM: ShowcaseItem = {
  id: "grano-miga",
  name: "Grano & Miga",
  desc: "Panadería artesanal",
  slug: "grano-miga",
  route: "t",
};

/**
 * Todas las vitrinas públicas configuradas en el sistema sin duplicados.
 */
export const ALL_SHOWCASE_ITEMS: ShowcaseItem[] = [
  ...SHOWCASE_REGISTER_ITEMS,
  SHOWCASE_LANDING_ITEM,
];
