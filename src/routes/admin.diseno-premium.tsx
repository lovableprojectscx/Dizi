import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/diseno-premium")({
  component: () => <Navigate to="/admin/diseno" replace />,
});
