/**
 * @file router.tsx
 * @description Fábrica de configuración del enrutador central de TanStack Router.
 * Vincula el árbol de rutas auto-generado (`routeTree.gen.ts`) con el cliente de caché TanStack Query (`QueryClient`).
 * Configura políticas globales de navegación:
 * - Restauración de scroll (`scrollRestoration: true`).
 * - Pre-carga bajo demanda deshabilitada por defecto (`defaultPreload: false`) para conservar ancho de banda celular.
 * - Retraso de pre-carga controlado (`defaultPreloadDelay: 200ms`).
 */

import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/**
 * Crea e inicializa una instancia del enrutador de TanStack con su contexto de QueryClient.
 * @returns Instancia configurada de TanStack Router.
 */
export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: false,
    defaultPreloadDelay: 200,
  });

  return router;
};
