// Template: brand-guidelines/grid-09 — a caption, title, subtitle and paragraph in a narrow left column; at the right up to ten colour tiles in two columns, each with name, RGB and HEX.
// Source Figma frame 109:14822.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/grid-09", slide: 402, figmaNode: "109:14822",
  family: "brand-guidelines", role: "chart", shape: "split", theme: "light", chrome: false,
  use: "Full palette as a two-column grid of tiles",
  media: [], capacity: { items: 10, min: 4, max: 10 },
  slots: { images: 0, titles: 11, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "brand-guidelines/grid-09 — a caption, title, subtitle and paragraph in a narrow left column; at the right up to ten colour tiles in two columns, each with name, RGB and HEX.",
  intent: {
    bestFor: ["the complete palette on one page"],
    holds: "a caption, a title, a subtitle, a paragraph and four to ten colours with name, RGB and HEX",
    itemChars: 250,
    avoid: ["more than ten colours"],
    feel: "visual",
    needs: [],
  },
  schema: {
    caption: "string — small eyebrow", title: "string", subtitle: "string — muted second line", body: "string — paragraph at the foot of the column", colors: "array of 4–10 {name, rgb, hex, color?, ink?}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Palette", subtitle: "Full", body: BR_LOREM,
    colors: [...BR_SECONDARY, { name: "Black", rgb: "R26 G26 B28", hex: "#1A1A1C", color: "#010716" }, { name: "White", rgb: "R255 G255 B255", hex: "#FFFFFF" }, { name: "Grey", rgb: "R142 G144 B148", hex: "#8E9094" }, { name: "Light Grey", rgb: "R204 G205 B209", hex: "#CCCDD1", ink: "light" }], caption: "Colours",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "26" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${brSplit(brCol(s.meta, { caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body }), brPanel(`<div class="v2f-br-swgrid">${(s.colors || []).slice(0, 10).map((c) => brSwatch(c, { cls: "dim" })).join("")}</div>`, { cls: "gridpad" }))}
        ${brFooter(s.footer)}
      </div>`;
  },
};
