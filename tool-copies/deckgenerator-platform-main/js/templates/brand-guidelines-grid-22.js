// Template: brand-guidelines/grid-22 — a caption and title over a tinted panel listing up to four values, each a large name with a sentence beside it.
// Source Figma frame 109:15333.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/grid-22", slide: 422, figmaNode: "109:15333",
  family: "brand-guidelines", role: "cards", shape: "list", theme: "light", chrome: false,
  use: "Our values, name and line",
  media: [], capacity: { items: 4, min: 2, max: 5 },
  slots: { images: 0, titles: 5, subtitles: 0, body: 4, stats: 0, icons: 0 },
  description: "brand-guidelines/grid-22 — a caption and title over a tinted panel listing up to four values, each a large name with a sentence beside it.",
  intent: {
    bestFor: ["brand values or principles"],
    holds: "a caption, a title and two to five values, each a name of up to about 16 characters and a line of up to about 110 characters",
    itemChars: 110,
    avoid: ["long names"],
    feel: "statement",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", values: "array of up to 5 {name, text}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Our values", values: Array.from({ length: 4 }, () => ({ name: "Lorem ipsum", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore." })), caption: "Tone of voice",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "46" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="reveal">${brHead({ caption: s.caption, title: s.title }, { big: true })}</div>
        <div class="v2f-br-values reveal">${(s.values || []).slice(0, 5).map((v) => `<div><p class="n">${esc(v.name ?? "")}</p><p class="t">${esc(v.text ?? "")}</p></div>`).join("")}</div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
