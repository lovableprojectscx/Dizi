import React, { useState } from "react";
import { useApp } from "@/lib/store";
import { convertImageToWebP } from "@/lib/image-utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Facebook,
  Upload,
  Link2,
  Plus,
  Check,
  Loader2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  FileImage,
  Copy,
  Info
} from "lucide-react";

export function OnboardingWizard() {
  const storeId = useApp((s) => s.currentStoreId);
  const store = useApp((s) => s.stores.find((st) => st.id === storeId));
  const updateStore = useApp((s) => s.updateStore);
  const upsertProduct = useApp((s) => s.upsertProduct);

  // Determine starting step dynamically based on what's missing
  const initialStep = React.useMemo(() => {
    if (!store) return 1;
    const hasBrand = !!(store.logo || store.bannerImage);
    const hasProducts = store.products && store.products.some((p) => !p.isSample);
    
    // If they have logo/banner but no products, go straight to Step 3
    if (hasBrand && !hasProducts) {
      return 3;
    }
    // If they have products but no logo/banner, start on Step 1 (logo/banner)
    return 1;
  }, [store, store?.logo, store?.bannerImage, store?.products]);

  const [step, setStep] = useState<1 | 2 | 3>(initialStep);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  // Auto-skip onboarding if they already have both brand elements AND products configured
  React.useEffect(() => {
    if (!store || store.onboardingCompleted) return;

    const hasBrand = !!(store.logo || store.bannerImage);
    const hasProducts = store.products && store.products.some((p) => !p.isSample);

    if (hasBrand && hasProducts) {
      // Auto-skip
      updateStore(store.id, { onboardingCompleted: true });
      setIsOpen(false);
    }
  }, [storeId, store?.logo, store?.bannerImage, store?.products?.length]);

  // Step 1 States: Identity (Name, Logo, Banner)
  const [storeName, setStoreName] = useState(store?.name || "");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [logoBase64, setLogoBase64] = useState<string | null>(store?.logo || null);
  const [bannerBase64, setBannerBase64] = useState<string | null>(store?.bannerImage || null);
  const [fbConnected, setFbConnected] = useState(false);

  // Step 2 States: Bio-Link
  const [bioEnabled, setBioEnabled] = useState(store?.bioLinksEnabled || false);
  const [bioDescription, setBioDescription] = useState(store?.bioDescription || "");
  const [copiedLink, setCopiedLink] = useState(false);

  // Step 3 States: First Product
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productImage, setProductImage] = useState<string | null>(null);
  const [productLoading, setProductLoading] = useState(false);

  // If there's no active store, or if onboarding is already completed, don't show
  // Placed AFTER all hooks to adhere to React Rules of Hooks!
  if (!store || store.onboardingCompleted) {
    return null;
  }

  const bioUrl = `${typeof window !== "undefined" ? window.location.origin : "https://dizi.idenza.site"}/bio/${store.slug}`;

  // Handle Facebook scraping
  const handleConnectFacebook = async () => {
    if (!facebookUrl.trim()) {
      toast.error("Por favor, ingresa un enlace de Facebook válido.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/scrape-fb?url=${encodeURIComponent(facebookUrl)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al conectar con Facebook.");
      }

      setStoreName(data.name);
      setLogoBase64(data.logo);
      setFbConnected(true);
      toast.success("¡Información importada con éxito de Facebook!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "No se pudo obtener información de Facebook. Inténtalo de forma manual.");
    } finally {
      setLoading(false);
    }
  };

  // Image Upload helpers
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const webp = await convertImageToWebP(file);
      setLogoBase64(webp);
      toast.success("Logo cargado correctamente");
    } catch (err) {
      toast.error("Error al procesar la imagen del logo");
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const webp = await convertImageToWebP(file);
      setBannerBase64(webp);
      toast.success("Banner cargado correctamente");
    } catch (err) {
      toast.error("Error al procesar la imagen del banner");
    }
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const webp = await convertImageToWebP(file);
      setProductImage(webp);
      toast.success("Imagen del producto cargada correctamente");
    } catch (err) {
      toast.error("Error al procesar la imagen del producto");
    }
  };

  // Save Step 1 (Identity)
  const saveStep1 = async () => {
    try {
      setLoading(true);
      await updateStore(store.id, {
        name: storeName,
        logo: logoBase64,
        bannerImage: bannerBase64,
      });
      setStep(2);
    } catch (err) {
      toast.error("Error al guardar la información comercial.");
    } finally {
      setLoading(false);
    }
  };

  // Save Step 2 (Bio-Link)
  const saveStep2 = async () => {
    try {
      setLoading(true);
      await updateStore(store.id, {
        bioLinksEnabled: bioEnabled,
        bioDescription: bioDescription || null,
        // Al habilitar el bio link por primera vez, sugerimos copiar la foto de perfil y banner
        bioLogo: store.bioLogo || logoBase64 || undefined,
        bioBanner: store.bioBanner || bannerBase64 || undefined,
      });
      setStep(3);
    } catch (err) {
      toast.error("Error al guardar la configuración del Bio-Link.");
    } finally {
      setLoading(false);
    }
  };

  // Save Step 3 (First Product) & Finish Onboarding
  const handleFinishOnboarding = async () => {
    if (!productName.trim()) {
      toast.error("Por favor, ingresa el nombre de tu primer producto.");
      return;
    }
    if (!productImage) {
      toast.error("Por favor, sube una foto para tu producto.");
      return;
    }

    setProductLoading(true);
    try {
      const firstCategory = store.categories[0];
      if (!firstCategory) {
        throw new Error("No se encontró una categoría principal. Intenta recargar la página.");
      }

      // 1. Create first real product (this deletes sample products in store.ts automatically)
      await upsertProduct(store.id, {
        id: "",
        name: productName.trim(),
        price: productPrice ? parseFloat(productPrice) : null,
        categoryId: firstCategory.id,
        image: productImage,
        visible: true,
      });

      // 2. Set onboardingCompleted to true
      await updateStore(store.id, {
        onboardingCompleted: true,
      });

      toast.success("¡Excelente! Tu catálogo y primer producto están listos.");
      setIsOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al guardar el producto.");
    } finally {
      setProductLoading(false);
    }
  };

  // Skip wizard entirely
  const handleSkipAll = async () => {
    try {
      await updateStore(store.id, {
        onboardingCompleted: true,
      });
      setIsOpen(false);
      toast.info("Asistente cerrado. Puedes configurar todo desde el panel de ajustes en cualquier momento.");
    } catch (err) {
      setIsOpen(false);
    }
  };

  const copyBioLink = () => {
    navigator.clipboard.writeText(bioUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast.success("Enlace del Bio-Link copiado");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        // If they close the dialog, mark onboarding as completed to not annoy them
        handleSkipAll();
      }
    }}>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-card border border-border/40 shadow-2xl rounded-2xl">
        {/* Header con gradiente premium */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4 border-b border-border/10">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
            <Sparkles className="h-4 w-4" />
            Configuración Inicial
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            {step === 1 && "Personaliza tu Marca"}
            {step === 2 && "Habilita tu Enlace en Bio"}
            {step === 3 && "Sube tu Primer Producto"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
            {step === 1 && "Conecta tus redes o sube manualmente tu foto y portada de catálogo."}
            {step === 2 && "Crea una página de presentación unificada para tus perfiles sociales."}
            {step === 3 && "Publica tu primer producto para habilitar tu catálogo online."}
          </DialogDescription>

          {/* Progreso Visual */}
          <div className="flex items-center gap-2 mt-4">
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step >= 3 ? "bg-primary" : "bg-muted"}`} />
          </div>
        </div>

        {/* Contenido dinámico del Paso */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          
          {/* STEP 1: IDENTITY */}
          {step === 1 && (
            <div className="space-y-5">
              
              {/* Option A: Facebook Scraper */}
              <div className="space-y-2 p-4 bg-muted/30 border border-border/30 rounded-xl">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-primary">
                  <Facebook className="h-4 w-4 text-[#1877F2]" />
                  Importar desde Facebook (Recomendado)
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Ingresa el enlace de tu página de Facebook. Extraeremos automáticamente tu logo y el nombre de tu negocio.
                  <span className="block mt-1 font-semibold text-amber-600 dark:text-amber-500">
                    Nota: Debido a políticas de privacidad de Facebook, la foto de portada (banner) debe subirse de forma manual.
                  </span>
                </p>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="https://www.facebook.com/TuPagina"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    className="h-9 text-xs rounded-lg flex-1"
                  />
                  <Button
                    onClick={handleConnectFacebook}
                    disabled={loading}
                    size="sm"
                    className="h-9 px-4 rounded-lg font-bold text-xs shrink-0"
                  >
                    {loading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Conectar"
                    )}
                  </Button>
                </div>
                {fbConnected && (
                  <div className="flex flex-col gap-1 text-[11px] text-emerald-600 bg-emerald-500/5 px-2.5 py-2 rounded-md border border-emerald-500/10 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 shrink-0" />
                      ¡Nombre y logo vinculados con éxito!
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Ahora puedes subir tu banner (portada) preferido a la derecha.
                    </p>
                  </div>
                )}
              </div>

              {/* Manual Input Fields */}
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="store-name" className="text-xs font-bold uppercase tracking-wider">Nombre del Negocio</Label>
                  <Input
                    id="store-name"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Ej. Mi Pastelería Premium"
                    className="h-10 rounded-lg text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Logo Picker */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider block">Foto de Perfil (Logo)</Label>
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-border/50 hover:border-primary/30 transition-all rounded-xl p-3 bg-muted/10 h-28 relative group cursor-pointer">
                      {logoBase64 ? (
                        <div className="relative h-20 w-20 rounded-full overflow-hidden border border-border bg-white shadow-sm flex items-center justify-center">
                          <img src={logoBase64} alt="Logo preview" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 text-center">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground font-semibold">Subir Logo (1:1)</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Banner Picker */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider block">Banner de Portada</Label>
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-border/50 hover:border-primary/30 transition-all rounded-xl p-3 bg-muted/10 h-28 relative group cursor-pointer">
                      {bannerBase64 ? (
                        <div className="relative h-20 w-full rounded-md overflow-hidden border border-border bg-white shadow-sm flex items-center justify-center">
                          <img src={bannerBase64} alt="Banner preview" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 text-center">
                          <FileImage className="h-5 w-5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground font-semibold">Subir Portada (16:7)</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* STEP 2: BIO-LINK */}
          {step === 2 && (
            <div className="space-y-5">
              
              {/* Informative description */}
              <div className="flex gap-3 p-4 bg-primary/5 border border-primary/10 rounded-xl">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground">¿Qué es el Bio-Link?</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Es una página optimizada para móvil ideal para colocar en el enlace de tu biografía en Instagram, TikTok o WhatsApp. Reúne tu catálogo digital, tus otras redes y ubicación física en un solo lugar.
                  </p>
                </div>
              </div>

              {/* Enabled toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/30 rounded-xl">
                <div className="space-y-0.5">
                  <Label htmlFor="bio-enabled" className="text-sm font-bold text-foreground">Habilitar Link en Bio</Label>
                  <p className="text-xs text-muted-foreground">Activa tu página de redes sociales y enlaces</p>
                </div>
                <Switch
                  id="bio-enabled"
                  checked={bioEnabled}
                  onCheckedChange={setBioEnabled}
                />
              </div>

              {/* Sub-inputs when enabled */}
              {bioEnabled && (
                <div className="space-y-4 p-4 border border-border/30 rounded-xl bg-card transition-all duration-300">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider block">Tu enlace público en redes</Label>
                    <div className="flex items-center justify-between gap-3 bg-muted/30 border border-border/40 rounded-xl px-3 py-2.5">
                      <span className="font-mono text-xs text-muted-foreground truncate select-all">{bioUrl}</span>
                      <Button
                        type="button"
                        onClick={copyBioLink}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary transition-colors shrink-0"
                      >
                        {copiedLink ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="bio-desc" className="text-xs font-bold uppercase tracking-wider">Descripción Breve (Bio)</Label>
                    <Input
                      id="bio-desc"
                      value={bioDescription}
                      onChange={(e) => setBioDescription(e.target.value)}
                      placeholder="Ej. Pastelería artesanal fina. Pedidos con 24h de anticipación. Hacemos delivery."
                      className="h-10 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}

            </div>
          )}

          {/* STEP 3: FIRST PRODUCT */}
          {step === 3 && (
            <div className="space-y-5">
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="prod-name" className="text-xs font-bold uppercase tracking-wider">Nombre del Producto</Label>
                  <Input
                    id="prod-name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Ej. Torta de Chocolate Mediana"
                    className="h-10 rounded-lg text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 items-end">
                  {/* Price input */}
                  <div className="col-span-1 space-y-1.5">
                    <Label htmlFor="prod-price" className="text-xs font-bold uppercase tracking-wider">Precio (S/.)</Label>
                    <Input
                      id="prod-price"
                      type="number"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      placeholder="45.00"
                      className="h-10 rounded-lg text-sm"
                    />
                  </div>

                  {/* Image Picker */}
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider block">Foto del Producto</Label>
                    <div className="flex items-center justify-center border-2 border-dashed border-border/50 hover:border-primary/30 transition-all rounded-xl px-4 h-10 bg-muted/10 relative group cursor-pointer">
                      {productImage ? (
                        <div className="flex items-center gap-2 text-xs text-foreground font-semibold">
                          <Check className="h-4 w-4 text-emerald-600" />
                          ¡Foto cargada! (WebP)
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                          <Upload className="h-4 w-4" />
                          Seleccionar Foto
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProductImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {productImage && (
                  <div className="flex items-center justify-center border border-border/30 rounded-xl p-3 bg-muted/20 h-44 overflow-hidden relative">
                    <img src={productImage} alt="Product preview" className="h-full object-contain rounded-lg shadow-sm" />
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer con controles */}
        <div className="bg-muted/30 border-t border-border/10 p-5 flex items-center justify-between gap-3">
          {/* Botón de saltar/cerrar */}
          <Button
            variant="ghost"
            onClick={handleSkipAll}
            className="text-muted-foreground hover:text-foreground text-xs font-semibold px-3 h-9"
          >
            Saltar configuración
          </Button>

          <div className="flex items-center gap-2">
            {/* Botón de retroceso */}
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => (s - 1) as any)}
                size="sm"
                className="h-9 px-3 text-xs font-bold gap-1 rounded-lg border-border/60"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Atrás
              </Button>
            )}

            {/* Botón de guardado / avance */}
            {step === 1 && (
              <Button
                onClick={saveStep1}
                disabled={loading || !storeName.trim()}
                size="sm"
                className="h-9 px-4 text-xs font-bold gap-1 rounded-lg"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    Siguiente
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            )}

            {step === 2 && (
              <Button
                onClick={saveStep2}
                disabled={loading}
                size="sm"
                className="h-9 px-4 text-xs font-bold gap-1 rounded-lg"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    Siguiente
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            )}

            {step === 3 && (
              <Button
                onClick={handleFinishOnboarding}
                disabled={productLoading || !productName.trim() || !productImage}
                size="sm"
                className="h-9 px-4 text-xs font-bold gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {productLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Crear Producto & Finalizar
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
