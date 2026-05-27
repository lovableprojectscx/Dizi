import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ImageIcon,
  Phone,
  Store,
  Link2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ClipboardList,
} from "lucide-react";
import { convertImageToWebP } from "@/lib/image-utils";

export const Route = createFileRoute("/admin/configuracion")({
  component: ConfigPage,
});

const COUNTRIES = [
  { code: "51", name: "Perú" },
  { code: "52", name: "México" },
  { code: "54", name: "Argentina" },
  { code: "56", name: "Chile" },
  { code: "57", name: "Colombia" },
  { code: "1",  name: "EE. UU. / Canadá" },
  { code: "34", name: "España" },
];

let slugCheckTimer: ReturnType<typeof setTimeout> | null = null;

function ConfigPage() {
  const id = useApp((s) => s.currentStoreId);
  const store = useApp((s) => s.stores.find((st) => st.id === id));
  const update = useApp((s) => s.updateStore);

  /* Basic fields */
  const [name, setName] = useState(store?.name || "");
  const [country, setCountry] = useState(store?.countryCode || "51");
  const [number, setNumber] = useState(
    store?.phone.startsWith(store?.countryCode || "")
      ? store?.phone.slice((store?.countryCode || "").length)
      : store?.phone || ""
  );
  const [logo, setLogo] = useState(store?.logo ?? "");
  const [slug, setSlug] = useState(store?.slug || "");
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [saving, setSaving] = useState(false);
  const [priceFilter, setPriceFilter] = useState(store?.priceFilterEnabled ?? false);
  const [libroActivo, setLibroActivo] = useState(store?.libroReclamacionesActivo ?? false);
  const [empresaRuc, setEmpresaRuc] = useState(store?.empresaRuc ?? "");
  const [empresaRazonSocial, setEmpresaRazonSocial] = useState(store?.empresaRazonSocial ?? "");
  const [empresaDireccion, setEmpresaDireccion] = useState(store?.empresaDireccion ?? "");

  const [isLoaded, setIsLoaded] = useState(false);

  /* Load store once */
  useEffect(() => {
    if (store && store.logo !== undefined && !isLoaded) {
      setName(store.name || "");
      setCountry(store.countryCode || "51");
      setNumber(
        store.phone.startsWith(store.countryCode || "")
          ? store.phone.slice((store.countryCode || "").length)
          : store.phone || ""
      );
      setLogo(store.logo ?? "");
      setSlug(store.slug || "");
      setPriceFilter(store.priceFilterEnabled ?? false);
      setLibroActivo(store.libroReclamacionesActivo ?? false);
      setEmpresaRuc(store.empresaRuc ?? "");
      setEmpresaRazonSocial(store.empresaRazonSocial ?? "");
      setEmpresaDireccion(store.empresaDireccion ?? "");
      setIsLoaded(true);
    }
  }, [store, isLoaded]);

  if (!store) return null;

  const catalogUrl = `${window.location.origin}/t/${store.slug}`;
  const bioUrl = `${window.location.origin}/bio/${store.slug}`;

  const handleSlugChange = (value: string) => {
    const clean = value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    setSlug(clean);
    if (slugCheckTimer) clearTimeout(slugCheckTimer);
    if (!clean || clean.length < 3) {
      setSlugStatus(clean.length > 0 ? "invalid" : "idle");
      return;
    }
    if (clean === store.slug) {
      setSlugStatus("available");
      return;
    }
    setSlugStatus("checking");
    slugCheckTimer = setTimeout(async () => {
      const { data } = await supabase.from("stores").select("id").eq("slug", clean).single();
      setSlugStatus(data ? "taken" : "available");
    }, 500);
  };

  const save = async () => {
    const cleanNumber = number.replace(/\D/g, "");
    if (!name.trim() || !cleanNumber) {
      toast.error("Completa los campos requeridos");
      return;
    }
    if (slug.length < 3) {
      toast.error("El link debe tener al menos 3 caracteres");
      return;
    }
    if (slugStatus === "taken") {
      toast.error("Ese link ya está en uso, elige otro");
      return;
    }
    if (slugStatus === "checking") {
      toast.error("Espera un momento, verificando disponibilidad...");
      return;
    }

    setSaving(true);
    try {
      await update(store.id, {
        name: name.trim(),
        countryCode: country,
        phone: country + cleanNumber,
        logo: logo || null,
        slug,
        priceFilterEnabled: priceFilter,
        libroReclamacionesActivo: libroActivo,
        empresaRuc: empresaRuc.trim() || undefined,
        empresaRazonSocial: empresaRazonSocial.trim() || undefined,
        empresaDireccion: empresaDireccion.trim() || undefined,
      });
      
      // Update local state to the saved URL with cache-busting timestamp
      const updatedStore = useApp.getState().stores.find((st) => st.id === store.id);
      if (updatedStore) {
        setLogo(updatedStore.logo ?? "");
      }

      toast.success("Configuración guardada correctamente");
    } catch {
      toast.error("Error al guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const onLogo = async (file?: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("El logo es muy pesado (máximo 10 MB)");
      return;
    }
    try {
      const webpDataUrl = await convertImageToWebP(file);
      setLogo(webpDataUrl);
      toast.info("Logo cargado. Haz clic en Guardar para confirmar.");
    } catch {
      toast.error("No se pudo procesar la imagen.");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto px-2">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Store className="h-6 w-6 text-primary" />
          Configuración
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ajustes generales de tu negocio: nombre, contacto, logo y enlaces.
        </p>
      </div>

      {/* ── Slug + URLs ── */}
      <Card className="border-primary/10 shadow-sm bg-gradient-to-r from-background via-muted/10 to-primary/5">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="font-semibold flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5 text-primary" /> Link de tu Tienda (Slug)
            </Label>
            <div className="flex max-w-md rounded-xl border border-input shadow-sm focus-within:ring-1 focus-within:ring-primary bg-background overflow-hidden">
              <span className="flex items-center px-3 bg-muted/50 text-muted-foreground text-sm border-r shrink-0">
                dizi.idenza.site/t/
              </span>
              <Input
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className="rounded-none border-0 shadow-none focus-visible:ring-0 min-w-0"
                placeholder="mi-tienda"
              />
              {slugStatus === "checking" && (
                <span className="flex items-center px-3 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </span>
              )}
              {slugStatus === "available" && (
                <span className="flex items-center px-3 text-emerald-500">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              )}
              {(slugStatus === "taken" || slugStatus === "invalid") && (
                <span className="flex items-center px-3 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                </span>
              )}
            </div>
            {slugStatus === "taken" && <p className="text-xs text-destructive">Ese link ya está en uso, elige otro.</p>}
            {slugStatus === "invalid" && (
              <p className="text-xs text-destructive">Mínimo 3 caracteres (letras, números y guiones).</p>
            )}
            {slugStatus === "available" && slug !== store.slug && (
              <p className="text-xs text-emerald-600">Disponible.</p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 pt-1">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Catálogo Directo:
              </span>
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground bg-background rounded-lg px-3 py-2 border shadow-sm">
                <span className="truncate select-all font-mono font-medium">{catalogUrl}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(catalogUrl);
                      toast.success("Enlace copiado");
                    }}
                    className="hover:text-primary transition-colors text-[10px] font-semibold border rounded px-1.5 py-0.5 bg-background shadow-sm hover:bg-muted"
                  >
                    Copiar
                  </button>
                  <a href={catalogUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors p-1">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Bio-Link Profesional:
                </span>
                {store.bioLinksEnabled ? (
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-200/50 font-bold">
                    Activo
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border font-semibold">
                    Inactivo
                  </span>
                )}
              </div>
              <div
                className={`flex items-center justify-between gap-2 text-xs text-muted-foreground bg-background rounded-lg px-3 py-2 border shadow-sm ${!store.bioLinksEnabled ? "opacity-60" : ""}`}
              >
                <span className="truncate select-all font-mono font-medium">{bioUrl}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={!store.bioLinksEnabled}
                    onClick={() => {
                      navigator.clipboard.writeText(bioUrl);
                      toast.success("Bio-Link copiado");
                    }}
                    className="hover:text-primary transition-colors text-[10px] font-semibold border rounded px-1.5 py-0.5 bg-background shadow-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Copiar
                  </button>
                  <a
                    href={bioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`hover:text-primary transition-colors p-1 ${!store.bioLinksEnabled ? "pointer-events-none opacity-50" : ""}`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Datos Básicos ── */}
      <Card className="border-primary/10 shadow-sm">
        <CardContent className="p-5 sm:p-6 space-y-6">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Datos Básicos</p>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="font-semibold">Nombre comercial</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mi Tienda" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> WhatsApp
              </Label>
              <div className="flex gap-2">
                <select
                  className="border rounded-md px-2 py-2 bg-background text-sm focus:ring-2 focus:ring-primary outline-none w-28 shrink-0"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      +{c.code} {c.name}
                    </option>
                  ))}
                </select>
                <Input
                  inputMode="numeric"
                  placeholder="987654321"
                  value={number}
                  onChange={(e) => setNumber(e.target.value.replace(/\D/g, ""))}
                  className="min-w-0"
                />
              </div>
            </div>
          </div>

          {/* Logo */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Logo del Negocio</Label>
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-1 text-[10px]">
                Cuadrado · 500 × 500 px
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="relative group shrink-0">
                {logo ? (
                  <img
                    src={logo}
                    alt="Logo"
                    className="h-20 w-20 rounded-full object-cover ring-2 ring-primary/20 shadow-lg"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
                    <ImageIcon className="h-7 w-7 text-muted-foreground/30" />
                  </div>
                )}
                {logo && (
                  <button
                    onClick={() => setLogo("")}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold"
                  >
                    x
                  </button>
                )}
              </div>
              <div className="flex-1 w-full">
                <div className="relative border-2 border-dashed border-primary/20 rounded-xl p-5 text-center hover:bg-primary/5 transition-colors cursor-pointer group">
                  <div className="flex flex-col items-center gap-1.5">
                    <ImageIcon className="h-7 w-7 text-primary/30 group-hover:text-primary/60 transition-colors" />
                    <span className="text-sm font-medium text-foreground/70">{logo ? "Cambiar logo" : "Subir logo"}</span>
                    <span className="text-xs text-muted-foreground/60">JPG, PNG o WEBP — Max. 10 MB</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onLogo(e.target.files?.[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Filtro de precios */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="text-sm font-semibold">Filtro de precios</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Muestra un slider para que tus clientes filtren por precio.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={priceFilter}
              onClick={() => setPriceFilter(!priceFilter)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${priceFilter ? "bg-primary" : "bg-input"}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${priceFilter ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>

          {/* Libro de reclamaciones */}
          <div className="pt-4 border-t space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2.5">
                <ClipboardList className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Libro de Reclamaciones</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Exigido por el Código de Protección al Consumidor.
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={libroActivo}
                onClick={() => setLibroActivo(!libroActivo)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ml-4 ${libroActivo ? "bg-primary" : "bg-input"}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${libroActivo ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
            </div>
            {libroActivo && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5" /> Datos de tu empresa para el formulario legal
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">RUC *</label>
                    <Input
                      value={empresaRuc}
                      onChange={(e) => setEmpresaRuc(e.target.value.replace(/\D/g, "").slice(0, 11))}
                      placeholder="20123456789"
                      inputMode="numeric"
                      maxLength={11}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Razón Social / Nombre Legal *</label>
                    <Input value={empresaRazonSocial} onChange={(e) => setEmpresaRazonSocial(e.target.value)} placeholder="Mi Empresa S.A.C." />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Dirección del establecimiento *</label>
                  <Input value={empresaDireccion} onChange={(e) => setEmpresaDireccion(e.target.value)} placeholder="Av. Principal 123, Lima" />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Save ── */}
      <div className="pb-8 flex justify-end">
        <Button
          onClick={save}
          disabled={saving || slugStatus === "taken" || slugStatus === "checking" || slugStatus === "invalid"}
          className="w-full sm:w-auto px-8 h-11 font-bold shadow-lg shadow-primary/20"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </span>
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>
    </div>
  );
}
