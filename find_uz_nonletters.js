const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(__dirname);
let matches = [];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Find oʻ or gʻ followed by space, punctuation, etc. BUT NOT followed by a quote to avoid matching "pendingʻ"
    // Wait, if it's "pendingʻ", the quote IS the quote we are checking, so what follows the quote is e.g. a comma or parenthesis.
    // We want to avoid things like 'pendingʻ or 'longʻ. So the preceding character MUST NOT be an English word character if it's gʻ.
    // Actually, only sogʻ, bogʻ, togʻ end in gʻ. oʻ is a letter itself, usually at the beginning or middle, rarely at the end (ma'no, a'lo, etc., but those are a'). 
    // Is there any Uzbek word ending in oʻ? No.
    // Uzbek words ending in gʻ: sogʻ, bogʻ, togʻ, tugʻ, yugʻ, dogʻ, zogʻ, chogʻ
    const match = line.match(/(sog|bog|tog|tug|yug|dog|zog|chog)['`‘’]/i);
    if (match) {
      matches.push(`${file.replace(__dirname, '')}:${i+1}: ${line.trim()}`);
    }
  }
}
fs.writeFileSync('uzbek_nonletters.txt', matches.join('\n'));
console.log('Matches found:', matches.length);
