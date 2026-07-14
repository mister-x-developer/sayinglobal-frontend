const fs = require('fs');
const path = require('path');
const p = path.resolve('/home/lochinbek/Desktop/sayinglobal/frontend/lib/utils/format.ts');
let code = fs.readFileSync(p, 'utf8');

code = code.replace(/so[ʼ'`‘]m/g, 'soʻm');
fs.writeFileSync(p, code);
console.log('Patched format.ts');
