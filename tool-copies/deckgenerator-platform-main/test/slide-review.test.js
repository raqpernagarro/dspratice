// test/slide-review.test.js
// =============================================================================
// The visual review loop's pure helpers, and reviewSlides itself driven
// through the injected `measure` option — no Playwright anywhere in this
// file. `measure` stands in for the real DOM measurement (Playwright against
// the capture page), so these tests exercise exactly the same repair/scoring
// logic the real pass uses, deterministically and fast.
// =============================================================================
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { allTemplates } from "../js/templates/index.js";
import {
  reviewSlides, pickWorst, betterOf, defectScore, MAX_REPAIRS,
} from "../product/domain/slide-review-service.js";

const byName = (name) => allTemplates.find((t) => t.name === name);
const TWOCOL = byName("core/content-twocol");
const LIST3 = byName("core/content-list-3");

/** A real, renderable slide on core/content-twocol — same shape composeSlides
 *  itself produces (order/templateReference/themeOverride/content), plus the
 *  `__shortlist` scratch field the compose paths thread through. */
function slideOn(templateName, overrides = {}, shortlist = []) {
  const t = byName(templateName);
  return {
    order: 0,
    templateReference: { templateName: t.name, templateVersion: 1, templatePackId: "main-template" },
    themeOverride: undefined,
    content: { ...t.example, ...overrides },
    __shortlist: shortlist,
  };
}

describe("pickWorst", () => {
  test("orders candidates by score, worst first", () => {
    const measurements = [{ index: 0, score: 10 }, { index: 1, score: 90 }, { index: 2, score: 40 }];
    const worst = pickWorst(measurements, 10);
    assert.deepEqual(worst.map((m) => m.index), [1, 2, 0]);
  });

  test("caps at max", () => {
    const measurements = Array.from({ length: 8 }, (_, i) => ({ index: i, score: i + 1 }));
    assert.equal(pickWorst(measurements, 4).length, 4);
    assert.deepEqual(pickWorst(measurements, 4).map((m) => m.index), [7, 6, 5, 4]);
  });

  test("ignores score-0 (and negative) candidates", () => {
    const measurements = [{ index: 0, score: 0 }, { index: 1, score: 5 }, { index: 2, score: -1 }];
    assert.deepEqual(pickWorst(measurements, 10).map((m) => m.index), [1]);
  });

  test("an empty or missing list yields no candidates", () => {
    assert.deepEqual(pickWorst([], 4), []);
    assert.deepEqual(pickWorst(undefined, 4), []);
  });
});

describe("betterOf", () => {
  test("prefers the strictly lower score", () => {
    const before = { score: 50 };
    const after = { score: 10 };
    assert.equal(betterOf(before, after), after);
  });

  test("a tie keeps the original", () => {
    const before = { score: 50 };
    const after = { score: 50 };
    assert.equal(betterOf(before, after), before);
  });

  test("a worse outcome keeps the original", () => {
    const before = { score: 10 };
    const after = { score: 50 };
    assert.equal(betterOf(before, after), before);
  });

  test("a missing/undefined `after` (e.g. a re-measure that threw) keeps the original", () => {
    const before = { score: 10 };
    assert.equal(betterOf(before, undefined), before);
  });
});

describe("defectScore", () => {
  test("weights overflow and off-canvas at 3x, and only counts dead band past the 300px floor", () => {
    // Overflow inside the line box is not a defect: 10px scores nothing,
    // 26px scores the 10px beyond the tolerance.
    assert.equal(defectScore({ overflowPx: 10, offCanvasPx: 0, deadBandPx: 0 }), 0);
    assert.equal(defectScore({ overflowPx: 26, offCanvasPx: 0, deadBandPx: 0 }), 30);
    assert.equal(defectScore({ overflowPx: 10, offCanvasPx: 5, deadBandPx: 0 }), 15);
    assert.equal(defectScore({ overflowPx: 0, offCanvasPx: 0, deadBandPx: 250 }), 0);
    assert.equal(defectScore({ overflowPx: 0, offCanvasPx: 0, deadBandPx: 500 }), 200);
  });

  test("a missing measurement scores 0", () => {
    assert.equal(defectScore(undefined), 0);
    assert.equal(defectScore({}), 0);
  });
});

describe("reviewSlides — stub-injected measurement, no Playwright", () => {
  test("no defects: slides pass through unchanged, __shortlist stripped, nothing ticked", async () => {
    const slides = [slideOn("core/content-twocol", {}, ["core/content-list-3"])];
    const notes = [];
    const ticks = [];
    const measure = async () => ({ overflowPx: 0, offCanvasPx: 0, deadBandPx: 0 });

    const out = await reviewSlides(slides, { note: (m) => notes.push(m), tick: (p) => ticks.push(p), measure });

    assert.equal(out.length, 1);
    assert.equal(out[0].content.intro, slides[0].content.intro);
    assert.ok(!("__shortlist" in out[0]), "the candidate scratch field must never be returned");
    assert.deepEqual(notes, []);
    assert.deepEqual(ticks, []);
  });

  test("a defect with no shortlist alternates is repaired by tightening its own budgets", async () => {
    const longIntro = TWOCOL.example.intro; // long enough that 0.8x its own length actually cuts it
    const slides = [slideOn("core/content-twocol", { intro: longIntro }, [])];
    const notes = [];
    let calls = 0;
    const measure = async () => {
      calls += 1;
      // First pass: a hard overflow. Every re-measure after a repair reports clean.
      return calls === 1 ? { overflowPx: 50, offCanvasPx: 0, deadBandPx: 0 } : { overflowPx: 0, offCanvasPx: 0, deadBandPx: 0 };
    };

    const out = await reviewSlides(slides, { note: (m) => notes.push(m), measure });

    assert.equal(out[0].templateReference.templateName, "core/content-twocol", "no alternate available, so the layout stays");
    assert.ok(out[0].content.intro.length < longIntro.length, "the repaired slide's prose must be shorter");
    assert.ok(notes.some((n) => /repaired a visual defect/.test(n)), `expected a repair note, got ${JSON.stringify(notes)}`);
  });

  test("a defect with a shortlisted alternate is rebuilt onto that template", async () => {
    // Real (non-lorem) copy on the fields LIST3 shares by name (caption/
    // title/subtitle), and no `intro` text of its own — LIST3 has nowhere to
    // put prose under that key, so a slide that actually depended on `intro`
    // would (correctly) fail the retention gate instead of rebuilding here.
    const slides = [slideOn("core/content-twocol", {
      caption: "Case study",
      title: "Regional rollout accelerates orders",
      subtitle: "Four markets, one playbook",
      intro: "",
    }, ["core/content-list-3"])];
    const notes = [];
    let calls = 0;
    const measure = async () => {
      calls += 1;
      return calls === 1 ? { overflowPx: 0, offCanvasPx: 0, deadBandPx: 900 } : { overflowPx: 0, offCanvasPx: 0, deadBandPx: 0 };
    };

    const out = await reviewSlides(slides, { note: (m) => notes.push(m), measure });

    assert.equal(out[0].templateReference.templateName, "core/content-list-3");
    assert.ok(Array.isArray(out[0].content.items), "content must now match the new template's own schema");
    assert.ok(notes.some((n) => /repaired a visual defect/.test(n)));
  });

  test("a repair that does not improve the score is discarded — the original layout is kept", async () => {
    const slides = [slideOn("core/content-twocol", {}, ["core/content-list-3"])];
    const notes = [];
    // Every measurement — before AND after the repair — reports the same defect.
    const measure = async () => ({ overflowPx: 0, offCanvasPx: 0, deadBandPx: 900 });

    const out = await reviewSlides(slides, { note: (m) => notes.push(m), measure });

    assert.equal(out[0].templateReference.templateName, "core/content-twocol");
    assert.ok(notes.some((n) => /did not improve/.test(n)), `expected a no-improvement note, got ${JSON.stringify(notes)}`);
  });

  test("caps repairs at MAX_REPAIRS even when more slides are defective", async () => {
    assert.equal(MAX_REPAIRS, 4);
    const slides = Array.from({ length: 6 }, () => slideOn("core/content-twocol", {}, []));
    const notes = [];
    // Re-measures must report clean or the "does it improve" check would
    // discard every repair; give each slide a clean re-measurement by
    // tracking per-slide call counts.
    const seen = new Map();
    const perSlideMeasure = async (slide, index) => {
      const n = (seen.get(index) || 0) + 1;
      seen.set(index, n);
      return n === 1 ? { overflowPx: 40, offCanvasPx: 0, deadBandPx: 0 } : { overflowPx: 0, offCanvasPx: 0, deadBandPx: 0 };
    };

    const out = await reviewSlides(slides, { note: (m) => notes.push(m), measure: perSlideMeasure });

    const repaired = notes.filter((n) => /repaired a visual defect/.test(n));
    assert.equal(repaired.length, MAX_REPAIRS, `expected exactly ${MAX_REPAIRS} repairs, got ${JSON.stringify(notes)}`);
    assert.equal(out.length, 6);
  });

  test("emits a reviewing tick when (and only when) at least one slide needs repair", async () => {
    const clean = [slideOn("core/content-twocol", {}, [])];
    const dirty = [slideOn("core/content-twocol", {}, [])];
    const ticksClean = [];
    const ticksDirty = [];

    await reviewSlides(clean, { tick: (p) => ticksClean.push(p), measure: async () => ({ overflowPx: 0, offCanvasPx: 0, deadBandPx: 0 }) });
    await reviewSlides(dirty, { tick: (p) => ticksDirty.push(p), measure: async () => ({ overflowPx: 50, offCanvasPx: 0, deadBandPx: 0 }) });

    assert.deepEqual(ticksClean, []);
    assert.ok(ticksDirty.some((p) => p.stage === "reviewing"), `expected a reviewing-stage tick, got ${JSON.stringify(ticksDirty)}`);
  });

  test("a measurement failure degrades to the input unchanged, with a note — never throws", async () => {
    const slides = [slideOn("core/content-twocol", {}, ["core/content-list-3"])];
    const notes = [];
    const measure = async () => { throw new Error("capture page unreachable"); };

    const out = await reviewSlides(slides, { note: (m) => notes.push(m), measure });

    assert.equal(out.length, 1);
    assert.equal(out[0].content.intro, slides[0].content.intro);
    assert.ok(!("__shortlist" in out[0]));
    assert.ok(notes.some((n) => /^Visual review skipped: /.test(n)), `expected a skip note, got ${JSON.stringify(notes)}`);
  });

  test("an empty deck is a no-op", async () => {
    const notes = [];
    const out = await reviewSlides([], { note: (m) => notes.push(m), measure: async () => ({ overflowPx: 99, offCanvasPx: 0, deadBandPx: 0 }) });
    assert.deepEqual(out, []);
    assert.deepEqual(notes, []);
  });

  test("missing note/tick callbacks are safe (both are optional)", async () => {
    const slides = [slideOn("core/content-twocol", {}, [])];
    const out = await reviewSlides(slides, { measure: async () => ({ overflowPx: 40, offCanvasPx: 0, deadBandPx: 0 }) });
    assert.equal(out.length, 1);
  });

  test("never mutates the caller's own slide objects — only copies are touched", async () => {
    const original = slideOn("core/content-twocol", {}, ["core/content-list-3"]);
    const originalContent = original.content;
    const slides = [original];
    let calls = 0;
    const measure = async () => {
      calls += 1;
      return calls === 1 ? { overflowPx: 0, offCanvasPx: 0, deadBandPx: 900 } : { overflowPx: 0, offCanvasPx: 0, deadBandPx: 0 };
    };

    const out = await reviewSlides(slides, { measure });

    assert.equal(original.content, originalContent, "the input slide's own content must be untouched");
    assert.equal(original.templateReference.templateName, "core/content-twocol");
    assert.notEqual(out[0], original, "the returned slide must be a different object");
  });
});

describe("reviewSlides — repair is gated on content retention", () => {
  test("a repair onto a one-field alternate is rejected: content would be lost, so the original layout is kept", async () => {
    // core/gallery-single-photo's whole schema is one image field — none of
    // TWOCOL's caption/title/subtitle/intro prose has anywhere to land, so
    // rebuilding onto it would silently drop virtually all of the slide's
    // own wording and replace it with the alternate's own placeholder image.
    const slides = [slideOn("core/content-twocol", {
      caption: "Q3 field results",
      title: "Distribution rollout across four regions",
      subtitle: "What changed since the pilot",
      intro: "The pilot proved the model in two markets; this quarter extends it to four more, with a phased handoff to local teams and a shared support desk.",
    }, ["core/gallery-single-photo"])];
    const notes = [];
    const measure = async () => ({ overflowPx: 0, offCanvasPx: 0, deadBandPx: 900 });

    const out = await reviewSlides(slides, { note: (m) => notes.push(m), measure });

    assert.equal(out[0].templateReference.templateName, "core/content-twocol",
      "the low-retention alternate must never be adopted");
    assert.equal(out[0].content.intro, slides[0].content.intro, "the original prose must survive untouched");
    assert.ok(
      notes.some((n) => /could not be repaired without losing content/.test(n)),
      `expected a content-loss rejection note, got ${JSON.stringify(notes)}`,
    );
  });

  test("an accepted repair carries no lorem/example placeholder text", async () => {
    // Same reasoning as the retention test above: real copy only on the
    // fields LIST3 shares by name, so the rebuild actually clears the
    // retention gate and gets a chance to leave lorem behind.
    const slides = [slideOn("core/content-twocol", {
      caption: "Field note",
      title: "Program status",
      subtitle: "Rollout",
      intro: "",
    }, ["core/content-list-3"])];
    let calls = 0;
    const measure = async () => {
      calls += 1;
      return calls === 1 ? { overflowPx: 0, offCanvasPx: 0, deadBandPx: 900 } : { overflowPx: 0, offCanvasPx: 0, deadBandPx: 0 };
    };

    const out = await reviewSlides(slides, { measure });

    assert.equal(out[0].templateReference.templateName, "core/content-list-3");
    const flat = JSON.stringify(out[0].content);
    assert.ok(!/lorem ipsum/i.test(flat), `accepted repair must not carry lorem ipsum, got ${flat}`);
  });
});
