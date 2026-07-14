const fs = require('fs');
const path = require('path');
const glob = require('glob');

const tsxFiles = glob.sync('**/*.{ts,tsx}', { cwd: __dirname, ignore: ['node_modules/**', '.next/**'] });

let count = 0;
for (const file of tsxFiles) {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Only replace " so'm", ' so\'m', ` so'm` etc. Also "o'", "g'" if they are inside words in JSX text or strings.
  // It's safer to just replace "so'm" and "so`m" and "so‘m" -> "soʻm" first, since that's the most common one.
  const orig = content;
  
  // Replace " so'm", " so`m" -> " soʻm"
  content = content.replace(/so['`‘’]m/g, 'soʻm');
  
  // Replace Yo'q, yo'q, qo'shish, ko'p, ro'yxat etc by looking for specific words if needed,
  // but replacing o' and g' universally in TSX is risky.
  // Let's replace "yo'q", "bo'yicha", "to'liq", "ko'rish", "jo'natish" etc.
  // Actually, let's use a regex that matches o' or g' followed by a lowercase letter (which means it's part of a word).
  // Wait! A string could be: const name = "jo'natish";
  // If it's `g'` at the end of a word like `bog'`, it's followed by a space or quote.
  // Instead of a dangerous regex, let's look for common words or just do a manual search for 'o\'' and 'g\''
  
  if (orig !== content) {
    fs.writeFileSync(filePath, content);
    count++;
    console.log('Fixed', file);
  }
}
console.log('Total files fixed:', count);
