import fs from 'fs';

const html = fs.readFileSync('C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/c89fe2a7-b2c9-4448-9cc7-0e62cdb736c3/scratch/wa_catalog_c.html', 'utf8');

console.log("Length of HTML:", html.length);

const keywords = ["mariell", "genly", "corazón", "corazon", "flor", "carissa"];
for (const kw of keywords) {
  const count = (html.toLowerCase().split(kw).length - 1);
  console.log(`Keyword '${kw}' found: ${count} times`);
}

// Let's print out all matches of any string that looks like a JSON string in script tags
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let i = 0;
while ((match = scriptRegex.exec(html)) !== null) {
  i++;
  const code = match[1];
  if (code.includes('wmilla7428')) {
    console.log(`Script #${i} has wmilla7428. Length: ${code.length}`);
    fs.writeFileSync(`C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/c89fe2a7-b2c9-4448-9cc7-0e62cdb736c3/scratch/wmilla_script_${i}.txt`, code);
  }
}
