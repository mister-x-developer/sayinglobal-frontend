const fs = require('fs');
const path = require('path');
const p = path.resolve('/home/lochinbek/Desktop/sayinglobal/frontend/components/providers/ClientAuthGuard.tsx');
let code = fs.readFileSync(p, 'utf8');

const oldCode = `    // Native apps do not use the landing page. Redirect unauthenticated users directly to /auth.
    if ((pathname === '/' || pathname === '/index.html') && Capacitor.isNativePlatform() && !isAuthenticated) {
      router.replace('/auth');
      return;
    }`;

code = code.split(oldCode).join('');
fs.writeFileSync(p, code);
console.log('Patched ClientAuthGuard');
