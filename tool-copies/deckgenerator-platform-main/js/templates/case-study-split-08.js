// Template: case-study/split-08 — details of the concept: a headline over one
// wide photo. Source Figma frame 110:40272.
import { topBar } from "../frame.js";
import { csHead, csImg, csPhoto, csFooter, CS_FOOTER } from "../case-study-blocks.js";

export default {
  name: "case-study/split-08", slide: 253, figmaNode: "110:40272",
  family: "case-study", role: "gallery", shape: "single", theme: "light", chrome: false,
  use: "A headline over one wide photo.",
  media: ["photo"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "case-study/split-08 — eyebrow + headline over one wide photo.",
  intent: {
    bestFor: ["one wide image that tells the story: a panorama, a full screen, the product in use"],
    holds: "an eyebrow, a headline of up to about 80 characters, and one wide photo",
    avoid: ["text points or lists", "several images", "data or figures"],
    feel: "visual",
    needs: ["one wide photo"],
  },
  schema: {
    caption: "string", title: "string", image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Zoom in on the concept and highlight some specific details.",
    image: csPhoto(8),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "19" },
    footer: CS_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${csHead({ caption: s.caption, title: s.title }, { maxWidth: 1200 })}
        <div class="v2f-cs-imgrow reveal">${csImg(s.image)}</div>
        ${csFooter(s.footer)}
      </div>`;
  },
};
