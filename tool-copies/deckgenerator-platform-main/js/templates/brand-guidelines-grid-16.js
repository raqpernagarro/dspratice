// Template: brand-guidelines/grid-16 — a caption, title and paragraph in a narrow left column; at the right a tinted panel with a line set very large, part of it muted and part in full colour, to show how emphasis works.
// Source Figma frame 109:14973.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/grid-16", slide: 411, figmaNode: "109:14973",
  family: "brand-guidelines", role: "statement", shape: "split", theme: "light", chrome: false,
  use: "Highlighting: emphasis inside a headline",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 2, subtitles: 0, body: 2, stats: 0, icons: 0 },
  description: "brand-guidelines/grid-16 — a caption, title and paragraph in a narrow left column; at the right a tinted panel with a line set very large, part of it muted and part in full colour, to show how emphasis works.",
  intent: {
    bestFor: ["how to highlight words within a headline"],
    holds: "a caption, a title, a paragraph, a label and a sentence of up to about 50 characters with *emphasis* marked",
    itemChars: 50,
    avoid: ["long sentences"],
    feel: "statement",
    needs: [],
  },
  schema: {
    caption: "string — small eyebrow", title: "string", subtitle: "string — muted second line", body: "string — paragraph at the foot of the column", label: "string", text: "string — wrap the emphasised words in *asterisks*",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Typography", body: BR_LOREM, label: "Highlighting", text: "Etiam egestas lobortis *libero et vulputate.*",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "35" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${brSplit(brCol(s.meta, { caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body }), brPanel(`<p class="v2f-br-h36">${esc(s.label ?? "")}</p><div class="v2f-br-hlw"><p class="v2f-br-hl">${brRich(s.text ?? "")}</p></div>`, { cls: "pad col" }))}
        ${brFooter(s.footer)}
      </div>`;
  },
};
