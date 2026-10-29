// product/domain/content-signature.js
// =============================================================================
// What IS this slide, structurally?
//
// Reading a slide's content and naming its shape — "three numbers", "a
// five-step sequence", "a comparison", "four people" — is the half of template
// selection that needs no model at all. It is the same judgement every time,
// it is cheap, and doing it in code means the model gets a short list of
// genuinely plausible layouts instead of 229 lines of prose to skim.
//
// Everything here is a SIGNAL, not a verdict. Signals are scored against the
// library in template-scoring.js; the model still makes the final call. That
// division matters: rules are good at "this has six currency figures in it"
// and bad at "this is the emotional turn of the deck".
// =============================================================================

/** Numbers that carry weight on a slide: currency, percentages, multiples,
 *  magnitudes. Deliberately not "any digit" — dates and list numbering are
 *  counted separately and mean something different. */
const FIGURE = /(?:[£$€]\s?\d|\d+(?:[.,]\d+)?\s?(?:%|percent|bn|billion|m\b|million|k\b|x\b|×|pts?\b|points?\b|days?\b|weeks?\b|months?\b|years?\b|hours?\b|FTE\b))/gi;

/** Time markers that imply a SEQUENCE rather than a single date. */
const SEQUENCE = /\b(?:Q[1-4]|H[12]|phase\s*\d|stage\s*\d|step\s*\d|week\s*\d+|month\s*\d+|year\s*\d+|20\d{2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/gi;

/** Language that frames two states against each other. */
const COMPARISON = /\b(?:vs\.?|versus|compared\s+with|compared\s+to|before\s+and\s+after|today\s+(?:versus|vs)|current\s+(?:state|versus|vs)|target\s+state|as[- ]is|to[- ]be|instead\s+of|rather\s+than)\b/i;

/** A person: "Name — Role" or "Name, Title". Roles are the reliable half. */
/* A job title. "Partner" is deliberately absent — "Partner of the Year" is an
 * award, and that false match sent every awards slide to a team layout. */
const PERSON_ROLE = /\b(?:CEO|CTO|CFO|COO|CIO|CISO|VP|Head\s+of|Director|Manager|Lead\b|Principal|Architect|Engineer|Designer|Analyst|Consultant|Officer|President|Chair(?:man|woman)?)\b/i;

const QUOTE = /(?:^|\s)["“”'']{1}[^"“”]{25,}["“”'']{1}|\b(?:said|says|according\s+to)\b/i;

/* A quotation that NAMES its speaker: an em/en-dash or "—" attribution, or a
 * "said"/"according to" clause followed by a capitalised name. Six of the
 * fourteen quote templates have nowhere to put an attribution, and one of them
 * took a board-deck quote from a named clinical director — so the name simply
 * disappeared from the finished slide. Knowing the quote is attributed is what
 * lets scoring prefer a layout that can carry it. */
const ATTRIBUTION = /(?:[—–-]{1,2}\s*|\b(?:said|says|according\s+to)\s+)(?:(?:Dr|Prof|Mr|Ms|Mrs)\.?\s+)?[A-Z][a-z]+(?:\s+[A-Z][\w'’-]+)+/;

const AGENDA = /\b(?:agenda|table\s+of\s+contents|contents\b|what\s+we(?:'|’)?(?:ll|\s+will)?\s+cover|what\s+this\s+covers|in\s+this\s+(?:deck|session|presentation)|overview\s+of\s+(?:today|this))\b/i;

const AWARD = /\b(?:award|awarded|certified|certification|accredited|ISO\s?\d|partner\s+of\s+the\s+year|recognis|recogniz|rated|gold|platinum)\b/i;

/* Asking for a visual treatment, not merely containing the word. "Intake:
 * paper forms vs photo capture" is a comparison about a process; matching the
 * bare word "photo" sent it to a photo-card layout. */
const VISUAL = /\b(?:our\s+(?:people|office|team|workplace)|life\s+at|behind\s+the\s+scenes|in\s+pictures|photo\s+essay|gallery|showcase|moodboard|look\s+and\s+feel)\b/i;

/* Subject matter that a smiling, celebratory photograph actively contradicts.
 * The photography library is 208 pictures of Nagarro life — high-fives,
 * laughter, bicycles — and nothing in it is sombre. So a board slide quoting a
 * clinical director on patients whose surgery is cancelled on the morning was
 * illustrated with two colleagues high-fiving in an office corridor. Nothing
 * was broken; the slide simply read as tone-deaf, which in that room is worse.
 *
 * This does not pick a better photograph — there is no grave photograph in the
 * library to pick. It marks the slide so photo selection stops reaching for the
 * most celebratory one. */
const GRAVE = /\b(?:cancel(?:led|lation)?s?|fail(?:ure|ing|ed)?|backlog|delays?|delayed|shortfalls?|shortages?|vacanc(?:y|ies)|deficits?|overruns?|breach(?:es)?|incidents?|outages?|downtime|complaints?|penalt(?:y|ies)|fines?|redundanc(?:y|ies)|layoffs?|churn|attrition|decline|declining|losses|loss\b|risks?\b|waiting\s+lists?|injur(?:y|ies)|fatalit(?:y|ies)|deaths?|crisis|emergenc(?:y|ies))\b/i;

const countOf = (text, re) => (text.match(re) || []).length;

/** Splits a paragraph into sentences, or returns it whole when it is not one. */
function sentencesOf(text) {
  const parts = String(text)
    .split(/(?<=[.!?])\s+(?=[A-Z0-9“"'])/)
    .map((p) => p.trim())
    .filter((p) => p.length > 24);
  return parts.length >= 2 ? parts : [String(text)];
}

/**
 * Describes one slide's content structurally.
 *
 * @param {{title?: string, bullets?: string[]|string}} slide
 * @param {{index: number, total: number}} position
 * @returns {object} the signature — plain data, safe to log and to test.
 */
export function contentSignature(slide, { index, total }) {
  const raw = Array.isArray(slide?.bullets)
    ? slide.bullets.filter((b) => typeof b === "string" && b.trim())
    : slide?.bullets ? [String(slide.bullets)] : [];

  /* Outlines do not reliably arrive as one bullet per point. The generator
   * often returns a single paragraph holding four sentences, and an import
   * gives whatever the original deck had. Counting that as ONE item made
   * itemCount 1 on nearly every slide, which in turn made every signature look
   * alike — so every shortlist led with the same layout and the deck came back
   * uniform, the exact failure the engine exists to prevent.
   *
   * Sentences are the honest unit when a bullet is really a paragraph. Only
   * split when there are several substantial ones, so ordinary prose with an
   * abbreviation in it is left alone. */
  const bullets = raw.length === 1 ? sentencesOf(raw[0]) : raw;
  const title = String(slide?.title || "");
  const body = bullets.join(" ");
  const all = `${title} ${body}`;

  const figures = countOf(all, FIGURE);
  const sequenceMarks = countOf(all, SEQUENCE);
  /* Entries that read as a person: short enough to be "Name — Role" rather
   * than a paragraph, and carrying a role. 90 characters is generous for a
   * name and title and far below any real sentence about a business problem. */
  const peopleEntries = bullets.filter((b) => b.length <= 90 && PERSON_ROLE.test(b)).length;

  return {
    index,
    isFirst: index === 0,
    isLast: index === total - 1,

    itemCount: bullets.length,
    // Longest single item matters more than the mean: one long paragraph in a
    // card layout is what overflows, not five short ones.
    longestItem: bullets.reduce((n, b) => Math.max(n, b.length), 0),
    totalChars: all.length,
    titleChars: title.length,

    figureCount: figures,
    /* "This slide is ABOUT numbers" — not merely "contains one". A single
     * figure inside a sentence is prose; three or more, or more figures than
     * bullets, is a stat slide. */
    isNumeric: figures >= 3 || (figures >= 2 && figures >= bullets.length),

    sequenceCount: sequenceMarks,
    isSequence: sequenceMarks >= 3 || (sequenceMarks >= 2 && bullets.length >= 3),

    isComparison: COMPARISON.test(all),
    /* A ROSTER, not prose that mentions a job title.
     *
     * The old rule was "a role word appears anywhere, and there are two or more
     * bullets". A hospital board slide titled "Three root causes" — about
     * theatre utilisation, vacancy rates and cancellations — says "anaesthetic
     * consultant" once and "Clinical Director" once, and that was enough to
     * send eight numbers and three long paragraphs to a team-photo layout with
     * three faces on it. `people` is weighted above `numeric`, so it won
     * outright.
     *
     * A real team slide looks completely different: most of its entries are
     * short, and each one carries a role, because each one IS a person. */
    // A list of owners and roles ("CFO reprices the book: ...") names roles in
    // running sentences; a team list is entries of a name and a role, with no
    // colon. Most colons means a list of decisions or risks, not a team.
    isPeople: peopleEntries >= 2 && peopleEntries >= bullets.length * 0.6 &&
      bullets.filter((b) => b.includes(":")).length < bullets.length / 2,
    isQuote: QUOTE.test(all),
    /* Only meaningful alongside isQuote. Scoring uses it to prefer a layout
     * with an attribution slot over one that would drop the speaker. */
    hasAttribution: QUOTE.test(all) && ATTRIBUTION.test(all),
    isAgenda: AGENDA.test(all),
    isAwards: AWARD.test(all),
    wantsVisual: VISUAL.test(all),
    /* Read by photo-selection, not by template scoring: a serious slide can
     * still want a photograph, it just must not be a celebratory one. */
    isGrave: GRAVE.test(all),

    /* One assertion and little else — the slide that earns a dark, quiet
     * treatment. Deliberately narrow: at most one bullet, and short. */
    isAssertion: bullets.length <= 1 && all.length < 220 && !AGENDA.test(all),

    /** Rough words-per-slide, used to prefer denser or airier layouts. */
    density: bullets.length === 0 ? "sparse" : all.length / Math.max(1, bullets.length) > 140 ? "heavy" : "normal",
  };
}

/** Signatures for a whole outline, in order. */
export function outlineSignatures(outline = []) {
  return outline.map((slide, index) => contentSignature(slide, { index, total: outline.length }));
}

/** Which analysis `kind` implies which regex-derived boolean on the
 *  signature. `content` (and any kind not listed here) means "nothing more
 *  specific than ordinary content" and leaves every boolean untouched. */
const KIND_TO_FLAG = {
  numeric: "isNumeric",
  sequence: "isSequence",
  comparison: "isComparison",
  people: "isPeople",
  quote: "isQuote",
  agenda: "isAgenda",
  awards: "isAwards",
  visual: "wantsVisual",
  assertion: "isAssertion",
};

/**
 * Folds one slide's LLM content analysis onto its regex-derived signature.
 *
 * The regex signature is a FLOOR, not a ceiling: it is cheap, deterministic
 * and already right most of the time, and template scoring depends on that.
 * The model sees the whole slide the way a person would and can catch what a
 * pattern can't — a quote with no quotation marks, a comparison phrased
 * without "vs" — so its verdict is allowed to turn a false boolean true. It
 * is never allowed to turn a regex-confirmed true back to false: a slide
 * regex already proved has three currency figures on it IS numeric, no
 * matter what the model's structural read of it says. Analysis adds signal;
 * it does not get to erase one already earned.
 *
 * @param {object} sig  a contentSignature() result
 * @param {{kind?: string}} a  one slide's entry from analyzeOutline()
 * @returns {object} a new signature — `sig` is not mutated
 */
export function applyAnalysis(sig, a) {
  if (!sig || !a || typeof a !== "object") return sig;
  const out = { ...sig, analysis: a };
  const flag = KIND_TO_FLAG[a.kind];
  if (flag) out[flag] = true;
  return out;
}
