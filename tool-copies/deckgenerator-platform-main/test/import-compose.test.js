import test from "node:test";
import assert from "node:assert/strict";
import { composeSlides } from "../product/domain/generation-service.js";
import { allTemplates } from "../js/templates/index.js";

// Visual review is on by default (see generation-service.js) — disabled here
// so this import-compose suite stays fast, deterministic, and
// Playwright-free.
process.env.NPS_VISUAL_REVIEW = "0";

// A real registered content template to build against.
const REAL = allTemplates.find((t) => t.name === "core/content-twocol");
// A real registered template with an array field and a hard capacity cap,
// to prove clamping warns when it actually removes content.
const CARDS = allTemplates.find((t) => t.name === "core/cards-grid-6");

const mapping = [
  { slideNumber: 1, title: "Cover", content: { title: "Cover", body: "Sub", notes: "", images: [], tables: [] },
    elements: { images: 0, tables: 0, charts: 0, bullets: 0 } },
  { slideNumber: 2, title: "Dense", content: { title: "Dense", body: ["a", "b", "c"], notes: "n",
    images: ["assets/uploads/deadbeef.png"], tables: [] },
    elements: { images: 1, tables: 0, charts: 0, bullets: 3 } },
];

function stubProvider(rows, warnings = []) {
  return { composeImportDeck: async () => ({ rows, warnings }) };
}

test("a split source slide becomes two output slides, in order", async () => {
  const rows = [
    { source: 2, templateName: REAL.name, theme: "light", content: { ...REAL.example } },
    { source: 2, templateName: REAL.name, theme: "light", content: { ...REAL.example } },
  ];
  const warnings = [];
  const slides = await composeSlides(stubProvider(rows), mapping,
    { title: "T", warnings, origin: "import", imageSource: "source" });
  assert.equal(slides.length, 3); // cover fallback + 2 splits of slide 2
  assert.equal(slides[0].order, 0);
  assert.equal(slides[2].order, 2);
});

test("provider warnings reach the caller's sink", async () => {
  const warnings = [];
  await composeSlides(stubProvider([], ["Slide 2 kept its default layout."]), mapping,
    { title: "T", warnings, origin: "import" });
  assert.ok(warnings.some((w) => w.includes("Slide 2")));
});

test("without origin=import the prompt path is untouched", async () => {
  const provider = { composeDeck: async () => ({ slides: [] }) };
  const slides = await composeSlides(provider, mapping, { title: "T" });
  assert.equal(slides.length, 2); // plain fallback, one per mapping slide
});

test("origin=import with a provider lacking composeImportDeck falls back rather than rewriting content via composeDeck", async () => {
  const composeDeckCalls = [];
  const provider = {
    // No composeImportDeck — only the prompt-path method. If composeSlides
    // fell through to it, this deck's transplanted content would be
    // rewritten as fresh copy, which an import must never do.
    composeDeck: async (args) => { composeDeckCalls.push(args); return { slides: [] }; },
  };
  const warnings = [];
  const slides = await composeSlides(provider, mapping, { title: "T", warnings, origin: "import" });
  assert.equal(composeDeckCalls.length, 0, "composeDeck must never be called for an import without composeImportDeck");
  assert.equal(slides.length, 2); // plain fallback, one per mapping slide
  assert.ok(warnings.some((w) => /Import layouts are unavailable/.test(w)));
});

const threeSlideMapping = [
  { slideNumber: 1, title: "Cover", content: { title: "Cover", body: "Sub", notes: "", images: [], tables: [] },
    elements: { images: 0, tables: 0, charts: 0, bullets: 0 } },
  { slideNumber: 2, title: "Dense", content: { title: "Dense", body: ["a", "b", "c"], notes: "n",
    images: [], tables: [] },
    elements: { images: 0, tables: 0, charts: 0, bullets: 3 } },
  { slideNumber: 3, title: "Untouched", content: { title: "Untouched", body: "Body", notes: "", images: [], tables: [] },
    elements: { images: 0, tables: 0, charts: 0, bullets: 0 } },
];

test("a fallback slide shifted downstream by an earlier split gets a rebased page and no counter caption", async () => {
  const rows = [
    { source: 2, templateName: REAL.name, theme: "light", content: { ...REAL.example } },
    { source: 2, templateName: REAL.name, theme: "light", content: { ...REAL.example } },
  ];
  const warnings = [];
  const slides = await composeSlides(stubProvider(rows), threeSlideMapping,
    { title: "T", warnings, origin: "import", imageSource: "source" });
  // cover (0) + two splits of slide 2 (1, 2) + slide 3's fallback, shifted to 3
  assert.equal(slides.length, 4);
  const shifted = slides[3];
  assert.equal(shifted.order, 3);
  // The caption is context for the title, never a slide counter.
  assert.equal(shifted.content.caption, "");
  assert.equal(shifted.content.meta.page, "4");
});

test("a provider that returns more than 3 rows for one source has the extras dropped, with a warning", async () => {
  const rows = [
    { source: 2, templateName: REAL.name, theme: "light", content: { ...REAL.example } },
    { source: 2, templateName: REAL.name, theme: "light", content: { ...REAL.example } },
    { source: 2, templateName: REAL.name, theme: "light", content: { ...REAL.example } },
    { source: 2, templateName: REAL.name, theme: "light", content: { ...REAL.example } },
  ];
  const warnings = [];
  const slides = await composeSlides(stubProvider(rows), mapping,
    { title: "T", warnings, origin: "import", imageSource: "source" });
  // cover fallback + at most 3 splits of slide 2, never 4
  assert.equal(slides.length, 4);
  assert.ok(warnings.some((w) => w.includes("Slide 2") && w.includes("dropped")));
});

test("source images that never fit any of the chosen layout's slots produce a warning, not a silent drop", async () => {
  const withImage = [
    { slideNumber: 1, title: "Cover", content: { title: "Cover", body: "Sub", notes: "", images: [], tables: [] },
      elements: { images: 0, tables: 0, charts: 0, bullets: 0 } },
    { slideNumber: 2, title: "Dense", content: { title: "Dense", body: ["a", "b", "c"], notes: "n",
      images: ["assets/uploads/x.png"], tables: [] },
      elements: { images: 1, tables: 0, charts: 0, bullets: 3 } },
  ];
  // REAL (core/content-twocol) has no image field in its schema/example, so
  // the source image can never be placed on it.
  const rows = [{ source: 2, templateName: REAL.name, theme: "light", content: { ...REAL.example } }];
  const warnings = [];
  const slides = await composeSlides(stubProvider(rows), withImage,
    { title: "T", warnings, origin: "import", imageSource: "source" });
  assert.equal(slides.length, 2);
  assert.ok(
    warnings.some((w) => /images did not fit|left out/.test(w)),
    `expected an unused-images warning, got: ${JSON.stringify(warnings)}`
  );
});

test("a slide whose content overfills the chosen template's capacity warns that points were trimmed", async () => {
  const overfilled = {
    ...CARDS.example,
    cards: [
      ...CARDS.example.cards,
      { title: "Extra 1", body: "Body" },
      { title: "Extra 2", body: "Body" },
      { title: "Extra 3", body: "Body" },
    ],
  };
  assert.ok(overfilled.cards.length > CARDS.capacity.max, "test fixture must actually overfill the template");

  const rows = [{ source: 2, templateName: CARDS.name, theme: "light", content: overfilled }];
  const warnings = [];
  const slides = await composeSlides(stubProvider(rows), mapping,
    { title: "T", warnings, origin: "import", imageSource: "source" });
  assert.equal(slides.length, 2);
  assert.ok(warnings.some((w) => /holds more content|trimmed/.test(w)), `expected a trim warning, got: ${JSON.stringify(warnings)}`);
});
