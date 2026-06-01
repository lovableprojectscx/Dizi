import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Store as StoreIcon, UserPlus, Package } from "lucide-react";
import { InviteGenerator } from "@/components/InviteGenerator";

export const Route = createFileRoute("/super/dashboard")({
  component: SuperDashboard,
});

function SuperDashboard() {
  const stores = useApp((s) => s.stores);
  const active = stores.filter((s) => s.active).length;
  const products = stores.reduce((a, s) => a + s.products.length, 0);
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const newSignups = stores.filter((s) => s.createdAt.startsWith(thisMonth)).length;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Métricas globales de la plataforma.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Metric icon={<StoreIcon className="h-5 w-5" />} label="Tiendas activas" value={active} />
        <Metric icon={<UserPlus className="h-5 w-5" />} label="Nuevos registros (mes)" value={newSignups} />
        <Metric icon={<Package className="h-5 w-5" />} label="Productos totales" value={products} />
      </div>

      <div className="pt-2">
        <h2 className="text-xl font-semibold mb-4">Generar Invitación de Registro</h2>
        <InviteGenerator />
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          {icon}
          {label}
        </div>
        <div className="mt-2 text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
