// Template: brand-guidelines/split-07 — a caption, title and paragraph in a narrow left column; at the right a mosaic of twelve product photos in mixed sizes.
// Source Figma frame 109:15238.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/split-07", slide: 419, figmaNode: "109:15238",
  family: "brand-guidelines", role: "gallery", shape: "mosaic", theme: "light", chrome: false,
  use: "Product photography mosaic",
  media: ["photo"], capacity: { items: 11, min: 11, max: 11 },
  slots: { images: 11, titles: 1, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "brand-guidelines/split-07 — a caption, title and paragraph in a narrow left column; at the right a mosaic of twelve product photos in mixed sizes.",
  intent: {
    bestFor: ["showing product photography"],
    holds: "a caption, a title, a paragraph and the photos",
    itemChars: 250,
    avoid: ["text-heavy content"],
    feel: "visual",
    needs: ["photos"],
  },
  schema: {
    caption: "string — small eyebrow", title: "string", subtitle: "string — muted second line", body: "string — paragraph at the foot of the column", images: "array of 11 urls, in reading order",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Product", body: BR_LOREM, images: [brPhoto(1), brPhoto(2), brPhoto(3), brPhoto(4), brPhoto(5), brPhoto(6), brPhoto(7), brPhoto(0), brPhoto(1), brPhoto(2), brPhoto(3)], caption: "Photography",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "43" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${brSplit(brCol(s.meta, { caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body }), brTree({ d: "col", items: [{ d: "row", items: [{ f: 442 }, { d: "col", f: 442, items: [{ d: "row", f: 213, items: [{}, {}] }, { f: 213 }] }, { f: 442 }] }, { d: "row", items: [{ f: 675 }, { d: "col", f: 209, items: [{ f: 146 }, { f: 280 }] }, { d: "col", f: 442, items: [{ d: "row", f: 213, items: [{}, {}] }, { f: 213 }] }] }] }, s.images || []))}
        ${brFooter(s.footer)}
      </div>`;
  },
};
