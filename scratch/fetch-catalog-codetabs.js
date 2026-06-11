import fs from 'fs';

async function run() {
  const targetUrl = 'https://whatsapp.com/catalog/51943968151/';
  const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${targetUrl}`;
  
  try {
    const res = await fetch(proxyUrl);
    console.log("Response status:", res.status);
    const text = await res.text();
    console.log("Response text length:", text.length);
    fs.writeFileSync('C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/c89fe2a7-b2c9-4448-9cc7-0e62cdb736c3/scratch/whatsapp_com_catalog.html', text);
    
    // Check if we can find typical product keywords
    console.log("Contains 'price'?", text.includes("price"));
    console.log("Contains 'currency'?", text.includes("currency"));
    console.log("Contains 'amount'?", text.includes("amount"));
    console.log("Contains 'Mariell'?", text.includes("Mariell"));
    
    const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
    console.log("Title of page:", titleMatch ? titleMatch[1] : "No title");
  } catch (err) {
    console.error("Error fetching:", err);
  }
}

run();
