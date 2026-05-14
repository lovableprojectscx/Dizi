import { useState, useRef, useCallback } from "react";
import { ImageIcon, CheckCircle2, AlertTriangle, Info, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { convertImageToWebP } from "@/lib/image-utils";
import type { ImageSpec } from "@/lib/types";
import { checkImageRatio } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [ratioStatus, setRatioStatus] = useState<RatioStatus>(null);
  const [ratioMessage, setRatioMessage] = useState("");
  const [showHint, setShowHint] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

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

  const isDataUrl = value.startsWith("data:");
  const isUrl = value.startsWith("http");
  const hasImage = isDataUrl || isUrl;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <button
          type="button"
          onClick={() => setShowHint(!showHint)}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Info className="w-3 h-3" />
          {showHint ? "Ocultar guia" : "Ver proporcion recomendada"}
        </button>
      </div>

      {/* ── Guia de proporcion ── */}
      {showHint && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
          <div className="flex items-start gap-3">
            {/* Visualizacion de proporcion */}
            <div className="shrink-0">
              <div
                className="bg-primary/20 border border-primary/30 rounded flex items-center justify-center"
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
              <p className="text-xs text-muted-foreground mt-0.5">{spec.hint}</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground border-t pt-2 mt-1">
            Tolerancia: hasta un {Math.round(spec.tolerance * 100)}% de diferencia se acepta sin aviso.
            Herramienta gratuita recomendada para recortar:{" "}
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
        className={[
          "relative border-2 border-dashed rounded-xl overflow-hidden transition-all",
          drag ? "border-primary bg-primary/5 scale-[1.01]" : "border-border",
          converting ? "opacity-70" : "",
        ].join(" ")}
        style={{ paddingBottom: `${Math.min(previewHeightPercent, 85)}%` }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {converting ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <span className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium">Optimizando imagen...</span>
              <span className="text-[10px] text-muted-foreground">Convirtiendo a WebP</span>
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
            <div className="flex flex-col items-center gap-2 text-muted-foreground px-4 text-center">
              <UploadCloud className="w-8 h-8 opacity-40" />
              <div>
                <p className="text-sm font-medium">Arrastra una imagen aqui</p>
                <p className="text-xs opacity-60 mt-0.5">
                  Proporcion recomendada: <strong>{spec.label}</strong>
                </p>
                <p className="text-[10px] opacity-50">JPG, PNG, WEBP hasta 10 MB</p>
              </div>
            </div>
          )}
        </div>

        {/* Input invisible */}
        {!converting && (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
        )}

        {/* Badge de proporcion recomendada (siempre visible) */}
        {!hasImage && !converting && (
          <div className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm border rounded-full px-2 py-0.5 flex items-center gap-1">
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
      <Input
        placeholder="O pega una URL de imagen..."
        value={isDataUrl ? "" : value}
        onChange={(e) => {
          onChange(e.target.value);
          setRatioStatus(null);
        }}
        className="text-xs"
      />
    </div>
  );
}
