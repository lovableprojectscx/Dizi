/**
 * @file PromoIdeas.tsx
 * @description Tarjetas "Ideas para vender" en Promociona (/admin/marketing) (RF-54.9).
 */

import { Calendar, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatIdeaCountdown, type PromoIdea } from "@/lib/promo-ideas";
import { cn } from "@/lib/utils";

export interface PromoIdeasProps {
  ideas: PromoIdea[];
  onCreateForIdea: (idea: PromoIdea) => void;
}

export function PromoIdeas({ ideas, onCreateForIdea }: PromoIdeasProps) {
  if (ideas.length === 0) return null;

  return (
    <section
      data-testid="promo-ideas-section"
      aria-label="Ideas para vender"
      className="space-y-3"
    >
      <div className="space-y-0.5">
        <h2 className="font-heading font-semibold text-[22px] sm:text-[24px] leading-tight text-foreground">
          Ideas para vender
        </h2>
        <p className="text-[13px] text-muted-foreground">
          Fechas próximas en Perú para preparar tus estados con anticipación
        </p>
      </div>

      <div
        className={cn(
          "grid gap-3",
          ideas.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1",
        )}
      >
        {ideas.map((idea) => (
          <Card
            key={idea.id}
            data-testid="promo-idea-card"
            data-idea-id={idea.id}
            className="rounded-2xl border border-border bg-card shadow-xs"
          >
            <CardContent className="p-5 flex flex-col justify-between gap-4 h-full">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary text-brand px-3 py-1 text-[13px] font-semibold">
                  {idea.isPermanent ? (
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>{formatIdeaCountdown(idea)}</span>
                </span>

                <h3 className="font-heading font-semibold text-[20px] leading-snug text-foreground">
                  {idea.title}
                </h3>

                <p className="text-[16px] leading-relaxed text-muted-foreground">
                  {idea.advice}
                </p>
              </div>

              <div>
                <Button
                  type="button"
                  onClick={() => onCreateForIdea(idea)}
                  className="rounded-xl bg-primary hover:bg-primary/90 text-dizi-ink font-bold text-[16px] min-h-[48px] px-4 w-full sm:w-auto shadow-xs transition-colors duration-200 motion-reduce:transition-none cursor-pointer"
                >
                  Crear para {idea.title}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
