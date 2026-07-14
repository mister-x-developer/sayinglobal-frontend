const fs = require('fs');
const path = require('path');
const p = path.resolve('/home/lochinbek/Desktop/sayinglobal/frontend/middleware.ts');
let code = fs.readFileSync(p, 'utf8');

const oldCode = `  // Admins are allowed to stay on the landing page if they want.
  if ((pathname.startsWith('/auth') || (pathname === '/' && !isPlatformAdmin(req))) && isAuthenticated(req)) {
    const nextUrl = req.nextUrl.clone();
    const target = isPlatformAdmin(req)
      ? '/admin'
      : (req.nextUrl.searchParams.get('next') || '/dashboard');`;

const newCode = `  if ((pathname.startsWith('/auth') || pathname === '/') && isAuthenticated(req)) {
    const nextUrl = req.nextUrl.clone();
    const target = isPlatformAdmin(req)
      ? '/admin'
      : (req.nextUrl.searchParams.get('next') || '/dashboard');`;

code = code.split(oldCode).join(newCode);
fs.writeFileSync(p, code);
console.log('Patched middleware');
