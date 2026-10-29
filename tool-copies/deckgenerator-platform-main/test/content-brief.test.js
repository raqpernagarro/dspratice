import test from "node:test";
import assert from "node:assert/strict";
import { normalizeBrief, numbersIn, allowedNumbers, untraceable } from "../product/domain/content-brief.js";

test("numbersIn normalises and excludes slide counts", () => {
  assert.deepEqual(numbersIn("Revenue €412M, up 8% in 2026 (8 slides)"), ["412", "8", "2026"]);
  assert.deepEqual(numbersIn("9.1% and 1,400 users"), ["9.1", "1400"]);
  assert.deepEqual(numbersIn("3–5 days"), ["3", "5"]);
  assert.deepEqual(numbersIn("a 12-slide deck"), []);
  assert.deepEqual(numbersIn("B2B Q3"), []);
});

test("untraceable finds invented figures only", () => {
  assert.deepEqual(untraceable({ title: "Churn hit 14%", body: "from 9%" }, new Set(["14"])), ["9"]);
  assert.deepEqual(untraceable({ meta: { page: "7" } }, new Set()), []);
  assert.deepEqual(untraceable({ c: "var(--fill-50,#06041f)", d: "rgba(1,2,3,0.5)" }, new Set()), []);
  assert.deepEqual(untraceable({ img: "assets/x-2.jpg", u: "https://a.com/9.png", p: "foo/bar7.png" }, new Set()), []);
  assert.deepEqual(untraceable({ n: "01", m: "02", footer: "Page 44", notes: "99" }, new Set()), []);
  assert.deepEqual(untraceable({ items: [{ t: "Saves 40 hours" }] }, new Set()), ["40"]);
});

test("allowedNumbers unions all sources and proof", () => {
  const s = allowedNumbers({
    prompt: "Q 2026 plan", answers: ["we have 300 staff"], references: [{ text: "9.1%" }],
    brief: { proof: [{ fact: "€2M saved" }] },
  });
  for (const n of ["2026", "300", "9.1", "2"]) assert.ok(s.has(n), n);
});

test("normalizeBrief clamps and defaults", () => {
  const b = normalizeBrief({ register: "x", proof: [{}, { fact: "€2M" }] });
  assert.equal(b.register, "thought");
  assert.equal(b.proof.length, 1);
  assert.equal(normalizeBrief({ register: "board" }).register, "board");
  assert.equal(normalizeBrief(null), null);
  assert.equal(normalizeBrief({ points: Array(20).fill("a") }).points.length, 8);
});

test("bare numbers are figures; list markers and multipliers", () => {
  assert.deepEqual(untraceable({ value: "7" }, new Set()), ["7"]);
  assert.deepEqual(untraceable({ value: "10" }, new Set()), ["10"]);
  assert.deepEqual(untraceable({ a: "01", b: "1.", c: "2)" }, new Set()), []);
  assert.deepEqual(numbersIn("x2 faster"), ["2"]);
  assert.deepEqual(numbersIn("up to ×10"), ["10"]);
  assert.deepEqual(numbersIn("Q3 plan"), []);
  assert.deepEqual(numbersIn("B2B v2.1 H2 max2"), []);
});
