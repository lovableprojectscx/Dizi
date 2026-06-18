import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PLANS, type PlanId, type Invite } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Calendar, 
  Loader2, 
  RefreshCw, 
  Copy, 
  Check, 
  Link2, 
  UserCheck, 
  XCircle, 
  CheckCircle,
  Clock,
  Search,
  SlidersHorizontal,
  FileText,
  Ban,
  Percent
} from "lucide-react";
import { InviteGenerator } from "@/components/InviteGenerator";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/super/promociones")({
  component: SuperPromocionesPage,
});

function getInviteStatus(invite: Invite) {
  const now = new Date();
  const expiresAt = new Date(invite.expiresAt);
  if (invite.used) {
    return { 
      label: "Usado", 
      color: "bg-zinc-100 text-zinc-700 border-zinc-200/60 dark:bg-zinc-800/50 dark:text-zinc-300 dark:border-zinc-700/50", 
      icon: UserCheck 
    };
  }
  if (expiresAt < now) {
    return { 
      label: "Expirado", 
      color: "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30", 
      icon: XCircle 
    };
  }
  return { 
    label: "Activo", 
    color: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30", 
    icon: CheckCircle 
  };
}

function formatDuration(val?: number, unit?: string, fallbackMonths?: number) {
  const value = val ?? fallbackMonths ?? 1;
  const u = unit ?? "months";
  if (u === "days") {
    return `${value} ${value === 1 ? 'Día' : 'Días'}`;
  }
  return `${value} ${value === 1 ? 'Mes' : 'Meses'}`;
}

function SuperPromocionesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>(globalThis.window ? new URLSearchParams(window.location.search).get("search") || "" : "");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchInvites = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invites")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) {
        setInvites(data.map((row: any) => ({
          token: row.token,
          plan: row.plan as PlanId,
          used: row.used,
          createdAt: row.created_at,
          expiresAt: row.expires_at,
          durationMonths: row.duration_months,
          durationValue: row.duration_value,
          durationUnit: row.duration_unit,
          customPrice: row.custom_price !== null && row.custom_price !== undefined ? Number(row.custom_price) : undefined,
          notes: row.notes,
        })));
      }
    } catch (err: any) {
      console.error("[fetchInvites] Error:", err);
      toast.error("Error al cargar enlaces de invitación.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleRevoke = async (token: string) => {
    if (!confirm("¿Estás seguro de que deseas revocar este enlace? Se marcará como usado para que nadie más pueda registrarse con él.")) return;
    try {
      const { error } = await supabase
        .from("invites")
        .update({ used: true })
        .eq("token", token);
      if (error) throw error;
      toast.success("Enlace revocado con éxito.");
      fetchInvites();
    } catch (err: any) {
      toast.error("Error al revocar enlace: " + err.message);
    }
  };

  const copyInviteUrl = async (token: string) => {
    const url = `${window.location.origin}/register?invite=${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
      toast.success("Enlace copiado.");
    } catch {
      toast.error("No se pudo copiar el enlace.");
    }
  };

  const filteredInvites = invites.filter((inv) => {
    if (filterPlan !== "all" && inv.plan !== filterPlan) return false;
    const status = getInviteStatus(inv).label.toLowerCase();
    if (filterStatus !== "all" && status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchNotes = inv.notes?.toLowerCase().includes(query) ?? false;
      const matchToken = inv.token.toLowerCase().includes(query);
      if (!matchNotes && !matchToken) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Percent className="w-8 h-8 text-primary" />
            Enlaces Promocionales y Descuentos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Genera y administra links de invitación con duraciones y precios especiales para tus clientes.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchInvites}
          disabled={loading}
          className="flex items-center gap-2 border-zinc-200 dark:border-zinc-800"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Sincronizar
        </Button>
      </div>

      {/* Sección 1: Generador de Enlaces */}
      <Card className="border-zinc-200/80 dark:border-zinc-800/80 shadow-md">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Generar Nuevo Enlace
          </CardTitle>
          <CardDescription>
            Configura el plan, la duración exacta del contrato y opcionalmente un precio especial.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <InviteGenerator onGenerate={fetchInvites} />
        </CardContent>
      </Card>

      {/* Sección 2: Tabla de Enlaces Generados */}
      <Card className="border-zinc-200/80 dark:border-zinc-800/80 shadow-md">
        <CardHeader className="pb-3 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold">Historial de Enlaces</CardTitle>
            <CardDescription>
              Administración y estado de todos los enlaces creados en el sistema.
            </CardDescription>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar nota o token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary font-medium"
              >
                <option value="all">Todos los Planes</option>
                <option value="emprendedor">Emprendedor</option>
                <option value="pro">Pro</option>
                <option value="ilimitado">Ilimitado</option>
                <option value="semilla">Semilla</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary font-medium"
              >
                <option value="all">Todos los Estados</option>
                <option value="activo">Activos</option>
                <option value="usado">Usados</option>
                <option value="expirado">Expirados</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && invites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm">Cargando enlaces de invitación...</p>
            </div>
          ) : filteredInvites.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No se encontraron enlaces generados con los filtros aplicados.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredInvites.map((inv) => {
                const status = getInviteStatus(inv);
                const StatusIcon = status.icon;
                const isSemilla = inv.plan === "semilla";

                return (
                  <div 
                    key={inv.token} 
                    className="p-4 md:p-6 hover:bg-muted/10 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Detalles del Plan & Link */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Plan badge */}
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                          inv.plan === "ilimitado" ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30" :
                          inv.plan === "pro" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30" :
                          inv.plan === "emprendedor" ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30" :
                          "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-300 dark:border-zinc-700/40"
                        }`}>
                          {inv.plan}
                        </span>

                        {/* Duración */}
                        {!isSemilla && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium bg-zinc-50 dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-100 dark:border-zinc-800">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            {formatDuration(inv.durationValue, inv.durationUnit, inv.durationMonths)}
                          </span>
                        )}

                        {/* Precio */}
                        {!isSemilla && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                            inv.customPrice !== undefined 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30" 
                              : "bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800"
                          }`}>
                            {inv.customPrice !== undefined 
                              ? `S/ ${inv.customPrice.toFixed(2)}` 
                              : `Normal (S/ ${(PLANS[inv.plan]?.price ?? 0).toFixed(2)})`
                            }
                          </span>
                        )}

                        {/* Status badge */}
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </div>

                      {/* URL font-mono */}
                      <div className="flex items-center gap-2 max-w-full">
                        <span className="truncate text-xs font-mono text-muted-foreground bg-muted/30 px-2 py-1 rounded border border-zinc-200/50 dark:border-zinc-800/50 flex-1">
                          {`${window.location.origin}/register?invite=${inv.token}`}
                        </span>
                        <button
                          onClick={() => copyInviteUrl(inv.token)}
                          className="p-1 rounded hover:bg-muted border border-zinc-200/50 dark:border-zinc-800/50 transition-colors"
                          title="Copiar URL de registro"
                        >
                          {copiedToken === inv.token 
                            ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                            : <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                          }
                        </button>
                      </div>

                      {/* Notas internas si existen */}
                      {inv.notes && (
                        <p className="text-xs text-muted-foreground flex items-start gap-1 bg-yellow-500/5 dark:bg-yellow-500/10 p-2 rounded border border-yellow-500/10 mt-1 max-w-full">
                          <FileText className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
                          <span className="italic">Nota: {inv.notes}</span>
                        </p>
                      )}
                    </div>

                    {/* Meta Info & Acciones */}
                    <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 text-right border-t pt-3 md:pt-0 md:border-t-0 border-zinc-100 dark:border-zinc-800">
                      <div className="text-left md:text-right">
                        <p className="text-[11px] text-muted-foreground flex items-center md:justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          Creado: {new Date(inv.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Expira: {new Date(inv.expiresAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}
                        </p>
                      </div>

                      {!inv.used && new Date(inv.expiresAt) >= new Date() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevoke(inv.token)}
                          className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 px-2.5 mt-1 border border-transparent hover:border-red-200"
                        >
                          <Ban className="w-3.5 h-3.5 mr-1" />
                          Revocar Link
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
