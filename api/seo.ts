import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

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
    // 1. Fetch store metadata from Supabase
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

  const escTitle = escapeHtmlAttr(title);
  const escDescription = escapeHtmlAttr(description);
  const escImage = escapeHtmlAttr(image);
  const escCanonical = escapeHtmlAttr(canonicalUrl);

  try {
    // 2. Read built index.html from dist/index.html (created by Vite build) or fetch from host
    let html = "";
    const distIndexPath = path.join(process.cwd(), "dist", "index.html");
    const rootIndexPath = path.join(process.cwd(), "index.html");

    if (fs.existsSync(distIndexPath)) {
      html = fs.readFileSync(distIndexPath, "utf-8");
    } else if (fs.existsSync(rootIndexPath)) {
      html = fs.readFileSync(rootIndexPath, "utf-8");
    } else {
      const host = req.headers.host || "dizi.idenza.site";
      const protocol =
        req.headers["x-forwarded-proto"] ||
        (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
      const resp = await fetch(`${protocol}://${host}/index.html`);
      if (resp.ok) {
        html = await resp.text();
      }
    }

    if (html) {
      // 3. Inject dynamic Open Graph & Twitter Card tags
      html = html.replace(/<title>.*?<\/title>/gi, `<title>${escTitle}</title>`);
      html = html.replace(
        /<meta name="description" content=".*?"\s*\/?>/gi,
        `<meta name="description" content="${escDescription}" />`,
      );
      html = html.replace(
        /<meta property="og:title" content=".*?"\s*\/?>/gi,
        `<meta property="og:title" content="${escTitle}" />`,
      );
      html = html.replace(
        /<meta property="og:description" content=".*?"\s*\/?>/gi,
        `<meta property="og:description" content="${escDescription}" />`,
      );
      html = html.replace(
        /<meta property="og:image" content=".*?"\s*\/?>/gi,
        `<meta property="og:image" content="${escImage}" />\n    <meta property="og:image:secure_url" content="${escImage}" />`,
      );
      html = html.replace(
        /<meta property="og:url" content=".*?"\s*\/?>/gi,
        `<meta property="og:url" content="${escCanonical}" />`,
      );
      html = html.replace(
        /<meta name="twitter:title" content=".*?"\s*\/?>/gi,
        `<meta name="twitter:title" content="${escTitle}" />`,
      );
      html = html.replace(
        /<meta name="twitter:description" content=".*?"\s*\/?>/gi,
        `<meta name="twitter:description" content="${escDescription}" />`,
      );
      html = html.replace(
        /<meta name="twitter:image" content=".*?"\s*\/?>/gi,
        `<meta name="twitter:image" content="${escImage}" />`,
      );

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=600");
      return res.status(200).send(html);
    }
  } catch (err: any) {
    console.error("[SEO Middleware] Error serving HTML:", err);
  }

  // Fallback: If anything fails, redirect to home
  return res.redirect("/");
}
