// Regression tests for the 2026-10-14 brief run: what ten generated decks got
// wrong that no check caught — a sample chart shipped as fact, "[object
// Object]" on five bars, "3 / 12" in every caption, contents numbered for two
// entries of five, and a header that ellipsised the deck title.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { allTemplates } from "../js/templates/index.js";

const byName = (n) => allTemplates.find((t) => t.name === n);

describe("the template's sample never ships as the deck's data", () => {
  test("a chart left as the example is flagged; one with its own figures is not", async () => {
    const { exampleEcho } = await import("../product/domain/generation-service.js");
    const t = byName("finance/stacked-split");
    assert.deepEqual(exampleEcho(t, { ...t.example }).sort(), ["bars", "body", "legend"].sort());
    const own = { ...t.example, legend: ["Build", "Buy"], body: ["Ours."],
      bars: [{ label: "Y1", segments: [{ value: 2, display: "€2.1M" }, { value: 1, display: "€1.4M" }] }] };
    assert.deepEqual(exampleEcho(t, own), []);
  });

  test("image slots, chrome and short labels are not sample data", async () => {
    const { exampleEcho } = await import("../product/domain/generation-service.js");
    const t = { schema: { meta: "", photo: "", unit: "", tags: "" },
      example: { meta: { name: "Presentation Name" }, photo: "assets/photography/a.jpg", unit: "%", tags: ["Q1", "Q2"] } };
    assert.deepEqual(exampleEcho(t, { ...t.example }), []);
  });

  test("the repair pass treats a copied example as unwritten", async () => {
    const { isEcho } = await import("../product/infrastructure/ai/claude-cli-provider.js");
    const bars = byName("finance/stacked-split").example.bars;
    assert.equal(isEcho(bars, JSON.parse(JSON.stringify(bars))), true);
    assert.equal(isEcho(bars, [{ label: "FY25", segments: [] }]), false);
    assert.equal(isEcho(["Q1", "Q2"], ["Q1", "Q2"]), false, "short labels can be a real answer");
  });
});

describe("structured rows never print as [object Object]", () => {
  test("a list of words answered with rows keeps each row's words", async () => {
    const { coerceToExample } = await import("../product/domain/generation-service.js");
    const t = byName("strategy/grid-01");
    const out = coerceToExample(t.example, { items: [{ label: "3 Nov", active: true }, { label: "10 Nov" }] });
    assert.deepEqual(out.items, ["3 Nov", "10 Nov"]);
    const { toText } = await import("../product/domain/slide-content.js");
    assert.equal(toText({ value: 12, unit: "%" }), "12 — %");
  });

  test("a render that still prints [object Object] is rejected", async () => {
    const { assertRenders, SlideContentInvalidError } = await import("../product/domain/slide-content.js");
    const t = byName("strategy/grid-01");
    assert.throws(() => assertRenders(t.name, { ...t.example, title: { text: "x" } }), SlideContentInvalidError);
  });
});

describe("captions are context, never a counter", () => {
  test("counters are stripped; real captions survive", async () => {
    const { stripCounter } = await import("../product/domain/generation-service.js");
    for (const c of ["3 / 12", "11/12", "Slide 3 of 12"]) assert.equal(stripCounter(c), "", c);
    for (const c of ["Cost", "Phase 2", "2 / 3 of revenue from five clients"]) assert.equal(stripCounter(c), c, c);
  });
});

describe("a contents list is numbered for every entry or for none", () => {
  test("one entry with no slide clears every page number", async () => {
    const { resolvePageIndexes } = await import("../product/domain/slide-index.js");
    const slides = [
      { templateReference: { templateName: "toc" }, content: { items: [{ label: "Revenue growth", page: "" }, { label: "Workforce", page: "" }] } },
      { templateReference: { templateName: "x" }, content: { title: "Revenue growth held" } },
    ];
    const out = resolvePageIndexes(slides, { pageKeyFor: () => "page" });
    assert.deepEqual(out[0].content.items.map((i) => i.page), ["", ""]);
  });

  test("when every entry has a slide, every entry is numbered", async () => {
    const { resolvePageIndexes } = await import("../product/domain/slide-index.js");
    const slides = [
      { templateReference: { templateName: "toc" }, content: { items: [{ label: "Revenue growth" }, { label: "Workforce" }] } },
      { templateReference: { templateName: "x" }, content: { title: "Revenue growth held" } },
      { templateReference: { templateName: "x" }, content: { title: "Workforce and attrition" } },
    ];
    const out = resolvePageIndexes(slides, { pageKeyFor: () => "page" });
    assert.deepEqual(out[0].content.items.map((i) => i.page), ["02", "03"]);
  });
});

describe("the header is the logo alone when its meta cannot fit", () => {
  test("longer meta gets a wider width class", async () => {
    const { metaWidthClass } = await import("../js/frame.js");
    const w = (m) => Number(metaWidthClass(m).replace("v2f-mw-", ""));
    const short = w({ studio: "Product Studio", name: "Presentation Name", page: "3" });
    const long = w({ studio: "Product Studio", name: "H1 2026: Growth Held, Margin Did Not", page: "12" });
    assert.ok(long > short);
    // Measured in Chromium: this meta is 507px wide. The estimate must never come up short.
    assert.ok(long >= 507 && long <= 540, `estimate ${long} for a 507px meta`);
  });
});

describe("library portraits only stand for the presenting team", () => {
  test("a client quote's avatar is left empty; a team slide keeps its photos", async () => {
    const { blankPersonPhotos } = await import("../product/domain/generation-service.js");
    const quotes = { quotes: [{ name: "CIO", text: "Faster.", image: "assets/photography/a.jpg" }] };
    assert.equal(blankPersonPhotos({ role: "quote" }, quotes).quotes[0].image, "");
    assert.equal(blankPersonPhotos({ role: "team" }, quotes).quotes[0].image, "assets/photography/a.jpg");
    const logos = { items: [{ name: "Acme", logo: "assets/client-logos/acme.svg" }] };
    assert.equal(blankPersonPhotos({ role: "logos" }, logos).items[0].logo, "assets/client-logos/acme.svg", "only photographs");
  });
});

/* Intelligence layer, Task 12: the two audit kinds that measure the voice and
 * the hook on stored decks. A slide's copy that breaks the voice rules is a
 * `voice` finding (lintDeck, the same shape the voice pass scores); a prompt
 * deck whose generation asked for a hook but whose slide 2 is not marked
 * `role: "hook"` is a `hook` finding. */
const slide = (order, content, extra = {}) => ({
  order,
  templateReference: { templateName: "core/quote-single", templateVersion: 1, templatePackId: "main-template" },
  content,
  ...extra,
});
const deckOf = (slides, extra = {}) => ({ id: "d1", title: "Fixture deck", origin: "prompt", slides, ...extra });

describe("audit: the voice of a stored deck", () => {
  test("banned phrases and exclamation marks are findings, with the slide number", async () => {
    const { voiceFindings } = await import("../tools/lib/deck-findings.mjs");
    const deck = deckOf([
      slide(0, { title: "Cloud costs, in plain numbers" }),
      slide(1, { title: "We unlock seamless value!", body: "Spend fell." }),
    ]);
    const found = voiceFindings(deck);
    assert.ok(found.length >= 3, JSON.stringify(found));
    assert.ok(found.every((f) => f.slide === 2), "slide numbers are 1-based orders");
    assert.ok(found.some((f) => /banned/.test(f.detail) && /unlock/i.test(f.detail)));
    assert.ok(found.some((f) => /exclaim/.test(f.detail)));
  });

  test("clean copy and speaker notes are not findings", async () => {
    const { voiceFindings } = await import("../tools/lib/deck-findings.mjs");
    const deck = deckOf([
      slide(0, { title: "Cloud costs, in plain numbers", notes: "Unlock the room!" }),
      slide(1, { title: "Spend fell by a third", body: "Two teams moved first." }),
    ]);
    assert.deepEqual(voiceFindings(deck), []);
  });
});

describe("audit: a hook that was asked for is on slide 2", () => {
  const three = (hookRole) => deckOf([
    slide(0, { title: "Cover" }),
    slide(1, { statement: "Every outage started at night." }, hookRole ? { role: "hook" } : {}),
    slide(2, { title: "Close" }),
  ]);

  test("wanted and missing is a finding; wanted and present is not", async () => {
    const { hookFinding } = await import("../tools/lib/deck-findings.mjs");
    const missing = hookFinding(three(false), { wantsHook: true });
    assert.ok(missing, "a missing hook is reported");
    assert.equal(missing.slide, 2);
    assert.equal(hookFinding(three(true), { wantsHook: true }), null);
  });

  test("no hook wanted, an older record, an import, or a short deck is not a finding", async () => {
    const { hookFinding } = await import("../tools/lib/deck-findings.mjs");
    assert.equal(hookFinding(three(false), { wantsHook: false }), null);
    assert.equal(hookFinding(three(false), {}), null, "records from before the hook have no wantsHook");
    assert.equal(hookFinding(three(false), null), null, "no generation record");
    assert.equal(hookFinding({ ...three(false), origin: "import" }, { wantsHook: true }), null);
    assert.equal(hookFinding(deckOf([slide(0, { title: "A" }), slide(1, { title: "B" })]), { wantsHook: true }), null);
  });
});

describe("audit-decks reports the voice and hook kinds", () => {
  test("a fixture with both problems prints both kinds", async () => {
    const { mkdtempSync, writeFileSync, rmSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const { spawnSync } = await import("node:child_process");
    const dir = mkdtempSync(join(tmpdir(), "audit-decks-"));
    try {
      const deck = deckOf([
        slide(0, { title: "Cover" }),
        slide(1, { statement: "A game-changing year!" }),
        slide(2, { title: "Close" }),
      ]);
      writeFileSync(join(dir, "presentations.json"), JSON.stringify([deck]));
      writeFileSync(join(dir, "generations.json"), JSON.stringify([{ id: "g1", presentationId: "d1", wantsHook: true }]));
      const run = spawnSync(process.execPath, ["tools/audit-decks.mjs", "--data", join(dir, "presentations.json"), "--verbose"], { encoding: "utf8" });
      assert.match(run.stdout, /^\s+voice\s+\d+/m, run.stdout + run.stderr);
      assert.match(run.stdout, /^\s+hook\s+1$/m, run.stdout + run.stderr);
      assert.match(run.stdout, /--- hook \(1\)/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
