import fs from 'fs';

const html = fs.readFileSync('C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/c89fe2a7-b2c9-4448-9cc7-0e62cdb736c3/scratch/wa_catalog_codetabs.html', 'utf8');

// Find all script tags
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = scriptRegex.exec(html)) !== null) {
  const code = match[1];
  count++;
  // Look for product names or JSON structures
  if (code.includes('"price"') || code.includes('"products"') || code.includes('"catalog"') || code.includes('image_url')) {
    console.log(`Script #${count} has product keywords. Length: ${code.length}`);
    // Check if it has JSON-like content
    const index = code.indexOf('{"');
    if (index !== -1) {
      console.log(`Script #${count} contains JSON starting at ${index}`);
    }
  }
}

// Let's also look for fbcdn.net image links
const imgRegex = /https:\/\/scontent[^"\']+\.jpg[^"\']*/g;
const imgs = html.match(imgRegex) || [];
console.log("Found fbcdn image URLs:", imgs.length);
if (imgs.length > 0) {
  console.log("First 3 image URLs:");
  console.log(imgs.slice(0, 3).map(u => u.replace(/&amp;/g, '&')));
}

// Let's search for "price" or "amount" or "currency"
const matches = html.match(/"price"|"amount"|"currency"/gi);
console.log("Occurrences of price/amount/currency:", matches ? matches.length : 0);
