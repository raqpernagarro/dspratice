// Template: case-study/grid-08 — details of the concept: a headline over three
// photos side by side. Source Figma frame 110:40259.
import { topBar } from "../frame.js";
import { csHead, csImg, csPhoto, csFooter, CS_FOOTER } from "../case-study-blocks.js";

export default {
  name: "case-study/grid-08", slide: 251, figmaNode: "110:40259",
  family: "case-study", role: "gallery", shape: "row", theme: "light", chrome: false,
  use: "A headline over three photos side by side.",
  media: ["photo"], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 3, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "case-study/grid-08 — eyebrow + headline over three photos.",
  intent: {
    bestFor: ["zooming in on three details of the work", "showing three screens, products or moments together"],
    holds: "an eyebrow, a headline of up to about 80 characters, and exactly three photos",
    avoid: ["text points or lists", "fewer than three images", "data or figures"],
    feel: "visual",
    needs: ["three photos of details of the work"],
  },
  schema: {
    caption: "string", title: "string", images: "array of 3 photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Zoom in on the concept and highlight some specific details.",
    images: [csPhoto(3), csPhoto(4), csPhoto(5)],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "17" },
    footer: CS_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${csHead({ caption: s.caption, title: s.title }, { maxWidth: 1200 })}
        <div class="v2f-cs-imgrow reveal">${(s.images || []).slice(0, 3).map((src) => csImg(src)).join("")}</div>
        ${csFooter(s.footer)}
      </div>`;
  },
};
