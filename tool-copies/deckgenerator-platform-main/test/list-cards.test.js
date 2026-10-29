// A short list of five points is laid out as five cards, not beside a photo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreTemplate } from "../product/domain/template-scoring.js";
import { contentSignature } from "../product/domain/content-signature.js";
import { allTemplates } from "../js/templates/index.js";

const byName = (name) => allTemplates.find((t) => t.name === name);

test("five short points score higher as a row of cards than beside a photo", () => {
  const slide = {
    title: "Our top five risks each have a named owner",
    bullets: ["Core migration", "SME credit", "AML finding", "Payments cyber", "Deposit outflow"],
  };
  const sig = contentSignature(slide, { index: 13, total: 20 });
  const cards = scoreTemplate(byName("core/cards-row-5"), sig).score;
  const photo = scoreTemplate(byName("portfolio/grid-06"), sig).score;
  assert.ok(cards > photo, `cards ${cards} should beat the photo layout ${photo}`);
});
