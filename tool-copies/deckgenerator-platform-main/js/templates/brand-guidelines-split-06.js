// Template: brand-guidelines/split-06 — a caption, title and paragraph in a narrow left column; at the right six portrait photos in a 3×2 grid.
// Source Figma frame 109:15203.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/split-06", slide: 417, figmaNode: "109:15203",
  family: "brand-guidelines", role: "gallery", shape: "mosaic", theme: "light", chrome: false,
  use: "Portrait photography grid",
  media: ["photo"], capacity: { items: 6, min: 6, max: 6 },
  slots: { images: 6, titles: 1, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "brand-guidelines/split-06 — a caption, title and paragraph in a narrow left column; at the right six portrait photos in a 3×2 grid.",
  intent: {
    bestFor: ["showing portrait photography"],
    holds: "a caption, a title, a paragraph and the photos",
    itemChars: 250,
    avoid: ["text-heavy content"],
    feel: "visual",
    needs: ["photos"],
  },
  schema: {
    caption: "string — small eyebrow", title: "string", subtitle: "string — muted second line", body: "string — paragraph at the foot of the column", images: "array of 6 urls, in reading order",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Portraits", body: BR_LOREM, images: [brPhoto(1), brPhoto(2), brPhoto(3), brPhoto(4), brPhoto(5), brPhoto(6)], caption: "Photography",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "41" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${brSplit(brCol(s.meta, { caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body }), brTree({ d: "col", items: [{ d: "row", items: [{}, {}, {}] }, { d: "row", items: [{}, {}, {}] }] }, s.images || []))}
        ${brFooter(s.footer)}
      </div>`;
  },
};
