import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { PLANS, type PlanId, daysUntilExpiry, formatDate } from "@/lib/types";
import { InviteGenerator } from "@/components/InviteGenerator";
import { SubscriptionManager } from "@/components/admin/SubscriptionManager";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogIn, Search, Power, ExternalLink, AlertTriangle, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, ClipboardList } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/super/tiendas")({
  component: TenantsPage,
});

const planVariant: Record<PlanId, "secondary" | "default" | "outline"> = {
  semilla: "secondary",
  emprendedor: "outline",
  pro: "default",
  ilimitado: "default",
};

function ExpiryBadge({ store }: { store: ReturnType<typeof useApp.getState>["stores"][0] }) {
  const days = daysUntilExpiry(store);

  if (store.plan === "semilla") {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  if (store.subscriptionStatus === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-destructive">
        <XCircle className="w-3 h-3" /> Cancelada
      </span>
    );
  }
  if (!store.planExpiresAt) {
    return <span className="text-xs text-muted-foreground">Sin fecha</span>;
  }
  if (days !== null && days < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-destructive font-medium">
        <AlertTriangle className="w-3 h-3" /> Vencida
      </span>
    );
  }
  if (days !== null && days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-semibold">
        <AlertTriangle className="w-3 h-3" /> {days}d — {formatDate(store.planExpiresAt)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
      <CheckCircle2 className="w-3 h-3" /> {formatDate(store.planExpiresAt)}
    </span>
  );
}

function TenantsPage() {
  const stores = useApp((s) => s.stores);
  const toggleActive = useApp((s) => s.toggleStoreActive);
  const startImpersonation = useApp((s) => s.startImpersonation);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      s.phone.includes(q) ||
      s.id.includes(q)
  );

  // Ordenar: primero las que vencen pronto o ya vencieron
  const sorted = [...filtered].sort((a, b) => {
    const dA = daysUntilExpiry(a) ?? Infinity;
    const dB = daysUntilExpiry(b) ?? Infinity;
    return dA - dB;
  });

  const impersonate = (id: string) => {
    startImpersonation(id);
    toast.success("Modo soporte activado");
    navigate({ to: "/admin/dashboard" });
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Alertas al tope: tiendas que vencen en <= 7 dias
  const urgentStores = sorted.filter((s) => {
    const d = daysUntilExpiry(s);
    return d !== null && d <= 7 && d >= 0;
  });

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tiendas</h1>
          <p className="text-sm text-muted-foreground">
            {stores.length} tiendas registradas
            {stores.filter(s => s.libroReclamacionesActivo).length > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-blue-600 font-medium">
                · <ClipboardList className="h-3.5 w-3.5" />
                {stores.filter(s => s.libroReclamacionesActivo).length} con libro activo
              </span>
            )}
          </p>
        </div>
        <div className="relative w-72 max-w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, telefono, ID..."
            className="pl-9"
          />
        </div>
      </div>

      {/* ── Alertas de vencimiento proximo ── */}
      {urgentStores.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4" />
            {urgentStores.length} suscripcion{urgentStores.length > 1 ? "es" : ""} vence{urgentStores.length > 1 ? "n" : ""} en los proximos 7 dias
          </div>
          <div className="flex flex-wrap gap-2">
            {urgentStores.map((s) => (
              <span key={s.id} className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-1 font-medium">
                {s.name} — {daysUntilExpiry(s) === 0 ? "hoy" : `${daysUntilExpiry(s)}d`}
              </span>
            ))}
          </div>
        </div>
      )}

      <InviteGenerator />

      {/* ── Desktop View ── */}
      <div className="hidden md:block border rounded-xl bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tienda</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Creada</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((s) => (
              <>
                <TableRow key={s.id} className={expandedId === s.id ? "bg-muted/30" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {s.logo && (
                        <img src={s.logo} alt="" className="h-7 w-7 rounded-full object-cover" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{s.name}</p>
                          {s.libroReclamacionesActivo && (
                            <span title="Libro de reclamaciones activo" className="inline-flex items-center gap-0.5 text-[10px] bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5 font-semibold">
                              <ClipboardList className="h-3 w-3" /> Libro
                            </span>
                          )}
                        </div>
                        <Link
                          to="/t/$slug"
                          params={{ slug: s.slug }}
                          className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                        >
                          /t/{s.slug} <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={planVariant[s.plan]}>{PLANS[s.plan].name}</Badge>
                  </TableCell>
                  <TableCell>
                    <ExpiryBadge store={s} />
                  </TableCell>
                  <TableCell>
                    {s.active ? (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Activa</Badge>
                    ) : (
                      <Badge variant="destructive">Suspendida</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2"
                        onClick={() => toggleExpand(s.id)}
                        title="Gestionar suscripcion"
                      >
                        {expandedId === s.id
                          ? <ChevronUp className="h-3.5 w-3.5" />
                          : <ChevronDown className="h-3.5 w-3.5" />
                        }
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleActive(s.id)}
                        className="h-8"
                      >
                        <Power className="h-3 w-3 mr-1" />
                        {s.active ? "Suspender" : "Activar"}
                      </Button>
                      <Button size="sm" className="h-8" onClick={() => impersonate(s.id)}>
                        <LogIn className="h-3 w-3 mr-1" />
                        Acceder
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                {/* Fila expandible: SubscriptionManager */}
                {expandedId === s.id && (
                  <TableRow key={s.id + "_sub"} className="bg-muted/20 hover:bg-muted/20">
                    <TableCell colSpan={6} className="py-3 px-4">
                      <SubscriptionManager store={s} />
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  Sin resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Mobile View ── */}
      <div className="md:hidden space-y-3">
        {sorted.map((s) => (
          <div key={s.id} className="bg-card border rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                {s.logo ? (
                  <img src={s.logo} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold">
                    {s.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold leading-tight">{s.name}</p>
                  <Link
                    to="/t/$slug"
                    params={{ slug: s.slug }}
                    className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                  >
                    /t/{s.slug} <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
              {s.active ? (
                <Badge className="bg-emerald-100 text-emerald-800">Activa</Badge>
              ) : (
                <Badge variant="destructive">Suspend</Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm bg-muted/30 p-2 rounded-lg">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Plan</span>
                <Badge variant={planVariant[s.plan]} className="text-[10px] mt-0.5">{PLANS[s.plan].name}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Vencimiento</span>
                <div className="mt-0.5"><ExpiryBadge store={s} /></div>
              </div>
            </div>

            {/* SubscriptionManager siempre visible en mobile */}
            <SubscriptionManager store={s} />

            <div className="flex items-center gap-2 pt-1 border-t">
              <Button
                size="icon"
                variant={s.active ? "outline" : "destructive"}
                className="h-8 w-8 shrink-0"
                onClick={() => toggleActive(s.id)}
              >
                <Power className="h-3 w-3" />
              </Button>
              <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => impersonate(s.id)}>
                <LogIn className="h-3 w-3 mr-1" />
                Acceder como cliente
              </Button>
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8 border rounded-xl bg-card">
            Sin resultados.
          </div>
        )}
      </div>
    </div>
  );
}
