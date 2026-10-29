// test/brief-coach.test.js
// =============================================================================
// The prompt coach: one short model call for follow-up questions, and fixed
// fallback questions whenever that call cannot answer in time or in shape.
// No test here calls a model — providers are stubs, and the CLI provider is
// checked only for what it would send.
// =============================================================================
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { AIProvider } from "../product/infrastructure/ai/ai-provider.js";
import { claudeArgs, buildCoachPrompt, COACH_MODEL } from "../product/infrastructure/ai/claude-cli-provider.js";
import { fallbackQuestions, coachQuestions, checkBrief } from "../js/brief-check.js";
import { BriefService, sanitizeCoaching, COACH_TIMEOUT_MS } from "../product/domain/brief-service.js";

describe("provider contract", () => {
  test("the default coachBrief answers with the fallback questions, flagged as such", async () => {
    const out = await new AIProvider().coachBrief({ prompt: "x", ask: ["audience", "goal"] });
    assert.equal(out.fallback, true);
    assert.deepEqual(out.questions, fallbackQuestions(["audience", "goal"]));
  });
});

describe("CLI provider", () => {
  test("the coach call runs on Haiku; other calls keep the default model", () => {
    assert.equal(COACH_MODEL, "haiku");
    const withModel = claudeArgs("p", { type: "object" }, { model: COACH_MODEL });
    assert.deepEqual(withModel.slice(-2), ["--model", "haiku"]);
    assert.ok(!claudeArgs("p", { type: "object" }).includes("--model"));
  });

  test("the prompt carries the brief and asks only about the requested dimensions", () => {
    const p = buildCoachPrompt({ prompt: "A deck about our AI offer", ask: ["audience", "goal"], optional: ["figures"] });
    assert.match(p, /A deck about our AI offer/);
    assert.match(p, /- audience:/);
    assert.match(p, /- goal:/);
    assert.match(p, /figures \(optional\)/);
    assert.doesNotMatch(p, /- points:/);
    assert.doesNotMatch(p, /- length:/);
    assert.match(p, /At most 4 questions/);
  });

  test("a very long brief is cut, so the call stays short", () => {
    const p = buildCoachPrompt({ prompt: "x".repeat(20_000), ask: ["goal"], optional: [] });
    assert.ok(p.length < 6_000, `prompt is ${p.length} chars`);
  });
});

// Coach v2 (2026-10-20): the coach opens at every Generate, so the v1 rules
// these tests encoded — coach only when a core dimension is missing, at most 4
// text questions, `missing` from the client — are replaced. The v2 rules live
// in test/brief-coach-v2.test.js; what carries over is checked here.
describe("brief service", () => {
  const WEAK = "a deck about our AI offering"; // misses every dimension
  const CTX = { workspaceId: "ws", userId: "u", role: "admin" };
  const stub = (coachBrief) => ({ coachBrief });
  const q = (id, question = `About ${id}?`, placeholder = "e.g.", options = []) => ({ id, question, placeholder, options });

  test("the 30s budget is the brief's (Haiku measured ~19s through the CLI)", () => assert.equal(COACH_TIMEOUT_MS, 30_000));

  test("a dimension the prompt covers is never asked, and the model is not asked about it", async () => {
    let seen;
    const service = new BriefService(stub(async (req) => { seen = req; return { questions: [q("audience"), q("goal")] }; }));
    const out = await service.coach(CTX, { prompt: "A deck for the board about our AI offering", hasReferences: true });
    assert.deepEqual(seen.ask, ["goal", "points"]);
    assert.equal(seen.merged, false);
    assert.deepEqual(out.questions.map((x) => x.id), ["goal", "points", "hook", "length"]);
    assert.equal(out.questions[0].question, "About goal?");
  });

  test("the v1 `dimension` key is still read from a model answer", async () => {
    const service = new BriefService(stub(async () => ({ questions: [{ dimension: "points", question: "Which points?", placeholder: "x" }] })));
    const out = await service.coach(CTX, { prompt: WEAK });
    assert.equal(out.source, "model");
    assert.equal(out.questions.find((x) => x.id === "points").question, "Which points?");
  });

  test("markup in model text stays plain text (the UI renders it with textContent)", async () => {
    const evil = '<img src=x onerror="alert(1)">  Who   reads it?';
    const service = new BriefService(stub(async () => ({ questions: [q("audience", evil, "<b>CIOs</b>", ["<i>x</i>"])] })));
    const out = await service.coach(CTX, { prompt: WEAK });
    assert.equal(out.questions[0].question, '<img src=x onerror="alert(1)"> Who reads it?');
    assert.equal(out.questions[0].placeholder, "<b>CIOs</b>");
    assert.deepEqual(out.questions[0].options, [{ value: "<i>x</i>", label: "<i>x</i>" }]);
  });

  test("400-style input errors still throw", async () => {
    await assert.rejects(new BriefService(stub(async () => ({}))).coach(CTX, { prompt: "  " }), /prompt is required/);
  });

  for (const [name, coachBrief] of [
    ["the provider throws", async () => { throw new Error("Could not run the local Claude CLI"); }],
    ["the usage limit is hit", async () => { throw new Error("You've hit your session limit · resets 4pm"); }],
    ["the output is malformed", async () => ({ questions: "not an array" })],
    ["the output has no usable question", async () => ({ questions: [{ id: "goal", question: "   " }, { id: "nope", question: "?" }] })],
    ["the provider returns nothing", async () => undefined],
    ["the provider is the contract default", (req) => new AIProvider().coachBrief(req)],
  ]) {
    test(`fallback when ${name}`, async () => {
      const out = await new BriefService(stub(coachBrief)).coach(CTX, { prompt: WEAK });
      assert.deepEqual(out, { questions: coachQuestions(checkBrief(WEAK)), source: "fallback" });
    });
  }

  test("fallback when the provider is slower than the budget (e.g. queued behind two builds)", async () => {
    const service = new BriefService(stub(() => new Promise(() => {})), { timeoutMs: 40 });
    const started = Date.now();
    const out = await service.coach(CTX, { prompt: WEAK });
    assert.equal(out.source, "fallback");
    assert.ok(Date.now() - started < 1_000, "answers at the budget, not when the provider finishes");
  });
});

describe("sanitizeCoaching", () => {
  test("keeps the known shape and drops everything else", () => {
    assert.deepEqual(
      sanitizeCoaching({ missing: ["goal", "goal", "x"], asked: ["goal"], answered: [], source: "model", skipped: true, extra: 1 }),
      { missing: ["goal"], asked: ["goal"], answered: [], source: "model", skipped: true }
    );
  });
  test("unknown source becomes null; skipped is strictly boolean", () => {
    assert.deepEqual(sanitizeCoaching({ source: "made-up", skipped: "yes" }),
      { missing: [], asked: [], answered: [], source: null, skipped: false });
  });
  test("anything that is not an object is no coaching at all", () => {
    for (const v of [undefined, null, "x", 3, ["goal"]]) assert.equal(sanitizeCoaching(v), null);
  });
});
