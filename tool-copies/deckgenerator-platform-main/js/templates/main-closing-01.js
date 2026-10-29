// Template: main/closing-01 — dark closing slide: a white call-to-action statement on the
// left and the mint 3D Nagarro loop on the right. Source Figma frame 342:40843.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const LOOP = "assets/main/closing-loop.png";

export default {
  name: "main/closing-01", slide: -1, figmaNode: "342:40843",
  family: "main", role: "closing", shape: "single", theme: "dark", chrome: false,
  use: "The dark closing slide — a white call-to-action statement on the left and the mint 3D Nagarro loop on the right.",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "main/closing-01 — dark CTA statement + mint 3D loop.",
  schema: {
    title: "string — closing statement", loop: "string — loop image src",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Imagine what we can do together!", loop: LOOP,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    return `
      <div class="v2f-root v2f-dark">
        ${topBar(s.meta)}
        <div class="v2f-mn-cl1 reveal">
          ${s.title ? `<p class="stmt">${esc(s.title)}</p>` : ""}
          <img class="loop" src="${esc(s.loop || LOOP)}" alt="">
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
