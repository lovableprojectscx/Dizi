import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Globe,
  MapPin,
  Plus,
  Trash2,
  Instagram,
  Facebook,
  Linkedin,
  Phone,
  Link2,
  ExternalLink,
  Loader2,
  Smartphone,
  HelpCircle,
  FileText,
  Palette,
  Crown,
  Lock,
  Copy,
  Check,
  Youtube,
  Music,
  Twitter,
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { type QuickLink, getBioLinksLimit, canUsePremiumBioFeatures } from "@/lib/types";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { cn } from "@/lib/utils";
import { ImageUploadGuided } from "@/components/admin/ImageUploadGuided";

const bioLogoSpec = {
  ratio: "1/1",
  width: 400,
  height: 400,
  label: "Foto de Perfil del Bio-Link",
  hint: "La foto de perfil se recorta en círculo. Sube una foto cuadrada.",
  tolerance: 0.15,
};

const bioBannerSpec = {
  ratio: "16/9",
  width: 1200,
  height: 675,
  label: "Banner de Portada del Bio-Link",
  hint: "El banner aparece como cabecera en dispositivos móviles.",
  tolerance: 0.20,
};

const bioBgImageSpec = {
  ratio: "9/16",
  width: 1080,
  height: 1920,
  label: "Imagen de Fondo del Bio-Link",
  hint: "Se recomienda una imagen vertical de alta calidad (proporción 9:16).",
  tolerance: 0.25,
};

export const Route = createFileRoute("/admin/link-bio")({
  component: LinkBioPage,
});

/* ─── helpers ─── */
const extractUsername = (
  url: string,
  platform: "instagram" | "facebook" | "tiktok" | "linkedin"
) => {
  if (!url) return "";
  let clean = url.trim();
  if (!clean.includes("/") && !clean.includes("."))
    return clean.replace(/^@/, "");
  try {
    if (!clean.startsWith("http://") && !clean.startsWith("https://"))
      clean = "https://" + clean;
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
  platform: "instagram" | "facebook" | "tiktok" | "linkedin"
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

/* ─── helpers ─── */
const getPlatformColors = (platform: string) => {
  if (platform === "whatsapp") return { bg: "#25D366", border: "#128C7E" };
  if (platform === "instagram") return { bg: "#dc2743", border: "#bc1888" };
  if (platform === "facebook") return { bg: "#1877f2", border: "#1062cc" };
  if (platform === "tiktok") return { bg: "#000000", border: "#111111" };
  if (platform === "linkedin") return { bg: "#0077b5", border: "#005a8a" };
  if (platform === "location") return { bg: "#ea4335", border: "#d93025" };
  if (platform === "youtube") return { bg: "#ff0000", border: "#cc0000" };
  if (platform === "spotify") return { bg: "#1DB954", border: "#1aa34a" };
  if (platform === "pinterest") return { bg: "#BD081C", border: "#a60718" };
  if (platform === "twitter") return { bg: "#000000", border: "#222222" };
  return { bg: "#1f2937", border: "#374151" };
};

const getMockupIconAndBrand = (link: QuickLink) => {
  const labelLower = link.label.toLowerCase();
  const urlLower = (link.url || "").toLowerCase();
  
  let platform = "custom";
  let char = link.label.charAt(0);

  if (urlLower.includes("wa.me") || urlLower.includes("whatsapp.com") || labelLower.includes("whatsapp")) {
    platform = "whatsapp";
    char = "W";
  } else if (urlLower.includes("instagram.com") || labelLower.includes("instagram")) {
    platform = "instagram";
    char = "I";
  } else if (urlLower.includes("facebook.com") || labelLower.includes("facebook") || urlLower.includes("fb.com")) {
    platform = "facebook";
    char = "F";
  } else if (urlLower.includes("tiktok.com") || labelLower.includes("tiktok")) {
    platform = "tiktok";
    char = "T";
  } else if (urlLower.includes("linkedin.com") || labelLower.includes("linkedin")) {
    platform = "linkedin";
    char = "L";
  } else if (urlLower.includes("youtube.com") || urlLower.includes("youtu.be") || labelLower.includes("youtube")) {
    platform = "youtube";
    char = "Y";
  } else if (urlLower.includes("spotify.com") || labelLower.includes("spotify")) {
    platform = "spotify";
    char = "S";
  } else if (urlLower.includes("pinterest.com") || labelLower.includes("pinterest")) {
    platform = "pinterest";
    char = "P";
  } else if (urlLower.includes("twitter.com") || urlLower.includes("x.com") || labelLower.includes("twitter") || labelLower.includes(" x ")) {
    platform = "twitter";
    char = "X";
  }

  return { platform, char };
};

const getMockupBrandIcon = (platform: string, iconName?: string, isMonochrome?: boolean) => {
  const iconClass = "h-3.5 w-3.5";
  
  if (iconName) {
    if (iconName === "globe") return <Globe className={iconClass} />;
    if (iconName === "phone") return <Phone className={iconClass} />;
    if (iconName === "map-pin") return <MapPin className={iconClass} />;
    if (iconName === "instagram") return <Instagram className={iconClass} />;
    if (iconName === "facebook") return <Facebook className={iconClass} />;
    if (iconName === "linkedin") return <Linkedin className={iconClass} />;
    if (iconName === "youtube") return <Youtube className={iconClass} />;
    if (iconName === "music" || iconName === "spotify") return <Music className={iconClass} />;
    if (iconName === "twitter") return <Twitter className={iconClass} />;
  }

  if (isMonochrome) {
    if (platform === "whatsapp") return <Phone className={iconClass} />;
    if (platform === "location") return <MapPin className={iconClass} />;
    if (platform === "instagram") return <Instagram className={iconClass} />;
    if (platform === "facebook") return <Facebook className={iconClass} />;
    if (platform === "linkedin") return <Linkedin className={iconClass} />;
    if (platform === "youtube") return <Youtube className={iconClass} />;
    if (platform === "spotify") return <Music className={iconClass} />;
    if (platform === "twitter") return <Twitter className={iconClass} />;
    return null;
  }

  if (platform === "whatsapp") {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#25d366" />
        <path fill="#FFF" d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.767.46 3.427 1.267 4.887L2 22l5.227-1.373A9.972 9.972 0 0 0 12.004 22c5.524 0 10.004-4.48 10.004-10.004C22.008 6.48 17.528 2 12.004 2zm4.846 11.233c-.23.633-1.34 1.167-1.854 1.25-.47.083-1.077.15-3.083-.683-2.56-1.06-4.226-3.67-4.353-3.84-.127-.17-.99-1.32-.99-2.52 0-1.2.62-1.78.84-2.02.22-.24.47-.3.63-.3.16 0 .32 0 .46.01.15.01.35-.06.55.42.2.49.69 1.68.75 1.8.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.25.32-.36.43-.12.13-.25.27-.1.53.15.26.66 1.09 1.41 1.76.97.87 1.79 1.14 2.05 1.27.26.13.41.11.56-.06.15-.17.65-.76.82-1.02.17-.26.34-.22.57-.13.23.09 1.47.69 1.72.82.25.13.42.19.48.3.06.11.06.63-.17 1.26z" transform="scale(0.75) translate(4, 4)" />
      </svg>
    );
  }
  if (platform === "location") {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#ea4335" />
        <path fill="#FFF" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" transform="scale(0.7) translate(5, 4)" />
      </svg>
    );
  }
  if (platform === "instagram") {
    return <Instagram className="h-3 w-3 text-pink-600 animate-in fade-in" />;
  }
  if (platform === "facebook") {
    return <Facebook className="h-3 w-3 text-blue-600 animate-in fade-in" />;
  }
  if (platform === "linkedin") {
    return <Linkedin className="h-3 w-3 text-[#0077b5] animate-in fade-in" />;
  }
  if (platform === "youtube") {
    return <Youtube className="h-3 w-3 text-red-600 animate-in fade-in" />;
  }
  if (platform === "spotify") {
    return <Music className="h-3 w-3 text-emerald-600 animate-in fade-in" />;
  }
  if (platform === "twitter") {
    return <Twitter className="h-3 w-3 text-black dark:text-white animate-in fade-in" />;
  }

  return null;
};

/* ─── phone preview (mini mockup) ─── */
function PhonePreview({
  name,
  logo,
  bioDescription,
  brandColor,
  bannerImage,
  phone,
  locationAddress,
  locationLat,
  locationLng,
  customLinks,
  bioTheme = "default",
  bioButtonStyle = "pill-solid",
  bioButtonColor,
  bioButtonTextColor,
  bioBgImage,
  bioBgColor,
  bioTypography = "sans",
  showMap = true,
}: {
  name: string;
  logo: string;
  bioDescription: string;
  brandColor?: string;
  bannerImage?: string;
  phone: string;
  locationAddress: string;
  locationLat?: number;
  locationLng?: number;
  customLinks: QuickLink[];
  bioTheme?: string;
  bioButtonStyle?: string;
  bioButtonColor?: string;
  bioButtonTextColor?: string;
  bioBgImage?: string;
  bioBgColor?: string;
  bioTypography?: string;
  showMap?: boolean;
}) {
  const hasWhatsApp = !!phone;
  const hasLocation = !!(showMap !== false && locationAddress.trim() && locationLat && locationLng);

  const allLinks = [
    ...(hasWhatsApp ? [{ label: "WhatsApp", url: "", icon: "whatsapp", isHardcoded: true }] : []),
    ...(hasLocation ? [{ label: "Ubicación", url: "", icon: "location", isHardcoded: true }] : []),
    ...customLinks.map((l) => {
      const { platform, char } = getMockupIconAndBrand(l);
      return {
        label: l.label,
        url: l.url,
        icon: platform,
        char: char,
        bgColor: l.bgColor,
        textColor: l.textColor,
        thumbnailUrl: l.thumbnailUrl,
        iconName: l.iconName,
        isHardcoded: false
      };
    }),
  ];

  // Resolve mockup background theme
  let mockupBgStyle: React.CSSProperties = {};
  let isMockupDark = false;
  let previewTextColor = "text-foreground";
  let previewMutedColor = "text-muted-foreground";

  if (bioTheme === "default") {
    mockupBgStyle = { background: "hsl(var(--background))" };
    isMockupDark = false;
  } else if (bioTheme === "dark") {
    mockupBgStyle = { background: "#09090b" };
    isMockupDark = true;
  } else if (bioTheme === "sunset") {
    mockupBgStyle = { background: "linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #4c1d95 100%)" };
    isMockupDark = true;
  } else if (bioTheme === "forest") {
    mockupBgStyle = { background: "linear-gradient(135deg, #022c22 0%, #064e3b 50%, #022c22 100%)" };
    isMockupDark = true;
  } else if (bioTheme === "neon") {
    mockupBgStyle = { background: "radial-gradient(circle at center, #0c001c 0%, #020005 100%)" };
    isMockupDark = true;
  } else if (bioTheme === "glass") {
    mockupBgStyle = { background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 30%, #311042 70%, #0f172a 100%)" };
    isMockupDark = true;
  } else if (bioTheme === "pastel") {
    mockupBgStyle = { background: "linear-gradient(135deg, #fef08a 0%, #fbcfe8 50%, #c084fc 100%)" };
    isMockupDark = false;
  } else if (bioTheme === "ocean") {
    mockupBgStyle = { background: "linear-gradient(135deg, #083344 0%, #0f172a 50%, #0c4a6e 100%)" };
    isMockupDark = true;
  } else if (bioTheme === "custom") {
    if (bioBgImage) {
      mockupBgStyle = { 
        backgroundImage: `url(${bioBgImage})`, 
        backgroundSize: "cover", 
        backgroundPosition: "center", 
        backgroundRepeat: "no-repeat" 
      };
      isMockupDark = true;
    } else {
      const color = bioBgColor || "#0f172a";
      mockupBgStyle = { background: color };
      const hex = color.replace("#", "");
      const rgb = parseInt(hex, 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      isMockupDark = luma < 128;
    }
  }

  if (bioTheme !== "default") {
    previewTextColor = isMockupDark ? "text-slate-50" : "text-slate-900";
    previewMutedColor = isMockupDark ? "text-slate-300" : "text-slate-600";
  }

  const getMockupButtonStyle = (styleId: string) => {
    const parts = (styleId || "pill-solid").split("-");
    const shape = parts[0] || "pill";
    const type = parts[1] || "solid";

    let radiusClass = "rounded-full";
    if (shape === "rounded") radiusClass = "rounded-[2px]";
    if (shape === "sharp") radiusClass = "rounded-none";

    return { shape, type, radiusClass };
  };

  let { type, radiusClass } = getMockupButtonStyle(bioButtonStyle);

  return (
    <div className="w-full max-w-[270px] mx-auto select-none">
      <style>{`
        @keyframes premiumShimmer {
          0% { transform: translateX(-150%) skewX(-15deg); }
          35% { transform: translateX(150%) skewX(-15deg); }
          100% { transform: translateX(150%) skewX(-15deg); }
        }
        .animate-premium-shimmer {
          animation: premiumShimmer 4s infinite ease-in-out;
        }
      `}</style>
      <div className="bg-muted/15 border border-primary/5 rounded-2xl p-3 flex flex-col items-center">
        <p className="text-[10px] font-bold text-muted-foreground mb-3 uppercase tracking-wider">
          Vista previa en tiempo real
        </p>
        <div className="border-[5px] border-slate-950 rounded-[2rem] shadow-xl overflow-hidden aspect-[9/18.5] bg-card relative flex flex-col w-full max-w-[230px]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-3 w-20 bg-slate-950 rounded-b-lg z-50 flex items-center justify-center">
            <div className="h-0.5 w-5 bg-slate-800 rounded-full" />
          </div>
          <div 
            className={cn(
              "flex-1 overflow-y-auto scrollbar-none flex flex-col relative text-[9px] p-0 pb-6 transition-colors duration-300", 
              isMockupDark ? "dark" : "",
              bioTypography === "sans" && "typography-sans",
              bioTypography === "serif" && "typography-serif",
              bioTypography === "rounded" && "typography-rounded",
              bioTypography === "modern" && "typography-modern"
            )}
            style={mockupBgStyle}
          >
            {/* Banner */}
            <div className="relative w-full h-14 bg-muted/40 overflow-hidden shrink-0">
              {bannerImage ? (
                <img src={bannerImage} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full"
                  style={{ background: brandColor ? `${brandColor}22` : "hsl(var(--muted))" }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
            </div>
            {/* Profile */}
            <div className="flex flex-col items-center -mt-5 px-2 gap-1 relative z-10">
              <div className="h-10 w-10 rounded-full border-2 border-background bg-muted overflow-hidden shadow-md shrink-0">
                {logo ? (
                  <img src={logo} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary font-bold text-[11px]">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-0.5 justify-center">
                <p className={cn(
                  "text-center leading-tight truncate max-w-[140px]",
                  bioTypography === "serif" ? "font-serif-editorial text-[10px] font-normal" : 
                  bioTypography === "rounded" ? "font-sans-bloom text-[9px] font-bold" :
                  bioTypography === "modern" ? "font-sans-vibe text-[9px] font-bold" :
                  "font-black uppercase text-[8.5px] font-sans", 
                  previewTextColor
                )}>
                  {name || "Tu Tienda"}
                </p>
                {bioTypography === "serif" && (
                  <span className="text-gray-400 shrink-0 mt-0.5">
                    <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </span>
                )}
              </div>
              {bioDescription && (
                <p className={cn(
                  "text-center leading-tight line-clamp-2 max-w-[160px]", 
                  bioTypography === "serif" ? "font-serif-editorial text-[5.5px] uppercase tracking-[0.1em] font-medium" : 
                  bioTypography === "rounded" ? "font-sans-bloom text-[6.5px]" :
                  bioTypography === "modern" ? "font-sans-vibe text-[6.5px]" :
                  "text-[6.5px] font-sans",
                  previewMutedColor
                )}>
                  {bioDescription}
                </p>
              )}
            </div>
            {/* Links */}
            <div className="px-2 pt-2 space-y-1">
              {allLinks.slice(0, 7).map((link, idx) => {
                const defaultColors = getPlatformColors(link.icon || "custom");
                const baseBg = link.bgColor || bioButtonColor || defaultColors.bg;
                const baseText = link.textColor || bioButtonTextColor || "#ffffff";

                let bg = baseBg;
                let borderCol = (link.bgColor || bioButtonColor) ? baseBg : defaultColors.border;
                let textCol = baseText;
                let extraClasses = "";

                if (type === "solid") {
                  bg = baseBg;
                  borderCol = (link.bgColor || bioButtonColor) ? baseBg : defaultColors.border;
                  textCol = baseText;
                } else if (type === "outline") {
                  bg = "transparent";
                  borderCol = baseBg;
                  textCol = link.textColor || bioButtonTextColor || baseBg;
                } else if (type === "glass") {
                  bg = isMockupDark ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.06)";
                  borderCol = isMockupDark ? "rgba(255, 255, 255, 0.15)" : "rgba(15, 23, 42, 0.12)";
                  textCol = link.textColor || bioButtonTextColor || (isMockupDark ? "#ffffff" : "#0f172a");
                  extraClasses = "backdrop-blur-sm";
                }

                const isCustom = !!(link.bgColor || link.textColor || bioButtonColor || bioButtonTextColor);
                const isMonochrome = type === "outline" || type === "glass" || isCustom;

                return (
                  <div
                    key={idx}
                    className={cn(
                      "relative w-full p-0.5 pr-3 font-extrabold uppercase text-[6px] tracking-wider flex items-center border overflow-hidden transition-all duration-300 hover:shadow-[0_0_10px_var(--hover-glow)] group",
                      radiusClass,
                      extraClasses,
                      bioTypography === "serif" ? "font-serif-editorial" :
                      bioTypography === "rounded" ? "font-sans-bloom" :
                      bioTypography === "modern" ? "font-sans-vibe" :
                      "font-sans"
                    )}
                    style={{
                      background: bg,
                      borderColor: borderCol,
                      color: textCol,
                      "--hover-glow": baseBg.startsWith("linear") ? "#dc2743" : baseBg
                    } as React.CSSProperties}
                  >
                    <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-premium-shimmer pointer-events-none" />
                    
                    <div className={cn(
                       "h-5 w-5 flex items-center justify-center shrink-0 mr-1.5 transition-transform duration-300 group-hover:scale-110 overflow-hidden",
                       (isMonochrome && !link.thumbnailUrl) ? "bg-transparent text-current" : "bg-white rounded-full shadow-inner border border-zinc-100"
                    )}>
                      {link.thumbnailUrl ? (
                        <img src={link.thumbnailUrl} className="h-full w-full object-cover" />
                      ) : (
                        getMockupBrandIcon(link.icon || "custom", link.iconName, isMonochrome) || (
                          <span className={cn("text-[5px] font-black", !isMonochrome ? "text-gray-800" : "")}>{link.char}</span>
                        )
                      )}
                    </div>
                    <span className="truncate flex-1 text-center pr-1.5">{link.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── main page ─── */
function LinkBioPage() {
  const id = useApp((s) => s.currentStoreId);
  const store = useApp((s) => s.stores.find((st) => st.id === id));
  const update = useApp((s) => s.updateStore);

  const [bioDescription, setBioDescription] = useState(store?.bioDescription || "");
  const [bioLinksEnabled, setBioLinksEnabled] = useState(store?.bioLinksEnabled ?? false);
  const [bioLogo, setBioLogo] = useState(store?.bioLogo || "");
  const [bioBanner, setBioBanner] = useState(store?.bioBanner || "");
  const [bioTheme, setBioTheme] = useState(store?.bioTheme || "default");
  const [bioTypography, setBioTypography] = useState(store?.bioTypography || "sans");
  const [bioButtonStyle, setBioButtonStyle] = useState(store?.bioButtonStyle || "pill-solid");
  const [bioButtonColor, setBioButtonColor] = useState(store?.bioButtonColor || "");
  const [bioButtonTextColor, setBioButtonTextColor] = useState(store?.bioButtonTextColor || "");
  const [bioBgImage, setBioBgImage] = useState(store?.bioBgImage || "");
  const [bioBgColor, setBioBgColor] = useState(store?.bioBgColor || "#0f172a");
  
  const [activeEditTab, setActiveEditTab] = useState("contenido");
  const [activeBgTab, setActiveBgTab] = useState<"color" | "image">("color");
  const [country] = useState(store?.countryCode || "51");
  const [number] = useState(
    store?.phone?.startsWith(store?.countryCode || "")
      ? store?.phone.slice((store?.countryCode || "").length)
      : store?.phone || ""
  );

  const [customLinks, setCustomLinks] = useState<QuickLink[]>([]);
  const [locationAddress, setLocationAddress] = useState(store?.locationAddress || "");
  const [locationLat, setLocationLat] = useState<number | undefined>(store?.locationLat);
  const [locationLng, setLocationLng] = useState<number | undefined>(store?.locationLng);
  const [showMap, setShowMap] = useState<boolean>(store?.showMap ?? true);
  
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkBgColor, setNewLinkBgColor] = useState("");
  const [newLinkTextColor, setNewLinkTextColor] = useState("");
  const [newLinkThumbnail, setNewLinkThumbnail] = useState("");
  const [newLinkIcon, setNewLinkIcon] = useState("");

  const [saving, setSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [copiedBio, setCopiedBio] = useState(false);

  const [suggestions, setSuggestions] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const lastSelectedAddress = useRef<string>("");

  const [mapElement, setMapElement] = useState<HTMLDivElement | null>(null);
  const mapRef = useCallback((node: HTMLDivElement | null) => {
    setMapElement(node);
  }, []);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  /* Autocomplete directions with OpenStreetMap Nominatim */
  useEffect(() => {
    if (!locationAddress.trim() || locationAddress.length < 4 || locationAddress === lastSelectedAddress.current) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationAddress)}&limit=5&addressdetails=1&accept-language=es&email=soporte@dizi.la`
        );
        const data = await res.json();
        setSuggestions(data);
      } catch (error) {
        console.error("Error fetching address suggestions:", error);
        toast.error("Error al buscar sugerencias de dirección");
      } finally {
        setLoadingSuggestions(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [locationAddress]);

  const handleSelectSuggestion = (sug: { display_name: string; lat: string; lon: string }) => {
    const lat = parseFloat(sug.lat);
    const lng = parseFloat(sug.lon);
    
    lastSelectedAddress.current = sug.display_name;
    setLocationAddress(sug.display_name);
    setLocationLat(lat);
    setLocationLng(lng);
    setSuggestions([]);
    
    if (mapInstance.current && markerInstance.current) {
      mapInstance.current.setView([lat, lng], 16);
      markerInstance.current.setLatLng([lat, lng]);
    }
  };

  /* Load store data once */
  useEffect(() => {
    if (store && !isLoaded) {
      setBioDescription(store.bioDescription || "");
      setBioLinksEnabled(store.bioLinksEnabled ?? false);
      setLocationAddress(store.locationAddress || "");
      lastSelectedAddress.current = store.locationAddress || "";
      setLocationLat(store.locationLat);
      setLocationLng(store.locationLng);
      setShowMap(store.showMap ?? true);
      setBioLogo(store.bioLogo || "");
      setBioBanner(store.bioBanner || "");
      setBioTheme(store.bioTheme || "default");
      setBioTypography(store.bioTypography || "sans");
      setBioButtonStyle(store.bioButtonStyle || "pill-solid");
      setBioButtonColor(store.bioButtonColor || "");
      setBioButtonTextColor(store.bioButtonTextColor || "");
      setBioBgImage(store.bioBgImage || "");
      setBioBgColor(store.bioBgColor || "#0f172a");
      setActiveBgTab(store.bioBgImage ? "image" : "color");

      setCustomLinks(store.quickLinks || []);
      setIsLoaded(true);
    }
  }, [store, isLoaded]);

  /* Leaflet map */
  useEffect(() => {
    if (!bioLinksEnabled || activeEditTab !== "ubicacion" || !mapElement) {
      if (mapInstance.current) {
        try {
          mapInstance.current.remove();
        } catch (e) {
          console.error("Error removing map instance:", e);
        }
        mapInstance.current = null;
        markerInstance.current = null;
      }
      return;
    }
    const timer = setTimeout(() => {
      try {
        if (!mapElement) return;
        
        // Clear previous stale Leaflet DOM indicators if ref got out of sync
        if (mapElement.classList.contains("leaflet-container")) {
          mapElement.innerHTML = "";
          mapElement.className = "h-[230px] w-full rounded-xl border border-border/40 shadow-inner relative z-10 bg-muted/30 overflow-hidden";
        }

        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });
        
        const defaultLat = locationLat || -12.046374;
        const defaultLng = locationLng || -77.042793;
        
        if (!mapInstance.current && mapElement) {
          const map = L.map(mapElement).setView([defaultLat, defaultLng], 14);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://openstreetmap.org">OSM</a>',
          }).addTo(map);
          const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
          
          marker.on("dragend", () => {
            const latLng = marker.getLatLng();
            setLocationLat(Number(latLng.lat.toFixed(6)));
            setLocationLng(Number(latLng.lng.toFixed(6)));
          });
          
          map.on("click", (e) => {
            marker.setLatLng(e.latlng);
            setLocationLat(Number(e.latlng.lat.toFixed(6)));
            setLocationLng(Number(e.latlng.lng.toFixed(6)));
          });
          
          mapInstance.current = map;
          markerInstance.current = marker;
          
          // Force Leaflet to recalculate container size now that it's visible
          map.invalidateSize();
          setTimeout(() => {
            if (mapInstance.current) {
              mapInstance.current.invalidateSize();
            }
          }, 200);
        }
      } catch (error: any) {
        console.error("Error loading Leaflet map:", error);
        toast.error("Error al cargar el mapa interactivo: " + error.message);
      }
    }, 150);
    return () => {
      clearTimeout(timer);
      if (mapInstance.current) {
        try {
          mapInstance.current.remove();
        } catch (e) {
          console.error("Error removing map instance in cleanup:", e);
        }
        mapInstance.current = null;
        markerInstance.current = null;
      }
    };
  }, [bioLinksEnabled, isLoaded, activeEditTab, mapElement]);

  /* Invalidate Leaflet map size when location section opens */
  useEffect(() => {
    if (activeEditTab === "ubicacion" && mapInstance.current) {
      const timer = setTimeout(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize();
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [activeEditTab]);

  if (!store) return null;

  const bioUrl = `${window.location.origin}/bio/${store.slug}`;

  const compressToThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 120; // 120px is perfect for a small thumbnail icon
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL("image/webp", 0.8));
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedBio(true);
    setTimeout(() => setCopiedBio(false), 2000);
    toast.success("Enlace copiado");
  };

  const save = async () => {
    setSaving(true);
    try {
      await update(store.id, {
        bioDescription: bioDescription.trim(),
        bioLinksEnabled,
        quickLinks: customLinks,
        locationAddress: locationAddress.trim(),
        locationLat,
        locationLng,
        showMap,
        bioLogo: bioLogo || null,
        bioBanner: bioBanner || null,
        bioTheme,
        bioTypography,
        bioButtonStyle,
        bioButtonColor: bioButtonColor || null,
        bioButtonTextColor: bioButtonTextColor || null,
        bioBgImage: bioBgImage || null,
        bioBgColor: bioBgColor || null,
      });

      const updatedStore = useApp.getState().stores.find((st) => st.id === store.id);
      if (updatedStore) {
        setBioLogo(updatedStore.bioLogo ?? "");
        setBioBanner(updatedStore.bioBanner ?? "");
        setBioBgImage(updatedStore.bioBgImage ?? "");
      }

      toast.success("Bio-Link guardado correctamente");
    } catch {
      toast.error("Error al guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-2 pb-10">
      
      {/* Page Header */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent flex items-center gap-2">
          <Link2 className="h-7 w-7 text-primary shrink-0" />
          Link en Bio
        </h1>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-help mt-1">
              <HelpCircle className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            Configura una página web optimizada para dispositivos móviles (ideal para tu biografía de Instagram o TikTok) con tus redes sociales, descripción del negocio y ubicación física en un mapa interactivo.
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Bio-Link URL Card (Shareable widget style) */}
      <Card className="border border-border/50 rounded-xl bg-card shadow-sm overflow-hidden bg-gradient-to-br from-card via-card to-primary/[0.01]">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Enlace de tu Bio-Link</span>
                {bioLinksEnabled ? (
                  <span className="text-[9px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-200/50 font-bold uppercase tracking-wider">
                    Activo
                  </span>
                ) : (
                  <span className="text-[9px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border/50 font-bold uppercase tracking-wider">
                    Inactivo
                  </span>
                )}
              </div>
            </div>
            
            <div className={cn(
              "flex items-center justify-between gap-3 bg-muted/20 hover:bg-muted/30 transition-colors rounded-xl px-3 py-2.5 border border-border/40 max-w-xl",
              !bioLinksEnabled && "opacity-50 select-none pointer-events-none"
            )}>
              <span className="truncate select-all font-mono text-xs font-semibold text-foreground/80 flex-1">{bioUrl}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  type="button"
                  disabled={!bioLinksEnabled}
                  onClick={() => copyText(bioUrl)}
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md text-muted-foreground hover:text-primary transition-colors shrink-0"
                >
                  {copiedBio ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
                <a
                  href={bioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`h-7 w-7 rounded-md hover:bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shrink-0 ${!bioLinksEnabled ? "pointer-events-none" : ""}`}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Interactive Tabbed Form */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-border/50 shadow-sm overflow-visible rounded-xl">
            <CardContent className="p-5 sm:p-6 space-y-6">
              
              {/* Toggle Habilitación */}
              <div className="flex items-center justify-between pb-4 border-b border-border/40">
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-semibold text-foreground">Habilitar Bio-Link Profesional</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-help">
                        <HelpCircle className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Activa tu página de biografía extendida con enlaces directos y ubicación.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={bioLinksEnabled}
                  onClick={() => setBioLinksEnabled(!bioLinksEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${bioLinksEnabled ? "bg-primary" : "bg-input"}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${bioLinksEnabled ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              {bioLinksEnabled ? (
                <div className="space-y-4">
                  
                  {/* TABS DE EDICIÓN COMPACTOS */}
                  <Tabs value={activeEditTab} onValueChange={setActiveEditTab} className="w-full">
                    <TabsList className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full grid grid-cols-3 mb-5">
                      <TabsTrigger value="contenido" className="flex items-center justify-center gap-1.5 text-xs font-bold">
                        <FileText className="h-3.5 w-3.5" />
                        <span>Contenido</span>
                      </TabsTrigger>
                      <TabsTrigger value="apariencia" className="flex items-center justify-center gap-1.5 text-xs font-bold">
                        <Palette className="h-3.5 w-3.5" />
                        <span>Apariencia</span>
                      </TabsTrigger>
                      <TabsTrigger value="ubicacion" className="flex items-center justify-center gap-1.5 text-xs font-bold">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>Ubicación</span>
                      </TabsTrigger>
                    </TabsList>

                    {/* ──────────────── TAB 1: CONTENIDO ──────────────── */}
                    <TabsContent value="contenido" className="space-y-5 mt-2 animate-in fade-in duration-300">
                      
                      {/* Biografía */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block opacity-70">Biografía / Presentación Corta</Label>
                        <textarea
                          value={bioDescription}
                          onChange={(e) => setBioDescription(e.target.value)}
                          placeholder="Ej: Bienvenidos a Bocafest. Horarios de atención: Lunes a Sábados de 9 AM a 8 PM. Delivery disponible..."
                          className="w-full min-h-[95px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        />
                      </div>

                      {/* Enlaces Unificados (Estilo Linktree) */}
                      <div className="space-y-4 pt-4 border-t border-border/30">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block opacity-70">
                            Enlaces de tu Bio-Link
                          </Label>
                          {store && store.plan === "semilla" && (
                            <span className="text-[10px] text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200/50 font-bold uppercase tracking-wider">
                              {customLinks.length}/5 Enlaces
                            </span>
                          )}
                        </div>

                        {/* WhatsApp Auto-Vínculo (Solo informativo) */}
                        <div className="bg-emerald-500/[0.02] border border-emerald-500/10 p-2.5 rounded-lg flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <p className="text-muted-foreground text-[11px]">
                              WhatsApp vinculado automáticamente: <span className="font-bold text-foreground">+{country + number}</span>
                            </p>
                          </div>
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                            Activo
                          </span>
                        </div>

                        {/* Agregar Nuevo Enlace Form */}
                        <div className="bg-muted/[0.03] p-4 rounded-xl border border-border/40 space-y-3">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Agregar Nuevo Enlace
                          </p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground font-medium">Texto del Botón</Label>
                              <Input
                                value={newLinkLabel}
                                onChange={(e) => setNewLinkLabel(e.target.value)}
                                placeholder="Ej: Síguenos en Instagram"
                                className="h-9 bg-transparent rounded-lg text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground font-medium">Enlace (URL)</Label>
                              <Input
                                value={newLinkUrl}
                                onChange={(e) => setNewLinkUrl(e.target.value)}
                                placeholder="Ej: instagram.com/mitienda"
                                className="h-9 bg-transparent rounded-lg text-sm"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-border/20 pt-3">
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground font-semibold">Icono (Opcional):</span>
                                <select
                                  value={newLinkIcon}
                                  onChange={(e) => setNewLinkIcon(e.target.value)}
                                  className="text-xs bg-card border rounded-md px-2 py-1 outline-none h-8 text-foreground"
                                >
                                  <option value="">Auto-detectar o ninguno</option>
                                  <option value="globe">Globo / Sitio Web</option>
                                  <option value="phone">Teléfono</option>
                                  <option value="map-pin">Ubicación</option>
                                  <option value="instagram">Instagram</option>
                                  <option value="facebook">Facebook</option>
                                  <option value="linkedin">LinkedIn</option>
                                  <option value="youtube">YouTube</option>
                                  <option value="music">Música / Spotify</option>
                                  <option value="twitter">Twitter / X</option>
                                </select>
                              </div>
                            </div>

                            <Button
                              onClick={async () => {
                                if (store && store.plan === "semilla" && customLinks.length >= getBioLinksLimit(store)) {
                                  toast.error(`El Plan Semilla está limitado a un máximo de ${getBioLinksLimit(store)} enlaces. Sube de plan para agregar más.`);
                                  return;
                                }
                                if (!newLinkLabel.trim() || !newLinkUrl.trim()) {
                                  toast.error("Ingresa el título y el enlace");
                                  return;
                                }
                                
                                let formattedUrl = newLinkUrl.trim();
                                if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
                                  const urlLower = formattedUrl.toLowerCase();
                                  if (urlLower.includes("instagram.com") || newLinkLabel.toLowerCase().includes("instagram")) {
                                    formattedUrl = formatSocialUrl(formattedUrl, "instagram");
                                  } else if (urlLower.includes("facebook.com") || newLinkLabel.toLowerCase().includes("facebook")) {
                                    formattedUrl = formatSocialUrl(formattedUrl, "facebook");
                                  } else if (urlLower.includes("tiktok.com") || newLinkLabel.toLowerCase().includes("tiktok")) {
                                    formattedUrl = formatSocialUrl(formattedUrl, "tiktok");
                                  } else if (urlLower.includes("linkedin.com") || newLinkLabel.toLowerCase().includes("linkedin")) {
                                    formattedUrl = formatSocialUrl(formattedUrl, "linkedin");
                                  } else {
                                    formattedUrl = "https://" + formattedUrl;
                                  }
                                }

                                setCustomLinks([
                                  ...customLinks,
                                  {
                                    label: newLinkLabel.trim(),
                                    url: formattedUrl,
                                    bgColor: newLinkBgColor || undefined,
                                    textColor: newLinkTextColor || undefined,
                                    thumbnailUrl: newLinkThumbnail || undefined,
                                    iconName: newLinkIcon || undefined,
                                  },
                                ]);
                                setNewLinkLabel("");
                                setNewLinkUrl("");
                                setNewLinkBgColor("");
                                setNewLinkTextColor("");
                                setNewLinkThumbnail("");
                                setNewLinkIcon("");
                                toast.success("Enlace agregado");
                              }}
                              type="button"
                              className="h-9 font-bold px-5 w-full sm:w-auto cursor-pointer rounded-lg text-xs"
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" /> Añadir enlace
                            </Button>
                          </div>
                        </div>

                        {/* Listado de Enlaces Activos con Reordenamiento y Edición Inline */}
                        <div className="space-y-3 pt-2">
                          {customLinks.length === 0 ? (
                            <div className="text-center py-6 border border-dashed rounded-xl bg-muted/5">
                              <p className="text-xs text-muted-foreground italic">No has agregado enlaces aún. Comienza agregando uno arriba.</p>
                            </div>
                          ) : (
                            customLinks.map((link, idx) => {
                              const { platform } = getMockupIconAndBrand(link);
                              
                              return (
                                <div key={idx} className="bg-card border border-border/60 rounded-xl p-3.5 shadow-sm space-y-3 relative group/card">
                                  {/* Encabezado del item con acciones */}
                                  <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 uppercase">
                                        {platform === "custom" ? link.label.charAt(0) : platform.charAt(0)}
                                      </div>
                                      <span className="text-xs font-bold text-foreground truncate">{link.label || "Enlace sin título"}</span>
                                      <span className="text-[9px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border/30 capitalize shrink-0">
                                        {platform}
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 shrink-0">
                                      {/* Subir/Bajar botones */}
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        disabled={idx === 0}
                                        onClick={() => {
                                          const updated = [...customLinks];
                                          const temp = updated[idx];
                                          updated[idx] = updated[idx - 1];
                                          updated[idx - 1] = temp;
                                          setCustomLinks(updated);
                                        }}
                                        className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded-md"
                                      >
                                        ▲
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        disabled={idx === customLinks.length - 1}
                                        onClick={() => {
                                          const updated = [...customLinks];
                                          const temp = updated[idx];
                                          updated[idx] = updated[idx + 1];
                                          updated[idx + 1] = temp;
                                          setCustomLinks(updated);
                                        }}
                                        className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded-md"
                                      >
                                        ▼
                                      </Button>
                                      
                                      <Button
                                        onClick={() => {
                                          setCustomLinks(customLinks.filter((_, i) => i !== idx));
                                          toast.success("Enlace eliminado");
                                        }}
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-md"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Inputs de Edición Inline */}
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1">
                                      <Label className="text-[10px] text-muted-foreground font-semibold">Título del Enlace</Label>
                                      <Input
                                        value={link.label}
                                        onChange={(e) => {
                                          const updated = [...customLinks];
                                          updated[idx] = { ...link, label: e.target.value };
                                          setCustomLinks(updated);
                                        }}
                                        className="h-8 bg-transparent text-xs rounded-md"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-[10px] text-muted-foreground font-semibold">Enlace (URL)</Label>
                                      <Input
                                        value={link.url}
                                        onChange={(e) => {
                                          const updated = [...customLinks];
                                          updated[idx] = { ...link, url: e.target.value };
                                          setCustomLinks(updated);
                                        }}
                                        className="h-8 bg-transparent text-xs rounded-md"
                                      />
                                    </div>
                                  </div>

                                  {/* Miniatura y Override de Icono */}
                                  <div className="grid gap-3 sm:grid-cols-2 pt-1">
                                    <div className="space-y-1">
                                      <Label className="text-[10px] text-muted-foreground font-semibold block">Icono de Lucide</Label>
                                      <select
                                        value={link.iconName || ""}
                                        onChange={(e) => {
                                          const updated = [...customLinks];
                                          updated[idx] = { ...link, iconName: e.target.value || undefined };
                                          setCustomLinks(updated);
                                        }}
                                        className="w-full text-xs bg-card border rounded-md px-2 h-8 text-foreground outline-none"
                                      >
                                        <option value="">Auto-detectar o ninguno</option>
                                        <option value="globe">Globo / Sitio Web</option>
                                        <option value="phone">Teléfono</option>
                                        <option value="map-pin">Ubicación</option>
                                        <option value="instagram">Instagram</option>
                                        <option value="facebook">Facebook</option>
                                        <option value="linkedin">LinkedIn</option>
                                        <option value="youtube">YouTube</option>
                                        <option value="music">Música / Spotify</option>
                                        <option value="twitter">Twitter / X</option>
                                      </select>
                                    </div>

                                    {/* Uploader de Miniatura Personalizada */}
                                    <div className="space-y-1">
                                      <Label className="text-[10px] text-muted-foreground font-semibold block">Imagen de Miniatura (Uploader)</Label>
                                      <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full border bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                                          {link.thumbnailUrl ? (
                                            <img src={link.thumbnailUrl} className="h-full w-full object-cover" />
                                          ) : (
                                            <span className="text-[8px] text-muted-foreground uppercase font-bold">Icon</span>
                                          )}
                                        </div>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          id={`thumb-upload-${idx}`}
                                          className="hidden"
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              try {
                                                const base64 = await compressToThumbnail(file);
                                                const updated = [...customLinks];
                                                updated[idx] = { ...link, thumbnailUrl: base64 };
                                                setCustomLinks(updated);
                                                toast.success("Miniatura cargada");
                                              } catch (err) {
                                                toast.error("Error al procesar la imagen");
                                              }
                                            }
                                          }}
                                        />
                                        <label
                                          htmlFor={`thumb-upload-${idx}`}
                                          className="text-[10px] font-bold border rounded-md px-2.5 h-8 flex items-center justify-center bg-card hover:bg-muted/30 cursor-pointer transition-colors"
                                        >
                                          Subir Foto
                                        </label>
                                        {link.thumbnailUrl && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updated = [...customLinks];
                                              const item = { ...updated[idx] };
                                              delete item.thumbnailUrl;
                                              updated[idx] = item;
                                              setCustomLinks(updated);
                                            }}
                                            className="text-[10px] text-destructive hover:underline font-bold"
                                          >
                                            Eliminar
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Colores Personalizados (Premium) */}
                                  {store && canUsePremiumBioFeatures(store) && (
                                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/30">
                                      <div className="space-y-1">
                                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Fondo de este Botón</span>
                                        <div className="flex items-center gap-1.5 border rounded-lg p-1 bg-muted/10 h-7">
                                          <input
                                            type="color"
                                            value={link.bgColor || "#000000"}
                                            onChange={(e) => {
                                              const updated = [...customLinks];
                                              updated[idx] = { ...link, bgColor: e.target.value };
                                              setCustomLinks(updated);
                                            }}
                                            className="h-5 w-5 rounded cursor-pointer border shrink-0"
                                          />
                                          <span className="text-[9px] font-mono truncate">{link.bgColor || "Defecto"}</span>
                                          {link.bgColor && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const updated = [...customLinks];
                                                const item = { ...updated[idx] };
                                                delete item.bgColor;
                                                updated[idx] = item;
                                                setCustomLinks(updated);
                                              }}
                                              className="text-[9px] text-destructive ml-auto hover:underline font-bold pr-1 font-sans"
                                            >
                                              Reset
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      <div className="space-y-1">
                                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Texto de este Botón</span>
                                        <div className="flex items-center gap-1.5 border rounded-lg p-1 bg-muted/10 h-7">
                                          <input
                                            type="color"
                                            value={link.textColor || "#ffffff"}
                                            onChange={(e) => {
                                              const updated = [...customLinks];
                                              updated[idx] = { ...link, textColor: e.target.value };
                                              setCustomLinks(updated);
                                            }}
                                            className="h-5 w-5 rounded cursor-pointer border shrink-0"
                                          />
                                          <span className="text-[9px] font-mono truncate">{link.textColor || "Defecto"}</span>
                                          {link.textColor && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const updated = [...customLinks];
                                                const item = { ...updated[idx] };
                                                delete item.textColor;
                                                updated[idx] = item;
                                                setCustomLinks(updated);
                                              }}
                                              className="text-[9px] text-destructive ml-auto hover:underline font-bold pr-1 font-sans"
                                            >
                                              Reset
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    {/* ──────────────── TAB 2: APARIENCIA ──────────────── */}
                    <TabsContent value="apariencia" className="space-y-5 mt-2 animate-in fade-in duration-300">
                      
                      {/* Tipografía del Bio-Link */}
                      <div className="space-y-3">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block opacity-70">Tipografía del Bio-Link</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {[
                            {
                              id: "sans",
                              name: "Sans (Inter)",
                              desc: "Limpia y moderna",
                              isPremium: false,
                            },
                            {
                              id: "serif",
                              name: "Serif (Playfair)",
                              desc: "Elegante y clásica",
                              isPremium: true,
                            },
                            {
                              id: "rounded",
                              name: "Rounded (Quicksand)",
                              desc: "Cálida y amigable",
                              isPremium: true,
                            },
                            {
                              id: "modern",
                              name: "Modern (Outfit)",
                              desc: "Geométrica y tecnológica",
                              isPremium: true,
                            },
                          ].map((t) => {
                            const isSelected = bioTypography === t.id;
                            const isLocked = t.isPremium && store && !canUsePremiumBioFeatures(store);
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                  if (isLocked) {
                                    toast.error(`La tipografía ${t.name} es exclusiva para el Plan Emprendedor o superior.`);
                                    return;
                                  }
                                  setBioTypography(t.id as any);
                                }}
                                className={cn(
                                  "flex flex-col text-left p-3 rounded-xl border transition-all hover:scale-[1.01] gap-1 relative",
                                  isSelected 
                                    ? "border-primary ring-2 ring-primary/20 bg-primary/5 shadow-sm" 
                                    : "border-border bg-card/40"
                                )}
                              >
                                <div className="flex items-center justify-between w-full gap-1">
                                  <span className="text-[11px] font-extrabold text-foreground">{t.name}</span>
                                  {isLocked && (
                                    <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                                  )}
                                </div>
                                <span className="text-[9px] text-muted-foreground leading-normal font-normal">{t.desc}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Perfil y Portada */}
                      <div className="space-y-3 border-t border-border/40 pt-4">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block opacity-70">Fotos del Bio-Link</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5 flex flex-col">
                            <Label className="text-xs text-muted-foreground font-bold">Foto de Perfil Especial</Label>
                            <ImageUploadGuided
                              value={bioLogo}
                              onChange={setBioLogo}
                              spec={bioLogoSpec}
                              label="Subir foto de perfil"
                            />
                            {store.logo && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setBioLogo(store.logo || "");
                                  toast.success("Foto de perfil sincronizada con el logo de tu tienda");
                                }}
                                className="mt-1.5 h-8 text-[10px] font-bold self-start cursor-pointer"
                              >
                                <Copy className="h-3.5 w-3.5 mr-1" /> Usar logo de mi tienda
                              </Button>
                            )}
                          </div>
                          <div className="space-y-1.5 flex flex-col">
                            <Label className="text-xs text-muted-foreground font-bold">Foto de Portada Especial</Label>
                            <ImageUploadGuided
                              value={bioBanner}
                              onChange={setBioBanner}
                              spec={bioBannerSpec}
                              label="Subir foto de portada"
                            />
                            {store.bannerImage && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setBioBanner(store.bannerImage || "");
                                  toast.success("Foto de portada sincronizada con el banner de tu tienda");
                                }}
                                className="mt-1.5 h-8 text-[10px] font-bold self-start cursor-pointer"
                              >
                                <Copy className="h-3.5 w-3.5 mr-1" /> Usar portada de mi tienda
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tema de fondo */}
                      <div className="space-y-3 border-t border-border/40 pt-4">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block opacity-70">Tema de Fondo</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {[
                            { id: "default", name: "Plantilla", bg: "bg-slate-200 dark:bg-slate-800" },
                            { id: "dark", name: "Oscuro", bg: "bg-zinc-950" },
                            { id: "sunset", name: "Atardecer", bg: "bg-gradient-to-r from-indigo-950 via-purple-950 to-pink-900" },
                            { id: "forest", name: "Bosque", bg: "bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-950" },
                            { id: "neon", name: "Neón", bg: "bg-black border border-pink-500/25" },
                            { id: "glass", name: "Efecto Vidrio", bg: "bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-white/5" },
                            { id: "pastel", name: "Pastel", bg: "bg-gradient-to-r from-yellow-50 via-pink-100 to-purple-100 text-slate-800" },
                            { id: "ocean", name: "Océano", bg: "bg-gradient-to-r from-cyan-950 via-blue-950 to-slate-900" },
                            { id: "custom", name: "Personalizado", bg: "bg-gradient-to-r from-primary/20 via-card to-secondary/20 border border-primary/25" },
                          ].map((t) => {
                            const isSelected = bioTheme === t.id;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setBioTheme(t.id)}
                                className={cn(
                                  "flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all hover:scale-[1.02] gap-1",
                                  isSelected 
                                    ? "border-primary ring-2 ring-primary/20 bg-primary/5 shadow-sm" 
                                    : "border-border bg-card/40"
                                )}
                              >
                                <div className={cn("h-4 w-full rounded-md shadow-inner", t.bg)} />
                                <span className="text-[10px] font-bold text-foreground truncate w-full mt-1">{t.name}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Controles de fondo personalizado si bioTheme === 'custom' */}
                        {bioTheme === "custom" && (
                          <div className="mt-3 bg-muted/[0.04] border border-border/40 p-4 rounded-xl space-y-4 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex rounded-lg bg-muted/20 p-1 max-w-xs">
                              <button
                                type="button"
                                onClick={() => setActiveBgTab("color")}
                                className={cn(
                                  "flex-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all text-center",
                                  activeBgTab === "color" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                              >
                                Color Sólido
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (store && !canUsePremiumBioFeatures(store)) {
                                    toast.error("Subir una imagen de fondo personalizada requiere el Plan Emprendedor o superior.");
                                    return;
                                  }
                                  setActiveBgTab("image");
                                }}
                                className={cn(
                                  "flex-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all text-center flex items-center justify-center gap-1",
                                  activeBgTab === "image" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                              >
                                {store && !canUsePremiumBioFeatures(store) && <Lock className="h-3 w-3 text-amber-500 shrink-0" />}
                                Imagen de Fondo
                              </button>
                            </div>

                            {activeBgTab === "color" ? (
                              <div className="space-y-1.5 max-w-xs">
                                <Label className="text-xs font-semibold">Elige el color de fondo</Label>
                                <div className="flex items-center gap-2 border rounded-lg p-1.5 bg-muted/10">
                                  <input
                                    type="color"
                                    value={bioBgColor || "#0f172a"}
                                    onChange={(e) => setBioBgColor(e.target.value)}
                                    className="h-8 w-8 rounded-md cursor-pointer border shrink-0"
                                  />
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] text-muted-foreground leading-none">Fondo</span>
                                    <span className="text-xs font-mono font-medium truncate uppercase mt-0.5">
                                      {bioBgColor || "#0f172a"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Sube una imagen de fondo vertical</Label>
                                <ImageUploadGuided
                                  value={bioBgImage}
                                  onChange={setBioBgImage}
                                  spec={bioBgImageSpec}
                                  label="Subir imagen de fondo"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Diseño de Botones */}
                      <div className="space-y-3 border-t border-border/40 pt-4">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block opacity-70">Diseño de Botones</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {[
                            { id: "pill-solid", name: "Píldora Relleno", pClass: "rounded-full bg-primary border-primary text-white" },
                            { id: "pill-outline", name: "Píldora Contorno", pClass: "rounded-full bg-transparent border-primary text-primary" },
                            { id: "pill-glass", name: "Píldora Vidrio", pClass: "rounded-full bg-white/10 border-white/20 text-foreground" },
                            { id: "rounded-solid", name: "Redondeado Relleno", pClass: "rounded-md bg-primary border-primary text-white" },
                            { id: "rounded-outline", name: "Redondeado Contorno", pClass: "rounded-md bg-transparent border-primary text-primary" },
                            { id: "rounded-glass", name: "Redondeado Vidrio", pClass: "rounded-md bg-white/10 border-white/20 text-foreground" },
                            { id: "sharp-solid", name: "Recto Relleno", pClass: "rounded-none bg-primary border-primary text-white" },
                            { id: "sharp-outline", name: "Recto Contorno", pClass: "rounded-none bg-transparent border-primary text-primary" },
                            { id: "sharp-glass", name: "Recto Vidrio", pClass: "rounded-none bg-white/10 border-white/20 text-foreground" },
                          ].map((style) => {
                            const isSelected = bioButtonStyle === style.id;
                            return (
                              <button
                                key={style.id}
                                type="button"
                                onClick={() => {
                                  if (store && !canUsePremiumBioFeatures(store) && style.id !== "pill-solid") {
                                    toast.error("Los estilos de botón premium requieren el Plan Emprendedor o superior.");
                                    return;
                                  }
                                  setBioButtonStyle(style.id);
                                }}
                                className={cn(
                                  "relative flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all hover:scale-[1.02] gap-1.5",
                                  isSelected 
                                    ? "border-primary ring-2 ring-primary/20 bg-primary/5 shadow-sm" 
                                    : "border-border bg-card/40"
                                )}
                              >
                                {store && !canUsePremiumBioFeatures(store) && style.id !== "pill-solid" && (
                                  <Lock className="absolute top-1 right-1 h-3 w-3 text-amber-500 bg-background/80 rounded-full p-0.5" />
                                )}
                                <div className={cn("h-5 w-full border text-[5px] font-black flex items-center justify-center tracking-widest", style.pClass)}>
                                  LINK
                                </div>
                                <span className="text-[9px] font-bold text-foreground truncate w-full">{style.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Colores Personalizados */}
                      <div className="space-y-3 border-t border-border/40 pt-4">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block opacity-70 flex items-center gap-1.5">
                          Colores de Botón Personalizados
                          {store && !canUsePremiumBioFeatures(store) && <Lock className="h-3 w-3 text-amber-500" />}
                        </Label>
                        {store && !canUsePremiumBioFeatures(store) ? (
                          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                            <p className="font-bold flex items-center gap-1">
                              <Crown className="h-3.5 w-3.5 text-amber-500" /> Característica Premium
                            </p>
                            <p>Personalizar libremente el color del botón o del texto requiere el Plan Emprendedor o superior. En el Plan Semilla se utiliza el color de tu marca por defecto.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold">Fondo del Botón</Label>
                                {bioButtonColor && (
                                  <button type="button" onClick={() => setBioButtonColor("")} className="text-[10px] text-destructive hover:underline font-semibold font-sans">
                                    Restablecer
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-2 border rounded-lg p-1.5 bg-muted/10">
                                <input
                                  type="color"
                                  value={bioButtonColor || "#000000"}
                                  onChange={(e) => setBioButtonColor(e.target.value)}
                                  className="h-8 w-8 rounded-md cursor-pointer border shrink-0"
                                />
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[10px] text-muted-foreground leading-none">Fondo</span>
                                  <span className="text-xs font-mono font-medium truncate uppercase mt-0.5">
                                    {bioButtonColor || "Color por defecto"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold">Texto del Botón</Label>
                                {bioButtonTextColor && (
                                  <button type="button" onClick={() => setBioButtonTextColor("")} className="text-[10px] text-destructive hover:underline font-semibold font-sans">
                                    Restablecer
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-2 border rounded-lg p-1.5 bg-muted/10">
                                <input
                                  type="color"
                                  value={bioButtonTextColor || "#ffffff"}
                                  onChange={(e) => setBioButtonTextColor(e.target.value)}
                                  className="h-8 w-8 rounded-md cursor-pointer border shrink-0"
                                />
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[10px] text-muted-foreground leading-none">Texto</span>
                                  <span className="text-xs font-mono font-medium truncate uppercase mt-0.5">
                                    {bioButtonTextColor || "Color por defecto"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                    </TabsContent>

                    {/* ──────────────── TAB 3: UBICACIÓN ──────────────── */}
                    <TabsContent value="ubicacion" className="space-y-5 mt-2 animate-in fade-in duration-300">
                      
                      {/* Toggle Habilitación del Mapa */}
                      <div className="flex items-center justify-between pb-3 border-b border-border/40">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-sm font-semibold text-foreground">Mostrar mapa en catálogo / Bio-Link</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className="text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-help">
                                <HelpCircle className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs font-normal text-left">
                              Si está desactivado, el mapa no se mostrará a tus clientes aunque tengas coordenadas configuradas.
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={showMap}
                          onClick={() => setShowMap(!showMap)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${showMap ? "bg-primary" : "bg-input"}`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${showMap ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      <div className="space-y-1.5 relative">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block opacity-70">Dirección Comercial del Local</Label>
                        <div className="relative">
                          <Input
                            value={locationAddress}
                            onChange={(e) => setLocationAddress(e.target.value)}
                            placeholder="Escribe la dirección física comercial..."
                            className="bg-transparent rounded-lg pr-9 text-sm h-10 w-full"
                          />
                          {loadingSuggestions && (
                            <div className="absolute right-3 top-3 h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          )}
                        </div>
                        
                        {suggestions.length > 0 && (
                          <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border/85 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-border/40">
                            {suggestions.map((sug, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleSelectSuggestion(sug)}
                                className="w-full text-left px-3 py-2 text-[11px] hover:bg-muted transition-colors text-foreground truncate block font-medium"
                                title={sug.display_name}
                              >
                                {sug.display_name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <details className="text-xs text-muted-foreground border border-border/40 rounded-lg p-2 bg-muted/[0.04] cursor-pointer group animate-in fade-in">
                        <summary className="font-semibold select-none list-none flex items-center justify-between">
                          <span>Coordenadas de Ubicación (Avanzado)</span>
                          <span className="text-[10px] group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div className="space-y-1">
                            <Label className="text-[10px]">Latitud</Label>
                            <Input value={locationLat || ""} readOnly placeholder="No asignada" className="h-8 bg-muted/40 text-muted-foreground text-xs" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">Longitud</Label>
                            <Input value={locationLng || ""} readOnly placeholder="No asignada" className="h-8 bg-muted/40 text-muted-foreground text-xs" />
                          </div>
                        </div>
                      </details>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground font-semibold">Posiciona tu negocio en el mapa:</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className="text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-help">
                                <HelpCircle className="h-3 w-3" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs font-normal text-left">
                              Haz clic en el mapa para colocar el pin o arrastra el marcador rojo para afinar las coordenadas de tu local.
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        


                        <div ref={mapRef} className="h-[230px] w-full rounded-xl border border-border/40 shadow-inner relative z-10 bg-muted/30 overflow-hidden" />
                      </div>
                    </TabsContent>
                  </Tabs>

                </div>
              ) : (
                <div className="py-8 text-center border-2 border-dashed rounded-xl bg-muted/5">
                  <Globe className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm font-semibold text-muted-foreground">El Bio-Link está desactivado</p>
                  <p className="text-xs text-muted-foreground/80 mt-1 max-w-xs mx-auto">
                    Activa la opción superior para integrar una biografía extendida, enlaces a redes y mapa físico en tu catálogo.
                  </p>
                </div>
              )}

              {/* Save & Preview */}
              <div className="pt-3 border-t border-border/40 flex flex-col sm:flex-row items-center justify-end gap-3 w-full">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto px-6 h-11 font-bold text-sm rounded-lg lg:hidden flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Smartphone className="h-4 w-4" />
                      Ver Vista Previa
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[80vh] p-4 rounded-t-3xl border-t-2 border-primary/20 overflow-y-auto">
                    <div className="py-4">
                      <PhonePreview
                        name={store.name}
                        logo={bioLogo || store.logo || ""}
                        bioDescription={bioDescription}
                        brandColor={store.brandColor || undefined}
                        bannerImage={bioBanner || store.bannerImage || undefined}
                        phone={country + number.replace(/\D/g, "")}
                        locationAddress={locationAddress}
                        locationLat={locationLat}
                        locationLng={locationLng}
                        customLinks={customLinks}
                        bioTheme={bioTheme}
                        bioButtonStyle={bioButtonStyle}
                        bioButtonColor={bioButtonColor}
                        bioButtonTextColor={bioButtonTextColor}
                        bioBgImage={bioBgImage}
                        bioBgColor={bioBgColor}
                        bioTypography={bioTypography}
                        showMap={showMap}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                <Button
                  onClick={save}
                  disabled={saving}
                  className="w-full sm:w-auto px-10 h-11 font-bold shadow-lg shadow-primary/20 text-sm rounded-lg cursor-pointer"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando...
                    </span>
                  ) : (
                    "Guardar cambios"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Live preview (desktop) */}
        <div className="hidden lg:block lg:col-span-5 sticky top-24">
          <PhonePreview
            name={store.name}
            logo={bioLogo || store.logo || ""}
            bioDescription={bioDescription}
            brandColor={store.brandColor || undefined}
            bannerImage={bioBanner || store.bannerImage || undefined}
            phone={country + number.replace(/\D/g, "")}
            locationAddress={locationAddress}
            locationLat={locationLat}
            locationLng={locationLng}
            customLinks={customLinks}
            bioTheme={bioTheme}
            bioButtonStyle={bioButtonStyle}
            bioButtonColor={bioButtonColor}
            bioButtonTextColor={bioButtonTextColor}
            bioBgImage={bioBgImage}
            bioBgColor={bioBgColor}
            bioTypography={bioTypography}
            showMap={showMap}
          />
        </div>
      </div>
    </div>
  );
}
