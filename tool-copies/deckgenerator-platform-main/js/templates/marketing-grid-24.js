// Template: marketing/grid-24 — an eyebrow, title and subtitle over a full-width ruled table: single-cell rows, a tall row of four cells, a row of four, and a row of sixteen narrow marks.
// Source Figma frame 110:31042.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-24", slide: 343, figmaNode: "110:31042",
  family: "marketing", role: "table", shape: "table", theme: "light", chrome: false,
  use: "A ruled framework table with a label column and rows of one, four or sixteen cells",
  media: [], capacity: { items: 6, min: 4, max: 8 },
  slots: { images: 0, titles: 3, subtitles: 1, body: 0, stats: 0, icons: 0 },
  description: "marketing/grid-24 — an eyebrow, title and subtitle over a full-width ruled table: single-cell rows, a tall row of four cells, a row of four, and a row of sixteen narrow marks.",
  intent: {
    bestFor: ["a messaging or content framework as a grid: what is said, where and how"],
    holds: "an eyebrow, a title, a subtitle and four to eight rows, each with a label of up to about 20 characters and either one cell of up to about 60 characters, four cells of up to about 130 characters, or up to sixteen short marks",
    itemChars: 130,
    avoid: ["more than eight rows", "long cell text"],
    feel: "dense",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", subtitle: "string", rows: "array of {label, cells: string[], tall?: boolean} — one cell spans the row; otherwise cells share it equally",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Messaging", title: "Messaging", subtitle: "Framework",
    rows: [
      { label: "Purpose", cells: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit."] },
      { label: "Mission", cells: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit."] },
      { label: "Positioning", cells: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit."] },
      { label: "Content typology", tall: true, cells: ["Brand", "Product", "CSR", "People"].map((c) => c + "\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.") },
      { label: "Objectives", cells: ["Lorem ipsum dolor sit amet.", "Lorem ipsum dolor sit amet.", "Lorem ipsum dolor sit amet.", "Lorem ipsum dolor sit amet."] },
      { label: "Topics", cells: Array(16).fill("x") },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "36" },
    footer: MK_FOOTER,
  },
  render(s) {
    const rows = (s.rows || []).slice(0, 8);
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-mk-h144 reveal"><div class="v2f-mk-ph center"><div class="hd">
          ${s.caption ? `<p class="v2f-cs-cap">${esc(s.caption)}</p>` : ""}<div><p class="v2f-cs-h2">${esc(s.title ?? "")}</p>${s.subtitle ? `<p class="v2f-cs-h5 v2f-cs-muted">${esc(s.subtitle)}</p>` : ""}</div></div></div></div>
        <div class="v2f-mk-fw reveal">${rows.map((r) => `<div class="r${r.tall ? " tall" : ""}"><div class="c f">${esc(r.label ?? "")}</div>${(r.cells || []).map((c) => `<div class="c${(r.cells || []).length > 4 ? " n" : ""}">${esc(c)}</div>`).join("")}</div>`).join("")}</div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
