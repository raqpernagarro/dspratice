// Intent cards: what each layout is for, checked by the validator and used by
// the scorer. See js/templates/_CONTRACT.md "intent".
import { test } from "node:test";
import assert from "node:assert/strict";
import { intentErrors, validateModule } from "../tools/validate-templates.mjs";
import { scoreTemplate } from "../product/domain/template-scoring.js";
import { contentSignature } from "../product/domain/content-signature.js";
import { allTemplates } from "../js/templates/index.js";

const byName = (name) => allTemplates.find((t) => t.name === name);

const CARD = {
  bestFor: ["clients shown as logos"],
  holds: "8–24 organisation names",
  itemChars: 30,
  avoid: ["sentences"],
  feel: "visual",
  needs: [],
};

test("a complete card passes, and each missing or wrong field is named", () => {
  assert.deepEqual(intentErrors(CARD), []);
  assert.match(intentErrors({ ...CARD, bestFor: [] }).join(), /bestFor/);
  assert.match(intentErrors({ ...CARD, feel: "busy" }).join(), /feel must be one of/);
  assert.match(intentErrors({ ...CARD, needs: undefined }).join(), /needs/);
  assert.match(intentErrors({ ...CARD, itemChars: 0 }).join(), /itemChars/);
});

test("a case-study template without a card fails validation", () => {
  const mod = { ...byName("core/content-twocol"), name: "case-study/test", family: "case-study", intent: undefined };
  assert.match(validateModule(mod).join(), /intent card is required/);
});

test("risks with owners no longer suit the skills list (the live mis-pick)", () => {
  const slide = {
    title: "Top five risks",
    bullets: [
      "AML remediation slips: CCO adds 30 contract analysts",
      "Mortgage margin compression: CFO reprices fixed-rate book",
      "Cyber incident on payments: CISO completes red-team test",
      "Engineering attrition: CHRO launches retention awards",
      "Branch closure backlash: COO runs community notice plan",
    ],
  };
  const sig = contentSignature(slide, { index: 10, total: 20 });
  const grid06 = scoreTemplate(byName("portfolio/grid-06"), sig);
  assert.ok(grid06.why.some((w) => /longer than the 30 characters/.test(w)), "the length limit must apply");
  assert.ok(scoreTemplate(byName("core/cards-row-5"), sig).score > grid06.score);
});

test("questions no longer suit the logo wall (the live mis-pick)", () => {
  const slide = {
    title: "What the workshop answers",
    bullets: [
      "Vision and journeys: Which jobs matter most, and what does one workspace mean?",
      "Clickable prototype: Can users see and test the top 2-3 critical journeys?",
      "Target architecture: How do AEM, identity, context, data and AI fit without overbuilding?",
      "Platform scorecard: What is proven today, promised later, and risky for year-end?",
      "MVP backlog: What ships first, what waits, and what guardrails protect scale?",
      "KPI baseline: Which numbers will prove adoption, deflection, velocity and trust?",
    ],
  };
  const sig = contentSignature(slide, { index: 13, total: 16 });
  const wall = scoreTemplate(byName("main/logos-03"), sig);
  assert.ok(wall.why.some((w) => /longer than the 30 characters/.test(w)));
});
