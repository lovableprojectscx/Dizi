/**
 * @file admin.encuesta.tsx
 * @description Formulario y pantalla de confirmación de la Encuesta de Calidad F43 (/admin/encuesta).
 * Muestra las 7 preguntas adaptadas al plan efectivo de la tienda y la pantalla final
 * con el código de premio DZ-XXXXXX y enlace de WhatsApp directo a soporte.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import {
  SURVEY_VERSION,
  getSurveyGroup,
  getQuestionsForGroup,
  isSurveyClosed,
  canStoreTakeSurvey,
  getRewardDescription,
  buildSurveyWhatsAppLink,
  validateAnswers,
  type SurveyGroup,
  type SurveyQuestion,
  type SurveyResponseRecord,
} from "@/lib/survey";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Gift,
  CheckCircle2,
  Copy,
  Check,
  ArrowLeft,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/encuesta")({
  component: EncuestaPage,
});

function EncuestaPage() {
  const currentStoreId = useApp((s) => s.currentStoreId);
  const store = useApp((s) => s.stores.find((st) => st.id === currentStoreId) ?? s.stores[0]);
  const getMySurveyResponse = useApp((s) => s.getMySurveyResponse);
  const submitSurvey = useApp((s) => s.submitSurvey);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savedResponse, setSavedResponse] = useState<SurveyResponseRecord | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copiedCode, setCopiedCode] = useState(false);

  // Cargar respuesta previa de la tienda (si ya respondió)
  useEffect(() => {
    if (!store) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    getMySurveyResponse(store.id, SURVEY_VERSION)
      .then((res) => {
        if (isMounted) {
          setSavedResponse(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("[EncuestaPage] Error al cargar respuesta:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [store?.id, getMySurveyResponse]);

  if (!store) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Cargando información de tu tienda...
      </div>
    );
  }

  const group: SurveyGroup | null = getSurveyGroup(store);
  const surveyClosed = isSurveyClosed();

  // Si ya respondió previamente, mostrar siempre su pantalla de código y estado (RF-43.4)
  if (savedResponse) {
    return (
      <FinalSurveyScreen
        response={savedResponse}
        storeSlug={store.slug}
        group={savedResponse.plan_at_response as SurveyGroup}
        copiedCode={copiedCode}
        onCopyCode={async () => {
          await navigator.clipboard.writeText(savedResponse.reward_code);
          setCopiedCode(true);
          setTimeout(() => setCopiedCode(false), 2000);
          toast.success("Código copiado al portapapeles");
        }}
      />
    );
  }

  // Estado de carga inicial
  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Consultando estado de encuesta...</p>
      </div>
    );
  }

  // Tiendas demo o ilimitado (RF-43.4, Scenario 4)
  if (!group) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4">
        <Card className="border-border/80 rounded-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold">Encuesta no disponible</h2>
            <p className="text-sm text-muted-foreground">
              Esta tienda tiene plan ilimitado o es una cuenta de demostración, por lo que no participa en este beneficio.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/admin/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver al panel
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  // Encuesta cerrada después del 30 de noviembre (RF-43.12, Scenario 15)
  if (surveyClosed) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4">
        <Card className="border-border/80 rounded-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold">La encuesta ha finalizado</h2>
            <p className="text-sm text-muted-foreground">
              El periodo para responder la encuesta de calidad cerró el 30 de noviembre de 2026.
              Agradecemos tu interés en mejorar DIZI.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/admin/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver al panel
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  const questions = getQuestionsForGroup(group);

  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
    if (errors[questionId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  const handleToggleMultiple = (questionId: string, option: string) => {
    const current: string[] = Array.isArray(answers[questionId]) ? answers[questionId] : [];
    let updated: string[];
    if (current.includes(option)) {
      updated = current.filter((item) => item !== option);
    } else {
      updated = [...current, option];
    }
    setAnswers((prev) => ({ ...prev, [questionId]: updated }));
    if (errors[questionId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  const handleTextChange = (questionId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: text }));
    if (errors[questionId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateAnswers(group, answers);
    if (!validation.valid) {
      setErrors(validation.errors);
      toast.error("Por favor completa todas las preguntas obligatorias");
      return;
    }

    try {
      setSubmitting(true);
      const res = await submitSurvey(store.id, SURVEY_VERSION, answers);
      setSavedResponse(res);
      toast.success("¡Respuestas enviadas con éxito!");
    } catch (err: any) {
      console.error("[handleSubmit] Error:", err);
      toast.error(err?.message || "Ocurrió un error al guardar tus respuestas");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-8 px-3 sm:px-6 space-y-6">
      {/* Botón de regreso */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="rounded-xl -ml-2 text-muted-foreground">
          <Link to="/admin/dashboard">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Volver al panel
          </Link>
        </Button>
      </div>

      {/* Encabezado descriptivo */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
        <div className="p-2.5 rounded-xl bg-emerald-500 text-white shrink-0 shadow-sm mt-0.5">
          <Gift className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h1 className="text-base sm:text-lg font-bold font-heading text-foreground">
            Encuesta de calidad DIZI
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Responde 7 preguntas rápidas sobre tu experiencia y recibe{" "}
            <strong>{getRewardDescription(group)}</strong>.
          </p>
        </div>
      </div>

      {/* Formulario móvil-primero */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q) => (
          <Card
            key={q.id}
            className={cn(
              "border rounded-2xl overflow-hidden transition-all duration-200",
              errors[q.id]
                ? "border-destructive/80 bg-destructive/[0.02]"
                : "border-border/80 bg-card hover:border-border"
            )}
          >
            <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                  Pregunta {q.number} de 7
                </span>
                {q.required && (
                  <span className="text-[11px] text-muted-foreground font-medium">Obligatoria</span>
                )}
              </div>
              <CardTitle className="text-sm sm:text-base font-heading font-semibold leading-snug">
                {q.label}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 pt-0 space-y-3">
              {/* Pregunta tipo escala (0 a 10) */}
              {q.type === "scale" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 sm:gap-2">
                    {Array.from({ length: 11 }, (_, i) => i).map((num) => {
                      const isSelected = answers[q.id] === num || answers[q.id] === String(num);
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleSelectOption(q.id, String(num))}
                          className={cn(
                            "h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center justify-center cursor-pointer",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-xs ring-2 ring-primary/20"
                              : "bg-muted/30 hover:bg-muted border-border/80 text-foreground"
                          )}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
                    <span>0 = Nada probable</span>
                    <span>10 = Muy probable</span>
                  </div>
                </div>
              )}

              {/* Pregunta de selección única */}
              {q.type === "single" && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const isSelected = answers[q.id] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectOption(q.id, opt)}
                        className={cn(
                          "w-full p-3 sm:p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 cursor-pointer",
                          isSelected
                            ? "bg-primary/[0.06] border-primary text-foreground shadow-2xs font-semibold ring-1 ring-primary/30"
                            : "bg-card hover:bg-muted/40 border-border/80 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span>{opt}</span>
                        <div
                          className={cn(
                            "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all",
                            isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                          )}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Pregunta de selección múltiple (Pro Q5) */}
              {q.type === "multiple" && q.options && (
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground">Puedes marcar varias opciones:</p>
                  {q.options.map((opt) => {
                    const currentArr: string[] = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                    const isSelected = currentArr.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleToggleMultiple(q.id, opt)}
                        className={cn(
                          "w-full p-3 sm:p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 cursor-pointer",
                          isSelected
                            ? "bg-primary/[0.06] border-primary text-foreground shadow-2xs font-semibold ring-1 ring-primary/30"
                            : "bg-card hover:bg-muted/40 border-border/80 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span>{opt}</span>
                        <div
                          className={cn(
                            "w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all",
                            isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                          )}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Pregunta de texto corto (Semilla Q6) */}
              {q.type === "text" && (
                <div className="space-y-1.5">
                  <Textarea
                    value={answers[q.id] || ""}
                    onChange={(e) => handleTextChange(q.id, e.target.value)}
                    placeholder="Escribe tu respuesta aquí..."
                    maxLength={q.maxLength || 300}
                    className="min-h-[80px] rounded-xl text-xs sm:text-sm resize-none"
                  />
                  <div className="flex justify-end text-[11px] text-muted-foreground">
                    <span>{(answers[q.id] || "").length}/{q.maxLength || 300}</span>
                  </div>
                </div>
              )}

              {/* Follow-up opcional (Pro Q6 "¿por qué?") */}
              {q.followUp && answers[q.id] && (
                <div className="pt-2 border-t border-border/40 space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {q.followUp.label} <span className="text-[11px] font-normal text-muted-foreground">(opcional)</span>
                  </label>
                  <Textarea
                    value={answers[q.followUp.id] || ""}
                    onChange={(e) => handleTextChange(q.followUp.id, e.target.value)}
                    placeholder="Cuéntanos más detalles si deseas..."
                    maxLength={q.followUp.maxLength}
                    className="min-h-[70px] rounded-xl text-xs sm:text-sm resize-none"
                  />
                  <div className="flex justify-end text-[11px] text-muted-foreground">
                    <span>{(answers[q.followUp.id] || "").length}/{q.followUp.maxLength}</span>
                  </div>
                </div>
              )}

              {/* Mensaje de error de validación */}
              {errors[q.id] && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1.5 pt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors[q.id]}
                </p>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Botón de envío */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-xl text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md cursor-pointer"
          >
            {submitting ? "Enviando respuestas..." : "Enviar respuestas y ver mi código"}
          </Button>
          <p className="text-[11px] text-center text-muted-foreground mt-2">
            Tus respuestas son privadas y se usan únicamente para mejorar DIZI.
          </p>
        </div>
      </form>
    </div>
  );
}

/**
 * Pantalla final con el código y botón de WhatsApp (RF-43.4, RF-43.6 y Corrección 3 de Jack).
 */
function FinalSurveyScreen({
  response,
  storeSlug,
  group,
  copiedCode,
  onCopyCode,
}: {
  response: SurveyResponseRecord;
  storeSlug: string;
  group: SurveyGroup;
  copiedCode: boolean;
  onCopyCode: () => void;
}) {
  const waUrl = buildSurveyWhatsAppLink(response.reward_code, storeSlug);
  const rewardText = getRewardDescription(group || (response.plan_at_response as SurveyGroup));

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-10 px-3 sm:px-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="rounded-xl -ml-2 text-muted-foreground">
          <Link to="/admin/dashboard">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Volver al panel
          </Link>
        </Button>
      </div>

      <Card className="border-border/80 rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-sm bg-card">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-foreground">
            ¡Muchas gracias por tus respuestas!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Hemos registrado tu participación. Tu beneficio asignado es:
          </p>
          <div className="inline-block mt-1 font-bold text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1 rounded-full">
            {rewardText}
          </div>
        </div>

        {/* Tarjeta de Código */}
        <div className="bg-muted/40 border border-border/80 rounded-2xl p-5 space-y-2 max-w-sm mx-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Tu código de premio
          </span>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-wider text-foreground">
              {response.reward_code}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onCopyCode}
              className="h-9 w-9 rounded-xl shrink-0 cursor-pointer"
              title="Copiar código"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Texto exacto según Corrección 3 de Jack */}
        <p className="text-xs sm:text-sm font-semibold text-foreground max-w-sm mx-auto">
          Envíanos tu código por WhatsApp y revisamos tu premio
        </p>

        {/* Botón WhatsApp */}
        <div className="space-y-3 max-w-sm mx-auto">
          <Button
            asChild
            className="w-full h-12 rounded-xl text-sm font-bold bg-[#25D366] hover:bg-[#20ba59] text-white shadow-md cursor-pointer"
          >
            <a href={waUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-5 h-5 mr-2" />
              Enviar por WhatsApp
              <ExternalLink className="w-4 h-4 ml-1.5 opacity-70" />
            </a>
          </Button>

          {/* Estado del premio */}
          <div className="pt-2">
            {response.reward_status === "pendiente" && (
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 px-3 py-1 rounded-full">
                Estado: Pendiente de activación
              </span>
            )}
            {response.reward_status === "aplicado" && (
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 px-3 py-1 rounded-full">
                Estado: Premio aplicado ✓
              </span>
            )}
            {response.reward_status === "rechazado" && (
              <span className="text-[11px] font-semibold text-muted-foreground bg-muted border border-border px-3 py-1 rounded-full">
                Estado: Premio rechazado
              </span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
