/**
 * @file promo-ideas.ts
 * @description Lista pura de fechas comerciales de Perú y cálculo de "Ideas para vender" (RF-54.9).
 * Usa siempre la fecha calendario de Lima (`America/Lima`), nunca la UTC del navegador.
 */

import type { CaptionTemplate } from "@/lib/share-image/caption";
import type { ShareImageStyle } from "@/lib/share-image/types";

export interface PromoIdea {
  id: string;
  title: string;
  advice: string;
  suggestedStyle: ShareImageStyle;
  /** Si el estilo sugerido es "oferta" y el producto no tiene oferta, cae a este estilo. */
  fallbackStyle?: ShareImageStyle;
  captionTemplate: CaptionTemplate;
  /** Días faltantes respecto a la fecha actual en Lima (`null` para la idea permanente). */
  daysUntil: number | null;
  /** Fecha objetivo en formato YYYY-MM-DD (Lima) o `null` para la idea permanente. */
  dateIso: string | null;
  isPermanent: boolean;
}

interface CalendarDate {
  year: number;
  month: number; // 1..12
  day: number; // 1..31
}

export const PERMANENT_PROMO_IDEA: PromoIdea = {
  id: "producto-de-la-semana",
  title: "Producto de la semana",
  advice: "Elige un producto y publícalo hoy en tus estados.",
  suggestedStyle: "etiqueta",
  captionTemplate: "simple",
  daysUntil: null,
  dateIso: null,
  isPermanent: true,
};

/**
 * Obtiene año, mes (1..12) y día (1..31) según la zona horaria `America/Lima`.
 */
export function getLimaCalendarDate(date: Date = new Date()): CalendarDate {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((p) => p.type === "year")?.value ?? 2026);
  const month = Number(parts.find((p) => p.type === "month")?.value ?? 1);
  const day = Number(parts.find((p) => p.type === "day")?.value ?? 1);
  return { year, month, day };
}

function toUtcDayNumber({ year, month, day }: CalendarDate): number {
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function formatIsoDate({ year, month, day }: CalendarDate): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Devuelve el día del mes (1..31) para la n-ésima ocurrencia de un día de semana.
 * @param year Año calendario
 * @param month Mes 1..12
 * @param weekday 0 = domingo .. 6 = sábado
 * @param nth 1 = primero, 2 = segundo, 3 = tercero, 4 = cuarto
 */
export function getNthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  nth: number,
): number {
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const offset = (weekday - firstDow + 7) % 7;
  return 1 + offset + (nth - 1) * 7;
}

/**
 * Construye todas las fechas comerciales de Perú para un año dado (incluye móviles).
 */
export function getPeruPromoDatesForYear(year: number): Array<{
  id: string;
  date: CalendarDate;
  title: string;
  advice: string;
  suggestedStyle: ShareImageStyle;
  fallbackStyle?: ShareImageStyle;
  captionTemplate: CaptionTemplate;
}> {
  const mothersDay = getNthWeekdayOfMonth(year, 5, 0, 2); // 2.º domingo de mayo
  const fathersDay = getNthWeekdayOfMonth(year, 6, 0, 3); // 3.er domingo de junio
  const blackFriday = getNthWeekdayOfMonth(year, 11, 4, 4) + 1; // viernes tras 4.º jueves de nov

  return [
    {
      id: `san-valentin-${year}`,
      date: { year, month: 2, day: 14 },
      title: "San Valentín",
      advice: "Publica tus regalos estrella con precio claro.",
      suggestedStyle: "marco-color",
      captionTemplate: "novedad",
    },
    {
      id: `dia-de-la-mujer-${year}`,
      date: { year, month: 3, day: 8 },
      title: "Día de la Mujer",
      advice: "Arma un detalle listo para regalar y muéstralo.",
      suggestedStyle: "editorial",
      captionTemplate: "novedad",
    },
    {
      id: `dia-de-la-madre-${year}`,
      date: { year, month: 5, day: mothersDay },
      title: "Día de la Madre",
      advice: "Es la fecha que más vende: publica una semana antes.",
      suggestedStyle: "etiqueta",
      captionTemplate: "novedad",
    },
    {
      id: `dia-del-padre-${year}`,
      date: { year, month: 6, day: fathersDay },
      title: "Día del Padre",
      advice: "Muestra opciones por rango de precio.",
      suggestedStyle: "etiqueta",
      captionTemplate: "simple",
    },
    {
      id: `fiestas-patrias-${year}`,
      date: { year, month: 7, day: 28 },
      title: "Fiestas Patrias",
      advice: "Un producto en rojo y blanco llama la atención.",
      suggestedStyle: "marco-color",
      captionTemplate: "simple",
    },
    {
      id: `fin-de-octubre-${year}`,
      date: { year, month: 10, day: 31 },
      title: "Fin de octubre",
      advice: "Aprovecha el feriado largo para recordar tu catálogo.",
      suggestedStyle: "editorial",
      captionTemplate: "simple",
    },
    {
      id: `black-friday-${year}`,
      date: { year, month: 11, day: blackFriday },
      title: "Black Friday",
      advice: "Si tienes oferta, este es el día de mostrarla.",
      suggestedStyle: "oferta",
      fallbackStyle: "etiqueta",
      captionTemplate: "oferta",
    },
    {
      id: `navidad-${year}`,
      date: { year, month: 12, day: 25 },
      title: "Navidad",
      advice: "Publica tus regalos desde ya; la gente compra con anticipación.",
      suggestedStyle: "marco-color",
      captionTemplate: "novedad",
    },
  ];
}

/**
 * RF-54.9: Devuelve hasta `maxCount` (por defecto 2) fechas comerciales dentro de los
 * próximos `windowDays` (45) días según hora de Lima. Si no hay ninguna, retorna la idea permanente.
 */
export function getUpcomingIdeas(
  now: Date = new Date(),
  windowDays = 45,
  maxCount = 2,
): PromoIdea[] {
  const todayLima = getLimaCalendarDate(now);
  const todayNum = toUtcDayNumber(todayLima);

  const candidates = [
    ...getPeruPromoDatesForYear(todayLima.year),
    ...getPeruPromoDatesForYear(todayLima.year + 1),
  ];

  const upcoming: PromoIdea[] = candidates
    .map((entry) => {
      const diff = toUtcDayNumber(entry.date) - todayNum;
      return {
        id: entry.id,
        title: entry.title,
        advice: entry.advice,
        suggestedStyle: entry.suggestedStyle,
        fallbackStyle: entry.fallbackStyle,
        captionTemplate: entry.captionTemplate,
        daysUntil: diff,
        dateIso: formatIsoDate(entry.date),
        isPermanent: false,
      };
    })
    .filter((idea) => idea.daysUntil !== null && idea.daysUntil >= 0 && idea.daysUntil <= windowDays)
    .sort((a, b) => (a.daysUntil ?? 0) - (b.daysUntil ?? 0))
    .slice(0, maxCount);

  if (upcoming.length === 0) {
    return [PERMANENT_PROMO_IDEA];
  }
  return upcoming;
}

/**
 * Resuelve el estilo efectivo para abrir el creador desde una idea según si el producto tiene oferta.
 */
export function resolveIdeaStyle(idea: PromoIdea, productHasOffer: boolean): ShareImageStyle {
  if (idea.suggestedStyle === "oferta" && !productHasOffer) {
    return idea.fallbackStyle ?? "etiqueta";
  }
  return idea.suggestedStyle;
}

/**
 * Formatea la etiqueta de cuenta regresiva de una idea.
 */
export function formatIdeaCountdown(idea: PromoIdea): string {
  if (idea.isPermanent || idea.daysUntil === null) return "Siempre vigente";
  if (idea.daysUntil === 0) return "Hoy";
  if (idea.daysUntil === 1) return "Mañana";
  return `En ${idea.daysUntil} días`;
}
