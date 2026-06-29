import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { PLANS, type PlanId, daysUntilExpiry, daysSinceExpiry, formatDate } from "@/lib/types";
import { SubscriptionManager } from "@/components/admin/SubscriptionManager";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  LogIn, 
  Search, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  ClipboardList,
  SlidersHorizontal,
  Store as StoreIcon,
  ShieldCheck
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/super/tiendas")({
  component: TenantsPage,
});

// Badges de planes con estética moderna y colores soft
function PlanBadge({ plan }: { plan: PlanId }) {
  switch (plan) {
    case "semilla":
      return (
        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border bg-zinc-100 text-zinc-700 border-zinc-200/60 dark:bg-zinc-800/40 dark:text-zinc-300 dark:border-zinc-700/40">
          Semilla
        </span>
      );
    case "emprendedor":
      return (
        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">
          Emprendedor
        </span>
      );
    case "pro":
      return (
        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30">
          Pro
        </span>
      );
    case "ilimitado":
      return (
        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30">
          Ilimitado
        </span>
      );
    default:
      return null;
  }
}

function ExpiryBadge({ store }: { store: ReturnType<typeof useApp.getState>["stores"][0] }) {
  const days = daysUntilExpiry(store);

  if (store.plan === "semilla") {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  if (store.subscriptionStatus === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium">
        <XCircle className="w-3.5 h-3.5" /> Cancelada
      </span>
    );
  }
  if (!store.planExpiresAt) {
    return <span className="text-xs text-muted-foreground">Sin fecha</span>;
  }
  if (days !== null && days < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-bold">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Vencida
      </span>
    );
  }
  if (days !== null && days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500" /> {days}d — {formatDate(store.planExpiresAt)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {formatDate(store.planExpiresAt)}
    </span>
  );
}

function isStoreInactiveCandidate(store: any): boolean {
  if (!store.active) return false;
  
  const isSemilla = store.plan === "semilla";
  const daysExpired = daysSinceExpiry(store);
  const isExpiredLongTime = daysExpired !== null && daysExpired > 15;
  
  if (!isSemilla && !isExpiredLongTime) return false;

  const createdDaysAgo = Math.ceil((Date.now() - new Date(store.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  if (createdDaysAgo <= 15) return false;

  const views = store.views || 0;
  const clicks = store.whatsappClicks || 0;
  if (views >= 10 || clicks > 0) return false;

  return true;
}

function TenantsPage() {
  const stores = useApp((s) => s.stores);
  const startImpersonation = useApp((s) => s.startImpersonation);
  const navigate = useNavigate();
  
  const [q, setQ] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const selectedStore = stores.find((s) => s.id === selectedStoreId);

  // Advanced filter states
  const [selectedPlan, setSelectedPlan] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedNiche, setSelectedNiche] = useState<string>("all");
  const [selectedLibro, setSelectedLibro] = useState<string>("all");

  const filtered = stores.filter((s) => {
    // Search Query
    const matchesSearch =
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      s.phone.includes(q) ||
      s.id.includes(q) ||
      s.slug.toLowerCase().includes(q.toLowerCase());

    // Plan filter
    const matchesPlan = selectedPlan === "all" || s.plan === selectedPlan;

    // Status filter
    let matchesStatus = true;
    if (selectedStatus !== "all") {
      const days = daysUntilExpiry(s);
      const isExpired = s.plan !== "semilla" && days !== null && days < 0;
      
      if (selectedStatus === "active") {
        matchesStatus = s.active && !isExpired;
      } else if (selectedStatus === "suspended") {
        matchesStatus = !s.active;
      } else if (selectedStatus === "expired") {
        matchesStatus = s.active && isExpired;
      } else if (selectedStatus === "inactive_candidate") {
        matchesStatus = isStoreInactiveCandidate(s);
      }
    }

    // Niche filter
    const matchesNiche = selectedNiche === "all" || (s.niche || "general") === selectedNiche;

    // Claim Book filter
    let matchesLibro = true;
    if (selectedLibro !== "all") {
      matchesLibro = selectedLibro === "con_libro" ? !!s.libroReclamacionesActivo : !s.libroReclamacionesActivo;
    }

    return matchesSearch && matchesPlan && matchesStatus && matchesNiche && matchesLibro;
  });

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

  const openManagePanel = (id: string) => {
    setSelectedStoreId(id);
    setIsPanelOpen(true);
  };

  // Alertas al tope: tiendas que vencen en <= 7 dias
  const urgentStores = sorted.filter((s) => {
    const d = daysUntilExpiry(s);
    return d !== null && d <= 7 && d >= 0;
  });

  const inactiveStores = stores.filter(isStoreInactiveCandidate);

  const storesActiveCount = stores.filter(s => s.active).length;
  const storesSuspendedCount = stores.filter(s => !s.active).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
      
      {/* ── Encabezado & Stats ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <StoreIcon className="w-8 h-8 text-primary" />
            Tiendas Registradas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administra los accesos de soporte técnico, facturación y estados de todos los comercios de Dizi.
          </p>
        </div>
      </div>

      {/* Grid de Stats Rápido */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-background rounded-xl p-4 border border-zinc-200/60 dark:border-zinc-800 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Tiendas</span>
          <span className="text-2xl font-black text-foreground">{stores.length}</span>
        </div>
        <div className="bg-background rounded-xl p-4 border border-zinc-200/60 dark:border-zinc-800 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-emerald-600 block">Activas</span>
          <span className="text-2xl font-black text-emerald-700">{storesActiveCount}</span>
        </div>
        <div className="bg-background rounded-xl p-4 border border-zinc-200/60 dark:border-zinc-800 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-red-600 block">Suspendidas</span>
          <span className="text-2xl font-black text-red-700">{storesSuspendedCount}</span>
        </div>
        <div className="bg-background rounded-xl p-4 border border-zinc-200/60 dark:border-zinc-800 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-blue-600 block">Libro Recl.</span>
          <span className="text-2xl font-black text-blue-700">{stores.filter(s => s.libroReclamacionesActivo).length}</span>
        </div>
      </div>

      {/* ── Barra de Búsqueda y Botón Filtros ── */}
      <div className="bg-background border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar tienda por nombre, slug, ID o teléfono..."
              className="pl-9 h-10 text-sm border-zinc-200 dark:border-zinc-800"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-[140px]">
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger className="h-10 text-xs font-semibold bg-background border-zinc-200 dark:border-zinc-800">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los planes</SelectItem>
                  <SelectItem value="semilla">Semilla (Gratis)</SelectItem>
                  <SelectItem value="emprendedor">Emprendedor</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="ilimitado">Ilimitado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-[150px]">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-10 text-xs font-semibold bg-background border-zinc-200 dark:border-zinc-800">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activa</SelectItem>
                  <SelectItem value="suspended">Suspendida</SelectItem>
                  <SelectItem value="expired">Vencida</SelectItem>
                  <SelectItem value="inactive_candidate">Inactiva (15d+)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`h-10 text-xs font-semibold gap-1.5 px-4 border-zinc-200 dark:border-zinc-800 transition-colors ${showFilters ? "bg-primary/5 text-primary border-primary/30" : "bg-background"}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {showFilters ? "Menos Filtros" : "Más Filtros"}
            </Button>
          </div>
        </div>

        {/* Panel Desplegable de Filtros Secundarios */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Giro o Nicho</label>
              <Select value={selectedNiche} onValueChange={setSelectedNiche}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Nichos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los giros</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="comida">Comida / Gastronomía</SelectItem>
                  <SelectItem value="bisuteria">Bisutería & Acc.</SelectItem>
                  <SelectItem value="ropa">Moda & Ropa</SelectItem>
                  <SelectItem value="tech">Tecnología</SelectItem>
                  <SelectItem value="servicios">Servicios</SelectItem>
                  <SelectItem value="floreria">Florería</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Libro de Reclamaciones</label>
              <Select value={selectedLibro} onValueChange={setSelectedLibro}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Libro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="con_libro">Con Libro Activo</SelectItem>
                  <SelectItem value="sin_libro">Sin Libro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {(selectedPlan !== "all" || selectedStatus !== "all" || selectedNiche !== "all" || selectedLibro !== "all") && (
          <div className="flex justify-end pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedPlan("all");
                setSelectedStatus("all");
                setSelectedNiche("all");
                setSelectedLibro("all");
              }}
              className="h-8 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              Restaurar Filtros
            </Button>
          </div>
        )}
      </div>

      {/* ── Alertas de Vencimientos ── */}
      {urgentStores.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-500/5 p-4 space-y-2.5 shadow-sm">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            {urgentStores.length} suscripción{urgentStores.length > 1 ? "es" : ""} vence{urgentStores.length > 1 ? "n" : ""} pronto (próximos 7 días)
          </div>
          <div className="flex flex-wrap gap-2">
            {urgentStores.map((s) => (
              <span 
                key={s.id} 
                className="text-xs bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 rounded-full border border-amber-200/50 px-2.5 py-1 font-semibold"
              >
                {s.name} — {daysUntilExpiry(s) === 0 ? "hoy" : `${daysUntilExpiry(s)}d`}
              </span>
            ))}
          </div>
        </div>
      )}
      {/* ── Alertas de Inactividad ── */}
      {inactiveStores.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-500/5 p-4 space-y-2.5 shadow-sm">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            {inactiveStores.length} tienda{inactiveStores.length > 1 ? "s" : ""} registra{inactiveStores.length > 1 ? "n" : ""} inactividad de 15+ días (candidatas a suspender/liberar URL)
          </div>
          <div className="flex flex-wrap gap-2">
            {inactiveStores.map((s) => (
              <span 
                key={s.id} 
                className="text-xs bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 rounded-full border border-amber-200/50 px-2.5 py-1 font-semibold"
              >
                {s.name} ({s.views || 0} vis.)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Desktop View Table ── */}
      <div className="hidden md:block border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl bg-card overflow-hidden shadow-md">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-950/40">
            <TableRow>
              <TableHead className="py-4 font-bold text-foreground">Comercio / Enlace</TableHead>
              <TableHead className="font-bold text-foreground">Plan contratado</TableHead>
              <TableHead className="font-bold text-foreground">Vencimiento</TableHead>
              <TableHead className="font-bold text-foreground">Estado</TableHead>
              <TableHead className="font-bold text-foreground">Fecha Registro</TableHead>
              <TableHead className="text-right pr-6 font-bold text-foreground">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y">
            {sorted.map((s) => (
              <React.Fragment key={s.id}>
                {/* Store Main Row */}
                <TableRow className="hover:bg-muted/5 transition-colors">
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-3">
                      {s.logo ? (
                        <img src={s.logo} alt="" className="h-9 w-9 rounded-full object-cover border" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary/10 to-primary/20 text-primary flex items-center justify-center text-xs font-black border">
                          {s.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-sm text-foreground">{s.name}</p>
                          {s.libroReclamacionesActivo && (
                            <span title="Libro de reclamaciones activo" className="inline-flex items-center gap-0.5 text-[9px] bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-1.5 py-0.2 font-bold uppercase tracking-wider dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30">
                              <ClipboardList className="h-2.5 w-2.5" /> Libro
                            </span>
                          )}
                          {isStoreInactiveCandidate(s) && (
                            <span title="Tienda inactiva sin visitas por más de 15 días" className="inline-flex items-center gap-1 text-[9px] bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-1.5 py-0.5 font-bold uppercase tracking-wider dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30">
                              <AlertTriangle className="h-2.5 w-2.5 text-amber-500" /> Inactiva (15d+)
                            </span>
                          )}
                        </div>
                        <Link
                          to="/t/$slug"
                          params={{ slug: s.slug }}
                          target="_blank"
                          className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-0.5 mt-0.5 font-mono"
                        >
                          /t/{s.slug} <ExternalLink className="h-3 w-3 opacity-60" />
                        </Link>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <PlanBadge plan={s.plan} />
                  </TableCell>

                  <TableCell>
                    <ExpiryBadge store={s} />
                  </TableCell>

                  <TableCell>
                    {s.active ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
                        <span className="h-2 w-2 rounded-full bg-zinc-400" />
                        Suspendida
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground font-medium">
                    {new Date(s.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                  </TableCell>

                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1 border-zinc-200 dark:border-zinc-800 bg-background hover:bg-zinc-50 font-bold"
                        onClick={() => openManagePanel(s.id)}
                      >
                        Gestionar
                      </Button>
                      
                      <Button 
                        size="sm" 
                        className="h-8 text-xs font-bold gap-1 shadow-sm"
                        onClick={() => impersonate(s.id)}
                      >
                        <LogIn className="h-3.5 w-3.5" />
                        Acceder
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
            
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-12">
                  No se encontraron tiendas con los criterios de búsqueda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Mobile View Card List ── */}
      <div className="md:hidden space-y-4">
        {sorted.map((s) => (
          <div key={s.id} className="bg-card border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                {s.logo ? (
                  <img src={s.logo} alt="" className="h-10 w-10 rounded-full object-cover border" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary/10 to-primary/20 text-primary flex items-center justify-center font-bold border">
                    {s.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-bold text-sm text-foreground leading-tight">{s.name}</p>
                    {isStoreInactiveCandidate(s) && (
                      <span title="Tienda inactiva" className="inline-flex items-center gap-0.5 text-[8px] bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-1.5 py-0.2 font-bold uppercase tracking-wider dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30">
                        Inactiva (15d+)
                      </span>
                    )}
                  </div>
                  <Link
                    to="/t/$slug"
                    params={{ slug: s.slug }}
                    target="_blank"
                    className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-0.5 mt-0.5"
                  >
                    /t/{s.slug} <ExternalLink className="h-3 w-3 opacity-60" />
                  </Link>
                </div>
              </div>
              {s.active ? (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-500/5 px-2.5 py-0.5 rounded-full border border-emerald-500/10">
                  Activa
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 font-semibold bg-zinc-500/5 px-2.5 py-0.5 rounded-full border border-zinc-500/10">
                  Susp.
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-lg border border-zinc-100 dark:border-zinc-900">
              <div>
                <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider">Plan</span>
                <div className="mt-1"><PlanBadge plan={s.plan} /></div>
              </div>
              <div>
                <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider">Vencimiento</span>
                <div className="mt-1"><ExpiryBadge store={s} /></div>
              </div>
            </div>

            {/* Panel de Gestión del Comercio */}
            <div className="border-t pt-3 flex flex-col gap-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full h-9 font-bold gap-1.5 border-zinc-200 dark:border-zinc-800 bg-background text-foreground"
                onClick={() => openManagePanel(s.id)}
              >
                Gestionar Tienda
              </Button>

              <Button 
                size="sm" 
                className="w-full h-9 font-bold gap-1.5 shadow-sm"
                onClick={() => impersonate(s.id)}
              >
                <LogIn className="h-4 w-4" />
                Acceder al catálogo cliente
              </Button>
            </div>
          </div>
        ))}
        
        {sorted.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-12 border rounded-xl bg-card">
            No se encontraron tiendas con los criterios de búsqueda.
          </div>
        )}
      </div>

      {/* ── Slide-over Panel de Gestión (Sheet) ── */}
      <Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-6 bg-zinc-50 dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <StoreIcon className="w-5 h-5 text-primary" />
              Gestión de Comercio
            </SheetTitle>
            <SheetDescription>
              Configuración de plan, accesos y soporte para la tienda.
            </SheetDescription>
          </SheetHeader>
          {selectedStore && (
            <div className="mt-4">
              <SubscriptionManager store={selectedStore} />
            </div>
          )}
        </SheetContent>
      </Sheet>

    </div>
  );
}
