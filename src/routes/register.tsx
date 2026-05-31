import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Rocket, Eye, EyeOff, Lock, CheckCircle2, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import type { PlanId } from "@/lib/types";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Crear tu Catálogo Digital Gratis — Dizi" },
      { name: "description", content: "Registra tu negocio en Dizi y crea tu catálogo digital gratis en 2 minutos. Empieza a vender por WhatsApp hoy mismo." },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [
      { rel: "canonical", href: "https://dizi.idenza.site/register" },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const addStore = useApp((s) => s.addStore);
  const setCurrentStore = useApp((s) => s.setCurrentStore);
  const markInviteUsed = useApp((s) => s.markInviteUsed);

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState("general");
  const [selectedModel, setSelectedModel] = useState("minimalista");
  const [brandColor, setBrandColor] = useState("");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Invite state — se valida contra Supabase al montar el componente
  const [invitePlan, setInvitePlan] = useState<PlanId | null>(null);
  const [inviteDurationMonths, setInviteDurationMonths] = useState<number>(1);
  const [inviteLoading, setInviteLoading] = useState(false);

  const BRAND_COLORS = [
    { id: "coral",   name: "Coral (Dizi)",   hex: "#FF823A" },
    { id: "menta",   name: "Menta",          hex: "#7bc740" },
    { id: "lavanda", name: "Lavanda",        hex: "#BC84EE" },
    { id: "indigo",  name: "Indigo",         hex: "#1E293B" },
    { id: "rose",    name: "Rosa",           hex: "#ec4899" },
    { id: "sky",     name: "Cielo",          hex: "#0ea5e9" },
    { id: "amber",   name: "Ambar",          hex: "#f59e0b" },
    { id: "teal",    name: "Teal",           hex: "#14b8a6" },
  ];

  // Form states
  const [storeName, setStoreName] = useState("");
  const [storeLink, setStoreLink] = useState("");
  const [storePhone, setStorePhone] = useState("");

  // Leer token de la URL
  const inviteToken = new URLSearchParams(window.location.search).get("invite");

  // Validar invite contra Supabase al montar
  useEffect(() => {
    if (!inviteToken) return;
    setInviteLoading(true);
    supabase
      .from("invites")
      .select("plan, used, expires_at, duration_months")
      .eq("token", inviteToken)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          console.warn("[register] Invite no encontrado o error:", error?.message);
        } else if (data.used) {
          console.warn("[register] Invite ya fue usado");
        } else if (new Date(data.expires_at) < new Date()) {
          console.warn("[register] Invite expirado");
        } else {
          setInvitePlan(data.plan as PlanId);
          setInviteDurationMonths(data.duration_months ?? 1);
        }
        setInviteLoading(false);
      });
  }, [inviteToken]);

  const plan: PlanId = invitePlan ?? "semilla";
  const isPremium = plan !== "semilla";

  const niches = [
    { id: "general",   name: "General" },
    { id: "comida",    name: "Gastronomia & Fast Food" },
    { id: "bisuteria", name: "Bisuteria & Accesorios" },
    { id: "ropa",      name: "Boutique & Moda" },
    { id: "tech",      name: "Tech & Electronica" },
    { id: "servicios", name: "Servicios Profesionales" },
  ];

  // Modelos sincronizados exactamente con admin.diseno.tsx
  const ALL_MODELS = [
    // Semilla (0)
    { id: "minimalista",  name: "Minimalista",       desc: "Limpio, moderno y atemporal.",              planLevel: 0, niches: ["general","ropa","bisuteria","floreria"], p: { bg: "#ffffff", card: "#f8fafc", accent: "#4f46e5", dark: false } },
    { id: "clasico",      name: "Clasico Calido",    desc: "Tipografia serif y tonos terrosos.",        planLevel: 0, niches: ["general","servicios","comida","floreria"], p: { bg: "#fdfaf5", card: "#fef9ef", accent: "#92400e", dark: false } },
    // Emprendedor (1)
    { id: "nature_mint",  name: "Nature Mint",       desc: "Verde teal fresco. Salud y cafes.",         planLevel: 1, niches: ["servicios","general","floreria"],         p: { bg: "#f0fefb", card: "#ffffff", accent: "#0d9488", dark: false } },
    { id: "vibrante",     name: "Vibrante",          desc: "Energetico tipo Instagram Shopping.",       planLevel: 1, niches: ["comida","ropa","general"],                p: { bg: "#fff7ed", card: "#ffffff", accent: "#ea580c", dark: false } },
    { id: "eco",          name: "Eco Hero",          desc: "Banner hero panoramico + galeria.",         planLevel: 1, niches: ["servicios","general","floreria"],         p: { bg: "#f0fdf4", card: "#ffffff", accent: "#16a34a", dark: false } },
    // Pro (2)
    { id: "nocturno",     name: "Nocturno",          desc: "Dark mode de alto impacto.",                planLevel: 2, niches: ["tech","ropa"],                           p: { bg: "#0f172a", card: "#1e293b", accent: "#818cf8", dark: true  } },
    { id: "elite",        name: "Elite",             desc: "Banner cinematografico. Identidad fuerte.", planLevel: 2, niches: ["general","ropa","tech"],                 p: { bg: "#ffffff", card: "#ffffff", accent: "#1e1e1e", dark: false } },
    { id: "boutique",     name: "Boutique",          desc: "Editorial fashion. Estilo Farfetch.",       planLevel: 2, niches: ["ropa","bisuteria"],                      p: { bg: "#faf9f7", card: "#f5efe8", accent: "#9333ea", dark: false } },
    { id: "corporativo",  name: "Corporativo Azul",  desc: "Lista profesional. Servicios.",             planLevel: 2, niches: ["servicios"],                             p: { bg: "#eff6ff", card: "#ffffff", accent: "#1d4ed8", dark: false } },
    { id: "aurora",       name: "Aurora Glass",      desc: "Glassmorphism con degradado cosmico.",      planLevel: 2, niches: ["tech","bisuteria"],                      p: { bg: "#0d0d1a", card: "#1a1040", accent: "#a855f7", dark: true  } },
    // Ilimitado (3)
    { id: "luxury",       name: "Luxury Gold",       desc: "Oscuro, dorado, intemporal.",               planLevel: 3, niches: ["bisuteria","ropa"],                      p: { bg: "#09090b", card: "#18181b", accent: "#ca8a04", dark: true  } },
    { id: "dark_fashion", name: "Dark Fashion",      desc: "Revista editorial oscura.",                 planLevel: 3, niches: ["ropa"],                                  p: { bg: "#111111", card: "#1c1c1c", accent: "#f5f5f5", dark: true  } },
    { id: "slash",        name: "Slash Diagonal",    desc: "Cortes diagonales. Estilo Nike.",           planLevel: 3, niches: ["ropa","tech"],                           p: { bg: "#0d1117", card: "#1c2128", accent: "#faec45", dark: true  } },
    { id: "arch_studio",  name: "Arch Studio",       desc: "Marcos en arco. Elegante y ligero.",        planLevel: 3, niches: ["servicios","general","floreria"],        p: { bg: "#faf9f6", card: "#f4f2ed", accent: "#9c6b4e", dark: false } },
    { id: "portada",      name: "Portada con Banner",desc: "Banner personalizable + grid 2 columnas.",  planLevel: 3, niches: ["general","floreria","comida"],            p: { bg: "#ffffff", card: "#f8fafc", accent: "#FF823A", dark: false } },
    { id: "sunset_glow",  name: "Sunset Glow",       desc: "Degradado atardecer con cards flotantes.",  planLevel: 3, niches: ["ropa","bisuteria","floreria"],           p: { bg: "#1a0a2e", card: "#2d1040", accent: "#fb923c", dark: true  } },
    { id: "forest_deep",  name: "Forest Deep",       desc: "Bosque oscuro. Fotografico y organico.",    planLevel: 3, niches: ["servicios","general"],                   p: { bg: "#0d1f0f", card: "#1a2e1c", accent: "#4ade80", dark: true  } },
  ];

  const planLevelMap: Record<PlanId, number> = { semilla: 0, emprendedor: 1, pro: 2, ilimitado: 3 };
  const userPlanLevel = planLevelMap[plan];

  const models = ALL_MODELS.map(m => ({
    ...m,
    locked: m.planLevel > userPlanLevel,
    recommended: m.niches.includes(selectedNiche),
  }));

  useEffect(() => {
    // Al cambiar nicho, seleccionar el primer modelo disponible para ese nicho y plan
    const first = ALL_MODELS.find(m => m.niches.includes(selectedNiche) && m.planLevel <= userPlanLevel);
    if (first) setSelectedModel(first.id);
    else setSelectedModel(userPlanLevel === 0 ? "minimalista" : ALL_MODELS.find(m => m.planLevel <= userPlanLevel)?.id ?? "minimalista");
  }, [selectedNiche, plan]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        const { data: existingStore } = await supabase
          .from("stores").select("id").eq("slug", storeLink).single();

        if (existingStore) {
          const { toast } = await import("sonner");
          toast.error("El link de la tienda ya esta en uso. Por favor, elige otro.");
          setLoading(false);
          return;
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: { full_name: storeName, role: "store_owner" }
          }
        });

        let userId = authData.user?.id;

        if (authError) {
          if (authError.message?.includes("already registered") || authError.status === 422) {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: email.trim(),
              password: password,
            });
            if (signInError) {
              throw new Error("Este correo ya esta registrado. Por favor, inicia sesion con tu contrasena.");
            }
            userId = signInData.user?.id;
          } else {
            throw authError;
          }
        }

        if (!userId) throw new Error("No se pudo obtener el ID del usuario.");

        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password,
          });
          if (signInError) throw new Error("Cuenta creada pero no se pudo iniciar sesion automaticamente.");
        }

        const newStoreId = "s_" + Math.random().toString(36).substring(2, 9);
        const newCategoryId = "c_" + Math.random().toString(36).substring(2, 9);

        // Calcular fecha de vencimiento del plan si es de pago
        const planExpiresAt = plan !== "semilla" && inviteDurationMonths
          ? (() => {
              const d = new Date();
              d.setMonth(d.getMonth() + inviteDurationMonths);
              return d.toISOString();
            })()
          : undefined;

        await addStore({
          id: newStoreId,
          slug: storeLink || `tienda-${Date.now()}`,
          name: storeName || "Mi Nueva Tienda",
          phone: storePhone.startsWith("51") ? storePhone : `51${storePhone}`,
          countryCode: "51",
          plan: plan as PlanId,
          active: true,
          isPublished: true,
          createdAt: new Date().toISOString().split("T")[0],
          whatsappClicks: 0,
          model: selectedModel as any,
          brandColor: brandColor || undefined,
          ownerId: userId,
          niche: selectedNiche,
          planExpiresAt,
          subscriptionStatus: plan === "semilla" ? "trial" : "active",
          planDurationMonths: plan !== "semilla" ? inviteDurationMonths : undefined,
          categories: [{ id: newCategoryId, name: "Principal" }],
          products: [],
        });

        if (inviteToken && invitePlan) {
          // Pasar el storeId para que active_subscription se llame correctamente
          await markInviteUsed(inviteToken, newStoreId);
        }

        const { toast } = await import("sonner");
        toast.success("Tienda creada con exito. Bienvenido a Dizi.");

        setCurrentStore(newStoreId);
        navigate({ to: "/admin" });
      } catch (err: any) {
        console.error("Registration error:", err);
        const { toast } = await import("sonner");

        let errorMessage = "Error al registrarte.";
        if (err.message?.includes("stores_slug_key")) {
          errorMessage = "El link de la tienda ya esta en uso. Por favor, elige otro.";
        } else if (err.message?.includes("categories_pkey")) {
          errorMessage = "Error de sistema al crear la categoria. Por favor, intenta de nuevo.";
        } else if (err.status === 429 || err.message?.includes("rate limit")) {
          errorMessage = "Demasiados intentos. Por favor, intentalo mas tarde.";
        } else if (err.message?.includes("User already registered")) {
          errorMessage = "Este correo ya tiene una cuenta. Intenta iniciar sesion.";
        } else {
          errorMessage = err.message || errorMessage;
        }

        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #fff7f0 0%, #ffffff 50%, #f5f0ff 100%)" }} translate="no">

      {/* Header minimalista */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <Link to="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Inicio</span>
        </Link>
        <img src="/images/Icono.png" alt="Dizi" className="h-8 w-8 object-contain" />
      </div>

      <div className="flex-1 flex flex-col items-center px-4 pt-4 pb-8 gap-5">

        {/* Banners de invite */}
        {inviteLoading && (
          <div className="w-full max-w-sm rounded-2xl bg-muted text-muted-foreground text-xs font-medium text-center py-2 px-4">
            Verificando invitacion...
          </div>
        )}
        {!inviteLoading && invitePlan && (
          <div className="w-full max-w-sm rounded-2xl bg-primary text-primary-foreground text-xs font-bold text-center py-2 px-4">
            Invitacion activa: Plan {plan.toUpperCase()}
          </div>
        )}
        {!inviteLoading && inviteToken && !invitePlan && (
          <div className="w-full max-w-sm rounded-2xl bg-destructive text-destructive-foreground text-xs font-bold text-center py-2 px-4">
            Enlace invalido o expirado — se aplicara plan Semilla
          </div>
        )}

        {/* Titulo */}
        <div className="text-center w-full max-w-sm">
          <h1 className="text-2xl font-black tracking-tight text-foreground">Crea tu catalogo</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">gratis en 3 pasos</p>
        </div>

        {/* Stepper visual */}
        <div className="flex items-center gap-2 w-full max-w-sm">
          {[1,2,3].map((s) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === s ? "bg-primary text-white shadow-md scale-110" : step > s ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              <span className={`text-[10px] font-medium ${step === s ? "text-primary" : "text-muted-foreground"}`}>
                {s === 1 ? "Negocio" : s === 2 ? "Diseño" : "Cuenta"}
              </span>
            </div>
          ))}
          <div className="absolute left-0 right-0" />
        </div>

        {/* Card del formulario */}
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg border border-gray-100 p-5 relative">

          <form onSubmit={handleRegister} className="space-y-4 relative">

            {/* PASO 1 — Datos del negocio */}
            {step === 1 && (
              <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nombre de tu Negocio</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    placeholder="Ej. Floreria Maria"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">WhatsApp de Ventas</label>
                  <div className="flex rounded-xl border border-input shadow-sm focus-within:ring-1 focus-within:ring-primary overflow-hidden">
                    <span className="flex items-center px-3 bg-muted/50 text-muted-foreground text-sm border-r font-medium">+51</span>
                    <input
                      type="tel"
                      value={storePhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (val.length <= 9) setStorePhone(val);
                      }}
                      className="flex h-11 w-full bg-transparent px-3 text-sm focus-visible:outline-none"
                      placeholder="999 888 777"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 active:scale-95 text-white text-sm font-bold tracking-wide shadow-md shadow-primary/30 transition-all duration-150 mt-1">
                  Siguiente paso
                </button>
                <div className="pt-1 border-t flex flex-col items-center gap-2">
                  <p className="text-xs text-muted-foreground">¿Necesitas ayuda con el registro?</p>
                  <a
                    href="https://wa.me/51925176472?text=Hola%2C%20necesito%20ayuda%20para%20registrarme%20en%20Dizi"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.528 5.852L0 24l6.324-1.508A11.956 11.956 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.002-1.366l-.358-.213-3.752.894.952-3.653-.233-.374A9.818 9.818 0 1112 21.818z"/>
                    </svg>
                    Escríbenos por WhatsApp
                  </a>
                </div>
              </div>
            )}

            {/* PASO 2 — Diseño */}
            {step === 2 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-3">
                  <label className="text-sm font-medium flex justify-between">
                    <span>Modelo de Catalogo</span>
                    {userPlanLevel === 0 && (
                      <span className="text-xs text-muted-foreground">2 disponibles en Semilla</span>
                    )}
                  </label>
                  <div className="grid gap-2 max-h-[280px] overflow-y-auto pr-1">
                    {/* Recomendados para el nicho */}
                    {models.filter(m => m.recommended && !m.locked).length > 0 && (
                      <>
                        <div className="flex items-center gap-1 px-1">
                          <Star className="w-3 h-3 text-primary fill-primary" />
                          <p className="text-[11px] font-bold text-primary uppercase tracking-widest">Sugeridos para tu negocio</p>
                        </div>
                        {models.filter(m => m.recommended && !m.locked).map((m) => (
                          <div
                            key={m.id + "_rec"}
                            onClick={() => setSelectedModel(m.id)}
                            className={`relative p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${selectedModel === m.id ? "bg-primary/5 border-primary ring-1 ring-primary shadow-sm" : "bg-background hover:border-primary/40"}`}
                          >
                            <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden border" style={{ backgroundColor: m.p.bg }}>
                              <div className="h-3 w-full" style={{ backgroundColor: m.p.accent }} />
                              <div className="p-1 flex flex-col gap-1">
                                <div className="h-1.5 rounded-full w-4/5" style={{ backgroundColor: m.p.dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)" }} />
                                <div className="h-1.5 rounded-full w-3/5" style={{ backgroundColor: m.p.dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }} />
                                <div className="flex gap-1 mt-0.5">
                                  <div className="h-5 w-5 rounded" style={{ backgroundColor: m.p.card, border: `1px solid ${m.p.dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}` }} />
                                  <div className="h-5 w-5 rounded" style={{ backgroundColor: m.p.card, border: `1px solid ${m.p.dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}` }} />
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
                        className={`relative p-3 rounded-xl border flex items-center gap-3 transition-all ${m.locked ? "opacity-50 cursor-not-allowed bg-muted/30" : selectedModel === m.id ? "bg-primary/5 border-primary ring-1 ring-primary shadow-sm cursor-pointer" : "bg-background hover:border-primary/40 cursor-pointer"}`}
                      >
                        <div className={`w-14 h-14 shrink-0 rounded-lg overflow-hidden border ${m.locked ? "grayscale" : ""}`} style={{ backgroundColor: m.p.bg }}>
                          <div className="h-3 w-full" style={{ backgroundColor: m.locked ? "#ccc" : m.p.accent }} />
                          <div className="p-1 flex flex-col gap-1">
                            <div className="h-1.5 rounded-full w-4/5" style={{ backgroundColor: m.p.dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)" }} />
                            <div className="h-1.5 rounded-full w-3/5" style={{ backgroundColor: m.p.dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }} />
                            <div className="flex gap-1 mt-0.5">
                              <div className="h-5 w-5 rounded" style={{ backgroundColor: m.p.card, border: `1px solid ${m.p.dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}` }} />
                              <div className="h-5 w-5 rounded" style={{ backgroundColor: m.p.card, border: `1px solid ${m.p.dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}` }} />
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-bold text-sm leading-tight">{m.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{m.desc}</div>
                        </div>
                        {!m.locked && selectedModel === m.id && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                        {m.locked && (
                          <span className="flex items-center gap-1 text-[10px] font-bold bg-muted px-2 py-1 rounded text-muted-foreground shrink-0">
                            <Lock className="w-3 h-3" /> PRO
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Color de tu Marca <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {BRAND_COLORS.map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setBrandColor(color.hex)}
                        title={color.name}
                        className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center ${brandColor === color.hex ? "border-foreground scale-110 shadow-lg" : "border-transparent hover:scale-105 shadow-sm hover:border-foreground/30"}`}
                        style={{ backgroundColor: color.hex }}
                      >
                        {brandColor === color.hex && <CheckCircle2 className="w-4 h-4 text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setStep(1)} className="h-12 w-12 shrink-0 rounded-2xl border-2 border-input bg-white hover:bg-muted active:scale-95 transition-all flex items-center justify-center shadow-sm">
                    <ArrowLeft className="w-4 h-4 text-foreground" />
                  </button>
                  <button type="submit" className="flex-1 h-12 rounded-2xl bg-primary hover:bg-primary/90 active:scale-95 text-white text-sm font-bold tracking-wide shadow-md shadow-primary/30 transition-all duration-150">
                    Siguiente paso
                  </button>
                </div>
              </div>
            )}

            {/* PASO 3 — Credenciales */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 text-sm text-primary font-medium">
                  Ya casi listo. Crea tu cuenta para guardar tu catalogo.
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Link de tu Catalogo</label>
                  <div className="flex rounded-xl border border-input shadow-sm focus-within:ring-1 focus-within:ring-primary overflow-hidden">
                    <span className="flex items-center px-3 bg-muted/50 text-muted-foreground text-sm border-r whitespace-nowrap">
                      dizi.idenza.site/t/
                    </span>
                    <input
                      type="text"
                      value={storeLink}
                      onChange={(e) => setStoreLink(e.target.value.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}
                      className="flex h-12 w-full bg-transparent px-3 py-1 text-sm focus-visible:outline-none"
                      placeholder="floreria-maria"
                      required
                    />
                  </div>
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
                      placeholder="Minimo 6 caracteres"
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
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setStep(2)} className="h-12 w-12 shrink-0 rounded-2xl border-2 border-input bg-white hover:bg-muted active:scale-95 transition-all flex items-center justify-center shadow-sm">
                    <ArrowLeft className="w-4 h-4 text-foreground" />
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 h-12 rounded-2xl bg-primary hover:bg-primary/90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold tracking-wide shadow-md shadow-primary/30 transition-all duration-150 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Creando catalogo...
                      </>
                    ) : (
                      <>Lanzar mi Catalogo <Rocket className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          {step === 3 && (
            <div className="mt-4 text-center text-xs text-muted-foreground">
              Ya tienes una cuenta?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Inicia sesion
              </Link>
            </div>
          )}
        </div>

        {/* Ejemplos — solo paso 1 */}
        {step === 1 && (
          <div className="w-full max-w-sm">
            <p className="text-center text-[10px] text-muted-foreground mb-2.5 font-semibold uppercase tracking-widest">
              Negocios que ya usan Dizi
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  name: "Floreria", desc: "Arreglos florales", href: "https://dizi.idenza.site/bio/floreria-demo",
                  icon: <svg viewBox="0 0 48 48" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="fg1" cx="50%" cy="30%" r="60%"><stop offset="0%" stopColor="#ff9de2"/><stop offset="100%" stopColor="#e040a0"/></radialGradient><radialGradient id="fg2" cx="50%" cy="30%" r="60%"><stop offset="0%" stopColor="#ffb3ec"/><stop offset="100%" stopColor="#c2185b"/></radialGradient><radialGradient id="fg3" cx="50%" cy="30%" r="60%"><stop offset="0%" stopColor="#ffe0f0"/><stop offset="100%" stopColor="#f06292"/></radialGradient><linearGradient id="fstem" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#81c784"/><stop offset="100%" stopColor="#2e7d32"/></linearGradient></defs><ellipse cx="24" cy="20" rx="5" ry="7" fill="url(#fg1)" opacity="0.95"/><ellipse cx="14" cy="18" rx="4.5" ry="6.5" fill="url(#fg2)" opacity="0.9" transform="rotate(-30 14 18)"/><ellipse cx="34" cy="18" rx="4.5" ry="6.5" fill="url(#fg2)" opacity="0.9" transform="rotate(30 34 18)"/><ellipse cx="10" cy="26" rx="4" ry="6" fill="url(#fg3)" opacity="0.85" transform="rotate(-55 10 26)"/><ellipse cx="38" cy="26" rx="4" ry="6" fill="url(#fg3)" opacity="0.85" transform="rotate(55 38 26)"/><circle cx="24" cy="22" r="5" fill="url(#fg1)"/><circle cx="24" cy="22" r="3" fill="#fff9" opacity="0.6"/><path d="M24 30 Q22 36 21 42" stroke="url(#fstem)" strokeWidth="2.5" strokeLinecap="round" fill="none"/><ellipse cx="19" cy="37" rx="4" ry="2.5" fill="#66bb6a" opacity="0.85" transform="rotate(-30 19 37)"/></svg>
                },
                {
                  name: "WeHome Peru", desc: "Decoracion & Hogar", href: "https://dizi.idenza.site/bio/wehomeperu",
                  icon: <svg viewBox="0 0 48 48" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="vpot" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#d7ccc8"/><stop offset="100%" stopColor="#8d6e63"/></linearGradient><linearGradient id="vleaf" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#a1887f"/><stop offset="100%" stopColor="#5d4037"/></linearGradient></defs><path d="M24,28 Q18,18 20,8" stroke="#5d4037" strokeWidth="2" strokeLinecap="round" fill="none"/><ellipse cx="17" cy="14" rx="4" ry="2" fill="url(#vleaf)" transform="rotate(-30 17 14)"/><ellipse cx="23" cy="11" rx="4" ry="2" fill="url(#vleaf)" transform="rotate(30 23 11)"/><ellipse cx="19" cy="8" rx="3.5" ry="1.8" fill="url(#vleaf)" transform="rotate(-15 19 8)"/><path d="M16,24 L32,24 Q36,32 34,39 Q32,42 24,42 Q16,42 14,39 Q12,32 16,24" fill="url(#vpot)" filter="drop-shadow(0 3px 4px rgba(0,0,0,0.15))"/><ellipse cx="24" cy="24" rx="8" ry="2" fill="#b0bec5"/></svg>
                },
                {
                  name: "Restaurante", desc: "Menu digital", href: "https://dizi.idenza.site/bio/restaurante-demo",
                  icon: <svg viewBox="0 0 48 48" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="rplate" cx="50%" cy="40%" r="55%"><stop offset="0%" stopColor="#f5f5f5"/><stop offset="100%" stopColor="#bdbdbd"/></radialGradient><radialGradient id="rfood" cx="50%" cy="40%" r="60%"><stop offset="0%" stopColor="#ffcc80"/><stop offset="100%" stopColor="#ef6c00"/></radialGradient><linearGradient id="rfork" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#e0e0e0"/><stop offset="100%" stopColor="#9e9e9e"/></linearGradient></defs><ellipse cx="24" cy="26" rx="16" ry="14" fill="url(#rplate)" filter="drop-shadow(0 3px 5px rgba(0,0,0,0.2))"/><ellipse cx="24" cy="25" rx="11" ry="9.5" fill="url(#rfood)"/><ellipse cx="21" cy="22" rx="3.5" ry="2.5" fill="#fff3e0" opacity="0.6"/><rect x="8" y="10" width="2.5" height="20" rx="1.25" fill="url(#rfork)"/><rect x="7" y="10" width="1.2" height="8" rx="0.6" fill="url(#rfork)"/><rect x="10" y="10" width="1.2" height="8" rx="0.6" fill="url(#rfork)"/><rect x="37" y="10" width="2.5" height="20" rx="1.25" fill="url(#rfork)"/><path d="M37 10 Q40 14 38.5 18" stroke="#9e9e9e" strokeWidth="1.5" fill="none"/></svg>
                },
                {
                  name: "Ortopedicos", desc: "Productos y precios", href: "https://dizi.idenza.site/bio/ortopedicos-demo",
                  icon: <svg viewBox="0 0 48 48" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="cross1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#ef5350"/><stop offset="100%" stopColor="#b71c1c"/></linearGradient><linearGradient id="bag1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#e3f2fd"/><stop offset="100%" stopColor="#90caf9"/></linearGradient></defs><rect x="8" y="18" width="32" height="22" rx="4" fill="url(#bag1)" filter="drop-shadow(0 3px 5px rgba(0,0,0,0.2))"/><path d="M17 18 Q17 10 24 10 Q31 10 31 18" stroke="#64b5f6" strokeWidth="2.5" fill="none" strokeLinecap="round"/><rect x="20" y="24" width="8" height="2.5" rx="1.25" fill="url(#cross1)"/><rect x="22.75" y="21.25" width="2.5" height="8" rx="1.25" fill="url(#cross1)"/></svg>
                },
              ].map((ex) => (
                <a
                  key={ex.href}
                  href={ex.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 rounded-2xl border border-gray-100 bg-white hover:border-primary/30 hover:shadow-md transition-all px-3 py-2.5 group"
                >
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center">{ex.icon}</div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold leading-tight truncate group-hover:text-primary transition-colors">{ex.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{ex.desc}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
