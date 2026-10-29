// Template: brand-guidelines/text-07 — a caption and title at the top left, the typeface name and a note right-aligned at the top right, and the typeface name set enormous across the bottom of the slide.
// Source Figma frame 109:14913.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/text-07", slide: 408, figmaNode: "109:14913",
  family: "brand-guidelines", role: "statement", shape: "single", theme: "light", chrome: false,
  use: "Primary typeface shown at display size",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 2, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "brand-guidelines/text-07 — a caption and title at the top left, the typeface name and a note right-aligned at the top right, and the typeface name set enormous across the bottom of the slide.",
  intent: {
    bestFor: ["presenting the primary typeface"],
    holds: "a caption, a title, the typeface name, a note of up to about 240 characters and the display text (two short lines)",
    itemChars: 240,
    avoid: ["long display text"],
    feel: "statement",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", face: "string — the typeface name", text: "string — the note", display: "string — the large text; a line break splits it",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Primary typeface", face: "Equip Regular", text: BR_LOREM, display: "Equip\nRegular", caption: "Typography",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "32" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-br-tf reveal">${brHead({ caption: s.caption, title: s.title }, { big: true })}<div class="r"><p>${esc(s.face ?? "")}</p><p class="m">${esc(s.text ?? "")}</p></div></div>
        <div class="v2f-br-disp reveal"><p>${esc(s.display ?? "")}</p></div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
