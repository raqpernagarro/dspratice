// product/domain/variety.js
// =============================================================================
// Deck-level variety, enforced in code.
//
// The layout-choice prompt asks the model not to repeat a layout and to spread
// its choices across the deck. Prompts are requests, not guarantees: in the
// saved decks one layout filled 11 of 12 slides, and four decks repeated a
// layout on consecutive slides. This module checks the model's picks after it
// answers and swaps the offending ones for the next-best candidate on that
// slide's own shortlist. The swap only ever uses layouts the scorer already
// judged to fit the slide, so the content still lands in a layout that holds it.
//
// Three rules, all checked against the picks already accepted earlier in the
// deck (greedy, in order):
//   1. No layout on two consecutive slides.
//   2. No layout more than `perTemplateCap` times.
//   3. No family (the part of the name before "/") above `familyShareCap` of
//      the deck.
// Rule 1 is never relaxed. When no candidate satisfies 2 and 3 together, the
// swap relaxes 3 first, then 2, so an unavoidable repeat gets the least bad
// fix. Anything still repeating back to back is reported as unresolved.
// =============================================================================

const familyOf = (name) => String(name || "").split("/")[0];

/** Caps scale with deck length, with a floor so short decks aren't forced
 *  into churn. 12 slides → 3 per layout, 40% per family. */
export function capsFor(deckLength) {
  return {
    perTemplateCap: Math.max(2, Math.ceil(deckLength / 5)),
    familyShareCap: Math.max(2, Math.ceil(deckLength * 0.4)),
  };
}

/**
 * @param {Array<{index:number, templateName:string, theme?:string}>} picks
 *   One pick per slide, in deck order. `index` is the slide's 0-based position.
 * @param {Array<Array<{name:string}>>} shortlists
 *   shortlists[index] = that slide's candidates, best first.
 * @param {{deckLength?: number, fixed?: Set<number>}} [options]
 *   fixed: slide indexes that are never swapped (the hook slide).
 * @returns {{picks: typeof picks, changes: Array<{index:number, from:string, to:string}>, unresolved: number[]}}
 */
export function enforceVariety(picks, shortlists = [], { deckLength = picks.length, fixed = new Set() } = {}) {
  const caps = capsFor(deckLength);
  const counts = new Map();
  const families = new Map();
  const changes = [];
  const unresolved = [];
  let previous = null;

  const underCount = (name) => (counts.get(name) || 0) < caps.perTemplateCap;
  const underFamily = (name) => (families.get(familyOf(name)) || 0) < caps.familyShareCap;
  // Tried in order. Adjacency is never relaxed: two identical slides in a row
  // is the most visible failure, so it is the last rule to give way.
  const tiers = [
    (name) => name !== previous && underCount(name) && underFamily(name),
    (name) => name !== previous && underCount(name),
    (name) => name !== previous,
  ];

  const out = picks.map((pick) => {
    let chosen = pick.templateName;
    // A fixed slide (the hook) keeps its layout whatever its neighbours use;
    // it still counts, so the slide after it is the one that moves.
    if (!fixed.has(pick.index) && !tiers[0](chosen)) {
      const candidates = (shortlists[pick.index] || []).map((c) => c.name).filter((n) => n !== pick.templateName);
      // The strictest tier that any candidate satisfies wins.
      const alternative = tiers.reduce((found, ok) => found || candidates.find((name) => ok(name)), null);
      if (alternative) {
        changes.push({ index: pick.index, from: pick.templateName, to: alternative });
        chosen = alternative;
      } else if (!tiers[2](chosen)) {
        // Only a back-to-back repeat with no alternative is a real failure;
        // an over-cap pick that is at least not adjacent is kept quietly.
        unresolved.push(pick.index);
      }
    }
    counts.set(chosen, (counts.get(chosen) || 0) + 1);
    families.set(familyOf(chosen), (families.get(familyOf(chosen)) || 0) + 1);
    previous = chosen;
    return { ...pick, templateName: chosen };
  });

  return { picks: out, changes, unresolved };
}
