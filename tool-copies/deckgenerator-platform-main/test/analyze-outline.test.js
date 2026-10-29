// test/analyze-outline.test.js — stub-provider integration + merge unit tests
//
// Covers the content-understanding pass: applyAnalysis() folding an LLM
// analysis onto a regex-derived signature (never unsetting a regex-true),
// and composeSlides() degrading gracefully when analyzeOutline() fails —
// the mandatory failure-path guarantee for an enhancement pass that must
// never turn into a failed deck.
import test from "node:test";
import assert from "node:assert/strict";
import { applyAnalysis, contentSignature } from "../product/domain/content-signature.js";
import { composeSlides } from "../product/domain/generation-service.js";
import { allTemplates } from "../js/templates/index.js";

// Visual review is on by default in generation-service.js (it degrades to a
// no-op note when Playwright/a server aren't reachable, but still ATTEMPTS a
// real Chromium launch first) — disabled here so this stub-provider suite
// stays fast, deterministic, and Playwright-free.
process.env.NPS_VISUAL_REVIEW = "0";

test("applyAnalysis maps kinds onto signature booleans without unsetting regex signals", () => {
  const sig = contentSignature({ title: "Q3: 40% growth, £2m ARR, 3x", bullets: ["a"] }, { index: 1, total: 5 });
  assert.equal(sig.isNumeric, true);
  const merged = applyAnalysis({ ...sig }, { kind: "quote", visualNeed: 0, weight: 1 });
  assert.equal(merged.isQuote, true);
  assert.equal(merged.isNumeric, true); // regex floor preserved
});

test("applyAnalysis never unsets a regex-derived true, even when the model disagrees", () => {
  const sig = contentSignature({ title: "Agenda", bullets: ["What we'll cover today"] }, { index: 0, total: 3 });
  assert.equal(sig.isAgenda, true);
  const merged = applyAnalysis({ ...sig }, { kind: "content" });
  assert.equal(merged.isAgenda, true);
});

test("applyAnalysis can turn a false boolean true — analysis adds signal a regex missed", () => {
  const sig = contentSignature({ title: "On the ground", bullets: ["Nothing works the way it should."] }, { index: 0, total: 3 });
  assert.equal(sig.isQuote, false);
  const merged = applyAnalysis({ ...sig }, { kind: "quote" });
  assert.equal(merged.isQuote, true);
});

test("applyAnalysis stores the raw analysis entry on the signature", () => {
  const sig = contentSignature({ title: "T", bullets: ["a"] }, { index: 0, total: 1 });
  const a = { kind: "numeric", keyClaim: "Revenue grew 40%.", dataPoints: ["40%"], tone: "confident", visualNeed: 0, weight: 1 };
  const merged = applyAnalysis(sig, a);
  assert.deepEqual(merged.analysis, a);
});

test("applyAnalysis is a no-op passthrough with no analysis entry", () => {
  const sig = contentSignature({ title: "T", bullets: ["a"] }, { index: 0, total: 1 });
  assert.equal(applyAnalysis(sig, null), sig);
  assert.equal(applyAnalysis(sig, undefined), sig);
});

test("a failing analyzeOutline degrades to a warning, not a failed deck", async () => {
  const warnings = [];
  const provider = {
    analyzeOutline: async () => { throw new Error("boom"); },
    composeImportDeck: async () => ({ rows: [], warnings: [] }),
  };
  const mapping = [{ slideNumber: 1, title: "T", content: { title: "T", body: ["x"], notes: "" } }];
  const slides = await composeSlides(provider, mapping, { title: "D", origin: "import", warnings });
  assert.equal(slides.length, 1);
  assert.ok(warnings.some((w) => /analysis/i.test(w)));
});

test("a provider with no analyzeOutline at all still composes (analysis is optional)", async () => {
  const REAL = allTemplates.find((t) => t.name === "core/content-twocol");
  const warnings = [];
  const provider = {
    composeImportDeck: async () => ({
      rows: [{ source: 1, templateName: REAL.name, theme: "light", content: { ...REAL.example } }],
      warnings: [],
    }),
  };
  const mapping = [{ slideNumber: 1, title: "T", content: { title: "T", body: ["x"], notes: "" } }];
  const slides = await composeSlides(provider, mapping, { title: "D", origin: "import", warnings });
  assert.equal(slides.length, 1);
  assert.ok(!warnings.some((w) => /analysis/i.test(w)));
});

test("a cached analysis (opts.analysis) is reused instead of calling the provider", async () => {
  const REAL = allTemplates.find((t) => t.name === "core/content-twocol");
  let analyzeCalls = 0;
  const provider = {
    analyzeOutline: async () => { analyzeCalls += 1; return { slides: [], warnings: [] }; },
    composeImportDeck: async () => ({
      rows: [{ source: 1, templateName: REAL.name, theme: "light", content: { ...REAL.example } }],
      warnings: [],
    }),
  };
  const mapping = [{ slideNumber: 1, title: "T", content: { title: "T", body: ["x"], notes: "" } }];
  await composeSlides(provider, mapping, {
    title: "D", origin: "import",
    analysis: { slides: [{ n: 1, kind: "content" }], warnings: [] },
  });
  assert.equal(analyzeCalls, 0);
});

test("the analyzing stage is reported through onProgress before layout selection", async () => {
  const REAL = allTemplates.find((t) => t.name === "core/content-twocol");
  const patches = [];
  const provider = {
    analyzeOutline: async ({ onBatch }) => {
      onBatch?.({ pass: "analyze", index: 1, total: 1, slideNumbers: [1] });
      return { slides: [{ n: 1, kind: "numeric" }], warnings: [] };
    },
    composeImportDeck: async () => ({
      rows: [{ source: 1, templateName: REAL.name, theme: "light", content: { ...REAL.example } }],
      warnings: [],
    }),
  };
  const mapping = [{ slideNumber: 1, title: "T", content: { title: "T", body: ["x"], notes: "" } }];
  await composeSlides(provider, mapping, { title: "D", origin: "import", onProgress: (p) => patches.push(p) });
  const analyzingIndex = patches.findIndex((p) => p.stage === "analyzing");
  const choosingIndex = patches.findIndex((p) => p.stage === "choosing");
  assert.ok(analyzingIndex !== -1, `no "analyzing" stage seen; stages: ${patches.map((p) => p.stage)}`);
  assert.ok(choosingIndex === -1 || analyzingIndex < choosingIndex, "analyzing must precede choosing");
});

test("a fresh analysis is handed back through onAnalysis for the caller to persist", async () => {
  const REAL = allTemplates.find((t) => t.name === "core/content-twocol");
  const a = { slides: [{ n: 1, kind: "numeric" }], warnings: [] };
  let captured = null;
  const provider = {
    analyzeOutline: async () => a,
    composeImportDeck: async () => ({
      rows: [{ source: 1, templateName: REAL.name, theme: "light", content: { ...REAL.example } }],
      warnings: [],
    }),
  };
  const mapping = [{ slideNumber: 1, title: "T", content: { title: "T", body: ["x"], notes: "" } }];
  await composeSlides(provider, mapping, {
    title: "D", origin: "import", onAnalysis: (result) => { captured = result; },
  });
  assert.deepEqual(captured, a);
});
