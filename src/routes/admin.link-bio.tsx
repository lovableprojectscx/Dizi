import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { type QuickLink, getBioLinksLimit, canUsePremiumBioFeatures } from "@/lib/types";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import "leaflet/dist/leaflet.css";
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
  instagramUrl,
  facebookUrl,
  tiktokUrl,
  linkedinUrl,
  customLinks,
  bioTheme = "default",
  bioButtonStyle = "pill-solid",
  bioButtonColor,
  bioButtonTextColor,
  bioBgImage,
  bioBgColor,
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
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  linkedinUrl: string;
  customLinks: QuickLink[];
  bioTheme?: string;
  bioButtonStyle?: string;
  bioButtonColor?: string;
  bioButtonTextColor?: string;
  bioBgImage?: string;
  bioBgColor?: string;
}) {
  const hasWhatsApp = !!phone;
  const hasLocation = !!(locationAddress.trim() && locationLat && locationLng);
  const allLinks: { label: string; icon: string; bgColor?: string; textColor?: string }[] = [
    ...(hasWhatsApp ? [{ label: "WhatsApp", icon: "whatsapp" }] : []),
    ...(instagramUrl ? [{ label: "Instagram", icon: "instagram" }] : []),
    ...(facebookUrl ? [{ label: "Facebook", icon: "facebook" }] : []),
    ...(tiktokUrl ? [{ label: "TikTok", icon: "tiktok" }] : []),
    ...(linkedinUrl ? [{ label: "LinkedIn", icon: "linkedin" }] : []),
    ...(hasLocation ? [{ label: "Ubicación", icon: "location" }] : []),
    ...customLinks.map((l) => ({ label: l.label, icon: "star", bgColor: l.bgColor, textColor: l.textColor })),
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

  const { type, radiusClass } = getMockupButtonStyle(bioButtonStyle);

  const getPlatformColors = (platform: string) => {
    if (platform === "whatsapp") return { bg: "#25D366", border: "#128C7E" };
    if (platform === "instagram") return { bg: "#dc2743", border: "#bc1888" };
    if (platform === "facebook") return { bg: "#1877f2", border: "#1062cc" };
    if (platform === "tiktok") return { bg: "#000000", border: "#111111" };
    if (platform === "linkedin") return { bg: "#0077b5", border: "#005a8a" };
    if (platform === "location") return { bg: "#ea4335", border: "#d93025" };
    return { bg: "#1f2937", border: "#374151" };
  };

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
              isMockupDark ? "dark" : ""
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
              <p className={cn("font-black text-[8.5px] text-center leading-tight uppercase", previewTextColor)}>{name || "Tu Tienda"}</p>
              {bioDescription && (
                <p className={cn("text-[6.5px] text-center leading-tight line-clamp-2 max-w-[160px]", previewMutedColor)}>
                  {bioDescription}
                </p>
              )}
            </div>
            {/* Links */}
            <div className="px-2 pt-2 space-y-1">
              {allLinks.slice(0, 6).map((link, idx) => {
                const defaultColors = getPlatformColors(link.icon);
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
                      extraClasses
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
                       "h-5 w-5 flex items-center justify-center shrink-0 mr-1.5 transition-transform duration-300 group-hover:scale-110",
                       isMonochrome ? "bg-transparent text-current" : "bg-white rounded-full shadow-inner"
                    )}>
                      <span className={cn("text-[5px] font-black", !isMonochrome ? "text-gray-800" : "")}>{link.label.charAt(0)}</span>
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
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiktokUrl, setTikTokUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [instagramBgColor, setInstagramBgColor] = useState("");
  const [facebookBgColor, setFacebookBgColor] = useState("");
  const [tiktokBgColor, setTiktokBgColor] = useState("");
  const [linkedinBgColor, setLinkedinBgColor] = useState("");
  const [customLinks, setCustomLinks] = useState<QuickLink[]>([]);
  const [locationAddress, setLocationAddress] = useState(store?.locationAddress || "");
  const [locationLat, setLocationLat] = useState<number | undefined>(store?.locationLat);
  const [locationLng, setLocationLng] = useState<number | undefined>(store?.locationLng);
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkBgColor, setNewLinkBgColor] = useState("");
  const [newLinkTextColor, setNewLinkTextColor] = useState("");
  const [saving, setSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [copiedBio, setCopiedBio] = useState(false);

  const [suggestions, setSuggestions] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const lastSelectedAddress = useRef<string>("");

  const mapRef = useRef<HTMLDivElement>(null);
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
      setBioLogo(store.bioLogo || "");
      setBioBanner(store.bioBanner || "");
      setBioTheme(store.bioTheme || "default");
      setBioButtonStyle(store.bioButtonStyle || "pill-solid");
      setBioButtonColor(store.bioButtonColor || "");
      setBioButtonTextColor(store.bioButtonTextColor || "");
      setBioBgImage(store.bioBgImage || "");
      setBioBgColor(store.bioBgColor || "#0f172a");
      setActiveBgTab(store.bioBgImage ? "image" : "color");

      const qLinks = store.quickLinks || [];
      let ig = "", fb = "", tt = "", li = "";
      const others: QuickLink[] = [];
      qLinks.forEach((link) => {
        const urlLower = link.url.toLowerCase();
        const labelLower = link.label.toLowerCase();
        if (urlLower.includes("instagram.com") || labelLower === "instagram") {
          ig = link.url.includes("/") ? link.url : `https://instagram.com/${link.url}`;
        } else if (urlLower.includes("facebook.com") || labelLower === "facebook") {
          fb = link.url.includes("/") ? link.url : `https://facebook.com/${link.url}`;
        } else if (urlLower.includes("tiktok.com") || labelLower === "tiktok") {
          tt = link.url.includes("/") ? link.url : `https://tiktok.com/@${link.url}`;
        } else if (urlLower.includes("linkedin.com") || labelLower === "linkedin") {
          li = link.url.includes("/") ? link.url : `https://linkedin.com/in/${link.url}`;
        } else {
          others.push(link);
        }
      });
      setInstagramUrl(ig);
      setFacebookUrl(fb);
      setTikTokUrl(tt);
      setLinkedinUrl(li);
      // Load social network colors
      qLinks.forEach((link) => {
        const urlLower = link.url.toLowerCase();
        const labelLower = link.label.toLowerCase();
        if (urlLower.includes("instagram.com") || labelLower === "instagram") {
          if (link.bgColor) setInstagramBgColor(link.bgColor);
        } else if (urlLower.includes("facebook.com") || labelLower === "facebook") {
          if (link.bgColor) setFacebookBgColor(link.bgColor);
        } else if (urlLower.includes("tiktok.com") || labelLower === "tiktok") {
          if (link.bgColor) setTiktokBgColor(link.bgColor);
        } else if (urlLower.includes("linkedin.com") || labelLower === "linkedin") {
          if (link.bgColor) setLinkedinBgColor(link.bgColor);
        }
      });
      setCustomLinks(others);
      setIsLoaded(true);
    }
  }, [store, isLoaded]);

  /* Leaflet map */
  useEffect(() => {
    if (!bioLinksEnabled || !mapRef.current) {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerInstance.current = null;
      }
      return;
    }
    const timer = setTimeout(async () => {
      if (!mapRef.current) return;
      const L = await import("leaflet");
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      const defaultLat = locationLat || -12.046374;
      const defaultLng = locationLng || -77.042793;
      if (!mapInstance.current && mapRef.current) {
        const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 14);
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
      }
    }, 150);
    return () => {
      clearTimeout(timer);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerInstance.current = null;
      }
    };
  }, [bioLinksEnabled, isLoaded, activeEditTab]);

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

  const handleBlurSocial = (
    value: string,
    platform: "instagram" | "facebook" | "tiktok" | "linkedin"
  ) => {
    const formatted = formatSocialUrl(value, platform);
    if (platform === "instagram") setInstagramUrl(formatted);
    else if (platform === "facebook") setFacebookUrl(formatted);
    else if (platform === "tiktok") setTikTokUrl(formatted);
    else if (platform === "linkedin") setLinkedinUrl(formatted);
  };

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedBio(true);
    setTimeout(() => setCopiedBio(false), 2000);
    toast.success("Enlace copiado");
  };

  const save = async () => {
    const finalQuickLinks: QuickLink[] = [];
    if (instagramUrl.trim()) finalQuickLinks.push({ label: "Instagram", url: formatSocialUrl(instagramUrl, "instagram"), bgColor: instagramBgColor || undefined });
    if (facebookUrl.trim()) finalQuickLinks.push({ label: "Facebook", url: formatSocialUrl(facebookUrl, "facebook"), bgColor: facebookBgColor || undefined });
    if (tiktokUrl.trim()) finalQuickLinks.push({ label: "TikTok", url: formatSocialUrl(tiktokUrl, "tiktok"), bgColor: tiktokBgColor || undefined });
    if (linkedinUrl.trim()) finalQuickLinks.push({ label: "LinkedIn", url: formatSocialUrl(linkedinUrl, "linkedin"), bgColor: linkedinBgColor || undefined });
    customLinks.forEach((link) => finalQuickLinks.push(link));

    setSaving(true);
    try {
      await update(store.id, {
        bioDescription: bioDescription.trim(),
        bioLinksEnabled,
        quickLinks: finalQuickLinks,
        locationAddress: locationAddress.trim(),
        locationLat,
        locationLng,
        bioLogo: bioLogo || null,
        bioBanner: bioBanner || null,
        bioTheme,
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

                      {/* Redes Sociales */}
                      <div className="space-y-3 pt-4 border-t border-border/30">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block opacity-70">Redes Oficiales</Label>
                        
                        {/* WhatsApp Auto-Vínculo */}
                        <div className="bg-emerald-500/[0.02] border border-emerald-500/10 p-2.5 rounded-lg flex items-center justify-between gap-3 text-xs mb-3">
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

                        <div className="grid gap-4 sm:grid-cols-2">
                          {/* Instagram */}
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold flex items-center gap-1.5">
                              <Instagram className="h-3.5 w-3.5 text-pink-600" /> Instagram
                            </Label>
                            <Input
                              value={instagramUrl}
                              onChange={(e) => setInstagramUrl(e.target.value)}
                              onBlur={() => handleBlurSocial(instagramUrl, "instagram")}
                              placeholder="Usuario o enlace completo"
                              className="bg-transparent text-sm h-10 w-full rounded-lg"
                            />
                            {instagramUrl.trim() && (
                              store && !canUsePremiumBioFeatures(store) ? (
                                <div className="flex items-center justify-between text-[10px] text-amber-600 dark:text-amber-400 mt-1 pl-1">
                                  <span className="flex items-center gap-1">
                                    <Lock className="h-3 w-3" /> Color personalizado
                                  </span>
                                  <span className="font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded text-[8px] uppercase">Premium</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 border rounded-lg px-2 py-1 bg-muted/10 h-8 mt-1">
                                  <input
                                    type="color"
                                    value={instagramBgColor || "#E1306C"}
                                    onChange={(e) => setInstagramBgColor(e.target.value)}
                                    className="h-5 w-5 rounded cursor-pointer border shrink-0"
                                  />
                                  <span className="text-[10px] font-mono truncate flex-1">{instagramBgColor || "Color de botón"}</span>
                                  {instagramBgColor && (
                                    <button type="button" onClick={() => setInstagramBgColor("")} className="text-[9px] text-destructive hover:underline font-bold">Reset</button>
                                  )}
                                </div>
                              )
                            )}
                          </div>

                          {/* Facebook */}
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold flex items-center gap-1.5">
                              <Facebook className="h-3.5 w-3.5 text-blue-600" /> Facebook
                            </Label>
                            <Input
                              value={facebookUrl}
                              onChange={(e) => setFacebookUrl(e.target.value)}
                              onBlur={() => handleBlurSocial(facebookUrl, "facebook")}
                              placeholder="Usuario o enlace completo"
                              className="bg-transparent text-sm h-10 w-full rounded-lg"
                            />
                            {facebookUrl.trim() && (
                              store && !canUsePremiumBioFeatures(store) ? (
                                <div className="flex items-center justify-between text-[10px] text-amber-600 dark:text-amber-400 mt-1 pl-1">
                                  <span className="flex items-center gap-1">
                                    <Lock className="h-3 w-3" /> Color personalizado
                                  </span>
                                  <span className="font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded text-[8px] uppercase">Premium</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 border rounded-lg px-2 py-1 bg-muted/10 h-8 mt-1">
                                  <input
                                    type="color"
                                    value={facebookBgColor || "#1877f2"}
                                    onChange={(e) => setFacebookBgColor(e.target.value)}
                                    className="h-5 w-5 rounded cursor-pointer border shrink-0"
                                  />
                                  <span className="text-[10px] font-mono truncate flex-1">{facebookBgColor || "Color de botón"}</span>
                                  {facebookBgColor && (
                                    <button type="button" onClick={() => setFacebookBgColor("")} className="text-[9px] text-destructive hover:underline font-bold">Reset</button>
                                  )}
                                </div>
                              )
                            )}
                          </div>

                          {/* TikTok */}
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold flex items-center gap-1.5">
                              <svg className="h-3.5 w-3.5 fill-current text-foreground dark:text-white" viewBox="0 0 24 24">
                                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .8.11V9.4a6.27 6.27 0 0 0-3.11 0A6.33 6.33 0 0 0 2 15.68a6.32 6.32 0 0 0 10.4 4.84 6.26 6.26 0 0 0 1.95-4.52V8.82a8.27 8.27 0 0 0 5.24 1.86V7.28a4.89 4.89 0 0 1-3.11-.59z" />
                              </svg>
                              TikTok
                            </Label>
                            <Input
                              value={tiktokUrl}
                              onChange={(e) => setTikTokUrl(e.target.value)}
                              onBlur={() => handleBlurSocial(tiktokUrl, "tiktok")}
                              placeholder="Usuario o enlace completo"
                              className="bg-transparent text-sm h-10 w-full rounded-lg"
                            />
                            {tiktokUrl.trim() && (
                              store && !canUsePremiumBioFeatures(store) ? (
                                <div className="flex items-center justify-between text-[10px] text-amber-600 dark:text-amber-400 mt-1 pl-1">
                                  <span className="flex items-center gap-1">
                                    <Lock className="h-3 w-3" /> Color personalizado
                                  </span>
                                  <span className="font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded text-[8px] uppercase">Premium</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 border rounded-lg px-2 py-1 bg-muted/10 h-8 mt-1">
                                  <input
                                    type="color"
                                    value={tiktokBgColor || "#010101"}
                                    onChange={(e) => setTiktokBgColor(e.target.value)}
                                    className="h-5 w-5 rounded cursor-pointer border shrink-0"
                                  />
                                  <span className="text-[10px] font-mono truncate flex-1">{tiktokBgColor || "Color de botón"}</span>
                                  {tiktokBgColor && (
                                    <button type="button" onClick={() => setTiktokBgColor("")} className="text-[9px] text-destructive hover:underline font-bold">Reset</button>
                                  )}
                                </div>
                              )
                            )}
                          </div>

                          {/* LinkedIn */}
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold flex items-center gap-1.5">
                              <Linkedin className="h-3.5 w-3.5 text-[#0077b5]" /> LinkedIn
                            </Label>
                            <Input
                              value={linkedinUrl}
                              onChange={(e) => setLinkedinUrl(e.target.value)}
                              onBlur={() => handleBlurSocial(linkedinUrl, "linkedin")}
                              placeholder="Usuario o enlace completo"
                              className="bg-transparent text-sm h-10 w-full rounded-lg"
                            />
                            {linkedinUrl.trim() && (
                              store && !canUsePremiumBioFeatures(store) ? (
                                <div className="flex items-center justify-between text-[10px] text-amber-600 dark:text-amber-400 mt-1 pl-1">
                                  <span className="flex items-center gap-1">
                                    <Lock className="h-3 w-3" /> Color personalizado
                                  </span>
                                  <span className="font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded text-[8px] uppercase">Premium</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 border rounded-lg px-2 py-1 bg-muted/10 h-8 mt-1">
                                  <input
                                    type="color"
                                    value={linkedinBgColor || "#0077b5"}
                                    onChange={(e) => setLinkedinBgColor(e.target.value)}
                                    className="h-5 w-5 rounded cursor-pointer border shrink-0"
                                  />
                                  <span className="text-[10px] font-mono truncate flex-1">{linkedinBgColor || "Color de botón"}</span>
                                  {linkedinBgColor && (
                                    <button type="button" onClick={() => setLinkedinBgColor("")} className="text-[9px] text-destructive hover:underline font-bold">Reset</button>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Enlaces personalizados */}
                      <div className="space-y-3 border-t border-border/40 pt-4">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block opacity-70">Enlaces Adicionales</Label>
                        <div className="flex flex-col gap-4 bg-muted/[0.03] p-4 rounded-xl border border-border/40">
                          <div className="flex flex-col sm:flex-row gap-3 items-end">
                            <div className="flex-1 w-full space-y-1">
                              <Label className="text-xs text-muted-foreground font-medium">Texto del Botón</Label>
                              <Input
                                value={newLinkLabel}
                                onChange={(e) => setNewLinkLabel(e.target.value)}
                                placeholder="Ej: Catálogo Mayorista PDF 📄"
                                className="h-9 bg-transparent rounded-lg text-sm"
                              />
                            </div>
                            <div className="flex-[2] w-full space-y-1">
                              <Label className="text-xs text-muted-foreground font-medium">Enlace (URL)</Label>
                              <Input
                                value={newLinkUrl}
                                onChange={(e) => setNewLinkUrl(e.target.value)}
                                placeholder="Ej: miweb.com/catalogo.pdf"
                                className="h-9 bg-transparent rounded-lg text-sm"
                              />
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-4 items-end justify-between border-t border-border/20 pt-3">
                            <div className="grid grid-cols-2 gap-3 w-full sm:max-w-md">
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground font-semibold">Color de Fondo (Opcional)</Label>
                                <div className="flex items-center gap-1.5 border rounded-lg p-1 bg-muted/10 h-9">
                                  <input
                                    type="color"
                                    value={newLinkBgColor || "#000000"}
                                    onChange={(e) => setNewLinkBgColor(e.target.value)}
                                    className="h-6 w-6 rounded-md cursor-pointer border shrink-0"
                                  />
                                  <span className="text-[10px] font-mono truncate text-muted-foreground">
                                    {newLinkBgColor || "Por defecto"}
                                  </span>
                                  {newLinkBgColor && (
                                    <button
                                      type="button"
                                      onClick={() => setNewLinkBgColor("")}
                                      className="text-[9px] text-destructive hover:underline ml-auto font-bold pr-1 font-sans"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground font-semibold">Color de Texto (Opcional)</Label>
                                <div className="flex items-center gap-1.5 border rounded-lg p-1 bg-muted/10 h-9">
                                  <input
                                    type="color"
                                    value={newLinkTextColor || "#ffffff"}
                                    onChange={(e) => setNewLinkTextColor(e.target.value)}
                                    className="h-6 w-6 rounded-md cursor-pointer border shrink-0"
                                  />
                                  <span className="text-[10px] font-mono truncate text-muted-foreground">
                                    {newLinkTextColor || "Por defecto"}
                                  </span>
                                  {newLinkTextColor && (
                                    <button
                                      type="button"
                                      onClick={() => setNewLinkTextColor("")}
                                      className="text-[9px] text-destructive hover:underline ml-auto font-bold pr-1 font-sans"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            <Button
                              onClick={() => {
                                if (store && customLinks.length >= getBioLinksLimit(store)) {
                                  toast.error(`El Plan Semilla está limitado a un máximo de ${getBioLinksLimit(store)} enlaces personalizados. Sube de plan para agregar más.`);
                                  return;
                                }
                                if (!newLinkLabel.trim() || !newLinkUrl.trim()) {
                                  toast.error("Ingresa el título y el enlace");
                                  return;
                                }
                                setCustomLinks([
                                  ...customLinks,
                                  {
                                    label: newLinkLabel.trim(),
                                    url: newLinkUrl.trim(),
                                    bgColor: newLinkBgColor || undefined,
                                    textColor: newLinkTextColor || undefined,
                                  },
                                ]);
                                setNewLinkLabel("");
                                setNewLinkUrl("");
                                setNewLinkBgColor("");
                                setNewLinkTextColor("");
                                toast.success("Enlace personalizado agregado");
                              }}
                              type="button"
                              className="h-9 font-bold px-5 w-full sm:w-auto cursor-pointer rounded-lg text-xs"
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" /> Añadir botón
                            </Button>
                          </div>
                        </div>

                        {store && store.plan === "semilla" && (
                          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                            <Crown className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <p className="font-bold">Límite del Plan Semilla</p>
                              <p>Puedes agregar un máximo de 5 enlaces personalizados en el plan gratuito. Actualmente tienes {customLinks.length}/5 creados.</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-2 pt-1">
                          {customLinks.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic py-1 pl-1">No has agregado enlaces personalizados aún.</p>
                          ) : (
                            customLinks.map((link, idx) => (
                              <div key={idx} className="flex flex-col gap-2.5 p-3 rounded-xl border bg-card text-xs shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-foreground truncate">{link.label}</p>
                                    <p className="font-mono text-[10px] text-muted-foreground truncate">{link.url}</p>
                                  </div>
                                  <Button
                                    onClick={() => { setCustomLinks(customLinks.filter((_, i) => i !== idx)); toast.success("Enlace eliminado"); }}
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer rounded-lg"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                
                                {store && !canUsePremiumBioFeatures(store) ? (
                                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-amber-600 dark:text-amber-400">
                                    <span className="flex items-center gap-1">
                                      <Lock className="h-3.5 w-3.5" /> Colores personalizados por botón
                                    </span>
                                    <span className="font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded text-[8px] uppercase">Premium</span>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
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
                            ))
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    {/* ──────────────── TAB 2: APARIENCIA ──────────────── */}
                    <TabsContent value="apariencia" className="space-y-5 mt-2 animate-in fade-in duration-300">
                      
                      {/* Perfil y Portada */}
                      <div className="space-y-3">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block opacity-70">Fotos del Bio-Link</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground font-bold">Foto de Perfil Especial</Label>
                            <ImageUploadGuided
                              value={bioLogo}
                              onChange={setBioLogo}
                              spec={bioLogoSpec}
                              label="Subir foto de perfil"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground font-bold">Foto de Portada Especial</Label>
                            <ImageUploadGuided
                              value={bioBanner}
                              onChange={setBioBanner}
                              spec={bioBannerSpec}
                              label="Subir foto de portada"
                            />
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

              {/* Save */}
              <div className="pt-3 border-t border-border/40 flex justify-end">
                <Button
                  onClick={save}
                  disabled={saving}
                  className="w-full sm:w-auto px-10 h-11 font-bold shadow-lg shadow-primary/20 text-sm rounded-lg"
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
            brandColor={store.brandColor}
            bannerImage={bioBanner || store.bannerImage}
            phone={country + number.replace(/\D/g, "")}
            locationAddress={locationAddress}
            locationLat={locationLat}
            locationLng={locationLng}
            instagramUrl={instagramUrl}
            facebookUrl={facebookUrl}
            tiktokUrl={tiktokUrl}
            linkedinUrl={linkedinUrl}
            customLinks={customLinks}
            bioTheme={bioTheme}
            bioButtonStyle={bioButtonStyle}
            bioButtonColor={bioButtonColor}
            bioButtonTextColor={bioButtonTextColor}
            bioBgImage={bioBgImage}
            bioBgColor={bioBgColor}
          />
        </div>
      </div>

      {/* Mobile floating preview button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <Sheet>
          <SheetTrigger asChild>
            <Button className="h-12 w-12 rounded-full shadow-2xl cursor-pointer flex items-center justify-center p-0 bg-primary text-white border border-primary/20 hover:scale-105 active:scale-95 transition-all">
              <Smartphone className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] p-4 rounded-t-3xl border-t-2 border-primary/20 overflow-y-auto">
            <div className="py-4">
              <PhonePreview
                name={store.name}
                logo={bioLogo || store.logo || ""}
                bioDescription={bioDescription}
                brandColor={store.brandColor}
                bannerImage={bioBanner || store.bannerImage}
                phone={country + number.replace(/\D/g, "")}
                locationAddress={locationAddress}
                locationLat={locationLat}
                locationLng={locationLng}
                instagramUrl={instagramUrl}
                facebookUrl={facebookUrl}
                tiktokUrl={tiktokUrl}
                linkedinUrl={linkedinUrl}
                customLinks={customLinks}
                bioTheme={bioTheme}
                bioButtonStyle={bioButtonStyle}
                bioButtonColor={bioButtonColor}
                bioButtonTextColor={bioButtonTextColor}
                bioBgImage={bioBgImage}
                bioBgColor={bioBgColor}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
