import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/categorias")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/productos" });
  },
  component: () => null,
});
