/**
 * Inyección dinámica de fuentes tipográficas bajo demanda (Paso 2 - FASE 3B)
 * Solo carga Playfair Display, Quicksand u Outfit cuando la tienda o el bio-link las utiliza.
 */

const LOADED_FONTS = new Set<string>();

const FONT_URLS: Record<string, string> = {
  serif:
    "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..700;1,400..700&display=swap",
  rounded:
    "https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap",
  modern:
    "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap",
};

export function loadFontOnDemand(typography?: string | null): void {
  if (!typography || typography === "sans" || typeof document === "undefined") {
    return;
  }

  const key = typography.toLowerCase();
  const url = FONT_URLS[key];
  if (!url || LOADED_FONTS.has(key)) {
    return;
  }

  // Prevenir duplicados si ya existe en el DOM
  if (document.querySelector(`link[data-dizi-font="${key}"]`)) {
    LOADED_FONTS.add(key);
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  link.setAttribute("data-dizi-font", key);
  document.head.appendChild(link);
  LOADED_FONTS.add(key);
}
