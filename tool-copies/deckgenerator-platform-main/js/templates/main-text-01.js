// Template: main/text-01 — a large statement title with a section number beneath,
// vertically centred on the slide. Source Figma frame 342:37272.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

export default {
  name: "main/text-01", slide: -81, figmaNode: "342:37272",
  family: "main", role: "statement", shape: "single", theme: "light", chrome: false,
  use: "A large statement title with a section number below it, centred on the slide.",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "main/text-01 — 100px title + 60px section number, vertically centred.",
  schema: {
    title: "string — 100px title", number: "string — 60px section number",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Title", number: "01",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-text1 reveal">
          ${s.title ? `<p class="ttl">${esc(s.title)}</p>` : ""}
          ${s.number ? `<p class="num">${esc(s.number)}</p>` : ""}
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
