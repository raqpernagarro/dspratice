// js/brief-check.js
// =============================================================================
// What does a prompt already tell us? One answer, for the browser and server.
//
// The home composer ticks five pills as the prompt covers them, and the coach
// form (v2: opens at every Generate) asks about the content still missing. Both sides must
// agree on what "missing" means — a coach that asks about something the pills
// show covered is worse than no coach — so the rules live once, here, in js/:
// the one tree served to the browser as well as read by the server (see
// js/field-kind.js for the same arrangement).
//
// These are deliberately plain text checks. They are advisory: a false tick
// only means the coach does not ask, and a missed tick means one extra
// skippable question. The fixtures in test/brief-check.test.js record which
// misreads were accepted on purpose.
// =============================================================================

export const DIMENSIONS = ["audience", "goal", "points", "figures", "length"];

/** The content questions the coach form asks when missing (audience and goal
 *  merge into one when both are) — a culture deck may have no figures, and
 *  the length question is asked always, on its own terms. */
export const CORE_DIMENSIONS = ["audience", "goal", "points"];

export const MAX_QUESTIONS = 4;

export const LABELS = {
  audience: "Audience",
  goal: "Goal",
  points: "Key points",
  figures: "Figures",
  length: "Length",
};

/** One phrase per pill, shown on hover/focus. */
export const EXAMPLES = {
  audience: "For the executive committee of a regional bank",
  goal: "So that they approve a two-week pilot",
  points: "Why now; our approach; two case results; the ask",
  figures: "Revenue €412M (+8%), EBITDA margin 9.1%",
  length: "Eight slides covering the market, our offer and the ask",
};

/** Asked when the model cannot be: on error, timeout, usage limit or bad output. */
export const FALLBACK_QUESTIONS = {
  audience: { question: "Who will see this deck?", placeholder: "Bank CIOs at a prospect" },
  goal: { question: "What should they decide or do afterwards?", placeholder: "Agree to a two-week pilot" },
  points: { question: "What 3–5 points must it make?", placeholder: "Why now; our approach; two case results; the ask" },
  figures: { question: "Which figures or results can it cite?", placeholder: "40% faster claims handling at a European insurer" },
  length: { question: "Roughly how many slides?", placeholder: "8" },
};

const NUMBER_WORDS =
  "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|" +
  "fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty";

/** "8 slides", "10-slide", "eight-slide", "three-slide summary". */
const SLIDE_COUNT = new RegExp(`\\b(?:\\d{1,3}|${NUMBER_WORDS})[\\s-]+slides?\\b`, "gi");

/** "cover the market, our offer and the ask". */
const NAMED_SECTIONS = /\bcover(?:s|ing)?\b[^.\n]*,[^.\n]*\band\b/i;

/** Roles that name a reader wherever they appear. `\b` keeps "Boardwalk" and
 *  "dashboard" out. */
const STRONG_AUDIENCE =
  /\b(?:board(?:\s+of\s+directors)?|executive\s+committee|exco|steering\s+committee|leadership|management\s+team|investors?|shareholders|c-suite)\b|\b(?:CEO|CFO|CIO|CTO|COO|CMO|CHRO|CISO|CDO)s?\b/gi;

/** Roles that are as often the SUBJECT as the reader ("customer data
 *  platform", "client logos") count only after for/to/at/with, and never when
 *  the next word makes them a thing rather than people. */
const GENERIC_AUDIENCE =
  /\b(?:for|to|at|with)\s+(?:(?:a|an|the|our|their|new|existing|prospective|potential|key)\s+){0,2}(?:[a-z]+\s+)?(?:clients?|customers?|teams?|partners?|prospects?|stakeholders|employees|staff)\b(?!\s+(?:data|interviews?|experience|journey|success|service|base|research|insights?|churn|platform|support|satisfaction|feedback|segments?|logos?|quotes?))/gi;

/** An outcome the audience should reach. "update"/"inform" only as verbs —
 *  "Q3 update" names a deck, not a goal. */
const GOAL =
  /\b(?:approv\w*|decide|deciding|decisions?\s+(?:we\s+need|needed|requested|required|we\s+are\s+asking)|convinc\w*|persuad\w*|to\s+inform|(?:to|and)\s+update|ask(?:s|ing)?(?:\s+for)?|needs?\s+from|recommend\w*|agree\w*|sign[\s-]?off|so\s+that|to\s+get)\b/i;

/** Data numbers. Checked after slide counts are removed, so "a 10-slide deck"
 *  is a Length and never a Figure. */
const FIGURES = [
  /\d(?:[\d,.]*\d)?\s?%/,                                  // 8%, 9.1 %
  /[€$£]\s?\d/,                                            // €412M, $3
  /\b(?:EUR|USD|GBP|CHF)\s?\d/,                            // EUR 250k
  /\d(?:[\d,.]*\d)?\s?(?:k|K|m|M|bn|BN|mn)\b/,             // 250k, 3.4bn, 412M
  /\b\d(?:[\d,.]*\d)?\s+(?:people|employees|staff|customers|clients|users|interviews|projects|countries|offices|sites|stores|outages|hours|days|weeks|months|years|engineers|consultants|units|tickets|incidents)\b/i,
  /\b(?:19|20)\d{2}\b\D{0,24}\d|\d\D{0,24}\b(?:19|20)\d{2}\b/, // a year next to a value
];

const POINTS_MIN_PROSE = 250;

/** @returns {{audience:boolean, goal:boolean, points:boolean, figures:boolean, length:boolean}} */
export function checkBrief(text = "") {
  const t = String(text ?? "");
  return {
    audience: matches(STRONG_AUDIENCE, t) || matches(GENERIC_AUDIENCE, t),
    goal: GOAL.test(t),
    points: hasPoints(t),
    figures: FIGURES.some((re) => re.test(t.replace(SLIDE_COUNT, " "))),
    length: matches(SLIDE_COUNT, t) || NAMED_SECTIONS.test(t),
  };
}

/** `test()` on a /g regex advances lastIndex between calls — reset it so a
 *  second prompt is never checked from the middle. */
function matches(re, text) {
  re.lastIndex = 0;
  const hit = re.test(text);
  re.lastIndex = 0;
  return hit;
}

/** 3+ distinct points: three lines, or one sentence that lists three things
 *  with commas/semicolons and "and", or enough prose once the audience and
 *  length phrases are taken out. */
function hasPoints(t) {
  const lines = t.split("\n").map((l) => l.trim()).filter((l) => l.length > 2);
  if (lines.length >= 3) return true;
  for (const sentence of t.split(/[.!?\n]/)) {
    if (!/[,;]/.test(sentence)) continue;
    const items = sentence.split(/[,;]|\band\b/i).map((s) => s.trim()).filter((s) => s.length > 2);
    if (items.length >= 3) return true;
  }
  const rest = t
    .replace(SLIDE_COUNT, " ")
    .replace(STRONG_AUDIENCE, " ")
    .replace(GENERIC_AUDIENCE, " ")
    .replace(/\s+/g, " ")
    .trim();
  return rest.length >= POINTS_MIN_PROSE;
}

/** Uncovered dimensions, in DIMENSIONS order. */
export function missingFrom(check) {
  return DIMENSIONS.filter((d) => !check?.[d]);
}

/** The fixed questions for these dimensions: known ones only, in spec order,
 *  at most MAX_QUESTIONS (so with all five missing, Length is the one left out). */
export function fallbackQuestions(dimensions = []) {
  return DIMENSIONS
    .filter((d) => dimensions.includes(d))
    .slice(0, MAX_QUESTIONS)
    .map((d) => ({ dimension: d, ...FALLBACK_QUESTIONS[d] }));
}

/** The prompt that is actually sent: the original, unchanged, then one
 *  labelled line per non-blank answer. No answers → the prompt itself, so the
 *  pipeline sees exactly what it would have without the coach. */
export function assembleBrief(prompt, answers = {}) {
  const lines = DIMENSIONS
    .map((d) => [d, String(answers?.[d] ?? "").replace(/\s+/g, " ").trim()])
    .filter(([, value]) => value)
    .map(([d, value]) => `${LABELS[d]}: ${value}`);
  return lines.length ? `${prompt}\n\n${lines.join("\n")}` : prompt;
}

/* ---- Coach v2 — the question form at every Generate ------------------------
   One shape for every question, browser and server alike:
     { id, question, why?, options: [{value, label}], multi, freeText, placeholder? }
   The browser opens the form with coachQuestions() straight away; the server
   answers the same set, with the model's tailored options where it could. */

/** Every id the form can ask, in the order it asks them (spec §0). */
export const COACH_ORDER = ["audience", "goal", "points", "references", "hook", "length", "figures"];

/** Content questions: the model may tailor their wording and options. */
export const TAILORED = ["audience", "goal", "points", "figures"];

const opt = (value, label = value) => ({ value, label });

export const HOOK_WHY =
  "A hook gives the audience a reason to care before the facts arrive, and the closing " +
  "slide returns to it — it is what turns a set of slides into a story.";

const LENGTH_COUNTS = { "~5": 5, "8-10": 9, "12-15": 13 };
const MAX_COACH_SLIDES = 60;

/** The length question's note. A number counts the whole deck — with a hook,
 *  the hook is one of those slides. */
export function lengthWhy(hook = "yes") {
  return hook === "no"
    ? "Optional. A number counts the whole deck — it includes the cover."
    : "Optional. A number counts the whole deck — it includes the cover and the hook.";
}

const FIXED = {
  audience: () => ({
    id: "audience", question: FALLBACK_QUESTIONS.audience.question,
    options: [opt("Executive committee"), opt("Client prospect"), opt("Internal team")],
    multi: false, freeText: true, placeholder: FALLBACK_QUESTIONS.audience.placeholder,
  }),
  /** Audience and goal both missing: one question, still id `audience`. */
  audienceGoal: () => ({
    id: "audience", question: "Who is it for, and what should they do afterwards?",
    options: [opt("Executive committee"), opt("Client prospect"), opt("Internal team")],
    multi: false, freeText: true, placeholder: "Bank CIOs — agree to a two-week pilot",
  }),
  goal: () => ({
    id: "goal", question: FALLBACK_QUESTIONS.goal.question,
    options: [opt("Approve a decision"), opt("Agree on next steps"), opt("Understand where things stand")],
    multi: false, freeText: true, placeholder: FALLBACK_QUESTIONS.goal.placeholder,
  }),
  points: () => ({
    id: "points", question: FALLBACK_QUESTIONS.points.question,
    options: [], multi: true, freeText: true, placeholder: FALLBACK_QUESTIONS.points.placeholder,
  }),
  figures: () => ({
    id: "figures", question: FALLBACK_QUESTIONS.figures.question,
    options: [], multi: true, freeText: true, placeholder: FALLBACK_QUESTIONS.figures.placeholder,
  }),
  references: () => ({
    id: "references",
    question: "Do you have material this should draw on — a proposal, report, notes or an old deck?",
    why: "The deck will go much deeper with it.",
    options: [opt("attach", "Attach a file"), opt("paste", "Paste text"), opt("none", "No, work from my prompt")],
    multi: false, freeText: false,
  }),
  hook: () => ({
    id: "hook", question: "Open with a hook?", why: HOOK_WHY,
    options: [opt("yes", "Yes, open with a hook (recommended)"), opt("no", "No, start with the content")],
    multi: false, freeText: false,
  }),
  length: () => ({
    id: "length", question: "How long should it be?", why: lengthWhy("yes"),
    options: [opt("you-decide", "You decide — no limitations"), opt("~5", "About 5"), opt("8-10", "8–10"), opt("12-15", "12–15")],
    multi: false, freeText: true, placeholder: "Or type a number",
  }),
};

/** The content questions the checklist says are needed, in order. */
export function contentQuestionIds(check) {
  return coachQuestions(check, { hasReferences: true })
    .map((q) => q.id)
    .filter((id) => TAILORED.includes(id));
}

/** True when audience and goal are both missing (asked as one question). */
export const mergesAudienceGoal = (check) => !check?.audience && !check?.goal;

/** The fixed form for a checked prompt — what opens at once, and the
 *  server's answer whenever the model cannot tailor it. Figures never appear
 *  here: only the model can say a topic needs them. */
export function coachQuestions(check, { hasReferences = false } = {}) {
  const out = [];
  if (!check?.audience) out.push(check?.goal ? FIXED.audience() : FIXED.audienceGoal());
  else if (!check?.goal) out.push(FIXED.goal());
  if (!check?.points) out.push(FIXED.points());
  if (!hasReferences) out.push(FIXED.references());
  out.push(FIXED.hook(), FIXED.length());
  return out;
}

/** The fixed figures question, for when the model asks one. */
export const figuresQuestion = () => FIXED.figures();

/** A length answer as a slide count: an option, or the first number typed;
 *  "you decide", nonsense or an out-of-range number is no count. */
function slideCountOf(value) {
  if (value == null) return null;
  const v = String(value).trim();
  if (!v || v === "you-decide") return null;
  if (v in LENGTH_COUNTS) return LENGTH_COUNTS[v];
  const m = v.match(/\d+/);
  if (!m) return null;
  const n = Number(m[0]);
  return n >= 1 && n <= MAX_COACH_SLIDES ? n : null;
}

/**
 * The form's answers as the generation request's fields. `answers` keeps only
 * the content answers (string, non-blank) — those, and only those, are what
 * assembleBrief folds into the prompt; the hook, length and references go as
 * their own fields.
 *   { hook: "yes"|"no", length: option value or typed text, references: id[],
 *     audience|goal|points|figures: text }
 */
export function coachPayload(answers = {}) {
  const content = {};
  for (const id of TAILORED) {
    const text = String(answers?.[id] ?? "").replace(/\s+/g, " ").trim();
    if (text) content[id] = text;
  }
  return {
    wantsHook: answers?.hook !== "no",
    slideCount: slideCountOf(answers?.length),
    referenceIds: Array.isArray(answers?.references)
      ? answers.references.filter((id) => typeof id === "string" && id)
      : [],
    answers: content,
  };
}
