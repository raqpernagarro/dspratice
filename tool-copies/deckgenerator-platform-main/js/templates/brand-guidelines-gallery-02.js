// Template: brand-guidelines/gallery-02 — a title and paragraph in a narrow left column; at the right, on a tinted panel, a label and note beside the logo on a large square tile.
// Source Figma frame 109:14529.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY, brLogo } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/gallery-02", slide: 385, figmaNode: "109:14529",
  family: "brand-guidelines", role: "showcase", shape: "split", theme: "light", chrome: false,
  use: "Primary logo on a square tile with a note",
  media: ["logo"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 2, subtitles: 0, body: 2, stats: 0, icons: 0 },
  description: "brand-guidelines/gallery-02 — a title and paragraph in a narrow left column; at the right, on a tinted panel, a label and note beside the logo on a large square tile.",
  intent: {
    bestFor: ["presenting the primary logo"],
    holds: "a title, a paragraph, a label, a note of up to about 140 characters and the logo tile",
    itemChars: 140,
    avoid: ["several logos"],
    feel: "visual",
    needs: ["logo image"],
  },
  schema: {
    title: "string — the column heading", body: "string — the paragraph at the foot of the column", label: "string", text: "string", logo: "url, or nagarro:horizontal | nagarro:vertical | nagarro:neutral | nagarro:mark for the built-in Nagarro logo", tile: "dark | light | tint | grey — the tile behind the logo (default dark)",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Logo", body: BR_LOREM, label: "Primary", text: BR_SHORT, logo: "nagarro:horizontal", tile: "dark",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "09" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${brSplit(brCol(s.meta, { title: s.title, body: s.body }), brPanel(`${brTextBlock({ title: s.label, text: s.text })}${brLogo(s.logo, { tile: s.tile ?? (s.logo && !s.logo.startsWith("nagarro:") ? undefined : "dark"), cls: "sq", box: [81, 26] })}`, { cls: "pad" }))}
        ${brFooter(s.footer)}
      </div>`;
  },
};
