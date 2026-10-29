// Template: brand-guidelines/text-03 — a large title at the left and a tablet showing the brand on screen at the right.
// Source Figma frame 109:14614.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/text-03", slide: 393, figmaNode: "109:14614",
  family: "brand-guidelines", role: "showcase", shape: "split", theme: "light", chrome: false,
  use: "Logo in use on a tablet",
  media: ["mockup"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "brand-guidelines/text-03 — a large title at the left and a tablet showing the brand on screen at the right.",
  intent: {
    bestFor: ["the brand on a tablet or app screen"],
    holds: "a title and one screen image",
    avoid: ["long text"],
    feel: "visual",
    needs: ["1 image"],
  },
  schema: {
    title: "string", image: "url — the tablet screen",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Logo-in-situ", image: brPhoto(3),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "17" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-br-dev reveal"><p class="v2f-br-h48b">${esc(s.title ?? "")}</p>${brTab(s.image, { w: 1022 })}</div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
