import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Calendar, 
  RefreshCw, 
  XCircle, 
  PlusCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Power, 
  Info,
  DollarSign,
  Trash2,
  MessageCircle
} from "lucide-react";
import type { Store, PlanId, SubscriptionStatus } from "@/lib/types";
import { PLANS, PLAN_DURATION_OPTIONS, daysUntilExpiry, formatDate } from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusLabel(status: SubscriptionStatus | undefined): string {
  switch (status) {
    case "active":    return "Activa";
    case "expired":   return "Vencida";
    case "cancelled": return "Cancelada";
    case "trial":     return "Prueba / Trial";
    default:          return "Sin estado";
  }
}

function StatusBadge({ store }: { store: Store }) {
  const days = daysUntilExpiry(store);
  const isExpired = store.plan !== "semilla" && days !== null && days < 0;

  if (store.subscriptionStatus === "cancelled") {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] font-bold">
        Cancelada
      </Badge>
    );
  }
  if (isExpired) {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] font-bold">
        Vencida
      </Badge>
    );
  }
  if (store.subscriptionStatus === "trial") {
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">
        Prueba
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
      Activa
    </Badge>
  );
}

interface SubscriptionManagerProps {
  store: Store;
}

export function SubscriptionManager({ store }: SubscriptionManagerProps) {
  const setPlan = useApp((s) => s.setPlan);
  const cancelSubscription = useApp((s) => s.cancelSubscription);
  const extendSubscription = useApp((s) => s.extendSubscription);
  const setTrialPlan = useApp((s) => s.setTrialPlan);
  const toggleActive = useApp((s) => s.toggleStoreActive);
  const deleteStore = useApp((s) => s.deleteStore);
  const updateStore = useApp((s) => s.updateStore);

  // Modal renovar/cambiar plan
  const [renewOpen, setRenewOpen] = useState(false);
  const [renewPlan, setRenewPlan] = useState<PlanId>(store.plan);
  const [renewDuration, setRenewDuration] = useState(1);
  const [renewLoading, setRenewLoading] = useState(false);

  // Custom price states
  const [customPriceEnabled, setCustomPriceEnabled] = useState(false);
  const [customPriceVal, setCustomPriceVal] = useState("");

  // Initialize custom price state when opening dialog or changing selected plan
  useEffect(() => {
    if (renewOpen) {
      const isCustomPriceStored = store.customPrice !== undefined && store.customPrice !== null;
      setCustomPriceEnabled(isCustomPriceStored);
      setCustomPriceVal(store.customPrice?.toString() ?? PLANS[renewPlan].price.toString());
    }
  }, [renewOpen, renewPlan, store.customPrice]);

  // Modal extender
  const [extendOpen, setExtendOpen] = useState(false);
  const [extendMonths, setExtendMonths] = useState(1);
  const [extendLoading, setExtendLoading] = useState(false);

  // Alert cancelar
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  // Quick Trial States
  const [trialLoading, setTrialLoading] = useState(false);
  const [selectedTrialPlan, setSelectedTrialPlan] = useState<PlanId | null>(null);

  // Modal eliminar tienda
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Modal pausar y liberar URL
  const [pauseOpen, setPauseOpen] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);

  const handleQuickTrial = async (plan: PlanId) => {
    setTrialLoading(true);
    setSelectedTrialPlan(plan);
    try {
      await setTrialPlan(store.id, plan, 15);
    } finally {
      setTrialLoading(false);
      setSelectedTrialPlan(null);
    }
  };

  const days = daysUntilExpiry(store);
  const isPaid = store.plan !== "semilla";

  const handleRenew = async () => {
    setRenewLoading(true);
    try {
      await setPlan(
        store.id,
        renewPlan,
        renewDuration,
        customPriceEnabled && customPriceVal !== "" ? Number(customPriceVal) : undefined
      );
      setRenewOpen(false);
    } finally {
      setRenewLoading(false);
    }
  };

  const handleExtend = async () => {
    setExtendLoading(true);
    try {
      await extendSubscription(store.id, extendMonths);
      setExtendOpen(false);
    } finally {
      setExtendLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      await cancelSubscription(store.id, cancelReason || undefined);
      setCancelOpen(false);
      setCancelReason("");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleDeleteStore = async () => {
    if (!deletePassword.trim()) {
      toast.error("Por favor, ingresa tu contraseña de Superadmin.");
      return;
    }
    setDeleteLoading(true);
    try {
      // 1. Obtener email del usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) {
        throw new Error("No se pudo identificar la sesión del Superadmin.");
      }

      // 2. Re-autenticar con la contraseña provista
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: deletePassword,
      });

      if (authError) {
        throw new Error("Contraseña incorrecta. Confirmación de seguridad fallida.");
      }

      // 3. Eliminar la tienda de la base de datos
      await deleteStore(store.id);
      
      toast.success(`La tienda ${store.name} ha sido eliminada del sistema.`);
      setDeleteOpen(false);
      setDeletePassword("");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar la tienda.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePauseAndReleaseURL = async () => {
    setPauseLoading(true);
    try {
      // Remover cualquier sufijo '-inactivo-[a-z0-9]+' previo
      let baseSlug = store.slug;
      baseSlug = baseSlug.replace(/(-inactivo-[a-z0-9]+)+$/i, "");
      baseSlug = baseSlug.replace(/-inactivo$/i, "");

      const suffix = Math.random().toString(36).slice(2, 6);
      const newSlug = `${baseSlug}-inactivo-${suffix}`;
      
      await updateStore(store.id, {
        active: false,
        slug: newSlug
      });

      toast.success("Tienda pausada y URL liberada con éxito.");
      setPauseOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Error al liberar la URL.");
    } finally {
      setPauseLoading(false);
    }
  };

  const handleSendWhatsAppAlert = () => {
    const phone = store.phone.replace(/\D/g, "");
    if (!phone) {
      toast.error("Esta tienda no tiene un teléfono registrado.");
      return;
    }
    const country = store.countryCode || "51";
    const fullPhone = phone.startsWith(country) ? phone : `${country}${phone}`;
    
    const text = `Hola *${store.name}*, te saludamos de *Dizi*. 👋\n\nNotamos que tu catálogo digital no registra visitas ni actividad reciente y se encuentra en nuestro *plan Semilla* gratuito.\n\nPara garantizar el uso eficiente del sistema y liberar enlaces que no se usan, nuestro sistema suspenderá la tienda y liberará el enlace */t/${store.slug}* para que otros comercios puedan utilizarlo en los próximos días.\n\nSi deseas mantener activo tu catálogo y conservar tu enlace, por favor responde a este mensaje o actualiza tu plan ingresando a tu panel de administración. ¡Estamos para ayudarte! 🚀`;
    
    const url = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <>
      <div className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl p-5 shadow-inner">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          
          {/* Columna 1: Información de Suscripción Actual (md:span-5) */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-4 border-b md:border-b-0 md:border-r border-zinc-200/60 dark:border-zinc-800/60 pb-5 md:pb-0 md:pr-6">
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                Suscripción y Estado
              </span>

              {/* Plan y Estado */}
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-black tracking-tight text-foreground">
                  Plan {PLANS[store.plan].name}
                </h4>
                <StatusBadge store={store} />
              </div>

              {/* Detalle de expiración */}
              <div className="space-y-1">
                {isPaid && store.planExpiresAt ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    {days !== null && days >= 0 ? (
                      <span>Vence el <strong>{formatDate(store.planExpiresAt)}</strong> ({days === 0 ? "hoy" : `en ${days} día${days !== 1 ? "s" : ""}`})</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">Venció el <strong>{formatDate(store.planExpiresAt)}</strong></span>
                    )}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Sin límite de expiración (Gratuito)</span>
                  </p>
                )}

                {store.customPrice !== undefined && store.customPrice !== null && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-bold">
                    <DollarSign className="w-3.5 h-3.5 shrink-0" />
                    Precio especial: S/ {store.customPrice.toFixed(2)} / mes
                  </p>
                )}

                {store.referredBy && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1.5 font-bold">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    Recomendado por: {store.referredBy}
                  </p>
                )}

                {store.cancelledAt && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5 bg-red-500/5 p-2 rounded border border-red-500/10">
                    <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      Cancelada el {formatDate(store.cancelledAt)}
                      {store.cancelReason && <span className="block text-[10px] font-normal italic mt-0.5">Motivo: {store.cancelReason}</span>}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Switch de Suspensión de la tienda */}
            <div className="pt-2">
              <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200/80 bg-background dark:border-zinc-800 shadow-sm">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold block">Acceso de Tienda</span>
                  <span className="text-[10px] text-muted-foreground">
                    {store.active ? "Tienda operativa en la web" : "Acceso bloqueado temporalmente"}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant={store.active ? "outline" : "destructive"}
                  className="h-8 text-xs gap-1.5 font-bold"
                  onClick={() => {
                    const confirmMsg = store.active 
                      ? "¿Estás seguro de suspender esta tienda? El catálogo público mostrará un error y el cliente no podrá acceder al administrador."
                      : "¿Deseas reactivar esta tienda?";
                    if (confirm(confirmMsg)) {
                      toggleActive(store.id);
                    }
                  }}
                >
                  <Power className="w-3.5 h-3.5" />
                  {store.active ? "Suspender" : "Activar"}
                </Button>
              </div>
            </div>
          </div>

          {/* Columna 2: Acciones Administrativas (md:span-7) */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4 md:pl-2">
            {/* Gestión del Contrato */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                Operaciones Administrativas
              </span>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="default"
                  className="h-9 text-xs gap-1.5 font-bold"
                  onClick={() => { 
                    setRenewPlan(store.plan); 
                    setRenewDuration(store.planDurationMonths ?? 1); 
                    setRenewOpen(true); 
                  }}
                >
                  <RefreshCw className="w-3.5 h-3.5" /> 
                  Renovar o Cambiar Plan
                </Button>

                {isPaid && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 text-xs gap-1.5 border-zinc-200 dark:border-zinc-800 bg-background"
                    onClick={() => setExtendOpen(true)}
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-primary" /> 
                    Extender Contrato
                  </Button>
                )}

                {store.subscriptionStatus !== "cancelled" && isPaid && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 text-xs gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={() => setCancelOpen(true)}
                  >
                    <XCircle className="w-3.5 h-3.5" /> 
                    Cancelar Suscripción
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 text-xs gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-200"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar Tienda
                </Button>
              </div>
            </div>

            {/* Sandbox / Accesos Rápidos de Prueba */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Accesos de Soporte Rápido (Sandbox 15 días)
                </span>
                <Info className="w-3 h-3 text-muted-foreground" title="Asigna una prueba rápida de 15 días al comercio para soporte técnico." />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1 border-blue-200/60 bg-blue-50/50 hover:bg-blue-100 hover:text-blue-900 dark:bg-blue-950/20 dark:border-blue-800/40 dark:text-blue-300 text-blue-700 font-semibold"
                  onClick={() => handleQuickTrial("emprendedor")}
                  disabled={trialLoading}
                >
                  <Clock className="w-3 h-3 text-blue-500" />
                  {trialLoading && selectedTrialPlan === "emprendedor" ? "Asignando..." : "Prueba Emprendedor"}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1 border-amber-200/60 bg-amber-50/50 hover:bg-amber-100 hover:text-amber-900 dark:bg-amber-950/20 dark:border-amber-800/40 dark:text-amber-300 text-amber-700 font-semibold"
                  onClick={() => handleQuickTrial("pro")}
                  disabled={trialLoading}
                >
                  <Clock className="w-3 h-3 text-amber-500" />
                  {trialLoading && selectedTrialPlan === "pro" ? "Asignando..." : "Prueba Pro"}
                </Button>
              </div>
            </div>

            {/* Gestión de Inactividad y Retención de URL */}
            <div className="space-y-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Gestión de Inactividad y Retención de URL
                </span>
                <Info className="w-3 h-3 text-muted-foreground" title="Mitiga la ocupación de URLs liberando el slug de tiendas inactivas sin perder sus datos." />
              </div>

              <div className="flex flex-wrap gap-2">
                {store.active ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5 border-amber-200 bg-amber-50/20 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/10 dark:border-amber-900/40 dark:text-amber-300 font-semibold"
                    onClick={() => setPauseOpen(true)}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Liberar URL / Pausar Tienda
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 bg-amber-500/5 px-2.5 py-1.5 rounded-lg border border-amber-500/10 font-bold dark:text-amber-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                    Tienda Pausada y URL Liberada
                  </span>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5 border-zinc-200 hover:bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300 font-semibold"
                  onClick={handleSendWhatsAppAlert}
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                  Notificar por WhatsApp
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Modal: Renovar / Cambiar plan ── */}
      <Dialog open={renewOpen} onOpenChange={setRenewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Renovar / Cambiar plan</DialogTitle>
            <DialogDescription>
              Configuración de contrato para la tienda <strong>{store.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Plan</label>
              <select
                value={renewPlan}
                onChange={(e) => setRenewPlan(e.target.value as PlanId)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary font-medium"
              >
                <option value="semilla">Semilla (Gratis)</option>
                <option value="emprendedor">Emprendedor (S/ 9.90/mes)</option>
                <option value="pro">Pro (S/ 14.90/mes)</option>
                <option value="ilimitado">Ilimitado (S/ 34.90/mes)</option>
              </select>
            </div>

            {renewPlan !== "semilla" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Duración</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PLAN_DURATION_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setRenewDuration(o.value)}
                        className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all text-left ${
                          renewDuration === o.value
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-input hover:border-primary/50"
                        }`}
                      >
                        <div>{o.label}</div>
                        <div className="text-xs text-muted-foreground font-normal">
                          Vence: {(() => {
                            const d = new Date();
                            d.setMonth(d.getMonth() + o.value);
                            return formatDate(d.toISOString());
                          })()}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-2" />

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="renew-custom-price-checkbox"
                      checked={customPriceEnabled}
                      onChange={(e) => {
                        setCustomPriceEnabled(e.target.checked);
                      }}
                      className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                    <label 
                      htmlFor="renew-custom-price-checkbox" 
                      className="text-sm font-semibold select-none cursor-pointer"
                    >
                      Tarifa Especial de Cobro (S/)
                    </label>
                  </div>

                  {customPriceEnabled && (
                    <div className="space-y-1.5 pl-6">
                      <label className="text-xs text-muted-foreground">Monto mensual (S/)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={customPriceVal}
                        onChange={(e) => setCustomPriceVal(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        placeholder="0.00"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Esta tarifa reemplazará los cálculos de renovación estándar para este comercio.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {renewPlan !== "semilla" && (
              <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Precio total estimado:</span>{" "}
                S/ {((customPriceEnabled && customPriceVal !== "" ? Number(customPriceVal) : PLANS[renewPlan].price) * renewDuration).toFixed(2)}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewOpen(false)}>Cancelar</Button>
            <Button onClick={handleRenew} disabled={renewLoading}>
              {renewLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Extender plan ── */}
      <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Extender plan</DialogTitle>
            <DialogDescription>
              Extiende la suscripción de <strong>{store.name}</strong>.
              {store.planExpiresAt && days !== null && days >= 0 && (
                <> Actualmente vence el {formatDate(store.planExpiresAt)}.</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-sm font-medium">Meses a agregar</label>
            <div className="grid grid-cols-2 gap-2">
              {PLAN_DURATION_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setExtendMonths(o.value)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all text-left ${
                    extendMonths === o.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-input hover:border-primary/50"
                  }`}
                >
                  <div>+ {o.label}</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    Nueva fecha: {(() => {
                      const base = store.planExpiresAt && new Date(store.planExpiresAt) > new Date()
                        ? new Date(store.planExpiresAt)
                        : new Date();
                      base.setMonth(base.getMonth() + o.value);
                      return formatDate(base.toISOString());
                    })()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendOpen(false)}>Cancelar</Button>
            <Button onClick={handleExtend} disabled={extendLoading}>
              {extendLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Extendiendo...
                </span>
              ) : "Extender plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Alert: Cancelar suscripcion ── */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar suscripción</AlertDialogTitle>
            <AlertDialogDescription>
              La tienda <strong>{store.name}</strong> volverá al plan Semilla (gratis) de forma inmediata.
              Esta acción puede revertirse renovando el plan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-2">
            <label className="text-sm font-medium">Motivo (opcional)</label>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ej: Solicitud del cliente, falta de pago..."
              className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelLoading ? "Cancelando..." : "Sí, cancelar suscripción"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

        {/* ── Dialog: Eliminar tienda ── */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600 flex items-center gap-1.5 font-bold">
                <Trash2 className="w-5 h-5" />
                Eliminar Tienda
              </DialogTitle>
              <DialogDescription>
                Esta acción es <strong>irreversible</strong> y eliminará la tienda <strong>{store.name}</strong>, incluyendo todos sus productos, categorías y configuraciones de forma permanente, liberando el enlace <code>/t/{store.slug}</code>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <p className="text-xs text-muted-foreground">
                Para proceder, por seguridad ingresa tu contraseña de Superadmin.
              </p>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Contraseña de Superadmin</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary font-medium"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setDeleteOpen(false); setDeletePassword(""); }}>Cancelar</Button>
              <Button 
                onClick={handleDeleteStore} 
                disabled={deleteLoading || !deletePassword} 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold text-xs h-9 px-4"
              >
                {deleteLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Eliminando...
                  </span>
                ) : "Eliminar Permanentemente"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Dialog: Liberar URL / Pausar tienda ── */}
        <Dialog open={pauseOpen} onOpenChange={setPauseOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-amber-600 flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-5 h-5" />
                Liberar URL y Pausar Tienda
              </DialogTitle>
              <DialogDescription>
                Esta acción suspenderá temporalmente el acceso a la tienda <strong>{store.name}</strong> y cambiará su enlace de <code>/t/{store.slug}</code> a uno inactivo, liberando el nombre original de forma inmediata para otros comercios.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-bold">¿Qué sucede con los datos del comercio?</p>
              <p>Los productos, categorías, imágenes y configuraciones NO se eliminarán. Permanecerán guardados de forma segura. Si el cliente regresa, podrás reactivar su cuenta y asignarle un nuevo enlace.</p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setPauseOpen(false)}>Cancelar</Button>
              <Button 
                onClick={handlePauseAndReleaseURL} 
                disabled={pauseLoading} 
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9 px-4"
              >
                {pauseLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Procesando...
                  </span>
                ) : "Sí, Liberar Enlace"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
  );
}
