// Template: brand-guidelines/gallery-07 — the logo large on a tinted panel at the left half; at the right two wide images stacked.
// Source Figma frame 109:14592.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY, brLogo } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/gallery-07", slide: 389, figmaNode: "109:14592",
  family: "brand-guidelines", role: "showcase", shape: "split", theme: "light", chrome: false,
  use: "Logo beside two applications",
  media: ["logo","photo"], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 3, titles: 0, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "brand-guidelines/gallery-07 — the logo large on a tinted panel at the left half; at the right two wide images stacked.",
  intent: {
    bestFor: ["the logo with two examples of it applied"],
    holds: "the logo artwork and two wide images",
    avoid: ["slides that need text"],
    feel: "visual",
    needs: ["3 images"],
  },
  schema: {
    logo: "url, or nagarro:horizontal | nagarro:vertical | nagarro:neutral | nagarro:mark for the built-in Nagarro logo", tile: "dark | light | tint | grey — the tile behind the logo (default dark)", images: "array of 2 — each an image url, or {logo, tile} for a logo tile",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    logo: "nagarro:horizontal", tile: "dark", images: [{ logo: "nagarro:horizontal", tile: "light" }, { logo: "nagarro:neutral", tile: "grey" }],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "13" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-cs-cols reveal" style="gap:32px;">${s.tile || s.logo?.startsWith?.("nagarro:") ? brLogo(s.logo, { tile: s.tile, cls: "fill", box: [84, 30] }) : brPanel(brImg(s.logo, { cls: "fill bare" }))}
          <div class="v2f-br-stack">${(s.images || []).slice(0, 2).map((i) => (i && typeof i === "object" ? brLogo(i.logo, { tile: i.tile, box: [84, 62] }) : brImg(i))).join("")}</div></div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
