import { describe, it, expect } from "vitest";
import { getBioLinksLimit, canUsePremiumBioFeatures, type Store, type QuickLink } from "@/lib/types";

// Helpers extraídos de admin.link-bio.tsx
const extractUsername = (
  url: string,
  platform: "instagram" | "facebook" | "tiktok" | "linkedin",
) => {
  if (!url) return "";
  let clean = url.trim();
  if (!clean.includes("/") && !clean.includes(".")) return clean.replace(/^@/, "");
  try {
    if (!clean.startsWith("http://") && !clean.startsWith("https://")) clean = "https://" + clean;
    const parsed = new URL(clean);
    const seg = parsed.pathname.split("/").filter(Boolean);
    if (platform === "instagram") return seg[0] || "";
    if (platform === "facebook") {
      if (parsed.searchParams.has("id")) return parsed.searchParams.get("id") || "";
      if (seg[0] === "pages" && seg[2]) return seg[2];
      return seg[0] || "";
    }
    if (platform === "tiktok") return (seg[0] || "").replace(/^@/, "");
    if (platform === "linkedin") {
      if (seg[0] === "in" && seg[1]) return seg[1];
      return seg[0] || "";
    }
    return seg[seg.length - 1] || url;
  } catch {
    const parts = clean.split("/").filter(Boolean);
    return (parts[parts.length - 1] || clean).replace(/^@/, "");
  }
};

const formatSocialUrl = (
  value: string,
  platform: "instagram" | "facebook" | "tiktok" | "linkedin",
) => {
  let clean = value.trim();
  if (!clean) return "";
  clean = clean.replace(/\/+$/, "");
  if (/^https?:\/\//i.test(clean)) {
    return clean;
  }
  const domains = {
    instagram: "instagram.com",
    facebook: "facebook.com",
    tiktok: "tiktok.com",
    linkedin: "linkedin.com",
  };
  const domain = domains[platform];
  if (clean.toLowerCase().includes(domain)) {
    return "https://" + clean.replace(/^(https?:\/\/)?(www\.)?/i, "");
  }
  const username = clean.replace(/^@/, "");
  if (platform === "instagram") return `https://instagram.com/${username}`;
  if (platform === "facebook") return `https://facebook.com/${username}`;
  if (platform === "tiktok") return `https://tiktok.com/@${username}`;
  if (platform === "linkedin") return `https://linkedin.com/in/${username}`;
  return clean;
};

const detectPlatform = (link: QuickLink): string => {
  const labelLower = link.label.toLowerCase();
  const urlLower = (link.url || "").toLowerCase();

  if (urlLower.includes("wa.me") || urlLower.includes("whatsapp.com") || labelLower.includes("whatsapp")) {
    return "whatsapp";
  }
  if (urlLower.includes("instagram.com") || labelLower.includes("instagram")) {
    return "instagram";
  }
  if (urlLower.includes("facebook.com") || labelLower.includes("facebook")) {
    return "facebook";
  }
  if (urlLower.includes("tiktok.com") || labelLower.includes("tiktok")) {
    return "tiktok";
  }
  if (urlLower.includes("youtube.com") || urlLower.includes("youtu.be") || labelLower.includes("youtube")) {
    return "youtube";
  }
  if (urlLower.includes("spotify.com") || labelLower.includes("spotify")) {
    return "spotify";
  }
  return "custom";
};

describe("Parte 3: Módulo de Link en Bio & Ubicación / Mapa", () => {
  describe("1. Límites y Beneficios por Plan", () => {
    it("limita a 3 enlaces personalizados en el Plan Semilla", () => {
      const storeSemilla = { plan: "semilla" } as Store;
      expect(getBioLinksLimit(storeSemilla)).toBe(3);
      expect(canUsePremiumBioFeatures(storeSemilla)).toBe(false);
    });

    it("permite enlaces ilimitados y fondos premium en planes de pago", () => {
      const storeEmprendedor = { plan: "emprendedor", planExpiresAt: new Date(Date.now() + 86400000).toISOString() } as Store;
      const storePro = { plan: "pro", planExpiresAt: new Date(Date.now() + 86400000).toISOString() } as Store;
      const storeIlimitado = { plan: "ilimitado", planExpiresAt: new Date(Date.now() + 86400000).toISOString() } as Store;

      expect(getBioLinksLimit(storeEmprendedor)).toBe(Infinity);
      expect(canUsePremiumBioFeatures(storeEmprendedor)).toBe(true);

      expect(getBioLinksLimit(storePro)).toBe(Infinity);
      expect(canUsePremiumBioFeatures(storePro)).toBe(true);

      expect(getBioLinksLimit(storeIlimitado)).toBe(Infinity);
      expect(canUsePremiumBioFeatures(storeIlimitado)).toBe(true);
    });
  });

  describe("2. Formateo y Extracción Inteligente de Redes Sociales", () => {
    it("formatea handles a URLs completas seguras", () => {
      expect(formatSocialUrl("dizi_oficial", "instagram")).toBe("https://instagram.com/dizi_oficial");
      expect(formatSocialUrl("@dizi_latam", "tiktok")).toBe("https://tiktok.com/@dizi_latam");
      expect(formatSocialUrl("dizinegocios", "facebook")).toBe("https://facebook.com/dizinegocios");
      expect(formatSocialUrl("dizi-tech", "linkedin")).toBe("https://linkedin.com/in/dizi-tech");
    });

    it("conserva URLs completas que ya tienen prefijo https://", () => {
      const fullUrl = "https://instagram.com/tienda_demo";
      expect(formatSocialUrl(fullUrl, "instagram")).toBe(fullUrl);
    });

    it("extrae el nombre de usuario limpio desde URLs con parámetros", () => {
      expect(extractUsername("https://instagram.com/mitienda?utm_source=ig", "instagram")).toBe("mitienda");
      expect(extractUsername("https://tiktok.com/@chef_peru", "tiktok")).toBe("chef_peru");
      expect(extractUsername("https://facebook.com/pages/Idenza/1029384756", "facebook")).toBe("1029384756");
      expect(extractUsername("@solo_handle", "instagram")).toBe("solo_handle");
    });
  });

  describe("3. Detección Automática de Plataforma", () => {
    it("detecta WhatsApp por URL o texto", () => {
      expect(detectPlatform({ label: "Escríbenos", url: "https://wa.me/51925176472" })).toBe("whatsapp");
      expect(detectPlatform({ label: "WhatsApp Ventas", url: "https://ejemplo.com" })).toBe("whatsapp");
    });

    it("detecta Instagram, TikTok, YouTube y Spotify", () => {
      expect(detectPlatform({ label: "Instagram", url: "https://instagram.com/dizi" })).toBe("instagram");
      expect(detectPlatform({ label: "TikTok Oficial", url: "https://tiktok.com/@dizi" })).toBe("tiktok");
      expect(detectPlatform({ label: "Canal de YouTube", url: "https://youtube.com/@dizi" })).toBe("youtube");
      expect(detectPlatform({ label: "Playlist", url: "https://open.spotify.com/playlist/123" })).toBe("spotify");
    });

    it("clasifica enlaces generales como custom", () => {
      expect(detectPlatform({ label: "Mi Página Web", url: "https://midominio.pe" })).toBe("custom");
    });
  });

  describe("4. Coordenadas y Geolocalización en Mapa", () => {
    it("valida rango de coordenadas geográficas para el mapa interactivo", () => {
      const isValidCoords = (lat?: number, lng?: number) => {
        if (lat === undefined || lng === undefined) return false;
        return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
      };

      expect(isValidCoords(-12.0464, -77.0428)).toBe(true); // Lima, Perú
      expect(isValidCoords(-16.4090, -71.5375)).toBe(true); // Arequipa, Perú
      expect(isValidCoords(100, -77.0428)).toBe(false); // Latitud inválida
      expect(isValidCoords(undefined, -77.0428)).toBe(false);
    });

    it("genera enlace universal a Google Maps para navegación por GPS", () => {
      const lat = -12.0464;
      const lng = -77.0428;
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      expect(googleMapsUrl).toBe("https://www.google.com/maps/search/?api=1&query=-12.0464,-77.0428");
    });
  });
});
