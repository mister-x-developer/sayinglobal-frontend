const fs = require('fs');
const path = require('path');
const p = path.resolve('/home/lochinbek/Desktop/sayinglobal/frontend/lib/api/client.ts');
let code = fs.readFileSync(p, 'utf8');

// Replace the first reload block
code = code.replace(/if \(!isPublic[^\}]+\{\s*window\.location\.href\s*=\s*`\/auth[^`]+`\s*;\s*\}\s*else\s*\{\s*window\.location\.reload\(\);\s*\}/, `if (!isPublic && !pathname.startsWith('/auth')) {
            window.location.href = \`/auth?next=\${encodeURIComponent(pathname)}\`;
          }`);

// Replace the second reload block
code = code.replace(/if \(!isPublic[^\}]+\{\s*window\.location\.href\s*=\s*`\/auth[^`]+`\s*;\s*\}\s*else\s*\{\s*\/\/[^\n]+\n\s*window\.location\.reload\(\);\s*\}/, `if (!isPublic && !pathname.startsWith('/auth')) {
          window.location.href = \`/auth?next=\${encodeURIComponent(pathname)}\`;
        }`);

fs.writeFileSync(p, code);
console.log('Patched client.ts to remove reload');
