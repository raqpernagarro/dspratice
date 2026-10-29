// Template: core/toc-list-5 — full-bleed agenda: up to 5 sections as large
// numbered rows (Heading1 scale). Source Figma frame 109:4900.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const row = (it = {}, i) => `
  <div class="v2f-bigrow">
    <span class="num">${esc(it.number ?? String(i + 1).padStart(2, "0"))}</span>
    <span class="lbl">${esc(it.label ?? "")}</span>
  </div>`;

export default {
  name: "core/toc-list-5",
  slide: 3,
  figmaNode: "109:4900",
  family: "core",
  role: "toc",
  shape: "list",
  count: 5,
  theme: "light",
  chrome: false,
  use: "A bold table of contents / agenda: up to five sections as large numbered rows.",
  media: [],
  capacity: { items: 5, min: 3, max: 5 },
  slots: { images: 0, titles: 0, body: 0, list: 5, stats: 0, icons: 0 },
  description: "core/toc-list-5 — big numbered agenda, up to 5 sections.",
  schema: {
    items: "array of up to 5 { number, label }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    meta: { studio: "Product Studio", name: "Presentation Name", page: "81" },
    items: [
      { number: "01", label: "Section" }, { number: "02", label: "Section" },
      { number: "03", label: "Section" }, { number: "04", label: "Section" },
      { number: "05", label: "Section" },
    ],
  },
  render(s) {
    const rows = (s.items || []).slice(0, 5).map(row).join("");
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cover-row reveal">
          ${topBar(s.meta)}
          <div class="v2f-biglist">${rows}</div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
