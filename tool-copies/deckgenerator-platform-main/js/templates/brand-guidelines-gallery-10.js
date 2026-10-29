// Template: brand-guidelines/gallery-10 — a caption and title over a 2×3 grid of “things to avoid”, each with a red cross, a caption and an example.
// Source Figma frame 109:14667.
// Also covers brand-guidelines/text-08 and text-11 (typography and design, unframed) (same layout, another state).
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/gallery-10", slide: 397, figmaNode: "109:14667",
  family: "brand-guidelines", role: "detail", shape: "grid", theme: "light", chrome: false,
  use: "Six things to avoid, with examples",
  media: ["photo"], capacity: { items: 6, min: 3, max: 6 },
  slots: { images: 6, titles: 7, subtitles: 0, body: 0, stats: 0, icons: 6 },
  description: "brand-guidelines/gallery-10 — a caption and title over a 2×3 grid of “things to avoid”, each with a red cross, a caption and an example.",
  intent: {
    bestFor: ["misuse of the logo, type or design elements"],
    holds: "a caption, a title and three to six examples, each a caption of up to about 40 characters and an image",
    itemChars: 40,
    avoid: ["long captions", "more than six examples"],
    feel: "visual",
    needs: ["example images"],
  },
  schema: {
    caption: "string — the chapter, e.g. Logo", title: "string", items: "array of up to 6 {label, image}", framed: "boolean — white tiles with a hairline and diagonal strike, for logo examples (default true)",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Logo", title: "Things to avoid", framed: true,
    items: [["Don’t change opacity", "opacity"], ["Don’t apply colours", "colour"], ["Don’t stretch or alter its proportions", "stretch"], ["Don’t apply gradients", "gradient"], ["Don’t rotate", "rotate"], ["Don’t change the arrangement", "arrange"]].map(([label, f]) => ({ label, image: `assets/brand/avoid-${f}.svg` })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "21" },
    footer: BR_FOOTER,
  },
  render(s) {
    const items = (s.items || []).slice(0, 6);
    const framed = s.framed !== false;
    const rows = [items.slice(0, 3), items.slice(3, 6)].filter((r) => r.length);
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="reveal">${brHead({ caption: s.caption, title: s.title }, { big: true })}</div>
        <div class="v2f-br-avoids reveal">${rows.map((r) => `<div class="row">${r.map((a) => brAvoid(a, { framed })).join("")}</div>`).join("")}</div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
