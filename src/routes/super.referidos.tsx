import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { PLANS, type PlanId, formatDate } from "@/lib/types";
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
  PiggyBank, 
  DollarSign, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/super/referidos")({
  component: ReferidosPage,
});

function PlanBadge({ plan }: { plan: PlanId }) {
  switch (plan) {
    case "semilla":
      return <Badge variant="outline" className="bg-zinc-100 text-zinc-700 border-zinc-200 uppercase text-[9px] font-black">Semilla</Badge>;
    case "emprendedor":
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 uppercase text-[9px] font-black">Emprendedor</Badge>;
    case "pro":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 uppercase text-[9px] font-black">Pro</Badge>;
    case "ilimitado":
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 uppercase text-[9px] font-black">Ilimitado</Badge>;
    default:
      return null;
  }
}

function ReferidosPage() {
  const stores = useApp((s) => s.stores);
  const updateStore = useApp((s) => s.updateStore);
  const fetchData = useApp((s) => s.fetchData);

  const [q, setQ] = useState("");
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [creditInput, setCreditInput] = useState("");
  const [isProcessingReward, setIsProcessingReward] = useState<string | null>(null);

  // 1. Filtrar las tiendas recomendadas/referidas (aquellas que tengan referredBy)
  const referrals = stores.filter((s) => s.referredBy && s.referredBy.trim() !== "");

  // Búsqueda en tabla de referencias
  const filteredReferrals = referrals.filter((ref) => {
    const query = q.toLowerCase();
    const referrerSlug = ref.referredBy?.toLowerCase() || "";
    const referrerName = stores.find(s => s.slug === ref.referredBy)?.name.toLowerCase() || "";
    
    return (
      ref.name.toLowerCase().includes(query) ||
      ref.slug.toLowerCase().includes(query) ||
      referrerSlug.includes(query) ||
      referrerName.includes(query)
    );
  });

  // 2. Filtrar tiendas Semilla que tienen crédito acumulado
  const seedCreditStores = stores.filter((s) => s.plan === "semilla" && s.referralCredit && s.referralCredit > 0);

  // Métricas Clave
  const totalReferidosCount = referrals.length;
  const recompensasEntregadasCount = referrals.filter(s => s.referralRewarded).length;
  const bolsaCreditosTotal = seedCreditStores.reduce((acc, s) => acc + (s.referralCredit || 0), 0);

  // Abrir modal para editar saldo
  const handleOpenCreditModal = (storeId: string, currentCredit: number) => {
    setSelectedStoreId(storeId);
    setCreditInput(currentCredit.toString());
    setIsCreditModalOpen(true);
  };

  // Guardar crédito editado
  const handleSaveCredit = async () => {
    if (!selectedStoreId) return;
    const amount = parseFloat(creditInput);
    if (isNaN(amount) || amount < 0) {
      toast.error("Por favor ingresa un monto válido igual o mayor a cero.");
      return;
    }

    try {
      await updateStore(selectedStoreId, { referralCredit: amount });
      toast.success("Saldo de crédito actualizado con éxito.");
      setIsCreditModalOpen(false);
      setSelectedStoreId(null);
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar el crédito en Supabase.");
    }
  };

  // Procesar/Aprobar Recompensa Manualmente a través de RPC de Supabase
  const handleApproveReward = async (referredStore: typeof stores[0]) => {
    if (!referredStore.referredBy) return;
    
    const planPrice = PLANS[referredStore.plan]?.price || 9.90; // Fallback a precio Emprendedor si es semilla
    
    if (referredStore.plan === "semilla") {
      toast.warning("Para entregar recompensa, el referido debe estar activo en un plan de pago.");
      return;
    }

    setIsProcessingReward(referredStore.id);
    const toastId = toast.loading(`Procesando recompensa para el referente de ${referredStore.name}...`);

    try {
      // Llamada directa al procedimiento almacenado de Supabase
      const { error } = await supabase.rpc("process_referral_reward", {
        p_referred_store_id: referredStore.id,
        p_referred_plan: referredStore.plan,
        p_referred_price: planPrice,
      });

      if (error) throw error;

      // Refrescar estado global
      await fetchData();
      toast.success("¡Recompensa procesada y entregada con éxito!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al procesar recompensa: ${err?.message || "Error desconocido"}`, { id: toastId });
    } finally {
      setIsProcessingReward(null);
    }
  };

  // Limpiar / Canjear Crédito Completo
  const handleClearCredit = async (storeId: string) => {
    if (!window.confirm("¿Estás seguro de restablecer a S/ 0.00 el crédito de esta tienda? Esto asume que el canje ya se realizó de forma física/externa.")) return;
    
    try {
      await updateStore(storeId, { referralCredit: 0 });
      toast.success("Crédito restablecido a cero.");
    } catch (err) {
      console.error(err);
      toast.error("No se pudo restablecer el crédito.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 uppercase">Gestión de Referidos</h1>
        <p className="text-sm text-muted-foreground">Monitorea los loops de adquisición viral, audita relaciones y gestiona la bolsa de créditos.</p>
      </div>

      {/* Métricas KPI */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-zinc-200/60 dark:border-zinc-800/40 shadow-xs bg-gradient-to-br from-white to-zinc-50/50 dark:from-zinc-950 dark:to-zinc-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Referidos Registrados</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">{totalReferidosCount}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Tiendas creadas usando un enlace de afiliado.</p>
          </CardContent>
        </Card>

        <Card className="border border-zinc-200/60 dark:border-zinc-800/40 shadow-xs bg-gradient-to-br from-white to-zinc-50/50 dark:from-zinc-950 dark:to-zinc-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recompensas Entregadas</CardTitle>
            <Gift className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">{recompensasEntregadasCount}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Relaciones premiadas con crédito o días de extensión.</p>
          </CardContent>
        </Card>

        <Card className="border border-zinc-200/60 dark:border-zinc-800/40 shadow-xs bg-gradient-to-br from-white to-zinc-50/50 dark:from-zinc-950 dark:to-zinc-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bolsa de Créditos Semilla</CardTitle>
            <PiggyBank className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">S/ {bolsaCreditosTotal.toFixed(2)}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Crédito acumulado a canjear en upgrades de planes Semilla.</p>
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
                <CardTitle className="text-sm font-bold uppercase tracking-wider">Historial y Auditoría de Relaciones</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Listado completo de tiendas que ingresaron referidas.</p>
              </div>
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
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
                    <TableHead className="text-[10px] uppercase font-bold text-zinc-500">Invitado (Referido)</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-zinc-500">Plan</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-zinc-500">Referente</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-zinc-500">Estado Recompensa</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-zinc-500">Registro</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-zinc-500 text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferrals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                        No se encontraron relaciones de referidos.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReferrals.map((ref) => {
                      const referrerStore = stores.find(s => s.slug === ref.referredBy);
                      return (
                        <TableRow key={ref.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
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
                                <span className="font-medium text-zinc-900 dark:text-zinc-100">{referrerStore.name}</span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  @{referrerStore.slug} • <span className="capitalize">{referrerStore.plan}</span>
                                </span>
                              </div>
                            ) : (
                              <span className="text-red-500 font-medium">@{ref.referredBy} (Borrada/Inactiva)</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {ref.referralRewarded ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Aplicada
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
                                {isProcessingReward === ref.id ? "Procesando..." : "Premiar"}
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

        {/* Tabla B: Bolsa de Créditos (Ocupa 1/3 en desktop) */}
        <Card className="border border-zinc-200/60 dark:border-zinc-800/40 shadow-xs bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Bolsa de Créditos Semilla</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Tiendas gratuitas que acumularon saldo por referir.</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/30">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase font-bold text-zinc-500">Tienda</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-zinc-500">Crédito</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-zinc-500 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seedCreditStores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-12 text-xs text-muted-foreground">
                        No hay saldo de créditos acumulados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    seedCreditStores.map((st) => (
                      <TableRow key={st.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                        <TableCell className="font-semibold text-xs text-zinc-950 dark:text-zinc-50">
                          <div className="flex flex-col">
                            <span>{st.name}</span>
                            <span className="text-[10px] text-muted-foreground">@{st.slug}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                          S/ {(st.referralCredit || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleOpenCreditModal(st.id, st.referralCredit || 0)}
                              className="h-7 w-7 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                              title="Editar saldo"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleClearCredit(st.id)}
                              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Restablecer / Canjear saldo"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal para Editar Crédito */}
      <Dialog open={isCreditModalOpen} onOpenChange={setIsCreditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-wider">Ajustar Saldo de Crédito</DialogTitle>
            <DialogDescription className="text-xs">
              Modifica manualmente el crédito acumulado en soles para este comercio Semilla.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="credit" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Monto en Soles (S/.)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">S/</span>
                <Input
                  id="credit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={creditInput}
                  onChange={(e) => setCreditInput(e.target.value)}
                  className="pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsCreditModalOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSaveCredit}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
