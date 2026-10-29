// Template: core/toc-grid-6 — left heading + right 2×3 grid of six numbered
// sections, each with sub-items. Source Figma frame 109:4928.
import { esc } from "../components.js";
import { topBar } from "../frame.js";

const group = (g = {}, i) => `
  <div class="v2f-tocg-group">
    <div class="v2f-tocg-head">
      <span class="num">${esc(g.number ?? String(i + 1).padStart(2, "0"))}</span>
      <span class="ttl">${esc(g.title ?? "")}</span>
    </div>
    <div class="v2f-tocg-items">
      ${(g.items || []).map((it) => `<p>${esc(it)}</p>`).join("")}
    </div>
  </div>`;

export default {
  name: "core/toc-grid-6",
  slide: 5,
  figmaNode: "109:4928",
  family: "core",
  role: "toc",
  shape: "grid",
  count: 6,
  theme: "light",
  chrome: false,
  use: "A detailed table of contents: a heading on the left and a 2×3 grid of up to six numbered sections, each with sub-items.",
  media: [],
  capacity: { items: 6, min: 4, max: 6 },
  slots: { images: 0, titles: 1, body: 0, list: 6, stats: 0, icons: 0 },
  description: "core/toc-grid-6 — left heading, right 2×3 grid of numbered sections with sub-items.",
  schema: {
    subtitle: "string — small label above the heading",
    title: "string — heading (e.g. Table of contents)",
    sections: "array of up to 6 { number, title, items: string[] }",
    meta: "{ studio, name, page }",
  },
  example: {
    subtitle: "Subtitle", title: "Table of contents",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "83" },
    sections: Array.from({ length: 6 }, (_, i) => ({
      number: String(i + 1).padStart(2, "0"), title: "Content",
      items: ["Lorem ipsum", "Lorem ipsum", "Lorem ipsum", "Lorem ipsum", "Lorem ipsum"],
    })),
  },
  render(s) {
    const groups = (s.sections || []).slice(0, 6).map(group).join("");
    return `
      <div class="v2f-root v2f-tocg-root">
        <div class="v2f-tocg reveal">
          <div class="v2f-tocg-left">
            ${topBar(s.meta, { logoOnly: true })}
            <div>
              ${s.subtitle ? `<p class="v2f-tocg-sub2">${esc(s.subtitle)}</p>` : ""}
              ${s.title ? `<p class="v2f-tocg-title2">${esc(s.title)}</p>` : ""}
            </div>
          </div>
          <div class="v2f-tocg-contents">${groups}</div>
        </div>
      </div>`;
  },
};
