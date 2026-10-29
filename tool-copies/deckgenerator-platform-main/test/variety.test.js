// Deck-level variety rules (product/domain/variety.js).
import { test } from "node:test";
import assert from "node:assert/strict";
import { enforceVariety, capsFor } from "../product/domain/variety.js";

const pick = (index, templateName) => ({ index, templateName, theme: "light" });
const lists = (...rows) => rows.map((names) => names.map((name) => ({ name })));

test("a layout never sits on two consecutive slides", () => {
  const picks = [pick(0, "a/x"), pick(1, "a/x"), pick(2, "b/y")];
  const shortlists = lists(["a/x", "b/y"], ["a/x", "b/y"], ["b/y", "a/x"]);
  const { picks: out, changes } = enforceVariety(picks, shortlists, { deckLength: 3 });
  assert.equal(out[1].templateName, "b/y");
  // Slide 2 must change too: once slide 1 moves to b/y, slide 2 would repeat it.
  assert.deepEqual(changes, [
    { index: 1, from: "a/x", to: "b/y" },
    { index: 2, from: "b/y", to: "a/x" },
  ]);
  for (let i = 1; i < out.length; i++) assert.notEqual(out[i].templateName, out[i - 1].templateName);
});

test("one layout cannot fill most of a deck", () => {
  // Twelve slides, every one wants the same layout first, then a second best.
  const n = 12;
  const picks = Array.from({ length: n }, (_, i) => pick(i, "core/content-twocol"));
  const shortlists = Array.from({ length: n }, (_, i) => [
    { name: "core/content-twocol" },
    { name: `core/alt-${i % 3}` },
    { name: `planning/alt-${i}` },
  ]);
  const { picks: out, unresolved } = enforceVariety(picks, shortlists, { deckLength: n });
  const { perTemplateCap } = capsFor(n);
  const counts = {};
  out.forEach((p) => { counts[p.templateName] = (counts[p.templateName] || 0) + 1; });
  for (const [name, count] of Object.entries(counts)) {
    assert.ok(count <= perTemplateCap, `${name} used ${count} times, cap is ${perTemplateCap}`);
  }
  assert.deepEqual(unresolved, []);
});

test("a swap only ever uses a layout from that slide's own shortlist", () => {
  const picks = [pick(0, "a/x"), pick(1, "a/x")];
  const shortlists = lists(["a/x"], ["a/x", "c/z"]);
  const { picks: out } = enforceVariety(picks, shortlists, { deckLength: 2 });
  assert.equal(out[0].templateName, "a/x");
  assert.equal(out[1].templateName, "c/z");
});

test("when no alternative exists the original pick stays and is reported", () => {
  const picks = [pick(0, "a/x"), pick(1, "a/x")];
  const shortlists = lists(["a/x"], ["a/x"]);
  const { picks: out, unresolved, changes } = enforceVariety(picks, shortlists, { deckLength: 2 });
  assert.equal(out[1].templateName, "a/x");
  assert.deepEqual(unresolved, [1]);
  assert.deepEqual(changes, []);
});

test("varied decks pass through untouched", () => {
  const names = ["core/cover-single", "planning/grid-01", "finance/bars-compare", "main/split-02", "creative/grid-12"];
  const picks = names.map((n, i) => pick(i, n));
  const shortlists = names.map((n) => [{ name: n }]);
  const { picks: out, changes, unresolved } = enforceVariety(picks, shortlists, { deckLength: names.length });
  assert.deepEqual(out.map((p) => p.templateName), names);
  assert.deepEqual(changes, []);
  assert.deepEqual(unresolved, []);
});
