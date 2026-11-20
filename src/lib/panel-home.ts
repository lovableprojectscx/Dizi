/**
 * @file panel-home.ts
 * @description Lógica pura para Inicio (/admin/dashboard) y Promociona (/admin/marketing) en F54:
 * - Selección de fotos del mosaico y producto principal según `sortOrder` (RF-54.2, RF-54.6).
 * - Prioridad única de "Tu siguiente paso" y "También pendiente" (RF-54.3, RF-54.4).
 * - Estilos disponibles en miniaturas (RF-54.6 / ajuste: "Oferta" solo si `shareData.isOnSale`).
 * - Tokens de contraste del manual de marca para verificación WCAG AA (RNF-54.4).
 */

import { isProductIncomplete } from "@/lib/products";
import { getContrastRatio, hexToRgb } from "@/lib/brand-cover";
import type { ShareImageData, ShareImageStyle } from "@/lib/share-image/types";
import type { Product, Store } from "@/lib/types";

export type NextStepId =
  | "no-products"
  | "completa-tu-tienda"
  | "incomplete-products"
  | "trial-ending"
  | "survey"
  | "promote";

export interface NextStepItem {
  id: NextStepId;
  title: string;
  description: string;
  ctaLabel: string;
  to: string;
  /** Solo "incomplete-products" usa borde ámbar de alerta (RNF-54.3). */
  tone: "brand" | "warning";
  /** Conteo opcional (p. ej. productos incompletos o días restantes de prueba). */
  count?: number;
}

export interface NextStepLink {
  id: "incomplete-products" | "trial-ending" | "survey";
  label: string;
  to: string;
}

export interface NextStepContext {
  surveyEligible: boolean;
  completaTuTiendaEligible?: boolean;
  completaTuTiendaDismissed?: boolean;
  completaTuTiendaCompletedAll?: boolean;
  now?: Date;
}

export interface NextStepResult {
  principal: NextStepItem;
  tambien: NextStepLink[];
}

export interface TrialStatus {
  isTrial: boolean;
  daysLeft: number;
}

/**
 * Calcula si la tienda está en prueba activa y cuántos días quedan (misma fórmula que Inicio hoy).
 */
export function getTrialStatus(
  store: Pick<Store, "subscriptionStatus" | "plan" | "planExpiresAt">,
  now: Date = new Date(),
): TrialStatus {
  const isTrial = store.subscriptionStatus === "trial" && store.plan !== "semilla";
  const daysLeft = store.planExpiresAt
    ? Math.max(
        0,
        Math.ceil((new Date(store.planExpiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      )
    : 0;

  return { isTrial, daysLeft };
}

/**
 * Ordena productos tal como el catálogo (`sortOrder` ascendente, preservando orden relativo en empates).
 */
function sortByCatalogOrder(products: Product[]): Product[] {
  return products
    .map((product, index) => ({ product, index }))
    .sort((a, b) => {
      const orderA =
        typeof a.product.sortOrder === "number" ? a.product.sortOrder : Number.MAX_SAFE_INTEGER;
      const orderB =
        typeof b.product.sortOrder === "number" ? b.product.sortOrder : Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return a.index - b.index;
    })
    .map((entry) => entry.product);
}

/**
 * RF-54.2: Hasta `limit` (por defecto 4) productos visibles, con foto y sin `isSample`,
 * ordenados según `sortOrder`.
 */
export function getMosaicProducts(store: Pick<Store, "products">, limit = 4): Product[] {
  if (!store?.products?.length || limit <= 0) return [];
  const eligible = store.products.filter(
    (p) => p.visible && !p.isSample && typeof p.image === "string" && p.image.trim().length > 0,
  );
  return sortByCatalogOrder(eligible).slice(0, limit);
}

/**
 * RF-54.6: Producto principal para "Así se ve tu producto" en Promociona:
 * el primero visible, con foto y sin `isSample` según `sortOrder`.
 */
export function getHeroProduct(store: Pick<Store, "products">): Product | null {
  return getMosaicProducts(store, 1)[0] ?? null;
}

/**
 * RF-54.6 + ajuste de Paso 1: en miniaturas (`StylePreviewStrip`), el estilo "Oferta"
 * solo aparece si `shareData.isOnSale` es verdadero (no por `isConsultPrice`).
 */
export function getAvailablePreviewStyles(
  shareData: Pick<ShareImageData, "isOnSale">,
): ShareImageStyle[] {
  if (shareData.isOnSale) {
    return ["etiqueta", "editorial", "marco-color", "oferta"];
  }
  return ["etiqueta", "editorial", "marco-color"];
}

/**
 * RF-54.3 y RF-54.4: Determina la única tarjeta "Tu siguiente paso" y hasta 2 enlaces
 * en "También pendiente" sin alterar ninguna condición de elegibilidad existente.
 */
export function getNextStep(store: Store, ctx: NextStepContext): NextStepResult {
  const now = ctx.now ?? new Date();
  const products = store.products ?? [];
  const incompleteCount = products.filter(isProductIncomplete).length;
  const { isTrial, daysLeft } = getTrialStatus(store, now);

  const showCompletaTuTienda = Boolean(
    ctx.completaTuTiendaEligible &&
      !ctx.completaTuTiendaDismissed &&
      !ctx.completaTuTiendaCompletedAll,
  );

  // Construimos los candidatos secundarios (c)-(e) en orden de prioridad
  const secondaryCandidates: { item: NextStepItem; link: NextStepLink }[] = [];

  if (incompleteCount > 0) {
    const label =
      incompleteCount === 1
        ? "Completa 1 producto"
        : `Completa ${incompleteCount} productos`;
    secondaryCandidates.push({
      item: {
        id: "incomplete-products",
        title: label,
        description:
          "Completa sus nombres y precios para que tus clientes puedan comprar sin dudas.",
        ctaLabel: "Completar productos",
        to: "/admin/productos",
        tone: "warning",
        count: incompleteCount,
      },
      link: {
        id: "incomplete-products",
        label,
        to: "/admin/productos",
      },
    });
  }

  if (isTrial && daysLeft <= 3) {
    const daysText = daysLeft === 1 ? "queda 1 día" : `quedan ${daysLeft} días`;
    secondaryCandidates.push({
      item: {
        id: "trial-ending",
        title: "Elige tu plan",
        description: `Tu prueba gratis está por terminar (${daysText}). Elige tu plan para no perder funciones.`,
        ctaLabel: "Ver planes",
        to: "/admin/plan",
        tone: "brand",
        count: daysLeft,
      },
      link: {
        id: "trial-ending",
        label: `Elige tu plan (${daysText})`,
        to: "/admin/plan",
      },
    });
  }

  if (ctx.surveyEligible) {
    secondaryCandidates.push({
      item: {
        id: "survey",
        title: "Responde 7 preguntas y gana 15 días",
        description:
          store.plan === "semilla"
            ? "Completa la breve encuesta y recibe 15 días de prueba de Emprendedor."
            : "Completa la breve encuesta y suma 15 días más a tu plan actual.",
        ctaLabel: "Responder encuesta",
        to: "/admin/encuesta",
        tone: "brand",
      },
      link: {
        id: "survey",
        label: "Responde la encuesta y gana 15 días",
        to: "/admin/encuesta",
      },
    });
  }

  // (a) Sin productos
  if (products.length === 0) {
    return {
      principal: {
        id: "no-products",
        title: "Agrega tu primer producto",
        description:
          "Sube tus primeros productos para que tus clientes vean tu catálogo y te pidan por WhatsApp.",
        ctaLabel: "Agregar primer producto",
        to: "/admin/productos",
        tone: "brand",
      },
      tambien: [],
    };
  }

  // (b) Tienda elegible para CompletaTuTienda y no descartada ni completada
  if (showCompletaTuTienda) {
    return {
      principal: {
        id: "completa-tu-tienda",
        title: "Completa tu tienda",
        description: "Deja tu catálogo listo para vender más por WhatsApp y redes.",
        ctaLabel: "Continuar",
        to: "/admin/productos",
        tone: "brand",
      },
      tambien: [],
    };
  }

  // (c)-(e) Primer pendiente real; hasta 2 restantes en "También pendiente"
  if (secondaryCandidates.length > 0) {
    const [first, ...rest] = secondaryCandidates;
    return {
      principal: first.item,
      tambien: rest.slice(0, 2).map((entry) => entry.link),
    };
  }

  // (f) Nada pendiente → ir a Promociona
  return {
    principal: {
      id: "promote",
      title: "Crea una imagen para tus estados",
      description:
        "Convierte uno de tus productos en una historia lista para compartir en WhatsApp e Instagram.",
      ctaLabel: "Ir a Promociona",
      to: "/admin/marketing",
      tone: "brand",
    },
    tambien: [],
  };
}

/** Pares de color oficiales usados en F54 (claro y oscuro) para pruebas WCAG AA. */
export const PANEL_BRAND_CONTRAST_PAIRS = {
  heroLight: { fg: "#FAF7F2", bg: "#312E81" },
  heroDark: { fg: "#FAF7F2", bg: "#312E81" },
  ctaCoral: { fg: "#1E1B4B", bg: "#FF5C39" },
  cardLight: { fg: "#1E1B4B", bg: "#FFFFFF" },
  cardDark: { fg: "#FAF7F2", bg: "#252248" },
  pageDark: { fg: "#FAF7F2", bg: "#1B1938" },
  linkLight: { fg: "#312E81", bg: "#FFFFFF" },
} as const;

export function getHexContrastRatio(fgHex: string, bgHex: string): number {
  const a = hexToRgb(fgHex);
  const b = hexToRgb(bgHex);
  if (!a || !b) return 0;
  return getContrastRatio(a, b);
}
