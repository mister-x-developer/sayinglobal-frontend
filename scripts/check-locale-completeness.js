#!/usr/bin/env node
/**
 * Locale completeness & parity gate (WS-D, Property 7).
 *
 * Implements the executable gate behind Requirements 6.2, 6.3, 6.7:
 *
 *   1. Statically scan the whole `app/` and `components/` trees (.tsx/.ts)
 *      for every translation key referenced via next-intl:
 *        - `useTranslations()`        + t('namespace.key')   (full-dotted)
 *        - `useTranslations('ns')`    + t('key')             (namespace scope)
 *        - `getTranslations()` / `getTranslations('ns')` (server)
 *      Comments are stripped (string/template aware) before extraction so a
 *      commented-out call or a doc example like `t('categories.{slug}')` never
 *      contributes a phantom key. Keys built from template strings / variables
 *      (e.g. t(`a.${x}`)) cannot be resolved statically — they are collected and
 *      reported as warnings, never as failures, and never crash the scan. A
 *      resolved literal is only treated as a real key when every dotted segment
 *      matches a translation-key shape ([A-Za-z0-9_$-]); anything else (e.g. a
 *      leftover `{...}` placeholder) is reported as a dynamic site, not a key.
 *
 *   2. COMPLETENESS (R6.2): every statically-used key must have a NON-EMPTY
 *      value in all 4 locale files. A value counts as empty when it is absent,
 *      not a string, or contains only whitespace (>= 1 visible char required).
 *
 *   3. PARITY (R6.3): the 4 locale files must share an identical leaf-key set —
 *      no orphan keys present in some files but missing from others.
 *
 * On ANY completeness or parity failure the script prints the offending
 * key+locale pairs and exits 1. On success it exits 0. Structural problems
 * (missing/malformed locale file, no scannable source) exit 2.
 *
 * Run with: `npm run check:locales`.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCAN_DIRS = [path.join(ROOT, 'app'), path.join(ROOT, 'components')];
const SCAN_EXTENSIONS = ['.tsx', '.ts'];
const MESSAGES_DIR = path.join(ROOT, 'messages');
const LOCALES = ['uz', 'uz-cyrl', 'ru', 'en'];

// ── File discovery ─────────────────────────────────────────────────────────

/** Recursively collect source files under `dir` matching SCAN_EXTENSIONS. */
function collectSourceFiles(dir) {
  const out = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out; // directory may not exist; caller handles emptiness
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      out.push(...collectSourceFiles(full));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      // skip declaration files and test files; keep .tsx/.ts source
      if (entry.name.endsWith('.d.ts')) continue;
      if (SCAN_EXTENSIONS.includes(ext)) out.push(full);
    }
  }
  return out;
}

// ── Comment stripping (string/template aware) ───────────────────────────────

/**
 * Remove `//` line comments and block comments from source while preserving
 * string and template literals (so a `t('a.b')` call that lives inside a
 * string is untouched, but a doc comment such as `* t('categories.{slug}')`
 * is removed). Replaces comment characters with spaces of equal length so that
 * byte offsets — and therefore the binding-vs-call ordering used later — stay
 * stable. This prevents commented-out or doc-example calls from contributing
 * phantom translation keys.
 */
function stripComments(source) {
  const out = source.split('');
  const n = source.length;
  let i = 0;
  // States: 0 normal, mutually exclusive string/comment modes below.
  while (i < n) {
    const ch = source[i];
    const next = source[i + 1];

    // Line comment.
    if (ch === '/' && next === '/') {
      while (i < n && source[i] !== '\n') {
        out[i] = ' ';
        i++;
      }
      continue;
    }
    // Block comment.
    if (ch === '/' && next === '*') {
      out[i] = ' ';
      out[i + 1] = ' ';
      i += 2;
      while (i < n && !(source[i] === '*' && source[i + 1] === '/')) {
        if (source[i] !== '\n') out[i] = ' ';
        i++;
      }
      if (i < n) {
        out[i] = ' ';
        out[i + 1] = ' ';
        i += 2;
      }
      continue;
    }
    // String / template literal — skip over its contents untouched.
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      i++; // move past the opening quote
      while (i < n) {
        const c = source[i];
        if (c === '\\') {
          i += 2; // skip escaped char
          continue;
        }
        if (c === quote) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    i++;
  }
  return out.join('');
}

// A translation-key segment: word chars plus the `$`/`-` seen in real keys.
const KEY_SEGMENT_RE = /^[A-Za-z0-9_$-]+$/;

/** True when `key` is a dotted path whose every segment looks like a real key. */
function looksLikeStaticKey(key) {
  if (key === '') return false;
  return key.split('.').every((seg) => KEY_SEGMENT_RE.test(seg));
}

// ── Key extraction ───────────────────────────────────────────────────────--

/**
 * Find every `const|let|var <name> = [await] useTranslations|getTranslations(['ns'])`
 * assignment in `source`. Returns [{ index, varName, namespace }] where namespace
 * is '' for a namespace-less hook.
 */
function findTranslatorBindings(source) {
  const bindings = [];
  const re =
    /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\s*\(\s*(?:(['"`])([^'"`]*)\2)?\s*\)/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    bindings.push({ index: m.index, varName: m[1], namespace: m[3] || '' });
  }
  return bindings;
}

/** Namespace in effect for a translator call at `callIndex` using variable `varName`. */
function namespaceForCall(bindings, varName, callIndex) {
  let chosen = '';
  let bestIndex = -1;
  for (const b of bindings) {
    if (b.varName === varName && b.index < callIndex && b.index > bestIndex) {
      bestIndex = b.index;
      chosen = b.namespace;
    }
  }
  return chosen;
}

/**
 * Extract used translation keys from one file's source.
 * Returns { staticKeys: Set<string>, dynamic: string[] }.
 * staticKeys are fully-resolved dotted keys; dynamic is a list of raw
 * (unresolvable) template-literal call snippets for reporting.
 */
function extractKeysFromSource(rawSource) {
  const staticKeys = new Set();
  const dynamic = [];

  // Strip comments first so commented-out / doc-example calls don't pollute
  // the used-key set. Offsets are preserved (comments → spaces).
  const source = stripComments(rawSource);

  const bindings = findTranslatorBindings(source);
  if (bindings.length === 0) return { staticKeys, dynamic };

  const varNames = Array.from(new Set(bindings.map((b) => b.varName)));
  // Build an alternation of translator variable names, longest first so that
  // a name like `tt` is not shadowed by `t`.
  const escaped = varNames
    .sort((a, b) => b.length - a.length)
    .map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  // Require a word boundary BEFORE the name so `dt(` / `format(` don't match `t(`.
  const callRe = new RegExp(
    `(?<![\\w$.])(${escaped.join('|')})\\s*\\(\\s*(['"\`])`,
    'g',
  );

  let m;
  while ((m = callRe.exec(source)) !== null) {
    const varName = m[1];
    const quote = m[2];
    const argStart = callRe.lastIndex; // position just after the opening quote

    // Read the literal contents up to the matching closing quote of the same
    // kind. Works for ' " and ` alike.
    const close = source.indexOf(quote, argStart);
    if (close === -1) continue; // malformed; skip gracefully
    const literal = source.slice(argStart, close);

    // Any interpolation marker means the key is built at runtime → dynamic.
    // (`${...}` in a template literal, or a stray backtick inside the literal.)
    if (quote === '`' && (literal.includes('${') || literal.includes('`'))) {
      const snippet = source.slice(m.index, Math.min(source.length, m.index + 80));
      dynamic.push(snippet.split('\n')[0]);
      continue;
    }
    if (literal.includes('${') || literal.includes('`')) {
      dynamic.push(literal);
      continue;
    }

    const ns = namespaceForCall(bindings, varName, m.index);
    const fullKey = ns ? `${ns}.${literal}` : literal;
    // A real translation key is a dotted path of key-shaped segments. Anything
    // else (e.g. a leftover `{slug}` placeholder from a doc example, or a
    // sentence) is a dynamic/unresolvable site, not a verifiable key.
    if (looksLikeStaticKey(fullKey)) {
      staticKeys.add(fullKey);
    } else if (fullKey.trim() !== '') {
      dynamic.push(literal);
    }
  }

  return { staticKeys, dynamic };
}

// ── Locale dictionary helpers ───────────────────────────────────────────────

/** Resolve a dotted key inside a parsed locale object; returns the raw value. */
function getDeep(obj, dottedKey) {
  const parts = dottedKey.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
}

/** A value is "present" when it is a string with >= 1 visible (non-whitespace) char. */
function isNonEmptyValue(value) {
  return typeof value === 'string' && value.trim() !== '';
}

/** Flatten a nested dictionary to the set of dotted LEAF paths (non-object values). */
function flattenLeafKeys(obj, prefix, out) {
  for (const k of Object.keys(obj)) {
    const value = obj[k];
    const dotted = prefix ? `${prefix}.${k}` : k;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      flattenLeafKeys(value, dotted, out);
    } else {
      out.add(dotted);
    }
  }
  return out;
}

// ── Main ─────────────────────────────────────────────────────────────────--

function main() {
  // 1. Scan source trees.
  const files = [];
  for (const dir of SCAN_DIRS) files.push(...collectSourceFiles(dir));

  if (files.length === 0) {
    console.error(
      `error: no source files found under ${SCAN_DIRS.map((d) => path.relative(ROOT, d)).join(', ')}`,
    );
    process.exit(2);
  }

  const usedKeys = new Set();
  const dynamicSnippets = new Set();
  for (const file of files) {
    let source;
    try {
      source = fs.readFileSync(file, 'utf8');
    } catch (err) {
      console.error(`warn: could not read ${path.relative(ROOT, file)}: ${err.message}`);
      continue;
    }
    const { staticKeys, dynamic } = extractKeysFromSource(source);
    for (const k of staticKeys) usedKeys.add(k);
    for (const d of dynamic) dynamicSnippets.add(d.trim());
  }

  // 2. Load locale dictionaries.
  const locales = {};
  for (const loc of LOCALES) {
    const p = path.join(MESSAGES_DIR, `${loc}.json`);
    if (!fs.existsSync(p)) {
      console.error(`error: locale file missing: ${path.relative(ROOT, p)}`);
      process.exit(2);
    }
    try {
      locales[loc] = JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (err) {
      console.error(`error: failed to parse ${path.relative(ROOT, p)}: ${err.message}`);
      process.exit(2);
    }
  }

  const usedKeyList = Array.from(usedKeys).sort();

  console.log(
    `[check-locales] scanned ${files.length} source files under app/ + components/: ` +
      `${usedKeyList.length} static keys used, ${dynamicSnippets.size} dynamic key sites`,
  );

  // 3. COMPLETENESS (R6.2): every used key non-empty in all 4 locales.
  const missingCompleteness = [];
  for (const key of usedKeyList) {
    for (const loc of LOCALES) {
      if (!isNonEmptyValue(getDeep(locales[loc], key))) {
        missingCompleteness.push({ locale: loc, key });
      }
    }
  }

  // 4. PARITY (R6.3): identical leaf-key sets across the 4 files.
  const leafSets = {};
  for (const loc of LOCALES) leafSets[loc] = flattenLeafKeys(locales[loc], '', new Set());
  const allLeafKeys = new Set();
  for (const loc of LOCALES) for (const k of leafSets[loc]) allLeafKeys.add(k);

  const parityViolations = []; // { key, presentIn:[], missingIn:[] }
  for (const key of Array.from(allLeafKeys).sort()) {
    const presentIn = LOCALES.filter((loc) => leafSets[loc].has(key));
    if (presentIn.length !== LOCALES.length) {
      parityViolations.push({
        key,
        presentIn,
        missingIn: LOCALES.filter((loc) => !leafSets[loc].has(key)),
      });
    }
  }

  // 5. Report dynamic key sites (informational; never fails the gate).
  if (dynamicSnippets.size > 0) {
    console.log('');
    console.log(
      `[check-locales] note: ${dynamicSnippets.size} dynamic translation key site(s) ` +
        `could not be statically verified (skipped):`,
    );
    for (const d of Array.from(dynamicSnippets).sort()) {
      console.log(`  ~ ${d}`);
    }
  }

  let failed = false;

  if (missingCompleteness.length > 0) {
    failed = true;
    console.error('');
    console.error(
      `FAIL (R6.2): ${missingCompleteness.length} used key/locale pair(s) missing or empty:`,
    );
    for (const m of missingCompleteness) {
      console.error(`  ${m.locale}.json missing key "${m.key}"`);
    }
  }

  if (parityViolations.length > 0) {
    failed = true;
    console.error('');
    console.error(
      `FAIL (R6.3): ${parityViolations.length} key(s) break 4-file parity (orphan keys):`,
    );
    for (const v of parityViolations) {
      console.error(
        `  "${v.key}" present in [${v.presentIn.join(', ')}] — missing in [${v.missingIn.join(', ')}]`,
      );
    }
  }

  if (failed) {
    console.error('');
    console.error(
      `[check-locales] FAILED: ${missingCompleteness.length} completeness + ` +
        `${parityViolations.length} parity problem(s).`,
    );
    process.exit(1);
  }

  console.log('');
  console.log('[check-locales] OK — all used keys present & non-empty in 4 locales, parity holds.');
  process.exit(0);
}

main();
