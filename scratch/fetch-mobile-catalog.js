import fs from 'fs';

async function run() {
  const targetUrl = 'https://wa.me/c/51943968151';
  const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${targetUrl}`;
  
  try {
    const res = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9'
      }
    });
    console.log("Response status:", res.status);
    const text = await res.text();
    console.log("Response text length:", text.length);
    fs.writeFileSync('C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/c89fe2a7-b2c9-4448-9cc7-0e62cdb736c3/scratch/wa_catalog_mobile.html', text);
    
    // Check if we can find typical product keywords or redirect
    console.log("Contains 'Mariell'?", text.includes("Mariell"));
    console.log("Contains 'Genly'?", text.includes("Genly"));
    console.log("Contains 'Corazón'?", text.includes("Corazón"));
    console.log("Contains 'Florería'?", text.includes("Florería"));
    console.log("Contains 'carissa'?", text.includes("carissa"));
    
    const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
    console.log("Title of page:", titleMatch ? titleMatch[1] : "No title");
  } catch (err) {
    console.error("Error fetching:", err);
  }
}

run();
