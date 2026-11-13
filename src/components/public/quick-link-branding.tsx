import React from "react";

export type QuickLinkPlatform =
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "linkedin"
  | "youtube"
  | "spotify"
  | "pinterest"
  | "twitter"
  | "custom";

export interface QuickLinkBrandingResult {
  platform: QuickLinkPlatform;
  bg: string;
  borderColor: string;
  glowColor: string;
  baseColor: string;
  coloredIcon: React.ReactNode;
}

export function normalizeQuickLinkHref(url?: string): string {
  const trimmed = (url || "").trim();
  if (!trimmed) return "#";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * Resuelve plataforma, paleta oficial e ícono SVG para los enlaces rápidos / Link en Bio.
 * Compartido entre Bio-Link (PublicCatalog) y el diseño Perfil (ProfileHeader).
 */
export function getQuickLinkBranding(
  label: string,
  url: string,
  iconClassName = "h-7 w-7"
): QuickLinkBrandingResult {
  const labelLower = (label || "").toLowerCase();
  const urlLower = (url || "").toLowerCase();

  // WhatsApp
  if (
    urlLower.includes("wa.me") ||
    urlLower.includes("whatsapp.com") ||
    labelLower.includes("whatsapp")
  ) {
    return {
      platform: "whatsapp",
      bg: "#25d366",
      borderColor: "#128c7e",
      glowColor: "rgba(37, 211, 102, 0.45)",
      baseColor: "#25d366",
      coloredIcon: (
        <svg className={iconClassName} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#25d366" />
          <path
            fill="#FFF"
            d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.767.46 3.427 1.267 4.887L2 22l5.227-1.373A9.972 9.972 0 0 0 12.004 22c5.524 0 10.004-4.48 10.004-10.004C22.008 6.48 17.528 2 12.004 2zm4.846 11.233c-.23.633-1.34 1.167-1.854 1.25-.47.083-1.077.15-3.083-.683-2.56-1.06-4.226-3.67-4.353-3.84-.127-.17-.99-1.32-.99-2.52 0-1.2.62-1.78.84-2.02.22-.24.47-.3.63-.3.16 0 .32 0 .46.01.15.01.35-.06.55.42.2.49.69 1.68.75 1.8.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.25.32-.36.43-.12.13-.25.27-.1.53.15.26.66 1.09 1.41 1.76.97.87 1.79 1.14 2.05 1.27.26.13.41.11.56-.06.15-.17.65-.76.82-1.02.17-.26.34-.22.57-.13.23.09 1.47.69 1.72.82.25.13.42.19.48.3.06.11.06.63-.17 1.26z"
            transform="scale(0.75) translate(4, 4)"
          />
        </svg>
      ),
    };
  }
  // Instagram
  if (urlLower.includes("instagram.com") || labelLower.includes("instagram")) {
    return {
      platform: "instagram",
      bg: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
      borderColor: "transparent",
      glowColor: "rgba(220, 39, 67, 0.45)",
      baseColor: "#dc2743",
      coloredIcon: (
        <svg className={iconClassName} viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id="instaGradBtn" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f09433" />
              <stop offset="25%" stopColor="#e6683c" />
              <stop offset="50%" stopColor="#dc2743" />
              <stop offset="75%" stopColor="#cc2366" />
              <stop offset="100%" stopColor="#bc1888" />
            </linearGradient>
          </defs>
          <rect width="24" height="24" rx="5.5" fill="url(#instaGradBtn)" />
          <path
            fill="#FFF"
            d="M12 5.5c-1.782 0-2.004.007-2.705.039a3.7 3.7 0 0 0-1.226.235A2.215 2.215 0 0 0 6.83 7.073a3.7 3.7 0 0 0-.235 1.226C6.563 8.996 6.556 9.218 6.556 11s.007 2.004.039 2.705a3.7 3.7 0 0 0 .235 1.226 2.215 2.215 0 0 0 1.299 1.299c.358.14.786.22 1.226.235.701.032.923.039 2.705.039s2.004-.007 2.705-.039a3.7 3.7 0 0 0 1.226-.235 2.215 2.215 0 0 0 1.299-1.299c.14-.358.22-.786.235-1.226.032-.701.039-.923.039-2.705s-.007-2.004-.039-2.705a3.7 3.7 0 0 0-.235-1.226 2.215 2.215 0 0 0-1.299-1.299c-.358-.14-.786-.22-1.226-.235C14.004 5.507 13.782 5.5 12 5.5zm0 1.17c1.752 0 1.96.007 2.652.039.64.029.988.136 1.22.226a1.045 1.045 0 0 1 .618.618c.09.232.197.58.226 1.22.032.692.039.9.039 2.652s-.007 1.96-.039 2.652c-.029.64-.136.988-.226 1.22a1.045 1.045 0 0 1-.618.618c-.232.09-.58.197-1.22.226-.692.032-.9.039-2.652.039s-1.96-.007-2.652-.039c-.64-.029-.988-.136-1.22-.226a1.045 1.045 0 0 1-.618-.618c-.09-.232-.197-.58-.226-1.22-.032-.692-.039-.9-.039-2.652s.007-1.96.039-2.652c.029-.64.136-.988.226-1.22a1.045 1.045 0 0 1 .618-.618c.232-.09.58-.197 1.22-.226.692-.032.9-.039 2.652-.039zM12 8.16a2.84 2.84 0 1 0 2.84 2.84A2.84 2.84 0 0 0 12 8.16zm0 4.51a1.67 1.67 0 1 1 1.67-1.67A1.67 1.67 0 0 1 12 12.67zm3.125-4.22a.664.664 0 1 0 .664-.664.664.664 0 0 0-.664.664z"
          />
        </svg>
      ),
    };
  }
  // Facebook
  if (urlLower.includes("facebook.com") || labelLower.includes("facebook")) {
    return {
      platform: "facebook",
      bg: "#1877f2",
      borderColor: "#1062cc",
      glowColor: "rgba(24, 119, 242, 0.45)",
      baseColor: "#1877f2",
      coloredIcon: (
        <svg className={iconClassName} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#1877f2" />
          <path
            fill="#FFF"
            d="M14 12h-2.5v8h-3v-8h-2v-2.5h2v-1.8c0-2.2 1.4-3.4 3.3-3.4.9 0 1.7.1 1.9.1v2.2h-1.3c-1.1 0-1.3.5-1.3 1.3v1.6h2.5L14 12z"
          />
        </svg>
      ),
    };
  }
  // TikTok
  if (urlLower.includes("tiktok.com") || labelLower.includes("tiktok")) {
    return {
      platform: "tiktok",
      bg: "#000000",
      borderColor: "#111111",
      glowColor: "rgba(0, 0, 0, 0.5)",
      baseColor: "#010101",
      coloredIcon: (
        <svg className={iconClassName} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#000000" />
          <g transform="translate(4.2, 4.3) scale(0.65)">
            <path
              fill="#FFF"
              d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .8.11V9.4a6.27 6.27 0 0 0-3.11 0A6.33 6.33 0 0 0 2 15.68a6.32 6.32 0 0 0 10.4 4.84 6.26 6.26 0 0 0 1.95-4.52V8.82a8.27 8.27 0 0 0 5.24 1.86V7.28a4.89 4.89 0 0 1-3.11-.59z"
            />
          </g>
        </svg>
      ),
    };
  }
  // LinkedIn
  if (urlLower.includes("linkedin.com") || labelLower.includes("linkedin")) {
    return {
      platform: "linkedin",
      bg: "#0077b5",
      borderColor: "#005a8a",
      glowColor: "rgba(0, 119, 181, 0.45)",
      baseColor: "#0077b5",
      coloredIcon: (
        <svg className={iconClassName} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#0077b5" />
          <path
            fill="#FFF"
            d="M5.3 9h2.8v9H5.3zM6.7 5c1 0 1.8.8 1.8 1.8s-.8 1.8-1.8 1.8-1.8-.8-1.8-1.8.8-1.8 1.8-1.8zm5.2 4h2.7v1.2h.1c.4-.7 1.3-1.4 2.6-1.4 2.8 0 3.3 1.8 3.3 4.2v5h-2.8v-4.4c0-1.1 0-2.4-1.5-2.4s-1.7 1.2-1.7 2.3v4.5h-2.8V9z"
          />
        </svg>
      ),
    };
  }
  // YouTube
  if (
    urlLower.includes("youtube.com") ||
    urlLower.includes("youtu.be") ||
    labelLower.includes("youtube")
  ) {
    return {
      platform: "youtube",
      bg: "#ff0000",
      borderColor: "#cc0000",
      glowColor: "rgba(255, 0, 0, 0.45)",
      baseColor: "#ff0000",
      coloredIcon: (
        <svg className={iconClassName} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#ff0000" />
          <path fill="#FFF" d="M10 8.5v7l6-3.5-6-3.5z" transform="scale(0.8) translate(3, 3)" />
        </svg>
      ),
    };
  }
  // Spotify
  if (urlLower.includes("spotify.com") || labelLower.includes("spotify")) {
    return {
      platform: "spotify",
      bg: "#1DB954",
      borderColor: "#1aa34a",
      glowColor: "rgba(29, 185, 84, 0.45)",
      baseColor: "#1DB954",
      coloredIcon: (
        <svg className={iconClassName} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#1DB954" />
          <path
            fill="#FFF"
            d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.893-1.02-.336.073-.668-.14-.74-.477-.074-.337.14-.668.477-.74 3.856-.88 7.15-.502 9.81 1.13.295.178.387.563.206.86zm1.225-2.72c-.227.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.076-1.182-.413.125-.848-.107-.973-.52-.125-.413.107-.847.52-.973 3.666-1.114 8.234-.567 11.343 1.346.367.227.487.707.26 1.07zm.106-2.833C14.384 8.8 8.12 8.583 4.512 9.68c-.556.168-1.137-.146-1.305-.702-.168-.556.146-1.137.702-1.305 4.17-1.266 11.07-1.01 15.19 1.436.5.297.665.94.368 1.44-.297.5-.94.665-1.44.368z"
            transform="scale(0.7) translate(5, 5)"
          />
        </svg>
      ),
    };
  }
  // Pinterest
  if (urlLower.includes("pinterest.com") || labelLower.includes("pinterest")) {
    return {
      platform: "pinterest",
      bg: "#BD081C",
      borderColor: "#a60718",
      glowColor: "rgba(189, 8, 28, 0.45)",
      baseColor: "#BD081C",
      coloredIcon: (
        <svg className={iconClassName} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#BD081C" />
          <path
            fill="#FFF"
            d="M12.017 0C5.396 0 0 5.397 0 12.017c0 5.078 3.158 9.41 7.63 11.162-.105-.947-.199-2.399.041-3.43.218-.93 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.293 1.199-.334 1.363-.053.21-.174.254-.402.148-1.5-.699-2.436-2.899-2.436-4.664 0-3.796 2.76-7.281 7.954-7.281 4.175 0 7.42 2.975 7.42 6.952 0 4.148-2.616 7.486-6.25 7.486-1.22 0-2.368-.634-2.76-1.38l-.752 2.863c-.272 1.042-1.01 2.348-1.505 3.161 1.125.347 2.316.536 3.553.536 6.62 0 12.017-5.396 12.017-12.017C24.017 5.397 18.637 0 12.017 0z"
            transform="scale(0.65) translate(6, 6)"
          />
        </svg>
      ),
    };
  }
  // Twitter / X
  if (
    urlLower.includes("twitter.com") ||
    urlLower.includes("x.com") ||
    labelLower.includes("twitter") ||
    labelLower.includes(" x ")
  ) {
    return {
      platform: "twitter",
      bg: "#000000",
      borderColor: "#222222",
      glowColor: "rgba(0, 0, 0, 0.45)",
      baseColor: "#000000",
      coloredIcon: (
        <svg className={iconClassName} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#000000" />
          <path
            fill="#FFF"
            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
            transform="scale(0.7) translate(5, 5)"
          />
        </svg>
      ),
    };
  }

  // Fallback (Custom Link)
  const isStar =
    labelLower.includes("reseña") ||
    labelLower.includes("opinion") ||
    labelLower.includes("calific") ||
    labelLower.includes("opinión");
  return {
    platform: "custom",
    bg: "#1f2937",
    borderColor: "#374151",
    glowColor: "rgba(31, 41, 55, 0.45)",
    baseColor: "#1f2937",
    coloredIcon: isStar ? (
      <svg className={iconClassName} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#f59e0b" />
        <path
          fill="#FFF"
          d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
          transform="scale(0.7) translate(5, 5)"
        />
      </svg>
    ) : (
      <svg className={iconClassName} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#4b5563" />
        <path
          fill="#FFF"
          d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
          transform="scale(0.7) translate(5, 5)"
        />
      </svg>
    ),
  };
}
