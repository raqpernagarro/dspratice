// Template: case-study/split-06 — one concept explained: an eyebrow, the concept
// name and a paragraph in a column with its own top bar, beside a full-height
// photo. Source Figma frame 110:40253.
import { esc } from "../components.js";
import { csCol, csHead, csImg, csPhoto, csFooter, CS_FOOTER } from "../case-study-blocks.js";

export default {
  name: "case-study/split-06", slide: 250, figmaNode: "110:40253",
  family: "case-study", role: "detail", shape: "split", theme: "light", chrome: false,
  use: "One concept explained: its name and a paragraph, beside a full-height photo.",
  media: ["photo"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "case-study/split-06 — eyebrow + concept name + paragraph, full-height photo right.",
  intent: {
    bestFor: ["explaining one concept, feature or idea in a short paragraph", "a detail slide that follows a list of concepts"],
    holds: "an eyebrow, a name of 1–4 words and a paragraph of up to about 230 characters, beside one tall photo",
    avoid: ["lists of several points", "figures that need a chart", "more than one paragraph"],
    feel: "visual",
    needs: ["a tall photo of the concept"],
  },
  schema: {
    caption: "string", title: "string", body: "string — one paragraph", image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Concept", title: "Concept 1",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    image: csPhoto(2),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "16" },
    footer: CS_FOOTER,
  },
  render(s) {
    const left = csCol(s.meta, `
      <div style="display:flex;flex-direction:column;gap:40px;">
        ${csHead({ caption: s.caption, title: s.title })}
        <p class="v2f-cs-para">${esc(s.body)}</p>
      </div>`, { width: 968 });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal">${left}${csImg(s.image)}</div>
        ${csFooter(s.footer)}
      </div>`;
  },
};
