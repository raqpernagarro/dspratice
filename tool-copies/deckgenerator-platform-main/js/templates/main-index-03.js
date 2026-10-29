// Template: main/index-03 — "Index": a heading on the left and a right 2-column grid
// of numbered items, each with a title and short subtext. Source frame 342:37177.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const item = (it = {}, i) => `
  <div class="v2f-mn-idx3-item">
    <span class="num">${esc(it.number ?? String(i + 1).padStart(2, "0"))}</span>
    <div class="v2f-mn-idx3-tx">
      <p class="ttl">${esc(it.title ?? "")}</p>
      ${it.sub ? `<p class="sub">${esc(it.sub)}</p>` : ""}
    </div>
  </div>`;

export default {
  name: "main/index-03", slide: -84, figmaNode: "342:37177",
  family: "main", role: "toc", shape: "grid", theme: "light", chrome: false,
  use: "An index laid out as a two-column grid of numbered sections, each with a title and a one-line description.",
  media: [], capacity: { items: 10, min: 4, max: 10 },
  slots: { images: 0, titles: 1, body: 0, list: 10, stats: 0, icons: 0 },
  description: "main/index-03 — heading + right 2×5 grid of numbered items with subtext.",
  schema: {
    title: "string — heading (e.g. Index)",
    items: "array of up to 10 { number, title, sub }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Index",
    items: Array(10).fill(0).map(() => ({ number: "01", title: "Introduction", sub: "If there is smaller text that would go here" })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const items = (s.items || []).slice(0, 10).map(item).join("");
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-idx3 reveal">
          <div class="v2f-mn-idx3-left"><p class="v2f-mn-h">${esc(s.title ?? "Index")}</p></div>
          <div class="v2f-mn-idx3-grid">${items}</div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
