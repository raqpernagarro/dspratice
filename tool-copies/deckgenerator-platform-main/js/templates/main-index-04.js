// Template: main/index-04 — "Index": a heading over a 2-column grid of numbered
// rows separated by hairlines (fills left-to-right). Source frame 342:37243.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const cell = (it = {}, i) => `
  <div class="v2f-mn-idx4-cell">
    <span class="num">${esc(it.number ?? String(i + 1).padStart(2, "0"))}</span>
    <span class="lbl">${esc(it.label ?? "")}</span>
  </div>`;

export default {
  name: "main/index-04", slide: -83, figmaNode: "342:37243",
  family: "main", role: "toc", shape: "grid", theme: "light", chrome: false,
  use: "An index as a two-column grid of numbered section titles, each row divided by a hairline.",
  media: [], capacity: { items: 8, min: 3, max: 8 },
  slots: { images: 0, titles: 1, body: 0, list: 8, stats: 0, icons: 0 },
  description: "main/index-04 — heading + 2-column grid of numbered rows with hairlines.",
  schema: {
    title: "string — heading (e.g. Index)",
    items: "array of up to 8 { number, label }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Index",
    items: [
      { number: "01", label: "Title" }, { number: "02", label: "Title" },
      { number: "03", label: "Title" }, { number: "04", label: "Title" },
      { number: "05", label: "Title" },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const items = (s.items || []).slice(0, 8).map(cell).join("");
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-idxhead reveal"><p class="v2f-mn-h">${esc(s.title ?? "Index")}</p></div>
        <div class="v2f-mn-idx4 reveal">${items}</div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
