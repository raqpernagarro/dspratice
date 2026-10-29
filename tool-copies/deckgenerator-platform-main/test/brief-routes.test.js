// test/brief-routes.test.js
// =============================================================================
// The prompt coach over real HTTP: POST /api/briefs/coach, and the `coaching`
// record POST /api/generations now stores.
//
// Both servers run with a PATH that has no Claude CLI on it, so every model
// call fails at spawn (ENOENT) in milliseconds: the coach answers with its
// fallback questions and a generation fails fast — but its record, coaching
// included, is still written. Nothing here ever calls a model.
// =============================================================================
import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { startTestServer } from "./helpers/server.js";
import { coachQuestions, checkBrief } from "../js/brief-check.js";

const NO_CLAUDE = { PATH: "/usr/bin:/bin" };
let open, closed;

before(async () => {
  [open, closed] = await Promise.all([
    startTestServer({ env: NO_CLAUDE }),                       // auto-login: authenticated
    startTestServer({ env: { ...NO_CLAUDE, AUTO_LOGIN: "0" } }), // no session
  ]);
});
after(async () => { await Promise.all([open?.stop(), closed?.stop()]); });

const post = (server, path, body) => fetch(`${server.origin}${path}`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: server.origin },
  body: JSON.stringify(body),
});

describe("POST /api/briefs/coach", () => {
  test("401 without a session", async () => {
    const res = await post(closed, "/api/briefs/coach", { prompt: "a deck", missing: ["goal"] });
    assert.equal(res.status, 401);
  });

  test("400 without a prompt", async () => {
    for (const body of [{}, { prompt: "   " }, { prompt: 3 }]) {
      const res = await post(open, "/api/briefs/coach", body);
      assert.equal(res.status, 400, JSON.stringify(body));
    }
  });

  test("400 when missing is not a list", async () => {
    const res = await post(open, "/api/briefs/coach", { prompt: "a deck", missing: "goal" });
    assert.equal(res.status, 400);
  });

  test("a model that cannot run still answers — with the fixed form", async () => {
    const prompt = "a deck about our AI offering";
    const res = await post(open, "/api/briefs/coach", { prompt, missing: ["goal"] });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { questions: coachQuestions(checkBrief(prompt)), source: "fallback" });
  });

  test("hasReferences: true drops the references question", async () => {
    const res = await post(open, "/api/briefs/coach", { prompt: "a deck about our AI offering", hasReferences: true });
    const { questions } = await res.json();
    assert.ok(!questions.some((q) => q.id === "references"));
    assert.deepEqual(questions.slice(-2).map((q) => q.id), ["hook", "length"]);
  });
});

describe("POST /api/generations with coaching", () => {
  test("401 without a session", async () => {
    const res = await post(closed, "/api/generations", { prompt: "a deck" });
    assert.equal(res.status, 401);
  });

  test("400 without a prompt", async () => {
    const res = await post(open, "/api/generations", { coaching: { skipped: true } });
    assert.equal(res.status, 400);
  });

  test("the coaching record is stored, sanitized, on the generation", async () => {
    const coaching = { missing: ["audience", "goal"], asked: ["audience", "goal"], answered: ["goal"],
      source: "model", skipped: false, note: "dropped" };
    const res = await post(open, "/api/generations", { prompt: "a deck about our AI offering\n\nGoal: Agree to a pilot", coaching });
    assert.equal(res.status, 201);
    const created = await res.json();
    const stored = await (await fetch(`${open.origin}/api/generations/${created.id}`)).json();
    assert.deepEqual(stored.coaching,
      { missing: ["audience", "goal"], asked: ["audience", "goal"], answered: ["goal"], source: "model", skipped: false });
    assert.equal(stored.prompt, "a deck about our AI offering\n\nGoal: Agree to a pilot");
  });

  test("a generation without coaching stores null", async () => {
    const created = await (await post(open, "/api/generations", { prompt: "a deck" })).json();
    const stored = await (await fetch(`${open.origin}/api/generations/${created.id}`)).json();
    assert.equal(stored.coaching, null);
  });
});
