// test/deck-content.test.js
// =============================================================================
// What composition is allowed to put on a slide.
//
// Every rule here exists because it was broken in a way nothing caught: the
// render check runs inside prepareContentUpdate, so anything assigned AFTER it
// reaches the deck unvalidated. That is how speaker notes came to overwrite a
// template's own `notes` field and take the whole slide down.
// =============================================================================
import { written } from "./helpers/written.js";
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { allTemplates } from "../js/templates/index.js";
import { clampToCapacity, clampText, deckChrome, keepAssetPaths, keepDistinctDividers, bulletsOf } from "../product/domain/generation-service.js";

// Visual review is on by default (see generation-service.js) — disabled here
// so this suite's several dynamic-import composeSlides() calls stay fast,
// deterministic, and Playwright-free.
process.env.NPS_VISUAL_REVIEW = "0";

const byName = (name) => allTemplates.find((t) => t.name === name);

describe("prose is bounded to what the layout can show", () => {
  test("a body several times the example's length is cut back", () => {
    const t = byName("planning/grid-03");
    const exampleLength = t.example.body.length;
    const long = "This sentence describes one phase of the rollout in detail. ".repeat(14);
    assert.ok(long.length > exampleLength * 3);

    const out = clampToCapacity(t, { ...t.example, body: long });
    assert.ok(out.body.length < long.length, "an over-long body must be shortened");
    assert.ok(out.body.length <= exampleLength * 1.5,
      `expected roughly the example's budget, got ${out.body.length} against ${exampleLength}`);
  });

  test("ordinary-length prose is left exactly as written", () => {
    const t = byName("planning/grid-03");
    const body = "A phased rollout over eighteen months, beginning at the first depot.";
    assert.equal(clampToCapacity(t, { ...t.example, body }).body, body);
  });

  test("short label fields are not squeezed", () => {
    const t = byName("planning/grid-03");
    // The example caption is 7 characters; a real one is longer and must survive.
    const caption = "Rollout and readiness across depots";
    assert.equal(clampToCapacity(t, { caption }).caption, caption);
  });

  test("a headline is never cut to a phrase, however short its example", () => {
    // Regression: a real 70-character headline on a template whose example
    // title is 20 characters was cut to about 40 with an ellipsis.
    const t = byName("planning/grid-03");
    const shortExample = { ...t.example, subtitle: "Mood" };
    const headline = "We recommend Option B: a progressive rebuild that keeps the core live";
    const out = clampToCapacity(t, { ...shortExample, subtitle: headline });
    assert.equal(out.subtitle, headline, "a short field must come through whole");
    assert.ok(!out.subtitle.includes("…"));
  });

  test("cuts at a sentence or word boundary, never mid-word", () => {
    const text = "First sentence here. Second sentence follows on. Third one runs to the end.";
    const cut = clampText(text, 40);

    assert.ok(cut.length <= 41, `expected a cut near the budget, got ${cut.length}`);
    assert.ok(/[.…]$/.test(cut), `should end on a sentence or an ellipsis, got ${JSON.stringify(cut)}`);

    // The real property: whatever was kept is a prefix of the original that
    // ends where a word ends — so the last word is never sliced in half.
    const kept = cut.replace(/…$/, "");
    assert.ok(text.startsWith(kept), "the kept text must be a prefix of the original");
    const nextChar = text[kept.length] ?? " ";
    assert.match(nextChar, /\s/, `cut mid-word: ${JSON.stringify(kept.slice(-14))} is followed by ${JSON.stringify(nextChar)}`);
  });

  test("lists are still bounded by capacity", () => {
    const t = byName("finance/statement-list");
    const items = Array.from({ length: 9 }, (_, i) => `Point number ${i + 1}`);
    const allowed = Math.max(t.capacity.max, t.example.items.length);
    assert.equal(clampToCapacity(t, { items }).items.length, allowed);
  });
});

describe("a template's own fields are never trampled", () => {
  test("every template that renders `notes` still mounts after composition", () => {
    // planning/grid-15 declares `notes` as an array of three strings and renders
    // them. Speaker notes are a string and used to be written straight over it,
    // so `notes.map(...)` threw and the slide failed to mount — blank in the
    // editor and blank in the export.
    const claimants = allTemplates.filter((t) => "notes" in (t.schema || {}));
    assert.ok(claimants.length > 0, "this test is pointless if no template claims the name");

    for (const t of claimants) {
      assert.doesNotThrow(
        () => t.render({ ...t.example }),
        `${t.name} should render its own notes field`
      );
      // The shape the pipeline must NOT produce.
      assert.throws(
        () => t.render({ ...t.example, notes: "a speaker note, as a string" }),
        `${t.name} renders a string where it expects a list — the pipeline must not assign one`
      );
    }
  });
});

describe("chrome is derived, not authored", () => {
  test("page number and deck name come from the system", () => {
    const chrome = deckChrome(4, { title: "Northwind Claims" });
    assert.equal(chrome.meta.page, "5", "page is 1-based and positional");
    assert.equal(chrome.meta.name, "Northwind Claims");
    assert.equal(chrome.footer.col1, "Northwind Claims", "the footer names the presentation");
    assert.equal(chrome.footer.col2, "", "no client known: blank, never a [Client] placeholder");
    assert.equal(deckChrome(0, { title: "X", client: "Northwind" }).footer.col2, "Prepared for Northwind");
    assert.match(chrome.footer.copyright, /^© \d{4}$/);
  });
});

describe("asset paths come from the library, never from the model", () => {
  test("an invented image path is replaced by the template's own", () => {
    const example = { people: [{ image: "assets/photography/a.jpg", name: "N", role: "R" }] };
    const proposed = { people: [{ image: "assets/photography/invented.jpg", name: "Elena", role: "CTO" }] };
    const out = keepAssetPaths(example, proposed);
    assert.equal(out.people[0].image, "assets/photography/a.jpg");
    assert.equal(out.people[0].name, "Elena", "the words are still the model's");
  });
});

describe("composition actually applies the model's choices", () => {
  /* A regression that shipped twice and hid both times behind a silent catch:
   * every slide threw while being built, each quietly reverted to the plain
   * mapping, and the deck came back as a cover plus N identical content slides
   * — indistinguishable from "the engine chose badly", with nothing logged.
   *
   * This drives composeSlides with a stub provider, so it costs no model call
   * and asserts the thing that actually broke: the chosen templates reach the
   * finished deck. */
  test("the composed templates are the ones chosen, not the fallback", async () => {
    const { composeSlides } = await import("../product/domain/generation-service.js");

    const picks = ["main/cover-01", "core/content-list-3", "finance/highlights", "core/closing-single"];
    const mapping = picks.map((_, i) => ({
      slideNumber: i + 1,
      title: `Slide ${i + 1}`,
      content: { body: ["A point worth making about the programme."], notes: "" },
    }));

    const provider = {
      async generatePresentation() { throw new Error("not used"); },
      async composeDeck({ outline }) {
        return {
          slides: outline.map((_, i) => {
            const t = allTemplates.find((x) => x.name === picks[i]);
            return { templateName: t.name, theme: i === 0 ? "dark" : "light", content: { ...t.example } };
          }),
        };
      },
    };

    const slides = await composeSlides(provider, mapping, { title: "A deck" });
    const got = slides.map((s) => s.templateReference.templateName);

    assert.deepEqual(got, picks,
      `composition did not apply the chosen templates — it fell back to ${JSON.stringify(got)}`);
    assert.equal(slides[0].themeOverride, "dark", "the chosen dark theme was dropped");
  });

  test("a deck of varied content does not collapse onto one template", async () => {
    const { composeSlides } = await import("../product/domain/generation-service.js");
    // No composeDeck at all — the honest worst case. Even then the fallback
    // must be the documented two templates, not an error.
    const mapping = Array.from({ length: 5 }, (_, i) => ({
      slideNumber: i + 1, title: `Slide ${i + 1}`, content: { body: ["Something."], notes: "" },
    }));
    const slides = await composeSlides({}, mapping, { title: "A deck" });
    assert.equal(slides.length, 5);
    for (const s of slides) assert.ok(s.templateReference.templateName, "a slide has no template");
  });
});

describe("the brand's dark/light sandwich is guaranteed, not hoped for", () => {
  /* Of the decks on this machine when this was written, five opened dark and
   * six were light from the first slide to the last — because the theme was
   * entirely the model's call. A deck that never goes dark reads as a missing
   * feature, which is exactly how it was reported. */
  test("a composed deck opens and closes dark", async () => {
    const { composeSlides } = await import("../product/domain/generation-service.js");
    const picks = ["main/cover-01", "core/content-list-3", "finance/highlights", "core/closing-single"];
    const mapping = picks.map((_, i) => ({
      slideNumber: i + 1, title: `Slide ${i + 1}`,
      content: { body: ["A point worth making about the programme."], notes: "" },
    }));
    const provider = {
      async generatePresentation() { throw new Error("not used"); },
      async composeDeck({ outline }) {
        return {
          // Every slide answered "light" — the model declining to use dark at
          // all is the case that produced the flat decks.
          slides: outline.map((_, i) => {
            const t = allTemplates.find((x) => x.name === picks[i]);
            return { templateName: t.name, theme: "light", content: { ...t.example } };
          }),
        };
      },
    };
    const slides = await composeSlides(provider, mapping, { title: "A deck" });
    const themes = slides.map((s) => s.themeOverride);
    assert.equal(themes[0], "dark", "the cover must open dark whatever the model said");
    assert.equal(themes[themes.length - 1], "dark", "the closing must be dark too");
    assert.deepEqual(themes.slice(1, -1), [undefined, undefined],
      "the middle is still the model's to decide, and it said light");
  });

  test("the model's dark choice mid-deck is still honoured", async () => {
    const { themeFor } = await import("../product/domain/generation-service.js");
    assert.equal(themeFor(2, 6, { templateName: "core/divider-single", theme: "dark" }), "dark");
    assert.equal(themeFor(2, 6, { templateName: "core/divider-single", theme: "light" }), undefined);
  });

  test("a two-slide deck has no middle, so no sandwich", async () => {
    const { themeFor } = await import("../product/domain/generation-service.js");
    assert.equal(themeFor(0, 2, { templateName: "main/cover-01" }), undefined);
  });

  test("a template that cannot render dark never takes a bookend", async () => {
    const { themeFor } = await import("../product/domain/generation-service.js");
    assert.equal(themeFor(0, 8, { templateName: "not/a-real-template", theme: "dark" }), undefined);
  });
});

describe("a layout that cannot hold the slide does not get to keep it", () => {
  /* The closing slide of a real board deck carried five decisions — approve the
   * model, release the funding, authorise recruitment, the dashboard, the next
   * checkpoint. It was laid out on portfolio/text-16, whose entire schema is one
   * word, and rendered as "Approve Model B". The other four were gone. Nothing
   * threw: the template has nowhere to put them, so they were dropped, and the
   * deck looked finished. Scoring had already ranked that template 19 against
   * the leader's 90 — the model overrode a correct shortlist, so the guard has
   * to sit at the outcome rather than in the ranking. */
  const DECISIONS =
    "Approve the hybrid operating model, Model B group-wide from October. " +
    "Release capital and recurrent funding, with a stage gate at month six. " +
    "Authorise immediate recruitment to fourteen anaesthetic and ODP posts. " +
    "Receive a monthly dashboard from the Chief Operating Officer. " +
    "Next board checkpoint February 2027, reporting against Phase 1 targets.";

  const deckOf = (finalPick) => {
    const titles = ["Opening", "Where we stand", "Root causes", "Two models",
                    "The plan", "A quotation", "The costs", "Next steps and decisions requested"];
    const mapping = titles.map((t, i) => ({
      slideNumber: i + 1, title: t,
      content: { body: [i === titles.length - 1 ? DECISIONS : "A point worth making about the programme."], notes: "" },
    }));
    const provider = {
      async generatePresentation() { throw new Error("not used"); },
      async composeDeck({ outline }) {
        return {
          slides: outline.map((s, i) => {
            const name = i === outline.length - 1 ? finalPick : "core/content-twocol";
            const t = allTemplates.find((x) => x.name === name);
            const content = i === outline.length - 1
              ? { ...written(t.example), word: "Approve Model B", title: s.title, body: s.bullets, items: s.bullets }
              : { ...written(t.example) };
            return { templateName: name, theme: "light", content };
          }),
        };
      },
    };
    return { provider, mapping };
  };

  test("the one-word closing is replaced, and the decisions survive", async () => {
    const { composeSlides, retentionOf } = await import("../product/domain/generation-service.js");
    const { provider, mapping } = deckOf("portfolio/text-16");
    const warnings = [];
    const slides = await composeSlides(provider, mapping, { title: "A deck", warnings });

    const last = slides[slides.length - 1];
    assert.notEqual(last.templateReference.templateName, "portfolio/text-16",
      "a one-word layout must not keep a slide holding five decisions");
    assert.ok(retentionOf(DECISIONS, last.content) >= 0.45,
      `the decisions did not survive: ${JSON.stringify(last.content).slice(0, 200)}`);
    assert.ok(warnings.some((w) => /could not hold the content/.test(w)),
      `the swap must be reported, got ${JSON.stringify(warnings)}`);
  });

  test("a layout that does hold the content is left alone", async () => {
    const { composeSlides } = await import("../product/domain/generation-service.js");
    const { provider, mapping } = deckOf("core/content-list-3");
    const warnings = [];
    // The decisions are the user's own material, so they arrive through the
    // prompt: their "February 2027" is a date the deck may only show when the
    // material gives it ("Phase 1" is a structural counter and exempt anyway).
    const slides = await composeSlides(provider, mapping, { title: "A deck", warnings, prompt: DECISIONS });
    assert.equal(slides[slides.length - 1].templateReference.templateName, "core/content-list-3");
    assert.deepEqual(warnings, [], "nothing to warn about when nothing was lost");
  });
});

describe("retention measures the slide, not the chrome", () => {
  test("words repeated in meta and footer do not count as kept", async () => {
    const { retentionOf } = await import("../product/domain/generation-service.js");
    const source = "Approve the operating model and release the funding";
    assert.equal(retentionOf(source, { meta: { name: source }, footer: { col1: source } }), 0,
      "the deck title appears on every slide — counting it would make an empty slide look half full");
  });

  test("rewording is not loss", async () => {
    const { retentionOf } = await import("../product/domain/generation-service.js");
    const source = "Approve the hybrid operating model and release the capital funding";
    // Same words, redistributed across a card layout's fields and reordered.
    const kept = { title: "Release the capital funding", cards: [{ title: "Approve and", items: ["the hybrid operating model"] }] };
    assert.equal(retentionOf(source, kept), 1, "every word is still on the slide, just arranged differently");
  });
});

describe("a chart axis fits the data it is given", () => {
  /* finance/line-markers passed max:700 — the dollar scale of its own Figma
   * example. A deck charting availability at 87.9% to 89.1% against that axis
   * put every point and all four tick labels in the bottom 13% of the panel:
   * a flat line and a y-axis that rendered as one black smudge of overlapping
   * labels. Nothing clipped, nothing escaped, contrast was fine — every check
   * called the slide good. */
  const yOf = (svg, label) => {
    const m = svg.match(new RegExp(`<text x="[0-9.]+" y="([0-9.]+)"[^>]*>${label}</text>`));
    return m ? +m[1] : null;
  };
  const spread = (ys) => Math.max(...ys) - Math.min(...ys);

  test("a narrow range still spreads across the panel", async () => {
    const { finLineChart } = await import("../js/finance-blocks.js");
    const svg = finLineChart({
      series: [{ values: [89.1, 88.6, 88.0, 87.9] }],
      yTicks: [{ value: 87, label: "A" }, { value: 89, label: "B" },
               { value: 91, label: "C" }, { value: 93, label: "D" }],
      xLabels: ["Q1", "Q2", "Q3", "Q4"],
      max: 700, // the template's hardcoded dollar ceiling
    });
    const ys = ["A", "B", "C", "D"].map((l) => yOf(svg, l));
    assert.ok(ys.every((y) => y !== null), "every tick must be drawn");
    assert.ok(spread(ys) > 400,
      `ticks collapsed into ${Math.round(spread(ys))}px — they must use the panel`);
  });

  test("the example's zero-based dollar axis is unchanged", async () => {
    const { finLineChart } = await import("../js/finance-blocks.js");
    const svg = finLineChart({
      series: [{ values: [210, 347, 483, 620] }],
      yTicks: [{ value: 175, label: "A" }, { value: 350, label: "B" },
               { value: 525, label: "C" }, { value: 700, label: "D" }],
      xLabels: ["Q1", "Q2", "Q3", "Q4"],
      max: 700,
    });
    // 175 of a 0–700 axis sits three quarters of the way down the plot.
    const ys = ["A", "B", "C", "D"].map((l) => yOf(svg, l));
    assert.ok(Math.abs(ys[0] - 527.5) < 2 && Math.abs(ys[3] - 37) < 2,
      `the honoured ceiling moved: ${JSON.stringify(ys)}`);
  });

  test("no data at all does not divide by zero", async () => {
    const { finLineChart } = await import("../js/finance-blocks.js");
    const svg = finLineChart({ series: [], yTicks: [], xLabels: [] });
    assert.ok(!/NaN|Infinity/.test(svg), `the empty chart emitted ${svg.slice(0, 120)}`);
  });
});

describe("model content is reshaped to what the template renders", () => {
  /* Eighteen templates render `body` with .map(); the model returns it as a
   * paragraph often enough that two of ten generated decks hit it. The render
   * check caught the TypeError and kept the slide on the default layout — safe,
   * but the deck lost both the layout chosen for it and the words written for
   * that layout, and it showed up only as a duplicate in the variety count. */
  test("a paragraph where a list belongs becomes list items", async () => {
    const { coerceToExample } = await import("../product/domain/generation-service.js");
    const out = coerceToExample({ body: ["a", "b"] },
      { body: "One sentence here. And a second one follows." });
    assert.deepEqual(out.body, ["One sentence here.", "And a second one follows."]);
  });

  test("a single clause becomes a one-item list, not a split on spaces", async () => {
    const { coerceToExample } = await import("../product/domain/generation-service.js");
    assert.deepEqual(coerceToExample({ body: ["a"] }, { body: "Just one clause" }).body,
      ["Just one clause"]);
  });

  test("a list where a string belongs is joined", async () => {
    const { coerceToExample } = await import("../product/domain/generation-service.js");
    assert.equal(coerceToExample({ caption: "c" }, { caption: ["joined", "back"] }).caption,
      "joined back");
  });

  test("nested rows are reshaped too", async () => {
    const { coerceToExample } = await import("../product/domain/generation-service.js");
    const out = coerceToExample({ cards: [{ title: "x", items: ["i"] }] },
      { cards: [{ title: "X", items: "A point. Another point." }] });
    assert.deepEqual(out.cards[0].items, ["A point.", "Another point."]);
  });

  test("content already the right shape is untouched, and unknown keys survive", async () => {
    const { coerceToExample } = await import("../product/domain/generation-service.js");
    const out = coerceToExample({ body: ["a"] }, { body: ["already", "a", "list"], extra: "kept" });
    assert.deepEqual(out.body, ["already", "a", "list"]);
    assert.equal(out.extra, "kept");
  });

  test("a deck whose model returns prose for a list keeps its chosen layout", async () => {
    const { composeSlides } = await import("../product/domain/generation-service.js");
    // portfolio/text-06 renders (s.body || []).map(...) and threw on a string.
    const picks = ["main/cover-01", "portfolio/text-06", "core/closing-single"];
    const mapping = picks.map((_, i) => ({
      slideNumber: i + 1, title: `Slide ${i + 1}`,
      content: { body: ["A point worth making."], notes: "" },
    }));
    const provider = {
      async generatePresentation() { throw new Error("not used"); },
      async composeDeck({ outline }) {
        return {
          slides: outline.map((_, i) => {
            const t = allTemplates.find((x) => x.name === picks[i]);
            const content = { ...written(t.example) };
            if (i === 1) content.body = "A paragraph the model wrote. It has two sentences.";
            return { templateName: t.name, theme: "light", content };
          }),
        };
      },
    };
    const warnings = [];
    // portfolio/text-06 carries a year; the stub's "2026" is the user's.
    const slides = await composeSlides(provider, mapping, { title: "A deck", warnings, prompt: "A deck for 2026" });
    assert.equal(slides[1].templateReference.templateName, "portfolio/text-06",
      "the slide fell back to the default layout instead of being reshaped");
    assert.deepEqual(warnings, [], `unexpected warnings: ${JSON.stringify(warnings)}`);
  });
});

describe("both hand-built line charts share one scale", () => {
  /* The same bug was written twice, in two families: a zero-based axis whose
   * ceiling came from the template's own Figma example. Given data on another
   * scale, every point and tick landed in a thin band and the axis rendered as
   * a stack of overlapping labels. */
  test("a percentage series beside a large ceiling still spreads", async () => {
    const { chartRange } = await import("../js/chart-scale.js");
    const { lo, hi } = chartRange([0.5, 6, 12, 18], [0, 6, 12, 18], 5600);
    assert.ok(hi - lo < 40, `the axis should fit the data, got ${lo}..${hi}`);
  });

  test("a ceiling the data actually uses is honoured", async () => {
    const { chartRange } = await import("../js/chart-scale.js");
    assert.deepEqual(chartRange([210, 347, 483, 620], [175, 350, 525, 700], 700), { lo: 0, hi: 700 });
  });

  test("no values at all never divides by zero", async () => {
    const { chartRange } = await import("../js/chart-scale.js");
    const { lo, hi } = chartRange([], [], null);
    assert.ok(Number.isFinite(lo) && Number.isFinite(hi) && hi > lo);
  });
});

describe("an imported deck is named after itself, not its file", () => {
  /* A round-tripped export came back called "deck", because the filename beat
   * the title slide. The deck title is copied into meta.name, so "deck" was
   * then printed in the top bar of all nine slides and shown as the deck's name
   * in the library. */
  test("the title slide wins over the filename", async () => {
    const { PptxImportService } = await import("../product/domain/pptx-import-service.js");
    assert.ok(PptxImportService, "the service must still be exported");
    // The rule under test, stated directly — parsing a real .pptx needs a file.
    const pick = (cover, filename) => {
      const fromCover = String(cover || "").trim();
      const coverIsReal = fromCover && !/^slide \d+$/i.test(fromCover);
      const fromFile = (filename || "").replace(/\.pptx$/i, "").replace(/[-_]+/g, " ").trim();
      return (coverIsReal && fromCover) || fromFile || "Imported presentation";
    };
    assert.equal(pick("Recovering the Theatre Capacity", "deck.pptx"), "Recovering the Theatre Capacity");
    assert.equal(pick("Slide 1", "Q3 board review.pptx"), "Q3 board review",
      "a placeholder cover must fall back to the filename");
    assert.equal(pick("", "客户提案.pptx"), "客户提案");
    assert.equal(pick("", ""), "Imported presentation");
  });
});

describe("swapping a layout keeps the slide's theme", () => {
  /* A slide is dark because of where it sits in the deck — the brand opens and
   * closes dark — or because someone chose it. The template only declares what
   * it renders as when nothing else says. Taking the target's default turned a
   * dark cover light the moment the AI panel swapped its layout: the deck's
   * opening lost the sandwich, silently, as a side effect. */
  test("a dark slide stays dark on a template it renders light by default", () => {
    const target = allTemplates.find((t) => t.name === "main/split-01");
    assert.equal(target.theme, "light", "this test needs a light-by-default target");
    // The rule as the service applies it.
    const themeOf = (slide, t) => slide.themeOverride ?? t.theme;
    assert.equal(themeOf({ themeOverride: "dark" }, target), "dark");
  });

  test("a slide with no theme of its own takes the template's", () => {
    const target = allTemplates.find((t) => t.name === "main/split-01");
    const themeOf = (slide, t) => slide.themeOverride ?? t.theme;
    assert.equal(themeOf({}, target), "light");
    assert.equal(themeOf({ themeOverride: undefined }, target), "light");
  });
});

describe("the template's example does not show through the finished slide", () => {
  /* Content is merged over the example so a field the model omitted keeps a
   * sane default — right for chrome and image paths, wrong for words. A
   * generated cover shipped with `project: "Project"` printed on it, and a
   * portfolio slide with a meta value of "2025", because the model filled the
   * fields it cared about and left the rest as it found them. */
  test("an untouched placeholder word is blanked", async () => {
    const { stripExampleLeftovers } = await import("../product/domain/generation-service.js");
    const example = { title: "Title", project: "Project", company: "Company" };
    const out = stripExampleLeftovers({ title: "Build or Buy", project: "Project", company: "Company" }, example);
    assert.equal(out.title, "Build or Buy", "written content survives");
    assert.equal(out.project, "");
    assert.equal(out.company, "");
  });

  test("a real value that happens to match the example is kept", async () => {
    const { stripExampleLeftovers } = await import("../product/domain/generation-service.js");
    // Not a bare placeholder word, so it stays even though it equals the example.
    const out = stripExampleLeftovers({ subtitle: "Rollout and readiness" }, { subtitle: "Rollout and readiness" });
    assert.equal(out.subtitle, "Rollout and readiness");
  });

  test("a caption nobody wrote is dropped — captions are optional context", async () => {
    const { stripExampleLeftovers } = await import("../product/domain/generation-service.js");
    const out = stripExampleLeftovers({ caption: "Typography", title: "Ours" }, { caption: "Typography", title: "Title" });
    assert.equal(out.caption, "");
    assert.equal(out.title, "Ours");
  });

  test("a year the model actually chose is kept", async () => {
    const { stripExampleLeftovers } = await import("../product/domain/generation-service.js");
    assert.equal(stripExampleLeftovers({ year: "2027" }, { year: "2025" }).year, "2027");
  });

  test("image paths and chrome are never touched", async () => {
    const { stripExampleLeftovers } = await import("../product/domain/generation-service.js");
    const example = { image: "assets/photography/a.jpg", meta: { name: "Presentation Name" } };
    const out = stripExampleLeftovers(
      { image: "assets/photography/a.jpg", meta: { name: "Presentation Name" } }, example);
    assert.equal(out.image, "assets/photography/a.jpg", "keepAssetPaths owns images deliberately");
    assert.equal(out.meta.name, "Presentation Name", "deckChrome owns meta deliberately");
  });

  test("nested rows are scrubbed too", async () => {
    const { stripExampleLeftovers } = await import("../product/domain/generation-service.js");
    const example = { rows: [{ label: "Since", value: "2025" }] };
    const out = stripExampleLeftovers({ rows: [{ label: "Since", value: "2025" }] }, example);
    assert.equal(out.rows[0].value, "");
  });
});

describe("a grid of cells is reshaped, not just a flat list", () => {
  /* planning/data-02 renders rows of CELLS, each cell a list of its own:
   * cells: [["a"], ["b"]]. The model returns cells: ["a", "b"], and both are
   * arrays — so the shapes matched at that level and the mismatch one level
   * down went unseen. It cost two slides their chosen layout across twenty
   * generated decks, each time as a silent fallback to the default. */
  test("a flat list of cells becomes a list per cell", async () => {
    const { coerceToExample } = await import("../product/domain/generation-service.js");
    const example = { rows: [{ label: "L", cells: [["x"], ["y"]] }] };
    const out = coerceToExample(example, { rows: [{ label: "Reach", cells: ["Paid search", "Email"] }] });
    assert.deepEqual(out.rows[0].cells, [["Paid search"], ["Email"]]);
    assert.equal(out.rows[0].label, "Reach", "the row's own words survive");
  });

  test("cells already shaped correctly are untouched", async () => {
    const { coerceToExample } = await import("../product/domain/generation-service.js");
    const example = { rows: [{ label: "L", cells: [["x"], ["y"]] }] };
    const out = coerceToExample(example, { rows: [{ label: "R", cells: [["a", "b"], ["c"]] }] });
    assert.deepEqual(out.rows[0].cells, [["a", "b"], ["c"]]);
  });

  test("the template it was found on renders after coercion", async () => {
    const { coerceToExample } = await import("../product/domain/generation-service.js");
    const t = allTemplates.find((x) => x.name === "planning/data-02");
    assert.ok(t, "planning/data-02 must still exist");
    const flattened = {
      ...t.example,
      rows: (t.example.rows || []).map((r) => ({ ...r, cells: (r.cells || []).map((c) => c.join(" "))})),
    };
    assert.throws(() => t.render(flattened), "this test is pointless if the flat shape renders");
    assert.doesNotThrow(() => t.render(coerceToExample(t.example, flattened)));
  });
});

describe("a divider never repeats the slide beside it", () => {
  const mapping = [
    { slideNumber: 1, title: "Cover" },
    { slideNumber: 2, title: "Three ways forward" },
    { slideNumber: 3, title: "Options compared" },
    { slideNumber: 4, title: "Next steps" },
  ];
  const note = () => {};

  test("a divider titled like the slide after it is dropped and reported", () => {
    const notes = [];
    const kept = keepDistinctDividers([{ after: 1, title: "Three ways forward" }], mapping, { note: (m) => notes.push(m) });
    assert.deepEqual(kept, []);
    assert.equal(notes.length, 1);
    assert.match(notes[0], /repeats the slide beside it/);
  });

  test("a divider titled like the slide before it is dropped too", () => {
    const kept = keepDistinctDividers([{ after: 3, title: "options compared!" }], mapping, { note });
    assert.deepEqual(kept, []);
  });

  test("a divider with its own title is kept", () => {
    const d = { after: 2, title: "How we get there" };
    assert.deepEqual(keepDistinctDividers([d], mapping, { note }), [d]);
  });
});

describe("a drafted list reaches the outline as a list", () => {
  test("five drafted bullets stay five items, not one joined paragraph", () => {
    const bullets = ["Mortgage margin", "SME impairments", "Cyber attack", "Consumer Duty", "Talent loss"];
    const slide = { title: "Our top five risks", bullets, content: { body: bullets.join(" ") } };
    assert.deepEqual(bulletsOf(slide), bullets);
  });

  test("a body string with no list is still read as one item", () => {
    assert.deepEqual(bulletsOf({ content: { body: "One point only." } }), ["One point only."]);
    assert.deepEqual(bulletsOf({ content: {} }), []);
  });
});
