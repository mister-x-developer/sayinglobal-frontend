const fs = require('fs');
const path = require('path');
const p = path.resolve('/home/lochinbek/Desktop/sayinglobal/frontend/components/providers/ClientAuthGuard.tsx');
let code = fs.readFileSync(p, 'utf8');

const oldCode = `  // Native apps do not have a landing page; unauthenticated users should see Auth page.
  // Returning null here prevents the LandingPage HTML from flashing before redirecting.
  if (hasHydrated && Capacitor.isNativePlatform() && (pathname === '/' || pathname === '/index.html') && !isAuthenticated) {
    return null;
  }`;

code = code.split(oldCode).join('');
fs.writeFileSync(p, code);
console.log('Patched ClientAuthGuard again');
