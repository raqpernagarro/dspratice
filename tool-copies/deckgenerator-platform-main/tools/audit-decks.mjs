#!/usr/bin/env node
// tools/audit-decks.mjs
// =============================================================================
// What is wrong with the decks this product has actually produced?
//
// Every bug found in this area so far was the same shape: CONTENT LOSS WITH NO
// ERROR. A quote whose speaker vanished because the layout had no attribution
// field. Five board decisions rendered as one word because the layout's whole
// schema was `word`. A photograph that contradicted the slide's subject. In
// each case the slide rendered, nothing threw, the tests passed and every
// existing audit was green — the slide was simply worth less than it should be.
//
// The existing audits cannot see that class: they measure contrast, dark
// safety, dead space and template variety, all properties of a TEMPLATE. This
// one measures finished DECKS, because that is where the loss shows up.
//
// It also exists because of how those bugs were found — by rendering eight
// slides, reading one of them, and declaring the deck good. Sampling is the
// real defect. This sweeps every slide of every deck.
//
// Data-level only, so it is free and instant: no browser, no model. Overflow
// needs layout and lives in audit-overflow.mjs.
//
//   node tools/audit-decks.mjs             # summary
//   node tools/audit-decks.mjs --verbose   # every finding
//   node tools/audit-decks.mjs --deck <id-or-title-substring>
// =============================================================================
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname, join } from "node:path";
import { allTemplates } from "../js/templates/index.js";
import { reconcile } from "./lib/baseline.mjs";
import { retentionOf, exampleEcho, stripCounter } from "../product/domain/generation-service.js";
import { voiceFindings, hookFinding } from "./lib/deck-findings.mjs";

const VERBOSE = process.argv.includes("--verbose");
const RECORD = process.argv.includes("--record-baseline");
const CI = process.argv.includes("--ci");
const only = (() => {
  const i = process.argv.indexOf("--deck");
  return i === -1 ? null : (process.argv[i + 1] || "").toLowerCase();
})();

/* Defaults to the live decks; --data points at the committed corpus instead.
 * product/data/ is gitignored (it is user data), so CI has no decks of its own
 * and would otherwise sweep nothing and report clean — the same vacuous pass
 * that made the dark-mode audit look green while measuring zero nodes. */
const dataArg = process.argv.indexOf("--data");
const DATA = dataArg !== -1 && process.argv[dataArg + 1]
  ? resolve(process.argv[dataArg + 1])
  : fileURLToPath(new URL("../product/data/presentations.json", import.meta.url));

if (!existsSync(DATA)) {
  console.error(`No deck data at ${DATA}. Pass --data <file>, or start the product and make a deck.`);
  process.exit(1);
}
const raw = JSON.parse(readFileSync(DATA, "utf8"));
const decks = (Array.isArray(raw) ? raw : raw.items || Object.values(raw))
  .filter((d) => d && Array.isArray(d.slides) && d.slides.length);

// An audit that measures nothing must never look like an audit that passed.
if (!decks.length) {
  console.error(`${DATA} holds no decks with slides — nothing was checked.`);
  process.exit(1);
}

const byName = new Map(allTemplates.map((t) => [t.name, t]));

/* The generation records that made the decks, beside the deck file. The hook
 * audit needs what the brief ASKED for (wantsHook), which lives only there.
 * Absent (the committed corpus has none) → the hook check simply has nothing
 * to judge against and stays silent. */
const GENERATIONS = join(dirname(DATA), "generations.json");
const generationFor = new Map();
if (existsSync(GENERATIONS)) {
  const rawGen = JSON.parse(readFileSync(GENERATIONS, "utf8"));
  for (const g of (Array.isArray(rawGen) ? rawGen : rawGen.items || Object.values(rawGen))) {
    if (g?.presentationId) generationFor.set(g.presentationId, g);
  }
}

/* Chrome is generated per slide and legitimately repeats the deck's own title
 * on all of them. Counting it anywhere would make an empty slide look full. */
const CHROME = new Set(["meta", "footer", "notes"]);

/** Placeholder wording that must never reach a finished slide. Drawn from what
 *  the library's own examples say, because that is what leaks. */
const PLACEHOLDER = /\b(?:lorem|ipsum|dolor sit amet|consectetur|placeholder|presentation name|project name|month year|name goes here|your (?:title|text) here|title goes here|sample text)\b/i;

/** Values that are only placeholders when they stand ALONE as a whole field —
 *  "Category" is placeholder text; "Category management" is real writing. */
const BARE_PLACEHOLDER = /^(?:title|subtitle|caption|category|heading|description|text|label|name|word|date|project|company|client|author|source|role|month year|project \d+|year \d+|phase \d+|item \d+|lorem ipsum|20\d{2})$/i;

const findings = [];
const add = (deck, slide, kind, detail) =>
  findings.push({ deck: deck.title || deck.id, slide: (slide?.order ?? 0) + 1, kind, detail });

/** Every string in a content tree, excluding chrome, with its field path. */
function strings(value, path = "", out = []) {
  if (typeof value === "string") out.push({ path, value });
  else if (Array.isArray(value)) value.forEach((v, i) => strings(v, `${path}[${i}]`, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (!path && CHROME.has(k)) continue;
      strings(v, path ? `${path}.${k}` : k, out);
    }
  }
  return out;
}

for (const deck of decks) {
  if (only && !`${deck.id} ${deck.title || ""}`.toLowerCase().includes(only)) continue;

  const photosInDeck = new Map(); // path → [slide numbers]

  for (const slide of deck.slides) {
    const name = slide.templateReference?.templateName;
    const template = byName.get(name);
    if (!template) {
      add(deck, slide, "unknown-template", `${name} is not in the registry`);
      continue;
    }
    const content = slide.content || {};
    const fields = strings(content);
    const exampleFields = new Map(strings(template.example || {}).map((f) => [f.path, f.value]));

    // ---- 1. content loss -----------------------------------------------------
    /* The slide's own words, as the outline had them, are gone by the time a
     * deck is stored — so this compares the content against ITSELF: a slide
     * whose whole visible text is shorter than its speaker notes has almost
     * certainly lost its body somewhere. Weaker than the compose-time check in
     * generation-service, and deliberately so; it is the only signal available
     * after the fact. */
    const visible = fields.map((f) => f.value).join(" ").trim();
    const notes = typeof content.notes === "string" ? content.notes : "";
    /* A cover is SUPPOSED to be a title and a line — it carries long speaker
     * notes and almost no visible text by design, and flagging it buried the
     * closing slides where the ratio means something real. */
    /* Closings and contacts belong here with covers: "Come find out." and a
     * title over an email address are correct sign-offs, not lost content, and
     * they carry long speaker notes like every other bookend. The real detector
     * for this class is retentionOf at compose time, which compares against the
     * OUTLINE rather than against the notes and stayed silent on both. */
    const meantToBeSparse = ["cover", "divider", "closing", "contact"].includes(template.role);
    if (!meantToBeSparse && notes.length > 200 && visible.length < notes.length * 0.25) {
      add(deck, slide, "content-loss",
        `${name} shows ${visible.length} characters against ${notes.length} of speaker notes`);
    }

    // ---- 2. placeholder leakage ---------------------------------------------
    for (const { path, value } of fields) {
      const text = value.trim();
      if (!text) continue;
      const hit = text.match(PLACEHOLDER);
      if (hit) {
        /* The MATCH in context, not the head of the field. The first version
         * printed the first 48 characters, so a genuine "…Project Name Month
         * Year" leaking in from a footer 300 characters down looked like an
         * ordinary sentence, and I dismissed two true findings as noise. */
        const around = text.slice(Math.max(0, hit.index - 30), hit.index + hit[0].length + 20);
        add(deck, slide, "placeholder", `${name} · ${path} → ${JSON.stringify(hit[0])} in …${around}…`);
      } else if (BARE_PLACEHOLDER.test(text) && exampleFields.get(path) === text) {
        // Only when it also matches the template's own example: a real slide
        // may legitimately have a field whose value is one ordinary word.
        add(deck, slide, "placeholder", `${name} · ${path} still holds the example's ${JSON.stringify(text)}`);
      }
    }

    // ---- 3. empty declared fields -------------------------------------------
    /* Only fields the template's OWN example fills. A schema lists everything a
     * layout can take, including genuinely optional slots — `date` and
     * `project` on a cover are blank in the example too, and flagging them
     * produced 40 findings that said nothing. A field the example fills is one
     * the design expects to see something in, so a blank one is a hole. */
    for (const key of Object.keys(template.schema || {})) {
      if (CHROME.has(key)) continue;
      const shown = template.example?.[key];
      const exampleFills = typeof shown === "string" ? shown.trim() !== ""
        : Array.isArray(shown) ? shown.length > 0
        : shown !== undefined && shown !== null;
      if (!exampleFills) continue;
      /* …and fills it with something REAL. The examples say "Subtitle", "Date",
       * "Project" — words that prove the field exists, not that the design needs
       * it filled. Counting those produced 53 findings, six sevenths of this
       * audit's output, all of them saying only that a generated deck left an
       * optional slot empty. Whether an empty slot leaves a visible hole is a
       * layout question, and audit-slide-layout answers it directly. */
      if (typeof shown === "string" && BARE_PLACEHOLDER.test(shown.trim())) continue;
      const v = content[key];
      const empty = v === undefined || v === null || v === "" ||
                    (Array.isArray(v) && v.length === 0);
      if (empty) add(deck, slide, "empty-field", `${name} · ${key} is blank, but the design fills it`);
    }

    // ---- 4. a field whose TYPE the template cannot render --------------------
    /* planning/grid-15 declares `notes` as a list and renders it with .map().
     * Speaker notes are a string, and one deck still holds a slide where the
     * string was written over the list: notes.map is not a function, the slide
     * does not mount, and it is blank in the editor and blank in the export.
     * The pipeline stopped producing this, but the stored slide is still there
     * — a fix upstream does not repair the data already written. */
    for (const [key, shown] of Object.entries(template.example || {})) {
      /* `notes` is NOT chrome here. It is chrome for the 228 templates that do
       * not declare it, and content for the one that does — which is the whole
       * collision. Skipping it as chrome made this detector blind to the exact
       * slide it was written for. Only meta and footer are always chrome. */
      if (key === "meta" || key === "footer" || !(key in content)) continue;
      const want = Array.isArray(shown) ? "array" : typeof shown;
      const got = Array.isArray(content[key]) ? "array" : typeof content[key];
      if (want === "object" || got === "undefined") continue;
      if (want !== got) {
        add(deck, slide, "wrong-type", `${name} · ${key} is a ${got}, but the layout renders a ${want}`);
      }
    }

    // ---- 5. the template's own sample shipped as if it were the deck's ------
    /* The 2026-10-14 brief run's worst slide: a build-vs-buy closing drew the
     * sample chart — "$120M", "Q1 24", "Segment 1" — on a € decision. Every
     * other check passed it: the words are not lorem, the fields are not
     * blank, and the types are right. Only equality with the example says it. */
    const echoed = exampleEcho(template, content);
    if (echoed.length) add(deck, slide, "example-data", `${name} · ${echoed.join(", ")} still the template's sample`);

    // ---- 6. structured data printed as text ---------------------------------
    for (const { path, value } of fields) {
      if (value.includes("[object Object]")) add(deck, slide, "object-text", `${name} · ${path} prints "[object Object]"`);
    }

    // ---- 7. a slide counter where the caption belongs ------------------------
    if (typeof content.caption === "string" && content.caption && !stripCounter(content.caption)) {
      add(deck, slide, "counter-caption", `${name} · caption is the counter ${JSON.stringify(content.caption)}`);
    }

    // ---- 8. a contents list numbered for some entries only -------------------
    if (Array.isArray(content.items) && content.items.length > 1) {
      for (const key of ["page", "range"]) {
        const vals = content.items.map((it) => (it && typeof it === "object" ? it[key] : undefined)).filter((v) => v !== undefined);
        if (vals.length !== content.items.length) continue;
        const filled = vals.filter((v) => String(v).trim()).length;
        if (filled && filled < vals.length) add(deck, slide, "partial-pages", `${name} · ${filled} of ${vals.length} entries have a ${key}`);
      }
    }

    // ---- 9. photography reused inside one deck ------------------------------
    for (const { value } of fields) {
      if (!/^assets\/photography\//.test(value)) continue;
      if (!photosInDeck.has(value)) photosInDeck.set(value, []);
      photosInDeck.get(value).push((slide.order ?? 0) + 1);
    }
  }

  // ---- 10. the voice ---------------------------------------------------------
  /* Hype, "!", truisms and the deck budgets (one "X, not Y", one featured
   * triad, "three" in one title, no opener shared by three bodies), read the
   * way the voice pass scores them. Advisory, like the lint itself. */
  for (const f of voiceFindings(deck)) add(deck, { order: f.slide - 1 }, "voice", f.detail);

  // ---- 11. a hook that was asked for -----------------------------------------
  const hook = hookFinding(deck, generationFor.get(deck.id));
  if (hook) add(deck, { order: hook.slide - 1 }, "hook", hook.detail);

  for (const [path, slides] of photosInDeck) {
    if (slides.length > 1) {
      add(deck, { order: slides[0] - 1 }, "repeated-photo",
        `${path.split("/").pop()} appears on slides ${slides.join(", ")}`);
    }
  }
}

// ---- report -----------------------------------------------------------------
const KINDS = ["unknown-template", "wrong-type", "object-text", "example-data", "content-loss", "placeholder", "counter-caption", "partial-pages", "empty-field", "repeated-photo", "voice", "hook"];
const counted = KINDS.map((k) => [k, findings.filter((f) => f.kind === k).length]).filter(([, n]) => n);

console.log(`Swept ${decks.length} decks, ${decks.reduce((n, d) => n + d.slides.length, 0)} slides.\n`);
if (!findings.length) {
  console.log("Nothing found.");
} else {
  for (const [kind, n] of counted) console.log(`  ${kind.padEnd(18)} ${n}`);
  console.log();
  for (const kind of KINDS) {
    const rows = findings.filter((f) => f.kind === kind);
    if (!rows.length) continue;
    console.log(`--- ${kind} (${rows.length})`);
    for (const f of (VERBOSE ? rows : rows.slice(0, 8))) {
      console.log(`  ${String(f.deck).slice(0, 34).padEnd(36)} s${String(f.slide).padStart(2)}  ${f.detail}`);
    }
    if (!VERBOSE && rows.length > 8) console.log(`  … and ${rows.length - 8} more (--verbose)`);
    console.log();
  }
}
/* One baseline per data source: the committed corpus and a developer's own
 * decks are different populations, and sharing a baseline would make each
 * run report the other's findings as new. */
const BASELINE = DATA.includes("corpus") ? "decks-corpus" : "decks";
process.exit(reconcile(BASELINE, findings, { record: RECORD, ci: CI }));
