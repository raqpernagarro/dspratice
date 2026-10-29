// Template: case-study/split-09 — the achievements, said in a headline: a large
// question or statement across most of the slide, with one square photo pinned
// to the bottom-right. Source Figma frame 110:40282.
import { topBar } from "../frame.js";
import { csHead, csImg, csPhoto, csFooter, CS_FOOTER } from "../case-study-blocks.js";

export default {
  name: "case-study/split-09", slide: 255, figmaNode: "110:40282",
  family: "case-study", role: "statement", shape: "split", theme: "light", chrome: false,
  use: "A large headline of up to three lines, with one square photo at the bottom-right.",
  media: ["photo"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "case-study/split-09 — eyebrow + large three-line headline, square photo bottom-right.",
  intent: {
    bestFor: ["introducing the results: the one achievement the case is remembered for",
      "a key claim that needs a picture of the work beside it"],
    holds: "an eyebrow and a headline of up to about 110 characters (three lines); one photo",
    itemChars: 120,
    avoid: ["figures that need to be compared (use case-study/data-04)", "body text or lists"],
    feel: "statement",
    needs: ["one photo of the result"],
  },
  schema: {
    caption: "string", title: "string — up to three lines", image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption",
    title: "What achievements can you share? Provide concrete figures or narrate specific actions taken.",
    image: csPhoto(2),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "20" },
    footer: CS_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-cs-cols reveal">
          <div class="v2f-cs-col">${csHead({ caption: s.caption, title: s.title }, { maxWidth: 1224 })}</div>
          <div class="v2f-cs-sq">${csImg(s.image)}</div>
        </div>
        ${csFooter(s.footer)}
      </div>`;
  },
};
