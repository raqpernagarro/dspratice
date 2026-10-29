# Prompt Coach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The home composer shows a live five-pill checklist of what the prompt covers, and on Generate asks 2–4 short follow-up questions when audience, goal or key points are missing — never blocking, with "Skip and generate" always available.

**Architecture:** One pure module, `js/brief-check.js`, holds the checklist rules, fallback questions and brief assembly; the browser and the server both import it, so the coach asks about exactly what the pills show missing. A new `POST /api/briefs/coach` route delegates to `BriefService`, which makes one short Haiku call through `ClaudeCliProvider.coachBrief` under a 10s wall-clock limit and falls back to fixed questions on any failure. Answers are folded into the prompt client-side (`assembleBrief`) and sent to the unchanged `POST /api/generations`, which also stores an optional `coaching` record.

**Tech Stack:** Node 20+ ESM, Express, `node --test`, Claude CLI provider (`claude -p --model haiku --json-schema`), vanilla browser JS + `product/ui/app.css` tokens.

**Spec:** `docs/superpowers/specs/2026-10-15-prompt-coach-design.md`

## Global Constraints

- Five pills, in this order and with these labels: Audience, Goal, Key points, Figures, Length. Re-evaluated on input, debounced ~150ms (`PILL_DEBOUNCE_MS = 150`).
- Pills show once the prompt is non-empty **and** no attachment is staged. Advisory only: never disable Generate, never edit the prompt.
- Coach trigger: Generate on the prompt path, with any of **audience, goal, points** missing. Figures and length alone never trigger it. With a .pptx attached: no checklist, no coach, import path unchanged.
- Panel heading, verbatim: *"A few details will make this deck much better"*. Buttons, verbatim: **Generate** and **Skip and generate**. Esc, or editing the prompt, closes the panel.
- Endpoint `POST /api/briefs/coach`, authenticated like `/api/generations`. Request `{ prompt, missing }`; response `{ questions: [{ dimension, question, placeholder }], source: "model"|"fallback" }`.
- Coach model call: one call, `--model haiku`, strict JSON schema, **10s** wall-clock from the request including any wait for a CLI slot (`MAX_CONCURRENT_CLAUDE = 2`), enforced in `BriefService`.
- At most **4** questions; only for dimensions the checklist shows missing (plus an optional figures question when figures is uncovered); never for a covered dimension.
- Any error, timeout, usage limit ("You've hit your session limit") or malformed output → the fixed fallback questions, `source: "fallback"`. The user never sees an error.
- Fallback questions, verbatim:
  - audience — "Who will see this deck?" / "Bank CIOs at a prospect"
  - goal — "What should they decide or do afterwards?" / "Agree to a two-week pilot"
  - points — "What 3–5 points must it make?" / "Why now; our approach; two case results; the ask"
  - figures — "Which figures or results can it cite?" / "40% faster claims handling at a European insurer"
  - length — "Roughly how many slides?" / "8"
- Brief assembly: original prompt unchanged, a blank line, then `Audience: …`, `Goal: …`, `Key points: …`, `Figures: …`, `Length: …`; blank answers omitted; no answers → prompt returned unchanged.
- `coaching` record shape: `{ missing: [], asked: [], answered: [], source, skipped }`. Stored on the generation record; changes nothing about generation.
- CSS: namespace new classes `.brief-*` and `.coach-*`/`.coach__*`. Never the bare names `.nav`, `.btn`, `.card`, `.panel`, `.chip`, `.edge`, `.stage`. Use the app tokens (`--ink`, `--ink-muted`, `--c-lift`, `--c-edge`, `--c-accent`, `--panel-bg`, `--raised-bg`, `--on-accent`, `--mint-green`) so dark (default) and light both work; 640px is the phone breakpoint.
- Model text is rendered with `textContent` only, never `innerHTML`.
- After any change under `product/`, restart the server (`npm start`, port 4600) before checking anything in the browser. Node caches modules and CSS is served no-store, so a stale server looks current. A restart signs the user out (no `SESSION_SECRET` is set) — warn them before restarting.
- `npm test` stays green (344 passing + the new tests) after every task.
- Commit locally after each verified task; never push. Every commit message ends with:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
- `docs/CHANGELOG.md` gets one entry at the top (append-only, newest first) when the feature ships.

## Review Focus

1. **Model output carrying markup** (`<img onerror=…>` in a question or placeholder) — it must render as literal text. Pinned by a service test in Task 3 (text passes through as a plain trimmed string) and by Task 6's use of `textContent`/`placeholder` assignment only.
2. **The CLI queue is full** (two decks composing, so the coach call waits for a slot) — the panel must still fill within ~10s, with fallback questions. Pinned by Task 3's "provider that never resolves" test.
3. **The person edits the prompt or presses Esc while questions are loading** — the late answer must be discarded, never reopen the panel or start a build. Pinned by the stale-token guard in Task 6 and its browser check.
4. **The client's `missing` disagrees with the prompt** (stale, junk, or names a covered dimension) — the server re-checks the prompt and never asks about a covered dimension. Pinned by Task 3's "covered dimension in `missing`" test.
5. **Nothing left to ask** (the server returns zero questions) — the UI must generate straight away, not show an empty panel. Pinned by Task 3's empty-ask test and Task 6's `!answer.questions.length` branch.

---

### Task 1: The shared checklist module (`js/brief-check.js`)

**Files:**
- Create: `js/brief-check.js`
- Create: `tools/briefs.mjs` (the ten briefs, moved out of `tools/generate-briefs.mjs` verbatim)
- Modify: `tools/generate-briefs.mjs:35-74` (replace the `BRIEFS` array with an import)
- Test: `test/brief-check.test.js`

**Interfaces:**
- Produces (all named exports of `js/brief-check.js`, pure, no DOM):
  - `DIMENSIONS: ["audience","goal","points","figures","length"]`
  - `CORE_DIMENSIONS: ["audience","goal","points"]`
  - `LABELS: Record<dimension, string>` — "Audience", "Goal", "Key points", "Figures", "Length"
  - `EXAMPLES: Record<dimension, string>` — one example phrase per pill
  - `FALLBACK_QUESTIONS: Record<dimension, { question: string, placeholder: string }>`
  - `MAX_QUESTIONS = 4`
  - `checkBrief(text: string) → { audience, goal, points, figures, length }` (booleans)
  - `missingFrom(check) → dimension[]` (in `DIMENSIONS` order)
  - `needsCoaching(check) → boolean` (any core dimension false)
  - `fallbackQuestions(dimensions: string[]) → { dimension, question, placeholder }[]` (known dimensions only, `DIMENSIONS` order, capped at 4)
  - `assembleBrief(prompt: string, answers: Record<dimension, string>) → string`
- `tools/briefs.mjs` exports `BRIEFS: { tag, prompt }[]` (the same ten objects).

- [ ] **Step 1: Move the briefs into their own module**

Create `tools/briefs.mjs`:

```js
// tools/briefs.mjs
// =============================================================================
// The ten test briefs. Shared by tools/generate-briefs.mjs, which runs them
// through a live server, and test/brief-check.test.js, which fixtures the
// prompt checklist on them — one list, so the two never drift apart.
// =============================================================================
export const BRIEFS = [
  // ← paste lines 36-73 of tools/generate-briefs.mjs here unchanged
  //   (the ten { tag, prompt } objects, finance-review … exec-summary)
];
```

Cut the ten objects from `tools/generate-briefs.mjs` (the array body between `const BRIEFS = [` and `];`) and paste them into the array above. Then in `tools/generate-briefs.mjs` replace the whole `const BRIEFS = [ … ];` statement with:

```js
import { BRIEFS } from "./briefs.mjs";
```

(ESM hoists imports, so leaving it where the array was is valid; keep it there so the header comment above still introduces it.)

Run: `node -e "import('./tools/briefs.mjs').then(m => console.log(m.BRIEFS.length, m.BRIEFS.map(b => b.tag).join(' ')))"`
Expected: `10 finance-review grave-operations culture architecture capability credentials roadmap decision research exec-summary`

- [ ] **Step 2: Write the failing tests**

Create `test/brief-check.test.js`:

```js
// test/brief-check.test.js
// =============================================================================
// The prompt checklist: deterministic text checks that tick the five pills
// under the composer, and decide whether the coach opens at Generate.
//
// The ten briefs from tools/generate-briefs.mjs are the fixture. Each row of
// EXPECTED is what that brief really says — read by a person, not derived from
// the regexes — so a rule that drifts shows up as a named brief, not a count.
// None of the ten contains an actual number, which is why Figures has its own
// positive cases below.
// =============================================================================
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  DIMENSIONS, CORE_DIMENSIONS, LABELS, EXAMPLES, FALLBACK_QUESTIONS, MAX_QUESTIONS,
  checkBrief, missingFrom, needsCoaching, fallbackQuestions, assembleBrief,
} from "../js/brief-check.js";
import { BRIEFS } from "../tools/briefs.mjs";

const A = "audience", G = "goal", P = "points", F = "figures", L = "length";
const EXPECTED = {
  "finance-review":   [A, G, P, L],    // "for the board", "the decisions we need"
  "grave-operations": [A, G, P, L],    // "what we need from the board"
  "culture":          [P, L],
  "architecture":     [A, G, P, L],    // "engineering leadership", "the decision we are asking for"
  "capability":       [A, P, L],       // "to a new client"
  "credentials":      [P, L],          // "client logos", "client quotes" are content, not readers
  "roadmap":          [A, P, L],       // "unlocks for customers" — accepted false positive (spec review)
  "decision":         [G, P, L],       // "customer data platform" is not an audience
  "research":         [G, P, L],       // "customer interviews" is not an audience
  "exec-summary":     [G, P, L],       // "the decision requested"
};

const ticked = (text) => DIMENSIONS.filter((d) => checkBrief(text)[d]);

describe("the ten test briefs tick what they really contain", () => {
  for (const { tag, prompt } of BRIEFS) {
    test(tag, () => assert.deepEqual(ticked(prompt), EXPECTED[tag]));
  }
});

describe("weak prompts", () => {
  for (const prompt of ["a deck about our AI offering", "Q3 update", "intro to our design team"]) {
    test(`"${prompt}" ticks at most one item`, () => {
      assert.ok(ticked(prompt).length <= 1, `ticked: ${ticked(prompt)}`);
    });
  }
  test("an empty prompt ticks nothing", () => assert.deepEqual(ticked(""), []));
});

describe("figures", () => {
  for (const prompt of [
    "Revenue €412M (+8%), EBITDA margin 9.1%",
    "40% faster claims handling",
    "1,200 employees in 14 countries",
    "sales of 3.4bn in 2025",
    "a budget of EUR 250k",
  ]) {
    test(`"${prompt}" counts as Figures`, () => assert.equal(checkBrief(prompt).figures, true));
  }
  test('"a 10-slide deck" is Length, not Figures', () => {
    const r = checkBrief("a 10-slide deck");
    assert.equal(r.length, true);
    assert.equal(r.figures, false);
  });
  test("a slide count in words is not a figure either", () => {
    assert.equal(checkBrief("an eight-slide deck").figures, false);
  });
});

describe("audience", () => {
  test('"Board" inside a company name does not count', () => {
    assert.equal(checkBrief("A deck for Boardwalk Ltd").audience, false);
  });
  test("a strong role counts anywhere", () => {
    assert.equal(checkBrief("Q3 numbers, the board will read it").audience, true);
    assert.equal(checkBrief("What the CFO needs to know").audience, true);
  });
  test("a generic role counts only after for/to/at/with", () => {
    assert.equal(checkBrief("introducing us to a new client").audience, true);
    assert.equal(checkBrief("options for our customer data platform").audience, false);
    assert.equal(checkBrief("twenty customer interviews").audience, false);
  });
});

describe("goal and length", () => {
  test("the widened goal phrases count", () => {
    for (const p of ["the decisions we need", "the decision requested", "what we need from them", "the budget we ask for"]) {
      assert.equal(checkBrief(p).goal, true, p);
    }
  });
  test('"update" counts only as a verb', () => {
    assert.equal(checkBrief("Q3 update").goal, false);
    assert.equal(checkBrief("slides to update the team on Q3").goal, true);
  });
  test("named sections count as Length", () => {
    assert.equal(checkBrief("cover the market, our offer and the ask").length, true);
  });
});

describe("key points", () => {
  test("three lines count", () => assert.equal(checkBrief("Why now\nOur approach\nThe ask").points, true));
  test("a comma list with 'and' counts", () => assert.equal(checkBrief("the market, our offer and the ask").points, true));
  test("a long paragraph counts once audience and length phrases are removed", () => {
    const prose = "We want to explain how our claims platform works end to end " .repeat(5);
    assert.ok(prose.length > 250);
    assert.equal(checkBrief(prose).points, true);
  });
});

describe("coaching decisions", () => {
  test("missingFrom lists uncovered dimensions in order", () => {
    assert.deepEqual(missingFrom(checkBrief("Q3 update")), DIMENSIONS);
    assert.deepEqual(missingFrom(checkBrief("a 10-slide deck")), [A, G, P, F]);
  });
  test("only core dimensions trigger the coach", () => {
    assert.equal(needsCoaching({ audience: true, goal: true, points: true, figures: false, length: false }), false);
    assert.equal(needsCoaching({ audience: false, goal: true, points: true, figures: true, length: true }), true);
  });
  test("fallback questions: known dimensions, spec order, capped at 4", () => {
    const qs = fallbackQuestions(["length", "nonsense", "figures", "points", "goal", "audience"]);
    assert.deepEqual(qs.map((q) => q.dimension), [A, G, P, F]);
    assert.equal(qs.length, MAX_QUESTIONS);
    assert.deepEqual(qs[0], { dimension: A, ...FALLBACK_QUESTIONS.audience });
  });
  test("every dimension has a label, an example and a fallback question", () => {
    for (const d of DIMENSIONS) {
      assert.ok(LABELS[d] && EXAMPLES[d] && FALLBACK_QUESTIONS[d].question && FALLBACK_QUESTIONS[d].placeholder, d);
    }
    assert.deepEqual(CORE_DIMENSIONS, [A, G, P]);
  });
});

describe("assembleBrief", () => {
  const prompt = "A deck about our AI offering";
  test("labelled lines after the original, which is first and unchanged", () => {
    const out = assembleBrief(prompt, { goal: "Agree to a pilot", audience: "Bank CIOs" });
    assert.equal(out, `${prompt}\n\nAudience: Bank CIOs\nGoal: Agree to a pilot`);
  });
  test("blank answers are omitted", () => {
    const out = assembleBrief(prompt, { audience: "  ", points: "Why now; the ask", length: "" });
    assert.equal(out, `${prompt}\n\nKey points: Why now; the ask`);
  });
  test("no answers returns the prompt unchanged", () => {
    assert.equal(assembleBrief(prompt, {}), prompt);
    assert.equal(assembleBrief(prompt, { audience: " " }), prompt);
    assert.equal(assembleBrief(prompt), prompt);
  });
  test("answers are trimmed and kept on one line; unknown keys are ignored", () => {
    const out = assembleBrief(prompt, { figures: "  40% faster\n claims  ", junk: "x" });
    assert.equal(out, `${prompt}\n\nFigures: 40% faster claims`);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `node --test test/brief-check.test.js`
Expected: FAIL — `Cannot find module '…/js/brief-check.js'`

- [ ] **Step 4: Write `js/brief-check.js`**

```js
// js/brief-check.js
// =============================================================================
// What does a prompt already tell us? One answer, for the browser and server.
//
// The home composer ticks five pills as the prompt covers them, and the prompt
// coach asks follow-up questions about the ones still missing. Both sides must
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

/** Only these open the coach at Generate — a culture deck may have no figures,
 *  and the engine already chooses a length. */
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

export function needsCoaching(check) {
  return CORE_DIMENSIONS.some((d) => !check?.[d]);
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
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `node --test test/brief-check.test.js`
Expected: PASS, every test. If a brief row fails, print `ticked(prompt)` for it and fix the rule — never edit `EXPECTED` to match the regex (the rows are what the brief says; the "roadmap" false positive is the only accepted misread).

- [ ] **Step 6: Run the whole suite**

Run: `npm test 2>&1 | tail -8`
Expected: `fail 0`; pass count = 344 + the new tests.

- [ ] **Step 7: Commit**

```bash
git add js/brief-check.js tools/briefs.mjs tools/generate-briefs.mjs test/brief-check.test.js
git commit -m "Prompt coach: shared brief checklist, fallback questions and brief assembly

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Provider — `coachBrief` on the contract and the CLI (Haiku)

**Files:**
- Modify: `product/infrastructure/ai/ai-provider.js` (add `coachBrief` default + typedefs)
- Modify: `product/infrastructure/ai/claude-cli-provider.js` — `runClaude`/`runClaudeNow` (~line 1307-1352) gain a `model` option via a new exported `claudeArgs`; add `COACH_SCHEMA`, exported `buildCoachPrompt`, and `ClaudeCliProvider.coachBrief` (next to `planDeck`, ~line 2045)
- Test: `test/brief-coach.test.js` (provider half; Task 3 appends the service half)

**Interfaces:**
- Consumes: `DIMENSIONS`, `fallbackQuestions` from `js/brief-check.js` (Task 1).
- Produces:
  - `AIProvider#coachBrief({ prompt, ask, optional, timeoutMs }) → Promise<{ questions, fallback: true }>` (default)
  - `ClaudeCliProvider#coachBrief({ prompt, ask: string[], optional: string[], timeoutMs: number }) → Promise<{ questions: {dimension, question, placeholder}[], usage }>` — raw model output; cleaning is the service's job. Throws on any CLI failure.
  - `claudeArgs(prompt, schema, { model }) → string[]` (exported for tests)
  - `buildCoachPrompt({ prompt, ask, optional }) → string` (exported for tests)
  - `COACH_MODEL = "haiku"`

- [ ] **Step 1: Write the failing tests**

Create `test/brief-coach.test.js`:

```js
// test/brief-coach.test.js
// =============================================================================
// The prompt coach: one short model call for follow-up questions, and fixed
// fallback questions whenever that call cannot answer in time or in shape.
// No test here calls a model — providers are stubs, and the CLI provider is
// checked only for what it would send.
// =============================================================================
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { AIProvider } from "../product/infrastructure/ai/ai-provider.js";
import { claudeArgs, buildCoachPrompt, COACH_MODEL } from "../product/infrastructure/ai/claude-cli-provider.js";
import { fallbackQuestions } from "../js/brief-check.js";

describe("provider contract", () => {
  test("the default coachBrief answers with the fallback questions, flagged as such", async () => {
    const out = await new AIProvider().coachBrief({ prompt: "x", ask: ["audience", "goal"] });
    assert.equal(out.fallback, true);
    assert.deepEqual(out.questions, fallbackQuestions(["audience", "goal"]));
  });
});

describe("CLI provider", () => {
  test("the coach call runs on Haiku; other calls keep the default model", () => {
    assert.equal(COACH_MODEL, "haiku");
    const withModel = claudeArgs("p", { type: "object" }, { model: COACH_MODEL });
    assert.deepEqual(withModel.slice(-2), ["--model", "haiku"]);
    assert.ok(!claudeArgs("p", { type: "object" }).includes("--model"));
  });

  test("the prompt carries the brief and asks only about the requested dimensions", () => {
    const p = buildCoachPrompt({ prompt: "A deck about our AI offer", ask: ["audience", "goal"], optional: ["figures"] });
    assert.match(p, /A deck about our AI offer/);
    assert.match(p, /- audience:/);
    assert.match(p, /- goal:/);
    assert.match(p, /figures \(optional\)/);
    assert.doesNotMatch(p, /- points:/);
    assert.doesNotMatch(p, /- length:/);
    assert.match(p, /At most 4 questions/);
  });

  test("a very long brief is cut, so the call stays short", () => {
    const p = buildCoachPrompt({ prompt: "x".repeat(20_000), ask: ["goal"], optional: [] });
    assert.ok(p.length < 6_000, `prompt is ${p.length} chars`);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --test test/brief-coach.test.js`
Expected: FAIL — `coachBrief is not a function` / `claudeArgs` not exported.

- [ ] **Step 3: Add the contract default**

In `product/infrastructure/ai/ai-provider.js`, add near the other typedefs:

```js
/**
 * @typedef {Object} CoachRequest
 * @property {string} prompt - the brief as typed
 * @property {string[]} ask - dimensions to ask about (from js/brief-check.js)
 * @property {string[]} [optional] - dimensions the model MAY ask about if the
 *   topic needs them (today only "figures")
 * @property {number} [timeoutMs]
 */

/**
 * @typedef {Object} CoachQuestion
 * @property {"audience"|"goal"|"points"|"figures"|"length"} dimension
 * @property {string} question
 * @property {string} placeholder
 */
```

Add the import at the top of the file (it is the first import in this file; the header says it has no external dependencies — `js/brief-check.js` is pure and in-repo, so update the header's sentence to "no external dependencies beyond the shared, pure js/brief-check.js"):

```js
import { fallbackQuestions } from "../../../js/brief-check.js";
```

And on `class AIProvider`, after `generateSlide`:

```js
  /**
   * Follow-up questions for a thin brief — the prompt coach. Unlike the
   * methods above this has a working default: a provider that cannot ask
   * still gets the fixed questions, flagged `fallback` so the caller reports
   * source "fallback". The coach must never be the reason Generate fails.
   * @param {CoachRequest} request
   * @returns {Promise<{questions: CoachQuestion[], fallback?: true}>}
   */
  async coachBrief({ ask = [] } = {}) {
    return { questions: fallbackQuestions(ask), fallback: true };
  }
```

- [ ] **Step 4: Thread a `model` option through `runClaude`**

In `product/infrastructure/ai/claude-cli-provider.js`, replace `runClaude` and the head of `runClaudeNow` (~lines 1307-1320) with:

```js
/** The CLI argument list. Exported so a test can check what a call would
 *  send without spawning one. `model` is set only by calls that must be fast
 *  (the prompt coach); everything else keeps the CLI's default model. */
export function claudeArgs(prompt, schema = RESPONSE_SCHEMA, { model } = {}) {
  const args = ["-p", prompt, "--output-format", "json", "--json-schema", JSON.stringify(schema)];
  if (model) args.push("--model", model);
  return args;
}

function runClaude(prompt, schema = RESPONSE_SCHEMA, { timeoutMs, model } = {}) {
  if (typeof prompt === "string" && prompt.length > MAX_PROMPT_CHARS) {
    return Promise.reject(new AiProviderError("That request is too long — try a shorter prompt."));
  }
  return withClaudeSlot(() => runClaudeNow(prompt, schema, { timeoutMs, model }));
}

function runClaudeNow(prompt, schema = RESPONSE_SCHEMA, { timeoutMs = CLAUDE_TIMEOUT_MS, model } = {}) {
  return new Promise((resolve, reject) => {
    execFile(
      "claude",
      claudeArgs(prompt, schema, { model }),
      { timeout: timeoutMs, maxBuffer: MAX_BUFFER },
```

(The rest of `runClaudeNow` is unchanged. `claudeArgs` must be declared above its first use only in the sense of readability — function declarations hoist.)

- [ ] **Step 5: Add the schema, prompt builder and method**

Add `import { DIMENSIONS } from "../../../js/brief-check.js";` beside the file's other imports.

Next to `buildPlanPrompt` (~line 1098), add:

```js
/** The prompt coach runs on the fastest model: its whole budget is 10s,
 *  including any wait for a free CLI slot. */
export const COACH_MODEL = "haiku";

const COACH_BRIEF_CHARS = 4_000;

const COACH_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          dimension: { type: "string", enum: DIMENSIONS },
          question: { type: "string" },
          placeholder: { type: "string" },
        },
        required: ["dimension", "question", "placeholder"],
      },
    },
  },
  required: ["questions"],
};

const COACH_MEANING = {
  audience: "who will see the deck",
  goal: "what the audience should decide or do afterwards",
  points: "the 3–5 points the deck must make",
  figures: "figures, results or data the deck can cite",
  length: "roughly how many slides",
};

export function buildCoachPrompt({ prompt, ask = [], optional = [] }) {
  return [
    "Someone is about to generate a business presentation from this brief:",
    "<brief>",
    String(prompt).slice(0, COACH_BRIEF_CHARS),
    "</brief>",
    "",
    "Before it is built, ask them short follow-up questions about what the brief is missing.",
    "Ask about these, at most one question each:",
    ...ask.map((d) => `- ${d}: ${COACH_MEANING[d]}`),
    ...optional.map((d) => `- ${d} (optional): ${COACH_MEANING[d]} — ask only if this topic clearly needs numbers to be credible`),
    "",
    "Rules:",
    "- At most 4 questions.",
    "- Each question is one plain sentence under 90 characters, specific to this brief's topic, never generic.",
    "- placeholder: a short, concrete example answer for THIS topic, under 60 characters, without quotes.",
    "- Never ask about anything the brief already states.",
    "- Plain English. No numbering, no preamble.",
  ].join("\n");
}
```

On `ClaudeCliProvider`, after `planDeck`:

```js
  /**
   * Follow-up questions for the prompt coach. Returns the model's answer as
   * given — BriefService filters, caps and falls back. Throws on any CLI
   * failure (including "You've hit your session limit"), which the service
   * turns into the fixed questions.
   */
  async coachBrief({ prompt, ask = [], optional = [], timeoutMs } = {}) {
    const envelope = await runClaude(
      buildCoachPrompt({ prompt, ask, optional }),
      COACH_SCHEMA,
      { timeoutMs, model: COACH_MODEL }
    );
    const parsed = readEnvelope(envelope);
    const usage = envelope.usage || {};
    return {
      questions: parsed?.questions,
      usage: { inputTokens: usage.input_tokens ?? 0, outputTokens: usage.output_tokens ?? 0, costUsd: 0 },
    };
  }
```

- [ ] **Step 6: Run the tests**

Run: `node --test test/brief-coach.test.js && npm test 2>&1 | tail -8`
Expected: PASS; `fail 0`.

- [ ] **Step 7: Check the model call by hand once (costs one Haiku call)**

Run:
```bash
node -e "
import('./product/infrastructure/ai/claude-cli-provider.js').then(async ({ claudeCliProvider }) => {
  const t = Date.now();
  const out = await claudeCliProvider.coachBrief({ prompt: 'a deck about our AI offering', ask: ['audience','goal','points'], optional: ['figures'], timeoutMs: 10000 });
  console.log(Date.now() - t, 'ms'); console.log(JSON.stringify(out.questions, null, 2));
}).catch((e) => { console.error('FAILED:', e.message); process.exit(1); });"
```
Expected: 2–4 questions specific to an AI offering, in well under 10000 ms. Record the time in the commit message body. If it takes more than ~8s, stop and tell the user before continuing — the spec's 10s budget would then mostly produce fallback questions.

- [ ] **Step 8: Commit**

```bash
git add product/infrastructure/ai/ai-provider.js product/infrastructure/ai/claude-cli-provider.js test/brief-coach.test.js
git commit -m "Prompt coach: coachBrief on the provider contract, Haiku CLI call

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: `BriefService` — tailoring, caps and fallback

**Files:**
- Create: `product/domain/brief-service.js`
- Test: `test/brief-coach.test.js` (append)

**Interfaces:**
- Consumes: `checkBrief`, `DIMENSIONS`, `CORE_DIMENSIONS`, `MAX_QUESTIONS`, `FALLBACK_QUESTIONS`, `fallbackQuestions` (Task 1); `provider.coachBrief` (Task 2).
- Produces:
  - `COACH_TIMEOUT_MS = 10_000`
  - `class BriefService { constructor(provider, { timeoutMs = COACH_TIMEOUT_MS } = {}); coach(context, { prompt, missing }) → Promise<{ questions, source: "model"|"fallback" }> }`
  - `sanitizeCoaching(raw) → { missing, asked, answered, source, skipped } | null` (used by Task 4)

- [ ] **Step 1: Append the failing tests**

Append to `test/brief-coach.test.js`:

```js
import { BriefService, sanitizeCoaching, COACH_TIMEOUT_MS } from "../product/domain/brief-service.js";

const WEAK = "a deck about our AI offering"; // misses every dimension
const CTX = { workspaceId: "ws", userId: "u", role: "admin" };
const stub = (coachBrief) => ({ coachBrief });
const q = (dimension, question = `About ${dimension}?`, placeholder = "e.g.") => ({ dimension, question, placeholder });

describe("brief service", () => {
  test("the 10s budget is the spec's", () => assert.equal(COACH_TIMEOUT_MS, 10_000));

  test("tailored questions pass through, in dimension order, source model", async () => {
    let seen;
    const service = new BriefService(stub(async (req) => {
      seen = req;
      return { questions: [q("goal", "What should the CIOs approve?"), q("audience", "Which bank teams will read it?")] };
    }));
    const out = await service.coach(CTX, { prompt: WEAK, missing: ["audience", "goal"] });
    assert.equal(out.source, "model");
    assert.deepEqual(out.questions.map((x) => x.dimension), ["audience", "goal"]);
    assert.equal(out.questions[1].question, "What should the CIOs approve?");
    assert.deepEqual(seen.ask, ["audience", "goal"]);
    assert.deepEqual(seen.optional, ["figures"], "figures is uncovered, so the model may ask about it");
    assert.equal(seen.timeoutMs, COACH_TIMEOUT_MS);
  });

  test("capped at 4", async () => {
    const service = new BriefService(stub(async () => ({
      questions: ["audience", "goal", "points", "figures", "length"].map((d) => q(d)),
    })));
    const out = await service.coach(CTX, { prompt: WEAK, missing: ["audience", "goal", "points", "figures", "length"] });
    assert.equal(out.questions.length, 4);
    assert.deepEqual(out.questions.map((x) => x.dimension), ["audience", "goal", "points", "figures"]);
  });

  test("only missing dimensions: questions about anything else are dropped", async () => {
    const service = new BriefService(stub(async () => ({
      questions: [q("audience"), q("length"), q("goal"), q("goal", "A second goal question?")],
    })));
    const out = await service.coach(CTX, { prompt: WEAK, missing: ["audience", "goal"] });
    assert.deepEqual(out.questions.map((x) => x.dimension), ["audience", "goal"]);
    assert.equal(out.questions[1].question, "About goal?", "one question per dimension, the first one");
  });

  test("a dimension the prompt covers is never asked, whatever `missing` says", async () => {
    let seen;
    const service = new BriefService(stub(async (req) => { seen = req; return { questions: [q("audience"), q("goal")] }; }));
    const prompt = "A deck for the board about our AI offering";
    const out = await service.coach(CTX, { prompt, missing: ["audience", "goal", "bogus"] });
    assert.deepEqual(seen.ask, ["goal"]);
    assert.deepEqual(out.questions.map((x) => x.dimension), ["goal"]);
  });

  test("a core dimension the model skipped is asked with its fallback question", async () => {
    const service = new BriefService(stub(async () => ({ questions: [q("goal", "What should they approve?")] })));
    const out = await service.coach(CTX, { prompt: WEAK, missing: ["audience", "goal", "points"] });
    assert.equal(out.source, "model");
    assert.deepEqual(out.questions.map((x) => x.dimension), ["audience", "goal", "points"]);
    assert.equal(out.questions[0].question, "Who will see this deck?");
    assert.equal(out.questions[1].question, "What should they approve?");
  });

  test("markup in model text stays plain text (the UI renders it with textContent)", async () => {
    const evil = '<img src=x onerror="alert(1)">  Who   reads it?';
    const service = new BriefService(stub(async () => ({ questions: [q("audience", evil, "<b>CIOs</b>")] })));
    const out = await service.coach(CTX, { prompt: WEAK, missing: ["audience"] });
    assert.equal(out.questions[0].question, '<img src=x onerror="alert(1)"> Who reads it?');
    assert.equal(out.questions[0].placeholder, "<b>CIOs</b>");
  });

  test("nothing left to ask → no model call, no questions", async () => {
    let called = false;
    const service = new BriefService(stub(async () => { called = true; return { questions: [] }; }));
    const out = await service.coach(CTX, { prompt: WEAK, missing: [] });
    assert.deepEqual(out, { questions: [], source: "fallback" });
    assert.equal(called, false);
  });

  const FALLBACK = fallbackQuestions(["audience", "goal", "points", "figures"]);
  const ALL = ["audience", "goal", "points", "figures", "length"];
  for (const [name, coachBrief] of [
    ["the provider throws", async () => { throw new Error("Could not run the local Claude CLI"); }],
    ["the usage limit is hit", async () => { throw new Error("You've hit your session limit · resets 4pm"); }],
    ["the output is malformed", async () => ({ questions: "not an array" })],
    ["the output has no usable question", async () => ({ questions: [{ dimension: "goal", question: "   " }, { dimension: "nope", question: "?" }] })],
    ["the provider returns nothing", async () => undefined],
    ["the provider is the contract default", (req) => new AIProvider().coachBrief(req)],
  ]) {
    test(`fallback when ${name}`, async () => {
      const out = await new BriefService(stub(coachBrief)).coach(CTX, { prompt: WEAK, missing: ALL });
      assert.deepEqual(out, { questions: FALLBACK, source: "fallback" });
    });
  }

  test("fallback when the provider is slower than the budget (e.g. queued behind two builds)", async () => {
    const service = new BriefService(stub(() => new Promise(() => {})), { timeoutMs: 40 });
    const started = Date.now();
    const out = await service.coach(CTX, { prompt: WEAK, missing: ALL });
    assert.equal(out.source, "fallback");
    assert.ok(Date.now() - started < 1_000, "answers at the budget, not when the provider finishes");
  });

  test("a missing `missing` means: whatever the prompt does not cover", async () => {
    let seen;
    const service = new BriefService(stub(async (req) => { seen = req; return { questions: [q("goal")] }; }));
    await service.coach(CTX, { prompt: "An eight-slide deck for the board" });
    assert.deepEqual(seen.ask, ["goal", "points", "figures"]);
  });
});

describe("sanitizeCoaching", () => {
  test("keeps the known shape and drops everything else", () => {
    assert.deepEqual(
      sanitizeCoaching({ missing: ["goal", "goal", "x"], asked: ["goal"], answered: [], source: "model", skipped: true, extra: 1 }),
      { missing: ["goal"], asked: ["goal"], answered: [], source: "model", skipped: true }
    );
  });
  test("unknown source becomes null; skipped is strictly boolean", () => {
    assert.deepEqual(sanitizeCoaching({ source: "made-up", skipped: "yes" }),
      { missing: [], asked: [], answered: [], source: null, skipped: false });
  });
  test("anything that is not an object is no coaching at all", () => {
    for (const v of [undefined, null, "x", 3, ["goal"]]) assert.equal(sanitizeCoaching(v), null);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --test test/brief-coach.test.js`
Expected: FAIL — `Cannot find module '…/product/domain/brief-service.js'`

- [ ] **Step 3: Write `product/domain/brief-service.js`**

```js
// =============================================================================
// Brief Service — the prompt coach, Domain Layer.
//
// Turns a thin brief into 2–4 follow-up questions. One short model call asks
// them in the brief's own terms; anything that goes wrong — an error, the 10s
// budget, a usage limit, an answer in the wrong shape — returns the fixed
// questions instead. The person at the composer never sees an error from this:
// the coach is help, and help that fails must fail quietly.
//
// The server re-checks the prompt with the same rules the browser uses
// (js/brief-check.js), so the coach never asks about something the checklist
// shows covered, whatever the request's `missing` says.
//
// Takes its AIProvider by constructor, like GenerationService, so tests run
// it with a stub and the route chooses the concrete provider.
// =============================================================================
import {
  DIMENSIONS, CORE_DIMENSIONS, MAX_QUESTIONS, FALLBACK_QUESTIONS,
  checkBrief, fallbackQuestions,
} from "../../js/brief-check.js";

/** Wall-clock budget for the whole call, including any wait for a CLI slot. */
export const COACH_TIMEOUT_MS = 10_000;

const MAX_QUESTION_CHARS = 200;
const MAX_PLACEHOLDER_CHARS = 120;

export class BriefService {
  constructor(provider, { timeoutMs = COACH_TIMEOUT_MS } = {}) {
    this.provider = provider;
    this.timeoutMs = timeoutMs;
  }

  /** Backs POST /api/briefs/coach. */
  async coach(_context, { prompt, missing } = {}) {
    if (typeof prompt !== "string" || !prompt.trim()) throw new Error("prompt is required.");

    const check = checkBrief(prompt);
    const uncovered = DIMENSIONS.filter((d) => !check[d]);
    const ask = Array.isArray(missing) ? uncovered.filter((d) => missing.includes(d)) : uncovered;
    const optional = uncovered.includes("figures") && !ask.includes("figures") ? ["figures"] : [];
    if (!ask.length) return { questions: [], source: "fallback" };

    const fallback = { questions: fallbackQuestions(ask), source: "fallback" };

    let answer;
    try {
      answer = await withTimeout(
        this.provider.coachBrief({ prompt, ask, optional, timeoutMs: this.timeoutMs }),
        this.timeoutMs
      );
    } catch {
      return fallback;
    }
    if (!answer || answer.fallback) return fallback;

    const questions = cleanQuestions(answer.questions, new Set([...ask, ...optional]));
    if (!questions.length) return fallback;

    // The coach opened because a core dimension was missing; if the model
    // skipped one, ask it the fixed way rather than not at all.
    for (const d of ask) {
      if (CORE_DIMENSIONS.includes(d) && !questions.some((x) => x.dimension === d)) {
        questions.push({ dimension: d, ...FALLBACK_QUESTIONS[d] });
      }
    }
    const order = (x) => DIMENSIONS.indexOf(x.dimension);
    return { questions: questions.sort((a, b) => order(a) - order(b)).slice(0, MAX_QUESTIONS), source: "model" };
  }
}

/** One question per allowed dimension (the first), as plain trimmed text. */
function cleanQuestions(raw, allowed) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const item of raw) {
    const dimension = item?.dimension;
    if (!allowed.has(dimension) || seen.has(dimension)) continue;
    const question = oneLine(item.question);
    if (!question || question.length > MAX_QUESTION_CHARS) continue;
    const placeholder = oneLine(item.placeholder);
    seen.add(dimension);
    out.push({
      dimension,
      question,
      placeholder: placeholder && placeholder.length <= MAX_PLACEHOLDER_CHARS
        ? placeholder
        : FALLBACK_QUESTIONS[dimension].placeholder,
    });
  }
  return out;
}

const oneLine = (value) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");

/** Resolves or rejects with `promise`, or rejects at `ms` — whichever is first.
 *  The CLI's own timeout only starts once a slot frees up; this one starts now. */
function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`The coach did not answer within ${ms}ms.`)), ms);
  });
  return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timer));
}

/**
 * The `coaching` record stored on a generation for later analysis: what was
 * missing, what was asked, what was answered, where the questions came from,
 * and whether the person skipped. Anything else in the request is dropped.
 */
export function sanitizeCoaching(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const dims = (v) => (Array.isArray(v) ? [...new Set(v.filter((d) => DIMENSIONS.includes(d)))] : []);
  return {
    missing: dims(raw.missing),
    asked: dims(raw.asked),
    answered: dims(raw.answered),
    source: raw.source === "model" || raw.source === "fallback" ? raw.source : null,
    skipped: raw.skipped === true,
  };
}
```

- [ ] **Step 4: Run the tests**

Run: `node --test test/brief-coach.test.js && npm test 2>&1 | tail -8`
Expected: PASS; `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add product/domain/brief-service.js test/brief-coach.test.js
git commit -m "Prompt coach: BriefService — tailored questions, cap of 4, quiet fallback

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Routes, storage and the API client

**Files:**
- Create: `product/application/routes/briefs.js`
- Modify: `product/application/server.js:21-22` (import) and `:130` (mount `/api/briefs`)
- Modify: `product/application/routes/generations.js:37-51` (accept `coaching`)
- Modify: `product/domain/generation-service.js:151-160` (`requestGeneration` stores `coaching`)
- Modify: `product/storage/generation-repository.js:91-114` (`insert` keeps `coaching`)
- Modify: `product/ui/lib/api.js:280` (`requestGeneration(prompt, coaching)`, new `coachBrief`)
- Test: `test/brief-routes.test.js`

**Interfaces:**
- Consumes: `BriefService`, `sanitizeCoaching` (Task 3); `claudeCliProvider` (Task 2).
- Produces:
  - `POST /api/briefs/coach` `{ prompt, missing? }` → `200 { questions, source }`; `400` without a prompt or with a non-array `missing`; `401` without a session.
  - `POST /api/generations` accepts optional `coaching`; the generation record (and `GET /api/generations/:id`) carries `coaching` (sanitized object, or `null`).
  - `api.coachBrief(prompt, missing, signal?) → Promise<{ questions, source }>`
  - `api.requestGeneration(prompt, coaching?)`

- [ ] **Step 1: Write the failing route tests**

Create `test/brief-routes.test.js`:

```js
// test/brief-routes.test.js
// =============================================================================
// The prompt coach over real HTTP: POST /api/briefs/coach, and the `coaching`
// record POST /api/generations now stores.
//
// Both servers run with a PATH that has no Claude CLI on it, so every model
// call fails at spawn (ENOENT) in milliseconds: the coach answers with its
// fallback questions and a generation fails fast — but its record, coaching
// included, is still written. Nothing here ever calls a model.
// =============================================================================
import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { startTestServer } from "./helpers/server.js";
import { fallbackQuestions } from "../js/brief-check.js";

const NO_CLAUDE = { PATH: "/usr/bin:/bin" };
let open, closed;

before(async () => {
  [open, closed] = await Promise.all([
    startTestServer({ env: NO_CLAUDE }),                       // auto-login: authenticated
    startTestServer({ env: { ...NO_CLAUDE, AUTO_LOGIN: "0" } }), // no session
  ]);
});
after(async () => { await Promise.all([open?.stop(), closed?.stop()]); });

const post = (server, path, body) => fetch(`${server.origin}${path}`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: server.origin },
  body: JSON.stringify(body),
});

describe("POST /api/briefs/coach", () => {
  test("401 without a session", async () => {
    const res = await post(closed, "/api/briefs/coach", { prompt: "a deck", missing: ["goal"] });
    assert.equal(res.status, 401);
  });

  test("400 without a prompt", async () => {
    for (const body of [{}, { prompt: "   " }, { prompt: 3 }]) {
      const res = await post(open, "/api/briefs/coach", body);
      assert.equal(res.status, 400, JSON.stringify(body));
    }
  });

  test("400 when missing is not a list", async () => {
    const res = await post(open, "/api/briefs/coach", { prompt: "a deck", missing: "goal" });
    assert.equal(res.status, 400);
  });

  test("a model that cannot run still answers — with the fallback questions", async () => {
    const missing = ["audience", "goal", "points", "figures", "length"];
    const res = await post(open, "/api/briefs/coach", { prompt: "a deck about our AI offering", missing });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { questions: fallbackQuestions(missing), source: "fallback" });
  });
});

describe("POST /api/generations with coaching", () => {
  test("401 without a session", async () => {
    const res = await post(closed, "/api/generations", { prompt: "a deck" });
    assert.equal(res.status, 401);
  });

  test("400 without a prompt", async () => {
    const res = await post(open, "/api/generations", { coaching: { skipped: true } });
    assert.equal(res.status, 400);
  });

  test("the coaching record is stored, sanitized, on the generation", async () => {
    const coaching = { missing: ["audience", "goal"], asked: ["audience", "goal"], answered: ["goal"],
      source: "model", skipped: false, note: "dropped" };
    const res = await post(open, "/api/generations", { prompt: "a deck about our AI offering\n\nGoal: Agree to a pilot", coaching });
    assert.equal(res.status, 201);
    const created = await res.json();
    const stored = await (await fetch(`${open.origin}/api/generations/${created.id}`)).json();
    assert.deepEqual(stored.coaching,
      { missing: ["audience", "goal"], asked: ["audience", "goal"], answered: ["goal"], source: "model", skipped: false });
    assert.equal(stored.prompt, "a deck about our AI offering\n\nGoal: Agree to a pilot");
  });

  test("a generation without coaching stores null", async () => {
    const created = await (await post(open, "/api/generations", { prompt: "a deck" })).json();
    const stored = await (await fetch(`${open.origin}/api/generations/${created.id}`)).json();
    assert.equal(stored.coaching, null);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --test test/brief-routes.test.js`
Expected: FAIL — `/api/briefs/coach` 404s; `stored.coaching` is `undefined`.

- [ ] **Step 3: Add the briefs route and mount it**

Create `product/application/routes/briefs.js`:

```js
// =============================================================================
// Brief routes — the prompt coach, Application Layer.
//
// Thin by construction, like every route file here: parse, authorize,
// delegate to BriefService, map errors. This is also the composition root for
// the coach's AI provider, the same way routes/generations.js is for
// generation — swap the provider here and nowhere else.
// =============================================================================
import { Router } from "express";
import { BriefService } from "../../domain/brief-service.js";
import { claudeCliProvider } from "../../infrastructure/ai/claude-cli-provider.js";
import { requireAuth } from "../middleware/authorization.js";
import { sendError, respondWithError } from "../http-errors.js";

const briefService = new BriefService(claudeCliProvider);

export const briefsRouter = Router();

briefsRouter.use(requireAuth());

// ---- POST /api/briefs/coach -------------------------------------------------
// Always 200 with questions for a valid request: every model failure is the
// service's fallback, never an error the composer has to show.
briefsRouter.post("/coach", async (req, res) => {
  const { prompt, missing } = req.body || {};
  if (typeof prompt !== "string" || !prompt.trim()) {
    return sendError(res, 400, "prompt is required.");
  }
  if (missing !== undefined && !Array.isArray(missing)) {
    return sendError(res, 400, "missing must be a list.");
  }

  try {
    res.json(await briefService.coach(req.context, { prompt, missing }));
  } catch (err) {
    respondWithError(res, err, "Could not prepare follow-up questions.");
  }
});
```

In `product/application/server.js`, add beside the other route imports:

```js
import { briefsRouter } from "./routes/briefs.js";
```

and beside `app.use("/api/generations", generationsRouter);`:

```js
app.use("/api/briefs", briefsRouter);
```

- [ ] **Step 4: Store `coaching` on the generation**

`product/application/routes/generations.js`, in `POST /`:

```js
  const { prompt, coaching } = req.body || {};
  …
    const generation = await generationService.requestGeneration(req.context, { prompt, coaching });
```

`product/domain/generation-service.js` — add `import { sanitizeCoaching } from "./brief-service.js";` beside the other imports, then:

```js
  async requestGeneration(context, { prompt, coaching } = {}) {
    …
    const record = await generationRepository.insert({
      workspaceId: context.workspaceId,
      userId: context.userId,
      prompt,
      // What the prompt coach asked and was told, for later analysis. The
      // answers themselves are already in `prompt`; nothing below reads this.
      coaching: sanitizeCoaching(coaching),
    });
```

`product/storage/generation-repository.js`, in `insert`'s `record` literal, after `imageSource`:

```js
      // The prompt coach's record ({ missing, asked, answered, source,
      // skipped }), sanitized by the domain; null when the coach never opened.
      coaching: data.coaching && typeof data.coaching === "object" ? data.coaching : null,
```

- [ ] **Step 5: API client**

In `product/ui/lib/api.js`, replace the `requestGeneration` line and add `coachBrief` beside it:

```js
  requestGeneration: (prompt, coaching) =>
    request("POST", "/api/generations", coaching ? { prompt, coaching } : { prompt }),
  // Prompt coach. The server answers every model failure with fallback
  // questions, so this only throws when the server itself cannot be reached.
  coachBrief: (prompt, missing, signal) =>
    request("POST", "/api/briefs/coach", { prompt, missing }, signal),
```

- [ ] **Step 6: Run the tests**

Run: `node --test test/brief-routes.test.js && npm test 2>&1 | tail -8`
Expected: PASS; `fail 0`.

- [ ] **Step 7: Restart the server and check the live endpoint**

Tell the user first: "Restarting the server on 4600 to load the new routes — this signs you out of the app." Then stop any running `npm start` (`lsof -ti tcp:4600 | xargs kill`), and start it with the preview tool: `preview_start {name: "api"}` (from `.claude/launch.json`). Then:

```bash
curl -s localhost:4600/api/meta; git rev-parse HEAD
```
Expected: the `commit` in `/api/meta` equals `HEAD` (commit this task first if it does not — the meta is the booted commit).

In the preview tab (auto-login session), run with `javascript_tool`:
```js
await fetch("/api/briefs/coach", { method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt: "a deck about our AI offering", missing: ["audience","goal","points","figures","length"] }) }).then(r => r.json())
```
Expected: `source: "model"`, 3–4 questions about an AI offering, within ~10s. (If `source: "fallback"`, check `preview_logs` and run Task 2 Step 7's timing again before going on.)

- [ ] **Step 8: Commit**

```bash
git add product/application/routes/briefs.js product/application/server.js product/application/routes/generations.js \
  product/domain/generation-service.js product/storage/generation-repository.js product/ui/lib/api.js test/brief-routes.test.js
git commit -m "Prompt coach: POST /api/briefs/coach, coaching stored on generations

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: The live checklist pills

**Files:**
- Modify: `product/ui/index.html` (after `</form>` of `#create-form`, before `#composer-error`)
- Modify: `product/ui/home.js` (imports; pill render/sync; input and attachment listeners)
- Modify: `product/ui/app.css` (new block after the `.composer__error` rules, ~line 3003)

**Interfaces:**
- Consumes: `DIMENSIONS`, `LABELS`, `EXAMPLES`, `checkBrief` from `/js/brief-check.js`.
- Produces: `#brief-pills` (`ul.brief-pills`, one `li.brief-pill[data-dim]` per dimension, `.is-covered` when ticked); `syncPills()` in `home.js`, called by Task 6.

- [ ] **Step 1: Markup**

In `product/ui/index.html`, between `</form>` and `<p class="composer__error" …>`:

```html
        <!-- Brief checklist — five advisory pills that tick as the prompt
             covers each part of a good brief (rules: js/brief-check.js).
             Never blocks Generate, never edits the prompt; hidden while a
             .pptx is staged. Named .brief-* — .chip belongs to Library. -->
        <ul class="brief-pills" id="brief-pills" aria-label="What your prompt covers" hidden></ul>
```

- [ ] **Step 2: Styles**

In `product/ui/app.css`, after `.composer__error[data-tone="notice"] { … }`:

```css
/* ---- Brief checklist — advisory pills under the composer -----------------
   Grey ring = not yet in the prompt; mint check = covered. Same drawn marker
   language as the build view (.build__mark). Hover/focus shows an example. */
.brief-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 10px 0;
  padding: 0;
  list-style: none;
}
.brief-pills[hidden] { display: none; }
.brief-pill {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 12px 5px 8px;
  border-radius: 999px;
  border: 1px solid rgb(var(--c-edge) / .18);
  background: rgb(var(--c-lift) / .04);
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--ink-muted);
  cursor: default;
  transition: color .2s ease, border-color .2s ease;
}
.brief-pill:focus-visible { outline: 2px solid var(--mint-green); outline-offset: 2px; }
.brief-pill__mark {
  position: relative;
  flex: none;
  width: 14px;
  height: 14px;
  box-sizing: border-box;
  border-radius: 999px;
  border: 1.5px solid rgb(var(--c-edge) / .55);
  transition: background .2s ease, border-color .2s ease;
}
.brief-pill.is-covered { color: var(--ink); border-color: rgb(var(--c-accent) / .35); }
.brief-pill.is-covered .brief-pill__mark {
  border-color: rgb(var(--c-accent));
  background: rgb(var(--c-accent));
}
/* The check: two strokes in the on-accent ink over the mint disc. */
.brief-pill.is-covered .brief-pill__mark::after {
  content: "";
  position: absolute;
  left: 3.5px;
  top: 1px;
  width: 3px;
  height: 6px;
  border: solid var(--on-accent);
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg);
}
.brief-pill__tip {
  position: absolute;
  left: 0;
  top: calc(100% + 8px);
  z-index: 5;
  width: max-content;
  max-width: 280px;
  padding: 8px 11px;
  border-radius: 10px;
  border: 1px solid rgb(var(--c-edge) / .2);
  background: var(--raised-bg);
  box-shadow: 0 12px 30px -12px rgb(var(--c-shadow) / var(--shadow-strength));
  color: var(--ink);
  font-size: 12.5px;
  line-height: 1.45;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity .15s ease, visibility .15s;
}
.brief-pill:hover .brief-pill__tip,
.brief-pill:focus-visible .brief-pill__tip { opacity: 1; visibility: visible; }
/* The last pills sit at the right edge on a narrow row: open their tip leftwards. */
.brief-pill:nth-child(n+4) .brief-pill__tip { left: auto; right: 0; }
@media (prefers-reduced-motion: reduce) {
  .brief-pill, .brief-pill__mark, .brief-pill__tip { transition: none; }
}
@media (max-width: 640px) {
  .brief-pills { margin: 10px 0 0; gap: 6px; }
  .brief-pill { font-size: 12.5px; padding: 4px 10px 4px 7px; }
  .brief-pill__tip { max-width: min(240px, calc(100vw - 48px)); }
}
```

- [ ] **Step 3: Behaviour**

In `product/ui/home.js`, add to the imports:

```js
import { DIMENSIONS, LABELS, EXAMPLES, checkBrief } from "/js/brief-check.js";
```

Add after the `/* ---- Composer state */` section's `setBusy`:

```js
/* ---- Brief checklist -------------------------------------------------------
   Five advisory pills under the composer (js/brief-check.js decides what each
   one means). They never block Generate and never touch the prompt; with a
   .pptx staged there is no brief to check, so they hide. */
const pillsEl = document.getElementById("brief-pills");
const PILL_DEBOUNCE_MS = 150;
let pillTimer = null;

function renderPills() {
  pillsEl.innerHTML = DIMENSIONS.map((d) => `
    <li class="brief-pill" data-dim="${d}" tabindex="0" aria-describedby="brief-tip-${d}">
      <span class="brief-pill__mark" aria-hidden="true"></span>
      <span class="brief-pill__label">${LABELS[d]}</span>
      <span class="sr-only brief-pill__state">not yet covered</span>
      <span class="brief-pill__tip" id="brief-tip-${d}" role="tooltip">For example: ${EXAMPLES[d]}</span>
    </li>`).join("");
}

function syncPills() {
  clearTimeout(pillTimer);
  const text = promptInput.value;
  const show = text.trim().length > 0 && attachedFile === null;
  pillsEl.hidden = !show;
  if (!show) return;
  const covered = checkBrief(text);
  for (const li of pillsEl.children) {
    const on = covered[li.dataset.dim];
    li.classList.toggle("is-covered", on);
    li.querySelector(".brief-pill__state").textContent = on ? "covered" : "not yet covered";
  }
}

function schedulePills() {
  clearTimeout(pillTimer);
  pillTimer = setTimeout(syncPills, PILL_DEBOUNCE_MS);
}
```

(`LABELS`/`EXAMPLES` are fixed strings from our own module, so the template literal is safe; nothing user- or model-written goes through `innerHTML`.)

Wire it:
- In `boot()`, directly after `autoGrow();`: `renderPills();`
- In the `promptInput` `input` listener, after `autoGrow();`: `schedulePills();`
- In the `uploadInput` `change` listener, after `syncSubmitState();`: `syncPills();`
- In the `attachmentRemove` `click` listener, after `syncSubmitState();`: `syncPills();`
- In the submit success path, after `autoGrow();` (prompt cleared): `syncPills();`

- [ ] **Step 4: Run the suite**

Run: `npm test 2>&1 | tail -8`
Expected: `fail 0` (`test/pages.smoke.test.js` loads `/` and fails on any thrown error).

- [ ] **Step 5: Verify in the browser**

The change is UI-only (no restart needed — static files are no-store), but if the server is not running, start it with `preview_start {name: "api"}`. On `http://localhost:4600/`:

1. `read_page`: `#brief-pills` is hidden with an empty prompt.
2. Click the prompt, type `a deck about our AI offering` → after ~150ms, `#brief-pills` shows five pills, none `.is-covered` (check with `javascript_tool`: `[...document.querySelectorAll('.brief-pill.is-covered')].map(l => l.dataset.dim)` → `[]`).
3. Clear it and type `An eight-slide deck for the board: the market, our offer and the ask, so that they approve a pilot. Revenue €412M (+8%).` → covered = `["audience","goal","points","figures","length"]`.
4. Focus a pill with Tab → its tip is visible (`getComputedStyle(tip).visibility === "visible"`); screenshot.
5. Attach any `.pptx` from `generate/*/source/` (or create a dummy via `javascript_tool` with a `DataTransfer` on `#upload-pptx-input` and dispatch `change`) → `#brief-pills` hidden; remove it → visible again.
6. `resize_window {colorScheme: "light"}` → screenshot (mint check, readable grey); back to `dark` → screenshot.
7. `resize_window {preset: "mobile"}`, reload, type the step-3 prompt → pills wrap, and `document.documentElement.scrollWidth <= innerWidth` with a tip open (focus the 5th pill). Screenshot. Then `resize_window {preset: "desktop"}`.
8. `read_console_messages {onlyErrors: true}` → none.

- [ ] **Step 6: Commit**

```bash
git add product/ui/index.html product/ui/home.js product/ui/app.css
git commit -m "Prompt coach: live brief checklist under the composer

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: The coach panel at Generate

**Files:**
- Modify: `product/ui/index.html` (coach section after `#brief-pills`)
- Modify: `product/ui/home.js` (coach state, submit refactor, Esc, `generateAndApprove(prompt, coaching)`)
- Modify: `product/ui/app.css` (`.coach*` block after the `.brief-*` block)

**Interfaces:**
- Consumes: `checkBrief`, `missingFrom`, `needsCoaching`, `assembleBrief`, `fallbackQuestions`, `CORE_DIMENSIONS` (Task 1); `api.coachBrief`, `api.requestGeneration(prompt, coaching)` (Task 4); `syncPills` (Task 5).
- Produces: the user-facing flow. No later task depends on new names.

- [ ] **Step 1: Markup**

In `product/ui/index.html`, directly after the `#brief-pills` `<ul>`:

```html
        <!-- Prompt coach — opens on Generate when the brief has no audience,
             goal or key points. Every question is optional; "Skip and
             generate" sends the prompt as typed. Esc, or editing the
             prompt, closes it. Questions are written by the model and set
             with textContent only. -->
        <section class="coach" id="coach" hidden aria-labelledby="coach-title">
          <h2 class="coach__title" id="coach-title">A few details will make this deck much better</h2>
          <form class="coach__form" id="coach-form" novalidate>
            <div class="coach__rows" id="coach-rows"></div>
            <div class="coach__actions">
              <button type="button" class="coach__skip" id="coach-skip">Skip and generate</button>
              <button type="submit" class="coach__go" id="coach-go">Generate</button>
            </div>
          </form>
        </section>
```

- [ ] **Step 2: Styles**

In `product/ui/app.css`, after the `.brief-*` block:

```css
/* ---- Prompt coach — follow-up questions at Generate ---------------------
   A quiet panel under the composer, which stays where it is. Questions load
   into skeleton rows so the panel never jumps from nothing to something. */
.coach {
  margin: 18px 10px 0;
  padding: 20px 22px 18px;
  border-radius: 20px;
  border: 1px solid rgb(var(--c-edge) / .16);
  background: var(--panel-bg);
  animation: shell-rise .28s cubic-bezier(.16,.84,.3,1) both;
}
.coach[hidden] { display: none; }
.coach__title {
  margin: 0 0 16px;
  font-family: var(--font-body);
  font-weight: var(--w-medium);
  font-size: 15px;
  color: var(--ink);
}
.coach__rows { display: flex; flex-direction: column; gap: 14px; }
.coach__row { display: flex; flex-direction: column; gap: 6px; }
.coach__q { font-family: var(--font-body); font-size: 14px; line-height: 1.4; color: var(--ink); }
.coach__input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgb(var(--c-edge) / .2);
  background: rgb(var(--c-lift) / .04);
  font-family: var(--font-body);
  font-size: 14.5px;
  color: var(--ink);
}
.coach__input::placeholder { color: var(--ink-muted); opacity: .7; }
.coach__input:focus { outline: none; border-color: rgb(var(--c-accent) / .55); }
.coach__skeleton {
  display: block;
  border-radius: 8px;
  background: rgb(var(--c-lift) / .07);
  animation: coach-pulse 1.4s ease-in-out infinite;
}
.coach__skeleton--q { width: 55%; height: 14px; }
.coach__skeleton--input { width: 100%; height: 40px; border-radius: 12px; }
@keyframes coach-pulse { 50% { opacity: .45; } }
.coach__actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
}
.coach__skip,
.coach__go {
  padding: 10px 18px;
  border-radius: 999px;
  font-family: var(--font-display);
  font-weight: var(--w-medium);
  font-size: 13.5px;
  cursor: pointer;
}
.coach__skip {
  border: 1px solid rgb(var(--c-edge) / .24);
  background: transparent;
  color: var(--ink-muted);
}
.coach__skip:hover { color: var(--ink); border-color: rgb(var(--c-edge) / .4); }
.coach__go { border: 0; background: var(--mint-green); color: var(--on-accent); }
.coach__go:disabled { opacity: .45; cursor: not-allowed; }
.coach__skip:focus-visible,
.coach__go:focus-visible { outline: 2px solid var(--mint-green); outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) {
  .coach, .coach__skeleton { animation: none; }
}
@media (max-width: 640px) {
  .coach { margin: 14px 0 0; padding: 16px; border-radius: 16px; }
  .coach__actions { flex-direction: column-reverse; align-items: stretch; }
}
```

- [ ] **Step 3: Behaviour — coach state and rendering**

In `product/ui/home.js`, extend the brief-check import:

```js
import {
  DIMENSIONS, CORE_DIMENSIONS, LABELS, EXAMPLES,
  checkBrief, missingFrom, needsCoaching, assembleBrief, fallbackQuestions,
} from "/js/brief-check.js";
```

Add after the brief checklist section:

```js
/* ---- Prompt coach ----------------------------------------------------------
   On Generate, a brief with no audience, goal or key points gets 2–4 short
   questions first. Never blocking: every answer is optional, "Skip and
   generate" sends the prompt as typed, and Esc or editing the prompt closes
   the panel. Answers are folded into the prompt (assembleBrief), so the
   generation pipeline sees nothing new. */
const coachEl = document.getElementById("coach");
const coachForm = document.getElementById("coach-form");
const coachRows = document.getElementById("coach-rows");
const coachGo = document.getElementById("coach-go");
const coachSkip = document.getElementById("coach-skip");

// The server answers within ~10s whatever the model does; this only covers
// the server itself being unreachable.
const COACH_CLIENT_TIMEOUT_MS = 15_000;

/** The open coach, or null. A late answer for a closed coach is dropped by
 *  comparing tokens, so it can never reopen the panel or start a build. */
let coach = null;

function openCoach(prompt, missing) {
  const token = Symbol("coach");
  coach = { token, prompt, missing, questions: null, source: null };
  coachGo.disabled = true;
  coachRows.innerHTML = missing
    .filter((d) => CORE_DIMENSIONS.includes(d))
    .map(() => `
      <div class="coach__row" aria-hidden="true">
        <span class="coach__skeleton coach__skeleton--q"></span>
        <span class="coach__skeleton coach__skeleton--input"></span>
      </div>`).join("");
  coachEl.setAttribute("aria-busy", "true");
  coachEl.hidden = false;
  loadQuestions(token, prompt, missing);
}

function closeCoach() {
  coach = null;
  coachEl.hidden = true;
  coachEl.removeAttribute("aria-busy");
  coachRows.replaceChildren();
}

async function loadQuestions(token, prompt, missing) {
  let answer;
  try {
    answer = await api.coachBrief(prompt, missing, AbortSignal.timeout(COACH_CLIENT_TIMEOUT_MS));
  } catch {
    answer = { questions: fallbackQuestions(missing), source: "fallback" };
  }
  if (!coach || coach.token !== token) return; // closed, or replaced, meanwhile

  if (!answer?.questions?.length) {
    // Nothing worth asking after all: generate as if the coach never opened.
    closeCoach();
    runGeneration(prompt, { missing, asked: [], answered: [], source: answer?.source ?? null, skipped: false });
    return;
  }
  coach.questions = answer.questions;
  coach.source = answer.source;
  renderQuestions(answer.questions);
}

/** Model-written text: textContent and the placeholder property only. */
function renderQuestions(questions) {
  coachRows.replaceChildren(...questions.map((q) => {
    const row = document.createElement("div");
    row.className = "coach__row";
    const label = document.createElement("label");
    label.className = "coach__q";
    label.htmlFor = `coach-q-${q.dimension}`;
    label.textContent = q.question;
    const input = document.createElement("input");
    input.className = "coach__input";
    input.id = `coach-q-${q.dimension}`;
    input.name = q.dimension;
    input.type = "text";
    input.autocomplete = "off";
    input.placeholder = q.placeholder;
    row.append(label, input);
    return row;
  }));
  coachEl.removeAttribute("aria-busy");
  coachGo.disabled = false;
  coachRows.querySelector("input")?.focus();
}

coachForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!coach?.questions) return; // still loading — Skip is the way out
  const { prompt, missing, questions, source } = coach;
  const answers = Object.fromEntries(
    [...coachRows.querySelectorAll("input")].map((input) => [input.name, input.value])
  );
  const asked = questions.map((q) => q.dimension);
  const answered = asked.filter((d) => String(answers[d] ?? "").trim());
  closeCoach();
  runGeneration(assembleBrief(prompt, answers), { missing, asked, answered, source, skipped: false });
});

coachSkip.addEventListener("click", () => {
  if (!coach) return;
  const { prompt, missing, questions, source } = coach;
  closeCoach();
  runGeneration(prompt, {
    missing,
    asked: questions ? questions.map((q) => q.dimension) : [],
    answered: [],
    source,
    skipped: true,
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !coach) return;
  event.preventDefault();
  closeCoach();
  promptInput.focus();
});
```

Wire closing on edits:
- In the `promptInput` `input` listener, first line: `closeCoach();`
- In the `uploadInput` `change` listener, beside `syncPills();`: `closeCoach();`

- [ ] **Step 4: Behaviour — the submit refactor**

Replace the whole `form.addEventListener("submit", …)` handler in `product/ui/home.js` with:

```js
/* ---- Submit — the one commit point ---------------------------------------- */
form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (submitBtn.disabled) return;
  clearError();

  if (attachedFile) {
    // Import path: unchanged — no checklist, no coach.
    create(async () => {
      setBusy(true, "Building…");
      // Import lands as a Generation with its slides already proposed
      // (proposedMapping) — from here it builds immediately, exactly like a
      // prompt. Slides are edited after the build, in the workspace.
      const generation = await api.importPresentation(attachedFile, {
        imageSource: brandImagesToggle?.checked ? "brand" : "source",
      });
      return buildFromGeneration(generation);
    });
    return;
  }

  // The coach is already asking: Generate again means "take me to it".
  if (coach) {
    coachRows.querySelector("input")?.focus();
    return;
  }

  const prompt = promptInput.value.trim();
  const check = checkBrief(prompt);
  if (needsCoaching(check)) {
    openCoach(prompt, missingFrom(check));
    return;
  }
  runGeneration(prompt, null);
});

/** The prompt path: generate (with whatever the coach learned) and build. */
function runGeneration(prompt, coaching) {
  return create(async () => {
    setBusy(true, "Generating…");
    return generateAndApprove(prompt, coaching);
  });
}

/** Shared by both paths: build, then open the new deck — or say why not. */
async function create(build) {
  try {
    const presentation = await build();
    // Straight into the workspace — still no success state in between, but
    // now without a document load: the new presentation simply becomes the
    // open document, and the rail picks it up.
    promptInput.value = "";
    attachedFile = null;
    attachmentChip.hidden = true;
    if (brandImagesToggle) brandImagesToggle.checked = false;
    setBusy(false);
    autoGrow();
    syncPills();
    await openWorkspace(presentation.id);
    /* Compose warnings stay on the generation record for diagnosis, but they
     * are engine telemetry, not something the person building a deck can act
     * on — the deck opened, and anything worth changing is edited right here
     * in the workspace. So nothing is shown. */
    loadRecents();
  } catch (err) {
    setBusy(false);
    showError(err.message || "Something went wrong. Try again.");
  }
}
```

Remove the `syncPills();` you added to the old success path in Task 5 (it now lives in `create`). Then change `generateAndApprove`'s signature and first line:

```js
async function generateAndApprove(prompt, coaching) {
  let generation = await api.requestGeneration(prompt, coaching);
```

- [ ] **Step 5: Run the suite**

Run: `npm test 2>&1 | tail -8`
Expected: `fail 0`.

- [ ] **Step 6: Verify in the browser**

If the server was restarted since Task 4's commit it is current; otherwise `GET /api/meta` vs `git rev-parse HEAD` and restart via `preview_start {name: "api"}` (warn the user about the sign-out first). On `http://localhost:4600/`:

1. **Strong prompt, no coach**: type the Task 5 step-3 prompt, press Enter → `#coach` stays hidden and the build view appears. (Stop here only once it has started; let it finish or leave it — it is a real deck.)
2. **Weak prompt opens the panel**: reload, type `a deck about our AI offering`, click Generate → `#coach` visible at once with skeleton rows, `#coach-go` disabled; within ~10s, 3–4 labelled inputs, focus in the first. Screenshot.
3. **Esc closes**: press Escape → `#coach` hidden, focus back in `#prompt`, no request to `/api/generations` (`read_network_requests {urlPattern: "/api/generations"}` → none).
4. **Editing closes**: Generate again → panel opens; type one character in the prompt → panel hidden.
5. **Late answer is dropped**: Generate, then press Esc before the questions arrive (within ~1s) → wait 12s → `#coach` still hidden, no `/api/generations` request.
6. **Generate with answers**: Generate, fill two of the questions, click the panel's Generate → one `POST /api/generations` whose body (`read_network_requests` with its `requestId`) has the prompt followed by two labelled lines and `coaching` with `skipped: false`, `answered` = those two dimensions. Let this build finish — it is the "answered" deck for Task 7; record the generation id and presentation id.
7. **Skip and generate**: back on Create, type `intro to our design team`, Generate, click **Skip and generate** → the body's `prompt` is exactly `intro to our design team` and `coaching.skipped` is `true`. Record its ids (this is not one of Task 7's pair).
8. **Attachment hides everything**: stage a `.pptx` → `#brief-pills` and `#coach` hidden; Generate goes straight to the import build (no `/api/briefs/coach` request).
9. **Dark/light and phone width**: with the panel open on a weak prompt, `resize_window {colorScheme: "light"}` and `{colorScheme: "dark"}` → screenshots; `resize_window {preset: "mobile"}` + reload + open the panel → buttons stacked full width, no horizontal scroll (`document.documentElement.scrollWidth <= innerWidth`), screenshot; then `resize_window {preset: "desktop"}`.
10. `read_console_messages {onlyErrors: true}` → none.

- [ ] **Step 7: Commit**

```bash
git add product/ui/index.html product/ui/home.js product/ui/app.css
git commit -m "Prompt coach: follow-up questions at Generate, skippable, Esc to close

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Quality check end to end, then ship notes

**Files:**
- Modify: `docs/CHANGELOG.md` (new entry at the top, under the `---`)

**Interfaces:**
- Consumes: the whole feature, on a server whose `/api/meta` commit equals `HEAD`.

- [ ] **Step 1: Confirm the server is current**

```bash
curl -s localhost:4600/api/meta; git rev-parse HEAD
```
Expected: same commit. If not, warn the user (sign-out) and restart with `preview_start {name: "api"}`.

- [ ] **Step 2: Build the comparison pair in the browser**

Use one weak prompt twice, so the only difference is the coach: `a deck about our AI offering for insurers`.

1. **Skipped**: type it, Generate, **Skip and generate**. Wait for the deck; note the presentation id.
2. **Answered**: type it again, Generate, answer every question with concrete content, for example — audience: "Claims directors at a mid-size European insurer"; goal: "Agree to a six-week claims-triage pilot"; points: "Why now; how triage works; two client results; pilot scope and the ask"; figures: "40% faster first response at a Nordic insurer; 12% lower leakage in 6 months". Click Generate. Note the presentation id.

If the questions came back with `source: "fallback"` (check the `/api/briefs/coach` response), note it — the comparison is still valid, but report it to the user.

- [ ] **Step 3: Audit both decks**

```bash
node tools/audit-decks.mjs --deck <skipped-presentation-id>
node tools/audit-decks.mjs --deck <answered-presentation-id>
```
Record for each: findings by kind (`example-data`, `object-text`, `counter-caption`, `partial-pages`, …) and the compose warnings count on the generation record (`GET /api/generations/<id>` → `warnings` / `output`).

- [ ] **Step 4: Visual review of every slide**

Open each deck in the editor (`/editor.html?id=<id>`) and screenshot every slide. For each deck, note: invented figures (numbers not in the brief), whether the structure follows the stated points, audience-appropriate tone, and any broken slide. Per CLAUDE.md, look at the rendered slides before trusting any audit number.

- [ ] **Step 5: Judge against the spec's success test**

The coached deck should have fewer invented figures, a structure that follows the stated points, and no more compose warnings than the skipped one. Write the comparison (a short table: invented figures, structure follows points y/n, warnings, audit findings) for the final report. If the coached deck is not better, stop and report to the user with the evidence instead of shipping.

- [ ] **Step 6: Changelog**

At the top of `docs/CHANGELOG.md`, directly under the `---` that ends the preamble:

```markdown
## 2026-10-15 — Prompt coach: a live brief checklist and follow-up questions

- **Checklist**: five pills under the home composer — Audience, Goal, Key
  points, Figures, Length — tick as the prompt covers them (deterministic
  rules in `js/brief-check.js`, shared by browser and server). Advisory only;
  hidden while a .pptx is staged.
- **Coach**: Generate on a prompt with no audience, goal or key points opens
  2–4 short questions (`POST /api/briefs/coach`, one Haiku call, 10s budget,
  fixed fallback questions on any failure). Answers are appended to the prompt
  as labelled lines; "Skip and generate" sends it as typed; Esc closes.
- **Record**: generations now store `coaching` (`missing`, `asked`,
  `answered`, `source`, `skipped`) for later analysis. Generation itself is
  unchanged, and so is the import path.
- **Quality check**: <one line from Step 5 — e.g. "coached vs skipped on 'a
  deck about our AI offering for insurers': N vs M invented figures, …">.
```

Replace the last bullet's angle-bracket text with the real result from Step 5 before committing.

- [ ] **Step 7: Full suite and commit**

```bash
npm test 2>&1 | tail -8
git add docs/CHANGELOG.md
git commit -m "Prompt coach: changelog and end-to-end quality check

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
Expected: `fail 0` before committing. Do not push.

- [ ] **Step 8: Report**

Tell the user: what shipped, the skipped-vs-answered comparison (with the presentation ids so they can open both), how many coach calls returned `model` vs `fallback` during verification, and that the server was restarted (they need to sign in again).
