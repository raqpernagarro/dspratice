// Template: portfolio/grid-21 — a "Recognition" heading above two columns of
// award names, each followed by count numbers in brand accent colours. Source
// Figma frame 109:10725.
import { esc } from "../components.js";
import { frame } from "../frame.js";

// Count numbers may carry a brand accent (caring-values palette); default muted.
const COLORS = {
  mint: "var(--mint-green)", coral: "var(--value-non-hierarchical)",
  // -ink, not the fill token: peach is 2.28:1 on white as text.
  peach: "var(--value-agile-ink,#e0631f)", teal: "var(--value-caring)",
  muted: "var(--fg-25,rgba(1,7,22,.25))",
};
const award = (a = {}) => `
  <div class="v2f-pf-award">
    <span>${esc(a.name ?? "")}</span>
    <span class="nums">${(a.nums || []).map((n) => `<span style="color:${COLORS[n.c] || COLORS.muted}">${esc(n.v ?? n)}</span>`).join("")}</span>
  </div>`;

export default {
  name: "portfolio/grid-21",
  slide: 112,
  figmaNode: "109:10725",
  family: "portfolio", role: "awards", shape: "cols", theme: "light", chrome: false,
  use: "A heading above two columns of award names with count numbers in brand accent colours.",
  media: [],
  capacity: { items: 12, min: 2, max: 14 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 0, stats: 12, icons: 0 },
  description: "portfolio/grid-21 — Recognition heading + two award columns with count numbers.",
  schema: {
    title: "string",
    colA: "array of { name, nums:[{v, c}] }  (c: mint|coral|peach|teal|muted)",
    colB: "array of { name, nums:[{v, c}] }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Recognition",
    colA: [
      { name: "Cannes Lions", nums: [{ v: "2", c: "muted" }] },
      { name: "D&AD", nums: [{ v: "1", c: "peach" }, { v: "4", c: "muted" }] },
      { name: "The One Show", nums: [{ v: "1", c: "peach" }, { v: "3", c: "muted" }] },
      { name: "ADC", nums: [{ v: "4", c: "muted" }, { v: "1", c: "muted" }] },
      { name: "Clio Awards", nums: [{ v: "1", c: "peach" }, { v: "1", c: "muted" }, { v: "4", c: "peach" }] },
    ],
    colB: [
      { name: "Red Dot", nums: [{ v: "2", c: "coral" }] },
      { name: "Webby", nums: [{ v: "3", c: "muted" }] },
      { name: "AIGA", nums: [{ v: "1", c: "muted" }] },
      { name: "FWA", nums: [{ v: "3", c: "muted" }] },
      { name: "Eurobest", nums: [{ v: "2", c: "coral" }, { v: "2", c: "muted" }, { v: "2", c: "peach" }] },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "207" },
  },
  render(s) {
    const col = (list = []) => `<div class="v2f-pf-awardcol">${list.map(award).join("")}</div>`;
    const middle = `
      <p class="v2f-pf-sechead">${esc(s.title ?? "Recognition")}</p>
      <div class="v2f-pf-awards reveal">${col(s.colA || [])}${col(s.colB || [])}</div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
