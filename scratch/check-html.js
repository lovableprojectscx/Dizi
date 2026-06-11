import fs from 'fs';

const html = fs.readFileSync('C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/c89fe2a7-b2c9-4448-9cc7-0e62cdb736c3/scratch/wa_catalog_codetabs.html', 'utf8');

console.log("HTML length:", html.length);
console.log("Contains 'Florería carissa'?", html.includes("Florería carissa"));
console.log("Contains 'Mariell'?", html.includes("Mariell"));
console.log("Contains 'Corazón'?", html.includes("Corazón"));
console.log("Contains 'something went wrong'?", html.includes("something went wrong"));
console.log("Contains 'facebook.com/images/logos'?", html.includes("facebook.com/images/logos"));
console.log("Contains 'S/'?", html.includes("S/"));
console.log("Contains 'price'?", html.includes("price"));

// Let's find script tags that might contain JSON hydration state
const matches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
console.log("Number of script tags:", matches ? matches.length : 0);
if (matches) {
  let jsonCount = 0;
  for (const m of matches) {
    if (m.includes('props') || m.includes('payload') || m.includes('catalog') || m.includes('products')) {
      jsonCount++;
      if (jsonCount <= 3) {
        console.log(`Script match ${jsonCount} length:`, m.length);
        fs.writeFileSync(`C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/c89fe2a7-b2c9-4448-9cc7-0e62cdb736c3/scratch/script_${jsonCount}.txt`, m);
      }
    }
  }
  console.log(`Found ${jsonCount} scripts with promising content`);
}
