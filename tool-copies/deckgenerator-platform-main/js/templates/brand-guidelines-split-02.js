// Template: brand-guidelines/split-02 — a title and paragraph in a narrow left column; at the right one large image filling the slide height.
// Source Figma frame 109:14599.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/split-02", slide: 390, figmaNode: "109:14599",
  family: "brand-guidelines", role: "showcase", shape: "split", theme: "light", chrome: false,
  use: "Logo in use: one large image with a note",
  media: ["photo"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "brand-guidelines/split-02 — a title and paragraph in a narrow left column; at the right one large image filling the slide height.",
  intent: {
    bestFor: ["showing the logo in situ — signage, merchandise, a product"],
    holds: "a title, a paragraph of up to about 250 characters and one image",
    itemChars: 250,
    avoid: ["several images"],
    feel: "visual",
    needs: ["1 image"],
  },
  schema: {
    title: "string — the column heading", body: "string — the paragraph at the foot of the column", image: "url",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Logo-in-situ", body: BR_LOREM, image: brPhoto(2),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "14" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${brSplit(brCol(s.meta, { title: s.title, body: s.body }), brImg(s.image, { cls: "grow" }))}
        ${brFooter(s.footer)}
      </div>`;
  },
};
