// Template: brand-guidelines/gallery-06 — a title and paragraph in a narrow left column; at the right three square logo tiles in a row, each labelled underneath.
// Source Figma frame 109:14577.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY, brLogo } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/gallery-06", slide: 388, figmaNode: "109:14577",
  family: "brand-guidelines", role: "showcase", shape: "split", theme: "light", chrome: false,
  use: "Three logo colourways side by side",
  media: ["logo"], capacity: { items: 3, min: 2, max: 3 },
  slots: { images: 3, titles: 4, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "brand-guidelines/gallery-06 — a title and paragraph in a narrow left column; at the right three square logo tiles in a row, each labelled underneath.",
  intent: {
    bestFor: ["primary, secondary and tertiary logo colourways"],
    holds: "a title, a paragraph and two or three logo tiles with a one-word label",
    itemChars: 20,
    avoid: ["long labels"],
    feel: "visual",
    needs: ["3 logo images"],
  },
  schema: {
    title: "string — the column heading", body: "string — the paragraph at the foot of the column", logos: "array of up to 3 {label, logo, tile} — logo: url, or nagarro:horizontal | nagarro:vertical | nagarro:neutral | nagarro:mark for the built-in Nagarro logo; tile: dark | light | tint | grey — the tile behind the logo",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Logo", body: BR_LOREM,
    logos: [{ label: "Primary", logo: "nagarro:horizontal", tile: "dark" }, { label: "Secondary", logo: "nagarro:horizontal", tile: "light" }, { label: "Tertiary", logo: "nagarro:neutral", tile: "tint" }],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "12" },
    footer: BR_FOOTER,
  },
  render(s) {
    const tiles = (s.logos || []).slice(0, 3).map((l) => `<div class="v2f-br-ltile">${brLogo(l.logo, { tile: l.tile, cls: "sq", box: [88, 60] })}<p>${esc(l.label ?? "")}</p></div>`).join("");
    return `
      <div class="v2f-root v2f-g32">
        ${brSplit(brCol(s.meta, { title: s.title, body: s.body }), brPanel(tiles, { cls: "pad mid" }))}
        ${brFooter(s.footer)}
      </div>`;
  },
};
