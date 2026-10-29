// test/build-deadline.test.js
// =============================================================================
// The whole-build soft deadline (#composeInBackground in generation-service.js
// computes `deadline = start + 9min` and threads it through composeSlides).
// Two checkpoint guards read it: planDeckForCompose and runVisualReview each
// skip, with a note(), once the deadline is within a minute of passing — the
// essential passes (analysis, template choice, content fill) are never
// deadline-gated, only these two optional ones.
//
// Deliberately NOT setting NPS_VISUAL_REVIEW=0 here (unlike most other compose
// suites): the point of this file is to prove the deadline check in
// runVisualReview fires BEFORE reviewSlides ever touches Playwright, so a
// deadline already past must degrade the same way whether or not Playwright
// happens to be installed on the machine running the test.
// =============================================================================
import test from "node:test";
import assert from "node:assert/strict";
import { composeSlides } from "../product/domain/generation-service.js";
import { allTemplates } from "../js/templates/index.js";

const REAL = allTemplates.find((t) => t.name === "core/content-twocol");

function mappingOf(n) {
  return Array.from({ length: n }, (_, i) => ({
    slideNumber: i + 1,
    title: `Slide ${i + 1}`,
    content: { title: `Slide ${i + 1}`, body: [`Body of slide ${i + 1}.`], notes: "" },
  }));
}

function stubImportDeck({ outline }) {
  return {
    rows: outline.map((_, i) => ({
      source: i + 1,
      templateName: REAL.name,
      theme: "light",
      content: { ...REAL.example },
    })),
    warnings: [],
  };
}

test("a deadline already past skips planning and visual review, with warnings, and the deck still composes", async () => {
  const mapping = mappingOf(3);
  const warnings = [];
  let planDeckCalled = false;
  const provider = {
    planDeck: async () => {
      planDeckCalled = true;
      return { plan: null, warnings: [] };
    },
    composeImportDeck: async (args) => stubImportDeck(args),
  };

  const slides = await composeSlides(provider, mapping, {
    title: "Deck",
    origin: "import",
    warnings,
    deadline: Date.now() - 1000, // already past
  });

  assert.equal(planDeckCalled, false, "planDeck must not be called once the deadline has passed");
  assert.equal(slides.length, 3, "the deck still composes — only the optional passes are skipped");
  assert.ok(
    warnings.some((w) => /planning skipped/i.test(w) && /time budget/i.test(w)),
    `expected a planning-skip warning; got: ${JSON.stringify(warnings)}`
  );
  assert.ok(
    warnings.some((w) => /visual review skipped/i.test(w) && /time budget/i.test(w)),
    `expected a visual-review-skip warning; got: ${JSON.stringify(warnings)}`
  );
});

test("a deadline still comfortably in the future does not skip either pass", async () => {
  const mapping = mappingOf(2);
  const warnings = [];
  let planDeckCalled = false;
  const provider = {
    planDeck: async () => {
      planDeckCalled = true;
      return { plan: null, warnings: [] };
    },
    composeImportDeck: async (args) => stubImportDeck(args),
  };

  await composeSlides(provider, mapping, {
    title: "Deck",
    origin: "import",
    warnings,
    deadline: Date.now() + 9 * 60_000,
  });

  assert.equal(planDeckCalled, true, "planDeck should still run with plenty of budget left");
  assert.ok(
    !warnings.some((w) => /time budget/i.test(w)),
    `expected no time-budget warnings with a future deadline; got: ${JSON.stringify(warnings)}`
  );
});
