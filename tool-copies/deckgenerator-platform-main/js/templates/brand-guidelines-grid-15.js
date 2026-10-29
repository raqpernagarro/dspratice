// Template: brand-guidelines/grid-15 — a caption, title and paragraph in a narrow left column; at the right the type scale, each level set at its own size with its size and tracking at the right.
// Source Figma frame 109:14944.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/grid-15", slide: 410, figmaNode: "109:14944",
  family: "brand-guidelines", role: "table", shape: "split", theme: "light", chrome: false,
  use: "Type hierarchy from display to caption",
  media: [], capacity: { items: 7, min: 3, max: 8 },
  slots: { images: 0, titles: 9, subtitles: 0, body: 8, stats: 0, icons: 0 },
  description: "brand-guidelines/grid-15 — a caption, title and paragraph in a narrow left column; at the right the type scale, each level set at its own size with its size and tracking at the right.",
  intent: {
    bestFor: ["the type scale of a brand"],
    holds: "a caption, a title, a paragraph, a label and three to eight levels, each a name, a size in px and a spec",
    itemChars: 30,
    avoid: ["more than eight levels"],
    feel: "dense",
    needs: [],
  },
  schema: {
    caption: "string — small eyebrow", title: "string", subtitle: "string — muted second line", body: "string — paragraph at the foot of the column", label: "string", levels: "array of up to 10 {name, size, spec} — size in px sets the sample; 20 and below uses the body face",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Typography", body: BR_LOREM, label: "Type hierarchy",
    levels: [["Display Title", 150, "150 px | -2%"], ["H1 Headline", 100, "100 px | -2%"], ["H2 Headline", 60, "60 px | -2%"], ["H3 Headline", 48, "48 px | -2%"], ["H4 Headline", 36, "36 px | -2%"], ["H5 Headline", 28, "28 px | -2%"], ["H6 Headline", 24, "24 px | -2%"], ["Paragraphs & Running Text", 20, "20 px | 0%"], ["Captions", 14, "14 px | 0%"]].map(([name, size, spec]) => ({ name, size, spec })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "34" },
    footer: BR_FOOTER,
  },
  render(s) {
    const lh = (n) => (n <= 14 ? 20 : n <= 20 ? 28 : n <= 24 ? 32 : n <= 28 ? 36 : n <= 36 ? 44 : n <= 48 ? 56 : n <= 60 ? 68 : n <= 100 ? 108 : n);
    const rows = (s.levels || []).slice(0, 10).map((l) => { const n = Math.min(150, Math.max(12, Number(l.size) || 24));
      return `<div class="v2f-br-lvl"><p class="${n <= 20 ? "body" : ""}" style="font-size:${n}px;line-height:${lh(n)}px;letter-spacing:${n <= 20 ? 0 : -(n * 0.02).toFixed(2)}px;">${esc(l.name ?? "")}</p><span>${esc(l.spec ?? "")}</span></div>`; }).join("");
    return `
      <div class="v2f-root v2f-g32">
        ${brSplit(brCol(s.meta, { caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body }), brPanel(`<p class="v2f-br-h36">${esc(s.label ?? "")}</p><div class="v2f-br-lvls${(s.levels || []).length > 7 ? " dense" : ""}">${rows}</div>`, { cls: "pad col between" }))}
        ${brFooter(s.footer)}
      </div>`;
  },
};
