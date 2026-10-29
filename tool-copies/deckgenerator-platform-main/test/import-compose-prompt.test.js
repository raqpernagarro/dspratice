import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildImportComposePrompt, collectImportRows } from "../product/infrastructure/ai/claude-cli-provider.js";

const slide = (i, bulletLen = 120) => ({
  index: i,
  slide: {
    title: `Slide ${i + 1}`,
    bullets: Array.from({ length: 6 }, (_, b) => `Point ${b} — ${"x".repeat(bulletLen)}`),
    tables: [[["A", "B"], ["1", "2"]]],
    notes: "Speaker notes here.",
    elements: { images: 1, tables: 1, charts: 0, bullets: 6 },
  },
  candidates: Array.from({ length: 6 }, (_, c) => ({
    name: `core/fake-${c}`, role: "content", shape: "grid", media: "",
    capacity: { items: 4 }, darkSafe: true, why: [],
    schema: { title: "string", items: "array of 4 strings" },
    example: { title: "Example", items: ["a", "b", "c", "d"] },
  })),
});

test("import prompt carries full content — no 260-char clipping", () => {
  const prompt = buildImportComposePrompt({ title: "Deck", slides: [slide(0)] });
  assert.match(prompt, /Point 5/);
  assert.match(prompt, /A \| B/);          // table rendered
  assert.match(prompt, /never invent/i);   // the fidelity contract is stated
  assert.match(prompt, /split/i);          // splitting is offered
});

test("a 4-slide import batch stays under the CLI cap", async () => {
  const src = await readFile("product/infrastructure/ai/claude-cli-provider.js", "utf8");
  const cap = Number(src.match(/MAX_PROMPT_CHARS\s*=\s*([\d_]+)/)[1].replace(/_/g, ""));
  const prompt = buildImportComposePrompt({ title: "Deck", slides: [0, 1, 2, 3].map((i) => slide(i)) });
  assert.ok(prompt.length < cap, `prompt is ${prompt.length}, cap ${cap}`);
});

// --- collectImportRows: the pure validation half, no CLI call inside it ---

const group = (i, candidateNames = ["core/fake-0", "core/fake-1"]) => ({
  index: i,
  slide: { title: `Slide ${i + 1}`, bullets: [] },
  candidates: candidateNames.map((name) => ({ name })),
});

test("collectImportRows rejects a source outside the group", () => {
  const g = [group(0)];
  const parsed = { slides: [{ source: 5, templateName: "core/fake-0", content: {} }] };
  const { accepted, missingSources } = collectImportRows(parsed, g);
  assert.equal(accepted.length, 0);
  assert.deepEqual(missingSources, [1]);
});

test("collectImportRows rejects a templateName not in that source's shortlist", () => {
  const g = [group(0)];
  const parsed = { slides: [{ source: 1, templateName: "core/not-offered", content: {} }] };
  const { accepted, missingSources } = collectImportRows(parsed, g);
  assert.equal(accepted.length, 0);
  assert.deepEqual(missingSources, [1]);
});

test("collectImportRows caps at 3 rows per source", () => {
  const g = [group(0, ["core/fake-0", "core/fake-1", "core/fake-2", "core/fake-3"])];
  const parsed = {
    slides: [
      { source: 1, templateName: "core/fake-0", content: { a: 1 } },
      { source: 1, templateName: "core/fake-1", content: { a: 2 } },
      { source: 1, templateName: "core/fake-2", content: { a: 3 } },
      { source: 1, templateName: "core/fake-3", content: { a: 4 } },
    ],
  };
  const { accepted, missingSources } = collectImportRows(parsed, g);
  assert.equal(accepted.length, 3);
  assert.deepEqual(missingSources, []);
});

test("collectImportRows normalizes an invalid theme to light", () => {
  const g = [group(0)];
  const parsed = { slides: [{ source: 1, templateName: "core/fake-0", theme: "purple", content: {} }] };
  const { accepted } = collectImportRows(parsed, g);
  assert.equal(accepted[0].theme, "light");
});

test("collectImportRows reports missingSources for a group row with no accepted rows", () => {
  const g = [group(0), group(1)];
  const parsed = { slides: [{ source: 1, templateName: "core/fake-0", content: {} }] };
  const { accepted, missingSources } = collectImportRows(parsed, g);
  assert.equal(accepted.length, 1);
  assert.deepEqual(missingSources, [2]);
});

test("collectImportRows accepts and preserves a valid row", () => {
  const g = [group(0)];
  const parsed = { slides: [{ source: 1, templateName: "core/fake-1", theme: "dark", content: { title: "Hi" } }] };
  const { accepted, missingSources } = collectImportRows(parsed, g);
  assert.deepEqual(accepted, [{ source: 1, templateName: "core/fake-1", theme: "dark", content: { title: "Hi" } }]);
  assert.deepEqual(missingSources, []);
});

test("import prompt contains parallel-structure instruction and pace hints", () => {
  const s = slide(0);
  s.slide.pace = "breather";
  const prompt = buildImportComposePrompt({ title: "Deck", slides: [s] });
  assert.match(prompt, /parallel|same grammatical shape/i, "should contain parallel-structure instruction");
  assert.match(prompt, /pace.*breather/i, "should contain breather pace hint");
});

test("import prompt renders pace: dense when supplied", () => {
  const s = slide(0);
  s.slide.pace = "dense";
  const prompt = buildImportComposePrompt({ title: "Deck", slides: [s] });
  assert.match(prompt, /pace.*dense/i, "should contain dense pace hint");
});
