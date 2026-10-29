// Template: brand-guidelines/gallery-01 — a title and paragraph in a narrow left column; at the right the logo large on a tinted panel.
// Source Figma frame 109:14522.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY, brLogo } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/gallery-01", slide: 384, figmaNode: "109:14522",
  family: "brand-guidelines", role: "showcase", shape: "split", theme: "light", chrome: false,
  use: "The logo, large, with a short note",
  media: ["logo"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "brand-guidelines/gallery-01 — a title and paragraph in a narrow left column; at the right the logo large on a tinted panel.",
  intent: {
    bestFor: ["introducing the logo"],
    holds: "a title, a paragraph of up to about 250 characters and the logo artwork",
    itemChars: 250,
    avoid: ["several logo versions (use gallery-03/04)"],
    feel: "visual",
    needs: ["logo image"],
  },
  schema: {
    title: "string — the column heading", body: "string — the paragraph at the foot of the column", logo: "url, or nagarro:horizontal | nagarro:vertical | nagarro:neutral | nagarro:mark for the built-in Nagarro logo; a URL with no tile fills the panel", tile: "dark | light | tint | grey — the tile behind the logo (default: the tinted panel itself)",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Logo", body: BR_LOREM, logo: "nagarro:horizontal",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "08" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${brSplit(brCol(s.meta, { title: s.title, body: s.body }, { low: false }), brPanel(brLogo(s.logo, { tile: s.tile, cls: `fill${s.tile ? "" : " bare"}`, box: [59, 28] })))}
        ${brFooter(s.footer)}
      </div>`;
  },
};
