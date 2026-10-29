// Template: brand-guidelines/grid-10 — a caption, title and paragraph over four large circles, each showing “AA” in a text colour on a background colour.
// Source Figma frame 109:14838.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/grid-10", slide: 403, figmaNode: "109:14838",
  family: "brand-guidelines", role: "chart", shape: "row", theme: "light", chrome: false,
  use: "Approved colour pairings",
  media: [], capacity: { items: 4, min: 2, max: 4 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "brand-guidelines/grid-10 — a caption, title and paragraph over four large circles, each showing “AA” in a text colour on a background colour.",
  intent: {
    bestFor: ["which text and background colours may be combined"],
    holds: "a caption, a title, a paragraph and two to four pairings (background, text colour)",
    itemChars: 240,
    avoid: ["more than four pairings"],
    feel: "visual",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", body: "string", pairs: "array of up to 4 {bg, fg, text?, edge?} — edge draws a hairline for white backgrounds",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Pairings", body: BR_LOREM,
    pairs: [{ bg: "#010716", fg: "#ffffff" }, { bg: "#80838b", fg: "#ffffff" }, { bg: "#ffffff", fg: "#010716", edge: true }, { bg: "#64b0ef", fg: "#ffffff" }], caption: "Colours",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "27" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="reveal">${brHead({ caption: s.caption, title: s.title, body: s.body }, { big: true, gap12: true })}</div>
        <div class="v2f-br-pairs reveal">${(s.pairs || []).slice(0, 4).map(brPair).join("")}</div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
