/**
 * frontend/.eslintrc.cjs — ESLint configuration for the Web_Frontend.
 *
 * Authored by task 1.4 of the premium-launch-readiness spec as a registry
 * skeleton. It establishes the legacy `.eslintrc` shape that
 * `eslint-config-next` expects and pre-creates the override blocks where
 * the custom `local-rules/no-arbitrary-color` rule (planned in task 4.8)
 * will be enabled.
 *
 * Local custom rules live in `./scripts/eslint-rules/` and are exported as
 * an ESLint plugin shape (`{ rules: { ... } }`). Wiring the plugin into
 * the legacy ESLint config requires `eslint-plugin-local-rules` (or an
 * equivalent re-export shim). That dependency and the rule registration
 * are intentionally deferred to task 4.8 so that `next lint` continues to
 * exit 0 today without needing to install anything new.
 *
 * Task 4.8 wiring (one-line changes once the package is installed):
 *   1. `npm i -D eslint-plugin-local-rules` and re-export the local plugin
 *      via `eslint-local-rules/index.js → require('../scripts/eslint-rules')`.
 *   2. Add `'local-rules'` to the top-level `plugins` array below.
 *   3. Enable `'local-rules/no-arbitrary-color': 'error'` inside the
 *      `app|components|lib` override block below.
 *
 * Requirements: 9.7 (committed linter config), 11.1 (`npm run lint` is
 * part of the Web_Frontend Quality_Gate and must exit 0).
 */
module.exports = {
  root: true,
  extends: ['next/core-web-vitals'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  // Plugins registered today: only those provided by `next/core-web-vitals`.
  // Task 4.8 will add `'local-rules'` here.
  plugins: [],
  // Default rules are inherited from `next/core-web-vitals`. No project-wide
  // overrides are introduced today so existing code keeps lint-clean.
  rules: {},
  overrides: [
    {
      // Source folders where the custom `no-arbitrary-color` rule applies.
      // Task 4.8 will populate the `rules` map below.
      files: [
        'app/**/*.{ts,tsx,js,jsx}',
        'components/**/*.{ts,tsx,js,jsx}',
        'lib/**/*.{ts,tsx,js,jsx}',
      ],
      rules: {
        // Task 4.8: 'local-rules/no-arbitrary-color': 'error',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'out/',
    'public/',
    'scripts/eslint-rules/',
    'next-env.d.ts',
  ],
};
