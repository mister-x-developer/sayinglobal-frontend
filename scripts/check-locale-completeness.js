#!/usr/bin/env node
/**
 * Locale completeness check (auth-otp-banking-grade bugfix, Task 2).
 *
 * Statically scans `frontend/app/auth/page.tsx` for every translation key
 * referenced as t('auth.X') / t("auth.X"), then asserts that each key
 * exists and is non-empty in EVERY locale dictionary under
 * `frontend/messages/{locale}.json`.
 *
 * Behaviour on unfixed code: the bugfix.md notes that some auth.* keys
 * are missing from at least one locale, so this script is EXPECTED to
 * report failures right now. Task 3.6 (translations) is what makes it
 * pass. This task (Task 2) only requires the script to EXIST and RUN.
 *
 * Exit code 0 = all keys present in all locales, non-zero otherwise.
 *
 * Run with: `npm run check:locales` (added in package.json).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const AUTH_SCREEN = path.join(ROOT, 'app', 'auth', 'page.tsx');
const MESSAGES_DIR = path.join(ROOT, 'messages');
const LOCALES = ['uz', 'uz-cyrl', 'ru', 'en'];
const NAMESPACE = 'auth';

// ── 1. Scan the auth screen source for every t('auth.X') reference ────────

function extractAuthKeys(source) {
  const keys = new Set();
  // Match t('auth.foo') and t("auth.foo"). Allow alphanumerics + dot in the
  // tail; the auth screen uses single-segment keys (e.g. auth.resendCode)
  // so we keep the regex pragmatic.
  const re = /\bt\(\s*['"]auth\.([A-Za-z0-9_]+)['"]/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    keys.add(m[1]);
  }
  return keys;
}

// ── 2. Resolve a dotted key inside a parsed JSON locale dictionary ────────

function getDeep(obj, parts) {
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
}

// ── 3. Run ────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(AUTH_SCREEN)) {
    console.error(`error: auth screen not found at ${AUTH_SCREEN}`);
    process.exit(2);
  }

  const source = fs.readFileSync(AUTH_SCREEN, 'utf8');
  const keys = Array.from(extractAuthKeys(source)).sort();

  if (keys.length === 0) {
    console.error(
      `error: no t('${NAMESPACE}.*') references found in ${AUTH_SCREEN}; ` +
      `regex may be wrong`,
    );
    process.exit(2);
  }

  // Load each locale dictionary.
  const locales = {};
  for (const loc of LOCALES) {
    const p = path.join(MESSAGES_DIR, `${loc}.json`);
    if (!fs.existsSync(p)) {
      console.error(`error: locale file missing: ${p}`);
      process.exit(2);
    }
    try {
      locales[loc] = JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (err) {
      console.error(`error: failed to parse ${p}: ${err.message}`);
      process.exit(2);
    }
  }

  // Cross-check every key in every locale.
  const missing = [];
  for (const key of keys) {
    for (const loc of LOCALES) {
      const value = getDeep(locales[loc], [NAMESPACE, key]);
      if (typeof value !== 'string' || value.trim() === '') {
        missing.push({ locale: loc, key: `${NAMESPACE}.${key}` });
      }
    }
  }

  const totalAssertions = keys.length * LOCALES.length;
  const k = missing.length;

  console.log(
    `[check-locales/frontend] scanned ${path.relative(ROOT, AUTH_SCREEN)}: ` +
    `${keys.length} keys × ${LOCALES.length} locales = ${totalAssertions} ` +
    `assertions, ${k} missing`,
  );
  console.log(`[check-locales/frontend] keys: ${keys.join(', ')}`);

  if (k > 0) {
    console.error('');
    console.error('Missing or empty keys:');
    for (const m of missing) {
      console.error(`  ${m.locale}.json missing key ${m.key}`);
    }
    process.exit(1);
  }

  console.log('[check-locales/frontend] OK — all keys present in all locales.');
  process.exit(0);
}

main();
