// Template: main/quote-01 — a full-bleed statement quote, left-aligned across the
// slide, with an attribution below. Source Figma frame 342:37369.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

export default {
  name: "main/quote-01", slide: -67, figmaNode: "342:37369",
  family: "main", role: "quote", shape: "single", theme: "light", chrome: false,
  use: "A full-page statement or pull-quote, left-aligned, with an attribution.",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "main/quote-01 — big left-aligned quote + attribution.",
  schema: {
    quote: "string — the quote (include the quotation marks)", name: "string — attribution",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    quote: "“Full page quote or sentence. Lorem ipsum dolor sit amet, consectetur adipiscing elit.”",
    name: "Name goes here",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-q v2f-mn-q1 reveal">
          <p class="v2f-mn-quote">${esc(s.quote ?? "")}</p>
          ${s.name ? `<p class="v2f-mn-qattr">— ${esc(s.name)}</p>` : ""}
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
