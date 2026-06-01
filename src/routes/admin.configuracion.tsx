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
  Copy,
  Check,
  Globe,
  Sliders,
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

  const [copiedCatalog, setCopiedCatalog] = useState(false);
  const [copiedBio, setCopiedBio] = useState(false);

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

  const copyLink = (text: string, type: "catalog" | "bio") => {
    navigator.clipboard.writeText(text);
    if (type === "catalog") {
      setCopiedCatalog(true);
      setTimeout(() => setCopiedCatalog(false), 2000);
    } else {
      setCopiedBio(true);
      setTimeout(() => setCopiedBio(false), 2000);
    }
    toast.success("Enlace copiado");
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
    <div className="space-y-6 max-w-2xl mx-auto px-2 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent flex items-center gap-2">
          <Store className="h-7 w-7 text-primary shrink-0" />
          Configuración
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Ajustes generales de tu negocio: nombre, contacto, logo y dirección web.
        </p>
      </div>

      {/* ── CARD 1: DIRECCIÓN WEB Y ENLACES (Share Widget) ── */}
      <Card className="border-border/50 shadow-sm overflow-hidden bg-gradient-to-br from-card via-card to-primary/[0.01]">
        <CardContent className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2 border-b pb-3 border-border/30">
            <Globe className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold tracking-tight text-foreground uppercase tracking-wider">Dirección Web de la Tienda</h2>
          </div>

          {/* Input del Slug */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Link de tu Tienda (Slug)</Label>
            <div className="flex max-w-md rounded-lg border border-input shadow-none focus-within:ring-1 focus-within:ring-primary bg-background overflow-hidden h-10 transition-shadow">
              <span className="flex items-center px-3 bg-muted/30 text-muted-foreground/80 text-xs border-r shrink-0 font-medium select-none">
                dizi.idenza.site/t/
              </span>
              <Input
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className="rounded-none border-0 shadow-none focus-visible:ring-0 min-w-0 text-sm h-full"
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
              <p className="text-xs text-emerald-600 font-medium">¡Link disponible!</p>
            )}
          </div>

          {/* Enlaces de Compartir Visuales (No inputs!) */}
          <div className="grid gap-4 pt-1 sm:grid-cols-2">
            
            {/* Catalogo Directo */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Catálogo Digital
              </span>
              <div className="flex items-center justify-between gap-3 bg-muted/20 hover:bg-muted/30 transition-colors rounded-xl px-3 py-2.5 border border-border/40 shadow-none">
                <span className="truncate select-all font-mono text-xs font-semibold text-foreground/80 flex-1">{catalogUrl}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    onClick={() => copyLink(catalogUrl, "catalog")}
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md text-muted-foreground hover:text-primary transition-colors shrink-0"
                    title="Copiar link"
                  >
                    {copiedCatalog ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                  <a href={catalogUrl} target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded-md hover:bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shrink-0" title="Ver catálogo">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Bio-Link Profesional */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Link en Bio / Redes
                </span>
                {store.bioLinksEnabled ? (
                  <span className="text-[9px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-200/50 font-bold uppercase tracking-wider">
                    Activo
                  </span>
                ) : (
                  <span className="text-[9px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border/50 font-bold uppercase tracking-wider">
                    Inactivo
                  </span>
                )}
              </div>
              <div
                className={`flex items-center justify-between gap-3 bg-muted/20 hover:bg-muted/30 transition-colors rounded-xl px-3 py-2.5 border border-border/40 shadow-none ${!store.bioLinksEnabled ? "opacity-50 select-none pointer-events-none" : ""}`}
              >
                <span className="truncate select-all font-mono text-xs font-semibold text-foreground/80 flex-1">{bioUrl}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    disabled={!store.bioLinksEnabled}
                    onClick={() => copyLink(bioUrl, "bio")}
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md text-muted-foreground hover:text-primary transition-colors shrink-0"
                    title="Copiar link"
                  >
                    {copiedBio ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                  <a
                    href={bioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`h-7 w-7 rounded-md hover:bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shrink-0 ${!store.bioLinksEnabled ? "pointer-events-none" : ""}`}
                    title="Ver página"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
            
          </div>
        </CardContent>
      </Card>

      {/* ── CARD 2: DATOS DE LA TIENDA Y LOGO CLAYMORPHIC ── */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-5 sm:p-6 space-y-6">
          <div className="flex items-center gap-2 border-b pb-3 border-border/30">
            <Store className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold tracking-tight text-foreground uppercase tracking-wider">Identidad de tu Negocio</h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nombre comercial</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mi Tienda" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-primary" /> WhatsApp de Pedidos
              </Label>
              <div className="flex gap-2">
                <select
                  className="border border-input rounded-md px-2 py-2 bg-background text-sm focus:ring-1 focus:ring-primary outline-none w-28 shrink-0 h-10 transition-shadow"
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
                  className="min-w-0 h-10 flex-1"
                />
              </div>
            </div>
          </div>

          {/* Logo Circular Integrado (Sin el gran cuadro de subir archivos) */}
          <div className="flex flex-col sm:flex-row items-center gap-5 pt-4 border-t border-border/30">
            <div className="relative group shrink-0 cursor-pointer w-20 h-20">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onLogo(e.target.files?.[0])}
                className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                title="Haz clic para subir logo"
              />
              {logo ? (
                <div className="relative h-20 w-20 rounded-full overflow-hidden ring-2 ring-primary/20 shadow-md">
                  <img src={logo} alt="Logo" className="h-20 w-20 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <ImageIcon className="h-5 w-5 text-white" />
                  </div>
                </div>
              ) : (
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/20 group-hover:bg-primary/5 group-hover:border-primary/40 transition-colors">
                  <ImageIcon className="h-7 w-7 text-muted-foreground/30 group-hover:text-primary/60 transition-colors" />
                </div>
              )}
              {logo && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLogo(""); }}
                  className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md z-20 text-[10px] font-bold"
                  title="Remover imagen"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left space-y-1">
              <p className="text-sm font-semibold">Logo del Negocio</p>
              <p className="text-xs text-muted-foreground">
                Haz clic en el círculo para subir tu logotipo. Recomendado cuadrado de 500x500px. JPG, PNG o WEBP. Máx. 10MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── CARD 3: CARACTERÍSTICAS Y CUMPLIMIENTO LEGAL (Toggles) ── */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-5 sm:p-6 space-y-6">
          <div className="flex items-center gap-2 border-b pb-3 border-border/30">
            <Sliders className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold tracking-tight text-foreground uppercase tracking-wider">Opciones y Cumplimiento</h2>
          </div>

          {/* Filtro de precios */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">Filtro de Precios</p>
              <p className="text-xs text-muted-foreground">
                Permite a tus clientes filtrar los productos por rango de precio.
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
          <div className="pt-4 border-t border-border/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2.5">
                <ClipboardList className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold">Libro de Reclamaciones Virtual</p>
                  <p className="text-xs text-muted-foreground">
                    Obligatorio en Perú para comercio electrónico según normas de INDECOPI.
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
              <div className="rounded-xl border border-primary/10 bg-primary/[0.01] p-4 space-y-3.5 mt-2">
                <p className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                  <ClipboardList className="h-3.5 w-3.5" /> Datos Legales de tu Empresa
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">RUC *</Label>
                    <Input
                      value={empresaRuc}
                      onChange={(e) => setEmpresaRuc(e.target.value.replace(/\D/g, "").slice(0, 11))}
                      placeholder="20123456789"
                      inputMode="numeric"
                      maxLength={11}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Razón Social / Nombre Legal *</Label>
                    <Input value={empresaRazonSocial} onChange={(e) => setEmpresaRazonSocial(e.target.value)} placeholder="Mi Empresa S.A.C." className="h-10" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dirección Fiscal / Establecimiento *</Label>
                  <Input value={empresaDireccion} onChange={(e) => setEmpresaDireccion(e.target.value)} placeholder="Av. Principal 123, Lima" className="h-10" />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── SAVE BUTTON ── */}
      <div className="pt-2 flex justify-end">
        <Button
          onClick={save}
          disabled={saving || slugStatus === "taken" || slugStatus === "checking" || slugStatus === "invalid"}
          className="w-full sm:w-auto px-10 h-11 font-bold shadow-lg shadow-primary/20 text-sm rounded-lg"
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
