async function run() {
  const targetUrl = 'https://wa.me/c/51943968151';
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
  
  try {
    const res = await fetch(proxyUrl);
    console.log("Response status:", res.status);
    const text = await res.text();
    console.log("Response text start:", text.substring(0, 1000));
    const fs = require('fs');
    fs.writeFileSync('C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/c89fe2a7-b2c9-4448-9cc7-0e62cdb736c3/scratch/wa_catalog_corsproxy.html', text);
  } catch (err) {
    console.error("Error fetching:", err);
  }
}

run();
