import fs from 'fs';

const html = fs.readFileSync('C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/c89fe2a7-b2c9-4448-9cc7-0e62cdb736c3/scratch/wa_catalog_noscript.html', 'utf8');

const index = html.indexOf("51943968151");
if (index !== -1) {
  console.log("Context around 51943968151:");
  console.log(html.substring(Math.max(0, index - 200), Math.min(html.length, index + 800)));
}
