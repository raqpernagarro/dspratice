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
  checkBrief, missingFrom, fallbackQuestions, assembleBrief,
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
    const prose = "We want to explain how our claims platform works end to end ".repeat(5);
    assert.ok(prose.length > 250);
    assert.equal(checkBrief(prose).points, true);
  });
});

describe("coaching decisions", () => {
  test("missingFrom lists uncovered dimensions in order", () => {
    assert.deepEqual(missingFrom(checkBrief("Q3 update")), DIMENSIONS);
    assert.deepEqual(missingFrom(checkBrief("a 10-slide deck")), [A, G, P, F]);
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
