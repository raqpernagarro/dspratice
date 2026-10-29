// test/intelligence-figures.test.js
// =============================================================================
// No invented figures, deck-wide; the hook slide's layout (Task 6).
//
// "A scene may be illustrative; a number never is." Every number on a finished
// slide must trace to the prompt, coach answers, references or the brief's
// proof — and when one does not, it is removed with a note, never silently.
// =============================================================================
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { allTemplates } from "../js/templates/index.js";
import { shortlistFor } from "../product/domain/template-scoring.js";
import { contentSignature } from "../product/domain/content-signature.js";
import { enforceVariety } from "../product/domain/variety.js";
import { untraceable } from "../product/domain/content-brief.js";
import { buildSlideFillPrompt, buildGapFillPrompt } from "../product/infrastructure/ai/claude-cli-provider.js";

process.env.NPS_VISUAL_REVIEW = "0";

const byName = (name) => allTemplates.find((t) => t.name === name);
const textOf = (v) => JSON.stringify(v);
const HOOKS = ["marketing/text-03", "brand-guidelines/split-01", "brand-guidelines/hero-02", "core/quote-single"];

/** A five-slide deck whose slide 2 is a chart of two growth figures. */
function chartDeck() {
  const mapping = [
    { slideNumber: 1, title: "Quarterly review", content: { body: ["Where the year landed."], notes: "" } },
    { slideNumber: 2, title: "Growth held steady", content: { body: ["Region North growth 9.4%", "Region South growth 8.8%"], notes: "" } },
    { slideNumber: 3, title: "What changed", content: { body: ["Teams moved closer to customers.", "Releases became routine."], notes: "" } },
    { slideNumber: 4, title: "What comes next", content: { body: ["Scale the pilot.", "Keep the cadence."], notes: "" } },
    { slideNumber: 5, title: "Thank you", content: { body: ["Questions welcome."], notes: "" } },
  ];
  const picks = ["main/cover-01", "finance/statement-bars", "core/content-twocol", "core/content-list-3", "core/closing-single"];
  const provider = {
    async generatePresentation() { throw new Error("not used"); },
    async composeDeck({ outline }) {
      return {
        slides: outline.map((s, i) => {
          const t = byName(picks[i]);
          if (i === 1) {
            return {
              templateName: t.name, theme: "light",
              content: {
                caption: "Growth",
                statement: "Growth held steady",
                bars: [
                  { label: "Region North", value: 9.4, display: "9.4%" },
                  { label: "Region South", value: 8.8, display: "8.8%" },
                ],
                chartCaption: "Region North and Region South growth",
              },
            };
          }
          return { templateName: t.name, theme: "light", content: { title: s.title, body: s.bullets, items: s.bullets } };
        }),
      };
    },
  };
  return { mapping, provider };
}

describe("no invented figures, deck-wide", () => {
  test("a chart whose figures are not in the material loses them, with a note", async () => {
    const { composeSlides } = await import("../product/domain/generation-service.js");
    const { mapping, provider } = chartDeck();
    const warnings = [];
    const slides = await composeSlides(provider, mapping, {
      title: "Quarterly review", warnings,
      prompt: "A quarterly review deck for the leadership team", brief: { proof: [] }, references: [],
    });
    const two = textOf(slides[1].content);
    assert.ok(!two.includes("9.4") && !two.includes("8.8"), `figures survived: ${two}`);
    assert.ok(warnings.some((w) => /^Slide 2: removed figures not in the material/.test(w)), `no note: ${JSON.stringify(warnings)}`);
  });

  test("the same figures stated in the prompt are kept, without a note", async () => {
    const { composeSlides } = await import("../product/domain/generation-service.js");
    const { mapping, provider } = chartDeck();
    const warnings = [];
    const slides = await composeSlides(provider, mapping, {
      title: "Quarterly review", warnings,
      prompt: "A quarterly review: Region North grew 9.4% and Region South 8.8%", brief: { proof: [] }, references: [],
    });
    const two = textOf(slides[1].content);
    assert.equal(slides[1].templateReference.templateName, "finance/statement-bars");
    assert.ok(two.includes("9.4") && two.includes("8.8"), `figures were dropped: ${two}`);
    assert.ok(!warnings.some((w) => /removed figures/.test(w)), `unexpected note: ${JSON.stringify(warnings)}`);
  });

  test("figures in the brief's proof count as material", async () => {
    const { composeSlides } = await import("../product/domain/generation-service.js");
    const { mapping, provider } = chartDeck();
    const warnings = [];
    const slides = await composeSlides(provider, mapping, {
      title: "Quarterly review", warnings, prompt: "A quarterly review",
      brief: { proof: [{ fact: "North grew 9.4%" }, { fact: "South grew 8.8%" }] },
    });
    assert.ok(textOf(slides[1].content).includes("9.4"));
    assert.ok(!warnings.some((w) => /removed figures/.test(w)));
  });

  test("a leading list marker is never treated as a figure", () => {
    assert.deepEqual(untraceable({ items: ["1. Discovery", "2) Pilot", "03 Scale"] }, new Set()), []);
    assert.deepEqual(untraceable({ items: ["1. Discovery in 6 weeks"] }, new Set()), ["6"]);
    assert.deepEqual(untraceable({ items: ["3 teams joined"] }, new Set()), ["3"]);
  });

  test("with no figures available, no chart leads a 4-bullet slide's shortlist", () => {
    const sig = contentSignature({
      title: "Revenue by region",
      bullets: ["North revenue up 12%", "South revenue up 9%", "East revenue up 4%", "West revenue flat at 0%"],
    }, { index: 3, total: 8 });
    const open = shortlistFor(sig, { limit: 12, deckLength: 8 });
    assert.ok(open.slice(0, 3).some((c) => c.role === "chart" || c.intent?.feel === "data"),
      "precondition: with figures, a data layout is among the leaders");
    const top = shortlistFor(sig, { limit: 12, deckLength: 8, figuresAvailable: false }).slice(0, 3);
    assert.ok(!top.some((c) => c.role === "chart"), `a chart still leads: ${top.map((c) => c.name)}`);
  });

  test("the fill and repair prompts name the only numbers allowed", () => {
    const template = byName("finance/statement-bars");
    const slide = { title: "Growth", bullets: ["North 9.4%"] };
    const fill = buildSlideFillPrompt({ title: "Deck", assignments: [{ index: 1, template, slide }], allowedNumbers: ["9.4"] });
    assert.match(fill, /Numbers come only from: 9\.4\./);
    assert.match(fill, /write it qualitatively/);
    const none = buildSlideFillPrompt({ title: "Deck", assignments: [{ index: 1, template, slide }], allowedNumbers: [] });
    assert.match(none, /Numbers come only from:/);
    const gap = buildGapFillPrompt({ title: "Deck", gaps: [{ index: 1, template, slide, missing: ["bars"] }], allowedNumbers: ["9.4"] });
    assert.match(gap, /Numbers come only from: 9\.4\./);
  });
});

describe("the hook slide sits on a statement layout", () => {
  test("HOOK_TEMPLATES are 4–6 existing light statement/quote layouts", async () => {
    const { HOOK_TEMPLATES } = await import("../product/domain/generation-service.js");
    assert.ok(HOOK_TEMPLATES.length >= 4 && HOOK_TEMPLATES.length <= 6);
    for (const name of HOOK_TEMPLATES) {
      const t = byName(name);
      assert.ok(t, `${name} is not a registered template`);
      assert.ok(["statement", "quote"].includes(t.role), `${name} is a ${t.role}`);
      assert.equal(t.theme, "light", `${name} is not light`);
      assert.notEqual(t.intent?.feel, "data");
    }
  });

  test("a hook slide gets a hook layout, light, and keeps it beside a same-layout neighbour", async () => {
    const { composeSlides, HOOK_TEMPLATES } = await import("../product/domain/generation-service.js");
    const mapping = [
      { slideNumber: 1, title: "Release engineering", content: { body: ["A plan for the year."], notes: "" } },
      { slideNumber: 2, title: "What if every release shipped itself?", role: "hook", content: { body: [], notes: "" } },
      { slideNumber: 3, title: "Releases are still manual", content: { body: ["Every release waits on a person."], notes: "" } },
      { slideNumber: 4, title: "What comes next", content: { body: ["Automate the pipeline.", "Keep the cadence."], notes: "" } },
      { slideNumber: 5, title: "Thank you", content: { body: ["Questions welcome."], notes: "" } },
    ];
    let hookList = null;
    const provider = {
      async generatePresentation() { throw new Error("not used"); },
      async composeDeck({ outline, shortlists, repairPicks }) {
        hookList = shortlists[1].map((c) => c.name);
        const hookName = shortlists[1][0].name;
        // The model asks for dark on the hook and repeats its layout next door.
        const raw = outline.map((_, i) => ({
          index: i,
          templateName: i === 0 ? "main/cover-01" : i === 4 ? "core/closing-single" : i === 3 ? "core/content-list-3" : hookName,
          theme: i === 1 ? "dark" : "light",
        }));
        const fixed = repairPicks(raw, shortlists);
        return {
          slides: fixed.map((p, i) => ({
            templateName: p.templateName, theme: p.theme,
            content: { title: outline[i].title, body: outline[i].title, quote: outline[i].title, caption: "", items: outline[i].bullets },
          })),
        };
      },
    };
    const slides = await composeSlides(provider, mapping, { title: "Release engineering", prompt: "Release engineering plan" });
    assert.ok(hookList.every((n) => HOOK_TEMPLATES.includes(n)), `hook shortlist strays: ${hookList}`);
    const hook = slides[1];
    assert.ok(HOOK_TEMPLATES.includes(hook.templateReference.templateName), hook.templateReference.templateName);
    assert.equal(hook.templateReference.templateName, hookList[0], "variety moved the hook");
    assert.notEqual(hook.themeOverride, "dark", "the hook must be light");
    assert.equal(hook.role, "hook", "the hook role is not carried onto the slide");
    assert.notEqual(slides[2].templateReference.templateName, hook.templateReference.templateName,
      "the neighbour should have been the one to move");
  });

  test("enforceVariety never swaps a fixed slide, even after a same-layout neighbour", () => {
    const picks = [
      { index: 0, templateName: "marketing/text-03" },
      { index: 1, templateName: "marketing/text-03" },
    ];
    const lists = [[{ name: "marketing/text-03" }, { name: "core/content-twocol" }], [{ name: "marketing/text-03" }, { name: "core/quote-single" }]];
    const { picks: out } = enforceVariety(picks, lists, { deckLength: 2, fixed: new Set([1]) });
    assert.equal(out[1].templateName, "marketing/text-03");
  });
});

describe("taking figures out keeps what else the slide says", () => {
  test("a chart datum is dropped, a card loses only its figure, chrome is untouched", async () => {
    const { stripUntraceable } = await import("../product/domain/content-brief.js");
    const out = stripUntraceable({
      title: "Growth held steady",
      bars: [{ label: "North", value: 9.4, display: "9.4%" }, { label: "South", value: 3, display: "3%" }],
      cards: [{ title: "Year 1", items: ["Teams moved closer"] }],
      body: ["Up 12% on last year", "Releases became routine"],
      meta: { page: "12" },
    }, new Set(["3"]));
    assert.deepEqual(out.bars, [{ label: "South", value: 3, display: "3%" }]);
    assert.deepEqual(out.cards, [{ title: "", items: ["Teams moved closer"] }]);
    assert.deepEqual(out.body, ["Releases became routine"]);
    assert.deepEqual(out.meta, { page: "12" });
  });
});

describe("fix round 1", () => {
  test("R2: structural counters up to 12 are exempt; Phase 13 and model dates are not", () => {
    assert.deepEqual(untraceable({ caption: "Phase 1", items: ["Step 2: pilot", "Week 3", "Option 12", "Sprint 4 review"] }, new Set()), []);
    assert.deepEqual(untraceable({ caption: "Phase 13" }, new Set()), ["13"]);
    assert.deepEqual(untraceable({ body: "Checkpoint in February 2027" }, new Set()), ["2027"]);
    assert.deepEqual(untraceable({ body: "Checkpoint in February 2027" }, new Set(["2027"])), []);
    assert.deepEqual(untraceable({ body: "Phase 2 saves 40 hours" }, new Set()), ["40"]);
  });

  test("a stat whose figure is text is a datum: the card goes, not just its number", async () => {
    const { stripUntraceable } = await import("../product/domain/content-brief.js");
    const out = stripUntraceable({ stats: [{ label: "Uptime", value: "75%" }, { label: "Teams", value: "4" }] }, new Set(["4"]));
    assert.deepEqual(out.stats, [{ label: "Teams", value: "4" }]);
  });

  test("prose loses the clause with the figure, not the field", async () => {
    const { stripUntraceable } = await import("../product/domain/content-brief.js");
    const out = stripUntraceable({ title: "Revenue up 12% in Q3", body: "Teams moved closer, saving 40 hours. Releases became routine." }, new Set());
    assert.equal(out.title, "");
    assert.equal(out.body, "Teams moved closer. Releases became routine.");
  });

  test("a data layout left with fewer than two points is broken; a series emptied too", async () => {
    const { stripFigures } = await import("../product/domain/generation-service.js");
    const bars = byName("finance/statement-bars");
    const one = stripFigures(bars, { statement: "Growth", bars: [{ label: "N", value: 9.4, display: "9.4%" }, { label: "S", value: 8.8, display: "8.8%" }] }, new Set(["9.4"]));
    assert.equal(one.broken, true, "a one-bar chart is not a chart");
    const lines = byName("finance/line-split");
    const series = stripFigures(lines, { series: [{ values: [1, 2], color: "#000" }, { values: [3, 4], color: "#111" }] }, new Set());
    assert.equal(series.broken, true, "an emptied series is not a chart");
    const fine = stripFigures(bars, { statement: "Growth", bars: [{ label: "N", value: 9.4 }, { label: "S", value: 8.8 }, { label: "E", value: 7 }] }, new Set(["9.4", "8.8"]));
    assert.equal(fine.broken, false);
  });

  test("a chart that loses its data is rebuilt off the chart, and the note says why", async () => {
    const { composeSlides } = await import("../product/domain/generation-service.js");
    const { isDataLayout } = await import("../product/domain/template-scoring.js");
    const { mapping, provider } = chartDeck();
    const warnings = [];
    const slides = await composeSlides(provider, mapping, { title: "Quarterly review", warnings, prompt: "A review; North grew 9.4%" });
    const t = byName(slides[1].templateReference.templateName);
    assert.ok(!isDataLayout(t), `still on a data layout: ${t.name}`);
    assert.ok(!textOf(slides[1].content).includes("8.8"));
    assert.ok(warnings.some((w) => /^Slide 2: removed figures not in the material \(8\.8\)/.test(w)), JSON.stringify(warnings));
  });

  test("a title emptied by the strip is named in the note", async () => {
    const { composeSlides } = await import("../product/domain/generation-service.js");
    const mapping = [
      { slideNumber: 1, title: "Review", content: { body: ["Where we are."], notes: "" } },
      { slideNumber: 2, title: "Revenue up 12% in Q3", content: { body: ["Teams moved closer to customers.", "Releases became routine and calm."], notes: "" } },
      { slideNumber: 3, title: "Thank you", content: { body: ["Questions."], notes: "" } },
    ];
    const picks = ["main/cover-01", "core/content-twocol", "core/closing-single"];
    const provider = {
      async composeDeck({ outline }) {
        return { slides: outline.map((s, i) => ({ templateName: picks[i], theme: "light", content: { title: s.title, body: s.bullets, items: s.bullets } })) };
      },
    };
    const warnings = [];
    const slides = await composeSlides(provider, mapping, { title: "Review", warnings, prompt: "A review" });
    assert.ok(!textOf(slides[1].content).includes("12%"));
    assert.ok(warnings.some((w) => /^Slide 2: removed figures not in the material \(12\).*title/.test(w)), JSON.stringify(warnings));
  });

  test("R1: a review swap that brings in example figures has them removed, with a note", async () => {
    const { recheckFiguresAfterReview } = await import("../product/domain/generation-service.js");
    const bars = byName("finance/statement-bars");
    const before = [{ templateReference: { templateName: "core/content-twocol" }, content: { title: "Growth", body: "North 9.4%, South 8.8%, East 7.1%" } }];
    // Review moved it onto a chart, keeping the slide's own bars plus one
    // sample bar from the layout's example.
    const after = [{ templateReference: { templateName: bars.name }, content: { statement: "Growth",
      bars: [{ label: "N", value: 9.4, display: "9.4%" }, { label: "S", value: 8.8, display: "8.8%" }, { label: "Q4 22", value: 115, display: "$115M" }] } }];
    const notes = [];
    const out = recheckFiguresAfterReview(before, after, { allowed: new Set(), note: (m) => notes.push(m) });
    assert.ok(!textOf(out[0].content).includes("115"));
    assert.equal(out[0].content.bars.length, 2);
    assert.ok(notes.some((n) => /^Slide 1: removed figures not in the material \([^)]*115[^)]*\).*after review/.test(n)), JSON.stringify(notes));

    // The whole sample chart: nothing of the slide's own is left, so review's change is undone.
    const sample = [{ templateReference: { templateName: bars.name }, content: { ...bars.example } }];
    const notes2 = [];
    const out2 = recheckFiguresAfterReview(before, sample, { allowed: new Set(), note: (m) => notes2.push(m) });
    assert.equal(out2[0].templateReference.templateName, "core/content-twocol");
    assert.ok(notes2.some((n) => /review's layout change was undone/.test(n)), JSON.stringify(notes2));

    // Untouched slides are not re-checked (system numbers such as page refs stay).
    const same = recheckFiguresAfterReview(before, before.map((s) => ({ ...s })), { allowed: new Set(), note: () => assert.fail("noted") });
    assert.equal(same[0].content.body, before[0].content.body);
  });

  test("stat grids and big numbers count as data layouts, and none leads a figure-less shortlist", async () => {
    const { isDataLayout } = await import("../product/domain/template-scoring.js");
    for (const n of ["finance/statement-bars", "finance/highlights", "main/data-01", "marketing/text-10"]) assert.ok(isDataLayout(byName(n)), n);
    for (const n of HOOKS) assert.ok(!isDataLayout(byName(n)), n);
    const sig = contentSignature({ title: "Revenue by region",
      bullets: ["North revenue up 12%", "South revenue up 9%", "East revenue up 4%", "West revenue flat at 0%"] }, { index: 3, total: 8 });
    const top = shortlistFor(sig, { limit: 12, deckLength: 8, figuresAvailable: false }).slice(0, 3);
    assert.ok(!top.some(isDataLayout), top.map((c) => c.name).join(", "));
  });
});

describe("final fix round: index numbers", () => {
  test("a card's `number` running 1..N is an index, not a figure: every card is kept", async () => {
    const { stripUntraceable, dataPoints } = await import("../product/domain/content-brief.js");
    const mosaic = byName("core/cards-mosaic-5-photo");
    const content = { ...mosaic.example, cards: mosaic.example.cards.map((c) => ({ ...c, label: "Teams moved closer" })) };
    assert.equal(content.cards.length, 6);
    assert.deepEqual(untraceable(content, new Set()), []);
    assert.equal(stripUntraceable(content, new Set()).cards.length, 6);
    assert.equal(dataPoints({ cards: content.cards }), 0, "an index is not a data point");
    // As text too ("1".."3").
    assert.deepEqual(untraceable({ cards: [{ number: "1" }, { number: "2" }, { number: "3" }] }, new Set()), []);
    // Zero-padded badges ("01".."12") too, past nine.
    const padded = Array.from({ length: 12 }, (_, i) => ({ number: String(i + 1).padStart(2, "0") }));
    assert.deepEqual(untraceable({ cards: padded }, new Set()), []);
  });

  test("a `number` that is not a 1..N sequence, and real data beside an index, are still checked", async () => {
    const { stripUntraceable } = await import("../product/domain/content-brief.js");
    assert.deepEqual(untraceable({ cards: [{ number: 7 }, { number: 12 }] }, new Set()), ["7", "12"]);
    assert.deepEqual(untraceable({ cards: [{ number: 2 }, { number: 3 }] }, new Set()), ["2", "3"]);
    const mixed = { cards: [{ number: 1, value: "40%", label: "A" }, { number: 2, value: "Fast", label: "B" }] };
    assert.deepEqual(untraceable(mixed, new Set()), ["40"]);
    assert.deepEqual(stripUntraceable(mixed, new Set()).cards, [{ number: 2, value: "Fast", label: "B" }]);
  });
});

/* The 2026-10-22 quality run: main/timeline-02 shipped empty on 11 slides in
 * 20 decks, because each block's position and size (l, w, top, h) were read as
 * invented figures and every block was dropped. Layout numbers place things;
 * they are never shown, so they are not figures. */
describe("layout numbers are not figures", () => {
  const words = (example, keep) => JSON.parse(JSON.stringify(example), (k, v) =>
    (typeof v === "string" && !keep.has(k) && /\d/.test(v) ? "Discovery" : v));
  const NONE = new Set();

  test("a gantt keeps every block: positions, sizes, rows and lanes are layout", async () => {
    const { stripUntraceable, dataPoints } = await import("../product/domain/content-brief.js");
    for (const [name, key] of [["main/timeline-02", "blocks"], ["main/timeline-01", "bars"], ["main/grid-08", "cards"],
      ["planning/grid-11", "rows"], ["planning/grid-12", "rows"]]) {
      const content = words(byName(name).example, new Set());
      assert.deepEqual(untraceable(content, NONE), [], name);
      assert.equal(stripUntraceable(content, NONE)[key].length, byName(name).example[key].length, name);
      assert.equal(dataPoints({ [key]: content[key] }), 0, `${name}: placement is not a data point`);
    }
    const lanes = words(byName("marketing/grid-29").example, new Set());
    assert.deepEqual(untraceable(lanes, NONE), [], "from/to/lane/top on marketing/grid-29");
  });

  test("display settings (active, cols, days, at, today) are layout too", () => {
    assert.deepEqual(untraceable({ title: "Plan", active: 2, cols: 3, days: 31, today: 0.4, months: [{ label: "May", at: 0.25 }] }, NONE), []);
  });

  test("data beside the geometry is still checked", async () => {
    const { stripUntraceable } = await import("../product/domain/content-brief.js");
    // A donut segment's share (f) is data; its label position (left/top) is not.
    const donut = { segments: [{ f: 0.743, n: "Cloud", left: 1256, top: 300 }, { f: 0.5, n: "Edge", left: 100, top: 40 }] };
    assert.deepEqual(untraceable(donut, new Set(["0.5"])), ["0.743"]);
    assert.deepEqual(stripUntraceable(donut, new Set(["0.5"])).segments, [{ f: 0.5, n: "Edge", left: 100, top: 40 }]);
    // A figure written as text under a layout key is still a figure.
    assert.deepEqual(untraceable({ blocks: [{ label: "Pilot", top: "40% faster" }] }, NONE), ["40"]);
    // A chart's values and bar lengths stay data.
    assert.deepEqual(untraceable({ bars: [{ name: "A", v: 64 }], series: [{ values: [3, 9] }] }, NONE), ["64", "3", "9"]);
  });
});

describe("final fix round: a degraded deck is held to the figure rule", () => {
  const mapping = () => [
    { slideNumber: 1, title: "Quarterly review", content: { body: ["Where the year landed."], notes: "" } },
    { slideNumber: 2, title: "Growth held steady", content: { body: ["Teams moved closer, saving 40 hours.", "Releases became routine."], notes: "" } },
    { slideNumber: 3, title: "Thank you", content: { body: ["Questions welcome."], notes: "" } },
  ];

  test("composition failing (e.g. a usage limit) still takes invented figures out, with a note", async () => {
    const { composeSlides } = await import("../product/domain/generation-service.js");
    const provider = { async composeDeck() { throw new Error("usage limit reached"); } };
    const warnings = [];
    const slides = await composeSlides(provider, mapping(), { title: "Quarterly review", warnings, prompt: "A quarterly review" });
    assert.ok(!textOf(slides[1].content).includes("40"), textOf(slides[1].content));
    assert.ok(textOf(slides[1].content).includes("Teams moved closer"));
    assert.ok(warnings.some((w) => /^Slide 2: removed figures not in the material \(40\)/.test(w)), JSON.stringify(warnings));
  });

  test("a slide with no pick keeps the default layout, and its invented figures are taken out", async () => {
    const { composeSlides } = await import("../product/domain/generation-service.js");
    const provider = { async composeDeck() { return { slides: [] }; } };
    const warnings = [];
    const slides = await composeSlides(provider, mapping(), { title: "Quarterly review", warnings, prompt: "A quarterly review" });
    assert.ok(!textOf(slides[1].content).includes("40"), textOf(slides[1].content));
    assert.ok(warnings.some((w) => /^Slide 2: removed figures not in the material \(40\)/.test(w)), JSON.stringify(warnings));
    // A figure the material gives stays.
    const kept = await composeSlides(provider, mapping(), { title: "Quarterly review", warnings: [], prompt: "We saved 40 hours" });
    assert.ok(textOf(kept[1].content).includes("40 hours"));
  });
});
