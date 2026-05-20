#!/usr/bin/env node
/**
 * Remove client-side `if (hydrated && !isAuthenticated) router.replace('/auth')`
 * patterns from individual pages. The middleware already enforces auth, and
 * the page-level redirect introduces a hydration race that produces the
 * "Redirecting…" freeze users hit after a successful OTP login.
 *
 * Strategy:
 *   - Replace the `useEffect(() => setHydrated(true), []);` line with a no-op.
 *   - Replace the redirect-on-unauth useEffect block with a no-op comment.
 *   - Leave `hydrated` unused — TS will warn but won't fail; we keep the
 *     identifier so any UI that branches on `hydrated` still compiles.
 *
 * Run: node scripts/strip_auth_redirect.js
 */
const fs = require('fs');
const path = require('path');

const FILES = [
  'app/sellers/following/page.tsx',
  'app/listings/my/page.tsx',
  'app/chat/page.tsx',
  'app/profile/favorites/page.tsx',
  'app/profile/reports/page.tsx',
  'app/profile/page.tsx',
  'app/profile/security/page.tsx',
  'app/notifications/page.tsx',
];

const ROOT = path.join(__dirname, '..');

const REDIRECT_PATTERNS = [
  /useEffect\(\(\) => \{\s*if \(hydrated && !isAuthenticated\) router\.replace\('\/auth'\);\s*\}, \[hydrated, isAuthenticated, router\]\);/g,
  /useEffect\(\(\) => \{\s*if \(hydrated && !isAuthenticated\)\s*\{\s*router\.replace\('\/auth'\);\s*\}\s*\}, \[hydrated, isAuthenticated, router\]\);/g,
];

let touched = 0;
for (const rel of FILES) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) continue;
  let src = fs.readFileSync(file, 'utf-8');
  let changed = false;
  for (const re of REDIRECT_PATTERNS) {
    if (re.test(src)) {
      src = src.replace(re, '/* auth gating handled by middleware */');
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(file, src);
    console.log(`stripped: ${rel}`);
    touched++;
  } else {
    console.log(`no match: ${rel}`);
  }
}
console.log(`Done. ${touched} file(s) touched.`);
