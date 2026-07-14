const fs = require('fs');
const path = require('path');
const p = path.resolve('/home/lochinbek/Desktop/sayinglobal/frontend/lib/api/client.ts');
let code = fs.readFileSync(p, 'utf8');

const oldCode = `          const isPublic = pathname === '/' || pathname === '/index.html' || pathname === '/index' || 
                           pathname.startsWith('/discovery') || pathname.startsWith('/search') || 
                           (pathname.startsWith('/listings') && !pathname.startsWith('/listings/my') && !pathname.startsWith('/listings/new') && !pathname.includes('/edit')) ||
                           (pathname.startsWith('/sellers') && !pathname.startsWith('/sellers/followingʻ));`;

const newCode = `          const isPublic = pathname === '/' || pathname === '/index.html' || pathname === '/index' || pathname.startsWith('/auth') || pathname === '/terms' || pathname === '/privacy';`;

code = code.split(oldCode).join(newCode);
fs.writeFileSync(p, code);
console.log('Patched');
