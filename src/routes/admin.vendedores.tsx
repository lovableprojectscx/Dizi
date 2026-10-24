import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { getEffectivePlan, getMaxSellers, type Seller } from "@/lib/types";
import { canToggleSeller, normalizeMainSellerName } from "@/lib/sellers";
import { formatPhoneDisplay, validatePhone, toWhatsAppDigits } from "@/lib/phone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PhoneInput } from "@/components/PhoneInput";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Phone,
  ShieldAlert,
  Store as StoreIcon,
  ChevronRight,
  Loader2,
} from "lucide-react";

/**
 * @file admin.vendedores.tsx
 * @description Gestión de Vendedores y WhatsApp Múltiple (/admin/vendedores - F39b).
 * Permite a la dueña activar o desactivar con un solo toque a los vendedores que atienden hoy,
 * editar el nombre del vendedor principal o de los extras, y respetar las reglas de negocio
 * garantizando que siempre quede al menos 1 vendedor activo.
 */

export const Route = createFileRoute("/admin/vendedores")({
  component: AdminVendedoresPage,
});

export function AdminVendedoresPage() {
  const storeId = useApp((s) => s.currentStoreId);
  const store = useApp((s) => s.stores.find((st) => st.id === storeId) ?? s.stores[0]);
  const updateStore = useApp((s) => s.updateStore);

  // Estados de modales
  const [editingMainName, setEditingMainName] = useState(false);
  const [mainNameInput, setMainNameInput] = useState("");

  const [sellerModalOpen, setSellerModalOpen] = useState(false);
  const [sellerModalMode, setSellerModalMode] = useState<"create" | "edit">("create");
  const [targetSellerId, setTargetSellerId] = useState<string | null>(null);
  const [sellerNameInput, setSellerNameInput] = useState("");
  const [sellerPhoneInput, setSellerPhoneInput] = useState("");
  const [sellerIsoInput, setSellerIsoInput] = useState("PE");
  const [submittingModal, setSubmittingModal] = useState(false);

  // Confirmación de borrado
  const [deletingSeller, setDeletingSeller] = useState<Seller | null>(null);

  if (!store) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        No se encontró la tienda activa.
      </div>
    );
  }

  const effectivePlan = getEffectivePlan(store);
  const maxTotalSellers = getMaxSellers(store);
  const isProOrUnlimited = effectivePlan === "pro" || effectivePlan === "ilimitado";
  const maxExtraSellers = Math.max(0, maxTotalSellers - 1);

  const sellersList = store.sellers || [];
  const isMainActive = store.mainSellerActive !== false;
  const activeExtraCount = sellersList.filter((s) => s.active && s.phone).length;
  const totalActiveCount = (isMainActive ? 1 : 0) + activeExtraCount;

  // ── TOGGLE VENDEDOR PRINCIPAL (1 toque) ──
  const handleToggleMain = async (checked: boolean) => {
    const check = canToggleSeller(store, "main", checked);
    if (!check.ok) {
      toast.error(check.error || "Debe quedar al menos un vendedor activo.");
      return;
    }
    try {
      await updateStore(store.id, { mainSellerActive: checked });
      toast.success(
        checked
          ? "Número de la tienda activado para WhatsApp"
          : "Número de la tienda desactivado de WhatsApp"
      );
    } catch (err: any) {
      toast.error(err?.message || "Error al actualizar vendedor principal");
    }
  };

  // ── GUARDAR NOMBRE VENDEDOR PRINCIPAL ──
  const handleSaveMainName = async () => {
    const trimmed = mainNameInput.trim();
    if (trimmed.length > 40) {
      toast.error("El nombre no puede exceder 40 caracteres");
      return;
    }
    // Bug fix F39b: Guardar string vacío como null para limpiar en base de datos
    const valueToSave = normalizeMainSellerName(mainNameInput);

    setSubmittingModal(true);
    try {
      await updateStore(store.id, { mainSellerName: valueToSave });
      toast.success("Nombre del vendedor principal guardado");
      setEditingMainName(false);
    } catch (err: any) {
      toast.error(err?.message || "Error al guardar nombre");
    } finally {
      setSubmittingModal(false);
    }
  };

  // ── TOGGLE VENDEDOR EXTRA (1 toque) ──
  const handleToggleExtra = async (sellerId: string, currentActive: boolean) => {
    const target = sellersList.find((s) => s.id === sellerId);
    if (!target) return;

    const nextState = !currentActive;
    const check = canToggleSeller(store, sellerId, nextState);
    if (!check.ok) {
      toast.error(check.error || "Debe quedar al menos un vendedor activo.");
      return;
    }

    const updated = sellersList.map((s) => (s.id === sellerId ? { ...s, active: nextState } : s));
    try {
      await updateStore(store.id, { sellers: updated });
      toast.success(
        nextState
          ? `Vendedor "${target.name}" activado`
          : `Vendedor "${target.name}" desactivado`
      );
    } catch (err: any) {
      toast.error(err?.message || "Error al cambiar estado del vendedor");
    }
  };

  // ── ABRIR MODAL CREAR VENDEDOR ──
  const openCreateModal = () => {
    if (!isProOrUnlimited) {
      toast.info("Disponible en planes Pro e Ilimitado");
      return;
    }
    if (sellersList.length >= maxExtraSellers) {
      toast.error(`Has alcanzado el límite de ${maxExtraSellers} vendedores extra para tu plan.`);
      return;
    }
    setSellerModalMode("create");
    setTargetSellerId(null);
    setSellerNameInput("");
    setSellerPhoneInput("");
    setSellerIsoInput(store.countryIso || "PE");
    setSellerModalOpen(true);
  };

  // ── ABRIR MODAL EDITAR VENDEDOR ──
  const openEditModal = (seller: Seller) => {
    setSellerModalMode("edit");
    setTargetSellerId(seller.id);
    setSellerNameInput(seller.name);
    setSellerPhoneInput(seller.phone);
    setSellerIsoInput(seller.countryIso || store.countryIso || "PE");
    setSellerModalOpen(true);
  };

  // ── GUARDAR VENDEDOR (Crear / Editar) ──
  const handleSaveSellerModal = async () => {
    const trimmedName = sellerNameInput.trim();
    if (!trimmedName) {
      toast.error("El vendedor debe tener un nombre");
      return;
    }
    if (trimmedName.length > 40) {
      toast.error("El nombre no puede exceder 40 caracteres");
      return;
    }

    const digits = toWhatsAppDigits(sellerIsoInput, sellerPhoneInput);
    if (!digits || digits.length < 6 || digits.length > 15) {
      toast.error("El teléfono no es válido");
      return;
    }

    setSubmittingModal(true);
    try {
      let updated: Seller[];
      if (sellerModalMode === "create") {
        const newSeller: Seller = {
          id: `seller_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: trimmedName,
          phone: digits,
          countryIso: sellerIsoInput,
          active: totalActiveCount < maxTotalSellers,
        };
        updated = [...sellersList, newSeller];
      } else {
        updated = sellersList.map((s) =>
          s.id === targetSellerId
            ? { ...s, name: trimmedName, phone: digits, countryIso: sellerIsoInput }
            : s
        );
      }

      await updateStore(store.id, { sellers: updated });
      toast.success(
        sellerModalMode === "create" ? "Vendedor agregado" : "Vendedor actualizado"
      );
      setSellerModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Error al guardar vendedor");
    } finally {
      setSubmittingModal(false);
    }
  };

  // ── CONFIRMAR BORRADO ──
  const handleConfirmDelete = async () => {
    if (!deletingSeller) return;
    const sellerId = deletingSeller.id;

    // Si estaba activo, asegurar que quede al menos 1 activo
    if (deletingSeller.active) {
      const remainingActive = (isMainActive ? 1 : 0) + sellersList.filter((s) => s.id !== sellerId && s.active).length;
      if (remainingActive < 1) {
        toast.error("Debe quedar al menos un vendedor activo.");
        setDeletingSeller(null);
        return;
      }
    }

    const updated = sellersList.filter((s) => s.id !== sellerId);
    try {
      await updateStore(store.id, { sellers: updated });
      toast.success(`Vendedor "${deletingSeller.name}" eliminado`);
      setDeletingSeller(null);
    } catch (err: any) {
      toast.error(err?.message || "Error al eliminar vendedor");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* ── ENCABEZADO ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>Vendedores</span>
                {!isProOrUnlimited ? (
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 text-[10px] font-extrabold py-0.5">
                    Disponible en Pro
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[11px] font-bold">
                    {totalActiveCount} de {maxTotalSellers} activos
                  </Badge>
                )}
              </h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground pt-1 max-w-xl">
            Controla qué números de WhatsApp reciben los mensajes de tus clientes. Activa o desactiva con un solo toque a los vendedores que atienden hoy.
          </p>
        </div>

        {/* Botón Agregar */}
        <div className="shrink-0">
          {isProOrUnlimited ? (
            <Button
              onClick={openCreateModal}
              disabled={sellersList.length >= maxExtraSellers}
              className="gap-2 font-bold text-xs h-10 w-full sm:w-auto shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Agregar Vendedor ({sellersList.length}/{maxExtraSellers})</span>
            </Button>
          ) : (
            <Link to="/admin/plan">
              <Button className="gap-2 font-bold text-xs h-10 w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white shadow-sm cursor-pointer">
                <Sparkles className="h-4 w-4" />
                <span>Ampliar a Pro</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* ── BANNER PRO GATE (Semilla / Emprendedor) ── */}
      {!isProOrUnlimited && (
        <Card className="border-amber-300/60 dark:border-amber-900/60 bg-gradient-to-r from-amber-50 to-amber-100/40 dark:from-amber-950/20 dark:to-amber-900/10 shadow-xs rounded-2xl overflow-hidden">
          <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  ¿Tienes un equipo de ventas?
                </h2>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed max-w-xl">
                  Con el plan <strong>Catálogo Pro</strong> o <strong>Ilimitado</strong> puedes registrar múltiples números de WhatsApp, cambiar turnos cada día y mostrar un selector interactivo a tus clientes.
                </p>
              </div>
            </div>
            <Link to="/admin/plan" className="shrink-0">
              <Button size="sm" className="font-bold text-xs h-9 bg-amber-600 hover:bg-amber-700 text-white shadow-sm w-full sm:w-auto">
                Ver Planes
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* ── TARJETA: VENDEDOR PRINCIPAL (Número de la tienda) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <StoreIcon className="h-3.5 w-3.5" />
            <span>Número Oficial de la Tienda</span>
          </h2>
          <span className="text-[11px] text-muted-foreground">
            {isMainActive ? "Activo para WhatsApp" : "Inactivo en WhatsApp"}
          </span>
        </div>

        <Card className={`border transition-all rounded-2xl shadow-xs overflow-hidden ${
          isMainActive ? "border-primary/40 bg-card" : "border-border/60 bg-muted/20 opacity-80"
        }`}>
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Información del vendedor principal */}
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base sm:text-lg font-bold text-foreground truncate">
                    {store.mainSellerName?.trim() || store.name}
                  </span>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">
                    Número de la tienda
                  </Badge>
                  {store.mainSellerName?.trim() && (
                    <span className="text-xs text-muted-foreground">
                      (Tienda: {store.name})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 opacity-70" />
                  <span>+{store.countryCode} {formatPhoneDisplay(store.phone, store.countryIso)}</span>
                </div>
                <p className="text-[11px] text-muted-foreground pt-0.5">
                  Este es el número oficial registrado. Se utiliza para el catálogo PDF, SEO y avisos del sistema.
                </p>
              </div>

              {/* Controles: Interruptor grande + Botón Editar */}
              <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMainNameInput(store.mainSellerName || "");
                    setEditingMainName(true);
                  }}
                  className="h-9 text-xs font-semibold gap-1.5 cursor-pointer"
                  title="Cambiar nombre de atención"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Editar nombre</span>
                </Button>

                {/* Interruptor grande (1-tap) */}
                <div className="flex items-center gap-2.5 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/50">
                  <Label
                    htmlFor="toggle-main-seller"
                    className="text-xs font-bold text-foreground cursor-pointer select-none"
                  >
                    {isMainActive ? "Atiende hoy" : "Descansa"}
                  </Label>
                  <Switch
                    id="toggle-main-seller"
                    checked={isMainActive}
                    onCheckedChange={handleToggleMain}
                    className="data-[state=checked]:bg-emerald-600 scale-110 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── TARJETAS: VENDEDORES EXTRAS ── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span>Equipo de Ventas Secundario ({sellersList.length})</span>
          </h2>
        </div>

        {sellersList.length === 0 ? (
          <Card className="border border-dashed border-border/70 rounded-2xl bg-muted/10">
            <CardContent className="p-8 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 opacity-60" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  No hay vendedores secundarios registrados
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {isProOrUnlimited
                    ? "Agrega a tus colaboradores para repartir los chats de WhatsApp entre varios números."
                    : "Amplía tu plan para habilitar la atención compartida con tu equipo."}
                </p>
              </div>
              {isProOrUnlimited && (
                <Button
                  onClick={openCreateModal}
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs font-bold h-9 mt-2 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Agregar primer colaborador</span>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {sellersList.map((seller, index) => (
              <Card
                key={seller.id}
                data-testid={`admin-seller-card-${seller.id}`}
                className={`border transition-all rounded-2xl shadow-xs overflow-hidden ${
                  seller.active
                    ? "border-emerald-300/50 dark:border-emerald-900/50 bg-card"
                    : "border-border/60 bg-muted/20 opacity-80"
                }`}
              >
                <CardContent className="p-5 sm:p-6 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Datos del vendedor */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-foreground truncate">
                          {seller.name}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground">
                          Colaborador #{index + 1}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 opacity-70" />
                        <span>+{seller.phone} ({seller.countryIso || store.countryIso})</span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(seller)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Editar vendedor"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingSeller(seller)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 cursor-pointer"
                          title="Eliminar vendedor"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Interruptor grande (1-tap) */}
                      <div className="flex items-center gap-2.5 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/50">
                        <Label
                          htmlFor={`toggle-seller-${seller.id}`}
                          className="text-xs font-bold text-foreground cursor-pointer select-none"
                        >
                          {seller.active ? "Atiende hoy" : "Descansa"}
                        </Label>
                        <Switch
                          id={`toggle-seller-${seller.id}`}
                          checked={seller.active}
                          onCheckedChange={() => handleToggleExtra(seller.id, seller.active)}
                          className="data-[state=checked]:bg-emerald-600 scale-110 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── DIALOG: EDITAR NOMBRE PRINCIPAL ── */}
      <Dialog open={editingMainName} onOpenChange={setEditingMainName}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Nombre de atención del número principal
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Este nombre aparecerá en el selector de vendedores y en el saludo inicial de WhatsApp. Si lo dejas vacío, se usará el nombre de tu tienda ({store.name}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="main-seller-input" className="text-xs font-bold text-foreground">
              Nombre del vendedor o tienda
            </Label>
            <Input
              id="main-seller-input"
              value={mainNameInput}
              onChange={(e) => setMainNameInput(e.target.value.slice(0, 40))}
              placeholder={store.name}
              maxLength={40}
              className="h-10 text-sm"
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground">
              Máximo 40 caracteres. Deja en blanco para usar &ldquo;{store.name}&rdquo;.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingMainName(false)}
              disabled={submittingModal}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveMainName}
              disabled={submittingModal}
              className="font-bold"
            >
              {submittingModal && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: CREAR O EDITAR COLABORADOR EXTRA ── */}
      <Dialog open={sellerModalOpen} onOpenChange={setSellerModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {sellerModalMode === "create" ? "Agregar nuevo vendedor" : "Editar vendedor"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ingresa el nombre del colaborador y su número de WhatsApp con código de país.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="seller-name-input" className="text-xs font-bold text-foreground">
                Nombre del colaborador
              </Label>
              <Input
                id="seller-name-input"
                value={sellerNameInput}
                onChange={(e) => setSellerNameInput(e.target.value.slice(0, 40))}
                placeholder="Ej: Dianis, Lucho, Soporte..."
                maxLength={40}
                className="h-10 text-sm"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Número de WhatsApp
              </Label>
              <PhoneInput
                value={sellerPhoneInput}
                countryIso={sellerIsoInput}
                onChange={({ digits, countryIso }) => {
                  setSellerPhoneInput(digits);
                  setSellerIsoInput(countryIso);
                }}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSellerModalOpen(false)}
              disabled={submittingModal}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveSellerModal}
              disabled={submittingModal}
              className="font-bold"
            >
              {submittingModal && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {sellerModalMode === "create" ? "Agregar" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: CONFIRMAR ELIMINACIÓN ── */}
      <Dialog open={!!deletingSeller} onOpenChange={(open) => !open && setDeletingSeller(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              <span>Eliminar colaborador</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              ¿Estás segura de que deseas eliminar a <strong>{deletingSeller?.name}</strong>? Este número ya no aparecerá como opción en tu catálogo ni en los enlaces de WhatsApp.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingSeller(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              className="font-bold"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
