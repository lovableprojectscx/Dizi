import { useState } from "react";
import { useApp } from "@/lib/store";
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
import { Calendar, RefreshCw, XCircle, PlusCircle, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import type { Store, PlanId, SubscriptionStatus } from "@/lib/types";
import { PLANS, PLAN_DURATION_OPTIONS, daysUntilExpiry, formatDate } from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusLabel(status: SubscriptionStatus | undefined): string {
  switch (status) {
    case "active":    return "Activa";
    case "expired":   return "Vencida";
    case "cancelled": return "Cancelada";
    case "trial":     return "Trial";
    default:          return "Sin estado";
  }
}

function StatusBadge({ store }: { store: Store }) {
  const days = daysUntilExpiry(store);
  const status = store.subscriptionStatus;

  if (store.plan === "semilla" && status === "trial") {
    return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> Trial</Badge>;
  }
  if (status === "cancelled") {
    return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Cancelada</Badge>;
  }
  if (status === "expired" || (days !== null && days < 0)) {
    return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" /> Vencida</Badge>;
  }
  if (status === "active") {
    if (days !== null && days <= 7) {
      return (
        <Badge className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">
          <AlertTriangle className="w-3 h-3" /> Vence en {days}d
        </Badge>
      );
    }
    return (
      <Badge className="gap-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
        <CheckCircle2 className="w-3 h-3" /> Activa
      </Badge>
    );
  }
  return <Badge variant="outline">{statusLabel(status)}</Badge>;
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface SubscriptionManagerProps {
  store: Store;
}

export function SubscriptionManager({ store }: SubscriptionManagerProps) {
  const setPlan = useApp((s) => s.setPlan);
  const cancelSubscription = useApp((s) => s.cancelSubscription);
  const extendSubscription = useApp((s) => s.extendSubscription);

  // Modal renovar/cambiar plan
  const [renewOpen, setRenewOpen] = useState(false);
  const [renewPlan, setRenewPlan] = useState<PlanId>(store.plan);
  const [renewDuration, setRenewDuration] = useState(1);
  const [renewLoading, setRenewLoading] = useState(false);

  // Modal extender
  const [extendOpen, setExtendOpen] = useState(false);
  const [extendMonths, setExtendMonths] = useState(1);
  const [extendLoading, setExtendLoading] = useState(false);

  // Alert cancelar
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const days = daysUntilExpiry(store);
  const isPaid = store.plan !== "semilla";

  const handleRenew = async () => {
    setRenewLoading(true);
    try {
      await setPlan(store.id, renewPlan, renewDuration);
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

  return (
    <>
      {/* ── Panel de estado ── */}
      <div className="rounded-lg border bg-card p-3 space-y-3">
        {/* Cabecera */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{PLANS[store.plan].name}</span>
            <StatusBadge store={store} />
          </div>
        </div>

        {/* Fechas */}
        {isPaid && store.planExpiresAt && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {days !== null && days >= 0
              ? <>Vence el <strong>{formatDate(store.planExpiresAt)}</strong> ({days === 0 ? "hoy" : `en ${days} día${days !== 1 ? "s" : ""}`})</>
              : <>Vencio el <strong>{formatDate(store.planExpiresAt)}</strong></>
            }
          </div>
        )}

        {store.cancelledAt && (
          <div className="text-xs text-destructive flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Cancelada el {formatDate(store.cancelledAt)}
            {store.cancelReason && <> — {store.cancelReason}</>}
          </div>
        )}

        {/* Botones de accion */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => { setRenewPlan(store.plan); setRenewDuration(store.planDurationMonths ?? 1); setRenewOpen(true); }}
          >
            <RefreshCw className="w-3 h-3" /> Renovar / Cambiar plan
          </Button>

          {isPaid && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => setExtendOpen(true)}
            >
              <PlusCircle className="w-3 h-3" /> Extender
            </Button>
          )}

          {store.subscriptionStatus !== "cancelled" && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setCancelOpen(true)}
            >
              <XCircle className="w-3 h-3" /> Cancelar
            </Button>
          )}
        </div>
      </div>

      {/* ── Modal: Renovar / Cambiar plan ── */}
      <Dialog open={renewOpen} onOpenChange={setRenewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Renovar / Cambiar plan</DialogTitle>
            <DialogDescription>
              Tienda: <strong>{store.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Plan</label>
              <select
                value={renewPlan}
                onChange={(e) => setRenewPlan(e.target.value as PlanId)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                <option value="semilla">Semilla (Gratis)</option>
                <option value="emprendedor">Emprendedor — S/ 14.90/mes</option>
                <option value="pro">Pro — S/ 19.90/mes</option>
                <option value="ilimitado">Ilimitado — S/ 34.90/mes</option>
              </select>
            </div>

            {renewPlan !== "semilla" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Duracion</label>
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
            )}

            {renewPlan !== "semilla" && (
              <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Precio total estimado:</span>{" "}
                S/ {(PLANS[renewPlan].price * renewDuration).toFixed(2)}
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
              Extiende la suscripcion de <strong>{store.name}</strong>.
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
            <AlertDialogTitle>Cancelar suscripcion</AlertDialogTitle>
            <AlertDialogDescription>
              La tienda <strong>{store.name}</strong> volvera al plan Semilla (gratis) de forma inmediata.
              Esta accion puede revertirse renovando el plan.
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
              {cancelLoading ? "Cancelando..." : "Si, cancelar suscripcion"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
