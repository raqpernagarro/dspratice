// js/voice-lint.js
// =============================================================================
// A deterministic check of slide copy against the Nagarro voice
// (docs/VOICE.md, product/domain/voice.js). Pure: no Node APIs, no DOM, so the
// browser and the server import the same file (same arrangement as
// js/brief-check.js). Findings are advisory; `score` is simply their count.
//
// Slide numbers in findings are indexes into the array passed to lintDeck.
// =============================================================================

/** Hype and truisms that never belong in copy. */
export const BANNED = [
  /\bunlock(?:s|ed|ing)?\b/i,
  /\bunleash(?:es|ed|ing)?\b/i,
  /\brevolutioni[sz](?:e|es|ed|ing)\b/i,
  /\bsupercharg(?:e|es|ed|ing)\b/i,
  /\bharness(?:es|ed|ing)? the power of\b/i,
  /\bcutting[- ]edge\b/i,
  /\bgame[- ]chang(?:er|ers|ing)\b/i,
  /\bbest[- ]in[- ]class\b/i,
  /\btectonic shift\b/i,
  /\bon the cusp\b/i,
  /\bin today['’]s rapidly evolving\b/i,
  /\bseamless(?:ly)?\b/i,
  // the verb; "a leverage" / "financial leverage" as nouns are left alone
  /(?<!\b(?:a|the|financial|operating)\s)\bleverag(?:e|es|ed|ing)\b/i,
];

const TRUISM = /\bin today['’]s (?!rapidly evolving)[\w -]{0,30}(?:landscape|world|era|environment|age)\b/i;
// Only the rhetorical forms: "X, not Y", "not X, but Y" (incl. "isn't X, but Y"),
// and "doesn't just X. Y". Plain negation ("We do not guess, we measure") is left alone.
const CONTRAST = new RegExp(
  [
    ",\\s*not\\s+\\w",
    "\\b(?:not|\\w+n['’]t)\\s+(?:just\\s+|only\\s+)?[^,.;]{1,40},\\s*but\\b",
    "\\b(?:don['’]t|doesn['’]t|do not|does not|isn['’]t|is not)\\s+(?:just|only|merely)\\b[^.!?]{1,60}[.]\\s+\\w",
  ].join("|"),
  "i",
);
const TRIAD = /[^,;:]+,\s*[^,;:]+,?\s+(?:and|or)\s+[^,;:]+/i;
const THREE = /\b(?:three|3)\b/i;

function matches(text, re) {
  const m = re.exec(text);
  return m ? m[0].trim() : null;
}

/** Findings for one piece of text: banned phrases, "!", truisms. */
export function lintText(text) {
  const s = String(text ?? "");
  const out = [];
  for (const re of BANNED) {
    const hit = matches(s, re);
    if (hit) out.push({ kind: "banned", text: hit });
  }
  if (s.includes("!")) out.push({ kind: "exclaim", text: "!" });
  const truism = matches(s, TRUISM);
  if (truism) out.push({ kind: "truism", text: truism });
  return out;
}

function firstWord(s) {
  const m = /^[\s"'“‘(]*([\p{L}’']+)/u.exec(String(s ?? ""));
  return m ? m[1].toLowerCase() : "";
}

/**
 * Lint a whole deck. Per-text findings plus the deck budgets: one "X, not Y"
 * contrast, one featured triad (in titles), "three" in one title, and no
 * opening word shared by three or more slide bodies.
 */
export function lintDeck(slides) {
  const findings = [];
  const list = Array.isArray(slides) ? slides : [];
  let contrasts = 0;
  let triads = 0;
  let threes = 0;
  const openers = new Map();

  list.forEach((slide, i) => {
    const texts = Array.isArray(slide?.texts) ? slide.texts : [];
    const title = slide?.title;
    const all = [...(title ? [title] : []), ...texts];

    for (const t of all) {
      for (const f of lintText(t)) findings.push({ ...f, slide: i });
    }

    const contrast = all.map((t) => matches(String(t), CONTRAST)).find(Boolean);
    if (contrast && ++contrasts > 1) findings.push({ kind: "contrast", text: contrast, slide: i });

    if (title) {
      const triad = matches(String(title), TRIAD);
      if (triad && ++triads > 1) findings.push({ kind: "triad", text: triad, slide: i });
      if (THREE.test(title) && ++threes > 1) findings.push({ kind: "three-title", text: String(title), slide: i });
    }

    const w = firstWord(texts[0]);
    if (w) openers.set(w, [...(openers.get(w) || []), i]);
  });

  for (const [word, at] of openers) {
    if (at.length >= 3) findings.push({ kind: "opener", text: word, slide: at[2] });
  }
  return { findings, score: findings.length };
}
