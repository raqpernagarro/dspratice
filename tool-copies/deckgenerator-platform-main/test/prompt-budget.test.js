// test/prompt-budget.test.js
// =============================================================================
// The composition prompt must fit the CLI's argument limit — always.
//
// runClaude rejects an over-long prompt before it spawns anything, and
// composeSlides treats any composition failure as "keep the plain mapping". So
// the entire visible symptom of breaching the cap is a deck where every slide
// uses the same content template: no error, no warning in the UI, just a bland
// deck. That is the exact bug the composition engine exists to prevent, and it
// was reintroduced twice by growth before this test existed.
//
// The engine used to send all 229 templates as prose, which meant the prompt
// grew with the LIBRARY — roughly 80 more templates would have broken every
// deck. It now sends a scored shortlist per slide, so the prompt grows with the
// DECK instead. These tests hold both properties: it fits for realistic and
// pathological decks, and adding templates does not change its size.
// =============================================================================
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { allTemplates } from "../js/templates/index.js";
import { outlineSignatures } from "../product/domain/content-signature.js";
import { shortlistFor } from "../product/domain/template-scoring.js";
import { fieldKind } from "../product/domain/slide-content.js";

const PROVIDER = fileURLToPath(new URL("../product/infrastructure/ai/claude-cli-provider.js", import.meta.url));
const source = readFileSync(PROVIDER, "utf8");
const CAP = Number(source.match(/MAX_PROMPT_CHARS = ([\d_]+)/)[1].replace(/_/g, ""));

/** The prompt builder is module-private (nothing else should call it), so it is
 *  lifted from the source rather than exported purely for a test. */
function lift(startMarker, endMarker) {
  const from = source.indexOf(startMarker);
  const to = source.indexOf(endMarker, from);
  assert.notEqual(from, -1, `could not find ${startMarker} — did it get renamed?`);
  return eval(`(${source.slice(from, to).trim()})`);
}
const buildLayoutChoicePrompt = lift("function buildLayoutChoicePrompt", "/* Pass 2 of deck composition");
const buildSlideGenerationPrompt = lift("function buildSlideGenerationPrompt", "function buildMappingPrompt");
// buildSlidePlanPrompt calls fieldTypeTag(), which itself calls the imported
// fieldKind() — both are lifted into global scope so the eval'd function body
// resolves them the same way the real module does.
const fieldTypeTag = lift("function fieldTypeTag", "function buildSlidePlanPrompt");
globalThis.fieldTypeTag = fieldTypeTag;
globalThis.fieldKind = fieldKind;
const buildSlidePlanPrompt = lift("function buildSlidePlanPrompt", "/* Pass 1 of deck composition");

const outlineOf = (slides, sentencesEach) => {
  const sentence = "This slide sets out the position in concrete terms with the numbers behind it, at length. ";
  return Array.from({ length: slides }, (_, i) => ({
    title: `Slide ${i + 1}: ${sentence.slice(0, 90)}`,
    bullets: Array.from({ length: sentencesEach }, () => sentence.repeat(3)),
  }));
};

/** Exactly what generation-service builds before calling the provider,
 *  including its deck-length-adaptive shortlist size. */
function shortlistsFor(outline, templates = allTemplates) {
  const perSlide = outline.length > 30 ? 6 : outline.length > 18 ? 8 : 12;
  return outlineSignatures(outline).map((sig) =>
    shortlistFor(sig, { limit: perSlide, deckLength: outline.length, templates })
      .map((c) => ({ ...c, darkSafe: true })));
}

/** The prompt for ONE batch. composeDeck splits a deck across as many of these
 *  as it needs; what must hold is that each batch fits. */
function promptFor(outline, templates = allTemplates) {
  const shortlists = shortlistsFor(outline, templates);
  return buildLayoutChoicePrompt({
    title: "A Deck", subtitle: "Sub",
    slides: outline.map((slide, index) => ({ index, slide, candidates: shortlists[index] })),
  });
}

/** Mirrors composeDeck's batching, so the test asserts what actually ships. */
function batchesFor(outline, templates = allTemplates) {
  const shortlists = shortlistsFor(outline, templates);
  const rows = outline.map((slide, index) => ({ index, slide, candidates: shortlists[index] }));
  const BUDGET = 30_000;
  const out = [];
  let pending = [];
  for (const row of rows) {
    const next = [...pending, row];
    const tooBig = pending.length &&
      buildLayoutChoicePrompt({ title: "A Deck", subtitle: "Sub", slides: next }).length > BUDGET;
    if (tooBig) { out.push(pending); pending = [row]; } else { pending = next; }
  }
  if (pending.length) out.push(pending);
  return out.map((slides) => buildLayoutChoicePrompt({ title: "A Deck", subtitle: "Sub", slides }));
}

describe("the prompt fits, whatever the deck", () => {
  for (const [label, slides, bullets] of [
    ["a short deck", 6, 2],
    ["a real deck with prose bodies", 12, 3],
    ["a long deck", 40, 3],
    ["a very large import", 120, 4],
    ["one slide with an enormous body", 1, 60],
  ]) {
    test(`${label} (${slides} slides)`, () => {
      const prompts = batchesFor(outlineOf(slides, bullets));
      assert.ok(prompts.length >= 1);
      prompts.forEach((p, i) => {
        assert.ok(p.length <= CAP,
          `batch ${i + 1}/${prompts.length} is ${p.length} chars against a ${CAP} cap — ` +
          `composition would silently fall back for those slides`);
      });
    });
  }
});

describe("the prompt no longer grows with the library", () => {
  // This is the property that changed. The old engine put every template in the
  // prompt, so the catalog was 22k of a 32k cap and the library was ~80
  // templates away from breaking every deck silently. Shortlisting means the
  // size depends on the deck, not the catalog.
  test("quadrupling the library leaves the prompt the same size", () => {
    const outline = outlineOf(12, 3);
    const grown = [];
    for (let copy = 0; copy < 4; copy++) {
      for (const t of allTemplates) grown.push({ ...t, name: `${t.name}-v${copy}` });
    }
    const base = promptFor(outline).length;
    const big = promptFor(outline, grown).length;

    assert.ok(big <= CAP, `with ${grown.length} templates the prompt is ${big} chars against a ${CAP} cap`);
    // Same number of candidates per slide either way, so within noise.
    assert.ok(Math.abs(big - base) < base * 0.25,
      `prompt size should track the deck, not the catalog (${base} -> ${big} for 4x the templates)`);
  });

  test("a 12-slide deck leaves real headroom", () => {
    const prompt = promptFor(outlineOf(12, 3));
    const margin = CAP - prompt.length;
    assert.ok(margin > CAP * 0.4,
      `expected generous headroom, got ${prompt.length}/${CAP} (${margin} spare)`);
    console.log(`      12-slide deck: ${prompt.length}/${CAP} chars (${margin} spare)`);
  });
});

describe("the shortlist is the contract", () => {
  test("every candidate offered is a real template", () => {
    const names = new Set(allTemplates.map((t) => t.name));
    for (const sig of outlineSignatures(outlineOf(8, 3))) {
      for (const c of shortlistFor(sig, { deckLength: 8 })) {
        assert.ok(names.has(c.name), `${c.name} is not in the library`);
      }
    }
  });

  test("each slide gets enough candidates to choose between", () => {
    for (const sig of outlineSignatures(outlineOf(10, 3))) {
      const list = shortlistFor(sig, { limit: 12, deckLength: 10 });
      assert.ok(list.length >= 8, `only ${list.length} candidates for slide ${sig.index + 1}`);
      assert.equal(new Set(list.map((c) => c.name)).size, list.length, "candidates must be distinct");
    }
  });
});

/** A library four times bigger than today's isn't pathological enough to
 *  trip the per-template floor (see claude-cli-provider.js) — it takes roughly
 *  700+ templates before templates.length * floor alone exceeds BUDGET. 1000
 *  synthetic templates with a realistic multi-field schema is what actually
 *  gets buildSlidePlanPrompt over the cap before its final clamp. */
function synthLibrary(n) {
  return Array.from({ length: n }, (_, i) => ({
    name: `t/x-${i}`,
    family: "t",
    role: "content",
    schema: {
      title: "string — section header",
      subtitle: "string — supporting line",
      body: "string[] — 3-5 bullet points",
      stats: "object[] — {label, value} pairs",
    },
  }));
}

describe("the prompt scale clamp holds at 1000 templates", () => {
  const templates = synthLibrary(1000);

  test("buildSlidePlanPrompt stays under the cap", () => {
    const prompt = buildSlidePlanPrompt({
      instruction: "Make this punchier",
      templateName: "core/content-01",
      content: { title: "Hello", body: ["a", "b"] },
      templates,
      images: [],
    });
    assert.ok(prompt.length < CAP, `prompt is ${prompt.length}, cap ${CAP}`);
  });

  test("buildSlideGenerationPrompt stays under the cap", () => {
    const prompt = buildSlideGenerationPrompt("A slide about quarterly results", templates);
    assert.ok(prompt.length < CAP, `prompt is ${prompt.length}, cap ${CAP}`);
  });
});

/* A single proportional cut of the template list doesn't converge: the
 * per-template allowance stays sized for the ORIGINAL pool, so it doesn't
 * grow when the pool shrinks, and the result can still land over cap. Both
 * cases below were measured genuinely OVER cap against the one-pass clamp
 * before the converging-loop fix: 3000 templates settled at 32,739 chars
 * (plan) after a single cut, and 1000 templates plus a 5,000-char
 * instruction settled at 33,580 (plan) — both over the 32,000-char
 * MAX_PROMPT_CHARS. The converging loop recomputes the allowance against the
 * shrunk pool each pass, so it actually reaches BUDGET. */
describe("the prompt clamp converges — the catalog alone can never exceed BUDGET", () => {
  test("buildSlidePlanPrompt stays under the cap at 3000 templates", () => {
    const templates = synthLibrary(3000);
    const prompt = buildSlidePlanPrompt({
      instruction: "Make this punchier",
      templateName: "core/content-01",
      content: { title: "Hello", body: ["a", "b"] },
      templates,
      images: [],
    });
    assert.ok(prompt.length < CAP, `prompt is ${prompt.length}, cap ${CAP}`);
  });

  test("buildSlideGenerationPrompt stays under the cap at 3000 templates", () => {
    const templates = synthLibrary(3000);
    const prompt = buildSlideGenerationPrompt("A slide about quarterly results", templates);
    assert.ok(prompt.length < CAP, `prompt is ${prompt.length}, cap ${CAP}`);
  });

  test("buildSlidePlanPrompt stays under the cap at 1000 templates plus a 5,000-char instruction", () => {
    const templates = synthLibrary(1000);
    const prompt = buildSlidePlanPrompt({
      instruction: "x".repeat(5000),
      templateName: "core/content-01",
      content: { title: "Hello", body: ["a", "b"] },
      templates,
      images: [],
    });
    assert.ok(prompt.length < CAP, `prompt is ${prompt.length}, cap ${CAP}`);
  });

  test("buildSlideGenerationPrompt stays under the cap at 1000 templates plus a 5,000-char intent", () => {
    const templates = synthLibrary(1000);
    const prompt = buildSlideGenerationPrompt("x".repeat(5000), templates);
    assert.ok(prompt.length < CAP, `prompt is ${prompt.length}, cap ${CAP}`);
  });
});

describe("the editor generate-slide prompt budgeting", () => {
  test("the editor generate-slide prompt stays under the cap at 4x library size", () => {
    const quadrupled = [];
    for (let copy = 0; copy < 4; copy++) {
      for (const t of allTemplates) quadrupled.push({ ...t, name: `${t.name}-v${copy}` });
    }
    const prompt = buildSlideGenerationPrompt("A slide about quarterly results", quadrupled);
    assert.ok(prompt.length < CAP, `prompt is ${prompt.length}, cap ${CAP}`);
  });

  test("the editor generate-slide prompt is under the cap TODAY (regression: it was 45.8k at 229 templates)", () => {
    const prompt = buildSlideGenerationPrompt("A slide about quarterly results", allTemplates);
    assert.ok(prompt.length < CAP, `prompt is ${prompt.length}, cap ${CAP}`);
  });
});
