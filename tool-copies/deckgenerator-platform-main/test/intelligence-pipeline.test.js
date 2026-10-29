// test/intelligence-pipeline.test.js
// =============================================================================
// The prompt path now runs understand → story → outline. Each step before the
// outline is optional: a failure is a note on the generation, never a failed
// deck. With `background: true` the outline is drafted after the request
// returns, and the record carries progress frames a client can poll.
//
// Exercised through the service with a stub provider that records its calls —
// no model, no HTTP — plus two route checks over a server with no Claude CLI.
// =============================================================================
import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startTestServer } from "./helpers/server.js";

process.env.NPS_VISUAL_REVIEW = "0";

let GenerationService, sanitizeCoaching, sanitizeAnswers, ReferenceService, dataDir;

before(async () => {
  dataDir = mkdtempSync(join(tmpdir(), "nps-intel-"));
  process.env.NPS_DATA_DIR = dataDir;
  ({ GenerationService } = await import("../product/domain/generation-service.js"));
  ({ sanitizeCoaching, sanitizeAnswers } = await import("../product/domain/brief-service.js"));
  ({ ReferenceService } = await import("../product/domain/reference-service.js"));
});
after(() => rmSync(dataDir, { recursive: true, force: true }));

const CONTEXT = { workspaceId: "ws-intel", userId: "u-intel", role: "admin" };

const BRIEF = {
  coreIdea: "Pilot the AI support desk in one region first",
  audience: { who: "COO", tension: "cost", wants: "a safe start" },
  register: "board",
  insights: [], proof: [{ fact: "40% of tickets repeat", source: "prompt" }],
  implications: [], objections: [], gaps: [], moments: [],
};
const STORY = { arc: [{ beat: "tension", point: "Tickets repeat" }], hook: null, callback: null };

function slides(n, hookAt = -1) {
  return Array.from({ length: n }, (_, i) => ({
    slideNumber: i + 1,
    title: `Slide ${i + 1}`,
    content: { title: `Slide ${i + 1}`, body: "b", notes: "" },
    ...(i === hookAt ? { role: "hook" } : {}),
  }));
}

/** Records every call in order. Each step can be replaced per test. */
function stubProvider(overrides = {}) {
  const calls = [];
  const provider = {
    calls,
    async understandContent(req) { calls.push(["understandContent", req]); return structuredClone(BRIEF); },
    async planStory(req) { calls.push(["planStory", req]); return structuredClone(STORY); },
    async generatePresentation(req) {
      calls.push(["generatePresentation", req]);
      const mapping = slides(4, 1);
      return { title: "Deck", slideCount: mapping.length, proposedMapping: mapping, confidencePerSlide: {}, usage: {} };
    },
  };
  for (const [k, fn] of Object.entries(overrides)) {
    provider[k] = async (req) => { calls.push([k, req]); return fn(req); };
  }
  return provider;
}

const call = (p, name) => p.calls.find(([n]) => n === name)?.[1];
const names = (p) => p.calls.map(([n]) => n);

describe("requestGeneration: understand → story → outline", () => {
  test("calls run in order and the outline receives brief, story and register", async () => {
    const p = stubProvider();
    const rec = await new GenerationService(p).requestGeneration(CONTEXT, { prompt: "A deck", answers: { audience: "COO" } });
    assert.deepEqual(names(p), ["understandContent", "planStory", "generatePresentation"]);
    assert.deepEqual(call(p, "understandContent").answers, { audience: "COO" });
    assert.deepEqual(call(p, "understandContent").references, []);
    const out = call(p, "generatePresentation");
    assert.equal(out.brief.coreIdea, BRIEF.coreIdea);
    assert.deepEqual(out.story, STORY);
    assert.equal(out.register, BRIEF.register);
    assert.equal(out.wantsHook, true);
    assert.equal(rec.status, "completed");
    assert.equal(rec.brief.coreIdea, BRIEF.coreIdea);
    assert.deepEqual(rec.story, STORY);
    assert.equal(rec.wantsHook, true);
    assert.deepEqual(rec.notes, []);
  });

  test("wantsHook:false reaches the story and the outline", async () => {
    const p = stubProvider();
    const rec = await new GenerationService(p).requestGeneration(CONTEXT, { prompt: "A deck", wantsHook: false });
    assert.equal(call(p, "planStory").wantsHook, false);
    assert.equal(call(p, "generatePresentation").wantsHook, false);
    assert.equal(rec.wantsHook, false);
    assert.ok(!rec.proposedMapping.some((s) => s.role === "hook"), "no hook slide when none was wanted");
  });

  test("slideCount reaches the story and the outline", async () => {
    const p = stubProvider();
    const rec = await new GenerationService(p).requestGeneration(CONTEXT, { prompt: "A deck", slideCount: 8 });
    assert.equal(call(p, "planStory").slideCount, 8);
    assert.equal(call(p, "generatePresentation").slideCount, 8);
    assert.equal(rec.slideCount, 8);
  });

  test("referenceIds are stored", async () => {
    const p = stubProvider();
    const refs = new ReferenceService(null);
    const a = await refs.createFromText(CONTEXT, { name: "A", text: "First" });
    const b = await refs.createFromText(CONTEXT, { name: "B", text: "Second" });
    const rec = await new GenerationService(p).requestGeneration(CONTEXT, { prompt: "A deck", referenceIds: [a.id, b.id] });
    assert.deepEqual(rec.referenceIds, [a.id, b.id]);
  });

  test("the outline's hook slide keeps role:hook on the mapping", async () => {
    const p = stubProvider();
    const rec = await new GenerationService(p).requestGeneration(CONTEXT, { prompt: "A deck" });
    assert.equal(rec.proposedMapping[1].role, "hook");
  });

  test("no marked hook when one was wanted: slide 2 becomes the hook, with a note", async () => {
    const p = stubProvider({
      generatePresentation: () => ({ title: "Deck", slideCount: 4, proposedMapping: slides(4), confidencePerSlide: {}, usage: {} }),
    });
    const rec = await new GenerationService(p).requestGeneration(CONTEXT, { prompt: "A deck" });
    assert.equal(rec.proposedMapping[1].role, "hook");
    assert.equal(rec.proposedMapping.filter((s) => s.role === "hook").length, 1);
    assert.ok(rec.notes.some((n) => /hook/i.test(n)), JSON.stringify(rec.notes));
  });

  /* 2026-10-23 roadmap run: the outline marked slide 1 — the cover — as the
   * hook. Composition never makes a bookend the hook, so the mark was lost and
   * the deck shipped without one. A mark on the cover or the closing counts as
   * no mark. */
  for (const [where, at] of [["the cover", 0], ["the closing", 3]]) {
    test(`a hook marked on ${where} moves to slide 2, with a note`, async () => {
      const p = stubProvider({
        generatePresentation: () => ({ title: "Deck", slideCount: 4, proposedMapping: slides(4, at), confidencePerSlide: {}, usage: {} }),
      });
      const rec = await new GenerationService(p).requestGeneration(CONTEXT, { prompt: "A deck" });
      assert.deepEqual(rec.proposedMapping.map((s) => s.role || null), [null, "hook", null, null]);
      assert.ok(rec.notes.some((n) => /hook/i.test(n)), JSON.stringify(rec.notes));
    });
  }

  test("no marked hook on a two-slide deck: nothing is marked", async () => {
    const p = stubProvider({
      generatePresentation: () => ({ title: "Deck", slideCount: 2, proposedMapping: slides(2), confidencePerSlide: {}, usage: {} }),
    });
    const rec = await new GenerationService(p).requestGeneration(CONTEXT, { prompt: "A deck" });
    assert.ok(!rec.proposedMapping.some((s) => s.role === "hook"));
  });

  test("understandContent throws → story skipped, outline without brief or story, note", async () => {
    const p = stubProvider({ understandContent: () => { throw new Error("boom"); } });
    const rec = await new GenerationService(p).requestGeneration(CONTEXT, { prompt: "A deck" });
    assert.deepEqual(names(p), ["understandContent", "generatePresentation"]);
    const out = call(p, "generatePresentation");
    assert.equal(out.brief, null);
    assert.equal(out.story, null);
    assert.equal(rec.status, "completed");
    assert.ok(rec.notes.some((n) => n.includes("Content understanding was unavailable")), JSON.stringify(rec.notes));
  });

  test("planStory throws → outline with the brief only, note, wantsHook still true", async () => {
    const p = stubProvider({ planStory: () => { throw new Error("boom"); } });
    const rec = await new GenerationService(p).requestGeneration(CONTEXT, { prompt: "A deck" });
    const out = call(p, "generatePresentation");
    assert.equal(out.brief.coreIdea, BRIEF.coreIdea);
    assert.equal(out.story, null);
    assert.equal(out.wantsHook, true);
    assert.equal(rec.status, "completed");
    assert.ok(rec.notes.some((n) => n.includes("Story planning was unavailable")), JSON.stringify(rec.notes));
  });

  test("a session limit on understanding degrades, it does not fail the deck", async () => {
    const p = stubProvider({
      understandContent: () => { throw new Error("You've hit your session limit · resets 3pm"); },
    });
    const rec = await new GenerationService(p).requestGeneration(CONTEXT, { prompt: "A deck" });
    assert.deepEqual(names(p), ["understandContent", "generatePresentation"]);
    assert.equal(call(p, "generatePresentation").brief, null);
    assert.equal(rec.status, "completed");
    assert.ok(rec.notes.some((n) => n.includes("Content understanding was unavailable")));
  });

  test("a provider without the intelligence steps drafts as before, with a note", async () => {
    const p = stubProvider();
    delete p.understandContent;
    delete p.planStory;
    const rec = await new GenerationService(p).requestGeneration(CONTEXT, { prompt: "A deck" });
    assert.deepEqual(names(p), ["generatePresentation"]);
    assert.equal(rec.status, "completed");
    assert.ok(rec.notes.some((n) => n.includes("Content understanding was unavailable")));
  });

  test("outline rejected as too long → retried once without brief and story, with a note", async () => {
    let n = 0;
    const p = stubProvider({
      generatePresentation: () => {
        if (++n === 1) throw new Error("That request is too long — try a shorter prompt.");
        return { title: "Deck", slideCount: 3, proposedMapping: slides(3, 1), confidencePerSlide: {}, usage: {} };
      },
    });
    const rec = await new GenerationService(p).requestGeneration(CONTEXT, { prompt: "A deck" });
    const outlines = p.calls.filter(([name]) => name === "generatePresentation").map(([, r]) => r);
    assert.equal(outlines.length, 2);
    assert.ok(outlines[0].brief && outlines[0].story);
    assert.equal(outlines[1].brief, null);
    assert.equal(outlines[1].story, null);
    assert.equal(rec.status, "completed");
    assert.ok(rec.notes.some((x) => /too long/i.test(x)), JSON.stringify(rec.notes));
  });

  test("the outline failing still fails the generation, keeping the reason", async () => {
    const p = stubProvider({ generatePresentation: () => { throw new Error("The AI took too long to respond."); } });
    const rec = await new GenerationService(p).requestGeneration(CONTEXT, { prompt: "A deck" });
    assert.equal(rec.status, "failed");
    assert.match(rec.error, /took too long/);
    assert.equal(p.calls.filter(([n]) => n === "generatePresentation").length, 1, "a timeout is not the too-long retry");
  });

  test("editing the outline keeps the hook marker on its slide", async () => {
    const p = stubProvider();
    const service = new GenerationService(p);
    const rec = await service.requestGeneration(CONTEXT, { prompt: "A deck" });
    const edited = rec.proposedMapping.map((s) => ({ ...s, sourceSlide: s.slideNumber, title: `${s.title}!` }));
    const updated = await service.updateOutline(CONTEXT, rec.id, edited);
    assert.equal(updated.proposedMapping[1].role, "hook");
    assert.equal(updated.proposedMapping.filter((s) => s.role === "hook").length, 1);
  });
});

describe("background drafting", () => {
  const until = async (fn, ms = 3000) => {
    const end = Date.now() + ms;
    for (;;) {
      const v = await fn();
      if (v) return v;
      if (Date.now() > end) throw new Error("timed out waiting");
      await new Promise((r) => setTimeout(r, 10));
    }
  };

  test("returns pending at once, writes progress, then completes", async () => {
    let releaseUnderstand, releaseOutline;
    const understandGate = new Promise((r) => { releaseUnderstand = r; });
    const outlineGate = new Promise((r) => { releaseOutline = r; });
    let outlineResolved = false;
    const p = stubProvider({
      understandContent: async () => { await understandGate; return structuredClone(BRIEF); },
      generatePresentation: async () => {
        await outlineGate;
        outlineResolved = true;
        return { title: "Deck", slideCount: 3, proposedMapping: slides(3, 1), confidencePerSlide: {}, usage: {} };
      },
    });
    const service = new GenerationService(p);
    const rec = await service.requestGeneration(CONTEXT, { prompt: "A deck", background: true });
    assert.equal(rec.status, "pending");
    assert.equal(outlineResolved, false);

    const seen = await until(async () => {
      const r = await service.getGeneration(CONTEXT, rec.id);
      return r.progress?.stage === "understanding" ? r : null;
    });
    assert.equal(seen.status, "pending");
    releaseUnderstand();

    await until(async () => (await service.getGeneration(CONTEXT, rec.id)).progress?.stage === "drafting");
    releaseOutline();

    const done = await until(async () => {
      const r = await service.getGeneration(CONTEXT, rec.id);
      return r.status === "completed" ? r : null;
    });
    assert.equal(done.proposedMapping.length, 3);
    assert.equal(done.brief.coreIdea, BRIEF.coreIdea);
  });

  test("an outline failure in the background marks the record failed", async () => {
    const p = stubProvider({ generatePresentation: () => { throw new Error("nope"); } });
    const service = new GenerationService(p);
    const rec = await service.requestGeneration(CONTEXT, { prompt: "A deck", background: true });
    const done = await until(async () => {
      const r = await service.getGeneration(CONTEXT, rec.id);
      return r.status === "failed" ? r : null;
    });
    assert.match(done.error, /nope/);
  });

  test("the boot sweep fails a draft a restart interrupted", async () => {
    const { releaseStrandedApprovals } = await import("../product/domain/generation-service.js");
    const { generationRepository } = await import("../product/storage/generation-repository.js");
    const rec = await generationRepository.insert({ workspaceId: CONTEXT.workspaceId, userId: CONTEXT.userId, prompt: "A deck" });
    await releaseStrandedApprovals();
    const after = await generationRepository.findById(rec.id);
    assert.equal(after.status, "failed");
    assert.match(after.error, /interrupted/i);
  });

  test("a slow understanding step does not shorten the outline", async () => {
    // Understanding uses most of its own allowance; the outline then takes
    // longer than understanding + story allowances together, and still lands.
    const p = stubProvider({
      understandContent: async () => { await new Promise((r) => setTimeout(r, 160)); return structuredClone(BRIEF); },
      generatePresentation: async () => {
        await new Promise((r) => setTimeout(r, 400));
        return { title: "Deck", slideCount: 3, proposedMapping: slides(3, 1), confidencePerSlide: {}, usage: {} };
      },
    });
    const service = new GenerationService(p, { understandStepMs: 200, storyStepMs: 100 });
    const rec = await service.requestGeneration(CONTEXT, { prompt: "A deck", background: true });
    const done = await until(async () => {
      const r = await service.getGeneration(CONTEXT, rec.id);
      return r.status !== "pending" ? r : null;
    });
    assert.equal(done.status, "completed", done.error || "");
    assert.equal(done.brief.coreIdea, BRIEF.coreIdea);
    assert.deepEqual(done.notes, []);
  });

  test("an understanding step over its own timeout is skipped with a note", async () => {
    const p = stubProvider({ understandContent: () => new Promise(() => {}) });
    const service = new GenerationService(p, { understandStepMs: 30 });
    const rec = await service.requestGeneration(CONTEXT, { prompt: "A deck", background: true });
    const done = await until(async () => {
      const r = await service.getGeneration(CONTEXT, rec.id);
      return r.status !== "pending" ? r : null;
    });
    assert.equal(done.status, "completed");
    assert.equal(call(p, "generatePresentation").brief, null);
    assert.ok(done.notes.some((n) => n.includes("Content understanding was unavailable") && /longer than/.test(n)), JSON.stringify(done.notes));
  });
});

describe("request cleaning", () => {
  test("slideCount: numbers and numeric strings kept, anything else null", async () => {
    const p = stubProvider();
    const service = new GenerationService(p);
    for (const [given, want] of [[8, 8], ["8", 8], ["you decide", null], [0, null], [-3, null], [2.5, null], [500, null], [null, null]]) {
      const rec = await service.requestGeneration(CONTEXT, { prompt: "A deck", slideCount: given });
      assert.equal(rec.slideCount, want, `slideCount ${JSON.stringify(given)}`);
    }
  });

  test("answers keep short string values only", () => {
    assert.deepEqual(sanitizeAnswers({ audience: " COO ", n: 3, x: "" }), { audience: "COO" });
    assert.deepEqual(sanitizeAnswers("nope"), {});
    assert.deepEqual(sanitizeAnswers(null), {});
  });

  test("coaching keeps the new question ids", () => {
    const c = sanitizeCoaching({ missing: ["audience"], asked: ["hook", "references", "length", "bogus"], answered: ["hook"] });
    assert.deepEqual(c.asked, ["hook", "references", "length"]);
    assert.deepEqual(c.answered, ["hook"]);
  });
});

describe("POST /api/generations — new fields", () => {
  const NO_CLAUDE = { PATH: "/usr/bin:/bin" };
  let server;
  before(async () => { server = await startTestServer({ env: NO_CLAUDE }); });
  after(async () => { await server?.stop(); });
  const post = (body) => fetch(`${server.origin}/api/generations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: server.origin },
    body: JSON.stringify(body),
  });
  const read = async (id) => (await fetch(`${server.origin}/api/generations/${id}`)).json();

  test("wantsHook:false and slideCount:\"8\" are stored", async () => {
    const res = await post({ prompt: "a deck", wantsHook: false, slideCount: "8" });
    assert.equal(res.status, 201);
    const stored = await read((await res.json()).id);
    assert.equal(stored.slideCount, 8);
    assert.equal(stored.wantsHook, false);
  });

  test("slideCount:\"you decide\" is stored as null", async () => {
    const res = await post({ prompt: "a deck", slideCount: "you decide" });
    const stored = await read((await res.json()).id);
    assert.equal(stored.slideCount, null);
    assert.equal(stored.wantsHook, true);
  });

  test("background:true answers 202 with a pending record", async () => {
    const res = await post({ prompt: "a deck", background: true, answers: { audience: "COO" } });
    assert.equal(res.status, 202);
    const body = await res.json();
    assert.equal(body.status, "pending");
    assert.deepEqual(body.referenceIds, []);
    assert.deepEqual(body.answers, { audience: "COO" });
  });

  test("11 referenceIds answer 400 \"at most 10 references\"", async () => {
    const ids = Array.from({ length: 11 }, (_, i) => `ref${i + 1}`);
    const res = await post({ prompt: "a deck", referenceIds: ids });
    assert.equal(res.status, 400);
    assert.match((await res.json()).error, /at most 10 references/);
  });

  test("an unknown reference id answers 404", async () => {
    const res = await post({ prompt: "a deck", referenceIds: ["no-such-reference"] });
    assert.equal(res.status, 404);
  });
});

describe("references in the pipeline (Task 9)", () => {
  const OTHER = { workspaceId: "ws-intel-other", userId: "u-other", role: "admin" };

  /** A provider that also composes: every slide on `templateName`, its words
   *  taken from the outline (so the figure check sees exactly those). */
  function composingProvider(mapping, templateName = "core/content-twocol") {
    return stubProvider({
      generatePresentation: () => ({ title: "Deck", slideCount: mapping.length, proposedMapping: structuredClone(mapping), confidencePerSlide: {}, usage: {} }),
      composeDeck: ({ outline }) => ({
        slides: outline.map((s) => ({
          templateName, theme: "light",
          content: { title: s.title, intro: s.bullets.join(" "), body: s.bullets.join(" ") },
        })),
      }),
    });
  }

  async function approveAndRead(service, id) {
    const { generationRepository } = await import("../product/storage/generation-repository.js");
    const { presentationRepository } = await import("../product/storage/presentation-repository.js");
    await service.approveGeneration(CONTEXT, id);
    const end = Date.now() + 10_000;
    for (;;) {
      const r = await generationRepository.findById(id);
      if (r.status !== "approving") {
        assert.equal(r.status, "approved", r.error || "");
        return presentationRepository.findById(r.presentationId);
      }
      if (Date.now() > end) throw new Error("approval did not settle");
      await new Promise((res) => setTimeout(res, 20));
    }
  }

  const deckMapping = (third) => [
    { slideNumber: 1, title: "Support review", content: { body: ["Where support stands."], notes: "" } },
    { slideNumber: 2, title: "Churn after the pilot", content: { body: ["Customers stayed."], notes: "" } },
    { slideNumber: 3, title: "What the pilot changed", content: { body: [third].flat(), notes: "" } },
    { slideNumber: 4, title: "Thank you", content: { body: ["Questions welcome."], notes: "" } },
  ];

  test("each reference's name and text reach understandContent, by id", async () => {
    const refs = new ReferenceService(null);
    const a = await refs.createFromText(CONTEXT, { name: "Q3 notes", text: "Churn fell to 7.3% after the pilot." });
    const p = stubProvider();
    await new GenerationService(p).requestGeneration(CONTEXT, { prompt: "A deck", referenceIds: [a.id] });
    assert.deepEqual(call(p, "understandContent").references, [{ id: a.id, name: "Q3 notes", text: "Churn fell to 7.3% after the pilot." }]);
  });

  test("a number only present in a reference survives the figure check", async () => {
    const refs = new ReferenceService(null);
    const a = await refs.createFromText(CONTEXT, { name: "Q3 notes", text: "Churn fell to 7.3% after the pilot." });
    const p = composingProvider(deckMapping(["Churn fell to 7.3% after the pilot.", "The backlog fell by 9.9% too."]));
    const service = new GenerationService(p);
    const rec = await service.requestGeneration(CONTEXT, { prompt: "A support review deck", referenceIds: [a.id] });
    const deck = await approveAndRead(service, rec.id);
    const text = JSON.stringify(deck.slides.map((s) => s.content));
    assert.ok(text.includes("7.3"), `the reference's figure was removed: ${text}`);
    assert.ok(!text.includes("9.9"), `a figure in no material survived: ${text}`);
  });

  test("digits in a reference's id are not figures from the material", async () => {
    const reference = { id: "ref-41", name: "Notes 41", kind: "text", text: "Churn fell to 7.3% after the pilot.", useOnSlides: false };
    const stubRefs = {
      async get(context, id) { if (id !== reference.id) throw new Error("Reference not found."); return reference; },
      async getMany(context, ids) { return Promise.all(ids.map((id) => this.get(context, id))); },
    };
    let listed = null;
    const p = composingProvider(deckMapping(["Churn fell to 7.3% after the pilot.", "Adoption reached 41% of teams."]));
    const compose = p.composeDeck;
    p.composeDeck = (req) => { listed = req.allowedNumbers; return compose(req); };
    const service = new GenerationService(p, { references: stubRefs });
    const rec = await service.requestGeneration(CONTEXT, { prompt: "A support review deck", referenceIds: [reference.id] });
    const deck = await approveAndRead(service, rec.id);
    const text = JSON.stringify(deck.slides.map((s) => s.content));
    assert.ok(text.includes("7.3"), `the reference's figure was removed: ${text}`);
    assert.ok(!text.includes("41"), `a figure from the reference's id survived: ${text}`);
    assert.ok(Array.isArray(listed) && listed.includes("7.3") && !listed.includes("41"), `listed: ${listed}`);
  });

  test("a reference deleted before approval is skipped with a warning; the deck is still built", async () => {
    const { generationRepository } = await import("../product/storage/generation-repository.js");
    const refs = new ReferenceService(null);
    const a = await refs.createFromText(CONTEXT, { name: "Gone soon", text: "Churn fell to 7.3% after the pilot." });
    const p = composingProvider(deckMapping("Teams moved closer to customers."));
    const service = new GenerationService(p);
    const rec = await service.requestGeneration(CONTEXT, { prompt: "A support review deck", referenceIds: [a.id] });
    assert.equal(rec.status, "completed");
    await refs.remove(CONTEXT, a.id);
    const deck = await approveAndRead(service, rec.id);
    assert.ok(deck?.slides?.length, "the deck was created");
    const settled = await generationRepository.findById(rec.id);
    assert.equal(settled.status, "approved");
    assert.ok(settled.composeWarnings.some((w) => /reference attached to this deck is no longer available/.test(w)),
      JSON.stringify(settled.composeWarnings));
  });

  test("11 ids are refused: at most 10 references", async () => {
    const p = stubProvider();
    const ids = Array.from({ length: 11 }, (_, i) => `ref${i + 1}`);
    await assert.rejects(
      () => new GenerationService(p).requestGeneration(CONTEXT, { prompt: "A deck", referenceIds: ids }),
      /at most 10 references/
    );
    assert.equal(p.calls.length, 0);
  });

  test("another workspace's reference is not found", async () => {
    const refs = new ReferenceService(null);
    const theirs = await refs.createFromText(OTHER, { name: "Theirs", text: "Secret 42" });
    const p = stubProvider();
    await assert.rejects(
      () => new GenerationService(p).requestGeneration(CONTEXT, { prompt: "A deck", referenceIds: [theirs.id] }),
      (err) => err.name === "ReferenceNotFoundError"
    );
    assert.equal(p.calls.length, 0);
  });

  test("an image with useOnSlides:true fills the first photo slot of the deck", async () => {
    // A 1×1 PNG.
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
    const refs = new ReferenceService({ describeImage: async () => "A green square" });
    const img = await refs.create(CONTEXT, { buffer: png, filename: "team.png" });
    await refs.setUseOnSlides(CONTEXT, img.id, true);
    const p = composingProvider(deckMapping("Teams moved closer to customers."), "brand-guidelines/split-02");
    const service = new GenerationService(p);
    const rec = await service.requestGeneration(CONTEXT, { prompt: "A support review deck", referenceIds: [img.id] });
    const deck = await approveAndRead(service, rec.id);
    const photos = deck.slides.map((s) => JSON.stringify(s.content).match(/assets\/(?:photography|uploads)\/[^"]+/g) || []);
    const first = photos.find((list) => list.length)?.[0];
    assert.match(first || "", /^assets\/uploads\//, `first photo: ${first}`);
    const { existsSync } = await import("node:fs");
    assert.ok(existsSync(join(dataDir, "uploads", first.replace(/^assets\/uploads\//, ""))), "the image was copied to the served uploads");
    assert.ok(!JSON.stringify(deck.slides).includes(join(dataDir, "data")), "the private reference path never reaches the deck");
  });

  test("a 200k-character reference keeps every prompt within 32,000 characters", async () => {
    const prompts = await import("../product/infrastructure/ai/claude-cli-provider.js");
    const { findTemplate } = await import("../product/domain/slide-content.js");
    // Thousands of distinct figures: the figure list must not carry them all.
    let big = "";
    for (let i = 0; big.length < 200_000; i++) big += `Region ${i} grew ${1000 + i}.${i % 10}% in the year. `;
    const reference = { id: "big-ref", name: "Huge export", kind: "text", text: big, useOnSlides: false };
    const lengths = [];
    let listed = [];
    const seen = (name, text) => { lengths.push([name, text.length]); };
    const p = stubProvider({
      understandContent: (req) => { seen("understand", prompts.buildUnderstandPrompt(req)); return structuredClone(BRIEF); },
      planStory: (req) => { seen("story", prompts.buildStoryPrompt(req)); return structuredClone(STORY); },
      generatePresentation: (req) => {
        seen("outline", prompts.buildPrompt(req.prompt, [], req));
        const mapping = deckMapping("Teams moved closer to customers.");
        return { title: "Deck", slideCount: mapping.length, proposedMapping: mapping, confidencePerSlide: {}, usage: {} };
      },
      composeDeck: ({ title, outline, allowedNumbers }) => {
        listed = allowedNumbers;
        const template = findTemplate("core/content-twocol");
        const slide = outline[0];
        seen("fill", prompts.buildSlideFillPrompt({ title, assignments: [{ index: 0, template, slide }], allowedNumbers }));
        seen("gap", prompts.buildGapFillPrompt({ title, gaps: [{ index: 0, template, slide, missing: ["title"] }], allowedNumbers }));
        return { slides: [] };
      },
    });
    const stubRefs = {
      async get(context, id) { if (id !== "big-ref") throw Object.assign(new Error("Reference not found."), { name: "ReferenceNotFoundError" }); return reference; },
      async getMany(context, ids) { return Promise.all(ids.map((id) => this.get(context, id))); },
    };
    const service = new GenerationService(p, { references: stubRefs });
    const rec = await service.requestGeneration(CONTEXT, { prompt: "A deck on 42 regions", referenceIds: ["big-ref"] });
    assert.equal(rec.status, "completed", rec.error || "");
    await approveAndRead(service, rec.id);
    for (const step of ["understand", "story", "outline", "fill", "gap"]) {
      assert.ok(lengths.some(([n]) => n === step), `${step} prompt was never built`);
    }
    for (const [name, length] of lengths) assert.ok(length <= 32_000, `${name} prompt is ${length} characters`);
    // The prompt's own figures are listed first; the reference fills the rest.
    assert.equal(listed[0], "42");
    assert.ok(listed.includes("40") && listed.includes("1000.0"), listed.slice(0, 5).join(", "));
  });
});

describe("approval, final fix round", () => {
  async function approveAndSettle(service, id) {
    const { generationRepository } = await import("../product/storage/generation-repository.js");
    const { presentationRepository } = await import("../product/storage/presentation-repository.js");
    await service.approveGeneration(CONTEXT, id);
    const end = Date.now() + 10_000;
    for (;;) {
      const r = await generationRepository.findById(id);
      if (r.status !== "approving") {
        assert.equal(r.status, "approved", r.error || "");
        return { record: r, deck: await presentationRepository.findById(r.presentationId) };
      }
      if (Date.now() > end) throw new Error("approval did not settle");
      await new Promise((res) => setTimeout(res, 20));
    }
  }

  const PLAN = {
    sections: [{ from: 1, to: 3, title: "Part One" }, { from: 4, to: 7, title: "Part Two" }],
    dividers: [{ after: 3, title: "Part Two" }], dark: [], emphasis: [], pace: {},
  };
  const composing = (overrides = {}) => stubProvider({
    // Seven slides: a plan may add one divider for every six.
    generatePresentation: () => {
      const words = ["Support review", "Tickets repeat", "Where time goes", "What the pilot changed", "Who it helps", "What comes next", "Thank you"];
      const mapping = words.map((title, i) => ({ slideNumber: i + 1, title,
        content: { title, body: ["Teams moved closer to customers.", "Releases became routine."], notes: "" }, ...(i === 1 ? { role: "hook" } : {}) }));
      return { title: "Deck", slideCount: 7, proposedMapping: mapping, confidencePerSlide: {}, usage: {} };
    },
    composeDeck: ({ outline }) => ({
      slides: outline.map((s) => ({ templateName: "core/content-twocol", theme: "light", content: { title: s.title, body: s.bullets.join(" ") } })),
    }),
    planDeck: () => ({ plan: structuredClone(PLAN), warnings: [] }),
    ...overrides,
  });

  test("a length picked in the coach (record.slideCount) is exact: no divider is added beyond it", async () => {
    const service = new GenerationService(composing());
    const rec = await service.requestGeneration(CONTEXT, { prompt: "A deck about support", slideCount: 7 });
    assert.equal(rec.slideCount, 7);
    const { record, deck } = await approveAndSettle(service, rec.id);
    assert.equal(deck.slides.length, 7);
    assert.ok(record.composeWarnings.some((w) => /Section dividers were left out/.test(w)), JSON.stringify(record.composeWarnings));
  });

  test("with no length asked for, the plan's divider is added", async () => {
    const service = new GenerationService(composing());
    const rec = await service.requestGeneration(CONTEXT, { prompt: "A deck about support" });
    const { deck } = await approveAndSettle(service, rec.id);
    assert.equal(deck.slides.length, 8);
  });

  test("drafting notes reach the compose warnings, and the layout summary survives the cap", async () => {
    const many = Array.from({ length: 14 }, (_, i) => ({
      slideNumber: i + 1, title: `Slide ${i + 1}`,
      content: { title: `Slide ${i + 1}`, body: [`Teams moved closer, saving ${41 + i} hours.`], notes: "" },
    }));
    const service = new GenerationService(stubProvider({
      understandContent: () => { throw new Error("usage limit reached"); },
      generatePresentation: () => ({ title: "Deck", slideCount: many.length, proposedMapping: structuredClone(many), confidencePerSlide: {}, usage: {} }),
      composeDeck: () => { throw new Error("usage limit reached"); },
    }));
    const rec = await service.requestGeneration(CONTEXT, { prompt: "A deck about support" });
    assert.ok(rec.notes.some((n) => /Content understanding was unavailable/.test(n)), JSON.stringify(rec.notes));
    const { record } = await approveAndSettle(service, rec.id);
    const w = record.composeWarnings;
    assert.ok(w.length <= 12, `${w.length} warnings`);
    assert.ok(w.some((x) => /^14 of 14 slides kept the default layout/.test(x)), JSON.stringify(w));
    assert.equal(w.filter((x) => /Content understanding was unavailable/.test(x)).length, 1, JSON.stringify(w));
    assert.equal(new Set(w).size, w.length, "no duplicates");
  });
});
