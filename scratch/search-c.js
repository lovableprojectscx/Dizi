import fs from 'fs';

const html = fs.readFileSync('C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/c89fe2a7-b2c9-4448-9cc7-0e62cdb736c3/scratch/wa_catalog_c.html', 'utf8');

const index = html.indexOf("wmilla");
if (index !== -1) {
  console.log("Context around wmilla:");
  console.log(html.substring(Math.max(0, index - 200), Math.min(html.length, index + 800)));
} else {
  console.log("wmilla not found");
}
