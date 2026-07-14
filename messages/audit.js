const fs = require('fs');
const path = require('path');

const en = require('./en.json');
const ru = require('./ru.json');
const uz = require('./uz.json');
const uzCyrl = require('./uz-cyrl.json');

const flatObj = (obj, prefix = '') => {
  let result = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      Object.assign(result, flatObj(value, newKey));
    } else {
      result[newKey] = value;
    }
  }
  return result;
};

const enFlat = flatObj(en);
const ruFlat = flatObj(ru);
const uzFlat = flatObj(uz);
const uzCyrlFlat = flatObj(uzCyrl);

const unflatten = (flat) => {
  const result = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
};

// Fix mechanical transliteration in Cyrillic
const fixCyrillic = (str) => {
  if (typeof str !== 'string') return str;
  // Common Latin -> Cyrillic replacements if left out
  // But wait! We need to handle specific Uzbek cyrillic
  let res = str;
  
  // They might have used "йа" instead of "я"
  res = res.replace(/йа/g, 'я').replace(/Йа/g, 'Я').replace(/ЙА/g, 'Я');
  res = res.replace(/йў/g, 'йў'); // wait, йў is valid sometimes? No, yoʻq -> йўқ
  // Wait, let's just log what seems wrong first.
  
  // mechanical cyrillic combinations
  res = res.replace(/йу/g, 'ю').replace(/Йу/g, 'Ю').replace(/ЙУ/g, 'Ю');
  res = res.replace(/йе/g, 'е').replace(/Йе/g, 'Е').replace(/ЙЕ/g, 'Е');
  res = res.replace(/йо/g, 'ё').replace(/Йо/g, 'Ё').replace(/ЙО/g, 'Ё');
  // Also fix oʻ -> ў, gʻ -> ғ in cyrillic? If any exist.
  res = res.replace(/o'/g, 'ў').replace(/O'/g, 'Ў');
  res = res.replace(/g'/g, 'ғ').replace(/G'/g, 'Ғ');
  res = res.replace(/sh/g, 'ш').replace(/Sh/g, 'Ш').replace(/SH/g, 'Ш');
  res = res.replace(/ch/g, 'ч').replace(/Ch/g, 'Ч').replace(/CH/g, 'Ч');
  res = res.replace(/ya/g, 'я').replace(/Ya/g, 'Я');
  res = res.replace(/yu/g, 'ю').replace(/Yu/g, 'Ю');
  res = res.replace(/yo/g, 'ё').replace(/Yo/g, 'Ё');

  return res;
};

// Check and fix all
let missingUz = 0;
let missingUzCyrl = 0;
let missingRu = 0;

for (const key of Object.keys(enFlat)) {
  if (!ruFlat[key] || ruFlat[key] === enFlat[key]) {
    missingRu++;
    // If it's a known exception, skip
  }
  if (!uzFlat[key] || uzFlat[key] === enFlat[key]) {
    missingUz++;
  }
  if (!uzCyrlFlat[key] || uzCyrlFlat[key] === enFlat[key]) {
    missingUzCyrl++;
  }
  
  // Fix cyrillic
  if (uzCyrlFlat[key]) {
    uzCyrlFlat[key] = fixCyrillic(uzCyrlFlat[key]);
  }
}

fs.writeFileSync('./audit_results.json', JSON.stringify({
  missingRu,
  missingUz,
  missingUzCyrl,
  total: Object.keys(enFlat).length
}, null, 2));

// write back fixed Cyrillic for inspection
fs.writeFileSync('./uz-cyrl-fixed.json', JSON.stringify(unflatten(uzCyrlFlat), null, 2));

console.log("Audit complete.");
