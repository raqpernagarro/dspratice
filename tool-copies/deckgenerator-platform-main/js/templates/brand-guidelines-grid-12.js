// Template: brand-guidelines/grid-12 — a caption and title over a row of three or four tall “things to avoid” examples, each with a red cross and a caption.
// Source Figma frame 109:14866.
// Also covers brand-guidelines/grid-21 (three photography examples) (same layout, another state).
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/grid-12", slide: 405, figmaNode: "109:14866",
  family: "brand-guidelines", role: "detail", shape: "row", theme: "light", chrome: false,
  use: "Three or four things to avoid, tall examples",
  media: ["photo"], capacity: { items: 4, min: 3, max: 4 },
  slots: { images: 4, titles: 5, subtitles: 0, body: 0, stats: 0, icons: 4 },
  description: "brand-guidelines/grid-12 — a caption and title over a row of three or four tall “things to avoid” examples, each with a red cross and a caption.",
  intent: {
    bestFor: ["colour or photography misuse shown with tall examples"],
    holds: "a caption, a title and three or four examples, each a caption of up to about 40 characters and an image",
    itemChars: 40,
    avoid: ["more than four examples"],
    feel: "visual",
    needs: ["example images"],
  },
  schema: {
    caption: "string", title: "string", items: "array of 3–4 {label, image}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Colour", title: "Things to avoid",
    items: ["Don’t use multiple colors", "Don’t make the logo different colors", "Don’t use external colours", "Don’t use colours that are hard to read"].map((label) => ({ label, image: "" })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "29" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="reveal">${brHead({ caption: s.caption, title: s.title }, { big: true })}</div>
        <div class="v2f-br-row reveal">${(s.items || []).slice(0, 4).map((a) => brAvoid(a)).join("")}</div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
