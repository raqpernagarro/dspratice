// A slide count the request states outright is honoured exactly.
import { test } from "node:test";
import assert from "node:assert/strict";
import { requestedSlideCount } from "../product/domain/slide-count.js";

test("reads a count stated as '<n>-slide' or '<n> slides'", () => {
  assert.equal(requestedSlideCount("A 6-slide pitch for a seed round"), 6);
  assert.equal(requestedSlideCount("A 20-slide quarterly review"), 20);
  assert.equal(requestedSlideCount("12 slides on payments"), 12);
  assert.equal(requestedSlideCount("a 10 page brief"), 10);
});

test("returns null when no count is stated, or it is not a usable number", () => {
  assert.equal(requestedSlideCount("A pitch for a seed round"), null);
  assert.equal(requestedSlideCount("Revenue grew 40 percent in 2025"), null);
  assert.equal(requestedSlideCount("a 0-slide deck"), null);
  assert.equal(requestedSlideCount("a 99-slide deck"), null);
  assert.equal(requestedSlideCount(""), null);
});

import { statedCount, countMismatches } from "../product/domain/slide-count.js";

test("reads a count stated in words or digits before a counted noun", () => {
  assert.equal(statedCount("Top five risks").n, 5);
  assert.equal(statedCount("Three decisions today").n, 3);
  assert.equal(statedCount("2 options compared").n, 2);
  assert.equal(statedCount("Four decisions to protect the year").n, 4);
});

test("ordinary prose with a number is not a counted set", () => {
  assert.equal(statedCount("Pre-tax profit of £412 million, 6% ahead of plan"), null);
  assert.equal(statedCount("Three years of delivery"), null);
  assert.equal(statedCount("Two thirds of the book"), null);
});

test("a slide whose list matches its stated count is not flagged", () => {
  const slides = [{ title: "Top five risks", bullets: ["a", "b", "c", "d", "e"] }];
  assert.deepEqual(countMismatches(slides), []);
});

test("a list shorter or longer than its title says is flagged", () => {
  const slides = [
    { title: "Top five risks", bullets: ["a", "b", "c", "d"] },
    { title: "Three decisions today", bullets: ["a", "b"] },
  ];
  assert.deepEqual(countMismatches(slides), [
    { index: 0, phrase: "five risks", stated: 5, found: 4 },
    { index: 1, phrase: "Three decisions", stated: 3, found: 2 },
  ]);
});

test("slides with no list, such as covers and dividers, are not checked", () => {
  const slides = [
    { title: "Three decisions today", subtitle: "Profit ahead" },
    { title: "Three ways forward" },
  ];
  assert.deepEqual(countMismatches(slides), []);
});
