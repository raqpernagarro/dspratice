// Template: main/cover-01 — deck cover: big title + grey subtitle, top-left.
// Source Figma frame 342:37102. Uses the shared v2 frame (js/frame.js + .v2f-* CSS).
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

export default {
  name: "main/cover-01", slide: -88, figmaNode: "342:37102",
  family: "main", role: "cover", shape: "single", theme: "light", chrome: false,
  use: "The opening cover of a deck: a large presentation title with a subtitle beneath it.",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, subtitles: 1, body: 0, stats: 0, icons: 0 },
  description: "main/cover-01 — cover with a 100px title and a 60px subtitle, top-left.",
  schema: {
    title: "string — 100px presentation title", subtitle: "string — 60px subtitle",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Presentation title", subtitle: "Subtitle here",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    return `
      <div class="v2f-root v2f-cover">
        <div class="v2f-cover-row reveal">
          ${topBar(s.meta)}
          <div class="v2f-cover-head">
            ${s.title ? `<p class="v2f-cover-title">${esc(s.title)}</p>` : ""}
            ${s.subtitle ? `<p class="v2f-cover-sub">${esc(s.subtitle)}</p>` : ""}
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
