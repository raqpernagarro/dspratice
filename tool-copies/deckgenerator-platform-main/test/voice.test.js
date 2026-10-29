import test from "node:test";
import assert from "node:assert/strict";
import { TONES, voiceRules, HOOK_TASTE } from "../product/domain/voice.js";
import { lintText, lintDeck } from "../js/voice-lint.js";

const kinds = (fs) => fs.map((f) => f.kind);

test("lintText flags banned phrases and exclamation marks", () => {
  const k = kinds(lintText("Unlock the power of AI!"));
  assert.ok(k.includes("banned"));
  assert.ok(k.includes("exclaim"));
});

test("lintText passes plain concrete copy", () => {
  assert.deepEqual(lintText("Approvals wait in queues. Handoffs drop context."), []);
});

test("lintDeck allows one contrast and flags the second", () => {
  const { findings, score } = lintDeck([
    { texts: [], title: "Not a tool, but a system" },
    { texts: [], title: "A platform, not a project" },
  ]);
  assert.equal(findings.filter((f) => f.kind === "contrast").length, 1);
  assert.equal(findings.find((f) => f.kind === "contrast").slide, 1);
  assert.equal(score, findings.length);
});

test("lintDeck flags a second title using three", () => {
  const { findings } = lintDeck([
    { texts: [], title: "Three risks to manage" },
    { texts: [], title: "Three decisions for the board" },
  ]);
  assert.equal(findings.filter((f) => f.kind === "three-title").length, 1);
});

test("lintDeck flags repeated body openers", () => {
  const { findings } = lintDeck([
    { texts: ["We build things."] },
    { texts: ["We ship things."] },
    { texts: ["We run things."] },
  ]);
  assert.equal(findings.filter((f) => f.kind === "opener").length, 1);
});

test("lintDeck flags a second featured triad in titles", () => {
  const { findings } = lintDeck([
    { texts: [], title: "Speed, cost and quality" },
    { texts: [], title: "People, process or tools" },
  ]);
  assert.equal(findings.filter((f) => f.kind === "triad").length, 1);
});

test("lintDeck flags truisms through TRUISM itself", () => {
  const { findings } = lintDeck([{ texts: ["In today's digital landscape we adapt."] }]);
  assert.deepEqual(kinds(findings), ["truism"]);
});

test("plain negation is not a contrast", () => {
  for (const t of ["We do not guess, we measure the result.", "Not every team is ready, so we start small."]) {
    const { findings } = lintDeck([{ texts: [], title: "A" }, { texts: [t] }, { texts: [t] }]);
    assert.equal(findings.filter((f) => f.kind === "contrast").length, 0, t);
  }
});

test("rhetorical contrast forms are detected", () => {
  for (const t of ["It isn't a tool, but a system.", "Not just speed, but control.", "A platform, not a project.", "We don't just build. We run it."]) {
    const { findings } = lintDeck([{ texts: [t] }, { texts: [t] }]);
    assert.equal(findings.filter((f) => f.kind === "contrast").length, 1, t);
  }
});

test("voiceRules carries tone rows and banned list", () => {
  assert.ok(voiceRules("board").includes("figures and decisions"));
  assert.equal(voiceRules("nope"), voiceRules("thought"));
  for (const t of TONES) assert.ok(voiceRules(t).length > 0);
  const rules = voiceRules().toLowerCase();
  for (const p of ["unlock", "unleash", "revolutionise", "revolutionize", "supercharge",
    "harness the power of", "cutting-edge", "game-changing", "best-in-class",
    "tectonic shift", "on the cusp", "in today's rapidly evolving", "seamless", "leverage"]) {
    assert.ok(rules.includes(p), p);
  }
  assert.match(rules, /exclamation/);
  assert.ok(HOOK_TASTE.includes("Picture this"));
});
