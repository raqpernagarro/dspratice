// test/intelligence-prompts.test.js — the three intelligence-layer prompts
// (understand → content brief, story → arc + hook, voice → copy edit) and
// the provider contract defaults that let the pipeline skip a step.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, chmodSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildUnderstandPrompt,
  buildStoryPrompt,
  buildVoicePrompt,
  normaliseBrief,
  buildPrompt,
  ClaudeCliProvider,
} from "../product/infrastructure/ai/claude-cli-provider.js";
import { AIProvider } from "../product/infrastructure/ai/ai-provider.js";
import { voiceRules, HOOK_TASTE } from "../product/domain/voice.js";

const BRIEF = {
  coreIdea: "Quality engineering has to move into the pipeline.",
  audience: { who: "CIO and delivery leads", tension: "releases slip", wants: "a plan" },
  register: "thought",
  insights: [{ point: "Testing happens too late", soWhat: "defects cost more" }],
  proof: [{ fact: "Release cycle cut from 6 weeks to 2", source: "ref-1" }],
  implications: ["Teams own quality"],
  objections: ["We lack automation skills"],
  gaps: ["no client example"],
  moments: [{ text: "A Friday release rolled back at midnight", source: "prompt" }],
};

test("buildUnderstandPrompt includes the prompt, reference names and the proof rule", () => {
  const p = buildUnderstandPrompt({
    prompt: "A deck on shifting quality left for our CIO",
    answers: { audience: "CIO" },
    references: [
      { id: "ref-1", name: "QA report.pdf", text: "Release cycle cut from 6 weeks to 2." },
      { id: "ref-2", name: "Notes.md", text: "Friday rollback." },
    ],
  });
  assert.ok(p.includes("A deck on shifting quality left for our CIO"));
  assert.ok(p.includes("QA report.pdf"));
  assert.ok(p.includes("Notes.md"));
  assert.ok(p.includes("Only facts present in the material go in proof"));
});

test("buildUnderstandPrompt stays within the prompt cap with a huge reference", () => {
  const p = buildUnderstandPrompt({
    prompt: "Short prompt",
    answers: {},
    references: [
      { id: "ref-1", name: "Huge.pdf", text: "x".repeat(200_000) },
      { id: "ref-2", name: "Small.txt", text: "A small note that must survive." },
    ],
  });
  assert.ok(p.length <= 32_000, `length ${p.length}`);
  assert.ok(p.includes("A small note that must survive."));
});

test("buildUnderstandPrompt works without references or answers", () => {
  const p = buildUnderstandPrompt({ prompt: "Just a prompt" });
  assert.ok(p.includes("Just a prompt"));
  assert.ok(p.length <= 32_000);
});

test("buildStoryPrompt without a hook says so and keeps arc and callback", () => {
  const p = buildStoryPrompt({ brief: BRIEF, wantsHook: false });
  assert.ok(p.includes("Do not write a hook"));
  assert.ok(/callback/i.test(p));
  assert.ok(!p.includes(HOOK_TASTE));
});

test("buildStoryPrompt with a hook carries the taste rules and the five kinds", () => {
  const p = buildStoryPrompt({ brief: BRIEF, wantsHook: true, slideCount: 8 });
  assert.ok(p.includes(HOOK_TASTE));
  for (const k of ["moment", "number", "question", "paradox", "scene"]) assert.ok(p.includes(k), k);
  assert.ok(p.includes("8"));
});

test("buildStoryPrompt uses the brief's register", () => {
  const p = buildStoryPrompt({ brief: { ...BRIEF, register: "board" }, wantsHook: true });
  assert.ok(p.includes(voiceRules("board")));
});

test("buildVoicePrompt carries the no-new-facts rule, budgets and voice rules", () => {
  const slides = [
    { index: 0, templateName: "core/title", content: { title: "Quality in the pipeline" }, budget: { title: 60 } },
    { index: 3, templateName: "core/content", content: { title: "Why now", body: ["Releases slip"] }, budget: { title: 70, body: 240 } },
  ];
  const p = buildVoicePrompt({ register: "client", slides });
  assert.ok(p.includes("Never add a number, name or date"));
  assert.ok(p.includes(voiceRules("client")));
  assert.ok(p.includes('"title":60'));
  assert.ok(p.includes('"body":240'));
});

test("AIProvider defaults resolve null for the three intelligence steps", async () => {
  const p = new AIProvider();
  assert.equal(await p.understandContent({}), null);
  assert.equal(await p.planStory({}), null);
  assert.equal(await p.editVoice({}), null);
});

test("normaliseBrief keeps only proof and moments sourced from the material", () => {
  const references = [{ id: "ref-1", name: "QA.pdf", text: "..." }, { name: "Unnamed.txt", text: "..." }];
  const b = normaliseBrief({
    ...BRIEF,
    proof: [
      { fact: "Release cycle cut from 6 weeks to 2", source: "ref-1" },
      { fact: "40 engineers on the programme", source: "prompt" },
      { fact: "Budget approved in March", source: "answer" },
      { fact: "Second file says 12 squads", source: "ref-2" },
      { fact: "Industry average defect cost is 30x", source: "expertise" },
      { fact: "Most firms test late", source: "industry benchmark" },
    ],
    moments: [
      { text: "A Friday rollback", source: "prompt" },
      { text: "A typical CIO's Monday", source: "expertise" },
    ],
  }, { references });
  assert.deepEqual(b.proof.map((p) => p.source), ["ref-1", "prompt", "answer", "ref-2"]);
  assert.deepEqual(b.moments.map((m) => m.source), ["prompt"]);
});

// ---- Outline prompt (Task 4): story-led, optional hook, figures from the material only

const STORY = {
  hook: { kind: "moment", text: "A Friday release rolled back at midnight.", framing: "Late testing is the cost." },
  arc: [
    { beat: "tension", titles: ["Late testing keeps breaking our releases"] },
    { beat: "change", titles: ["Quality moves into the pipeline"] },
    { beat: "ask", titles: ["Start with one product team this quarter"] },
  ],
  callback: "Back to that Friday night: with checks in the pipeline, it never ships.",
};

test("buildPrompt drops plausible figures and keeps figures to the material", () => {
  const p = buildPrompt("x");
  assert.ok(!p.includes("plausible figures"));
  assert.ok(!/mark them as illustrative/i.test(p));
  assert.ok(p.includes("Use only figures that appear in the request"));
  assert.ok(p.includes("say in the speaker notes which figure to add"));
});

test("buildPrompt with a wanted hook makes slide 2 the hook from the story", () => {
  const p = buildPrompt("x", [], { wantsHook: true, story: STORY });
  assert.ok(p.includes("Slide 2 is the hook"));
  assert.ok(p.includes(STORY.hook.text));
  assert.ok(p.includes('"role": "hook"'));
});

test("buildPrompt without a hook says there is no hook slide", () => {
  const p = buildPrompt("x", [], { wantsHook: false, story: { ...STORY, hook: null } });
  assert.ok(p.includes("No hook slide"));
  assert.ok(!p.includes("Slide 2 is the hook"));
});

test("buildPrompt with a slide count and a hook counts the hook within it", () => {
  const p = buildPrompt("x", [], { slideCount: 8, wantsHook: true, story: STORY });
  assert.ok(p.includes("exactly 8 slides"));
  assert.ok(p.includes("the cover and the hook are two of them"));
});

test("buildPrompt slideCount overrides a count in the prompt; null leaves it to the prompt", () => {
  const over = buildPrompt("Make a 12 slide deck on testing", [], { slideCount: 6 });
  assert.ok(over.includes("exactly 6 slides"));
  assert.ok(!over.includes("exactly 12 slides"));
  const fromPrompt = buildPrompt("Make a 12 slide deck on testing", [], { slideCount: null });
  assert.ok(fromPrompt.includes("exactly 12 slides"));
  const free = buildPrompt("A deck on testing", [], { slideCount: null });
  assert.ok(!/exactly \d+ slides/.test(free));
});

test("buildPrompt follows the story arc and the callback", () => {
  const p = buildPrompt("x", [], { wantsHook: true, story: STORY });
  for (const b of STORY.arc) for (const t of b.titles) assert.ok(p.includes(t), t);
  assert.ok(p.includes("The last slide returns to the opening"));
  assert.ok(p.includes(STORY.callback));
});

test("buildPrompt carries the brief's proof and gaps, and the voice rules for the register", () => {
  const p = buildPrompt("x", [], { brief: BRIEF, story: STORY, register: "board", wantsHook: true });
  assert.ok(p.includes(voiceRules("board")));
  assert.ok(p.includes("Release cycle cut from 6 weeks to 2"));
  assert.ok(p.includes("no client example"));
  assert.ok(p.includes("Use only figures that appear in the request or in Proof"));
});

test("buildPrompt keeps the formula budget and the count rules", () => {
  const p = buildPrompt("x");
  assert.ok(p.includes('at most one "X, not Y" contrast'));
  assert.ok(p.includes("A number written in a title or subtitle must match what the slide shows"));
});

test("buildPrompt stays within the prompt cap with a huge brief and story", () => {
  const big = "y".repeat(5_000);
  const brief = {
    ...BRIEF,
    coreIdea: big,
    insights: Array.from({ length: 40 }, () => ({ point: big, soWhat: big })),
    proof: Array.from({ length: 40 }, () => ({ fact: big, source: "prompt" })),
    gaps: Array.from({ length: 40 }, () => big),
    moments: Array.from({ length: 40 }, () => ({ text: big, source: "prompt" })),
  };
  const story = {
    hook: { kind: "scene", text: big, framing: big },
    arc: Array.from({ length: 20 }, (_, i) => ({ beat: `b${i}`, titles: Array.from({ length: 20 }, () => big) })),
    callback: big,
  };
  const p = buildPrompt("A deck on testing", [], { brief, story, register: "client", wantsHook: true, slideCount: 10 });
  assert.ok(p.length <= 32_000, `length ${p.length}`);
});

test("generatePresentation keeps role: hook on the proposed mapping", async () => {
  const dir = mkdtempSync(join(tmpdir(), "fake-claude-"));
  const outline = {
    title: "Quality in the pipeline",
    subtitle: "Move testing into delivery",
    slides: [
      { title: "Quality in the pipeline", bullets: [], notes: "" },
      { title: "A Friday release rolled back at midnight.", bullets: [], notes: "", role: "hook" },
      { title: "Late testing keeps breaking our releases", bullets: ["Defects surface after merge"], notes: "" },
      { title: "Start with one product team", bullets: ["Pick the team"], notes: "" },
    ],
  };
  writeFileSync(join(dir, "envelope.json"), JSON.stringify({ result: JSON.stringify(outline), usage: {} }));
  const bin = join(dir, "claude");
  writeFileSync(bin, `#!/bin/sh\ncat "${join(dir, "envelope.json")}"\n`);
  chmodSync(bin, 0o755);
  const oldPath = process.env.PATH;
  process.env.PATH = `${dir}:${oldPath}`;
  try {
    const r = await new ClaudeCliProvider().generatePresentation({ prompt: "A deck on testing", wantsHook: true, story: STORY });
    assert.equal(r.proposedMapping[1].role, "hook");
    assert.equal(r.proposedMapping[0].role, undefined);
    assert.equal(r.proposedMapping[2].role, undefined);
  } finally {
    process.env.PATH = oldPath;
    rmSync(dir, { recursive: true, force: true });
  }
});
