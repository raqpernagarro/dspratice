// product/ui/editor-ai/intents.js
//
// Single source of intent copy for the AI panel: the empty-state intention
// library, the inline quick-action prompts (floating toolbar + context
// menu), and the follow-up chip rules. Kept module-internal except for the
// one-way import editor.js takes of QUICK_ACTIONS (see plan's Global
// Constraints — no cycle back into editor-ai/).

/** @typedef {{ text: string, scope: "slide"|"object", tags: Array<"copy"|"structure"|"visual"|"audience"> }} Intent */

/** @type {Intent[]} */
const INTENTS = [
  // slide scope — structure
  // CROSS-FILE CONTRACT: every intent tagged "structure" here must trip
  // composer.js's STRUCTURAL_HINT regex, or sending it routes through the
  // plain rewrite path instead of planSlideChange — defeating the point of
  // the chip. When adding/editing a structural intent, check it against
  // STRUCTURAL_HINT (and extend the regex, conservatively, if it misses).
  //
  // INVERSE RULE: copy/audience chip copy — the "copy"/"audience"-tagged
  // intents below, copy/audience follow-up chips (followUpsFor), and
  // QUICK_ACTIONS — must NOT trip STRUCTURAL_HINT, or a copy/audience ask
  // gets silently routed into the planning path instead of the plain
  // rewrite it asked for. When adding/editing any of those, check it
  // against STRUCTURAL_HINT too. (Structural/visual follow-ups, e.g. "Add a
  // supporting image", are expected to trip it — that's correct routing.)
  { text: "This slide is too dense — try a better layout", scope: "slide", tags: ["structure"] },
  { text: "Split this into two slides", scope: "slide", tags: ["structure"] },
  { text: "Turn this into a timeline", scope: "slide", tags: ["structure"] },
  { text: "Turn this into a comparison table", scope: "slide", tags: ["structure"] },
  { text: "Reorder this so the conclusion comes first", scope: "slide", tags: ["structure"] },
  { text: "This needs a stronger visual, not more text", scope: "slide", tags: ["structure", "visual"] },

  // slide scope — audience
  { text: "Prepare this for executives", scope: "slide", tags: ["audience"] },
  { text: "Make this readable for someone with no context", scope: "slide", tags: ["audience"] },
  { text: "Write this for a skeptical audience", scope: "slide", tags: ["audience"] },
  { text: "Make the headline carry the argument", scope: "slide", tags: ["audience", "copy"] },
  { text: "Cut this to one message", scope: "slide", tags: ["audience", "copy"] },

  // slide scope — copy
  { text: "Tighten the writing", scope: "slide", tags: ["copy"] },
  { text: "Reduce reading time", scope: "slide", tags: ["copy"] },
  { text: "Make this slide easier to understand", scope: "slide", tags: ["copy"] },
  { text: "Add a supporting example", scope: "slide", tags: ["copy"] },
  { text: "Make the numbers stand out more", scope: "slide", tags: ["copy", "visual"] },

  // slide scope — visual
  { text: "Explain this visually", scope: "slide", tags: ["visual"] },
  { text: "Add a supporting photo", scope: "slide", tags: ["visual"] },
  { text: "This feels cluttered — simplify it", scope: "slide", tags: ["visual"] },
  { text: "Give this more visual hierarchy", scope: "slide", tags: ["visual", "structure"] },

  // object scope — short, punchy
  { text: "Make this punchier", scope: "object", tags: ["copy"] },
  { text: "Half the length", scope: "object", tags: ["copy"] },
  { text: "More executive", scope: "object", tags: ["audience"] },
  { text: "Simplify this", scope: "object", tags: ["copy"] },
  { text: "Make this pop visually", scope: "object", tags: ["visual"] },
  { text: "Say this with more confidence", scope: "object", tags: ["copy"] },
];

/** Quick-action prompt strings — sent immediately (never drafted) from the
 *  floating toolbar and the canvas context menu. Exact copy per spec §3. */
export const QUICK_ACTIONS = {
  shorter: "Make this noticeably shorter without losing the point",
  improve: "Improve the writing — clearer, more confident, same length",
  expand: "Expand this with one concrete supporting detail",
};

/** Simple string hash (djb2) — deterministic, no crypto needed, stable
 *  across engines for the same input string. */
function hashStr(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Deterministic rotation seed: slide index + today's date, no timers or
 *  Math.random — stable within a day for a given slide. */
function rotationSeed(slideIndex) {
  const day = new Date().toISOString().slice(0, 10);
  return hashStr(`${slideIndex ?? 0}:${day}`);
}

function pickRotated(list, seed, count) {
  if (list.length <= count) return list.slice();
  const start = seed % list.length;
  const out = [];
  const used = new Set();
  let i = start;
  while (out.length < count && used.size < list.length) {
    if (!used.has(i)) {
      out.push(list[i]);
      used.add(i);
    }
    i = (i + 1) % list.length;
  }
  return out;
}

/** Returns the empty-state intention set for the current scope, rotated
 *  deterministically by slideIndex + today's date. `count` caps how many
 *  come back (default 4, the historical size) — the panel's empty state
 *  asks for fewer to keep an idle slide from opening with a wall of
 *  example chips. Slide scope still favors at least one structural and one
 *  audience intent when count allows for both; object scope draws from the
 *  object-tagged pool. */
export function emptyStateIntents({ scopeLevel, slideIndex, count = 4 }) {
  const seed = rotationSeed(slideIndex);
  if (scopeLevel === "object") {
    const pool = INTENTS.filter((it) => it.scope === "object");
    return pickRotated(pool, seed, count).map((it) => it.text);
  }

  const pool = INTENTS.filter((it) => it.scope === "slide");
  const structural = pool.filter((it) => it.tags.includes("structure"));
  const audience = pool.filter((it) => it.tags.includes("audience"));
  const rest = pool.filter((it) => !it.tags.includes("structure") && !it.tags.includes("audience"));

  const s = pickRotated(structural, seed, count >= 2 ? 1 : 0);
  const a = pickRotated(audience, seed + 1, count >= 1 ? 1 : 0);
  const chosen = new Set([...s, ...a].map((it) => it.text));
  const remainingPool = pool.filter((it) => !chosen.has(it.text));
  const fill = pickRotated(remainingPool.length ? remainingPool : rest, seed + 2, Math.max(0, count - chosen.size));

  return [...s, ...a, ...fill].map((it) => it.text).slice(0, count);
}

/** A follow-up chip whose text and the action it must send under are not the
 *  same thing — "Generate speaker notes" reads as a request, but sending it
 *  as a "rewrite" ask just drafts prose into the content fields instead of
 *  calling the real speakerNotes action. Chips are plain strings except this
 *  one, which pairs its label with the action the eventual send must use. */
const SPEAKER_NOTES_CHIP = { label: "Generate speaker notes", action: "speakerNotes" };

/** Follow-up chip rules (spec §2). `item` is a settled conversation item
 *  (status "applied"|"partial"); `ctx` optionally carries
 *  `{ nextReviewIssue }` — the next unresolved review issue's fix text, if
 *  any, used for the "Fix the next issue" chip. Returns 2-3 chips — each
 *  either a plain string (drafted into the composer on click) or
 *  `{ label, action }` (sent immediately under that action, like a quick
 *  action, because drafting can't carry an action through the composer). */
export function followUpsFor(item, ctx = {}) {
  if (!item) return [];

  if (item.kind === "review-fix" || item.fromReview) {
    if (ctx.nextReviewIssue) return ["Fix the next issue"];
    // No next issue to chain into — fall through to the normal rewrite
    // chips instead of leaving the user with nothing to click.
    return ["Reduce reading time", SPEAKER_NOTES_CHIP, "Prepare this for executives"];
  }

  if (item.kind === "layout") {
    return ["Tighten the writing to fit", "Add a supporting image"];
  }

  if (item.kind === "rewrite") {
    return ["Reduce reading time", SPEAKER_NOTES_CHIP, "Prepare this for executives"];
  }

  return [];
}
