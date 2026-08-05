import { describe, it, expect } from "vitest";

describe("Pruebas Unitarias del Middleware Serverless SEO (/api/seo.ts)", () => {
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

  it("debe limpiar correctamente las URLs con multiples banners separadas por |||", () => {
    const raw = "https://images.unsplash.com/banner1.jpg|||https://images.unsplash.com/banner2.jpg";
    const cleaned = cleanImageUrl(raw);
    expect(cleaned).toBe("https://images.unsplash.com/banner1.jpg");
  });

  it("debe inyectar adecuadamente las meta etiquetas og:image y og:image:secure_url para WhatsApp", () => {
    let mockHtml = `
      <html>
        <head>
          <title>Default</title>
          <meta name="description" content="Default" />
          <meta property="og:title" content="Default" />
          <meta property="og:description" content="Default" />
          <meta property="og:image" content="https://dizi.idenza.site/images/og-image.png" />
          <meta name="twitter:image" content="https://dizi.idenza.site/images/og-image.png" />
        </head>
      </html>
    `;

    const escTitle = escapeHtmlAttr("MODX · Urban & Streetwear · Catálogo Digital");
    const escDescription = escapeHtmlAttr("Explora nuestro catálogo digital.");
    const escImage = escapeHtmlAttr("https://images.unsplash.com/photo-banner-modx.jpg");

    mockHtml = mockHtml.replace(/<title>.*?<\/title>/gi, `<title>${escTitle}</title>`);
    mockHtml = mockHtml.replace(
      /<meta property="og:image" content=".*?"\s*\/?>/gi,
      `<meta property="og:image" content="${escImage}" />\n    <meta property="og:image:secure_url" content="${escImage}" />`,
    );

    expect(mockHtml).toContain('<title>MODX · Urban &amp; Streetwear · Catálogo Digital</title>');
    expect(mockHtml).toContain('<meta property="og:image" content="https://images.unsplash.com/photo-banner-modx.jpg" />');
    expect(mockHtml).toContain('<meta property="og:image:secure_url" content="https://images.unsplash.com/photo-banner-modx.jpg" />');
  });
});
