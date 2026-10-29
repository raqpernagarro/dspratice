// Template: main/quote-06 — a statement quote on the left with a full-height photo on
// the right. Source Figma frame 342:37410.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";
import { plScene } from "../planning-blocks.js";

export default {
  name: "main/quote-06", slide: -62, figmaNode: "342:37410",
  family: "main", role: "quote", shape: "split", theme: "light", chrome: false,
  use: "A statement quote alongside a full-height photo on the right.",
  media: ["photo"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "main/quote-06 — quote left + full-height photo right.",
  schema: {
    quote: "string — the quote (include the quotation marks)", name: "string — attribution",
    image: "photo URL",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    quote: "“Full page quote or sentence. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit amet, consectetur adipiscing elit.”",
    name: "Name goes here", image: plScene(3),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-q56 v2f-mn-q6 reveal">
          <div class="v2f-mn-q56-text">
            <p class="v2f-mn-quote">${esc(s.quote ?? "")}</p>
            ${s.name ? `<p class="v2f-mn-qattr">— ${esc(s.name)}</p>` : ""}
          </div>
          <div class="v2f-mn-q56-photo">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}</div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
