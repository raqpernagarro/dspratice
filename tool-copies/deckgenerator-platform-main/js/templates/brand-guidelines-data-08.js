// Template: brand-guidelines/data-08 — a full-bleed wall of wide photos in three offset rows that run off both sides, with no header or footer.
// Source Figma frame 109:15439.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/data-08", slide: 427, figmaNode: "109:15439",
  family: "brand-guidelines", role: "gallery", shape: "fullbleed", theme: "light", chrome: false,
  use: "Full-bleed photo wall in rows",
  media: ["photo"], capacity: { items: 13, min: 4, max: 13 },
  slots: { images: 13, titles: 0, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "brand-guidelines/data-08 — a full-bleed wall of wide photos in three offset rows that run off both sides, with no header or footer.",
  intent: {
    bestFor: ["closing or opening a photography section with landscape images"],
    holds: "four to thirteen photos",
    avoid: ["slides that need text"],
    feel: "visual",
    needs: ["photos"],
  },
  schema: {
    images: "array of up to 13 urls — repeated to fill the wall",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    images: [brPhoto(0), brPhoto(1), brPhoto(2), brPhoto(3), brPhoto(4), brPhoto(5), brPhoto(6), brPhoto(7)],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "51" },
    footer: BR_FOOTER,
  },
  render(s) {
    const im = (s.images || []).filter(Boolean);
    const at = (i) => (im.length ? im[i % im.length] : "");
    // Figma: 583×328 photos, 607 apart; rows 1 and 3 start at x -242, row 2 at x -546.
    const rows = [[-242, 4], [-546, 5], [-242, 4]];
    let n = 0;
    return `
      <div class="v2f-root v2f-br-rwall">${rows.map(([x, c], r) => `<div class="r" style="left:${x}px;top:${24 + r * 352}px;">${Array.from({ length: c }, () => brImg(at(n++))).join("")}</div>`).join("")}</div>`;
  },
};
