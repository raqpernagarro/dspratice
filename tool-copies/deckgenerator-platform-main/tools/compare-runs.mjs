#!/usr/bin/env node
// tools/compare-runs.mjs
// =============================================================================
// Two sets of generated decks, side by side.
//
// Written for one question — does showing the model twenty candidate layouts
// per slide instead of twelve make better decks? — but the question recurs
// every time the engine changes. An opinion about that is worth very little;
// two runs of the same ten briefs are worth something.
//
// Reports only what can be counted. Whether a deck is GOOD is a judgement, and
// the point of this is to say clearly which parts of it are not.
//
//   node tools/compare-runs.mjs <a.json> <b.json> [labelA] [labelB]
// =============================================================================
import { readFileSync } from "node:fs";
import { allTemplates } from "../js/templates/index.js";

const [fileA, fileB, labelA = "A", labelB = "B"] = process.argv.slice(2);
if (!fileA || !fileB) {
  console.error("usage: node tools/compare-runs.mjs <a.json> <b.json> [labelA] [labelB]");
  process.exit(1);
}

const roleOf = new Map(allTemplates.map((t) => [t.name, t.role]));
const load = (f) => JSON.parse(readFileSync(f, "utf8"));

function measure(decks) {
  const templates = new Set();
  const roles = new Set();
  let slides = 0, repeats = 0, darkBookends = 0, perfectlyDistinct = 0;

  for (const d of decks) {
    const names = d.slides.map((s) => s.templateReference?.templateName);
    slides += names.length;
    names.forEach((n) => { templates.add(n); roles.add(roleOf.get(n)); });
    repeats += names.length - new Set(names).size;
    if (names.length === new Set(names).size) perfectlyDistinct += 1;

    const themes = d.slides.map((s) => s.themeOverride);
    if (themes[0] === "dark" && themes[themes.length - 1] === "dark") darkBookends += 1;

    // Adjacent repeats are the most visible failure of variety.
    for (let i = 1; i < names.length; i++) if (names[i] === names[i - 1]) repeats += 1;
  }
  return {
    decks: decks.length, slides,
    templatesUsed: templates.size,
    rolesUsed: roles.size,
    decksAllDistinct: perfectlyDistinct,
    repeatedSlides: repeats,
    darkBookends,
    templates,
  };
}

const a = measure(load(fileA));
const b = measure(load(fileB));

const row = (name, x, y, higherIsBetter = true) => {
  const delta = y - x;
  const arrow = delta === 0 ? "  =" : (higherIsBetter === (delta > 0) ? "  ↑" : "  ↓");
  console.log(`  ${name.padEnd(24)} ${String(x).padStart(6)} ${String(y).padStart(8)}   ${delta > 0 ? "+" : ""}${delta}${arrow}`);
};

console.log(`\n${"".padEnd(26)}${labelA.padStart(6)} ${labelB.padStart(8)}\n`);
row("decks", a.decks, b.decks);
row("slides", a.slides, b.slides);
row("distinct templates used", a.templatesUsed, b.templatesUsed);
row("distinct roles used", a.rolesUsed, b.rolesUsed);
row("decks all-distinct", a.decksAllDistinct, b.decksAllDistinct);
row("repeated slides", a.repeatedSlides, b.repeatedSlides, false);
row("decks with dark bookends", a.darkBookends, b.darkBookends);

const onlyA = [...a.templates].filter((t) => !b.templates.has(t));
const onlyB = [...b.templates].filter((t) => !a.templates.has(t));
console.log(`\n  layouts only ${labelA} reached (${onlyA.length}): ${onlyA.slice(0, 8).join(", ")}${onlyA.length > 8 ? " …" : ""}`);
console.log(`  layouts only ${labelB} reached (${onlyB.length}): ${onlyB.slice(0, 8).join(", ")}${onlyB.length > 8 ? " …" : ""}`);
console.log(
  "\n  Variety is countable; whether a deck reads well is not. Run the two deck\n" +
  "  audits over each set for the defects, and look at the slides for the rest."
);
