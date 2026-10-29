// Template: brand-guidelines/grid-20 — a caption, title and paragraph in a narrow left column; at the right a three-column mosaic of nine lifestyle photos in mixed sizes.
// Source Figma frame 109:15217.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/grid-20", slide: 418, figmaNode: "109:15217",
  family: "brand-guidelines", role: "gallery", shape: "mosaic", theme: "light", chrome: false,
  use: "Lifestyle photography mosaic",
  media: ["photo"], capacity: { items: 10, min: 10, max: 10 },
  slots: { images: 10, titles: 1, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "brand-guidelines/grid-20 — a caption, title and paragraph in a narrow left column; at the right a three-column mosaic of nine lifestyle photos in mixed sizes.",
  intent: {
    bestFor: ["showing lifestyle photography"],
    holds: "a caption, a title, a paragraph and the photos",
    itemChars: 250,
    avoid: ["text-heavy content"],
    feel: "visual",
    needs: ["photos"],
  },
  schema: {
    caption: "string — small eyebrow", title: "string", subtitle: "string — muted second line", body: "string — paragraph at the foot of the column", images: "array of 10 urls, in reading order",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Lifestyle", body: BR_LOREM, images: [brPhoto(1), brPhoto(2), brPhoto(3), brPhoto(4), brPhoto(5), brPhoto(6), brPhoto(7), brPhoto(0), brPhoto(1), brPhoto(2)], caption: "Photography",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "42" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${brSplit(brCol(s.meta, { caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body }), brTree({ d: "row", items: [{ d: "col", items: [{ f: 583 }, { f: 317 }] }, { d: "col", items: [{ f: 317 }, { d: "row", f: 204, items: [{}, {}] }, { f: 355 }] }, { d: "col", items: [{ f: 317 }, { f: 355 }, { d: "row", f: 204, items: [{}, {}] }] }] }, s.images || []))}
        ${brFooter(s.footer)}
      </div>`;
  },
};
