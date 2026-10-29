// Template: brand-guidelines/grid-03 — a caption, title and paragraph over a row of four to six tall colour tiles, each with name, RGB and HEX.
// Source Figma frame 109:14745.
// Also covers brand-guidelines/grid-04 and grid-05 (five and six colours) (same layout, another state).
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/grid-03", slide: 400, figmaNode: "109:14745",
  family: "brand-guidelines", role: "chart", shape: "row", theme: "light", chrome: false,
  use: "Secondary palette as a row of colour tiles",
  media: [], capacity: { items: 4, min: 3, max: 6 },
  slots: { images: 0, titles: 7, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "brand-guidelines/grid-03 — a caption, title and paragraph over a row of four to six tall colour tiles, each with name, RGB and HEX.",
  intent: {
    bestFor: ["a secondary or accent palette"],
    holds: "a caption, a title, a paragraph of up to about 240 characters and three to six colours with name, RGB and HEX",
    itemChars: 240,
    avoid: ["more than six colours"],
    feel: "visual",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", body: "string", colors: "array of 3–6 {name, rgb, hex, color?, ink?}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Secondary Palette", body: BR_LOREM, colors: BR_SECONDARY.slice(0, 4), caption: "Colours",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "24" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="reveal">${brHead({ caption: s.caption, title: s.title, body: s.body }, { big: true, gap12: true })}</div>
        <div class="v2f-br-row reveal">${(s.colors || []).slice(0, 6).map((c) => brSwatch(c, { cls: "grow" })).join("")}</div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
