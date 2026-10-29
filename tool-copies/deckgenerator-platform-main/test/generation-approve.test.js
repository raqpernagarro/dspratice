// test/generation-approve.test.js
// =============================================================================
// Approving a generation must be exactly-once, and must not hold the request
// open while it composes.
//
// Two defects met here. `updateStatus` skipped the transition table whenever
// the new status equalled the current one, so approved -> approved was accepted
// even though `approved` lists only `completed` as a legal target. And approval
// checked the status, composed for one to four minutes, then wrote — so two
// callers both passed the check and both created a deck.
//
// It was not a rare race: the browser aborts a long approval at 150s and offers
// Retry, which walks straight into it. Approval is asynchronous now — claim,
// return, compose in the background — so the claim is the only thing that has
// to be exclusive.
//
// Exercised through the repository and service directly: no HTTP, no model
// calls, fast enough to run on every change.
// =============================================================================
import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let repo, InvalidGenerationTransitionError;
let GenerationService, GenerationNotApprovableError, releaseStrandedApprovals;
let presentationRepository;
let dataDir;

before(async () => {
  // Redirect the app's own data-directory override BEFORE importing anything
  // that resolves paths at module load.
  dataDir = mkdtempSync(join(tmpdir(), "nps-approve-"));
  process.env.NPS_DATA_DIR = dataDir;
  // Visual review is on by default in generation-service.js. This suite
  // drives real #composeInBackground runs end-to-end (approveGeneration,
  // waited out below) — disabled so it stays fast, deterministic, and
  // Playwright-free; reviewSlides's own guards already cover a missing
  // browser/server gracefully on their own, this is purely test speed.
  process.env.NPS_VISUAL_REVIEW = "0";
  ({ generationRepository: repo, InvalidGenerationTransitionError } =
    await import("../product/storage/generation-repository.js"));
  ({ GenerationService, GenerationNotApprovableError, releaseStrandedApprovals } =
    await import("../product/domain/generation-service.js"));
  ({ presentationRepository } = await import("../product/storage/presentation-repository.js"));
});

after(() => rmSync(dataDir, { recursive: true, force: true }));

const WORKSPACE = "ws-test";
const CONTEXT = { workspaceId: WORKSPACE, userId: "u-test", role: "admin" };

/** A generation sitting at `completed`, ready to approve. */
async function completedGeneration(slideCount = 2) {
  const record = await repo.insert({ workspaceId: WORKSPACE, userId: "u-test", prompt: "A test deck" });
  const proposedMapping = Array.from({ length: slideCount }, (_, i) => ({
    slideNumber: i + 1,
    title: `Slide ${i + 1}`,
    content: { body: [`Point ${i + 1}`], notes: "" },
  }));
  return repo.updateStatus(record.id, {
    status: "completed",
    proposedMapping,
    output: { title: "A test deck", slides: proposedMapping },
  });
}

/** No composeDeck, so composeSlides falls back instantly — the Claude CLI is
 *  never invoked. `delayMs` widens the window a regression would race in. */
function fakeProvider(delayMs = 0) {
  return {
    async generatePresentation() { throw new Error("not used"); },
    async composeDeck() {
      if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
      return { slides: [] };
    },
  };
}

/** Approval returns before composition finishes, so tests wait for the record
 *  to leave `approving` rather than awaiting the call. */
async function waitForSettled(id, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const record = await repo.findById(id);
    if (record.status !== "approving") return record;
    if (Date.now() > deadline) throw new Error(`generation ${id} stuck in "approving"`);
    await new Promise((r) => setTimeout(r, 25));
  }
}

const decksFor = (workspaceId) => presentationRepository.findByWorkspace(workspaceId);

describe("the status machine validates every write", () => {
  test("rejects a repeat of the current status instead of silently accepting it", async () => {
    const gen = await completedGeneration();
    await repo.updateStatus(gen.id, { status: "approving" });
    await assert.rejects(
      () => repo.updateStatus(gen.id, { status: "approving" }),
      InvalidGenerationTransitionError,
      "a same-status write must still be checked against the transition table"
    );
  });

  test("rejects approved -> approved", async () => {
    const gen = await completedGeneration();
    await repo.updateStatus(gen.id, { status: "approving" });
    await repo.updateStatus(gen.id, { status: "approved" });
    await assert.rejects(
      () => repo.updateStatus(gen.id, { status: "approved" }),
      InvalidGenerationTransitionError
    );
  });

  test("allows the rollbacks the failure paths depend on", async () => {
    const a = await completedGeneration();
    await repo.updateStatus(a.id, { status: "approving" });
    assert.equal((await repo.updateStatus(a.id, { status: "completed" })).status, "completed");

    const b = await completedGeneration();
    await repo.updateStatus(b.id, { status: "approving" });
    await repo.updateStatus(b.id, { status: "approved" });
    assert.equal((await repo.updateStatus(b.id, { status: "completed" })).status, "completed");
  });

  test("rejects a jump that was never legal", async () => {
    const gen = await repo.insert({ workspaceId: WORKSPACE, userId: "u", prompt: "x" });
    await assert.rejects(
      () => repo.updateStatus(gen.id, { status: "approved" }), // pending -> approved
      InvalidGenerationTransitionError
    );
  });

  test("a non-status write is unaffected", async () => {
    const gen = await completedGeneration();
    const updated = await repo.updateStatus(gen.id, { usage: { inputTokens: 5 } });
    assert.equal(updated.status, "completed");
    assert.equal(updated.usage.inputTokens, 5);
  });
});

describe("approval returns immediately", () => {
  test("resolves with the claim, not with a finished deck", async () => {
    const gen = await completedGeneration();
    // A wide margin on purpose: this asserts that approval does not WAIT for
    // composition, not that the machine is fast. Test files run in parallel and
    // contend on the same file lock, so a tight bound here fails for reasons
    // that have nothing to do with the behaviour under test.
    const COMPOSE_MS = 3000;
    const service = new GenerationService(fakeProvider(COMPOSE_MS));

    const startedAt = Date.now();
    const claimed = await service.approveGeneration(CONTEXT, gen.id);
    const elapsed = Date.now() - startedAt;

    assert.equal(claimed.status, "approving");
    assert.ok(elapsed < COMPOSE_MS / 2,
      `approval should return without waiting for composition (took ${elapsed}ms of a ${COMPOSE_MS}ms compose)`);

    const settled = await waitForSettled(gen.id);
    assert.equal(settled.status, "approved");
    assert.ok(settled.presentationId, "the finished record must link its deck");
  });
});

describe("the hook slide keeps its role on the saved deck", () => {
  test("a mapping slide marked hook is persisted with role: hook", async () => {
    const record = await repo.insert({ workspaceId: WORKSPACE, userId: "u-test", prompt: "Hook deck" });
    const proposedMapping = [
      { slideNumber: 1, title: "Opening", content: { body: ["a"], notes: "" } },
      { slideNumber: 2, title: "What if every release shipped itself?", role: "hook", content: { body: [], notes: "" } },
      { slideNumber: 3, title: "Close", content: { body: ["b"], notes: "" } },
    ];
    const gen = await repo.updateStatus(record.id, {
      status: "completed", proposedMapping, output: { title: "Hook deck", slides: proposedMapping },
    });
    const service = new GenerationService(fakeProvider());
    await service.approveGeneration(CONTEXT, gen.id);
    const settled = await waitForSettled(gen.id);
    const deck = await presentationRepository.findById(settled.presentationId);
    assert.equal(deck.slides[1].role, "hook");
    assert.ok(!("role" in deck.slides[0]) && !("role" in deck.slides[2]));
  });
});

describe("concurrent approval produces exactly one deck", () => {
  test("three simultaneous approvals: one claims, two conflict, one deck exists", async () => {
    const workspaceId = "ws-concurrent";
    const context = { ...CONTEXT, workspaceId };
    const record = await repo.insert({ workspaceId, userId: "u-test", prompt: "Concurrent" });
    const proposedMapping = [{ slideNumber: 1, title: "One", content: { body: ["a"], notes: "" } }];
    const gen = await repo.updateStatus(record.id, {
      status: "completed", proposedMapping, output: { title: "Concurrent", slides: proposedMapping },
    });

    const service = new GenerationService(fakeProvider(150));
    const results = await Promise.allSettled([
      service.approveGeneration(context, gen.id),
      service.approveGeneration(context, gen.id),
      service.approveGeneration(context, gen.id),
    ]);

    const won = results.filter((r) => r.status === "fulfilled");
    const lost = results.filter((r) => r.status === "rejected");
    assert.equal(won.length, 1, `exactly one approval should claim it, got ${won.length}`);
    assert.equal(lost.length, 2);
    for (const l of lost) {
      assert.ok(l.reason instanceof GenerationNotApprovableError,
        `losers should conflict, not crash — got ${l.reason?.name}: ${l.reason?.message}`);
    }

    const settled = await waitForSettled(gen.id);
    assert.equal(settled.status, "approved");

    const decks = await decksFor(workspaceId);
    assert.equal(decks.length, 1, `one prompt must produce one deck, found ${decks.length}`);
    assert.equal(settled.presentationId, decks[0].id);
  });

  test("a later approval reports where the deck already is", async () => {
    const gen = await completedGeneration();
    const service = new GenerationService(fakeProvider());
    await service.approveGeneration(CONTEXT, gen.id);
    const settled = await waitForSettled(gen.id);

    await assert.rejects(
      () => service.approveGeneration(CONTEXT, gen.id),
      (err) => {
        assert.ok(err instanceof GenerationNotApprovableError);
        assert.equal(err.presentationId, settled.presentationId,
          "the conflict must carry the existing deck id so a retry is not a dead end");
        return true;
      }
    );
  });
});

describe("a failure releases the claim", () => {
  test("the generation returns to completed, carrying the reason", async () => {
    const gen = await completedGeneration();
    // composeSlides deliberately swallows PROVIDER errors — a model failure
    // falls back to the plain mapping rather than breaking the deck. So this
    // corrupts the mapping itself, which throws before that fallback exists.
    // The point under test is the invariant, not this particular fault: if the
    // background task throws at all, the claim must be released.
    await repo.updateStatus(gen.id, { proposedMapping: "not-an-array" });

    const service = new GenerationService(fakeProvider());
    await service.approveGeneration(CONTEXT, gen.id);

    const settled = await waitForSettled(gen.id);
    assert.equal(settled.status, "completed", "a failed approval must not strand the record as approved");
    assert.ok(settled.error, "the reason is the only place this failure is visible");
  });
});

describe("a crash mid-composition does not strand the record", () => {
  test("the boot sweep releases claims nobody is left to finish", async () => {
    const gen = await completedGeneration();
    // Exactly the state a SIGKILL between claiming and finishing leaves behind.
    await repo.updateStatus(gen.id, { status: "approving" });

    const released = await releaseStrandedApprovals();
    assert.ok(released >= 1, "the sweep should release at least the record we stranded");

    const after = await repo.findById(gen.id);
    assert.equal(after.status, "completed", "the user must be able to retry");
    assert.match(after.error, /interrupted/i);
  });
});

describe("composition progress lands on the record", () => {
  test("the final frame is internally consistent: done === total === slides.length", async () => {
    const gen = await completedGeneration(3);
    const service = new GenerationService(fakeProvider());
    await service.approveGeneration(CONTEXT, gen.id);
    const settled = await waitForSettled(gen.id);

    assert.equal(settled.status, "approved");
    const progress = settled.progress;
    assert.ok(progress, "the settled record must carry a final progress frame");
    assert.equal(progress.stage, "done");
    assert.equal(progress.done, progress.total,
      `done (${progress.done}) and total (${progress.total}) must agree in the final frame`);
    assert.equal(progress.slides.length, progress.total,
      `slides.length (${progress.slides.length}) must match total (${progress.total})`);
    assert.equal(progress.total, 3, "total should count the mapping's 3 source slides");
    // This provider returns no layouts, so every slide kept the default. The
    // frame must say so; reporting "done" here is what used to hide it.
    assert.ok(progress.slides.every((s) => s.state === "fallback"),
      "slides that kept the default layout must not be reported as done");
    assert.deepEqual(settled.layoutFallback, { count: 3, total: 3 });
    assert.ok(settled.composeWarnings.some((w) => /3 of 3 slides kept the default layout/.test(w)),
      "the record must say how many slides fell back");
    assert.equal(typeof progress.outputSlides, "number", "the actual produced count travels separately");
  });
});

describe("the outline can be corrected before it is built", () => {
  /* The status machine always modelled this window — a generation sits at
   * `completed` until someone approves it — but nothing could write to it, so
   * the UI approved straight through and a wrong narrative was only discovered
   * after two to four minutes of composition. */
  test("editing the outline replaces it", async () => {
    const gen = await completedGeneration(3);
    const service = new GenerationService(fakeProvider());

    const edited = [
      { title: "A title I chose myself", content: { body: ["Kept"], notes: "" } },
      { title: "Second", content: { body: [], notes: "" } },
    ];
    const updated = await service.updateOutline(CONTEXT, gen.id, edited);

    assert.equal(updated.proposedMapping.length, 2, "a removed slide should be gone");
    assert.equal(updated.proposedMapping[0].title, "A title I chose myself");
    assert.equal(updated.proposedMapping[0].slideNumber, 1, "numbering is re-derived, not trusted");
    assert.equal(updated.proposedMapping[1].slideNumber, 2);
    assert.equal(updated.status, "completed", "editing must not approve it");
  });

  test("the edit is what gets built", async () => {
    const gen = await completedGeneration(2);
    const service = new GenerationService(fakeProvider());
    await service.updateOutline(CONTEXT, gen.id, [
      { title: "The only slide", content: { body: ["One point"], notes: "" } },
    ]);

    await service.approveGeneration(CONTEXT, gen.id);
    const settled = await waitForSettled(gen.id);
    const deck = (await decksFor(WORKSPACE)).find((p) => p.id === settled.presentationId);
    assert.equal(deck.slides.length, 1, "the built deck should match the edited outline");
  });

  test("editing the outline invalidates any cached content analysis", async () => {
    // analyzeOutlineForCompose (generation-service.js) reuses a cached
    // `analysis` keyed by slide position to avoid paying for the same model
    // call twice on a retried approval. An outline edit can reorder, remove
    // or retitle slides, so a cached analysis is now describing the WRONG
    // slides unless it's cleared here.
    const gen = await completedGeneration(2);
    await repo.updateStatus(gen.id, { analysis: { slides: [{ n: 1, kind: "content" }] } });
    const service = new GenerationService(fakeProvider());

    const updated = await service.updateOutline(CONTEXT, gen.id, [
      { title: "Reordered", content: { body: ["Kept"], notes: "" } },
    ]);

    assert.equal(updated.analysis, null, "a stale per-slide analysis must not survive an outline edit");
  });

  test("an already-approved outline cannot be edited", async () => {
    const gen = await completedGeneration();
    const service = new GenerationService(fakeProvider());
    await service.approveGeneration(CONTEXT, gen.id);
    await waitForSettled(gen.id);

    await assert.rejects(
      () => service.updateOutline(CONTEXT, gen.id, [{ title: "Too late", content: { body: [] } }]),
      GenerationNotApprovableError
    );
  });

  test("an empty outline is refused", async () => {
    const gen = await completedGeneration();
    const service = new GenerationService(fakeProvider());
    await assert.rejects(() => service.updateOutline(CONTEXT, gen.id, []), /non-empty/);
    await assert.rejects(
      () => service.updateOutline(CONTEXT, gen.id, [{ title: "  ", content: { body: [] } }]),
      /at least one slide/
    );
  });
});
