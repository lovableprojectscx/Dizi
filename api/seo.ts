import fs from "fs";
import path from "path";

interface CategoryLike {
  id: string;
  name: string;
  icon?: string;
  productCount?: number;
}

function cleanCategoryName(rawName?: string | null): string {
  if (!rawName) return "";
  return rawName.split("|")[0].trim();
}

function categorySlug(name?: string | null, fallbackId?: string): string {
  if (!name || typeof name !== "string") {
    return fallbackId || "";
  }
  let s = name.split("|")[0];
  s = s.replace(/\p{Extended_Pictographic}/gu, "");
  s = s.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu, "");
  s = s.toLowerCase();
  s = s.replace(/&/g, " ");
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  s = s.replace(/[^a-z0-9]+/g, "-");
  s = s.replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  return s || fallbackId || "";
}

function getCategorySlugMap(categories: CategoryLike[]): Map<string, string> {
  const slugMap = new Map<string, string>();
  const usedSlugs = new Set<string>();
  for (const cat of categories) {
    const rawSlug = categorySlug(cat.name, cat.id);
    if (!rawSlug || usedSlugs.has(rawSlug.toLowerCase())) {
      slugMap.set(cat.id, cat.id);
      usedSlugs.add(cat.id.toLowerCase());
    } else {
      slugMap.set(cat.id, rawSlug);
      usedSlugs.add(rawSlug.toLowerCase());
    }
  }
  return slugMap;
}

function getCategorySlug(categories: CategoryLike[], category: CategoryLike): string {
  const map = getCategorySlugMap(categories);
  return map.get(category.id) || categorySlug(category.name, category.id) || category.id;
}

function findCategoryByParam(
  categories: CategoryLike[],
  param?: string | null,
): CategoryLike | { id: "sale"; name: "Ofertas" } | null {
  if (!param || !param.trim()) return null;
  const p = param.trim();
  const pSlug = categorySlug(p);
  const pLower = p.toLowerCase();

  if (pLower === "ofertas" || pSlug === "ofertas") {
    return { id: "sale", name: "Ofertas" };
  }
  const slugMap = getCategorySlugMap(categories);
  const matchBySlug = categories.find((c) => {
    const catSlug = slugMap.get(c.id)?.toLowerCase();
    return (pSlug && catSlug === pSlug) || catSlug === pLower;
  });
  if (matchBySlug) return matchBySlug;
  const matchById = categories.find((c) => c.id.toLowerCase() === pLower);
  return matchById || null;
}

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://zkqzdwxjthjdjchimmds.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

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

  // Filter out inline SVG data URIs because social crawlers like WhatsApp cannot render data: URIs as OG cards
  if (url.startsWith("data:")) return null;

  let first = url.includes("|||") ? url.split("|||")[0] : url;
  first = first.trim();
  if (first.startsWith("http://") || first.startsWith("https://")) return first;
  if (first.startsWith("/")) return `https://dizi.idenza.site${first}`;
  return `https://dizi.idenza.site/${first}`;
}

export default async function handler(req: any, res: any) {
  const { slug, type, p, producto, c, categoria } = req.query;

  if (!slug) {
    return res.status(400).send("Missing slug");
  }

  const defaultTitle = "Dizi · Catálogos Digitales";
  const defaultDescription = "Crea tu catálogo digital en 2 minutos y vende por WhatsApp.";
  const defaultImage = "https://dizi.idenza.site/images/og-image.png";

  let title = defaultTitle;
  let description = defaultDescription;
  let image = defaultImage;
  let canonicalUrl = `https://dizi.idenza.site/${type === "bio" ? "bio" : "t"}/${slug}`;

  try {
    // Query Supabase REST API directly with case-insensitive slug lookup
    let storeRes: Response | null = null;
    try {
      storeRes = await fetch(
        `${SUPABASE_URL}/rest/v1/stores?slug=ilike.${encodeURIComponent(slug)}&active=eq.true&select=id,name,logo,banner_image,bio_logo,bio_banner,bio_description`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            "Content-Type": "application/json",
          },
        },
      );

      // Reintento corto si Supabase responde 5xx
      if (storeRes && storeRes.status >= 500) {
        console.warn(`[SEO Middleware] Supabase respondió 5xx (${storeRes.status}) para ${slug}. Reintentando en 800ms...`);
        await new Promise((r) => setTimeout(r, 800));
        storeRes = await fetch(
          `${SUPABASE_URL}/rest/v1/stores?slug=ilike.${encodeURIComponent(slug)}&active=eq.true&select=id,name,logo,banner_image,bio_logo,bio_banner,bio_description`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              "Content-Type": "application/json",
            },
          },
        );
      }
    } catch (fetchErr) {
      console.warn(`[SEO Middleware] Error de red consultando tienda ${slug}:`, fetchErr);
    }

    if (storeRes && storeRes.ok) {
      const stores = await storeRes.json();
      const store = stores && stores.length > 0 ? stores[0] : null;

      if (store) {
        const storeBanner = cleanImageUrl(store.banner_image);
        const storeLogo = cleanImageUrl(store.logo);
        const bioBanner = cleanImageUrl(store.bio_banner);
        const bioLogo = cleanImageUrl(store.bio_logo);

        // Hierarchy: Store Banner -> Store Bio Banner -> Store Logo -> Store Bio Logo -> Fallback Dizi
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
        let productFound = false;

        if (targetProductId) {
          let prodRes: Response | null = null;
          try {
            prodRes = await fetch(
              `${SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(targetProductId)}&select=name,price,description,image`,
              {
                headers: {
                  apikey: SUPABASE_ANON_KEY,
                  "Content-Type": "application/json",
                },
              },
            );

            if (prodRes && prodRes.status >= 500) {
              await new Promise((r) => setTimeout(r, 600));
              prodRes = await fetch(
                `${SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(targetProductId)}&select=name,price,description,image`,
                {
                  headers: {
                    apikey: SUPABASE_ANON_KEY,
                    "Content-Type": "application/json",
                  },
                },
              );
            }

            if (prodRes && prodRes.ok) {
              const prods = await prodRes.json();
              const prod = prods && prods.length > 0 ? prods[0] : null;
              if (prod) {
                productFound = true;
                const prodPrice = prod.price ? ` | S/ ${Number(prod.price).toFixed(2)}` : "";
                title = `${prod.name} — ${store.name}${prodPrice}`;
                description =
                  prod.description ||
                  `Mira ${prod.name} en el catálogo digital de ${store.name}. Pedidos directo por WhatsApp.`;
                image = cleanImageUrl(prod.image) || image;
                canonicalUrl = `https://dizi.idenza.site/t/${slug}?p=${encodeURIComponent(targetProductId)}`;
              }
            }
          } catch {}
        }

        // Si no se encontró producto y viene categoría (?c= o ?categoria=), procesar categoría (gana ?p=)
        const targetCategoryParam = c || categoria;
        if (!productFound && targetCategoryParam) {
          try {
            let catRes: Response | null = null;
            try {
              catRes = await fetch(
                `${SUPABASE_URL}/rest/v1/categories?store_id=eq.${store.id}&select=id,name`,
                {
                  headers: {
                    apikey: SUPABASE_ANON_KEY,
                    "Content-Type": "application/json",
                  },
                },
              );

              if (catRes && catRes.status >= 500) {
                await new Promise((r) => setTimeout(r, 600));
                catRes = await fetch(
                  `${SUPABASE_URL}/rest/v1/categories?store_id=eq.${store.id}&select=id,name`,
                  {
                    headers: {
                      apikey: SUPABASE_ANON_KEY,
                      "Content-Type": "application/json",
                    },
                  },
                );
              }
            } catch (catFetchErr) {
              console.warn(`[SEO Middleware] Error consultando categorías de ${slug}:`, catFetchErr);
            }

            if (catRes && catRes.ok) {
              const categories = await catRes.json();
              const matchedCat = findCategoryByParam(categories, targetCategoryParam);

              if (matchedCat) {
                const catName = matchedCat.id === "sale" ? "Ofertas" : cleanCategoryName(matchedCat.name);
                title = `${catName} — ${store.name}`;
                description = `Mira ${catName} en el catálogo de ${store.name}. Pedidos por WhatsApp.`;
                const catSlug =
                  matchedCat.id === "sale" ? "ofertas" : getCategorySlug(categories, matchedCat);
                canonicalUrl = `https://dizi.idenza.site/t/${slug}/${encodeURIComponent(catSlug)}`;

                // Imagen: primer producto visible de la categoría (orden sort_order asc nulls last, created_at desc)
                const prodFilter =
                  matchedCat.id === "sale"
                    ? `store_id=eq.${store.id}&visible=eq.true&is_on_sale=eq.true&select=image&order=sort_order.asc.nullslast,created_at.desc&limit=1`
                    : `store_id=eq.${store.id}&category_id=eq.${matchedCat.id}&visible=eq.true&select=image&order=sort_order.asc.nullslast,created_at.desc&limit=1`;

                const catProdRes = await fetch(`${SUPABASE_URL}/rest/v1/products?${prodFilter}`, {
                  headers: {
                    apikey: SUPABASE_ANON_KEY,
                    "Content-Type": "application/json",
                  },
                });

                if (catProdRes && catProdRes.ok) {
                  const catProds = await catProdRes.json();
                  if (catProds && catProds.length > 0 && catProds[0]?.image) {
                    const firstImg = cleanImageUrl(catProds[0].image);
                    if (firstImg) {
                      image = firstImg;
                    }
                  }
                }
              }
            }
          } catch (catErr) {
            console.warn(`[SEO Middleware] Error inesperado en categoría ${targetCategoryParam}:`, catErr);
          }
        }
      }
    } else {
      const code = storeRes ? storeRes.status : "NETWORK_ERROR";
      console.error(`[SEO Middleware] Error final al obtener metadatos para ${slug} (status: ${code}). Usando metadatos por defecto.`);
    }
  } catch (err) {
    console.error("[SEO Middleware] Error inesperado procesando metadatos:", err);
  }

  const escTitle = escapeHtmlAttr(title);
  const escDescription = escapeHtmlAttr(description);
  const escImage = escapeHtmlAttr(image);
  const escCanonical = escapeHtmlAttr(canonicalUrl);

  try {
    // Read compiled dist/index.html or root index.html
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
      // Inject dynamic Open Graph & Twitter Card tags
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
      if (typeof res.status === "function") {
        const s = res.status(200);
        if (s && typeof s.send === "function") {
          return s.send(html);
        }
      }
      res.statusCode = 200;
      return res.end(html);
    }
  } catch (err: any) {
    console.error("[SEO Middleware] Error serving HTML:", err);
  }

  // Fallback: If anything fails, redirect to home
  if (typeof res.redirect === "function") {
    return res.redirect("/");
  }
  if (typeof res.writeHead === "function") {
    res.writeHead(302, { Location: "/" });
  }
  return res.end();
}
