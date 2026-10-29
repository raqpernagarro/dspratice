#!/usr/bin/env node
// tools/build-corpus.mjs
// =============================================================================
// The decks CI sweeps.
//
// product/data/ is gitignored — it is user data, and a client's deck has no
// business in the repository. So CI has no decks, and both deck audits would
// sweep nothing and report clean.
//
// This writes a synthetic corpus instead: slides built to trip each invariant
// the audits check, in content that belongs to nobody. It is deliberately
// awkward — an over-long subtitle, a closing that carries five decisions, an
// attributed quote, a title long enough to push the page number off the bar.
// Every one of those is a real failure this product produced.
//
// Regenerate after adding a template or an invariant:
//   node tools/build-corpus.mjs
// =============================================================================
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { allTemplates } from "../js/templates/index.js";
import { deckChrome } from "../product/domain/generation-service.js";

const OUT = fileURLToPath(new URL("../test/fixtures/corpus.json", import.meta.url));

/* Anything the fixture does not set explicitly falls back to the template's own
 * example — which is lorem ipsum and words like "Caption". Left in place, the
 * corpus trips the placeholder detector 24 times on its own filler and says
 * nothing about the product. Replaced with neutral wording of the same shape,
 * so the slides still fill out and only the DELIBERATE faults are reported. */
const FILLER = [
  "Reliability", "Availability", "Utilisation", "Throughput", "Coverage",
  "Readiness", "Response time", "Capacity", "Compliance", "Retention",
];
let fillerAt = 0;
const PLACEHOLDER_TEXT = /lorem|ipsum|dolor sit|consectetur|^(caption|subtitle|title|category|heading|description|text|label|name|word|project \d+|year \d+|phase \d+|item \d+)$/i;

function neutralise(value) {
  if (typeof value === "string") {
    if (!PLACEHOLDER_TEXT.test(value.trim())) return value;
    // Same rough length, so layouts are exercised as their author intended.
    const word = FILLER[fillerAt++ % FILLER.length];
    if (value.length < 24) return word;
    const sentence = `${word} is measured monthly and reported against the agreed target. `;
    return sentence.repeat(Math.ceil(value.length / sentence.length)).slice(0, value.length).trim();
  }
  if (Array.isArray(value)) return value.map(neutralise);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, neutralise(v)]));
  }
  return value;
}

/** A slide on a named template, with the chrome the product would derive. */
const slide = (order, templateName, content, theme) => {
  const t = allTemplates.find((x) => x.name === templateName);
  if (!t) throw new Error(`build-corpus: ${templateName} is not a registered template`);
  const chrome = deckChrome(order, { title: content.__deckTitle || "Corpus" });
  const out = neutralise({ ...(t.example || {}), ...content });
  delete out.__deckTitle;
  for (const key of ["meta", "footer"]) {
    if (key in (t.schema || {})) out[key] = chrome[key];
    else delete out[key];
  }
  return {
    id: `corpus-${order}-${templateName.replace(/\W/g, "-")}`,
    order,
    templateReference: { templateName, templateVersion: 1, templatePackId: "main-template" },
    themeOverride: theme,
    content: out,
    manualOverrides: {}, styleOverrides: {}, sourceSlideRef: null,
    lastEditedBy: null, lastEditedAt: null,
  };
};

const LONG_TITLE = "Predictive Maintenance and Reliability Engineering for Rolling Stock";
const LONG_PROSE =
  "Single point of contact: a service manager acts as liaison officer for the full contract " +
  "duration — intake, fulfillment, escalation, reporting. Every unfilled request is tracked " +
  "with root-cause analysis and corrective reporting. Escalation runs two levels, with " +
  "committed severity-linked response times, consistent with the wider governance model.";
const DECISIONS = [
  "Approve the hybrid operating model, group-wide from October",
  "Release the capital and recurrent funding, with a stage gate at month six",
  "Authorise immediate recruitment to fourteen posts",
  "Receive a monthly dashboard from the operations director",
  "Next checkpoint in February, reporting against phase one targets",
];

const decks = [
  {
    // A long deck title is the case that pushed the page number off the canvas.
    id: "corpus-chrome",
    title: LONG_TITLE,
    slides: [
      slide(0, "main/cover-01", { __deckTitle: LONG_TITLE, title: LONG_TITLE, subtitle: "A twelve-month programme" }, "dark"),
      slide(1, "finance/line-markers", { __deckTitle: LONG_TITLE }),
      slide(2, "core/content-twocol", { __deckTitle: LONG_TITLE, title: "Where reliability stands", body: [LONG_PROSE] }),
      slide(3, "portfolio/text-16", { __deckTitle: LONG_TITLE, word: "Approve" }, "dark"),
    ],
  },
  {
    // Over-long values in fields designed for one short line.
    id: "corpus-overlong",
    title: "Overlong",
    slides: [
      slide(0, "main/cover-01", { __deckTitle: "Overlong", title: "Overlong", subtitle: "Fields past their budget" }, "dark"),
      slide(1, "planning/grid-02", { __deckTitle: "Overlong", caption: "01 · GOVERNANCE", title: "Operated as a service", subtitle: LONG_PROSE }),
      slide(2, "core/cards-row-5", { __deckTitle: "Overlong", caption: "Current state", title: LONG_PROSE.slice(0, 240) }),
      slide(3, "core/closing-single", { __deckTitle: "Overlong" }, "dark"),
    ],
  },
  {
    // Content that a layout can silently drop, and a quote with a speaker.
    id: "corpus-content",
    title: "Content",
    slides: [
      slide(0, "main/cover-01", { __deckTitle: "Content", title: "Content", subtitle: "What a layout can lose" }, "dark"),
      slide(1, "core/content-list-3", { __deckTitle: "Content", title: "Decisions requested", items: DECISIONS }),
      slide(2, "main/quote-01", {
        __deckTitle: "Content",
        quote: "We cancel on the morning because a bed went to an emergency overnight. That is not a clinical failure — it is a design failure.",
        name: "A. Whitlock, Clinical Director",
      }, "dark"),
      slide(3, "core/closing-single", { __deckTitle: "Content" }, "dark"),
    ],
  },
];

writeFileSync(OUT, JSON.stringify(decks, null, 2) + "\n");
console.log(`Wrote ${decks.length} decks, ${decks.reduce((n, d) => n + d.slides.length, 0)} slides to test/fixtures/corpus.json`);
