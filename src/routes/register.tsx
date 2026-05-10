import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Rocket, Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import type { PlanId } from "@/lib/types";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [{ title: "Crear tu Tienda — Dizi" }],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const addStore = useApp((s) => s.addStore);
  const setCurrentStore = useApp((s) => s.setCurrentStore);
  
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState("general");
  const [selectedModel, setSelectedModel] = useState("minimalista");
  const [brandColor, setBrandColor] = useState("");
  const [loading, setLoading] = useState(false);

  // Auth states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const BRAND_COLORS = [
    { id: "default", name: "Dizi Original", hex: "#FF823A" },
    { id: "coral",   name: "Coral",         hex: "#FF823A" },
    { id: "menta",   name: "Menta",          hex: "#7bc740" },
    { id: "lavanda", name: "Lavanda",        hex: "#BC84EE" },
    { id: "indigo",  name: "Índigo",         hex: "#1E293B" },
    { id: "rose",    name: "Rosa",           hex: "#ec4899" },
    { id: "sky",     name: "Cielo",          hex: "#0ea5e9" },
    { id: "amber",   name: "Ámbar",          hex: "#f59e0b" },
    { id: "teal",    name: "Téal",           hex: "#14b8a6" },
  ];

  // Form states
  const [storeName, setStoreName] = useState("");
  const [storeLink, setStoreLink] = useState("");
  const [storePhone, setStorePhone] = useState("");

  // Plan logic — premium only via valid invite
  const searchParams = new URLSearchParams(window.location.search);
  const inviteToken = searchParams.get("invite");
  
  const invites = useApp((s) => s.invites);
  const markInviteUsed = useApp((s) => s.markInviteUsed);
  const validInvite = invites.find(i => i.token === inviteToken && !i.used);
  
  const plan = validInvite ? validInvite.plan : "semilla";
  const isPremium = plan !== "semilla";

  const niches = [
    { id: "general",   name: "General" },
    { id: "comida",    name: "Gastronomía & Fast Food" },
    { id: "bisuteria", name: "Bisutería & Accesorios" },
    { id: "ropa",      name: "Boutique & Moda" },
    { id: "tech",      name: "Tech & Electrónica" },
    { id: "servicios", name: "Servicios Profesionales" },
  ];

  const ALL_MODELS = [
    { id: "minimalista",  name: "Minimalista",      desc: "Limpio y editorial",         niches: ["general","ropa","bisuteria"],   p: { bg: "#ffffff", card: "#f1f5f9", accent: "#FF823A", dark: false } },
    { id: "nocturno",     name: "Modo Tech Dark",   desc: "Interfaz nocturna inmersiva", niches: ["tech"],                         p: { bg: "#0f172a", card: "#1e293b", accent: "#818cf8", dark: true  } },
    { id: "vibrante",     name: "Vibrante Food",    desc: "Despierta el apetito",       niches: ["comida"],                       p: { bg: "#fff7ed", card: "#ffffff", accent: "#FF823A", dark: false } },
    { id: "luxury",       name: "Elegance Gold",    desc: "Lujo oscuro y dorado",       niches: ["bisuteria","ropa"],             p: { bg: "#09090b", card: "#18181b", accent: "#ca8a04", dark: true  } },
    { id: "eco",          name: "Eco Nature",       desc: "Orgánico y sustentable",     niches: ["servicios","general"],         p: { bg: "#f0fdf4", card: "#ffffff", accent: "#16a34a", dark: false } },
    { id: "pastel",       name: "Pastel Sweet",     desc: "Suave, dulce y femenino",    niches: ["ropa","bisuteria"],            p: { bg: "#fdf2f8", card: "#ffffff", accent: "#BC84EE", dark: false } },
    { id: "boutique",     name: "Boutique Glam",    desc: "Elegante y fashion",         niches: ["ropa","bisuteria"],            p: { bg: "#faf9f7", card: "#f5efe8", accent: "#9333ea", dark: false } },
    { id: "clasico",      name: "Clásico Creme",   desc: "Calidez atemporal",          niches: ["general","servicios"],         p: { bg: "#fdfaf5", card: "#fef9ef", accent: "#92400e", dark: false } },
    { id: "neon",         name: "Neon Tech",        desc: "Cian futurista y vibrante",  niches: ["tech"],                         p: { bg: "#030712", card: "#0c1120", accent: "#06b6d4", dark: true  } },
    { id: "dark_fashion", name: "Dark Fashion",     desc: "Ultra negro y minimalista",  niches: ["ropa"],                         p: { bg: "#111111", card: "#1c1c1c", accent: "#f5f5f5", dark: true  } },
    { id: "tropical",     name: "Tropical Market",  desc: "Fresco y vibrante",          niches: ["comida","general"],            p: { bg: "#ecfdf5", card: "#ffffff", accent: "#d97706", dark: false } },
    { id: "corporativo",  name: "Corporativo",      desc: "Azul profesional y serio",   niches: ["servicios"],                   p: { bg: "#eff6ff", card: "#ffffff", accent: "#1d4ed8", dark: false } },
    { id: "moderno",      name: "Moderno Contrast",  desc: "B&N de alto impacto",        niches: ["tech","general"],              p: { bg: "#fafafa", card: "#18181b", accent: "#27272a", dark: false } },
    { id: "terroso",      name: "Terroso Artesanal", desc: "Tonos tierra orgánicos",    niches: ["comida","servicios"],          p: { bg: "#fef3c7", card: "#fde68a", accent: "#92400e", dark: false } },
    { id: "marina",       name: "Marina Azul",       desc: "Fresco marítimo y limpio",   niches: ["servicios","general"],         p: { bg: "#f0f9ff", card: "#e0f2fe", accent: "#0284c7", dark: false } },
    { id: "candy",        name: "Candy Pop",         desc: "Colorido y juvenil",         niches: ["comida","bisuteria"],          p: { bg: "#fff0f7", card: "#ffffff", accent: "#ec4899", dark: false } },
    { id: "rose_gold",    name: "Rose Gold",         desc: "Delicado y premium rosado",  niches: ["bisuteria","ropa"],            p: { bg: "#1a0a0a", card: "#2d1515", accent: "#f4a5a5", dark: true  } },
    { id: "forest",       name: "Forest Green",      desc: "Verde bosque profundo",      niches: ["servicios","general"],         p: { bg: "#052e16", card: "#14532d", accent: "#86efac", dark: true  } },
    { id: "sunset",       name: "Sunset Warm",       desc: "Atardecer dorado y cálido",  niches: ["comida","general"],            p: { bg: "#fff7ed", card: "#ffedd5", accent: "#ea580c", dark: false } },
    { id: "ice",          name: "Ice Crystal",       desc: "Blanco glacial ultramoderno",niches: ["ropa","tech"],                 p: { bg: "#f8fafc", card: "#e2e8f0", accent: "#38bdf8", dark: false } },
    { id: "urban",        name: "Urban Street",      desc: "Urbano y dinámico",         niches: ["tech","ropa"],                 p: { bg: "#18181b", card: "#27272a", accent: "#facc15", dark: true  } },
  ];

  // Para plan Semilla: mostrar todos (el primero es gratis, el resto marcados como PRO)
  // Para planes Premium: filtrar por nicho seleccionado + todos disponibles
  const models = isPremium
    ? ALL_MODELS.map(m => ({
        ...m,
        locked: false,
        recommended: m.niches.includes(selectedNiche),
      }))
    : ALL_MODELS.map((m, idx) => ({
        ...m,
        locked: idx > 0,
        recommended: false,
      }));

  const getRecommendation = (niche: string) => {
    switch (niche) {
      case "tech":      return { color: "#1E293B" };
      case "comida":    return { color: "#FF823A" };
      case "bisuteria": return { color: "#BC84EE" };
      case "ropa":      return { color: "#FF823A" };
      case "servicios": return { color: "#14b8a6" };
      default:          return { color: "#FF823A" };
    }
  };

  // Auto-seleccionar al cambiar de nicho
  useEffect(() => {
    if (isPremium) {
      const rec = getRecommendation(selectedNiche);
      setBrandColor(rec.color);
      // recomendar el primer modelo del nicho
      const first = ALL_MODELS.find(m => m.niches.includes(selectedNiche));
      if (first) setSelectedModel(first.id);
    } else {
      setSelectedModel("minimalista");
      setBrandColor("#FF823A");
    }
  }, [selectedNiche, isPremium]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        // 1. Crear usuario en Supabase Auth
        const { data: authData, error: authError } = await import("@/lib/supabase").then(m => 
          m.supabase.auth.signUp({
            email: email.trim(),
            password: password,
            options: {
              data: {
                full_name: fullName,
                role: "store_owner"
              }
            }
          })
        );

        if (authError) throw authError;
        if (!authData.user) throw new Error("No se pudo crear el usuario.");

        const newStoreId = "s_" + Math.random().toString(36).substring(2, 9);
        
        // 2. Productos señuelo enriquecidos
        const sampleProducts = selectedNiche === "comida" ? [
          { id: "p1", name: "Hamburguesa Clásica Artesanal", price: 18.50, categoryId: "c1", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80", visible: true, isSample: true, description: "Deliciosa hamburguesa con carne de res 100% y vegetales frescos." },
          { id: "p2", name: "Papas Fritas Rústicas", price: 8.00, categoryId: "c1", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80", visible: true, isSample: true, description: "Porción grande de papas crujientes con especias.", isOnSale: true, originalPrice: 12.00 },
          { id: "p3", name: "Pizza Margarita Familiar", price: 35.00, categoryId: "c1", image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80", visible: true, isSample: true, description: "Masa madre, salsa casera y extra queso mozzarella fundido." },
        ] : selectedNiche === "bisuteria" ? [
          { id: "p1", name: "Collar de Plata 925", price: 45.00, categoryId: "c1", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80", visible: true, isSample: true, description: "Elegante diseño minimalista en plata fina." },
          { id: "p2", name: "Anillo de Oro Rosa", price: 120.00, categoryId: "c1", image: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=600&q=80", visible: true, isSample: true, description: "Acabado brillante con detalles únicos de lujo." },
          { id: "p3", name: "Reloj Minimalista", price: 85.00, categoryId: "c1", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80", visible: true, isSample: true, description: "Para cualquier ocasión, elegante y resistente al agua." },
        ] : [
          { id: "p1", name: "Ejemplo: Lentes de Sol", price: 45.00, categoryId: "c1", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80", visible: true, isSample: true, description: "Diseño clásico y protección UV400 completa." },
          { id: "p2", name: "Ejemplo: Bolso de Cuero", price: 120.00, categoryId: "c1", image: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&w=600&q=80", visible: true, isSample: true, description: "Hecho a mano con materiales de alta calidad." },
          { id: "p3", name: "Ejemplo: Taza de Cerámica", price: 15.00, categoryId: "c1", image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=600&q=80", visible: true, isSample: true, description: "Diseño minimalista premium, ideal para el hogar." },
        ];

        // 3. Crear tienda vinculada al owner_id
        await addStore({
          id: newStoreId,
          slug: storeLink || `tienda-${Date.now()}`,
          name: storeName || "Mi Nueva Tienda",
          phone: storePhone.startsWith('51') ? storePhone : `51${storePhone}`,
          countryCode: "51",
          plan: plan as PlanId,
          active: true,
          isPublished: true,
          createdAt: new Date().toISOString().split("T")[0],
          whatsappClicks: 0,
          model: selectedModel as any,
          brandColor: brandColor || undefined,
          ownerId: authData.user.id,
          niche: selectedNiche,
          categories: [{ id: "c1", name: "Principal" }],
          products: sampleProducts,
        });

        if (validInvite) {
          markInviteUsed(validInvite.token);
        }
        
        const { toast } = await import("sonner");
        toast.success("Tienda creada con exito. Bienvenido a Dizi.");
        
        setCurrentStore(newStoreId);
        navigate({ to: "/admin" });
      } catch (err: any) {
        const { toast } = await import("sonner");
        toast.error(err.message || "Error al registrarte.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col" translate="no">
      <div className="p-4">
        <Button variant="ghost" asChild className="gap-2">
          <Link to="/">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-background rounded-3xl border shadow-xl p-8 relative overflow-hidden">


          {validInvite && (
            <div className="absolute top-0 inset-x-0 bg-primary text-primary-foreground text-xs font-bold text-center py-1.5 px-4 tracking-wide z-10">
              ¡Invitación Especial Activa: Plan {plan.toUpperCase()}!
            </div>
          )}

          <div className={`text-center mb-8 relative ${validInvite ? 'pt-4' : ''}`}>
            <img src="/images/Icono.png" alt="Dizi Icon" className="mx-auto h-16 w-16 object-contain mb-4" />
            <h1 className="text-2xl font-bold tracking-tight">Crea tu tienda en 2 minutos</h1>
            <p className="text-muted-foreground text-sm mt-2">
              Paso {step} de 3: {step === 1 ? 'Datos de tu cuenta' : step === 2 ? 'Datos de tu negocio' : 'Personaliza tu Catálogo'}
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-1.5 mb-8">
            <div 
              className="bg-primary h-1.5 rounded-full transition-all duration-300" 
              style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
            />
          </div>

          <form onSubmit={handleRegister} className="space-y-4 relative">
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre Completo</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="flex h-12 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    placeholder="Ej. Juan Perez"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Correo Electronico</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex h-12 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    placeholder="tu@correo.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contrasena</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex h-12 w-full rounded-xl border border-input bg-transparent pl-3 pr-10 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 text-base mt-4">
                  Siguiente paso
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre de tu Tienda</label>
                  <input 
                    type="text" 
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="flex h-12 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    placeholder="Ej. Novedades María"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Link de tu Catálogo</label>
                  <div className="flex rounded-xl border border-input shadow-sm focus-within:ring-1 focus-within:ring-primary overflow-hidden">
                    <span className="flex items-center px-3 bg-muted/50 text-muted-foreground text-sm border-r">
                      dizi.pe/t/
                    </span>
                    <input 
                      type="text" 
                      value={storeLink}
                      onChange={(e) => setStoreLink(e.target.value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                      className="flex h-12 w-full bg-transparent px-3 py-1 text-sm focus-visible:outline-none"
                      placeholder="novedades-maria"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">WhatsApp de Ventas</label>
                  <div className="flex rounded-xl border border-input shadow-sm focus-within:ring-1 focus-within:ring-primary overflow-hidden">
                    <span className="flex items-center px-3 bg-muted/50 text-muted-foreground text-sm border-r">
                      +51
                    </span>
                    <input 
                      type="tel" 
                      value={storePhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (val.length <= 9) setStorePhone(val);
                      }}
                      className="flex h-12 w-full bg-transparent px-3 py-1 text-sm focus-visible:outline-none"
                      placeholder="999 888 777"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="h-12 w-12 shrink-0" onClick={() => setStep(1)}>
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <Button type="submit" className="flex-1 h-12 text-base">
                    Siguiente paso
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                
                {/* NICHO: Solo visible para planes Premium */}
                {isPremium && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex justify-between">
                      <span>Nicho de Mercado</span>
                      <span className="text-xs text-primary font-semibold">Plan {plan.charAt(0).toUpperCase() + plan.slice(1)}</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {niches.map((niche) => (
                        <div
                          key={niche.id}
                          onClick={() => setSelectedNiche(niche.id)}
                          className={`relative p-3 rounded-xl border text-sm font-medium text-center transition-all cursor-pointer ${selectedNiche === niche.id ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-background hover:border-primary/50 hover:bg-primary/5'}`}
                        >
                          {niche.name}
                        </div>
                      ))}
                    </div>
                    {/* Indicador de recomendación */}
                    <p className="text-xs text-muted-foreground">
                      Selecciona tu nicho y te recomendaremos el mejor diseño para tu tipo de negocio.
                    </p>
                  </div>
                )}

                {/* MODELOS */}
                <div className="space-y-3">
                  <label className="text-sm font-medium flex justify-between">
                    <span>Modelo de Catálogo</span>
                    {!isPremium && (
                      <Link to="/#precios" className="text-xs text-primary font-bold cursor-pointer hover:underline flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Desbloquea todos con PRO →
                      </Link>
                    )}
                    {isPremium && (
                      <span className="text-xs text-muted-foreground">{models.filter(m => m.recommended).length} recomendados para ti</span>
                    )}
                  </label>
                  <div className="grid gap-2 max-h-[320px] overflow-y-auto pr-1">
                    {/* Recomendados primero (solo para premium) */}
                    {isPremium && models.filter(m => m.recommended).length > 0 && (
                      <>
                        <div className="flex items-center gap-1 px-1">
                          <Star className="w-3 h-3 text-primary fill-primary" />
                          <p className="text-[11px] font-bold text-primary uppercase tracking-widest">Recomendados para ti</p>
                        </div>
                        {models.filter(m => m.recommended).map((m) => (
                          <div
                            key={m.id + "_rec"}
                            onClick={() => setSelectedModel(m.id)}
                            className={`relative p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${selectedModel === m.id ? 'bg-primary/5 border-primary ring-1 ring-primary shadow-sm' : 'bg-background hover:border-primary/40'}`}
                          >
                            {/* CSS Mini-Preview */}
                            <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden border" style={{ backgroundColor: m.p.bg }}>
                              <div className="h-3 w-full" style={{ backgroundColor: m.p.accent }} />
                              <div className="p-1 flex flex-col gap-1">
                                <div className="h-1.5 rounded-full w-4/5" style={{ backgroundColor: m.p.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }} />
                                <div className="h-1.5 rounded-full w-3/5" style={{ backgroundColor: m.p.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />
                                <div className="flex gap-1 mt-0.5">
                                  <div className="h-5 w-5 rounded" style={{ backgroundColor: m.p.card, border: `1px solid ${m.p.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }} />
                                  <div className="h-5 w-5 rounded" style={{ backgroundColor: m.p.card, border: `1px solid ${m.p.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }} />
                                </div>
                              </div>
                            </div>
                            <div className="flex-1 text-left">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm">{m.name}</span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-primary text-primary-foreground uppercase tracking-wider">Ideal</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">{m.desc}</div>
                            </div>
                            {selectedModel === m.id && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                          </div>
                        ))}
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1 pt-1">Todos los modelos</p>
                      </>
                    )}
                    {/* Todos los modelos */}
                    {models.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => !m.locked && setSelectedModel(m.id)}
                        className={`relative p-3 rounded-xl border flex items-center gap-3 transition-all ${m.locked ? 'opacity-60 cursor-not-allowed' : selectedModel === m.id ? 'bg-primary/5 border-primary ring-1 ring-primary shadow-sm cursor-pointer' : 'bg-background hover:border-primary/40 cursor-pointer'}`}
                      >
                        {/* CSS Mini-Preview */}
                        <div className={`w-14 h-14 shrink-0 rounded-lg overflow-hidden border ${m.locked && 'grayscale opacity-70'}`} style={{ backgroundColor: m.p.bg }}>
                          <div className="h-3 w-full" style={{ backgroundColor: m.locked ? '#ccc' : m.p.accent }} />
                          <div className="p-1 flex flex-col gap-1">
                            <div className="h-1.5 rounded-full w-4/5" style={{ backgroundColor: m.p.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }} />
                            <div className="h-1.5 rounded-full w-3/5" style={{ backgroundColor: m.p.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />
                            <div className="flex gap-1 mt-0.5">
                              <div className="h-5 w-5 rounded" style={{ backgroundColor: m.p.card, border: `1px solid ${m.p.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }} />
                              <div className="h-5 w-5 rounded" style={{ backgroundColor: m.p.card, border: `1px solid ${m.p.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }} />
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-bold text-sm leading-tight">{m.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{m.desc}</div>
                        </div>
                        {!m.locked && selectedModel === m.id && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                        {m.locked && (
                          <Link to="/#precios" className="flex items-center gap-1 text-[10px] font-bold bg-muted hover:bg-primary/10 hover:text-primary px-2 py-1 rounded text-muted-foreground shrink-0 transition-colors">
                            <Lock className="w-3 h-3" /> PRO
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* COLOR DE MARCA */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Color de tu Marca <span className="text-muted-foreground font-normal">(Opcional)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {BRAND_COLORS.map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setBrandColor(color.hex)}
                        title={color.name}
                        className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center ${brandColor === color.hex ? 'border-foreground scale-110 shadow-lg' : 'border-transparent hover:scale-105 shadow-sm hover:border-foreground/30'}`}
                        style={{ backgroundColor: color.hex }}
                      >
                        {brandColor === color.hex && <CheckCircle2 className="w-4 h-4 text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(2)} className="h-12 w-12 shrink-0 rounded-xl border border-input flex items-center justify-center hover:bg-muted transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <Button type="submit" className="flex-1 h-12 text-base" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Creando tienda...
                      </span>
                    ) : (
                      <>
                        Lanzar Catálogo <Rocket className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>

          {step === 1 && (
            <div className="mt-8 text-center text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Inicia sesión aquí
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

