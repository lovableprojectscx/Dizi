import fs from 'fs';

const html = fs.readFileSync('C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/c89fe2a7-b2c9-4448-9cc7-0e62cdb736c3/scratch/wa_catalog_mobile_direct.html', 'utf8');

console.log("Contains 'wmilla'?", html.includes("wmilla"));
console.log("Contains '51943968151'?", html.includes("51943968151"));

// Let's print out lines that contain "fbcdn" or images
const matches = html.match(/https:\/\/[^"\']+\.jpg[^"\']*/g) || [];
console.log("Number of image URLs:", matches.length);
if (matches.length > 0) {
  console.log("First 5 image URLs:");
  console.log(matches.slice(0, 5));
}
