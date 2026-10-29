// Template: brand-guidelines/grid-25 — a full-bleed wall of twenty photos in five staggered columns of mixed heights, running off every edge, with no header or footer.
// Source Figma frame 109:15412.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/grid-25", slide: 426, figmaNode: "109:15412",
  family: "brand-guidelines", role: "gallery", shape: "fullbleed", theme: "light", chrome: false,
  use: "Full-bleed photo wall in columns",
  media: ["photo"], capacity: { items: 20, min: 5, max: 20 },
  slots: { images: 20, titles: 0, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "brand-guidelines/grid-25 — a full-bleed wall of twenty photos in five staggered columns of mixed heights, running off every edge, with no header or footer.",
  intent: {
    bestFor: ["closing or opening a photography section with a mood wall"],
    holds: "five to twenty photos",
    avoid: ["slides that need text"],
    feel: "visual",
    needs: ["photos"],
  },
  schema: {
    images: "array of up to 20 urls — repeated to fill the wall",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    images: [brPhoto(0), brPhoto(1), brPhoto(2), brPhoto(3), brPhoto(4), brPhoto(5), brPhoto(6), brPhoto(7)],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "50" },
    footer: BR_FOOTER,
  },
  render(s) {
    const im = (s.images || []).filter(Boolean);
    const at = (i) => (im.length ? im[i % im.length] : "");
    // Figma: five 384px columns from x -48, 408 apart, each starting above the slide.
    const cols = [[-48, -260, [476, 216, 476, 684]], [360, -240, [384, 476, 216, 684]], [768, -320, [384, 216, 684, 216]], [1176, -60, [216, 384, 216, 684]], [1584, -260, [476, 216, 476, 216]]];
    let n = 0;
    return `
      <div class="v2f-root v2f-br-wall">${cols.map(([x, y, hs]) => `<div class="c" style="left:${x}px;top:${y}px;">${hs.map((h) => brImg(at(n++), { style: `height:${h}px;` })).join("")}</div>`).join("")}</div>`;
  },
};
