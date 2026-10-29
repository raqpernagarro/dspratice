/**
 * Ranks how well `search` matches an item. Returns 0 for no match, up to 1 for
 * an exact match. Case-insensitive; every whitespace-separated term must match.
 *
 * Tiers (highest wins per term): exact → prefix → word start → substring →
 * keyword match → in-order fuzzy match on the value (e.g. "btn" → "Button").
 */
export function commandScore(value: string, search: string, keywords: string[] = []): number {
  const query = search.trim().toLowerCase();
  if (!query) return 1;

  const target = value.toLowerCase();
  const wordStarts = getWordStarts(value);
  const whole = scoreTerm(target, wordStarts, keywords, query);
  if (whole > 0) return whole;

  const terms = query.split(/\s+/);
  if (terms.length < 2) return 0;

  let total = 0;
  for (const term of terms) {
    const score = scoreTerm(target, wordStarts, keywords, term);
    if (score === 0) return 0;
    total += score;
  }
  // Multi-term matches rank below any whole-query match.
  return (total / terms.length) * 0.5;
}

function scoreTerm(target: string, wordStarts: number[], keywords: string[], term: string): number {
  if (target === term) return 1;
  if (target.startsWith(term)) return 0.9;
  if (wordStarts.some((index) => target.startsWith(term, index))) return 0.8;
  if (target.includes(term)) return 0.7;

  for (const keyword of keywords) {
    const k = keyword.toLowerCase();
    if (k === term || k.startsWith(term)) return 0.6;
    if (k.includes(term)) return 0.5;
  }

  return fuzzy(target, term);
}

/** In-order character match; tighter spans score higher (0.1–0.4). */
function fuzzy(target: string, term: string): number {
  let position = -1;
  let first = -1;
  for (const char of term) {
    position = target.indexOf(char, position + 1);
    if (position === -1) return 0;
    if (first === -1) first = position;
  }
  const span = position - first + 1;
  const compactness = term.length / span;
  const startBonus = first === 0 ? 0.1 : 0;
  return 0.1 + 0.2 * compactness + startBonus;
}

/** Indexes where a word starts: after a separator or at a camelCase hump ("ButtonGroup" → 0, 6). */
function getWordStarts(value: string): number[] {
  const starts: number[] = [];
  for (let index = 1; index < value.length; index += 1) {
    const previous = value[index - 1];
    const current = value[index];
    const afterSeparator = /[\s\-_/.·]/.test(previous) && !/[\s\-_/.·]/.test(current);
    const camelHump = /[a-z0-9]/.test(previous) && /[A-Z]/.test(current);
    if (afterSeparator || camelHump) starts.push(index);
  }
  return starts;
}
