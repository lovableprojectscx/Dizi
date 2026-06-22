import { useState, useRef, useCallback } from "react";
import { ImageIcon, CheckCircle2, AlertTriangle, Info, UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { convertImageToWebP, convertImageUrlToWebP } from "@/lib/image-utils";
import type { ImageSpec } from "@/lib/types";
import { checkImageRatio } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ImageUploadGuidedProps {
  value: string;
  onChange: (v: string) => void;
  spec: ImageSpec;
  label?: string;
}

type RatioStatus = "ok" | "warning" | null;

export function ImageUploadGuided({
  value,
  onChange,
  spec,
  label = "Imagen del producto",
}: ImageUploadGuidedProps) {
  const [drag, setDrag] = useState(false);
  const [converting, setConverting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importWarning, setImportWarning] = useState<string | null>(null);
  const [ratioStatus, setRatioStatus] = useState<RatioStatus>(null);
  const [ratioMessage, setRatioMessage] = useState("");
  const [showHint, setShowHint] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(() => {
    if (typeof value === "string" && value.startsWith("http")) {
      return !value.includes(".supabase.co/");
    }
    return false;
  });

  const handleUrlChange = async (url: string) => {
    onChange(url);
    setRatioStatus(null);
    setImportWarning(null);

    const trimmed = url.trim();
    if (!trimmed) return;

    const isHttpUrl = trimmed.startsWith("http://") || trimmed.startsWith("https://");
    if (!isHttpUrl) return;

    // Detectar si han pegado un enlace de página de Facebook/Instagram en lugar de la imagen directa
    const isSocialPageUrl =
      (trimmed.includes("facebook.com") || trimmed.includes("instagram.com")) &&
      !trimmed.includes("fbcdn.net") &&
      !trimmed.includes("cdninstagram.com");

    if (isSocialPageUrl) {
      setImportWarning(
        "⚠️ Has pegado el enlace de la página de la publicación/foto de Facebook/Instagram y no la imagen directamente.\n\n" +
        "Para solucionarlo:\n" +
        "• En Computadora: Haz clic derecho sobre la foto en Facebook/Instagram, selecciona 'Copiar dirección de imagen' y pega ese enlace aquí.\n" +
        "• En Celular: Mantén presionada la foto, selecciona 'Descargar imagen' y súbela como archivo en la zona de arriba."
      );
      return;
    }

    // Si es un enlace de redes sociales conocidos por expirar, avisar inmediatamente
    const isVolatileUrl =
      trimmed.includes("fbcdn.net") ||
      trimmed.includes("instagram.com") ||
      trimmed.includes("cdninstagram.com") ||
      trimmed.includes("whatsapp.com") ||
      trimmed.includes("wa.me") ||
      trimmed.includes("facebook.com");

    setImporting(true);
    try {
      const webpDataUrl = await convertImageUrlToWebP(trimmed);
      onChange(webpDataUrl);
      toast.success("¡Imagen importada y optimizada con éxito!");
      setImportWarning(null);
      // Check ratio after setting — use an Image object
      const img = new Image();
      img.onload = () => checkRatioAfterLoad(img);
      img.src = webpDataUrl;
    } catch (err) {
      console.warn("[convertImageUrlToWebP] Failed to convert URL:", err);
      if (isVolatileUrl) {
        setImportWarning(
          "⚠️ Este enlace pertenece a una red social (Facebook/Instagram/WhatsApp). Los enlaces de estas plataformas expiran automáticamente y la imagen dejará de verse pronto. Te recomendamos descargar la imagen a tu dispositivo y subirla directamente aquí."
        );
      } else {
        setImportWarning(
          "⚠️ No pudimos optimizar esta imagen para guardarla de forma permanente debido a restricciones de seguridad del sitio de origen (CORS). El enlace se guardará, pero si la web original elimina la imagen, dejará de verse."
        );
      }
    } finally {
      setImporting(false);
    }
  };

  // Parse ratio for the preview box
  const [rW, rH] = spec.ratio.split("/").map(Number);
  const previewHeightPercent = (rH / rW) * 100;

  const checkRatioAfterLoad = useCallback(
    (img: HTMLImageElement) => {
      const result = checkImageRatio(img.naturalWidth, img.naturalHeight, spec);
      setRatioStatus(result.status);
      setRatioMessage(result.message);
    },
    [spec]
  );

  const handleFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagen muy grande (max 10 MB)");
      return;
    }
    setConverting(true);
    setRatioStatus(null);
    try {
      const webpDataUrl = await convertImageToWebP(file);
      onChange(webpDataUrl);
      // Check ratio after setting — use an Image object
      const img = new Image();
      img.onload = () => checkRatioAfterLoad(img);
      img.src = webpDataUrl;
    } catch {
      toast.error("No se pudo procesar la imagen.");
    } finally {
      setConverting(false);
    }
  };

  const isDataUrl = typeof value === "string" && value.startsWith("data:");
  const isUrl = typeof value === "string" && value.startsWith("http");
  const hasImage = !!(isDataUrl || isUrl);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">{label}</Label>
        <button
          type="button"
          onClick={() => setShowHint(!showHint)}
          className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:opacity-90 transition-opacity"
        >
          <Info className="w-3.5 h-3.5" />
          {showHint ? "Ocultar guía" : "Ver proporción"}
        </button>
      </div>

      {/* ── Guia de proporcion ── */}
      {showHint && (
        <div className="rounded-xl border border-primary/10 bg-primary/5 p-3 space-y-2">
          <div className="flex items-start gap-3">
            {/* Visualizacion de proporcion */}
            <div className="shrink-0">
              <div
                className="bg-primary/10 border border-primary/20 rounded flex items-center justify-center"
                style={{
                  width: `${Math.min(52, 52 * (rW / Math.max(rW, rH)))}px`,
                  height: `${Math.min(52, 52 * (rH / Math.max(rW, rH)))}px`,
                }}
              >
                <span className="text-[9px] font-bold text-primary">{rW}:{rH}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs text-primary">{spec.label} — {spec.width} x {spec.height} px</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{spec.hint}</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground border-t pt-2 mt-1">
            Tolerancia: hasta un {Math.round(spec.tolerance * 100)}% de diferencia se acepta sin aviso.
            Herramienta recomendada:{" "}
            <a href="https://squoosh.app" target="_blank" rel="noreferrer" className="text-primary underline">squoosh.app</a>
          </p>
        </div>
      )}

      {/* ── Area de drop con preview proporcional ── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        className={cn(
          "relative border border-dashed rounded-xl overflow-hidden transition-all flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/5 hover:bg-slate-100/50 dark:hover:bg-slate-900/10",
          drag ? "border-primary bg-primary/5 scale-[1.01]" : "border-slate-200 dark:border-slate-800",
          converting || importing ? "opacity-70" : "",
          hasImage ? "w-full" : "w-full h-32 sm:h-auto sm:aspect-square"
        )}
        style={hasImage ? { aspectRatio: `${rW} / ${rH}` } : undefined}
      >
        {converting || importing ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground text-center px-4">
            <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">
              {converting ? "Optimizando imagen..." : "Importando imagen..."}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {converting ? "Convirtiendo a WebP" : "Descargando de URL externa"}
            </span>
          </div>
        ) : hasImage ? (
          <img
            ref={imgRef}
            src={value}
            alt="preview"
            className="absolute inset-0 w-full h-full object-cover"
            onLoad={(e) => checkRatioAfterLoad(e.currentTarget)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground px-4 text-center">
            <UploadCloud className="w-6 h-6 text-muted-foreground/60" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Seleccionar imagen</p>
              <p className="text-[10px] text-muted-foreground">Formatos JPG, PNG, WebP (máx. 10MB)</p>
            </div>
          </div>
        )}

        {/* Input invisible */}
        {!converting && !importing && (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
        )}

        {/* Badge de proporcion recomendada (siempre visible) */}
        {!hasImage && !converting && !importing && (
          <div className="absolute bottom-2 right-2 z-10 bg-background/90 backdrop-blur-sm border border-slate-100 dark:border-slate-800 rounded-full px-2 py-0.5 flex items-center gap-1 shadow-sm">
            <span className="text-[9px] font-bold text-muted-foreground">{spec.label}</span>
          </div>
        )}
      </div>

      {/* ── Indicador de ratio ── */}
      {ratioStatus === "ok" && hasImage && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Proporcion correcta ({spec.label})
        </div>
      )}
      {ratioStatus === "warning" && (
        <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">Proporcion diferente:</span> {ratioMessage}
            <span className="text-amber-600 block mt-0.5">
              Recomendamos {spec.label} ({spec.width} x {spec.height} px) para este modelo.
            </span>
          </div>
        </div>
      )}

      {/* ── URL manual ── */}
      <div className="space-y-1.5">
        {!showUrlInput ? (
          <button
            type="button"
            onClick={() => setShowUrlInput(true)}
            className="text-[10px] text-muted-foreground hover:text-primary transition-colors font-semibold flex items-center gap-1 mt-1 cursor-pointer"
          >
            <span>🔗 Pegar enlace de imagen (avanzado)</span>
          </button>
        ) : (
          <div className="space-y-1.5 border-t border-border/20 pt-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Enlace de imagen</span>
              <button
                type="button"
                onClick={() => setShowUrlInput(false)}
                className="text-[10px] text-destructive hover:underline font-bold"
              >
                Ocultar
              </button>
            </div>
            <div className="relative flex items-center">
              <Input
                placeholder="O pega una URL de imagen..."
                value={isDataUrl ? "" : (value || "")}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="text-xs pr-8"
                disabled={importing || converting}
              />
              {importing && (
                <Loader2 className="absolute right-2.5 h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
        )}

        {importWarning && (
          <p className="text-[11px] leading-relaxed text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2.5 whitespace-pre-line mt-1.5">
            {importWarning}
          </p>
        )}
      </div>
    </div>
  );
}
