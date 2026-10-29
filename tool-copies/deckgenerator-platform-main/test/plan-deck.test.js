// test/plan-deck.test.js — stub-provider integration for planDeck (deck-level
// art direction: sections, dividers, dark placement, emphasis) + a unit test
// for template-scoring's boostRoles option.
//
// planDeck is an enhancement pass, same posture as analyzeOutline
// (test/analyze-outline.test.js): a missing provider method, a bad plan, or a
// thrown error must never cost the deck a single slide — only ever a note().
import test from "node:test";
import assert from "node:assert/strict";
import { composeSlides } from "../product/domain/generation-service.js";
import { shortlistFor } from "../product/domain/template-scoring.js";
import { contentSignature } from "../product/domain/content-signature.js";
import { allTemplates } from "../js/templates/index.js";
import { buildPlanPrompt } from "../product/infrastructure/ai/claude-cli-provider.js";

// Visual review is on by default (see generation-service.js) — disabled here
// so this suite (which exercises both the prompt and import compose paths)
// stays fast, deterministic, and Playwright-free.
process.env.NPS_VISUAL_REVIEW = "0";

const REAL = allTemplates.find((t) => t.name === "core/content-twocol");

function mappingOf(n) {
  return Array.from({ length: n }, (_, i) => ({
    slideNumber: i + 1,
    title: `Slide ${i + 1}`,
    content: { title: `Slide ${i + 1}`, body: [`Body of slide ${i + 1}.`], notes: "" },
  }));
}

/** What a real import hands back: the source slide's own words, placed into
 *  the template's text fields. A row that carried none of them would now be
 *  rejected by the content-retention guard, as it should be. */
function echoSource(example, slide) {
  const text = [slide.title, ...(slide.bullets || [])].filter(Boolean).join(" ");
  const out = { ...example };
  for (const [key, value] of Object.entries(example)) {
    if (typeof value === "string" && key !== "meta") out[key] = text;
  }
  return out;
}

/** A composeImportDeck stub that hands back one valid row per source slide,
 *  all on the same real registered template — content-twocol, which carries
 *  both `caption` and `meta`, so the reindex assertions below have something
 *  to check. */
function stubImportDeck({ outline }) {
  return {
    rows: outline.map((o, i) => ({
      source: i + 1,
      templateName: REAL.name,
      theme: "light",
      content: echoSource(REAL.example, o),
    })),
    warnings: [],
  };
}

test("a plan's dividers become divider slides at section boundaries", async () => {
  const mapping = mappingOf(7);
  const warnings = [];
  const provider = {
    planDeck: async () => ({
      plan: {
        sections: [
          { from: 1, to: 3, title: "Part One" },
          { from: 4, to: 7, title: "Part Two" },
        ],
        dividers: [{ after: 3, title: "Part Two" }],
        dark: [],
        emphasis: [],
        pace: {},
      },
      warnings: [],
    }),
    composeImportDeck: async (args) => stubImportDeck(args),
  };

  const slides = await composeSlides(provider, mapping, { title: "Deck", origin: "import", warnings });

  // 7 source slides + 1 inserted divider.
  assert.equal(slides.length, 8);

  // The divider lands right after source slide 3's own output row (0-based
  // index 3: slides[0..2] are sources 1-3, slides[3] is the inserted break).
  const divider = slides[3];
  const dividerTemplate = allTemplates.find((t) => t.name === divider.templateReference.templateName);
  assert.ok(dividerTemplate, `templateReference must name a registered template: ${divider.templateReference.templateName}`);
  assert.equal(dividerTemplate.role, "divider");

  // Content is the template's own example with its title field(s) replaced
  // by the plan's section title — never invented prose.
  const stringValues = Object.values(divider.content).filter((v) => typeof v === "string");
  assert.ok(stringValues.includes("Part Two"), `divider content should carry "Part Two": ${JSON.stringify(divider.content)}`);

  // order fields are 0..7 sequential.
  slides.forEach((s, i) => assert.equal(s.order, i, `slide ${i} has order ${s.order}`));

  // chrome meta.page matches position, for every slide that carries meta —
  // insertion shifted every slide after the divider, so a stale page number
  // would mean the reindex pass didn't run.
  slides.forEach((s, i) => {
    if (s.content?.meta) assert.equal(s.content.meta.page, String(i + 1), `slide ${i} meta.page`);
  });
});

test("a divider planned after the LAST slide is dropped — it would become the closing slide", async () => {
  const mapping = mappingOf(5);
  const warnings = [];
  const provider = {
    planDeck: async () => ({
      plan: { sections: [{ from: 1, to: 5, title: "All" }], dividers: [{ after: 5, title: "The End" }], dark: [], emphasis: [], pace: {} },
      warnings: [],
    }),
    composeImportDeck: async (args) => stubImportDeck(args),
  };

  const slides = await composeSlides(provider, mapping, { title: "Deck", origin: "import", warnings });

  // No divider inserted — a divider "after" the last slide is never a
  // chapter break, it's a broken deck ending.
  assert.equal(slides.length, 5);
  assert.ok(
    warnings.some((w) => /divider after slide 5.*dropped/i.test(w)),
    `expected a warning about the rejected trailing divider; got: ${JSON.stringify(warnings)}`
  );
});

test("an out-of-range divider or dark index is dropped with a warning, not applied", async () => {
  const mapping = mappingOf(5);
  const warnings = [];
  const provider = {
    planDeck: async () => ({
      plan: {
        sections: [{ from: 1, to: 5, title: "All" }],
        dividers: [{ after: 99, title: "Nowhere" }],
        dark: [99],
        emphasis: [],
        pace: {},
      },
      warnings: [],
    }),
    composeImportDeck: async (args) => stubImportDeck(args),
  };

  const slides = await composeSlides(provider, mapping, { title: "Deck", origin: "import", warnings });

  // No divider inserted — the deck stays at its plain 5 output slides.
  assert.equal(slides.length, 5);
  assert.ok(
    warnings.some((w) => /dropped/i.test(w)),
    `expected a warning about the dropped plan entries; got: ${JSON.stringify(warnings)}`
  );
});

test("a non-empty validated plan.dark is authoritative for middle slides, overriding the model's own per-slide choice", async () => {
  const mapping = mappingOf(5);
  const warnings = [];
  // The plan wants slide 3 (0-based index 2) dark; the compose call's own
  // per-batch choice for that slide is "light" — the plan must win.
  const provider = {
    planDeck: async () => ({
      plan: { sections: [{ from: 1, to: 5, title: "All" }], dividers: [], dark: [3], emphasis: [], pace: {} },
      warnings: [],
    }),
    composeImportDeck: async ({ outline }) => ({
      rows: outline.map((o, i) => ({
        source: i + 1,
        templateName: REAL.name,
        theme: "light",
        content: echoSource(REAL.example, o),
      })),
      warnings: [],
    }),
  };

  const slides = await composeSlides(provider, mapping, { title: "Deck", origin: "import", warnings });

  assert.equal(slides.length, 5);
  assert.equal(slides[2].themeOverride, "dark");
  // A slide the plan did NOT name stays light, even though it isn't a bookend.
  assert.equal(slides[1].themeOverride, undefined);
});

test("an empty plan.dark (after validation drops every candidate) defers to the model's own per-slide theme choice", async () => {
  const mapping = mappingOf(5);
  const warnings = [];
  // Middle source slide 3 (0-based index 2 — not a bookend) carries its own
  // "dark" choice from the compose call, on a template the dark-safe audit
  // has verified. plan.dark names only slide 99, which validatePlan drops as
  // out-of-range, so the validated plan's `dark` array is empty.
  const provider = {
    planDeck: async () => ({
      plan: { sections: [{ from: 1, to: 5, title: "All" }], dividers: [], dark: [99], emphasis: [], pace: {} },
      warnings: [],
    }),
    composeImportDeck: async ({ outline }) => ({
      rows: outline.map((o, i) => ({
        source: i + 1,
        templateName: REAL.name,
        theme: i === 2 ? "dark" : "light",
        content: echoSource(REAL.example, o),
      })),
      warnings: [],
    }),
  };

  const slides = await composeSlides(provider, mapping, { title: "Deck", origin: "import", warnings });

  assert.equal(slides.length, 5);
  // An empty validated plan.dark must not flatten the deck: the middle
  // slide's own per-batch "dark" choice still renders dark.
  assert.equal(slides[2].themeOverride, "dark");
});

test("planDeck failure degrades to a warning", async () => {
  const mapping = mappingOf(3);
  const warnings = [];
  const provider = {
    planDeck: async () => { throw new Error("boom"); },
    composeImportDeck: async (args) => stubImportDeck(args),
  };

  const slides = await composeSlides(provider, mapping, { title: "Deck", origin: "import", warnings });

  // The deck still ships, composed exactly as it would with no plan at all.
  assert.equal(slides.length, 3);
  assert.ok(warnings.some((w) => /plan/i.test(w)), `expected a warning mentioning the plan; got: ${JSON.stringify(warnings)}`);
});

test("buildPlanPrompt annotates outline lines with the per-slide analysis when provided", () => {
  const outline = [
    { title: "Revenue update", bullets: ["Revenue grew 40% quarter over quarter."] },
    { title: "Roadmap", bullets: ["Phase one ships in Q1, phase two in Q2."] },
  ];
  const analysis = {
    slides: [
      { n: 1, kind: "numeric", tone: "confident", weight: 2 },
      { n: 2, kind: "sequence", tone: "neutral", weight: 0 },
    ],
  };

  const withAnalysis = buildPlanPrompt({ title: "Deck", outline, analysis });
  const withoutAnalysis = buildPlanPrompt({ title: "Deck", outline });

  assert.ok(/\[numeric w2 confident\]/.test(withAnalysis), `expected an analysis tag on slide 1, got:\n${withAnalysis}`);
  assert.ok(/\[sequence w0 neutral\]/.test(withAnalysis), `expected an analysis tag on slide 2, got:\n${withAnalysis}`);
  assert.ok(!/\[numeric/.test(withoutAnalysis), "no analysis provided means no tags");
});

test("boostRoles raises listed-role templates in the shortlist", () => {
  const sig = contentSignature(
    { title: "Growth", bullets: ["Revenue grew 40% quarter over quarter, well ahead of plan."] },
    { index: 2, total: 10 }
  );
  const STATEMENT_TEMPLATE = "main/text-01";
  assert.equal(allTemplates.find((t) => t.name === STATEMENT_TEMPLATE)?.role, "statement");

  // Large limit so family-cap trimming can't remove the template from either
  // list — this test is about the SCORE the boost adds, not shortlist size.
  const withoutBoost = shortlistFor(sig, { limit: allTemplates.length });
  const withBoost = shortlistFor(sig, { limit: allTemplates.length, boostRoles: ["statement"] });

  const before = withoutBoost.find((c) => c.name === STATEMENT_TEMPLATE);
  const after = withBoost.find((c) => c.name === STATEMENT_TEMPLATE);
  assert.ok(before, `${STATEMENT_TEMPLATE} should appear in the unboosted shortlist`);
  assert.ok(after, `${STATEMENT_TEMPLATE} should appear in the boosted shortlist`);
  assert.ok(after.score > before.score, `expected a higher score with the boost: ${before.score} -> ${after.score}`);
  // The boost is documented as a flat +20 next to ROLE_AFFINITY.
  assert.equal(after.score - before.score, 20);
});
