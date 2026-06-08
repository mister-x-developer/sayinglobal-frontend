/**
 * Transliteration-aware search utilities.
 *
 * Handles Uzbek Latin ↔ Cyrillic ↔ Russian ↔ English name matching.
 * Single normalization pipeline — used everywhere in the app.
 *
 * Architecture:
 * - normalizeForSearch() — canonical normalization
 * - matchScore() — scoring for sort order
 * - searchItems() — generic filter + sort
 */

// Cyrillic → Latin transliteration table
const CYR_TO_LAT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'j', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p',
  р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts', ч: 'ch',
  ш: 'sh', щ: 'sh', ы: 'i', э: 'e', ю: 'yu', я: 'ya',
  ё: 'yo', ғ: 'gh', қ: 'q', ҳ: 'h', ў: 'o',
  // Uppercase
  А: 'a', Б: 'b', В: 'v', Г: 'g', Д: 'd', Е: 'e', Ж: 'j', З: 'z',
  И: 'i', Й: 'y', К: 'k', Л: 'l', М: 'm', Н: 'n', О: 'o', П: 'p',
  Р: 'r', С: 's', Т: 't', У: 'u', Ф: 'f', Х: 'x', Ц: 'ts', Ч: 'ch',
  Ш: 'sh', Щ: 'sh', Ы: 'i', Э: 'e', Ю: 'yu', Я: 'ya',
  Ё: 'yo', Ғ: 'gh', Қ: 'q', Ҳ: 'h', Ў: 'o',
};

/**
 * Normalize a string for locale-independent search comparison.
 *
 * Pipeline:
 * 1. Lowercase
 * 2. Transliterate Cyrillic → Latin
 * 3. Remove Uzbek apostrophes (' ' ' `)
 * 4. Collapse common digraph variants (sh→s, ch→c, etc.)
 * 5. Remove non-alphanumeric
 */
export function normalizeForSearch(text: string): string {
  if (!text) return '';

  // Step 1: Transliterate Cyrillic
  let result = text
    .split('')
    .map((ch) => CYR_TO_LAT[ch] ?? ch)
    .join('');

  // Step 2: Lowercase
  result = result.toLowerCase();

  // Step 3: Remove Uzbek apostrophes
  result = result.replace(/[''''`ʹ]/g, '');

  // Step 4: Collapse digraph variants for fuzzy matching
  result = result
    .replace(/gh/g, 'g')
    .replace(/sh/g, 's')
    .replace(/ch/g, 'c')
    .replace(/ng/g, 'n')
    .replace(/yu/g, 'u')
    .replace(/ya/g, 'a')
    .replace(/yo/g, 'o')
    .replace(/ts/g, 's');

  // Step 5: Remove non-alphanumeric (keep spaces)
  result = result.replace(/[^a-z0-9\s]/g, '').trim();

  return result;
}

/**
 * Score a text match against a query.
 * Higher score = better match.
 *
 * 100 = exact match
 *  80 = starts with query
 *  60 = contains query
 *   0 = no match
 */
export function matchScore(text: string, query: string): number {
  if (!query.trim()) return 0;
  const nq = normalizeForSearch(query);
  const nt = normalizeForSearch(text);
  if (!nq || !nt) return 0;
  if (nt === nq) return 100;
  if (nt.startsWith(nq)) return 80;
  if (nt.includes(nq)) return 60;
  return 0;
}

/**
 * Check if text matches query (any score > 0).
 */
export function matchesSearch(text: string, query: string): boolean {
  return matchScore(text, query) > 0;
}

/**
 * Filter and sort an array of items by search query.
 * Supports multilingual fields — pass all relevant name variants.
 *
 * @param items - Array to search
 * @param query - Search query
 * @param getFields - Function returning all searchable string fields for an item
 */
export function searchItems<T>(
  items: T[],
  query: string,
  getFields: (item: T) => string[]
): T[] {
  if (!query.trim()) return items;

  const scored = items
    .map((item) => {
      const fields = getFields(item).filter(Boolean);
      const score = fields.reduce((max, f) => Math.max(max, matchScore(f, query)), 0);
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map(({ item }) => item);
}

/**
 * Debounce a search query update.
 * Use with useState to avoid excessive filtering on every keystroke.
 */
export function createSearchDebounce(delay = 200) {
  let timer: ReturnType<typeof setTimeout>;
  return (fn: () => void) => {
    clearTimeout(timer);
    timer = setTimeout(fn, delay);
  };
}
