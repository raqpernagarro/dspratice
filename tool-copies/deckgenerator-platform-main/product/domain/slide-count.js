// product/domain/slide-count.js
// =============================================================================
// A slide count the request states outright ("a 6-slide pitch", "20 slides").
// Read once, here, so the drafting prompt and the compose step agree on it.
// Digits only: a missed word ("six") is safer than a wrong count.
// =============================================================================

export function requestedSlideCount(text) {
  const m = String(text || "").match(/\b(\d{1,2})\s*[- ]?\s*(?:slides?|pages?)\b/i);
  const n = m ? Number(m[1]) : NaN;
  return Number.isInteger(n) && n >= 1 && n <= 60 ? n : null;
}

// ---- Counts stated inside a slide ------------------------------------------
// "Top five risks" on a slide with four bullets is a broken promise, and it
// reads as a careless deck to the person in the room. Checked on the draft,
// before any layout is chosen, so the retry can fix the words or the list.

const NUMBER_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12,
};

/** Nouns that name a countable set of things. Kept closed on purpose: a
 *  wider list would flag ordinary prose ("three years", "two thirds"). */
const COUNTED_NOUNS = [
  "decisions", "risks", "options", "steps", "phases", "priorities", "asks",
  "actions", "reasons", "benefits", "metrics", "targets", "questions",
  "initiatives", "milestones", "gates", "principles", "workstreams", "goals",
  "pillars", "pilots", "recommendations", "lessons", "ways",
];

const COUNT_PATTERN = new RegExp(
  `\\b(\\d{1,2}|${Object.keys(NUMBER_WORDS).join("|")})\\s+(?:[a-z-]+\\s+)?(${COUNTED_NOUNS.join("|")})\\b`,
  "i",
);

/** The count a title or subtitle states, or null. "Top five risks" → 5. */
export function statedCount(text) {
  const m = String(text || "").match(COUNT_PATTERN);
  if (!m) return null;
  const raw = m[1].toLowerCase();
  const n = /^\d+$/.test(raw) ? Number(raw) : NUMBER_WORDS[raw];
  return Number.isInteger(n) && n >= 1 ? { n, phrase: m[0] } : null;
}

/**
 * Finds slides whose title states a count the slide's own list does not match.
 * Only slides that carry a list are checked: a divider or cover with no bullets
 * is not a list the count could be measured against.
 *
 * @param {Array<{title?: string, subtitle?: string, bullets?: string[]|string}>} slides
 * @returns {Array<{index: number, phrase: string, stated: number, found: number}>}
 */
export function countMismatches(slides = []) {
  const out = [];
  slides.forEach((s, index) => {
    const bullets = Array.isArray(s?.bullets) ? s.bullets.filter(Boolean)
      : s?.bullets ? [s.bullets] : [];
    if (!bullets.length) return;
    const stated = statedCount(s.title);
    if (stated && stated.n !== bullets.length) {
      out.push({ index, phrase: stated.phrase, stated: stated.n, found: bullets.length });
    }
  });
  return out;
}
