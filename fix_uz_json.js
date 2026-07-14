const fs = require('fs');
const path = require('path');

function fixText(text) {
  if (typeof text !== 'string') return text;
  // Replace standard apostrophe, backtick, left single quote, right single quote
  // ONLY when following or preceding O/o/G/g for Uzbek letters.
  // Actually, O' and G' are letters.
  // Let's replace:
  // o', o`, o‘, o’ -> oʻ
  // O', O`, O‘, O’ -> Oʻ
  // g', g`, g‘, g’ -> gʻ
  // G', G`, G‘, G’ -> Gʻ
  
  return text
    .replace(/o['`‘’]/g, 'oʻ')
    .replace(/O['`‘’]/g, 'Oʻ')
    .replace(/g['`‘’]/g, 'gʻ')
    .replace(/G['`‘’]/g, 'Gʻ');
}

function traverse(obj) {
  if (typeof obj === 'string') {
    return fixText(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(traverse);
  }
  if (obj && typeof obj === 'object') {
    const newObj = {};
    for (const key of Object.keys(obj)) {
      newObj[key] = traverse(obj[key]);
    }
    return newObj;
  }
  return obj;
}

const uzPath = path.join(__dirname, 'messages', 'uz.json');
if (fs.existsSync(uzPath)) {
  const data = JSON.parse(fs.readFileSync(uzPath, 'utf8'));
  const fixed = traverse(data);
  fs.writeFileSync(uzPath, JSON.stringify(fixed, null, 2) + '\n');
  console.log('Fixed messages/uz.json');
} else {
  console.log('messages/uz.json not found');
}
