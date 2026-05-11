import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { ImageIcon, Phone, Store } from "lucide-react";

export const Route = createFileRoute("/admin/configuracion")({
  component: ConfigPage,
});

const COUNTRIES = [
  { code: "51", name: "Perú" },
  { code: "52", name: "México" },
  { code: "54", name: "Argentina" },
  { code: "56", name: "Chile" },
  { code: "57", name: "Colombia" },
  { code: "1", name: "EE. UU. / Canadá" },
  { code: "34", name: "España" },
];

function ConfigPage() {
  const id = useApp((s) => s.currentStoreId);
  const store = useApp((s) => s.stores.find((st) => st.id === id));
  const update = useApp((s) => s.updateStore);

  const [name, setName] = useState(store?.name || "");
  const [country, setCountry] = useState(store?.countryCode || "51");
  const [number, setNumber] = useState(
    store?.phone.startsWith(store?.countryCode || "")
      ? store?.phone.slice((store?.countryCode || "").length)
      : store?.phone || ""
  );
  const [logo, setLogo] = useState(store?.logo ?? "");

  if (!store) return null;

  const save = () => {
    const cleanNumber = number.replace(/\D/g, "");
    if (!name.trim() || !cleanNumber) {
      toast.error("Completa los campos requeridos");
      return;
    }
    update(store.id, {
      name: name.trim(),
      countryCode: country,
      phone: country + cleanNumber,
      logo,
    });
    toast.success("✅ Configuración guardada correctamente");
  };

  const onLogo = (file?: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("El logo es muy pesado (máximo 2 MB)");
      return;
    }
    const r = new FileReader();
    r.onload = () => {
      setLogo(r.result as string);
      toast.info("Logo cargado. Haz clic en 'Guardar' para confirmar.");
    };
    r.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Store className="h-6 w-6 text-primary" />
          Configuración
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Datos básicos de tu negocio. Para cambiar el diseño visual ve a{" "}
          <a href="/admin/diseno" className="text-primary underline">Diseño</a>.
        </p>
      </div>

      <Card className="border-primary/10 shadow-sm">
        <CardContent className="p-6 space-y-6">
          {/* Name + Phone */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="font-semibold">Nombre comercial</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Mi Tienda Dizi"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> WhatsApp
              </Label>
              <div className="flex gap-2">
                <select
                  className="border rounded-md px-2 py-2 bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
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
                />
              </div>
            </div>
          </div>

          {/* Logo */}
          <div className="space-y-3 pt-4 border-t">
            <Label className="font-semibold">Logo del Negocio</Label>
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Preview */}
              <div className="relative group shrink-0">
                {logo ? (
                  <img
                    src={logo}
                    alt="Logo"
                    className="h-20 w-20 rounded-2xl object-cover ring-2 ring-primary/20 shadow-lg"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
                    <ImageIcon className="h-7 w-7 text-muted-foreground/30" />
                  </div>
                )}
                {logo && (
                  <button
                    onClick={() => setLogo("")}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Drop zone */}
              <div className="flex-1 w-full relative">
                <div className="border-2 border-dashed border-primary/20 rounded-xl p-5 text-center hover:bg-primary/5 transition-colors cursor-pointer group">
                  <div className="flex flex-col items-center gap-1.5">
                    <ImageIcon className="h-7 w-7 text-primary/30 group-hover:text-primary/60 transition-colors" />
                    <span className="text-sm font-medium text-foreground/70">
                      {logo ? "Cambiar logo" : "Subir logo"}
                    </span>
                    <span className="text-xs text-muted-foreground/60">
                      JPG, PNG o WEBP · Máx. 2 MB
                    </span>
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

          <div className="pt-2">
            <Button onClick={save} className="w-full sm:w-auto px-8 h-11 font-bold shadow-lg shadow-primary/20">
              Guardar cambios
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
