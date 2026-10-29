// Template: main/index-02 — "Index": a heading with a set of bottom-anchored rows,
// each a section label and a page-range. Source Figma frame 342:37152.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const row = (it = {}) => `
  <div class="v2f-mn-idx2-row">
    <span class="lbl">${esc(it.label ?? "")}</span>
    <span class="rng">${esc(it.range ?? "")}</span>
  </div>`;

export default {
  name: "main/index-02", slide: -85, figmaNode: "342:37152",
  family: "main", role: "toc", shape: "single", theme: "light", chrome: false,
  use: "An index that lists a few major sections with their page-ranges, anchored to the bottom of the slide.",
  media: [], capacity: { items: 6, min: 3, max: 6 },
  slots: { images: 0, titles: 1, body: 0, list: 6, stats: 0, icons: 0 },
  description: "main/index-02 — heading + bottom-anchored section rows with page-ranges.",
  schema: {
    title: "string — heading (e.g. Index)",
    items: "array of { label, range } (e.g. range '05 – 12')",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Index",
    items: [
      { label: "Workshop Summary", range: "05 – 12" },
      { label: "Product Scope & Approach", range: "17 – 26" },
      { label: "Product Vision", range: "27 – 35" },
      { label: "Project Plan & Phases", range: "36 – 46" },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const items = (s.items || []).slice(0, 6).map(row).join("");
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-idx2 reveal">
          <p class="v2f-mn-h">${esc(s.title ?? "Index")}</p>
          <div class="v2f-mn-idx2-list">${items}</div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
