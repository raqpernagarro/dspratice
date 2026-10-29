import test from "node:test";
import assert from "node:assert/strict";
import { composeSlides } from "../product/domain/generation-service.js";
import { allTemplates } from "../js/templates/index.js";

// Visual review is on by default (see generation-service.js) — disabled here
// so this progress-event suite stays fast, deterministic, and
// Playwright-free; reviewSlides's own guards already cover a missing
// browser/server gracefully, this is purely a test-speed choice.
process.env.NPS_VISUAL_REVIEW = "0";

const REAL = allTemplates.find((t) => t.name === "core/content-twocol");
const mapping = [
  { slideNumber: 1, title: "Cover", content: { title: "Cover", body: "Sub", notes: "" } },
  { slideNumber: 2, title: "Body", content: { title: "Body", body: ["a", "b"], notes: "" } },
];

test("composition emits staged progress through onProgress", async () => {
  const patches = [];
  const provider = {
    composeImportDeck: async ({ onBatch }) => {
      onBatch?.({ pass: "compose", index: 1, total: 1, slideNumbers: [1, 2] });
      return { rows: [{ source: 2, templateName: REAL.name, theme: "light", content: { ...REAL.example } }], warnings: [] };
    },
  };
  await composeSlides(provider, mapping, {
    title: "T", origin: "import", onProgress: (p) => patches.push(p),
  });
  const stages = patches.map((p) => p.stage).filter(Boolean);
  assert.ok(stages.includes("choosing"), `stages seen: ${stages}`);
  assert.ok(patches.some((p) => Array.isArray(p.slides)), "per-slide states must be reported");
  const last = patches.at(-1);
  assert.equal(last.stage, "assembling");
});

test("a provider without onBatch support still composes (progress is optional)", async () => {
  const provider = { composeImportDeck: async () => ({ rows: [], warnings: [] }) };
  const slides = await composeSlides(provider, mapping, { title: "T", origin: "import" });
  assert.equal(slides.length, 2); // fallback slides, no crash with no onProgress
});

test("the import path emits a writing-stage frame while a slide is in state \"writing\"", async () => {
  const patches = [];
  const provider = {
    composeImportDeck: async ({ onBatch }) => {
      onBatch?.({ pass: "compose", index: 1, total: 1, slideNumbers: [1, 2] });
      return { rows: [{ source: 2, templateName: REAL.name, theme: "light", content: { ...REAL.example } }], warnings: [] };
    },
  };
  await composeSlides(provider, mapping, {
    title: "T", origin: "import", onProgress: (p) => patches.push(p),
  });

  // The "writing" state must actually be OBSERVED by a patch, not merely set
  // and immediately overwritten before any emit saw it.
  const writingFrame = patches.find(
    (p) => p.stage === "writing" && p.slides?.some((s) => s.state === "writing")
  );
  assert.ok(writingFrame, `no writing-stage frame saw a "writing" slide; patches: ${JSON.stringify(patches)}`);
});

test("every frame composeSlides emits stays mapping-shaped and sized to mapping.length", async () => {
  // The actual final stage:"done" frame (done === total === slides.length)
  // is written by GenerationService#composeInBackground, which composeSlides
  // doesn't call — see test/generation-approve.test.js for that assertion
  // against a real generation record. What composeSlides itself guarantees is
  // that every frame it emits along the way has `slides` shaped consistently
  // with the mapping it was given, so a poller never sees a `slides` array of
  // the wrong length mid-build.
  const provider = {
    composeImportDeck: async ({ onBatch }) => {
      onBatch?.({ pass: "compose", index: 1, total: 1, slideNumbers: [1, 2] });
      return { rows: [{ source: 2, templateName: REAL.name, theme: "light", content: { ...REAL.example } }], warnings: [] };
    },
  };
  const patches = [];
  await composeSlides(provider, mapping, {
    title: "T", origin: "import", onProgress: (p) => patches.push(p),
  });
  for (const p of patches) {
    assert.equal(p.slides.length, mapping.length);
  }
});
