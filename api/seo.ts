import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan variables de entorno de Supabase (VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY).",
  );
}

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

export default async function handler(req: any, res: any) {
  const { slug, type } = req.query;

  if (!slug) {
    return res.status(400).send("Missing slug");
  }

  let title = "Dizi — Catálogos Digitales";
  let description = "Crea tu catálogo digital en 2 minutos y vende por WhatsApp.";
  let image = "https://dizi.idenza.site/images/og-image.png";

  try {
    // 1. Fetch store from database
    const { data: store, error } = await supabase
      .from("stores")
      .select("name, logo, banner_image, bio_logo, bio_banner, bio_description")
      .eq("slug", slug)
      .eq("active", true)
      .single();

    if (store && !error) {
      if (type === "bio") {
        title = `${store.name} · Enlaces & Contacto`;
        description = store.bio_description || `Enlaces, ubicación y contacto de ${store.name}.`;
        image = store.bio_banner || store.banner_image || store.bio_logo || store.logo || image;
      } else {
        title = `${store.name} · Catálogo Digital`;
        description = `Mira nuestro catálogo: ${store.name}. Vende por WhatsApp de forma directa.`;
        image = store.banner_image || store.logo || image;
      }
    }
  } catch (err) {
    console.error("Error fetching SEO metadata:", err);
  }

  // Escape attributes for injection
  const escTitle = escapeHtmlAttr(title);
  const escDescription = escapeHtmlAttr(description);
  const escImage = escapeHtmlAttr(image);

  try {
    // 2. Fetch original index.html from static build
    const host = req.headers.host || "dizi.idenza.site";
    const protocol =
      req.headers["x-forwarded-proto"] ||
      (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
    const indexUrl = `${protocol}://${host}/index.html`;

    const htmlRes = await fetch(indexUrl);
    if (!htmlRes.ok) {
      throw new Error(`Failed to fetch index.html from ${indexUrl}: ${htmlRes.statusText}`);
    }
    let html = await htmlRes.text();

    // 3. Inject dynamic tags using robust regex
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
      `<meta property="og:image" content="${escImage}" />`,
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

    // 4. Return HTML
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (err: any) {
    console.error("Error injecting metadata:", err);
    return res.status(500).send(`Internal Server Error: ${err.message}`);
  }
}
