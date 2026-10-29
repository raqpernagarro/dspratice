// test/brief-coach-v2.test.js
// =============================================================================
// Coach v2: a question form at every prompt-path Generate.
//
// The coach now always opens. Content questions (audience/goal, key points)
// appear only when the checklist shows them missing; the reference question
// whenever nothing is attached; the hook and the length questions always; a
// figures question only when the model says the topic needs numbers. The
// model tailors the options; anything that goes wrong gives the fixed set.
// Providers are stubs — nothing here calls a model.
// =============================================================================
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { BriefService, COACH_TIMEOUT_MS } from "../product/domain/brief-service.js";
import { buildCoachPrompt } from "../product/infrastructure/ai/claude-cli-provider.js";
import {
  coachQuestions, coachPayload, lengthWhy, checkBrief, assembleBrief,
} from "../js/brief-check.js";

const CTX = { workspaceId: "ws", userId: "u", role: "admin" };
const stub = (coachBrief) => ({ coachBrief });
const FULL = "An eight-slide deck for the board of a regional bank so that they approve a two-week pilot. " +
  "Cover why now, our approach and two case results, with revenue €412M (+8%).";
const WEAK = "a deck about our AI offering";
const ids = (out) => out.questions.map((q) => q.id);

describe("coach v2 — which questions", () => {
  test("a full prompt still opens the coach: hook and length are always asked", async () => {
    let called = false;
    const service = new BriefService(stub(async () => { called = true; return { questions: [] }; }));
    const out = await service.coach(CTX, { prompt: FULL, hasReferences: true });
    assert.deepEqual(ids(out), ["hook", "length"]);
    assert.equal(called, false, "nothing to tailor → no model call");
  });

  test("no references attached → the references question is present", async () => {
    const out = await new BriefService(stub(async () => ({ questions: [] }))).coach(CTX, { prompt: FULL });
    assert.deepEqual(ids(out), ["references", "hook", "length"]);
    const refs = out.questions.find((q) => q.id === "references");
    assert.deepEqual(refs.options.map((o) => o.value), ["attach", "paste", "none"]);
  });

  test("audience and goal both missing are merged into one question with id audience", async () => {
    const out = await new BriefService(stub(async () => { throw new Error("x"); })).coach(CTX, { prompt: WEAK });
    assert.deepEqual(ids(out), ["audience", "points", "references", "hook", "length"]);
  });

  test("only the goal missing → a goal question, no audience question", () => {
    const qs = coachQuestions(checkBrief("A deck for the board about our AI offering"), { hasReferences: true });
    assert.equal(qs[0].id, "goal");
    assert.ok(!qs.some((q) => q.id === "audience"));
  });

  test("hook: yes/no with the why; length: you-decide first, free number", async () => {
    const out = await new BriefService(stub(async () => ({ questions: [] }))).coach(CTX, { prompt: FULL });
    const hook = out.questions.find((q) => q.id === "hook");
    assert.deepEqual(hook.options.map((o) => o.value), ["yes", "no"]);
    assert.equal(hook.options[0].label, "Yes, open with a hook (recommended)");
    assert.equal(hook.options[1].label, "No, start with the content");
    assert.ok(hook.why && hook.why.length > 20);
    const length = out.questions.find((q) => q.id === "length");
    assert.equal(length.options[0].value, "you-decide");
    assert.equal(length.options[0].label, "You decide — no limitations");
    assert.deepEqual(length.options.map((o) => o.value), ["you-decide", "~5", "8-10", "12-15"]);
    assert.equal(length.freeText, true);
    assert.equal(length.multi, false);
    assert.match(length.why, /includes the cover and the hook/);
  });

  test("the length note follows the hook answer", () => {
    assert.match(lengthWhy("yes"), /includes the cover and the hook/);
    assert.doesNotMatch(lengthWhy("no"), /hook/);
  });

  test("every question has the full shape", () => {
    for (const q of coachQuestions(checkBrief(WEAK), { hasReferences: false })) {
      assert.equal(typeof q.question, "string");
      assert.ok(Array.isArray(q.options));
      assert.equal(typeof q.multi, "boolean");
      assert.equal(typeof q.freeText, "boolean");
      for (const o of q.options) assert.ok(typeof o.value === "string" && typeof o.label === "string");
    }
  });
});

describe("coach v2 — tailored options and fallback", () => {
  test("model options replace the fixed options for content questions; source model", async () => {
    let seen;
    const service = new BriefService(stub(async (req) => {
      seen = req;
      return { questions: [
        { id: "audience", question: "Who is this for, and what should they do?", placeholder: "Bank CIOs — approve a pilot",
          options: ["Bank CIOs — approve a pilot", "Claims leads — adopt the tool"] },
        { id: "points", question: "Which points must it make?", placeholder: "Why now", options: ["Why now", "Our approach", "Case results"] },
        { id: "hook", question: "should be ignored", placeholder: "", options: ["x"] },
      ] };
    }));
    const out = await service.coach(CTX, { prompt: WEAK });
    assert.equal(out.source, "model");
    assert.deepEqual(ids(out), ["audience", "points", "references", "hook", "length"]);
    assert.deepEqual(out.questions[0].options.map((o) => o.label), ["Bank CIOs — approve a pilot", "Claims leads — adopt the tool"]);
    assert.equal(out.questions[1].multi, true);
    assert.deepEqual(out.questions.find((q) => q.id === "hook").options.map((o) => o.value), ["yes", "no"]);
    assert.deepEqual(seen.ask, ["audience", "points"]);
    assert.equal(seen.merged, true);
    assert.deepEqual(seen.optional, ["figures"]);
    assert.equal(seen.timeoutMs, COACH_TIMEOUT_MS);
  });

  test("a figures question appears only when the model asks it", async () => {
    const withFigures = await new BriefService(stub(async () => ({ questions: [
      { id: "figures", question: "Which results can it cite?", placeholder: "40% faster", options: ["Claims handled 40% faster"] },
    ] }))).coach(CTX, { prompt: WEAK });
    assert.deepEqual(ids(withFigures), ["audience", "points", "references", "hook", "length", "figures"]);
    const without = await new BriefService(stub(async () => ({ questions: [] }))).coach(CTX, { prompt: WEAK });
    assert.ok(!ids(without).includes("figures"));
  });

  test("the budget is 30s (the Haiku call measured ~19s through the CLI)", () => {
    assert.equal(COACH_TIMEOUT_MS, 30_000);
  });

  for (const [name, coachBrief] of [
    ["the provider throws", async () => { throw new Error("You've hit your session limit"); }],
    ["the output is malformed", async () => ({ questions: "nope" })],
    ["the provider answers with its contract default", async () => ({ questions: [], fallback: true })],
    ["the provider never answers", () => new Promise(() => {})],
  ]) {
    test(`fallback with the same ids when ${name}`, async () => {
      const service = new BriefService(stub(coachBrief), { timeoutMs: 40 });
      const out = await service.coach(CTX, { prompt: WEAK });
      assert.equal(out.source, "fallback");
      assert.deepEqual(out.questions, coachQuestions(checkBrief(WEAK), { hasReferences: false }));
      assert.deepEqual(ids(out), ["audience", "points", "references", "hook", "length"]);
    });
  }

  test("model text stays plain and bounded", async () => {
    const long = "x".repeat(500);
    const out = await new BriefService(stub(async () => ({ questions: [
      { id: "points", question: "Which  points?", placeholder: "e.g.", options: ["<b>One</b>", long, "  ", "<b>One</b>", 3] },
    ] }))).coach(CTX, { prompt: WEAK });
    const points = out.questions.find((q) => q.id === "points");
    assert.equal(points.question, "Which points?");
    assert.deepEqual(points.options.map((o) => o.label), ["<b>One</b>"]);
  });

  test("the model prompt asks for options and merges audience with goal when both are missing", () => {
    const p = buildCoachPrompt({ prompt: WEAK, ask: ["audience", "points"], optional: ["figures"], merged: true });
    assert.match(p, /options/i);
    assert.match(p, /- audience: who will see the deck and what they should decide/);
    assert.match(p, /figures \(optional\)/);
  });
});

describe("coachPayload", () => {
  test("no hook, you decide", () => {
    const out = coachPayload({ hook: "no", length: "you-decide" });
    assert.equal(out.wantsHook, false);
    assert.equal(out.slideCount, null);
    assert.deepEqual(out.referenceIds, []);
    assert.deepEqual(out.answers, {});
  });

  test("hook and a typed number", () => {
    const out = coachPayload({ hook: "yes", length: "8" });
    assert.equal(out.wantsHook, true);
    assert.equal(out.slideCount, 8);
  });

  test("defaults: a hook (recommended), the engine decides the length", () => {
    assert.deepEqual(coachPayload({}), { wantsHook: true, slideCount: null, referenceIds: [], answers: {} });
  });

  test("length options map to a count; nonsense is no count", () => {
    assert.equal(coachPayload({ length: "~5" }).slideCount, 5);
    assert.equal(coachPayload({ length: "8-10" }).slideCount, 9);
    assert.equal(coachPayload({ length: "12-15" }).slideCount, 13);
    assert.equal(coachPayload({ length: "about 7 slides" }).slideCount, 7);
    assert.equal(coachPayload({ length: "lots" }).slideCount, null);
    assert.equal(coachPayload({ length: "0" }).slideCount, null);
    assert.equal(coachPayload({ length: "500" }).slideCount, null);
  });

  test("references and content answers pass through; content answers are the ones assembleBrief folds in", () => {
    const answers = { audience: "Bank CIOs", points: "Why now; our approach", hook: "yes", length: "you-decide", references: ["ref-1", "ref-2", 3] };
    const out = coachPayload(answers);
    assert.deepEqual(out.referenceIds, ["ref-1", "ref-2"]);
    assert.deepEqual(out.answers, { audience: "Bank CIOs", points: "Why now; our approach" });
    assert.equal(assembleBrief("A deck", out.answers), "A deck\n\nAudience: Bank CIOs\nKey points: Why now; our approach");
  });
});
