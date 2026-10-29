// Template: main/cover-02 — dramatic cover: an oversized title top-left and a
// subtitle anchored to the bottom-right. Source Figma frame 342:37107.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

export default {
  name: "main/cover-02", slide: -87, figmaNode: "342:37107",
  family: "main", role: "cover", shape: "single", theme: "light", chrome: false,
  use: "A bold cover: an oversized presentation title at top-left with the subtitle set in the bottom-right corner.",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, subtitles: 1, body: 0, stats: 0, icons: 0 },
  description: "main/cover-02 — 140px title top-left, 90px subtitle bottom-right.",
  schema: {
    title: "string — 140px title", subtitle: "string — 90px subtitle, bottom-right",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Presentation title", subtitle: "Subtitle here",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    return `
      <div class="v2f-root v2f-mn-cov2">
        ${topBar(s.meta)}
        <div class="v2f-mn-cov2-body reveal">
          ${s.title ? `<p class="v2f-mn-cov2-title">${esc(s.title)}</p>` : ""}
          ${s.subtitle ? `<p class="v2f-mn-cov2-sub">${esc(s.subtitle)}</p>` : ""}
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
