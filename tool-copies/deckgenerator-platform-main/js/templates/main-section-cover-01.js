// Template: main/section-cover-01 — a section divider: a large section number and
// title marking a new part of the deck. Source Figma frame 342:37268.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

export default {
  name: "main/section-cover-01", slide: -82, figmaNode: "342:37268",
  family: "main", role: "divider", shape: "single", theme: "light", chrome: false,
  use: "A chapter / section divider: a large section number and title marking a new part of the deck.",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "main/section-cover-01 — big section number + title, full slide.",
  schema: {
    number: "string — section number (e.g. 01)", title: "string — section title",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    number: "01", title: "Title",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cover-row reveal">
          ${topBar(s.meta)}
          <div class="v2f-biglist">
            <div class="v2f-bigrow">
              ${s.number ? `<span class="num">${esc(s.number)}</span>` : ""}
              <span class="lbl">${esc(s.title ?? "")}</span>
            </div>
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
