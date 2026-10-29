// Template: brand-guidelines/grid-01 — a title at the left and three devices at the right: two phones and a tablet, with soft shadows.
// Source Figma frame 109:14618.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/grid-01", slide: 394, figmaNode: "109:14618",
  family: "brand-guidelines", role: "showcase", shape: "row", theme: "light", chrome: false,
  use: "Logo in use across phones and a tablet",
  media: ["mockup"], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 3, titles: 1, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "brand-guidelines/grid-01 — a title at the left and three devices at the right: two phones and a tablet, with soft shadows.",
  intent: {
    bestFor: ["the brand across devices"],
    holds: "a title and three screen images (two phones, then the tablet)",
    avoid: ["long text"],
    feel: "visual",
    needs: ["3 images"],
  },
  schema: {
    title: "string", images: "array of 3 urls — two phone screens, then the tablet screen",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Logo-in-situ", images: [brPhoto(1), brPhoto(2), brPhoto(3)],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "18" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-br-dev reveal"><p class="v2f-br-h36">${esc(s.title ?? "")}</p>
          <div class="v2f-br-devs">${brPhone((s.images || [])[0], { h: 568, shadow: true })}${brPhone((s.images || [])[1], { h: 568, shadow: true })}${brTab((s.images || [])[2], { w: 840 })}</div></div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
