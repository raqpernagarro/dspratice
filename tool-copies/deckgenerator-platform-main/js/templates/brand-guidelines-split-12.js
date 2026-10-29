// Template: brand-guidelines/split-12 — a caption and title over a 2×4 grid of tiles, each an image with a label under it, one per brand code (logo, colours, typography …).
// Source Figma frame 109:15398.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/split-12", slide: 425, figmaNode: "109:15398",
  family: "brand-guidelines", role: "toc", shape: "grid", theme: "light", chrome: false,
  use: "Brand codes overview",
  media: ["photo"], capacity: { items: 8, min: 4, max: 8 },
  slots: { images: 8, titles: 9, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "brand-guidelines/split-12 — a caption and title over a 2×4 grid of tiles, each an image with a label under it, one per brand code (logo, colours, typography …).",
  intent: {
    bestFor: ["an overview of the brand's building blocks"],
    holds: "a caption, a title and four to eight tiles, each an image and a label of up to about 22 characters",
    itemChars: 22,
    avoid: ["more than eight codes"],
    feel: "visual",
    needs: ["images"],
  },
  schema: {
    caption: "string", title: "string", codes: "array of up to 8 {label, image}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Overview", title: "Brand Codes",
    codes: ["Logo", "Colors", "Typography", "UI Elements", "Product visualization", "Iconography", "Photography", "Illustrations"].map((label) => ({ label, image: "" })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "49" },
    footer: BR_FOOTER,
  },
  render(s) {
    const c = (s.codes || []).slice(0, 8);
    const tile = (x) => `<div class="v2f-br-code">${brImg(x.image)}<p>${esc(x.label ?? "")}</p></div>`;
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="reveal">${brHead({ caption: s.caption, title: s.title }, { big: true })}</div>
        <div class="v2f-br-codes reveal"><div class="row">${c.slice(0, 4).map(tile).join("")}</div><div class="row">${c.slice(4, 8).map(tile).join("")}</div></div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
