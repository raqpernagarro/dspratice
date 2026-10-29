// Page numbers on index slides are set from the deck's final order.
import { test } from "node:test";
import assert from "node:assert/strict";
import { labelMatches, resolvePageIndexes } from "../product/domain/slide-index.js";

const pageKeyFor = (name) => (name === "portfolio/index" ? "page"
  : name === "main/index-02" ? { key: "range", span: true }
  : name === "portfolio/index-02" ? { key: "page", span: true } : null);

test("a label matches a heading that contains its meaningful words", () => {
  assert.ok(labelMatches("Core migration", { title: "Core migration is on track" }));
  assert.ok(labelMatches("Attrition", { title: "Attrition at 17%" }));
  assert.ok(!labelMatches("Attrition", { title: "Customers and revenue" }));
  assert.ok(!labelMatches("", { title: "anything" }));
});

test("each entry takes the page of the first later slide that matches it", () => {
  const slides = [
    { templateReference: { templateName: "portfolio/index" }, content: {
      items: [{ label: "Contractors", page: "9" }, { label: "Core migration", page: "9" }] } },
    { templateReference: { templateName: "core/divider-single" }, content: { title: "Section" } },
    { templateReference: { templateName: "finance/bars-compare" }, content: { title: "Core migration is on track" } },
    { templateReference: { templateName: "main/text-01" }, content: { title: "Contractors cost more" } },
  ];
  const out = resolvePageIndexes(slides, { pageKeyFor });
  assert.deepEqual(out[0].content.items, [
    { label: "Contractors", page: "04" },
    { label: "Core migration", page: "03" },
  ]);
});

test("an entry with no matching slide gets a blank page, not a guessed one", () => {
  const slides = [
    { templateReference: { templateName: "portfolio/index" }, content: { items: [{ label: "Regulation", page: "7" }] } },
    { templateReference: { templateName: "main/text-01" }, content: { title: "Revenue beat plan" } },
  ];
  assert.equal(resolvePageIndexes(slides, { pageKeyFor })[0].content.items[0].page, "");
});

test("a slide that is not a page index is returned untouched", () => {
  const slide = { templateReference: { templateName: "main/text-01" }, content: { title: "Hi", items: [{ label: "x", page: "1" }] } };
  assert.equal(resolvePageIndexes([slide], { pageKeyFor })[0], slide);
});

test("an index-02 layout keeps its page in the range field (one slide: no span)", () => {
  const slides = [
    { templateReference: { templateName: "main/index-02" }, content: { items: [{ label: "Regulation", range: "09" }] } },
    { templateReference: { templateName: "main/text-01" }, content: { title: "Regulation is on track" } },
  ];
  assert.deepEqual(resolvePageIndexes(slides, { pageKeyFor })[0].content.items, [{ label: "Regulation", range: "02" }]);
});

test("a range layout spans each entry up to the next one, and the last up to the closing", () => {
  const slides = [
    { templateReference: { templateName: "portfolio/index-02" }, content: {
      items: [{ label: "About me", page: "" }, { label: "Project Atlas", page: "" }, { label: "Contact", page: "" }] } },
    { templateReference: { templateName: "main/text-01" }, content: { title: "About me" } },
    { templateReference: { templateName: "main/text-01" }, content: { title: "Ten years of design" } },
    { templateReference: { templateName: "main/text-01" }, content: { title: "Project Atlas" } },
    { templateReference: { templateName: "main/text-01" }, content: { title: "Atlas results" } },
    { templateReference: { templateName: "main/text-01" }, content: { title: "Atlas team" } },
    { templateReference: { templateName: "main/text-01" }, content: { title: "Contact" } },
    { templateReference: { templateName: "portfolio/closing" }, content: { word: "Thank you!" } },
  ];
  const isClosing = (name) => name === "portfolio/closing";
  assert.deepEqual(resolvePageIndexes(slides, { pageKeyFor, isClosing })[0].content.items, [
    { label: "About me", page: "02 – 03" },
    { label: "Project Atlas", page: "04 – 06" },
    { label: "Contact", page: "07" },
  ]);
});

test("a first-page layout never shows a span", () => {
  const slides = [
    { templateReference: { templateName: "portfolio/index" }, content: { items: [{ label: "Atlas", page: "" }] } },
    { templateReference: { templateName: "main/text-01" }, content: { title: "Atlas" } },
    { templateReference: { templateName: "main/text-01" }, content: { title: "More" } },
  ];
  assert.equal(resolvePageIndexes(slides, { pageKeyFor })[0].content.items[0].page, "02");
});
