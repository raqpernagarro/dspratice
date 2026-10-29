// test/template-selection.test.js
// =============================================================================
// Does the engine actually understand what a slide IS?
//
// Selection used to be one prompt holding all 229 templates as prose, and it
// showed: the same dozen layouts came back deck after deck, because 229
// near-identical lines give nothing to discriminate on. Reading the content and
// scoring the library against it is now done in code — which means it can be
// tested without spending a model call, and a regression in judgement fails
// here rather than surfacing weeks later as "the decks look samey again".
//
// These assert the SHORTLIST, not the final pick. The model still chooses; this
// only has to put the right kind of layout in front of it.
// =============================================================================
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { contentSignature, outlineSignatures } from "../product/domain/content-signature.js";
import { shortlistFor, scoreTemplate } from "../product/domain/template-scoring.js";
import { allTemplates } from "../js/templates/index.js";

const sigOf = (slide, index = 3, total = 9) => contentSignature(slide, { index, total });
const rolesIn = (list) => list.map((c) => c.role);
const namesIn = (list) => list.map((c) => c.name);

describe("reading what a slide is", () => {
  const CASES = [
    ["a cover", { title: "Modernising claims at Northwind", bullets: ["A proposal for 2026"] }, 0, "isFirst"],
    ["an agenda", { title: "What we will cover", bullets: ["Today", "The proposal", "Rollout", "Cost"] }, 1, "isAgenda"],
    ["figures", { title: "Claims today", bullets: ["14 days to settle", "38% need rework", "£18.6m a year"] }, 2, "isNumeric"],
    ["a comparison", { title: "Today versus target", bullets: ["Manual vs automated triage", "14 days vs 3 days"] }, 3, "isComparison"],
    ["a sequence", { title: "Rollout", bullets: ["Q1 discovery", "Q2 pilot", "Q3 extend", "Q4 production"] }, 4, "isSequence"],
    ["people", { title: "The team", bullets: ["Elena Voss, CTO", "Marcus Reed, Head of Platform"] }, 5, "isPeople"],
    ["a quote", { title: '"We ship twice a year, they ship twice a day."', bullets: ["Elena Voss"] }, 6, "isQuote"],
    ["awards", { title: "Recognition", bullets: ["AWS Partner of the Year", "ISO 27001 certified"] }, 7, "isAwards"],
  ];

  for (const [label, slide, index, flag] of CASES) {
    test(`recognises ${label}`, () => {
      const sig = sigOf(slide, index, 9);
      assert.equal(sig[flag], true, `${label} should set ${flag} — got ${JSON.stringify(sig)}`);
    });
  }

  test("an award citation is not read as a team slide", () => {
    // "Partner of the Year" contains a job-title word; matching it sent every
    // awards slide to a team-with-photos layout.
    const sig = sigOf({ title: "Recognition", bullets: ["AWS Partner of the Year 2025", "ISO 27001 certified"] });
    assert.equal(sig.isAwards, true);
    assert.equal(sig.isPeople, false, "an award is not a person");
  });

  test("the word 'photo' inside prose is not a request for photography", () => {
    // "Intake: paper forms vs photo capture" is a comparison about a process.
    const sig = sigOf({ title: "Today versus target", bullets: ["Intake: paper forms vs photo capture"] });
    assert.equal(sig.wantsVisual, false);
    assert.equal(sig.isComparison, true);
  });

  test("one figure in a sentence is prose, not a stat slide", () => {
    const sig = sigOf({ title: "Background", bullets: ["The programme began in 2019 after a review of the estate."] });
    assert.equal(sig.isNumeric, false);
  });
});

describe("the shortlist offers the right kind of layout", () => {
  const expectRole = (slide, index, total, roles, label) => {
    const list = shortlistFor(sigOf(slide, index, total), { limit: 8, deckLength: total });
    const found = rolesIn(list);
    assert.ok(found.some((r) => roles.includes(r)),
      `${label}: expected one of [${roles}] in the shortlist, got [${[...new Set(found)]}]`);
  };

  test("slide 1 is offered covers", () =>
    expectRole({ title: "A proposal", bullets: ["For 2026"] }, 0, 9, ["cover"], "cover"));

  test("the last slide is offered a closing", () =>
    expectRole({ title: "Thank you", bullets: ["hugo@nagarro.com"] }, 8, 9, ["closing", "contact"], "closing"));

  test("an agenda is offered a contents layout", () =>
    expectRole({ title: "What we will cover", bullets: ["A", "B", "C", "D"] }, 1, 9, ["toc", "index"], "agenda"));

  test("figures are offered charts or stat layouts", () =>
    expectRole({ title: "Where we are", bullets: ["14 days", "38%", "£18.6m", "26 FTE"] }, 2, 9,
      ["chart", "data", "results", "statement", "cards"], "figures"));

  test("a sequence is offered a timeline", () =>
    expectRole({ title: "Rollout", bullets: ["Q1 discovery", "Q2 pilot", "Q3 extend", "Q4 production"] }, 3, 9,
      ["timeline", "diagram", "chart"], "sequence"));

  test("a comparison is offered a table or diagram", () =>
    expectRole({ title: "Today versus the target state", bullets: ["Manual vs automated", "14 days vs 3 days", "Paper vs capture"] },
      3, 9, ["table", "diagram", "chart"], "comparison"));

  test("people are offered a team layout", () =>
    expectRole({ title: "The team", bullets: ["Elena Voss, CTO", "Marcus Reed, Director", "Priya Anand, Principal"] },
      4, 9, ["team", "cv"], "people"));

  test("a quotation is offered a quote layout", () =>
    expectRole({ title: '"We ship twice a year, they ship twice a day."', bullets: ["Elena Voss, CTO"] },
      5, 9, ["quote", "statement"], "quote"));

  test("a cover is never offered mid-deck", () => {
    const list = shortlistFor(sigOf({ title: "Where we are", bullets: ["A", "B", "C"] }, 4, 9), { limit: 12, deckLength: 9 });
    assert.ok(!rolesIn(list).includes("cover"), `a cover appeared mid-deck: ${namesIn(list)}`);
  });
});

describe("fit is scored in both directions", () => {
  // The visual gap: a layout with room for nine given three leaves two thirds
  // of the frame empty. That reads as unfinished, and it was the most common
  // complaint about generated decks.
  const threePoints = sigOf({ title: "Three things", bullets: ["One", "Two", "Three"] });

  test("a layout sized for the content beats one with far more room", () => {
    const tight = allTemplates.find((t) => t.capacity?.items === 3 && t.role === "cards");
    const roomy = allTemplates.find((t) => t.capacity?.items >= 9);
    assert.ok(tight && roomy, "the library should have both to compare");
    const a = scoreTemplate(tight, threePoints, { deckLength: 9 }).score;
    const b = scoreTemplate(roomy, threePoints, { deckLength: 9 }).score;
    assert.ok(a > b, `a 3-slot layout (${tight.name}: ${a}) should beat a 9-slot one (${roomy.name}: ${b})`);
  });

  test("overflowing a layout is penalised", () => {
    const many = sigOf({ title: "Nine things", bullets: Array.from({ length: 9 }, (_, i) => `Point ${i + 1}`) });
    const small = allTemplates.find((t) => t.capacity?.max === 3 && t.role === "cards");
    assert.ok(small, "expected a 3-item cards template");
    const fitting = scoreTemplate(small, threePoints, { deckLength: 9 }).score;
    const overflowing = scoreTemplate(small, many, { deckLength: 9 }).score;
    assert.ok(overflowing < fitting,
      `${small.name} should score worse for 9 points (${overflowing}) than 3 (${fitting})`);
  });

  test("every choice carries a reason", () => {
    for (const c of shortlistFor(threePoints, { limit: 6, deckLength: 9 })) {
      assert.ok(Array.isArray(c.why), `${c.name} has no reason attached`);
    }
  });
});

describe("the whole library stays reachable", () => {
  test("varied content reaches far more than a handful of templates", () => {
    // The complaint that started this: the same dozen layouts, deck after deck.
    const outline = [
      { title: "A proposal for 2026", bullets: ["Modernising claims"] },
      { title: "What we will cover", bullets: ["Today", "Proposal", "Rollout", "Cost"] },
      { title: "Claims today", bullets: ["14 days", "38% rework", "£18.6m", "26 FTE"] },
      { title: "Today versus the target state", bullets: ["Manual vs automated", "14 vs 3 days"] },
      { title: "Our approach", bullets: ["Intake", "Triage", "Adjudication", "Learning"] },
      { title: "Rollout", bullets: ["Q1 discovery", "Q2 pilot", "Q3 extend", "Q4 production"] },
      { title: "What it delivers", bullets: ["70% faster", "£4.2m saved", "NPS +22"] },
      { title: "The team", bullets: ["Elena Voss, CTO", "Marcus Reed, Director", "Priya Anand, Principal"] },
      { title: '"We ship twice a year."', bullets: ["Elena Voss, CTO"] },
      { title: "Recognition", bullets: ["AWS Partner of the Year", "ISO 27001 certified"] },
      { title: "Investment", bullets: ["Discovery £180k", "Pilot £640k", "Rollout £1.4m"] },
      { title: "Thank you", bullets: ["hugo@nagarro.com"] },
    ];
    const offered = new Set();
    for (const sig of outlineSignatures(outline)) {
      for (const c of shortlistFor(sig, { limit: 12, deckLength: outline.length })) offered.add(c.name);
    }
    assert.ok(offered.size >= 60,
      `a varied deck should reach a wide part of the library, only ${offered.size} templates were offered`);
  });

  test("no single family dominates a shortlist", () => {
    const list = shortlistFor(sigOf({ title: "Four things", bullets: ["A", "B", "C", "D"] }), { limit: 12, deckLength: 9 });
    const families = list.map((c) => c.name.split("/")[0]);
    const worst = Math.max(...[...new Set(families)].map((f) => families.filter((x) => x === f).length));
    assert.ok(worst <= Math.ceil(list.length / 2),
      `one family took ${worst} of ${list.length} places: ${namesIn(list)}`);
  });
});

describe("a team layout needs a team, not a job title in passing", () => {
  /* A real board deck produced this: "Three root causes" — eight figures and
   * three long paragraphs about theatre utilisation, vacancy rates and
   * cancellations — said "anaesthetic consultant" once and "Clinical Director"
   * once, and came back on a team-photo layout with three faces on it. `people`
   * outranks `numeric`, so a single incidental role word won outright. */
  const CAUSES = "Theatre productivity: utilisation sits at 68% against an 85% benchmark. " +
    "Late starts average 24 minutes and 11.8% of lists finish early. " +
    "Workforce gaps: 19% anaesthetic consultant vacancy rate, filled by agency at 2.4x cost. " +
    "Flow and cancellations: 12.1% of elective cases are cancelled on the day, 61% for bed unavailability.";
  const ROSTER = [
    "Amara Whitlock — Clinical Director for Surgery",
    "Tom Reyes — Head of Theatres",
    "Priya Nandi — Chief Operating Officer",
    "Jonas Lek — Programme Manager",
  ];
  const middle = (title, bullets) => outlineSignatures([
    { title: "Opening", bullets: ["Something."] },
    { title, bullets },
    { title: "More", bullets: ["Something."] },
    { title: "Close", bullets: ["Something."] },
  ])[1];

  test("prose that mentions a role is not a team slide", () => {
    const sig = middle("Three root causes", [CAUSES]);
    assert.equal(sig.isPeople, false, "a paragraph naming a job title is not a roster");
    assert.equal(sig.isNumeric, true, "it is about figures, and that reading must survive");
    const top = shortlistFor(sig, { limit: 5, deckLength: 8 });
    assert.ok(!top.some((c) => c.role === "team"),
      `a team layout should not be offered: ${top.map((c) => `${c.name}(${c.role})`).join(", ")}`);
  });

  test("an actual roster still reaches a team layout", () => {
    const sig = middle("The team leading this", ROSTER);
    assert.equal(sig.isPeople, true);
    assert.equal(shortlistFor(sig, { limit: 5, deckLength: 8 })[0].role, "team");
  });

  test("one person among four unrelated points is not a team slide", () => {
    const sig = middle("Where we are", [
      "Amara Whitlock — Clinical Director for Surgery",
      "Waiting list at 18,400 patients",
      "Median wait of 21 weeks",
      "Four specialties hold 68% of the backlog",
    ]);
    assert.equal(sig.isPeople, false, "a majority of entries must read as people");
  });
});

describe("an attributed quote keeps its speaker", () => {
  /* Six of the fourteen quote templates have no attribution field at all. A
   * board deck's quote from a named clinical director landed on one of them and
   * the name was simply dropped — the finished slide showed an anonymous
   * sentence, which in that room is worth far less than the quote. */
  const middle = (bullets) => outlineSignatures([
    { title: "Opening", bullets: ["Something."] },
    { title: "What they said", bullets },
    { title: "Then", bullets: ["Something."] },
    { title: "Close", bullets: ["Something."] },
  ])[1];
  const ATTRIBUTED = '"We cancel patients on the morning of surgery because a bed went to an ' +
    'emergency overnight. That is not a clinical failure — it is a design failure." ' +
    "— Dr. Amara Whitlock, Clinical Director for Surgery";
  const BARE = '"We are not short of skill. We are short of protected, predictable theatre time."';

  const carries = (name) => {
    const t = allTemplates.find((x) => x.name === name);
    return Object.keys(t.schema || {}).some((k) => /^(name|attribution|author|source|cite|speaker|by)$/i.test(k));
  };

  test("the signal separates an attributed quote from a bare one", () => {
    assert.equal(middle([ATTRIBUTED]).hasAttribution, true);
    assert.equal(middle([BARE]).hasAttribution, false);
  });

  test("every quote layout offered for it can hold the name", () => {
    const top = shortlistFor(middle([ATTRIBUTED]), { limit: 5, deckLength: 8 });
    const dropping = top.filter((c) => c.role === "quote" && !carries(c.name));
    assert.deepEqual(dropping.map((c) => c.name), [],
      "these would silently lose the speaker's name");
  });

  test("a bare quote is not pushed onto an attribution layout", () => {
    // The rule must not fire when there is no name to carry — the plainest
    // full-bleed quote is still the right answer for an unattributed line.
    const top = shortlistFor(middle([BARE]), { limit: 6, deckLength: 8 });
    assert.ok(top.some((c) => c.role === "quote" && !carries(c.name)),
      "a layout without an attribution slot must still be offered");
  });
});
