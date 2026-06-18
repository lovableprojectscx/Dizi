import { useState } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Copy, Check, Link2, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";
import type { PlanId } from "@/lib/types";

const PLAN_OPTIONS: { value: PlanId; label: string }[] = [
  { value: "emprendedor", label: "Emprendedor (S/ 9.90)" },
  { value: "pro",         label: "Pro (S/ 14.90)" },
  { value: "ilimitado",   label: "Ilimitado (S/ 34.90)" },
  { value: "semilla",     label: "Semilla (Gratis)" },
];

interface GeneratedLink {
  token: string;
  plan: PlanId;
  durationValue: number;
  durationUnit: "days" | "months";
  customPrice?: number;
  url: string;
  createdAt: string;
  linkExpiresAt: string;
}

function generateToken(): string {
  const arr = new Uint8Array(18);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

export function InviteGenerator({ onGenerate }: { onGenerate?: () => void }) {
  const addInvite = useApp((s) => s.addInvite);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("emprendedor");
  const [durationValue, setDurationValue] = useState<number>(1);
  const [durationUnit, setDurationUnit] = useState<"days" | "months">("months");
  const [isCustomPrice, setIsCustomPrice] = useState(false);
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState<GeneratedLink[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const token = generateToken();

      await addInvite({
        token,
        plan: selectedPlan,
        used: false,
        durationMonths: durationUnit === "months" ? durationValue : 0,
        durationValue,
        durationUnit,
        customPrice: selectedPlan !== "semilla" && isCustomPrice ? customPrice : undefined,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        notes: notes.trim() || undefined,
      });

      const url = `${window.location.origin}/register?invite=${token}`;
      const linkExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const newLink: GeneratedLink = {
        token,
        plan: selectedPlan,
        durationValue,
        durationUnit,
        customPrice: selectedPlan !== "semilla" && isCustomPrice ? customPrice : undefined,
        url,
        createdAt: new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
        linkExpiresAt: formatShortDate(linkExpiresAt),
      };

      setGeneratedLinks((prev) => [newLink, ...prev].slice(0, 8));
      await copyToClipboard(url, token);
      toast.success("Enlace generado y copiado!");
      setNotes("");
      if (onGenerate) onGenerate();
    } catch {
      toast.error("Error al generar el enlace. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (url: string, token: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch {
      toast.error("No se pudo copiar. Copia el link manualmente.");
    }
  };

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* Selección de Plan */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Plan
          </label>
          <select
            value={selectedPlan}
            onChange={(e) => {
              const val = e.target.value as PlanId;
              setSelectedPlan(val);
              if (val === "semilla") {
                setIsCustomPrice(false);
              }
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          >
            {PLAN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Duración Dinámica */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-primary" /> Duración
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={durationValue}
              onChange={(e) => setDurationValue(Math.max(1, Number(e.target.value)))}
              disabled={selectedPlan === "semilla"}
              className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm text-center font-bold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <select
              value={durationUnit}
              onChange={(e) => setDurationUnit(e.target.value as "days" | "months")}
              disabled={selectedPlan === "semilla"}
              className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <option value="months">Meses</option>
              <option value="days">Días</option>
            </select>
          </div>
        </div>

        {/* Precio Personalizado */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Precio Especial
          </label>
          <div className="flex items-center gap-2 h-10">
            <input
              type="checkbox"
              id="custom-price-checkbox"
              checked={isCustomPrice}
              onChange={(e) => setIsCustomPrice(e.target.checked)}
              disabled={selectedPlan === "semilla"}
              className="rounded border-input text-primary focus:ring-primary h-4 w-4 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            />
            <label 
              htmlFor="custom-price-checkbox" 
              className={`text-sm font-medium select-none cursor-pointer ${selectedPlan === "semilla" ? "text-muted-foreground opacity-50" : "text-foreground"}`}
            >
              Personalizar (S/)
            </label>
            {isCustomPrice && selectedPlan !== "semilla" && (
              <input
                type="number"
                step="0.01"
                min="0"
                value={customPrice}
                onChange={(e) => setCustomPrice(Math.max(0, Number(e.target.value)))}
                className="flex h-10 w-24 rounded-md border border-input bg-background px-3 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                placeholder="0.00"
              />
            )}
          </div>
        </div>

        {/* Botón de Generar */}
        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="h-10 px-6 shadow-lg shadow-primary/20 w-full"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Generando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Generar y Copiar Link
            </span>
          )}
        </Button>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowNotes(!showNotes)}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          <FileText className="w-3 h-3" />
          {showNotes ? "Ocultar notas" : "Agregar nota interna (opcional)"}
        </button>
        {showNotes && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Cliente referido por Maria Lopez, acordado por WhatsApp..."
            rows={2}
            className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          />
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        El link expira en <strong>30 días</strong> si no se usa.
        {selectedPlan !== "semilla" && (
          <>
            {" "}El plan <strong>{PLAN_OPTIONS.find(o => o.value === selectedPlan)?.label.split(" (")[0]}</strong> durará{" "}
            <strong>
              {durationValue} {durationUnit === "months" ? (durationValue === 1 ? "mes" : "meses") : (durationValue === 1 ? "día" : "días")}
            </strong>{" "}
            desde que el cliente se registre{isCustomPrice ? <> con un precio especial de <strong>S/ {customPrice.toFixed(2)}</strong></> : ""}.
          </>
        )}
      </p>

      {generatedLinks.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-primary/10">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Links generados esta sesión
          </p>
          {generatedLinks.map((link) => (
            <div
              key={link.token}
              className="flex flex-col sm:flex-row sm:items-center gap-2 bg-background rounded-lg border p-3 text-sm shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                  link.plan === "ilimitado" ? "bg-purple-100 text-purple-700" :
                  link.plan === "pro" ? "bg-blue-100 text-blue-700" :
                  link.plan === "emprendedor" ? "bg-orange-100 text-orange-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {link.plan}
                </span>

                {link.plan !== "semilla" && (
                  <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5 text-primary" />
                    <strong>{link.durationValue} {link.durationUnit === "months" ? "mes(es)" : "día(s)"}</strong>
                    {link.customPrice !== undefined && (
                      <span className="text-emerald-600 font-bold ml-1">
                        S/ {Number(link.customPrice).toFixed(2)}
                      </span>
                    )}
                  </span>
                )}
              </div>

              <span className="flex-1 truncate text-muted-foreground font-mono text-xs select-all bg-muted/30 px-2 py-1 rounded border">
                {link.url}
              </span>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                  Link vence: {link.linkExpiresAt}
                </span>
                <span className="text-xs text-muted-foreground">{link.createdAt}</span>

                <button
                  onClick={() => copyToClipboard(link.url, link.token)}
                  className="p-1.5 rounded hover:bg-muted border border-transparent hover:border-input transition-all"
                  title="Copiar link"
                >
                  {copiedToken === link.token
                    ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                    : <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
