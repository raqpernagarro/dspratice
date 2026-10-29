// product/domain/template-scoring.js
// =============================================================================
// Which of the 229 templates could this slide be?
//
// The old engine put every template in one prompt as a line of prose and asked
// the model to choose. Three things were wrong with that. It kept reaching for
// the same dozen layouts, because 229 near-identical lines give nothing to
// discriminate on. It could not grow — the catalog was 22k of a 32k cap. And it
// threw away the best information in the library: every template already
// declares `role`, `shape`, `media`, `capacity` and `slots` — the last being
// real counts of {images, titles, subtitles, body, stats, icons, list}.
//
// So: score all 229 here, deterministically, and send the model a shortlist.
// The model still chooses — this only decides what it chooses BETWEEN. That
// keeps rules doing what rules are good at ("six currency figures, four
// bullets, holds six stats") and leaves judgement to the model.
//
// FIT is scored in both directions on purpose. A layout with room for nine
// items given three leaves two thirds of the frame empty, which is the
// "top-heavy slide with a void beneath it" that made generated decks look
// unfinished. That is penalised as firmly as a layout that overflows.
// =============================================================================
import { liveTemplates } from "./live-templates.js";

/** Roles that suit each content shape, strongest first. */
export const ROLE_AFFINITY = {
  numeric:    ["chart", "data", "statement", "cards", "results", "table"],
  sequence:   ["timeline", "diagram", "chart", "cards", "data"],
  comparison: ["table", "diagram", "chart", "cards"],
  people:     ["team", "cv", "skills"],
  quote:      ["quote", "statement", "stories", "press"],
  agenda:     ["toc", "index"],
  awards:     ["awards", "results", "press", "cards", "logos"],
  assertion:  ["statement", "quote", "text", "divider"],
  visual:     ["gallery", "showcase", "casestudy"],
  list:       ["cards", "content", "services", "diagram"],
  prose:      ["content", "text", "brief", "detail"],
};

/** Shapes that read as a sequence, a comparison, or a set of figures. */
const SHAPE_AFFINITY = {
  sequence:   ["timeline", "milestones", "gantt", "sprints", "calendar", "staircase", "cycle-split", "projection", "diagram"],
  comparison: ["table", "rows", "cols", "duo", "quadrant", "venn-split", "matrix", "bars-compare", "line-split"],
  numeric:    ["stacked-bars", "bars", "chart", "area", "line-markers", "waffle", "pie-split", "proportion", "dotted-line", "radar-split", "stacked-split", "wall"],
};

/** Every shape the library declares. The validator refuses shapes outside this
 *  set — scoring ignores unknown shapes SILENTLY (they just never earn the
 *  shape bonus), which is exactly the degradation new authors must not hit.
 *  Extending: add the shape here (and to SHAPE_AFFINITY if it should score).
 *  Seeded from the live library with:
 *  node -e "import('./js/templates/index.js').then(m => console.log([...new Set(m.allTemplates.map(t=>t.shape))].sort()))" */
export const KNOWN_SHAPES = new Set([
  "arches", "area", "bars", "bars-compare", "calendar", "chart", "collage", "cols", "diagram",
  "concentric-split", "cycle-split", "dotted-line", "duo", "fineprint", "full",
  "fullbleed", "gantt", "grid", "line-markers", "line-split", "list", "matrix",
  "milestones", "mosaic", "onion-split", "orgchart", "pie-split", "projection",
  "proportion", "pyramid-split", "quadrant", "radar-split", "roster", "row",
  "rows", "single", "sliders-split", "split", "sprints", "stacked-bars",
  "stacked-split", "staircase", "table", "timeline", "twocol", "venn-split",
  "waffle", "wall",
]);

/**
 * Whether a layout's point is figures: a chart, a data/results layout, a stat
 * grid or a big number. Works on a template or a shortlist entry (both carry
 * role, intent and slots). One definition, shared by scoring, the figure
 * check's rescue in composition, and the tests.
 */
const DATA_ROLES = new Set(["chart", "data", "results"]);
const STAT_ROLES = new Set(["cards", "content", "statement"]);
export function isDataLayout(t) {
  if (!t) return false;
  if (DATA_ROLES.has(t.role) || t.intent?.feel === "data") return true;
  return (t.slots?.stats || 0) >= 2 && STAT_ROLES.has(t.role || "content");
}

const has = (list, value) => Array.isArray(list) && list.includes(value);

/** Whether a layout has a field the speaker's name can go in. The library
 *  calls it `name`, `attribution` or `author` depending on the family. */
const ATTRIBUTION_FIELD = /^(?:name|attribution|author|source|cite|speaker|by)$/i;
function carriesAttribution(template) {
  return Object.keys(template.schema || {}).some((k) => ATTRIBUTION_FIELD.test(k));
}

/** How well `held` slots match `needed` items: 1 when equal, falling away in
 *  both directions, and harder on the too-small side. */
function fitScore(needed, held) {
  if (!needed || !held) return 0;
  if (needed === held) return 1;
  const ratio = needed / held;
  if (ratio > 1) return Math.max(0, 1 - (ratio - 1) * 1.6); // overflow
  return Math.max(0, 1 - (1 - ratio) * 1.1);                // dead space
}

/** The main repeatable capacity of a layout, whatever it calls it. */
function slotsFor(template) {
  const s = template.slots || {};
  /* `capacity.items` counts the layout's main repeatable unit; `slots` counts
   * named regions. They disagree for templates whose repeat is drawn rather
   * than laid out — a timeline reports {titles: 1} while holding five phases —
   * so the larger is the honest answer for "how many points fit here". */
  const cap = template.capacity || {};
  return {
    items: Math.max(s.list || 0, s.body || 0, s.titles || 0, s.stats || 0, s.icons || 0, cap.items || 0),
    stats: s.stats || 0,
    images: s.images || 0,
    list: s.list || 0,
    body: s.body || 0,
  };
}

/**
 * Scores one template against one slide's signature.
 *
 * @returns {{score: number, why: string[]}} why is for explaining a choice, and
 *   for debugging a bad one — a score with no reason is untraceable.
 */
export function scoreTemplate(template, sig, { deckLength = 10, boostRoles = [] } = {}) {
  const role = template.role || "content";
  const shape = template.shape || "";
  const slots = slotsFor(template);
  const cap = template.capacity || {};
  const why = [];
  let score = 0;

  /* A deck-level art-direction pass (planDeck) can flag a slide for extra
   * emphasis — the deck's strongest single claim — without knowing which
   * template names exist. It says WHAT KIND of layout it wants (role names,
   * same vocabulary as ROLE_AFFINITY above) and this is the one place that
   * turns that into a score: +20 flat, deliberately smaller than a genuine
   * ROLE_AFFINITY match (55) so a boosted role still loses to a template that
   * is actually the right shape for the content — this nudges a tie, it does
   * not override a mismatch. */
  if (boostRoles.includes(role)) { score += 20; why.push(`${role} was emphasised for this slide`); }

  const wants = [];
  /* Narrowest reading first: the primary want is weighted highest, so ordering
   * decides ties. Awards before people, because an award citation names roles
   * and would otherwise read as a team slide. */
  if (sig.isAgenda) wants.push("agenda");
  if (sig.isQuote) wants.push("quote");
  if (sig.isAwards) wants.push("awards");
  if (sig.isPeople) wants.push("people");
  if (sig.isComparison) wants.push("comparison");
  if (sig.isSequence) wants.push("sequence");
  if (sig.isNumeric) wants.push("numeric");
  if (sig.wantsVisual) wants.push("visual");
  if (sig.isAssertion) wants.push("assertion");
  /* How many readings count at FULL weight. Normally one — a slide about
   * numbers is about numbers, and everything else is a lesser reading. */
  let primaryCount = 1;

  if (!wants.length) {
    /* Nothing specific fired. A short slide with no numbers, no sequence, no
     * comparison and no people is genuinely ambiguous: it reads equally well as
     * a paragraph or as a photograph with a line over it, and which one serves
     * the deck is a judgement, not a rule. So both are offered at full weight
     * and the model decides.
     *
     * Adding "visual" as a merely SECONDARY reading did not work — at 55% of
     * the weight it could never outrank a content template's primary match, and
     * gallery layouts went unoffered on all 35 slides of the coverage audit. */
    const ambiguous = sig.itemCount > 0 && sig.itemCount <= 2 && !sig.isFirst && !sig.isLast;
    if (ambiguous) {
      wants.push("prose", "visual");
      primaryCount = 2;
    } else {
      wants.push(sig.itemCount >= 3 ? "list" : "prose");
    }
  }

  // ---- role and shape affinity ---------------------------------------------
  /* Whether this template's role is what the slide's PRIMARY reading calls for.
   * That distinction matters below: a semantic match means the layout is the
   * right kind of thing, and the item count then only decides which SIZE of it
   * to use — not whether to use it at all. */
  let primaryRoleMatch = false;
  for (let i = 0; i < wants.length; i++) {
    const weight = i < primaryCount ? 1 : 0.55; // the primary reading counts most
    const roles = ROLE_AFFINITY[wants[i]] || [];
    const at = roles.indexOf(role);
    if (at !== -1) {
      /* The primary role match is worth more than a perfect size fit, and
       * deliberately so. A one-item agenda fits a single-photo card layout
       * exactly, and that beat every contents template — a perfect fit on the
       * wrong KIND of slide. What the slide is comes first; how many slots it
       * needs only chooses between layouts of the right kind. */
      score += weight * ((i < primaryCount ? 55 : 30) - at * 5);
      if (i < primaryCount) { primaryRoleMatch = true; why.push(`${role} suits ${wants[i]}`); }
    }
    if (has(SHAPE_AFFINITY[wants[i]], shape)) {
      score += weight * 18;
      why.push(`${shape} reads as ${wants[i]}`);
    }
  }

  // ---- position ------------------------------------------------------------
  if (sig.isFirst) {
    if (role === "cover") { score += 60; why.push("opens the deck"); }
    else score -= 45; // a non-cover first slide is almost always wrong
  } else if (role === "cover") {
    score -= 40; // and a cover mid-deck is almost always wrong
  }
  if (sig.isLast) {
    if (role === "closing" || role === "contact") { score += 55; why.push("closes the deck"); }
  } else if (role === "closing" || role === "contact") {
    score -= 35;
  }

  // ---- how much content, versus how much room ------------------------------
  if (sig.itemCount) {
    const fit = fitScore(sig.itemCount, slots.items || cap.items || 0);
    // Half weight when the role already matches, for the same reason.
    score += fit * (primaryRoleMatch ? 17 : 34);
    if (fit > 0.85) why.push(`holds ${slots.items || cap.items} for ${sig.itemCount} points`);
    else if (fit < 0.4 && (slots.items || cap.items)) {
      why.push(`${sig.itemCount} points into ${slots.items || cap.items} slots`);
    }
    /* Hard limits, when the template declares them — but a shortfall never
     * overrules a semantic match.
     *
     * An outline that packs an agenda's four entries into one bullet reports
     * itemCount 1. Penalising that against a contents layout's minimum of four
     * pushed every toc template out of the shortlist, and the agenda slide came
     * back as a two-column content slab. Too FEW items is a hint about which
     * size to use; too MANY is a real overflow, so that penalty always stands. */
    if (cap.max && sig.itemCount > cap.max) score -= (sig.itemCount - cap.max) * 9;
    if (cap.min && sig.itemCount < cap.min && !primaryRoleMatch) {
      score -= (cap.min - sig.itemCount) * 7;
    }
  }

  // ---- figures want stat slots ---------------------------------------------
  if (sig.isNumeric && slots.stats) {
    score += fitScore(sig.figureCount, slots.stats) * 26 + 10;
    why.push(`${slots.stats} stat slots`);
  } else if (sig.isNumeric && !slots.stats && role !== "chart" && role !== "data") {
    score -= 6;
  }

  /* ---- an attributed quote needs somewhere to put the speaker --------------
   * Six of the fourteen quote templates have no attribution field at all. A
   * board deck's quote from a named clinical director landed on one of them,
   * and the name was simply dropped — the finished slide showed an anonymous
   * sentence, which in that setting is worth much less than the quote itself.
   *
   * Scored, not filtered: a layout with no attribution slot is still the right
   * answer for an unattributed line, and may still win here on other merits. */
  if (sig.isQuote && sig.hasAttribution) {
    if (carriesAttribution(template)) { score += 22; why.push("names the speaker"); }
    else if (role === "quote") score -= 26; // it would silently lose the name
  }

  // ---- photography ---------------------------------------------------------
  if (slots.images > 0) {
    if (sig.wantsVisual || sig.isPeople) { score += 14; why.push("carries photography"); }
    else if (sig.itemCount >= 4 || sig.density === "heavy") score -= 20; // no room for both
    /* A slide light enough to be a visual breather is not penalised for
     * carrying an image — the flat -6 here cancelled the secondary "visual"
     * reading above, and gallery layouts went unoffered across every deck. */
    else if (wants.includes("visual")) score += 4;
    else score -= 6;
  }

  // ---- the layout's own limit on item length (intent.itemChars) -----------
  // A list whose longest item is over what the layout fits reads as broken:
  // six questions in a logo wall, risks with owners in a skills list. Both
  // mis-picks in live decks were this, and the card says it outright.
  const maxChars = template.intent?.itemChars;
  if (maxChars && sig.itemCount >= 2 && sig.longestItem > maxChars) {
    score -= 30;
    why.push(`items are longer than the ${maxChars} characters it fits`);
  }

  // ---- a short list reads best as cards side by side ----------------------
  // Four to six short items with no photograph to carry: a row of cards with
  // room for exactly that many says it at a glance. A photo layout beside five
  // labels does not, and that is what the risks slide of a live deck received.
  if (sig.itemCount >= 4 && sig.itemCount <= 6 && sig.longestItem <= 80 && !sig.wantsVisual) {
    if (role === "cards" && shape === "row" && cap.items === sig.itemCount && !slots.images && !/cover/.test(template.name) && /\bbody\b/.test(String(template.schema?.cards || ""))) {
      score += 18;
      why.push("the list sits side by side as cards");
    }
  }

  // ---- prose that will not fit --------------------------------------------
  // A layout with no body slot cannot take a paragraph, whatever its role.
  if (sig.density === "heavy" && !slots.body && role !== "statement" && role !== "quote") score -= 14;
  /* …and a statement layout with NO body slot at all cannot take one either.
   *
   * The rule above exempts statement and quote, because a statement slide
   * legitimately shows one line. But main/text-01 renders a title and a numeral
   * and nothing else, and it tied at 72 with main/confidentiality-01, which is
   * also a statement and does have a body slot. The tie broke arbitrarily, and
   * a 131-character sentence landed on the layout that could show none of it —
   * 39% of the slide's words survived and no swap could rescue it, because by
   * then the words had nowhere to have been written.
   *
   * Small on purpose: a genuinely short assertion is under this threshold and
   * statement layouts still win it outright. */
  if (sig.longestItem > 80 && !slots.body && !slots.list) score -= 8;
  if (sig.longestItem > 320 && slots.items >= 5) score -= 12; // long text in many small cells

  // ---- deck-length sensibility --------------------------------------------
  if (role === "toc" && deckLength < 5) score -= 25; // no agenda for a four-slide deck

  return { score: Math.round(score * 10) / 10, why: why.slice(0, 3) };
}

/**
 * The candidate layouts for one slide, best first.
 *
 * @param {object} sig - from contentSignature()
 * @param {{limit?: number, deckLength?: number, templates?: object[], boostRoles?: string[], figuresAvailable?: boolean}} [options]
 *   figuresAvailable: false when none of the slide's figures trace to the
 *   material — the slide is read as non-numeric and data layouts (charts,
 *   stat grids, big numbers: isDataLayout) score −40.
 * @returns {Array<{name, role, shape, capacity, slots, theme, score, why}>}
 */
export function shortlistFor(sig, { limit = 12, deckLength = 10, templates = liveTemplates, avoid = new Set(), boostRoles = [], figuresAvailable = true } = {}) {
  /* Figures that are not in the material are not the slide's to show, so they
   * do not make it a numeric slide either: read without them, and demote
   * chart/data layouts on top. */
  if (figuresAvailable === false && sig?.isNumeric) sig = { ...sig, isNumeric: false };
  const scored = templates.map((t) => {
    let { score, why } = scoreTemplate(t, sig, { deckLength, boostRoles });
    /* A chart or data layout for a slide whose figures are not in the
     * material is an invitation to invent them. Demoted, not removed. */
    if (figuresAvailable === false && isDataLayout(t)) score -= 40;
    /* Already used earlier in this deck. Demoted, never removed — if it is
     * genuinely the only right answer for two slides it should still be
     * offered, but it must not LEAD both lists.
     *
     * Without this, slides whose content reads alike produce identical
     * shortlists, the same layout tops every one of them, and the deck comes
     * back uniform — which is the failure the whole engine exists to prevent,
     * arriving by a different route. */
    return { template: t, score: avoid.has(t.name) ? score - 28 : score, why };
  });
  scored.sort((a, b) => b.score - a.score);

  /* Take the best, but never all from one family — the library is six families
   * and an unvaried shortlist is how a deck ends up looking like one chapter of
   * a catalogue. */
  const out = [];
  const perFamily = new Map();
  const familyCap = Math.max(2, Math.ceil(limit / 3));
  for (const row of scored) {
    if (out.length >= limit) break;
    const family = row.template.family || "core";
    const used = perFamily.get(family) || 0;
    if (used >= familyCap && out.length < limit - 2) continue;
    perFamily.set(family, used + 1);
    out.push({
      name: row.template.name,
      role: row.template.role,
      shape: row.template.shape,
      capacity: row.template.capacity,
      slots: row.template.slots,
      media: row.template.media || "",
      intent: row.template.intent || null,
      score: row.score,
      why: row.why,
    });
  }
  return out;
}
