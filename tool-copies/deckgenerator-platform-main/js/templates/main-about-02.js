// Template: main/about-02 — a heading with two grey text columns across the top and
// a full-width photo filling the space below. Source Figma frame 342:37455.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";
import { plScene } from "../planning-blocks.js";

export default {
  name: "main/about-02", slide: -59, figmaNode: "342:37455",
  family: "main", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A heading with two grey text columns across the top and a full-width photo below.",
  media: ["photo"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, body: 2, stats: 0, icons: 0 },
  description: "main/about-02 — heading + two text cols on top, full-width photo below.",
  schema: {
    title: "string — heading", body: "array of two paragraph strings", image: "photo URL",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Nagarro is a global leader in technology and human centered digital solutions.",
    body: [
      "Our clients need to become digital-first companies that compete through superior software platforms.",
      "Nagarro helps them transform, adapt, and build new ways into the future through an entrepreneurial, agile, and caring mindset.",
    ],
    image: plScene(4),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const cols = (s.body || []).map((p) => `<div class="v2f-mn-prose"><p>${esc(p)}</p></div>`).join("");
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-about2 reveal">
          <div class="v2f-mn-about2-top">
            <div class="v2f-mn-about2-head"><p class="v2f-mn-h">${esc(s.title ?? "")}</p></div>
            <div class="v2f-mn-about2-cols">${cols}</div>
          </div>
          <div class="v2f-mn-about2-photo">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}</div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
