import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { PLANS, type PlanId, formatDate, daysUntilExpiry } from "@/lib/types";
import { supabase } from "@/lib/supabase";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Gift,
  Users,
  Calendar,
  Edit3,
  CheckCircle2,
  Clock,
  PlusCircle,
  Sparkles,
  Play,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/super/referidos")({
  component: ReferidosPage,
});

function PlanBadge({ plan }: { plan: PlanId }) {
  switch (plan) {
    case "semilla":
      return (
        <Badge
          variant="outline"
          className="bg-zinc-100 text-zinc-700 border-zinc-200 uppercase text-[9px] font-black"
        >
          Semilla
        </Badge>
      );
    case "emprendedor":
      return (
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-200 uppercase text-[9px] font-black"
        >
          Emprendedor
        </Badge>
      );
    case "pro":
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200 uppercase text-[9px] font-black"
        >
          Pro
        </Badge>
      );
    case "ilimitado":
      return (
        <Badge
          variant="outline"
          className="bg-purple-50 text-purple-700 border-purple-200 uppercase text-[9px] font-black"
        >
          Ilimitado
        </Badge>
      );
    default:
      return null;
  }
}

function ReferidosPage() {
  const stores = useApp((s) => s.stores);
  const updateStore = useApp((s) => s.updateStore);
  const fetchData = useApp((s) => s.fetchData);

  const [qReferrals, setQReferrals] = useState("");
  const [qStores, setQStores] = useState("");

  // Estados para modal de extensión directa
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [daysInput, setDaysInput] = useState("30");
  const [isExtending, setIsExtending] = useState(false);
  const [isProcessingReward, setIsProcessingReward] = useState<string | null>(null);

  // 1. Filtrar las tiendas recomendadas/referidas (aquellas que tengan referredBy)
  const referrals = stores.filter((s) => s.referredBy && s.referredBy.trim() !== "");

  // Búsqueda en tabla de referencias
  const filteredReferrals = referrals.filter((ref) => {
    const query = qReferrals.toLowerCase();
    const referrerSlug = ref.referredBy?.toLowerCase() || "";
    const referrerName = stores.find((s) => s.slug === ref.referredBy)?.name.toLowerCase() || "";

    return (
      ref.name.toLowerCase().includes(query) ||
      ref.slug.toLowerCase().includes(query) ||
      referrerSlug.includes(query) ||
      referrerName.includes(query)
    );
  });

  // Búsqueda en la lista general de tiendas para extensión de días
  const filteredStores = stores.filter((s) => {
    const query = qStores.toLowerCase();
    return s.name.toLowerCase().includes(query) || s.slug.toLowerCase().includes(query);
  });

  // Métricas Clave
  const totalReferidosCount = referrals.length;
  const recompensasEntregadasCount = referrals.filter((s) => s.referralRewarded).length;
  // Cada recompensa entrega 30 días al referido y 30 días al referente (total 60 días de premium regalados por par)
  const totalDiasRegalados = recompensasEntregadasCount * 60;

  // Abrir modal para extensión manual
  const handleOpenExtendModal = (storeId: string) => {
    setSelectedStoreId(storeId);
    setDaysInput("30");
    setIsExtendModalOpen(true);
  };

  // Guardar extensión de días manual
  const handleSaveExtension = async () => {
    if (!selectedStoreId) return;
    const daysToAdd = parseInt(daysInput);
    if (isNaN(daysToAdd) || daysToAdd <= 0) {
      toast.error("Por favor ingresa un número de días válido mayor a cero.");
      return;
    }

    const storeToExtend = stores.find((s) => s.id === selectedStoreId);
    if (!storeToExtend) return;

    if (storeToExtend.plan === "semilla") {
      toast.error(
        "No se puede extender una tienda en el plan Semilla (Gratis) ya que no tiene fecha de expiración.",
      );
      return;
    }

    setIsExtending(true);
    const toastId = toast.loading(`Extendiendo plan de ${storeToExtend.name}...`);

    try {
      // Calcular nueva fecha
      const currentExpiry = storeToExtend.planExpiresAt
        ? new Date(storeToExtend.planExpiresAt)
        : new Date();

      // Si ya expiró, extender desde HOY
      const baseDate = currentExpiry.getTime() < Date.now() ? new Date() : currentExpiry;
      baseDate.setDate(baseDate.getDate() + daysToAdd);

      await updateStore(selectedStoreId, {
        planExpiresAt: baseDate.toISOString(),
        subscriptionStatus: "active",
      });

      toast.success(
        `Suscripción extendida por +${daysToAdd} días. Nueva fecha: ${formatDate(baseDate.toISOString())}`,
        { id: toastId },
      );
      setIsExtendModalOpen(false);
      setSelectedStoreId(null);
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar la fecha en Supabase.", { id: toastId });
    } finally {
      setIsExtending(false);
    }
  };

  // Procesar/Aprobar Recompensa Manualmente a través de RPC de Supabase
  const handleApproveReward = async (referredStore: (typeof stores)[0]) => {
    if (!referredStore.referredBy) return;

    if (referredStore.plan === "semilla") {
      toast.warning(
        "Para procesar la recompensa, el referido debe estar activo en un plan de pago (Emprendedor, Pro o Ilimitado).",
      );
      return;
    }

    setIsProcessingReward(referredStore.id);
    const toastId = toast.loading(
      `Procesando recompensa de 30 días para el referente y referido...`,
    );

    try {
      // Llamada directa al procedimiento almacenado de Supabase que otorga 30 días gratis a cada uno
      const { error } = await supabase.rpc("process_referral_reward", {
        p_referred_store_id: referredStore.id,
        p_referred_plan: referredStore.plan,
        p_referred_price: PLANS[referredStore.plan]?.price || 9.9,
      });

      if (error) throw error;

      // Refrescar estado global
      await fetchData();
      toast.success(
        "¡Recompensa procesada! Se han sumado 30 días de suscripción premium a ambas tiendas.",
        { id: toastId },
      );
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al procesar recompensa: ${err?.message || "Error desconocido"}`, {
        id: toastId,
      });
    } finally {
      setIsProcessingReward(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 uppercase">
          Gestión de Referidos
        </h1>
        <p className="text-sm text-muted-foreground">
          Monitorea los loops de adquisición viral y gestiona el tiempo de suscripción premium
          otorgado.
        </p>
      </div>

      {/* Métricas KPI */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-zinc-200/60 dark:border-zinc-800/40 shadow-xs bg-gradient-to-br from-white to-zinc-50/50 dark:from-zinc-950 dark:to-zinc-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Referidos Registrados
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              {totalReferidosCount}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Tiendas creadas usando un enlace de afiliado.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-zinc-200/60 dark:border-zinc-800/40 shadow-xs bg-gradient-to-br from-white to-zinc-50/50 dark:from-zinc-950 dark:to-zinc-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Recompensas Entregadas
            </CardTitle>
            <Gift className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              {recompensasEntregadasCount}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Relaciones recomendadas que activaron y recibieron +30 días.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-zinc-200/60 dark:border-zinc-800/40 shadow-xs bg-gradient-to-br from-white to-zinc-50/50 dark:from-zinc-950 dark:to-zinc-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Premium Regalado (Días)
            </CardTitle>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-amber-600 dark:text-amber-400">
              +{totalDiasRegalados} días
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Total acumulado de días de servicio premium entregados gratis.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Tablas */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tabla A: Auditoría de Relaciones (Ocupa 2/3 en desktop) */}
        <Card className="lg:col-span-2 border border-zinc-200/60 dark:border-zinc-800/40 shadow-xs bg-card">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-wider">
                  Historial y Auditoría de Relaciones
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Listado completo de tiendas recomendadas y estado de sus 30 días gratis.
                </p>
              </div>
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={qReferrals}
                  onChange={(e) => setQReferrals(e.target.value)}
                  placeholder="Buscar tienda o referente..."
                  className="pl-8 h-8.5 text-xs rounded-lg border-zinc-200 dark:border-zinc-800"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/30">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase font-bold text-zinc-500">
                      Invitado (Referido)
                    </TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-zinc-500">
                      Plan
                    </TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-zinc-500">
                      Referente
                    </TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-zinc-500">
                      Recompensa
                    </TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-zinc-500">
                      Registro
                    </TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-zinc-500 text-right">
                      Acción
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferrals.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-12 text-xs text-muted-foreground"
                      >
                        No se encontraron relaciones de referidos.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReferrals.map((ref) => {
                      const referrerStore = stores.find((s) => s.slug === ref.referredBy);
                      return (
                        <TableRow
                          key={ref.id}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20"
                        >
                          <TableCell className="font-semibold text-xs text-zinc-950 dark:text-zinc-50">
                            <div className="flex flex-col">
                              <span>{ref.name}</span>
                              <span className="text-[10px] text-muted-foreground">@{ref.slug}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <PlanBadge plan={ref.plan} />
                          </TableCell>
                          <TableCell className="text-xs">
                            {referrerStore ? (
                              <div className="flex flex-col">
                                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                  {referrerStore.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  @{referrerStore.slug} •{" "}
                                  <span className="capitalize">{referrerStore.plan}</span>
                                </span>
                              </div>
                            ) : (
                              <span className="text-red-500 font-medium">
                                @{ref.referredBy} (Borrada/Inactiva)
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {ref.referralRewarded ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> +30d a c/u
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                                <Clock className="w-3 h-3 text-amber-500" /> Pendiente
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground">
                            {formatDate(ref.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            {!ref.referralRewarded ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={ref.plan === "semilla" || isProcessingReward === ref.id}
                                onClick={() => handleApproveReward(ref)}
                                className="h-7 text-[10px] font-bold border-emerald-200/50 hover:bg-emerald-500 hover:text-white dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 gap-1 rounded-md"
                              >
                                {isProcessingReward === ref.id ? "Procesando..." : "Entregar 30d"}
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Tabla B: Gestión Directa de Tiempos de Suscripción (1/3 en desktop) */}
        <Card className="border border-zinc-200/60 dark:border-zinc-800/40 shadow-xs bg-card">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">
                Gestión Directa de Expiraciones
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Extiende o ajusta la vigencia premium de cualquier tienda.
              </p>
              <div className="relative w-full mt-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={qStores}
                  onChange={(e) => setQStores(e.target.value)}
                  placeholder="Buscar tienda..."
                  className="pl-8 h-8 text-xs rounded-lg border-zinc-200 dark:border-zinc-800"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/30 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase font-bold text-zinc-500">
                      Tienda
                    </TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-zinc-500">
                      Vencimiento
                    </TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-zinc-500 text-right">
                      Extender
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStores.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-12 text-xs text-muted-foreground"
                      >
                        No hay tiendas registradas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStores.map((st) => {
                      const days = daysUntilExpiry(st);
                      const isExpired = st.plan !== "semilla" && days !== null && days < 0;

                      return (
                        <TableRow
                          key={st.id}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20"
                        >
                          <TableCell className="font-semibold text-xs text-zinc-950 dark:text-zinc-50">
                            <div className="flex flex-col">
                              <span>{st.name}</span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                @{st.slug} • <PlanBadge plan={st.plan} />
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {st.plan === "semilla" ? (
                              <span className="text-zinc-400">—</span>
                            ) : st.planExpiresAt ? (
                              <div className="flex flex-col">
                                <span
                                  className={
                                    isExpired
                                      ? "text-red-500 font-bold"
                                      : "text-zinc-700 dark:text-zinc-300 font-medium"
                                  }
                                >
                                  {formatDate(st.planExpiresAt)}
                                </span>
                                <span className="text-[9px] text-muted-foreground mt-0.5">
                                  {isExpired ? "Expirado" : `Quedan ${days} días`}
                                </span>
                              </div>
                            ) : (
                              <span className="text-zinc-400">Sin vigencia</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {st.plan !== "semilla" ? (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleOpenExtendModal(st.id)}
                                className="h-7 w-7 text-primary hover:bg-primary/10"
                                title="Añadir días"
                              >
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground select-none">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal para Extender Suscripción */}
      <Dialog open={isExtendModalOpen} onOpenChange={setIsExtendModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              Extender Vigencia Premium
            </DialogTitle>
            <DialogDescription className="text-xs">
              Añade días de suscripción premium al comercio seleccionado. Si el plan ya venció, los
              días se contarán a partir de la fecha de hoy.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="days"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Días a Agregar
              </label>
              <Input
                id="days"
                type="number"
                min="1"
                value={daysInput}
                onChange={(e) => setDaysInput(e.target.value)}
                className="text-sm"
                placeholder="Cantidad de días (ej. 30)"
              />
            </div>
            {/* Botones rápidos */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDaysInput("15")}
                className="flex-1 text-[11px] h-8"
              >
                +15 Días
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDaysInput("30")}
                className="flex-1 text-[11px] h-8"
              >
                +30 Días (1 Mes)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDaysInput("90")}
                className="flex-1 text-[11px] h-8"
              >
                +90 Días (3 Meses)
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsExtendModalOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" disabled={isExtending} onClick={handleSaveExtension}>
              {isExtending ? "Guardando..." : "Confirmar Extensión"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
