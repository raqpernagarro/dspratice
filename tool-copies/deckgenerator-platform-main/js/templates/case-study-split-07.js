// Template: case-study/split-07 — details of the concept: a headline over two
// photos side by side. Source Figma frame 110:40266.
import { topBar } from "../frame.js";
import { csHead, csImg, csPhoto, csFooter, CS_FOOTER } from "../case-study-blocks.js";

export default {
  name: "case-study/split-07", slide: 252, figmaNode: "110:40266",
  family: "case-study", role: "gallery", shape: "duo", theme: "light", chrome: false,
  use: "A headline over two photos side by side.",
  media: ["photo"], capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 2, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "case-study/split-07 — eyebrow + headline over two photos.",
  intent: {
    bestFor: ["a before-and-after, or two versions compared visually", "two details of the work shown at a larger size"],
    holds: "an eyebrow, a headline of up to about 80 characters, and exactly two photos",
    avoid: ["text points or lists", "more than two images", "data or figures"],
    feel: "visual",
    needs: ["two photos that belong together"],
  },
  schema: {
    caption: "string", title: "string", images: "array of 2 photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Zoom in on the concept and highlight some specific details.",
    images: [csPhoto(6), csPhoto(7)],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "18" },
    footer: CS_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${csHead({ caption: s.caption, title: s.title }, { maxWidth: 1200 })}
        <div class="v2f-cs-imgrow reveal">${(s.images || []).slice(0, 2).map((src) => csImg(src)).join("")}</div>
        ${csFooter(s.footer)}
      </div>`;
  },
};
