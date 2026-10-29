// Template: marketing/grid-01 — table of contents as a 3×3 grid of tinted tiles, each with a title and a page range.
// Source Figma frame 110:30462.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkTocTile, mkTocRow, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-01", slide: 309, figmaNode: "110:30462",
  family: "marketing", role: "toc", shape: "grid", theme: "light", chrome: false,
  use: "Table of contents as a grid of up to nine tiles",
  media: [], capacity: { items: 9, min: 4, max: 9 },
  slots: { images: 0, titles: 10, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "marketing/grid-01 — table of contents as a 3×3 grid of tinted tiles, each with a title and a page range.",
  intent: {
    bestFor: ["the contents page of a deck with six to nine sections"],
    holds: "a heading and six to nine sections with a label of up to about 20 characters and a page range",
    itemChars: 20,
    avoid: ["fewer than four sections", "long section titles"],
    feel: "dense",
    needs: [],
  },
  schema: {
    title: "string — the page heading", items: "array of {label, pages} — up to 9",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Table of Contents",
    items: Array.from({ length: 9 }, () => ({ label: "Lorem ipsum", pages: "1 – 8" })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "02" },
    footer: MK_FOOTER,
  },
  render(s) {
    const items = (s.items || []).slice(0, 9);
    const rows = [0, 1, 2].map((r) => items.slice(r * 3, r * 3 + 3)).filter((r) => r.length);
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-mk-pg reveal"><p class="v2f-cs-h4 v2f-cs-muted">${esc(s.title ?? "Table of Contents")}</p></div>
        <div class="v2f-mk-tocgrid reveal">
          ${rows.map((r) => `<div class="row">${r.map(mkTocTile).join("")}${Array.from({ length: 3 - r.length }, () => '<div class="v2f-mk-tocitem ghost"></div>').join("")}</div>`).join("")}
        </div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
