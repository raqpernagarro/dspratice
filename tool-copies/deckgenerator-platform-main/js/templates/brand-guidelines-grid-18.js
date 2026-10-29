// Template: brand-guidelines/grid-18 — a caption, title, subtitle and paragraph in a narrow left column; at the right, on a grey panel, six layout formats (4:5, 4:3, banner, 1:1, 16:9, 9:16), each an image labelled with its ratio.
// Source Figma frame 109:15063.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/grid-18", slide: 414, figmaNode: "109:15063",
  family: "brand-guidelines", role: "gallery", shape: "split", theme: "light", chrome: false,
  use: "Layout formats and aspect ratios",
  media: ["photo"], capacity: { items: 6, min: 6, max: 6 },
  slots: { images: 6, titles: 7, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "brand-guidelines/grid-18 — a caption, title, subtitle and paragraph in a narrow left column; at the right, on a grey panel, six layout formats (4:5, 4:3, banner, 1:1, 16:9, 9:16), each an image labelled with its ratio.",
  intent: {
    bestFor: ["the formats and aspect ratios a design system uses"],
    holds: "a caption, a title, a subtitle, a paragraph and six images with a short label each",
    itemChars: 12,
    avoid: ["more or fewer than six formats"],
    feel: "visual",
    needs: ["6 images"],
  },
  schema: {
    caption: "string — small eyebrow", title: "string", subtitle: "string — muted second line", body: "string — paragraph at the foot of the column", formats: "array of 6 {label, image} — in the order 4:5, 4:3, banner, 1:1, 16:9, 9:16",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Design", subtitle: "Layouts", body: BR_LOREM,
    formats: ["4:5", "4:3", "Banner", "1:1", "16:9", "9:16"].map((label, i) => ({ label, image: brPhoto(i + 1) })), caption: "Design",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "38" },
    footer: BR_FOOTER,
  },
  render(s) {
    const f = s.formats || [];
    const cell = (i, cls) => `<div class="v2f-br-fmt ${cls}">${brImg(f[i]?.image)}<p>${esc(f[i]?.label ?? "")}</p></div>`;
    return `
      <div class="v2f-root v2f-g32">
        ${brSplit(brCol(s.meta, { caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body }), brPanel(`<div class="v2f-br-fcol">${cell(0, "grow")}${cell(1, "r43")}</div><div class="v2f-br-fcol">${cell(2, "r31")}${cell(3, "grow")}${cell(4, "r169")}</div><div class="v2f-br-fcol">${cell(5, "grow")}</div>`, { cls: "pad dark" }))}
        ${brFooter(s.footer)}
      </div>`;
  },
};
