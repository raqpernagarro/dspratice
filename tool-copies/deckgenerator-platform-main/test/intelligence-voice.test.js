// test/intelligence-voice.test.js
// =============================================================================
// The voice pass after fill (Task 7): the words are edited to the Nagarro
// voice, and any slide the edit makes worse keeps its original wording.
// =============================================================================
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { allTemplates } from "../js/templates/index.js";
import { runVoicePass } from "../product/domain/generation-service.js";
import { buildVoicePrompt } from "../product/infrastructure/ai/claude-cli-provider.js";

process.env.NPS_VISUAL_REVIEW = "0";

const tpl = (name) => ({ order: 0, templateReference: { templateName: name, templateVersion: 1, templatePackId: "main-template" }, themeOverride: "light" });
const slide = (name, content, extra = {}) => ({ ...tpl(name), content, ...extra });

function deck() {
  return [
    slide("core/content-twocol", { title: "Our approach is truly cutting-edge", body: ["Teams leverage new tools to move faster.", "Releases became routine."], notes: "Talk about the teams." }),
    slide("core/content-twocol", { title: "What changed", body: ["Teams moved closer to customers.", "Releases became routine."], notes: "" }),
  ];
}

/** A provider whose editVoice applies `edit(content, index)` to each slide sent. */
function stub(edit) {
  const calls = [];
  return {
    calls,
    async editVoice(req) {
      calls.push(req);
      return { slides: req.slides.map((s) => ({ index: s.index, content: edit(structuredClone(s.content), s.index) })) };
    },
  };
}

const run = (provider, slides, opts = {}) => {
  const warnings = [];
  const frames = [];
  return runVoicePass(provider, slides, {
    register: "thought", allowed: new Set(), note: (m) => warnings.push(m),
    sink: { emit: (f) => frames.push(f) }, ...opts,
  }).then((out) => ({ out, warnings, frames }));
};

describe("voice pass", () => {
  test("a good edit (shorter, no numbers) is applied, with the voice stage", async () => {
    const provider = stub((c, i) => (i === 0 ? { ...c, title: "Our approach is current", body: ["Teams use new tools to move faster.", "Releases became routine."] } : c));
    const { out, warnings, frames } = await run(provider, deck());
    assert.equal(out[0].content.title, "Our approach is current");
    assert.equal(out[0].content.body[0], "Teams use new tools to move faster.");
    assert.deepEqual(out[1].content, deck()[1].content);
    assert.deepEqual(warnings, []);
    assert.ok(frames.some((f) => f.stage === "voice" && f.detail === "Polishing the voice"));
    assert.equal(provider.calls[0].register, "thought");
    assert.ok(provider.calls[0].slides[0].budget.title >= "Our approach is truly cutting-edge".length);
  });

  test("an edit adding a figure keeps the original, with a note", async () => {
    const provider = stub((c, i) => (i === 1 ? { ...c, title: "€5M changed" } : c));
    const { out, warnings } = await run(provider, deck());
    assert.equal(out[1].content.title, "What changed");
    assert.ok(warnings.some((w) => /^Slide 2 kept its original wording \(/.test(w)), JSON.stringify(warnings));
  });

  test("a figure the material holds is fine", async () => {
    const provider = stub((c, i) => (i === 1 ? { ...c, title: "5 things changed" } : c));
    const { out } = await run(provider, deck(), { allowed: new Set(["5"]) });
    assert.equal(out[1].content.title, "5 things changed");
  });

  test("an edit dropping an array item keeps the original", async () => {
    const provider = stub((c, i) => (i === 1 ? { ...c, body: ["Teams moved closer to customers."] } : c));
    const { out, warnings } = await run(provider, deck());
    assert.deepEqual(out[1].content.body, deck()[1].content.body);
    assert.ok(warnings.some((w) => w.startsWith("Slide 2 kept its original wording")));
  });

  test("an edit adding a key keeps the original", async () => {
    const provider = stub((c, i) => (i === 1 ? { ...c, subtitle: "New" } : c));
    const { out } = await run(provider, deck());
    assert.deepEqual(out[1].content, deck()[1].content);
  });

  test("an edit longer than its budget keeps the original", async () => {
    const provider = stub((c, i) => (i === 1 ? { ...c, body: ["Teams moved closer to customers. ".repeat(20).trim(), "Releases became routine."] } : c));
    const { out, warnings } = await run(provider, deck());
    assert.deepEqual(out[1].content.body, deck()[1].content.body);
    assert.ok(warnings.some((w) => w.startsWith("Slide 2 kept its original wording")));
  });

  test("an edit with more voice findings keeps the original", async () => {
    const provider = stub((c, i) => (i === 1 ? { ...c, title: "Unleash change!" } : c));
    const { out } = await run(provider, deck());
    assert.equal(out[1].content.title, "What changed");
  });

  for (const [label, provider] of [
    ["throws", { async editVoice() { throw new Error("CLI timed out"); } }],
    ["returns null", { async editVoice() { return null; } }],
  ]) {
    test(`editVoice ${label}: all originals, one note`, async () => {
      const slides = deck();
      const { out, warnings } = await run(provider, slides);
      assert.deepEqual(out.map((s) => s.content), deck().map((s) => s.content));
      assert.equal(warnings.length, 1, JSON.stringify(warnings));
      assert.match(warnings[0], /The voice pass was unavailable/);
    });
  }

  test("a provider without editVoice: all originals, silently (no pass offered)", async () => {
    const { out, warnings } = await run({}, deck());
    assert.deepEqual(out.map((s) => s.content), deck().map((s) => s.content));
    assert.deepEqual(warnings, []);
  });

  test("edits that introduce two \"X, not Y\" titles revert the whole pass", async () => {
    const clean = () => [deck()[1], deck()[1]];
    const provider = stub((c, i) => ({ ...c, title: i === 0 ? "A platform, not a project" : "A habit, not a launch" }));
    const { out, warnings } = await run(provider, clean());
    assert.deepEqual(out.map((s) => s.content), clean().map((s) => s.content));
    assert.ok(warnings.some((w) => /voice/i.test(w) && /undone|reverted/i.test(w)), JSON.stringify(warnings));
  });

  test("speaker notes are edited, and a figure added to them is rejected", async () => {
    const good = stub((c, i) => (i === 0 ? { ...c, notes: "Talk about the team." } : c));
    let r = await run(good, deck());
    assert.equal(r.out[0].content.notes, "Talk about the team.");

    const bad = stub((c, i) => (i === 0 ? { ...c, notes: "Talk about the 40 teams." } : c));
    r = await run(bad, deck());
    assert.equal(r.out[0].content.notes, "Talk about the teams.");
    assert.ok(r.warnings.some((w) => w.startsWith("Slide 1 kept its original wording")));
  });

  test("a double-wrapped edit is unwrapped before the structure check", async () => {
    const provider = {
      async editVoice(req) {
        return { slides: req.slides.map((s) => ({ index: s.index, content: { content: { ...s.content, title: s.index === 1 ? "What moved" : s.content.title } } })) };
      },
    };
    const { out, warnings } = await run(provider, deck());
    assert.equal(out[1].content.title, "What moved");
    assert.deepEqual(warnings, []);
  });

  test("the hook keeps its role and theme", async () => {
    const slides = [slide("marketing/text-03", { eyebrow: "", statement: "What if every release were boring?", notes: "" }, { role: "hook", themeOverride: "light" })];
    const provider = stub((c) => ({ ...c, statement: "What if releases were boring?" }));
    const { out } = await run(provider, slides);
    assert.equal(out[0].role, "hook");
    assert.equal(out[0].themeOverride, "light");
    assert.equal(out[0].content.statement, "What if releases were boring?");
  });

  test("slides are batched so each prompt stays under 28,000 characters", async () => {
    const long = "Teams moved closer to customers and releases became routine across the group. ".repeat(12);
    const slides = Array.from({ length: 40 }, () => slide("core/content-twocol", { title: "What changed", body: [long, long], notes: long }));
    const provider = stub((c) => c);
    await run(provider, slides);
    assert.ok(provider.calls.length > 1, "expected more than one batch");
    for (const req of provider.calls) assert.ok(buildVoicePrompt(req).length < 28_000, `prompt ${buildVoicePrompt(req).length}`);
    assert.equal(provider.calls.reduce((n, r) => n + r.slides.length, 0), 40);
  });
});

describe("composeSlides runs the voice pass", () => {
  test("the edit lands on the finished deck, and the voice stage is reported", async () => {
    const { composeSlides } = await import("../product/domain/generation-service.js");
    const byName = (name) => allTemplates.find((t) => t.name === name);
    const mapping = [
      { slideNumber: 1, title: "Quarterly review", content: { body: ["Where the year landed."], notes: "" } },
      { slideNumber: 2, title: "What changed", content: { body: ["Teams moved closer to customers.", "Releases became routine."], notes: "" } },
      { slideNumber: 3, title: "Thank you", content: { body: ["Questions welcome."], notes: "" } },
    ];
    const picks = ["main/cover-01", "core/content-twocol", "core/closing-single"];
    let sent = null;
    const provider = {
      async generatePresentation() { throw new Error("not used"); },
      async composeDeck({ outline }) {
        return { slides: outline.map((s, i) => ({ templateName: byName(picks[i]).name, theme: "light", content: { title: s.title, body: s.bullets, items: s.bullets } })) };
      },
      async editVoice(req) {
        sent = req;
        return { slides: req.slides.map((s) => ({ index: s.index, content: s.content.title === "What changed" ? { ...s.content, title: "What moved" } : s.content })) };
      },
    };
    const frames = [];
    const slides = await composeSlides(provider, mapping, {
      title: "Quarterly review", warnings: [], onProgress: (f) => frames.push(f),
      prompt: "A quarterly review", brief: { proof: [], register: "board" }, references: [],
    });
    assert.equal(sent.register, "board");
    assert.ok(slides.some((s) => s.content?.title === "What moved"), JSON.stringify(slides.map((s) => s.content?.title)));
    assert.ok(frames.some((f) => f.stage === "voice"), JSON.stringify(frames.map((f) => f.stage)));
  });
});

describe("voice pass, fix round 1", () => {
  test("an edit that blanks a list item or the title keeps the original", async () => {
    for (const edit of [
      (c) => ({ ...c, body: ["Teams moved closer to customers.", ""] }),
      (c) => ({ ...c, title: "" }),
      (c) => ({ ...c, title: "   " }),
    ]) {
      const { out, warnings } = await run(stub((c, i) => (i === 1 ? edit(c) : c)), deck());
      assert.deepEqual(out[1].content, deck()[1].content);
      assert.ok(warnings.some((w) => /^Slide 2 kept its original wording \(the edit emptied a field\)/.test(w)), JSON.stringify(warnings));
    }
  });

  test("an edit that cuts prose below 40% of its length keeps the original", async () => {
    const provider = stub((c, i) => (i === 1 ? { ...c, body: ["Teams moved.", "Releases became routine."] } : c));
    const { out, warnings } = await run(provider, deck());
    assert.deepEqual(out[1].content, deck()[1].content);
    assert.ok(warnings.some((w) => /under 40%/.test(w)), JSON.stringify(warnings));
  });

  test("a figure only in the speaker notes cannot move onto the slide", async () => {
    const slides = [slide("core/content-twocol", { title: "Cost came down", body: ["Spend fell after the move."], notes: "We saved 40% on cost." })];
    const provider = stub((c) => ({ ...c, title: "We saved 40%" }));
    const { out, warnings } = await run(provider, slides);
    assert.equal(out[0].content.title, "Cost came down");
    assert.ok(warnings.some((w) => /figures not in the material: 40/.test(w)), JSON.stringify(warnings));
  });

  test("notes may cite a figure the slide shows", async () => {
    const slides = [slide("core/content-twocol", { title: "We saved 40%", body: ["Spend fell after the move."], notes: "Talk about the savings here." })];
    const provider = stub((c) => ({ ...c, notes: "Talk about the 40% savings." }));
    const { out } = await run(provider, slides);
    assert.equal(out[0].content.notes, "Talk about the 40% savings.");
  });

  test("figures swapped between list items are rejected", async () => {
    const slides = [slide("core/content-twocol", { title: "The year", body: ["Costs rose 12%.", "Churn fell 3%."], notes: "" })];
    const provider = stub((c) => ({ ...c, body: ["Costs rose 3%.", "Churn fell 12%."] }));
    const { out, warnings } = await run(provider, slides, { allowed: new Set(["12", "3"]) });
    assert.deepEqual(out[0].content.body, ["Costs rose 12%.", "Churn fell 3%."]);
    assert.ok(warnings.some((w) => w.startsWith("Slide 1 kept its original wording")), JSON.stringify(warnings));
  });

  test("contents-slide page numbers are untouched by an edit", async () => {
    const items = [
      { label: "Where we are", page: "03" },
      { label: "What comes next", page: "07" },
      { label: "How we get there", page: "12" },
    ];
    const slides = [slide("main/index-01", { title: "Contents", items, notes: "" })];
    const provider = stub((c) => ({
      ...c,
      items: [
        { label: "Where we stand", page: "12" },
        { label: "What comes next", page: "03" },
        { label: "How we get there", page: "07" },
      ],
    }));
    const { out } = await run(provider, slides);
    assert.deepEqual(out[0].content.items.map((x) => x.page), ["03", "07", "12"]);
    assert.equal(out[0].content.items[0].label, "Where we stand");
  });
});

describe("voice pass, final fix round: contents entries stay matched to their slides", () => {
  const contentsDeck = () => [
    slide("core/toc-split-9", { title: "Contents", items: [{ label: "Core migration", page: "02" }, { label: "Next steps", page: "03" }], notes: "" }),
    slide("core/content-twocol", { title: "Core migration is on track", body: ["Teams moved closer to customers."], notes: "" }),
    slide("core/content-twocol", { title: "Next steps for the team", body: ["Releases became routine."], notes: "" }),
  ];

  test("a title reworded away from its contents entry keeps its original wording, with a note", async () => {
    const provider = stub((c, i) => (i === 1 ? { ...c, title: "Platform move is on track" } : i === 2 ? { ...c, body: ["Releases are routine."] } : c));
    const { out, warnings } = await run(provider, contentsDeck());
    assert.equal(out[1].content.title, "Core migration is on track");
    assert.equal(out[2].content.body[0], "Releases are routine.", "an edit that breaks nothing is kept");
    assert.ok(warnings.some((w) => /^Slide 2 kept its original wording \(.*contents/.test(w)), JSON.stringify(warnings));
  });

  test("a contents label reworded away from its slide keeps its original wording", async () => {
    const provider = stub((c, i) => (i === 0 ? { ...c, items: [{ label: "Moving the platform", page: "02" }, c.items[1]] } : c));
    const { out, warnings } = await run(provider, contentsDeck());
    assert.equal(out[0].content.items[0].label, "Core migration");
    assert.ok(warnings.some((w) => /^Slide 1 kept its original wording \(.*contents/.test(w)), JSON.stringify(warnings));
  });

  test("a label and its title reworded together still match, and both edits are kept", async () => {
    const provider = stub((c, i) => (i === 0 ? { ...c, items: [{ label: "Platform move", page: "02" }, c.items[1]] }
      : i === 1 ? { ...c, title: "Platform move is on track" } : c));
    const { out, warnings } = await run(provider, contentsDeck());
    assert.equal(out[0].content.items[0].label, "Platform move");
    assert.equal(out[1].content.title, "Platform move is on track");
    assert.deepEqual(warnings, []);
  });
});
