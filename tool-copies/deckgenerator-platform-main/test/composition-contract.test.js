// test/composition-contract.test.js
// =============================================================================
// The engine's own contract, checked without a model.
//
// This closes the biggest hole in the safety net. CI cannot call the model, so
// the part of the product that has been wrong most often — reading a brief and
// choosing layouts for it — was only ever checked by running
// tools/generate-briefs.mjs by hand. Every bug that run found (a closing slide
// that lost five decisions, a quote that lost its speaker, prose written into a
// field rendered with .map()) was a property of COMPOSITION, not of the model's
// prose, and composition is deterministic once the model's answer is fixed.
//
// So: fix the model's answer. The stub below behaves like a well-behaved model
// — it takes the layout the shortlist ranked first — and the outlines span the
// content shapes that have actually broken things. What is asserted is what a
// finished deck must be true of, whatever the model said.
// =============================================================================
import { written } from "./helpers/written.js";
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { allTemplates } from "../js/templates/index.js";
import { outlineSignatures } from "../product/domain/content-signature.js";
import { shortlistFor } from "../product/domain/template-scoring.js";
import { composeSlides, retentionOf } from "../product/domain/generation-service.js";
import { numbersIn } from "../product/domain/content-brief.js";

// Visual review is on by default (see generation-service.js) — disabled here
// so this contract suite stays fast, deterministic, and Playwright-free.
process.env.NPS_VISUAL_REVIEW = "0";

/** Outlines chosen to pull in different directions, like the ten briefs do. */
const OUTLINES = {
  "figures and a table": [
    { title: "Half-year review", bullets: ["Revenue of £41.2m, up 8% on H1 2025."] },
    { title: "Where the money went", bullets: [
      "Fuel at £6.1m, up 14%", "Agency cover at £2.9m, up 31%",
      "Depot overheads at £4.4m, flat", "Fleet maintenance at £3.2m, down 6%"] },
    { title: "The five largest contracts", bullets: [
      "Northgate — £8.2m, renews March", "St Bride's — £6.9m, renews June",
      "Meridian — £5.1m, renews September", "Halloway — £3.8m, renews January",
      "Weald — £2.2m, renews November"] },
    { title: "What we are asking for", bullets: ["Approve the revised outlook and the capital release."] },
  ],
  "a grave operational update": [
    { title: "Supply interruptions", bullets: ["Where we stand after six months."] },
    { title: "The scale of it", bullets: [
      "412 interruptions, up 19% on last year",
      "Average duration of 4.2 hours against a 3-hour standard",
      "18,900 properties affected at least once",
      "Complaints up 34% over the same period"] },
    { title: "Three root causes", bullets: [
      "Mains failures concentrated in the 1960s cast-iron network, which carries 38% of supply",
      "Detection depends on customer reports, so the median time to first alarm is 71 minutes",
      "Crew availability outside core hours covers 40% of the network, not all of it"] },
    { title: "What we need", bullets: ["Approve the mains replacement programme and the out-of-hours rota."] },
  ],
  "a roster and a quotation": [
    { title: "The team you get", bullets: ["Who will actually be on this."] },
    { title: "Your team", bullets: [
      "Amara Whitlock — Delivery Director", "Tom Reyes — Head of Engineering",
      "Priya Nandi — Principal Designer", "Jonas Lek — Data Lead"] },
    { title: "What they said", bullets: [
      '"They shipped in eleven weeks what we had been trying to do for a year." — E. Marsh, COO'] },
    { title: "Three ways to start", bullets: ["A discovery week, a pilot, or a full programme."] },
  ],
  "one paragraph per slide": [
    { title: "From monolith to services", bullets: ["A phased decomposition over four releases."] },
    { title: "Where we are", bullets: [
      "The platform is one deployable of about 400,000 lines, released fortnightly. " +
      "Two teams of six share ownership, and every change is coordinated across both. " +
      "The release train is the bottleneck rather than the code itself."] },
    { title: "Where we are going", bullets: [
      "Six services along the seams that already exist in the data model, each owned " +
      "outright by one team and released on its own cadence."] },
    { title: "The decision", bullets: ["Approve the first two extractions and the platform team."] },
  ],
  "a three-slide summary": [
    { title: "Fit for 2027", bullets: ["The cost programme, in short."] },
    { title: "The one number", bullets: ["£17.7m of the £24m target is banked; £6.3m is not."] },
    { title: "The decision", bullets: ["Approve the final tranche, or accept the shortfall."] },
  ],
};

/**
 * The example, with the slide's own words written into it.
 *
 * A stub that just copies t.example is not a model — it produces a deck of
 * placeholder text, and the retention check then fails on every slide for a
 * reason that says nothing about the product. This writes the title and the
 * bullets into the first fields shaped to hold them, which is the least a model
 * does.
 */
function fill(template, slide) {
  return ownFigures(fillWords(template, slide), slide);
}

/**
 * A well-behaved model writes only the slide's own figures: every number the
 * example carried (a sample chart's "$115M", a card's "Year 1") is replaced by
 * one from the slide, in turn, or dropped when the slide has none. Without it
 * the stub would be a model inventing data, which the deck-wide figure check
 * (Task 6) rightly removes.
 */
function ownFigures(content, slide) {
  const figures = numbersIn([slide.title, ...(slide.bullets || [])].join(" "));
  let next = 0;
  const take = () => figures[next++ % figures.length];
  const walk = (v, key) => {
    if (key === "meta" || key === "footer") return v;
    if (typeof v === "number") return figures.length ? Number(take()) : v;
    if (typeof v === "string") {
      if (/^(assets\/|https?:\/\/)|^var\(|^#[0-9a-f]{3,8}$/i.test(v)) return v;
      if (numbersIn(v).every((n) => figures.includes(n))) return v;
      return v.replace(/\d+(?:[.,]\d+)*/g, () => (figures.length ? take() : "")).replace(/\s{2,}/g, " ").trim();
    }
    if (Array.isArray(v)) return v.map((x) => walk(x));
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, k)]));
    return v;
  };
  return walk(content);
}

function fillWords(template, slide) {
  const out = written(template.example || {});
  const bullets = slide.bullets || [];

  for (const key of ["title", "heading", "statement", "quote", "word", "lead"]) {
    if (typeof out[key] === "string") { out[key] = slide.title; break; }
  }
  if (!bullets.length) return out;

  // The first list of plain strings takes the bullets.
  const listKey = Object.keys(out).find(
    (k) => Array.isArray(out[k]) && out[k].length && out[k].every((v) => typeof v === "string")
  );
  if (listKey) { out[listKey] = bullets; return out; }

  /* A list of ROWS — cards, phases, people — takes one bullet each. Without
   * this the stub could not fill a structured template at all, left the
   * example's own words in place, and the retention check then reported a loss
   * the product had not caused. */
  const rowsKey = Object.keys(out).find(
    (k) => Array.isArray(out[k]) && out[k].length && out[k][0] && typeof out[k][0] === "object"
  );
  if (rowsKey) {
    const rows = out[rowsKey];
    out[rowsKey] = bullets.slice(0, rows.length).map((text, i) => {
      const row = { ...rows[i % rows.length] };
      const textKey = Object.keys(row).find((k) => typeof row[k] === "string" && !/image|icon|src/i.test(k));
      const itemsKey = Object.keys(row).find((k) => Array.isArray(row[k]) && row[k].every((v) => typeof v === "string"));
      if (itemsKey) row[itemsKey] = [text];
      else if (textKey) row[textKey] = text;
      return row;
    });
    return out;
  }

  const proseKey = Object.keys(out).find(
    (k) => typeof out[k] === "string" && !["title", "heading", "statement", "quote", "word", "lead"].includes(k)
  );
  if (proseKey) out[proseKey] = bullets.join(" ");
  return out;
}

/** A model that always takes the layout the shortlist ranked first. */
function wellBehavedProvider(outline) {
  const sigs = outlineSignatures(outline);
  const leading = new Set();
  const chosen = sigs.map((sig) => {
    const list = shortlistFor(sig, { limit: 12, deckLength: outline.length, avoid: leading });
    const pick = list[0]?.name || "core/content-twocol";
    leading.add(pick);
    return pick;
  });
  return {
    chosen,
    provider: {
      async generatePresentation() { throw new Error("not used"); },
      async composeDeck({ outline: given }) {
        return {
          slides: chosen.map((name, i) => {
            const t = allTemplates.find((x) => x.name === name);
            return { templateName: name, theme: "light", content: fill(t, given[i]) };
          }),
        };
      },
    },
  };
}

const asMapping = (outline) => outline.map((s, i) => ({
  slideNumber: i + 1, title: s.title,
  content: { body: s.bullets, notes: "" },
}));

describe("what a composed deck must be true of, for any brief", () => {
  for (const [shape, outline] of Object.entries(OUTLINES)) {
    describe(shape, () => {
      const build = async () => {
        const { provider } = wellBehavedProvider(outline);
        const warnings = [];
        // The outline's figures are the user's own: they arrive through the
        // prompt, as they would in a real build, so the deck-wide figure check
        // (Task 6) treats them as material rather than inventions.
        const prompt = outline.map((s) => [s.title, ...s.bullets].join(" ")).join("\n");
        const slides = await composeSlides(provider, asMapping(outline), { title: shape, warnings, prompt });
        return { slides, warnings };
      };

      test("every slide gets a real, registered template", async () => {
        const { slides } = await build();
        assert.equal(slides.length, outline.length);
        for (const s of slides) {
          const name = s.templateReference?.templateName;
          assert.ok(allTemplates.some((t) => t.name === name), `${name} is not registered`);
        }
      });

      test("it opens and closes dark", async () => {
        const { slides } = await build();
        assert.equal(slides[0].themeOverride, "dark", "the cover must be dark");
        assert.equal(slides[slides.length - 1].themeOverride, "dark", "the closing must be dark");
      });

      test("no slide silently loses most of what it was given", async () => {
        const { slides } = await build();
        slides.forEach((slide, i) => {
          /* Covers, dividers and closings are sparse by design: a sign-off is a
           * line and a contact, not a summary of its own outline. The same
           * exemption audit-decks.mjs makes, for the same reason. */
          const t = allTemplates.find((x) => x.name === slide.templateReference.templateName);
          if (["cover", "divider", "closing", "contact"].includes(t?.role)) return;

          const source = [outline[i].title, ...outline[i].bullets].join(" ");
          const kept = retentionOf(source, slide.content);
          assert.ok(kept >= 0.45,
            `slide ${i + 1} kept only ${Math.round(kept * 100)}% of its words ` +
            `on ${slide.templateReference.templateName}`);
        });
      });

      test("composition does not degrade", async () => {
        const { warnings } = await build();
        assert.deepEqual(warnings, [],
          `composition reported: ${JSON.stringify(warnings)}`);
      });

      /* The visual review pass reads a `__shortlist` scratch field composed
       * onto each built slide (candidate template names, for its own repair
       * step) and is required to strip it before returning — but that field
       * must never reach a caller regardless of whether review actually RAN.
       * This suite runs with NPS_VISUAL_REVIEW=0 (review disabled), which is
       * exactly the path that used to leak it: stripping lived inside
       * reviewSlides alone, so a disabled review skipped the strip too. */
      test("the review pass's __shortlist scratch field never reaches the caller", async () => {
        const { slides } = await build();
        for (const slide of slides) {
          assert.ok(!("__shortlist" in slide),
            `slide ${slide.order} still carries __shortlist: ${JSON.stringify(Object.keys(slide))}`);
        }
      });

      test("the deck does not collapse onto one layout", async () => {
        const { slides } = await build();
        const names = slides.map((s) => s.templateReference.templateName);
        const distinct = new Set(names).size;
        assert.ok(distinct >= Math.ceil(names.length * 0.75),
          `only ${distinct} distinct layouts across ${names.length} slides: ${names.join(", ")}`);
      });
    });
  }

  test("the shapes here really are different from each other", () => {
    /* Guards the fixtures themselves: if every outline scored the same, these
     * tests would pass while checking one case five times. */
    const leaders = Object.values(OUTLINES).map((outline) => {
      const sig = outlineSignatures(outline)[1];
      return shortlistFor(sig, { limit: 1, deckLength: outline.length })[0]?.name;
    });
    assert.ok(new Set(leaders).size >= 4,
      `the fixtures collapse onto the same layouts: ${leaders.join(", ")}`);
  });
});
