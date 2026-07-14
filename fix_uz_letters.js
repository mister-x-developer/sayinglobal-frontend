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
let count = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const orig = content;
  
  content = content.replace(/([oOgG])['`‘’]([a-zA-Z])/g, '$1ʻ$2');
  
  if (orig !== content) {
    fs.writeFileSync(file, content);
    count++;
    console.log('Fixed', file);
  }
}
console.log('Total files fixed:', count);
