// Template: brand-guidelines/data-02 — chapter contents: the chapter title with its number muted at the right, and the chapter's sections with page ranges at the foot of the slide.
// Source Figma frame 109:14514.
// Also covers brand-guidelines/data-03 … data-07 and content-02 (other chapters) (same layout, another state).
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/data-02", slide: 383, figmaNode: "109:14514",
  family: "brand-guidelines", role: "toc", shape: "list", theme: "light", chrome: false,
  use: "Chapter opener listing its sections",
  media: [], capacity: { items: 6, min: 0, max: 8 },
  slots: { images: 0, titles: 9, subtitles: 0, body: 0, stats: 1, icons: 0 },
  description: "brand-guidelines/data-02 — chapter contents: the chapter title with its number muted at the right, and the chapter's sections with page ranges at the foot of the slide.",
  intent: {
    bestFor: ["opening a brand-book chapter (logo, colour, typography, design, photography, tone of voice) with its sections"],
    holds: "a chapter title, its number and up to eight sections with page ranges; leave the list empty for a plain opener",
    itemChars: 30,
    avoid: ["notes per section (use brand-guidelines/index)"],
    feel: "dense",
    needs: [],
  },
  schema: {
    title: "string — the chapter", number: "string — e.g. 02", items: "array of up to 8 {label, pages}; may be empty",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Logo", number: "02",
    items: [{ label: "Logo", pages: "10 – 16" }, { label: "Logo in-situ", pages: "17 – 22" }, { label: "Positioning", pages: "23" }, { label: "Things to avoid", pages: "24" }],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "07" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="reveal">${brChapter(s.title, s.number)}</div>
        <div class="v2f-br-tocs reveal">${(s.items || []).slice(0, 8).map((it) => brTocRow({ label: it.label, pages: it.pages })).join("")}</div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
