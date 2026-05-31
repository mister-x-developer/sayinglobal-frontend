/**
 * Local ESLint rules plugin — stub registry.
 *
 * Skeleton authored by task 1.4 of the premium-launch-readiness spec.
 * The `no-arbitrary-color` rule is authored separately by task 4.8 and will
 * be added to the `rules` map below as a one-line change:
 *
 *   const noArbitraryColor = require('./no-arbitrary-color');
 *   module.exports = {
 *     rules: {
 *       'no-arbitrary-color': noArbitraryColor,
 *     },
 *   };
 *
 * Keeping the export shape stable (`{ rules: {...} }`) means the consumer
 * config in `.eslintrc.cjs` does not need to change when new rules land.
 */
module.exports = {
  rules: {},
};
