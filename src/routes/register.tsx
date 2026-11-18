/**
 * @file register.tsx
 * @description Flujo de registro en 6 pantallas (slides) con vista previa en vivo (F53):
 * 1. Nombre del negocio → 2. Rubro (12 tarjetas) → 3. WhatsApp →
 * 4. Dos datos rápidos (ciudad opcional en Perú + cómo nos conociste) →
 * 5. Crea tu cuenta → 6. Celebración.
 * Conserva todas las reglas de F49 (invitaciones, referidos, plan pedido, origen, link y reintento)
 * y activa modo prueba automáticamente en dominios distintos de producción.
 */

import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Briefcase,
  Cake,
  Camera,
  CheckCircle2,
  Compass,
  Eye,
  EyeOff,
  Flower2,
  Footprints,
  Gem,
  Gift,
  Lamp,
  Loader2,
  MapPin,
  Rocket,
  Share2,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Users,
  Utensils,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { PhoneInput } from "@/components/PhoneInput";
import { CelebrationSlide } from "@/components/register/CelebrationSlide";
import { ChoiceCard } from "@/components/register/ChoiceCard";
import { PreviewHeaderStub, SlideShell } from "@/components/register/SlideShell";
import { getActiveSession, getSessionSync, getUserRole } from "@/lib/auth";
import { CIUDADES } from "@/lib/ciudades";
import { isPreviewTestMode } from "@/lib/register-preview";
import { RUBROS, getRubroDefaults } from "@/lib/rubros";
import { logFunnelStep, rememberFunnelSource, type FunnelStep } from "@/lib/signup-funnel";
import {
  SIGNUP_SOURCES,
  SIGNUP_SOURCE_LABELS,
  extractSignupUtmFromSearch,
  sanitizeSlugInput,
  slugifyStoreName,
  type SignupSource,
} from "@/lib/slug";
import { useApp } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { PLANS, type PlanId } from "@/lib/types";

const LazyLivePreview = lazy(() => import("@/components/register/LivePreview"));

type RegisterStep = 1 | 2 | 3 | 4 | 5 | 6;

const RUBRO_ICONS: Record<string, React.ReactNode> = {
  floreria: <Flower2 className="w-5 h-5" />,
  ropa: <Shirt className="w-5 h-5" />,
  calzado: <Footprints className="w-5 h-5" />,
  bisuteria: <Gem className="w-5 h-5" />,
  belleza: <Sparkles className="w-5 h-5" />,
  hogar: <Lamp className="w-5 h-5" />,
  comida: <Utensils className="w-5 h-5" />,
  pasteleria: <Cake className="w-5 h-5" />,
  tech: <Smartphone className="w-5 h-5" />,
  regalos: <Gift className="w-5 h-5" />,
  servicios: <Briefcase className="w-5 h-5" />,
  general: <ShoppingBag className="w-5 h-5" />,
};

const SOURCE_ICONS: Record<SignupSource, React.ReactNode> = {
  tiktok: <Video className="w-4 h-4" />,
  facebook: <Share2 className="w-4 h-4" />,
  instagram: <Camera className="w-4 h-4" />,
  recomendacion: <Users className="w-4 h-4" />,
  otro: <Compass className="w-4 h-4" />,
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function handleRadioGroupArrowKey(
  e: React.KeyboardEvent<HTMLButtonElement>,
  index: number,
  refs: React.MutableRefObject<(HTMLButtonElement | null)[]>,
  onArrowFocusSelect: (nextIndex: number) => void,
  onConfirmEnter?: () => void,
) {
  const total = refs.current.length;
  if (total === 0) return;

  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
    e.preventDefault();
    const next = (index + 1) % total;
    refs.current[next]?.focus();
    onArrowFocusSelect(next);
  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    e.preventDefault();
    const prev = (index - 1 + total) % total;
    refs.current[prev]?.focus();
    onArrowFocusSelect(prev);
  } else if (e.key === "Enter" && onConfirmEnter) {
    e.preventDefault();
    onConfirmEnter();
  }
}

export const Route = createFileRoute("/register")({
  beforeLoad: async () => {
    try {
      const session = await getActiveSession();
      if (session) {
        const role = getUserRole(session.user);
        throw redirect({ to: role === "super_admin" ? "/super/dashboard" : "/admin" });
      }
    } catch (err) {
      if (err && typeof err === "object" && "to" in err) {
        throw err;
      }
      const session = getSessionSync();
      if (session) {
        const role = getUserRole(session.user);
        throw redirect({ to: role === "super_admin" ? "/super/dashboard" : "/admin" });
      }
    }
  },
  head: () => ({
    meta: [
      { title: "Crear tu Catálogo Digital Gratis — Dizi" },
      {
        name: "description",
        content:
          "Registra tu negocio en Dizi y crea tu catálogo digital gratis en 2 minutos. Empieza a vender por WhatsApp hoy mismo.",
      },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: "https://dizi.idenza.site/register" }],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const addStore = useApp((s) => s.addStore);
  const setCurrentStore = useApp((s) => s.setCurrentStore);
  const markInviteUsed = useApp((s) => s.markInviteUsed);

  const previewTestMode = useMemo(() => isPreviewTestMode(), []);

  const [step, setStep] = useState<RegisterStep>(1);
  const [hasLoadedPreview, setHasLoadedPreview] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState("general");
  const [hasChosenNiche, setHasChosenNiche] = useState(false);
  const [signupCity, setSignupCity] = useState<string | null>(null);
  const [signupSource, setSignupSource] = useState<SignupSource | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTrialBanner, setShowTrialBanner] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Invite state
  const [invitePlan, setInvitePlan] = useState<PlanId | null>(null);
  const [inviteDurationMonths, setInviteDurationMonths] = useState<number>(1);
  const [inviteDurationValue, setInviteDurationValue] = useState<number | null>(null);
  const [inviteDurationUnit, setInviteDurationUnit] = useState<"days" | "months" | null>(null);
  const [inviteCustomPrice, setInviteCustomPrice] = useState<number | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Form states
  const [storeName, setStoreName] = useState("");
  const [storeLink, setStoreLink] = useState("");
  const [linkManuallyEdited, setLinkManuallyEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [storePhone, setStorePhone] = useState("");
  const [phoneCountryIso, setPhoneCountryIso] = useState("PE");
  const [phoneCountryDial, setPhoneCountryDial] = useState("51");
  const [isPhoneValid, setIsPhoneValid] = useState(false);

  // Leer parámetros URL (?invite=, ?ref=, ?plan=, ?origen= / utm_source=)
  const searchStr = typeof window !== "undefined" ? window.location.search : "";
  const urlParams = new URLSearchParams(searchStr);
  const inviteToken = urlParams.get("invite");
  const refToken = urlParams.get("ref");
  const requestedPlanParam = urlParams.get("plan") as PlanId | null;
  const [signupUtm] = useState<string | null>(() => extractSignupUtmFromSearch(searchStr));
  const [requestedPlan] = useState<PlanId | null>(
    requestedPlanParam && requestedPlanParam in PLANS ? requestedPlanParam : null,
  );
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [createdStoreData, setCreatedStoreData] = useState<{
    id: string;
    slug: string;
    plan: PlanId;
  } | null>(null);

  const rubroRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const cityRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const sourceRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loggedStepsRef = useRef<Set<FunnelStep>>(new Set());

  const trackFunnelStep = useCallback(
    (funnelStep: FunnelStep) => {
      if (previewTestMode) return;
      if (loggedStepsRef.current.has(funnelStep)) return;
      loggedStepsRef.current.add(funnelStep);
      void logFunnelStep(funnelStep, signupUtm);
    },
    [previewTestMode, signupUtm],
  );

  useEffect(() => {
    if (!previewTestMode) {
      rememberFunnelSource(signupUtm);
    }
    trackFunnelStep("vio_registro");
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, [previewTestMode, signupUtm, trackFunnelStep]);

  // Cargar PublicCatalog en diferido recién al salir de la pantalla 1 (RNF-53.3)
  useEffect(() => {
    if (step >= 2 && !hasLoadedPreview) {
      setHasLoadedPreview(true);
    }
  }, [step, hasLoadedPreview]);

  // Si cambia a un país distinto de Perú, limpiar ciudad seleccionada (RF-53.4)
  useEffect(() => {
    if (phoneCountryIso !== "PE" && signupCity !== null) {
      setSignupCity(null);
    }
  }, [phoneCountryIso, signupCity]);

  // Validar disponibilidad de link en tiempo real en Pantalla 5 (RF-49.3 / RF-53.7)
  useEffect(() => {
    if (step !== 5 || storeLink.length < 3) {
      setSlugStatus("idle");
      return;
    }
    let cancelled = false;
    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc("check_slug_available", { p_slug: storeLink });
        if (cancelled) return;
        if (error) {
          setSlugStatus("idle");
          return;
        }
        setSlugStatus(data === false ? "taken" : "available");
      } catch {
        if (!cancelled) setSlugStatus("idle");
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [step, storeLink]);

  // Validar invite contra Supabase al montar
  useEffect(() => {
    if (!inviteToken) return;
    setInviteLoading(true);
    supabase.rpc("check_invite", { p_token: inviteToken }).then(({ data, error }) => {
      const inviteArray = data as any[];
      if (error || !inviteArray || inviteArray.length === 0) {
        console.warn("[register] Invite no encontrado, expirado o ya usado:", error?.message);
        toast.warning("Esta invitación ya no es válida. Puedes crear tu tienda gratis igual.", {
          duration: 6000,
        });
      } else {
        const invite = inviteArray[0];
        setInvitePlan(invite.plan as PlanId);
        setInviteDurationMonths(invite.duration_months ?? 1);
        setInviteDurationValue(invite.duration_value ?? null);
        setInviteDurationUnit((invite.duration_unit as "days" | "months") ?? null);
        setInviteCustomPrice(
          invite.custom_price !== null && invite.custom_price !== undefined
            ? Number(invite.custom_price)
            : null,
        );
      }
      setInviteLoading(false);
    });
  }, [inviteToken]);

  const plan: PlanId = invitePlan ?? "semilla";
  const isTrial =
    invitePlan !== null && (inviteDurationMonths === 0 || inviteDurationUnit === "days");

  const inviteBannerText = useMemo(() => {
    if (!invitePlan) return null;
    const priceText =
      inviteCustomPrice !== null ? ` (Precio especial: S/ ${inviteCustomPrice.toFixed(2)})` : "";
    if (inviteDurationUnit === "days" && inviteDurationValue) {
      return `Invitación activa: Plan ${plan.toUpperCase()} por ${inviteDurationValue} días${priceText}`;
    }
    if (inviteDurationUnit === "months" && inviteDurationValue) {
      return `Invitación activa: Plan ${plan.toUpperCase()} por ${inviteDurationValue} ${inviteDurationValue === 1 ? "mes" : "meses"}${priceText}`;
    }
    if (isTrial) {
      return `Invitación activa: 15 días de Prueba en Plan ${plan.toUpperCase()}${priceText}`;
    }
    return `Invitación activa: Plan ${plan.toUpperCase()} por ${inviteDurationMonths} ${inviteDurationMonths === 1 ? "mes" : "meses"}${priceText}`;
  }, [invitePlan, inviteCustomPrice, inviteDurationUnit, inviteDurationValue, isTrial, inviteDurationMonths, plan]);

  const handleStoreNameChange = (value: string) => {
    setStoreName(value);
    if (!linkManuallyEdited) {
      setStoreLink(slugifyStoreName(value));
    }
  };

  const scheduleAutoAdvance = (targetStep: RegisterStep, funnelStep?: FunnelStep) => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    const delay = prefersReducedMotion() ? 0 : 220;
    autoAdvanceTimerRef.current = setTimeout(() => {
      if (funnelStep) trackFunnelStep(funnelStep);
      setStep(targetStep);
    }, delay);
  };

  const goFromStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) return;
    if (!linkManuallyEdited && !storeLink && storeName.trim()) {
      setStoreLink(slugifyStoreName(storeName));
    }
    trackFunnelStep("completo_nombre");
    setStep(2);
  };

  const handleSelectRubro = (rubroId: string, advance = true) => {
    setSelectedNiche(rubroId);
    setHasChosenNiche(true);
    if (advance) {
      scheduleAutoAdvance(3, "completo_rubro");
    }
  };

  const goFromStep2 = () => {
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    trackFunnelStep("completo_rubro");
    setStep(3);
  };

  const goFromStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPhoneValid) return;
    trackFunnelStep("completo_whatsapp");
    setStep(4);
  };

  const goFromStep4 = (skip = false) => {
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    if (skip) {
      setSignupCity(null);
      setSignupSource(null);
    }
    trackFunnelStep("completo_datos");
    setStep(5);
  };

  const handleSelectCity = (cityId: string) => {
    const next = signupCity === cityId ? null : cityId;
    setSignupCity(next);
  };

  const handleSelectSource = (sourceId: SignupSource, isKeyboardNav = false) => {
    const next = signupSource === sourceId ? null : sourceId;
    setSignupSource(next);
    if (!isKeyboardNav && next !== null && (phoneCountryIso !== "PE" || signupCity !== null)) {
      scheduleAutoAdvance(5, "completo_datos");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 5) return;

    if (!acceptedTerms) {
      toast.error("Debes aceptar los Términos de Servicio y la Política de Privacidad para continuar.");
      return;
    }

    const cleanSlug =
      sanitizeSlugInput(storeLink) || slugifyStoreName(storeName) || `tienda-${Date.now()}`;

    // En cualquier dominio distinto de producción: modo prueba sin llamadas de escritura
    if (previewTestMode) {
      setCreatedStoreData({
        id: "preview-store",
        slug: cleanSlug,
        plan: requestedPlan && requestedPlan !== "semilla" ? requestedPlan : plan,
      });
      setStep(6);
      return;
    }

    setLoading(true);
    try {
      const { data: isAvailable, error: slugError } = await supabase.rpc("check_slug_available", {
        p_slug: cleanSlug,
      });

      if (slugError || isAvailable === false) {
        setSlugStatus("taken");
        toast.error("El link de la tienda ya esta en uso. Por favor, elige otro.");
        setLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: storeName, role: "store_owner" },
        },
      });

      let userId = authData.user?.id;

      if (authError) {
        if (authError.message?.includes("already registered") || authError.status === 422) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (signInError) {
            throw new Error(
              "Este correo ya esta registrado. Por favor, inicia sesion con tu contrasena.",
            );
          }
          userId = signInData.user?.id;
        } else {
          throw authError;
        }
      }

      if (!userId) throw new Error("No se pudo obtener el ID del usuario.");

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      if (!currentSession) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          throw new Error("Cuenta creada pero no se pudo iniciar sesion automaticamente.");
        }
      }

      const newStoreId = "s_" + Math.random().toString(36).substring(2, 9);
      const newCategoryId = "c_" + Math.random().toString(36).substring(2, 9);

      const planExpiresAt = (() => {
        if (plan === "semilla") return undefined;
        const d = new Date();
        if (inviteDurationUnit === "days" && inviteDurationValue) {
          d.setDate(d.getDate() + inviteDurationValue);
          return d.toISOString();
        }
        if (inviteDurationUnit === "months" && inviteDurationValue) {
          d.setMonth(d.getMonth() + inviteDurationValue);
          return d.toISOString();
        }
        if (isTrial) {
          d.setDate(d.getDate() + 15);
          return d.toISOString();
        }
        if (inviteDurationMonths) {
          d.setMonth(d.getMonth() + inviteDurationMonths);
          return d.toISOString();
        }
        return undefined;
      })();

      const rubroDefaults = getRubroDefaults(selectedNiche);
      const nowIso = new Date().toISOString();

      await addStore({
        id: newStoreId,
        slug: cleanSlug,
        name: storeName.trim() || "Mi Nueva Tienda",
        phone: storePhone,
        countryCode: phoneCountryDial,
        countryIso: phoneCountryIso,
        plan: invitePlan ?? "semilla",
        requestedPlan: requestedPlan && requestedPlan !== "semilla" ? requestedPlan : undefined,
        termsAcceptedAt: nowIso,
        onboardingCompleted: true,
        active: true,
        isPublished: true,
        createdAt: nowIso,
        whatsappClicks: 0,
        model: rubroDefaults.model,
        brandColor: rubroDefaults.preset.values.brandColor,
        bgColor: rubroDefaults.preset.values.bgColor,
        cardBg: rubroDefaults.preset.values.cardBg,
        textColor: rubroDefaults.preset.values.textColor,
        accentColor: rubroDefaults.preset.values.accentColor,
        catalogTypography: rubroDefaults.preset.values.typography,
        cardStyle: rubroDefaults.preset.values.cardStyle,
        borderRadius: rubroDefaults.preset.values.borderRadius,
        imgShape: rubroDefaults.preset.values.imgShape,
        isDark: rubroDefaults.preset.values.isDark,
        ownerId: userId,
        niche: rubroDefaults.rubro.id,
        photoFormat: rubroDefaults.photoFormat,
        planExpiresAt,
        subscriptionStatus:
          plan === "semilla"
            ? "trial"
            : inviteDurationUnit === "days" || isTrial
              ? "trial"
              : "active",
        planDurationMonths:
          plan === "semilla"
            ? undefined
            : inviteDurationUnit === "days" || isTrial
              ? 0
              : (inviteDurationValue ?? inviteDurationMonths),
        customPrice: inviteCustomPrice !== null ? inviteCustomPrice : undefined,
        referredBy: refToken || undefined,
        signupSource: signupSource ?? null,
        signupUtm: signupUtm ?? null,
        signupCity: phoneCountryIso === "PE" ? (signupCity ?? null) : null,
        categories: [{ id: newCategoryId, name: "Principal" }],
        products: [],
      });

      if (inviteToken && invitePlan) {
        await markInviteUsed(inviteToken, newStoreId);
      }

      trackFunnelStep("creo_cuenta");
      toast.success("Tienda creada con éxito. Bienvenido a Dizi.");
      setCurrentStore(newStoreId);
      setCreatedStoreData({
        id: newStoreId,
        slug: cleanSlug,
        plan: requestedPlan ?? plan,
      });
      setStep(6);
    } catch (err: any) {
      console.error("Registration error:", err);
      let errorMessage = "Error al registrarte.";
      if (err.message?.includes("stores_slug_key")) {
        errorMessage = "El link de la tienda ya esta en uso. Por favor, elige otro.";
      } else if (err.message?.includes("categories_pkey")) {
        errorMessage = "Error de sistema al crear la categoria. Por favor, intenta de nuevo.";
      } else if (
        err.status === 429 ||
        err.message?.includes("rate limit") ||
        err.message?.includes("over_email_send_rate_limit")
      ) {
        errorMessage =
          "Límite de correos alcanzado temporalmente por el servidor. Por favor, espera unos minutos o desactiva 'Confirm email' en tu panel de Supabase.";
      } else if (err.message?.includes("User already registered")) {
        errorMessage = "Este correo ya tiene una cuenta. Intenta iniciar sesion.";
      } else {
        errorMessage = err.message || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const slideMeta: Record<
    RegisterStep,
    { titleLead: string; titleMuted: string; hint: string }
  > = {
    1: {
      titleLead: "¿Cómo se llama",
      titleMuted: "tu negocio?",
      hint: "Así aparecerá en el encabezado y en el link de tu catálogo.",
    },
    2: {
      titleLead: "¿Qué",
      titleMuted: "vendes?",
      hint: "Elegimos un diseño y colores pensados para tu rubro.",
    },
    3: {
      titleLead: "¿A qué WhatsApp te escriben",
      titleMuted: "tus clientes?",
      hint: "Tus clientes te enviarán sus pedidos directo a este número.",
    },
    4: {
      titleLead: "Dos datos",
      titleMuted: "rápidos",
      hint: "Opcional: nos ayuda a mejorar Dizi para tu ciudad.",
    },
    5: {
      titleLead: "Crea",
      titleMuted: "tu cuenta",
      hint: "Tu catálogo queda listo al instante, gratis.",
    },
    6: {
      titleLead: "",
      titleMuted: "",
      hint: "",
    },
  };

  const currentMeta = slideMeta[step];
  const resolvedSlugForPreview =
    storeLink.trim() || slugifyStoreName(storeName) || "tu-negocio";

  const handleBack = () => {
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    if (step > 1 && step < 6) {
      setStep((step - 1) as RegisterStep);
    }
  };

  return (
    <SlideShell
      step={step}
      totalSteps={5}
      titleLead={currentMeta.titleLead}
      titleMuted={currentMeta.titleMuted}
      hintText={currentMeta.hint}
      onBack={step > 1 && step < 6 ? handleBack : undefined}
      isPreviewTestMode={previewTestMode}
      showTrialBanner={isTrial && showTrialBanner}
      onDismissTrialBanner={() => setShowTrialBanner(false)}
      inviteLoading={inviteLoading}
      inviteBannerText={inviteBannerText}
      invalidInviteBanner={!inviteLoading && Boolean(inviteToken) && !invitePlan}
      rightAction={
        step === 4 ? (
          <button
            type="button"
            data-testid="step4-skip-btn"
            onClick={() => goFromStep4(true)}
            className="min-h-[44px] px-3 rounded-xl text-[15px] font-semibold text-[#312E81] hover:bg-[#312E81]/8 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312E81]"
          >
            Saltar
          </button>
        ) : undefined
      }
      renderPreview={(compact) =>
        !hasLoadedPreview && step === 1 ? (
          <PreviewHeaderStub storeName={storeName} />
        ) : (
          <Suspense fallback={<PreviewHeaderStub storeName={storeName} />}>
            <LazyLivePreview
              storeName={storeName}
              niche={selectedNiche}
              phone={isPhoneValid ? storePhone : ""}
              countryCode={phoneCountryDial}
              countryIso={phoneCountryIso}
              slug={resolvedSlugForPreview}
              showWhatsappButton={isPhoneValid || step >= 4}
              compact={compact}
            />
          </Suspense>
        )
      }
    >
      {/* PANTALLA 1: Nombre del negocio */}
      {step === 1 && (
        <form onSubmit={goFromStep1} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="register-store-name"
              className="block text-[16px] font-medium text-[#1E1B4B]"
            >
              Nombre de tu negocio
            </label>
            <input
              id="register-store-name"
              type="text"
              autoComplete="organization"
              value={storeName}
              onChange={(e) => handleStoreNameChange(e.target.value)}
              placeholder="Ej. Florería María"
              className="w-full min-h-[52px] rounded-2xl border border-[#312E81]/25 bg-white px-4 text-[16px] text-[#1E1B4B] placeholder:text-[#312E81]/45 focus:border-[#312E81] focus:ring-2 focus:ring-[#312E81]/20 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!storeName.trim()}
            className="w-full min-h-[52px] rounded-2xl bg-[#FF5C39] hover:bg-[#ff4b24] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-[#1E1B4B] text-[16px] font-bold transition-all motion-reduce:transition-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312E81]"
          >
            Continuar
          </button>
        </form>
      )}

      {/* PANTALLA 2: Rubro (12 tarjetas, avance automático con un toque) */}
      {step === 2 && (
        <div className="space-y-4">
          <div
            role="radiogroup"
            aria-label="¿Qué vendes?"
            className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
          >
            {RUBROS.map((rubro, idx) => {
              const isChecked = hasChosenNiche && selectedNiche === rubro.id;
              return (
                <ChoiceCard
                  key={rubro.id}
                  ref={(el) => {
                    rubroRefs.current[idx] = el;
                  }}
                  label={rubro.label}
                  icon={RUBRO_ICONS[rubro.id] ?? <ShoppingBag className="w-5 h-5" />}
                  selected={isChecked}
                  compact
                  dataAttrs={{ "data-niche": rubro.id }}
                  onSelect={() => handleSelectRubro(rubro.id, true)}
                  onKeyDown={(e) =>
                    handleRadioGroupArrowKey(
                      e,
                      idx,
                      rubroRefs,
                      (nextIdx) => handleSelectRubro(RUBROS[nextIdx].id, false),
                      () => goFromStep2(),
                    )
                  }
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={goFromStep2}
            className="w-full min-h-[48px] rounded-2xl bg-[#FF5C39] hover:bg-[#ff4b24] text-[#1E1B4B] text-[16px] font-bold transition-colors motion-reduce:transition-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312E81]"
          >
            Continuar
          </button>
        </div>
      )}

      {/* PANTALLA 3: WhatsApp */}
      {step === 3 && (
        <form onSubmit={goFromStep3} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-[16px] font-medium text-[#1E1B4B]">
              Número de WhatsApp de ventas
            </label>
            <PhoneInput
              value={storePhone}
              countryIso={phoneCountryIso}
              inputClassName="h-12 text-[16px] border-[#312E81]/25 bg-white text-[#1E1B4B] focus:border-[#312E81]"
              triggerClassName="h-12 border-[#312E81]/25 bg-white text-[#1E1B4B]"
              onChange={({ digits, countryIso, dial, valid }) => {
                setStorePhone(digits);
                setPhoneCountryIso(countryIso);
                setPhoneCountryDial(dial);
                setIsPhoneValid(valid);
              }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={!isPhoneValid}
            className="w-full min-h-[52px] rounded-2xl bg-[#FF5C39] hover:bg-[#ff4b24] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-[#1E1B4B] text-[16px] font-bold transition-all motion-reduce:transition-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312E81]"
          >
            Continuar
          </button>
        </form>
      )}

      {/* PANTALLA 4: Dos datos rápidos (ciudad en Perú + cómo nos conociste, opcionales) */}
      {step === 4 && (
        <div className="space-y-5">
          {phoneCountryIso === "PE" && (
            <div data-testid="step4-city-section" className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-semibold text-[#1E1B4B]">
                  ¿En qué ciudad vendes?
                </span>
                <span className="text-[13px] text-[#312E81]/75">Opcional</span>
              </div>
              <div
                role="radiogroup"
                aria-label="¿En qué ciudad vendes?"
                className="grid grid-cols-1 sm:grid-cols-2 gap-2"
              >
                {CIUDADES.map((city, idx) => (
                  <ChoiceCard
                    key={city.id}
                    ref={(el) => {
                      cityRefs.current[idx] = el;
                    }}
                    label={city.label}
                    icon={<MapPin className="w-4 h-4" />}
                    selected={signupCity === city.id}
                    compact
                    dataAttrs={{ "data-signup-city": city.id }}
                    onSelect={() => handleSelectCity(city.id)}
                    onKeyDown={(e) =>
                      handleRadioGroupArrowKey(
                        e,
                        idx,
                        cityRefs,
                        (nextIdx) => setSignupCity(CIUDADES[nextIdx].id),
                        () => goFromStep4(false),
                      )
                    }
                  />
                ))}
              </div>
            </div>
          )}

          <div data-testid="step4-source-section" className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[16px] font-semibold text-[#1E1B4B]">
                ¿Cómo nos conociste?
              </span>
              <span className="text-[13px] text-[#312E81]/75">Opcional</span>
            </div>
            <div
              role="radiogroup"
              aria-label="¿Cómo nos conociste?"
              className="grid grid-cols-1 sm:grid-cols-2 gap-2"
            >
              {SIGNUP_SOURCES.map((sourceId, idx) => (
                <ChoiceCard
                  key={sourceId}
                  ref={(el) => {
                    sourceRefs.current[idx] = el;
                  }}
                  label={SIGNUP_SOURCE_LABELS[sourceId]}
                  icon={SOURCE_ICONS[sourceId]}
                  selected={signupSource === sourceId}
                  compact
                  dataAttrs={{ "data-signup-source": sourceId }}
                  onSelect={() => handleSelectSource(sourceId, false)}
                  onKeyDown={(e) =>
                    handleRadioGroupArrowKey(
                      e,
                      idx,
                      sourceRefs,
                      (nextIdx) => setSignupSource(SIGNUP_SOURCES[nextIdx]),
                      () => goFromStep4(false),
                    )
                  }
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => goFromStep4(false)}
            className="w-full min-h-[52px] rounded-2xl bg-[#FF5C39] hover:bg-[#ff4b24] active:scale-[0.99] text-[#1E1B4B] text-[16px] font-bold transition-all motion-reduce:transition-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312E81]"
          >
            Continuar
          </button>
        </div>
      )}

      {/* PANTALLA 5: Crea tu cuenta */}
      {step === 5 && (
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="rounded-2xl border border-[#312E81]/15 bg-white px-4 py-3 text-[13px] font-medium text-[#312E81]">
            {isTrial
              ? `Se activará tu Plan ${plan === "emprendedor" ? "Emprendedor" : plan.toUpperCase()} (prueba de 15 días) gratis al crear tu cuenta.`
              : `Tu catálogo se creará ${plan !== "semilla" ? `bajo el Plan ${plan.toUpperCase()}` : "bajo el Plan Semilla (gratuito)"}.`}
          </div>

          {/* Link editable */}
          <div className="space-y-1.5">
            <label
              htmlFor="register-store-link"
              className="block text-[16px] font-medium text-[#1E1B4B]"
            >
              Link de tu catálogo
            </label>
            <div
              className={`flex rounded-2xl border bg-white focus-within:ring-2 transition-all overflow-hidden ${
                slugStatus === "taken"
                  ? "border-red-600 focus-within:border-red-600 focus-within:ring-red-200"
                  : "border-[#312E81]/25 focus-within:border-[#312E81] focus-within:ring-[#312E81]/20"
              }`}
            >
              <span className="flex items-center px-3 bg-[#FAF7F2] text-[#312E81]/80 text-[14px] border-r border-[#312E81]/15 font-semibold whitespace-nowrap">
                dizi.idenza.site/t/
              </span>
              <input
                id="register-store-link"
                type="text"
                value={storeLink}
                onChange={(e) => {
                  setLinkManuallyEdited(true);
                  setStoreLink(sanitizeSlugInput(e.target.value));
                }}
                className="flex min-h-[48px] w-full bg-transparent px-3 text-[16px] text-[#1E1B4B] focus:outline-none"
                placeholder="floreria-maria"
                minLength={3}
                maxLength={40}
                required
              />
            </div>

            {slugStatus === "checking" && (
              <p className="text-[13px] text-[#312E81]/75 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Verificando disponibilidad...
              </p>
            )}
            {slugStatus === "available" && (
              <p
                data-testid="slug-available-msg"
                className="text-[13px] text-emerald-800 font-semibold flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Link disponible
              </p>
            )}
            {slugStatus === "taken" && (
              <p
                data-testid="slug-taken-error"
                className="text-[13px] text-red-700 font-semibold flex items-center gap-1.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                Este link ya está en uso. Elige otro para continuar.
              </p>
            )}
          </div>

          {/* Correo */}
          <div className="space-y-1.5">
            <label
              htmlFor="register-email"
              className="block text-[16px] font-medium text-[#1E1B4B]"
            >
              Correo electrónico
            </label>
            <input
              id="register-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-h-[48px] rounded-2xl border border-[#312E81]/25 bg-white px-4 text-[16px] text-[#1E1B4B] focus:border-[#312E81] focus:ring-2 focus:ring-[#312E81]/20 focus:outline-none"
              placeholder="tu@correo.com"
              required
            />
          </div>

          {/* Contraseña */}
          <div className="space-y-1.5">
            <label
              htmlFor="register-password"
              className="block text-[16px] font-medium text-[#1E1B4B]"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-[48px] rounded-2xl border border-[#312E81]/25 bg-white pl-4 pr-12 text-[16px] text-[#1E1B4B] focus:border-[#312E81] focus:ring-2 focus:ring-[#312E81]/20 focus:outline-none"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-11 w-11 flex items-center justify-center text-[#312E81]/70 hover:text-[#312E81] cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Términos y privacidad */}
          <div className="flex items-start gap-3 pt-1">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-[#312E81]/40 text-[#312E81] focus:ring-[#312E81] cursor-pointer shrink-0"
              required
            />
            <label
              htmlFor="acceptTerms"
              className="text-[14px] text-[#1E1B4B] leading-snug cursor-pointer select-none"
            >
              Acepto los{" "}
              <Link
                to="/terminos"
                target="_blank"
                className="text-[#312E81] font-semibold underline underline-offset-2"
              >
                Términos de Servicio
              </Link>{" "}
              y la{" "}
              <Link
                to="/privacidad"
                target="_blank"
                className="text-[#312E81] font-semibold underline underline-offset-2"
              >
                Política de Privacidad
              </Link>
              .
            </label>
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              !acceptedTerms ||
              slugStatus === "taken" ||
              storeLink.trim().length < 3
            }
            className="w-full min-h-[52px] rounded-2xl bg-[#FF5C39] hover:bg-[#ff4b24] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-[#1E1B4B] text-[16px] font-bold flex items-center justify-center gap-2 transition-all motion-reduce:transition-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312E81]"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-[#1E1B4B]/40 border-t-[#1E1B4B] rounded-full animate-spin" />
                <span>Creando catálogo...</span>
              </>
            ) : (
              <>
                <span>Crear mi catálogo</span>
                <Rocket className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>

          <div className="text-center text-[14px] text-[#312E81]/80 pt-1">
            ¿Ya tienes una cuenta?{" "}
            <Link
              to="/login"
              className="text-[#312E81] font-semibold underline underline-offset-2"
            >
              Inicia sesión
            </Link>
          </div>
        </form>
      )}

      {/* PANTALLA 6: Celebración */}
      {step === 6 && createdStoreData && (
        <CelebrationSlide
          storeName={storeName}
          slug={createdStoreData.slug}
          requestedPlan={requestedPlan}
          isPreviewTestMode={previewTestMode}
          onGoToFirstProduct={() => {
            if (previewTestMode) {
              toast.info("Modo prueba: en producción este botón te lleva a subir tu primer producto.");
              return;
            }
            navigate({ to: "/admin/productos", search: { bienvenida: 1 } as any });
          }}
          onGoToAdmin={() => navigate({ to: "/admin" })}
        />
      )}
    </SlideShell>
  );
}
