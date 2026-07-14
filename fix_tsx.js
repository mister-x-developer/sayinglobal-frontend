const fs = require('fs');
const path = require('path');
const glob = require('glob');

const tsxFiles = glob.sync('**/*.{ts,tsx}', { cwd: __dirname, ignore: ['node_modules/**', '.next/**'] });

let count = 0;
for (const file of tsxFiles) {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Only replace " soʻm", ' so\'m', ` soʻm` etc. Also "oʻ", "gʻ" if they are inside words in JSX text or strings.
  // It's safer to just replace "soʻm" and "soʻm" and "soʻm" -> "soʻm" first, since that's the most common one.
  const orig = content;
  
  // Replace " soʻm", " soʻm" -> " soʻm"
  content = content.replace(/so['`‘’]m/g, 'soʻm');
  
  // Replace Yo'q, yo'q, qo'shish, ko'p, ro'yxat etc by looking for specific words if needed,
  // but replacing oʻ and gʻ universally in TSX is risky.
  // Let's replace "yoʻq", "boʻyicha", "toʻliq", "koʻrish", "joʻnatish" etc.
  // Actually, let's use a regex that matches oʻ or gʻ followed by a lowercase letter (which means it's part of a word).
  // Wait! A string could be: const name = "joʻnatish";
  // If it's `gʻ` at the end of a word like `bogʻ`, it's followed by a space or quote.
  // Instead of a dangerous regex, let's look for common words or just do a manual search for 'o\'' and 'g\''
  
  if (orig !== content) {
    fs.writeFileSync(filePath, content);
    count++;
    console.log('Fixed', file);
  }
}
console.log('Total files fixed:', count);
