function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

export default async function handler(req: any, res: any) {
  // Allow CORS from local development
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Falta la URL de la página de Facebook." });
  }

  try {
    let cleanUrl = url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const urlObj = new URL(cleanUrl);
    if (!urlObj.hostname.includes("facebook.com")) {
      return res
        .status(400)
        .json({ error: "El enlace debe ser de una página de Facebook válida (facebook.com)." });
    }

    console.log("[scrape-fb] Fetching Facebook HTML for URL:", cleanUrl);
    const fbRes = await fetch(cleanUrl, {
      headers: {
        "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_patched.php)",
        "Accept-Language": "es-ES,es;q=0.9",
      },
    });

    if (!fbRes.ok) {
      console.error("[scrape-fb] FB response not ok:", fbRes.status);
      return res.status(400).json({
        error:
          "No se pudo acceder a la página de Facebook. Asegúrate de que la página sea pública.",
      });
    }

    const html = await fbRes.text();

    // Extract title (og:title)
    const ogTitleMatch =
      html.match(/property="og:title"\s+content="([^"]+)"/) ||
      html.match(/content="([^"]+)"\s+property="og:title"/);
    let title = ogTitleMatch ? ogTitleMatch[1] : "";

    // Clean up title (remove | Facebook, etc.)
    if (title) {
      title = decodeHtmlEntities(title);
      title = title
        .replace(/\s*\|\s*Facebook\s*/gi, "")
        .replace(/\s*-\s*Home\s*/gi, "")
        .trim();
    } else {
      title = "Mi Tienda";
    }

    // Extract image (og:image)
    const ogImageMatch =
      html.match(/property="og:image"\s+content="([^"]+)"/) ||
      html.match(/content="([^"]+)"\s+property="og:image"/) ||
      html.match(/meta\s+property="og:image"\s+content="([^"]+)"/) ||
      html.match(/meta\s+content="([^"]+)"\s+property="og:image"/);

    if (!ogImageMatch) {
      console.warn("[scrape-fb] og:image not found in FB HTML");
      return res.status(404).json({
        error:
          "No se pudo extraer la foto de perfil. Asegúrate de que el enlace sea correcto y la página sea pública.",
      });
    }

    // Decode entities (replace &amp; with &)
    const rawImageUrl = ogImageMatch[1];
    const imageUrl = rawImageUrl.replace(/&amp;/g, "&");

    console.log("[scrape-fb] Fetching image bytes from CDN...");
    const imgRes = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!imgRes.ok) {
      console.error("[scrape-fb] CDN image fetch failed:", imgRes.status);
      return res
        .status(400)
        .json({ error: "No se pudo descargar la foto de perfil desde Facebook." });
    }

    const buffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mime = imgRes.headers.get("content-type") || "image/png";
    const dataUrl = `data:${mime};base64,${base64}`;

    console.log("[scrape-fb] Scrape completed successfully for:", title);
    return res.status(200).json({
      name: title,
      logo: dataUrl,
    });
  } catch (err: any) {
    console.error("[scrape-fb] Error:", err);
    return res.status(500).json({ error: `Error interno al procesar la página: ${err.message}` });
  }
}
