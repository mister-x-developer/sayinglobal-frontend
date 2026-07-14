const fs = require('fs');
const path = require('path');
const p1 = path.resolve('/home/lochinbek/Desktop/sayinglobal/frontend/components/providers/ClientAuthGuard.tsx');
const p2 = path.resolve('/home/lochinbek/Desktop/sayinglobal/frontend/middleware.ts');

let code1 = fs.readFileSync(p1, 'utf8');
code1 = code1.split("pathname === '/index.html'").join("pathname === '/index.html' || pathname === '/index'");
fs.writeFileSync(p1, code1);

let code2 = fs.readFileSync(p2, 'utf8');
code2 = code2.split("pathname === '/index.html'").join("pathname === '/index.html' || pathname === '/index'");
code2 = code2.split("if (pathname === '/')").join("if (pathname === '/' || pathname === '/index.html' || pathname === '/index')");
fs.writeFileSync(p2, code2);

console.log('Patched index.html');
