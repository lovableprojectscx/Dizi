import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Outlet, Link, createRootRouteWithContext, useRouter } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useApp } from "@/lib/store";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página no pudo cargarse
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-normal">
          {error?.message || "Algo salió mal por nuestro lado."}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground/60">
          Si estás en Wi-Fi de Claro/Movistar, intenta desactivarlo y usar tus datos móviles.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

const SITE_URL = "https://dizi.idenza.site";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Dizi — Catálogos Digitales para MYPEs Peruanas" },
      {
        name: "description",
        content:
          "Crea tu catálogo digital en 2 minutos y vende por WhatsApp. La plataforma de catálogos web para MYPEs del Perú. Sin descargas, 100% móvil.",
      },
      {
        name: "keywords",
        content:
          "catálogo digital, catálogo online, vender por WhatsApp, MYPE Perú, tienda virtual, catálogo web, digitalizar negocio",
      },
      { name: "author", content: "Dizi" },
      { name: "robots", content: "index, follow" },
      // Open Graph
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { property: "og:title", content: "Dizi — Catálogos Digitales para MYPEs Peruanas" },
      {
        property: "og:description",
        content:
          "Crea tu catálogo digital en 2 minutos y vende por WhatsApp. Sin descargas, 100% móvil.",
      },
      { property: "og:image", content: `${SITE_URL}/images/og-image.png` },
      { property: "og:locale", content: "es_PE" },
      { property: "og:site_name", content: "Dizi" },
      // Twitter Card
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@DiziPeru" },
      { name: "twitter:title", content: "Dizi — Catálogos Digitales para MYPEs Peruanas" },
      {
        name: "twitter:description",
        content: "Crea tu catálogo digital en 2 minutos y vende por WhatsApp.",
      },
      { name: "twitter:image", content: `${SITE_URL}/images/og-image.png` },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/png",
        href: "/images/Icono.png",
      },
      {
        rel: "apple-touch-icon",
        href: "/images/Icono.png",
      },
      {
        rel: "canonical",
        href: SITE_URL,
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const fetchData = useApp((s) => s.fetchData);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Outlet />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
