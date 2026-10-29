// Template: main/index-01 — "Index": a heading on the left and a right column of
// numbered agenda rows separated by hairlines. Source Figma frame 342:37111.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const row = (it = {}, i) => `
  <div class="v2f-mn-idx1-row">
    <span class="num">${esc(it.number ?? String(i + 1).padStart(2, "0"))}</span>
    <span class="lbl">${esc(it.label ?? "")}</span>
  </div>`;

export default {
  name: "main/index-01", slide: -86, figmaNode: "342:37111",
  family: "main", role: "toc", shape: "split", theme: "light", chrome: false,
  use: "An agenda / index: a heading on the left and a numbered list of up to nine sections on the right.",
  media: [], capacity: { items: 9, min: 4, max: 9 },
  slots: { images: 0, titles: 1, body: 0, list: 9, stats: 0, icons: 0 },
  description: "main/index-01 — heading + a right column of numbered agenda rows.",
  schema: {
    title: "string — heading (e.g. Index)",
    items: "array of up to 9 { number, label }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Index",
    items: [
      { number: "01", label: "Introduction" }, { number: "02", label: "Our Understanding" },
      { number: "03", label: "A Glimpse of the Future" }, { number: "04", label: "Our Solution Approach" },
      { number: "05", label: "Project Delivery Approach" }, { number: "06", label: "Application Maintenance & Support" },
      { number: "07", label: "Timeline & Commercials" }, { number: "08", label: "Case Studies" },
      { number: "09", label: "Appendix" },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const items = (s.items || []).slice(0, 9).map(row).join("");
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-idx1 reveal">
          <div class="v2f-mn-idx1-left"><p class="v2f-mn-h">${esc(s.title ?? "Index")}</p></div>
          <div class="v2f-mn-idx1-list">${items}</div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
