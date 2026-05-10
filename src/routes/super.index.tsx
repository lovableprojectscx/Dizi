import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/super/")({
  beforeLoad: () => {
    throw redirect({ to: "/super/dashboard" });
  },
});
