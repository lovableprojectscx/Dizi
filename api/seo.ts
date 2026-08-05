import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://wxpizbnuuaiculzfuhof.supabase.co";

const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4cGl6Ym51dWFpY3VsemZ1aG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTUyNzEwOTMsImV4cCI6MjAyODg0NzA5M30.7C105K7fW2-d0u4aT9-4S4P6g8pQ8qQ0X2000000000";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function escapeHtmlAttr(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cleanImageUrl(url?: string | null): string | null {
  if (!url || typeof url !== "string" || !url.trim()) return null;
  let first = url.includes("|||") ? url.split("|||")[0] : url;
  first = first.trim();
  if (first.startsWith("http://") || first.startsWith("https://")) return first;
  if (first.startsWith("/")) return `https://dizi.idenza.site${first}`;
  return `https://dizi.idenza.site/${first}`;
}

function getImageType(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes(".webp")) return "image/webp";
  if (lower.includes(".png")) return "image/png";
  return "image/jpeg";
}

export default async function handler(req: any, res: any) {
  const { slug, type, p, producto } = req.query;

  if (!slug) {
    return res.status(400).send("Missing slug");
  }

  const defaultTitle = "Dizi · Catálogos Digitales";
  const defaultDescription = "Crea tu catálogo digital en 2 minutos y vende por WhatsApp.";
  const defaultImage = "https://dizi.idenza.site/images/og-image.png";

  let title = defaultTitle;
  let description = defaultDescription;
  let image = defaultImage;
  const canonicalUrl = `https://dizi.idenza.site/${type === "bio" ? "bio" : "t"}/${slug}`;

  try {
    // 1. Query store by slug directly from Supabase
    const { data: store } = await supabase
      .from("stores")
      .select("id, name, logo, banner_image, bio_logo, bio_banner, bio_description")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();

    if (store) {
      const storeBanner = cleanImageUrl(store.banner_image);
      const storeLogo = cleanImageUrl(store.logo);
      const bioBanner = cleanImageUrl(store.bio_banner);
      const bioLogo = cleanImageUrl(store.bio_logo);

      // Priority: Banner del negocio -> Foto de perfil/Logo del negocio -> Default Dizi
      const bestImage =
        type === "bio"
          ? bioBanner || storeBanner || bioLogo || storeLogo || defaultImage
          : storeBanner || bioBanner || storeLogo || bioLogo || defaultImage;

      title = `${store.name} · ${type === "bio" ? "Enlaces & Contacto" : "Catálogo Digital"}`;
      description =
        store.bio_description ||
        (type === "bio"
          ? `Encuentra nuestras redes sociales, catálogo digital y ubicación de ${store.name}.`
          : `Explora nuestro catálogo digital y realiza tus pedidos directo por WhatsApp con ${store.name}.`);
      image = bestImage;

      // Check for specific product deep link (?p=ID or ?producto=ID)
      const targetProductId = p || producto;
      if (targetProductId) {
        const { data: prod } = await supabase
          .from("products")
          .select("name, price, description, image")
          .eq("id", targetProductId)
          .maybeSingle();

        if (prod) {
          const prodPrice = prod.price ? ` | S/ ${Number(prod.price).toFixed(2)}` : "";
          title = `${prod.name} — ${store.name}${prodPrice}`;
          description =
            prod.description ||
            `Mira ${prod.name} en el catálogo digital de ${store.name}. Pedidos directo por WhatsApp.`;
          image = cleanImageUrl(prod.image) || image;
        }
      }
    }
  } catch (err) {
    console.error("[SEO Middleware] Error fetching metadata:", err);
  }

  // Prepared attributes
  const escTitle = escapeHtmlAttr(title);
  const escDescription = escapeHtmlAttr(description);
  const escImage = escapeHtmlAttr(image);
  const escCanonical = escapeHtmlAttr(canonicalUrl);
  const imageType = getImageType(image);

  // Return clean, fast, self-contained HTML for search engines and social bots (WhatsApp, Facebook, Twitter, Telegram)
  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escTitle}</title>
    <meta name="description" content="${escDescription}" />
    <meta name="author" content="Dizi" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${escCanonical}" />

    <!-- Open Graph (WhatsApp, Facebook, Messenger, iMessage, Telegram) -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Dizi" />
    <meta property="og:url" content="${escCanonical}" />
    <meta property="og:title" content="${escTitle}" />
    <meta property="og:description" content="${escDescription}" />
    <meta property="og:image" content="${escImage}" />
    <meta property="og:image:secure_url" content="${escImage}" />
    <meta property="og:image:type" content="${imageType}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="es_PE" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@DiziPeru" />
    <meta name="twitter:title" content="${escTitle}" />
    <meta name="twitter:description" content="${escDescription}" />
    <meta name="twitter:image" content="${escImage}" />

    <!-- Favicon & Styles -->
    <link rel="icon" type="image/png" href="/images/Icono.png" />
    <link rel="apple-touch-icon" href="/images/Icono.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Sora:wght@400;600;700;800&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root">
      <div style="min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background-color:#fafafa; font-family:system-ui,-apple-system,sans-serif;">
        <div style="display:flex; flex-direction:column; align-items:center; gap:16px;">
          <img src="/images/Icono.png" alt="Dizi" style="width:52px; height:52px; border-radius:14px; box-shadow:0 4px 16px rgba(234,88,12,0.15); animation: diziPulse 1.5s infinite ease-in-out;" />
          <div style="width:24px; height:24px; border:2.5px solid #e2e8f0; border-top-color:#ea580c; border-radius:50%; animation: diziSpin 0.8s linear infinite;"></div>
        </div>
      </div>
      <style>
        @keyframes diziSpin { to { transform: rotate(360deg); } }
        @keyframes diziPulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.06); opacity: 0.85; } }
      </style>
    </div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=600");
  return res.status(200).send(html);
}
