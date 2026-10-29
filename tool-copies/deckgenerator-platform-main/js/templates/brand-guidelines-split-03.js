// Template: brand-guidelines/split-03 — two tinted panels side by side: a phone and a smartwatch, each showing the brand on screen.
// Source Figma frame 109:14608.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/split-03", slide: 392, figmaNode: "109:14608",
  family: "brand-guidelines", role: "showcase", shape: "split", theme: "light", chrome: false,
  use: "Logo on a phone and a smartwatch",
  media: ["mockup"], capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 2, titles: 0, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "brand-guidelines/split-03 — two tinted panels side by side: a phone and a smartwatch, each showing the brand on screen.",
  intent: {
    bestFor: ["the logo or app icon on devices"],
    holds: "two screen images: the phone screen and the watch face",
    avoid: ["slides that need text"],
    feel: "visual",
    needs: ["2 images"],
  },
  schema: {
    images: "array of 2 urls — the phone screen, then the watch face",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    images: [brPhoto(1), brPhoto(2)],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "16" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-cs-cols reveal" style="gap:24px;">${brPanel(brPhone((s.images || [])[0], { h: 776 }), { cls: "mid" })}${brPanel(brWatch((s.images || [])[1]), { cls: "mid" })}</div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
