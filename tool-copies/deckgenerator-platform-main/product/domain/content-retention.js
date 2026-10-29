// =============================================================================
// Content retention — how much of a slide's own wording survived being laid
// out on a template.
//
// Pulled out of generation-service.js on purpose: slide-review-service.js
// needs this same measurement to gate repairs (a repair onto a shortlist
// alternate must not silently swap real content for the alternate's
// example/lorem placeholders), and generation-service.js already imports
// FROM slide-review-service.js (`reviewSlides`). Importing retentionOf
// straight from generation-service.js would work today — ESM hoists
// function declarations — but it deepens a cycle that is already fragile.
// This tiny leaf module has no imports of its own, so both sides can depend
// on it without either depending on the other.
// =============================================================================

/** Below this share of the slide's own words surviving into the rendered
 *  content, the layout is losing the slide rather than presenting it. Set low
 *  on purpose: clamping long prose to a card's budget is legitimate and routine,
 *  and only wholesale loss should overrule the model's (or a repair's) choice. */
export const MIN_RETENTION = 0.45;

/**
 * How much of a slide's source wording survived into the finished content.
 *
 * Compared as sets of words, not characters: reordering, re-splitting across
 * fields and rewriting a bullet as a card title are all normal and should not
 * register as loss. Dropping four of five decisions should.
 *
 * @param {string} sourceText  the slide's own title and body, joined
 * @param {object} content     what the template will actually render
 * @returns {number} 0–1, and 1 when there was nothing to keep
 */
export function retentionOf(sourceText, content) {
  const words = (v) => String(v).toLowerCase().match(/[a-z0-9][a-z0-9'’-]{2,}/g) || [];
  const source = new Set(words(sourceText));
  if (!source.size) return 1;

  const seen = new Set();
  const walk = (v) => {
    if (typeof v === "string") words(v).forEach((w) => seen.add(w));
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") {
      // Chrome repeats the deck title on every slide; counting it would let an
      // empty slide look half full.
      for (const [k, val] of Object.entries(v)) if (k !== "meta" && k !== "footer") walk(val);
    }
  };
  walk(content);

  let kept = 0;
  for (const w of source) if (seen.has(w)) kept += 1;
  return kept / source.size;
}
