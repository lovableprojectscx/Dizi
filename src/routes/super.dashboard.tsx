import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Store as StoreIcon, UserPlus, Package } from "lucide-react";

export const Route = createFileRoute("/super/dashboard")({
  component: SuperDashboard,
});

function SuperDashboard() {
  const stores = useApp((s) => s.stores);
  const active = stores.filter((s) => s.active).length;
  const products = stores.reduce((a, s) => a + s.products.length, 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
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

      <div className="pt-6">
        <h2 className="text-xl font-semibold mb-4">Generar Invitación de Registro</h2>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Plan para la nueva tienda</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  id="invite-plan"
                >
                  <option value="emprendedor">Emprendedor (S/ 14.90)</option>
                  <option value="pro">Pro (S/ 24.90)</option>
                  <option value="ilimitado">Ilimitado (S/ 49.90)</option>
                  <option value="semilla">Semilla (Gratis)</option>
                </select>
              </div>
              <button
                onClick={() => {
                  const select = document.getElementById("invite-plan") as HTMLSelectElement;
                  const plan = select.value as any;
                  const token = Math.random().toString(36).substring(2, 10);
                  useApp.getState().addInvite({
                    token,
                    plan,
                    used: false,
                    createdAt: new Date().toISOString()
                  });
                  const link = `${window.location.origin}/register?invite=${token}`;
                  navigator.clipboard.writeText(link);
                  alert("¡Enlace copiado al portapapeles!\n\n" + link);
                }}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2 whitespace-nowrap"
              >
                Generar y Copiar Enlace
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Envía este enlace al cliente por WhatsApp. Al entrar, se le bloqueará el plan seleccionado y tú mantendrás el control de la venta.
            </p>
          </CardContent>
        </Card>
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
