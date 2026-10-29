// Template: main/text-06 — a proof-point statement over a full-bleed product collage
// (device mockup + scattered screenshots) with a left scrim. Source Figma frame 442:29686.
import { esc } from "../components.js";
import { topBar } from "../frame.js";

export default {
  name: "main/text-06", slide: -37, figmaNode: "442:29686",
  family: "main", role: "statement", shape: "single", theme: "light", chrome: false,
  use: "A results/proof-point statement over a full-bleed product-collage image (device mockup + screenshots).",
  media: ["photo"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "main/text-06 — white statement over a product-collage image with a left scrim.",
  // Part of Nagarro's own company-introduction sequence (main/text-02…06), from
  // the previous slide library: used as-is, in order, with its own photos and
  // words. Generated content goes on main/photo-statement instead.
  intent: {
    bestFor: ["Nagarro's own company introduction, used as-is and in order (main/text-02 to text-06)"],
    holds: "the sequence's own fixed photos and words",
    avoid: ["any client, project or generated content — use main/photo-statement"],
    feel: "visual",
    needs: [],
  },
  schema: {
    title: "string — the statement", image: "collage image URL",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "We delight users, at scale:\nWe took this consumer app from 2.5 stars to 4.5, 4M+ customers served",
    image: "assets/case-study/app-collage.jpg",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    return `
      <div class="v2f-root">
        <div class="v2f-mn-tp6-bg">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}<span class="scrim"></span></div>
        ${topBar(s.meta)}
        <div class="v2f-mn-tp reveal"><p class="stmt" style="white-space:pre-line;">${esc(s.title ?? "")}</p></div>
      </div>`;
  },
};
