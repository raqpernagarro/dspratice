// Template: brand-guidelines/grid-19 — a caption, title, subtitle and paragraph in a narrow left column; at the right a 3×3 grid of images, each with a small title above it, or 2×2 with `cols: 2`.
// Source Figma frame 109:15090.
// Also covers brand-guidelines/split-04 (2×2) (same layout, another state).
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/grid-19", slide: 415, figmaNode: "109:15090",
  family: "brand-guidelines", role: "gallery", shape: "split", theme: "light", chrome: false,
  use: "Overview grid of titled images",
  media: ["photo"], capacity: { items: 9, min: 4, max: 9 },
  slots: { images: 9, titles: 10, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "brand-guidelines/grid-19 — a caption, title, subtitle and paragraph in a narrow left column; at the right a 3×3 grid of images, each with a small title above it, or 2×2 with `cols: 2`.",
  intent: {
    bestFor: ["an overview of UI elements, templates or applications"],
    holds: "a caption, a title, a subtitle, a paragraph and four or nine images with a short title each",
    itemChars: 24,
    avoid: ["long titles"],
    feel: "visual",
    needs: ["4–9 images"],
  },
  schema: {
    caption: "string — small eyebrow", title: "string", subtitle: "string — muted second line", body: "string — paragraph at the foot of the column", cols: "2 | 3 — grid size (default 3)", items: "array of up to 9 {title, image}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Design", subtitle: "Overview", body: BR_LOREM, cols: 3,
    items: Array.from({ length: 9 }, (_, i) => ({ title: "Title", image: brPhoto(i % 8) })), caption: "Design",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "39" },
    footer: BR_FOOTER,
  },
  render(s) {
    const n = Number(s.cols) === 2 ? 2 : 3;
    const it = (s.items || []).slice(0, n * n);
    const rows = Array.from({ length: n }, (_, r) => `<div class="row">${it.slice(r * n, r * n + n).map((x) => `<div class="v2f-br-ov"><p>${esc(x.title ?? "")}</p>${brImg(x.image)}</div>`).join("")}</div>`).join("");
    return `
      <div class="v2f-root v2f-g32">
        ${brSplit(brCol(s.meta, { caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body }), `<div class="v2f-br-ovs">${rows}</div>`)}
        ${brFooter(s.footer)}
      </div>`;
  },
};
