// Template: brand-guidelines/gallery-04 — a title and paragraph in a narrow left column; at the right two rows (primary, secondary), each with a label and note beside one wide logo tile.
// Source Figma frame 109:14553.
// Also covers brand-guidelines/gallery-05 (wordmark) (same layout, another state).
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY, brLogo } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/gallery-04", slide: 387, figmaNode: "109:14553",
  family: "brand-guidelines", role: "showcase", shape: "split", theme: "light", chrome: false,
  use: "Primary and secondary logo on wide tiles",
  media: ["logo"], capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 2, titles: 3, subtitles: 0, body: 3, stats: 0, icons: 0 },
  description: "brand-guidelines/gallery-04 — a title and paragraph in a narrow left column; at the right two rows (primary, secondary), each with a label and note beside one wide logo tile.",
  intent: {
    bestFor: ["a logo or wordmark in its primary and secondary colourways"],
    holds: "a title, a paragraph and two rows, each a label, a note of up to about 140 characters and a wide logo tile",
    itemChars: 140,
    avoid: ["more than two rows"],
    feel: "visual",
    needs: ["2 logo images"],
  },
  schema: {
    title: "string — the column heading", body: "string — the paragraph at the foot of the column", rows: "array of 2 {label, text, logo, tile} — logo: url, or nagarro:horizontal | nagarro:vertical | nagarro:neutral | nagarro:mark for the built-in Nagarro logo (nagarro:vertical gives the stacked version); tile: dark | light | tint | grey — the tile behind the logo",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Logo", body: BR_LOREM,
    rows: [{ label: "Primary", text: BR_SHORT, logo: "nagarro:horizontal", tile: "dark" }, { label: "Secondary", text: BR_SHORT, logo: "nagarro:horizontal", tile: "light" }],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "11" },
    footer: BR_FOOTER,
  },
  render(s) {
    const rows = (s.rows || []).slice(0, 2).map((r) => `<div class="v2f-br-lrow">${brTextBlock({ title: r.label, text: r.text })}${brLogo(r.logo, { tile: r.tile, cls: "w920", box: [83, 87] })}</div>`).join("");
    return `
      <div class="v2f-root v2f-g32">
        ${brSplit(brCol(s.meta, { title: s.title, body: s.body }), brPanel(rows, { cls: "pad col" }))}
        ${brFooter(s.footer)}
      </div>`;
  },
};
