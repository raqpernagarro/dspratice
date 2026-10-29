// Template: brand-guidelines/grid-17 — a caption, title, subtitle and paragraph over a scale from expressive to functional and a row of four tall images placed along it.
// Source Figma frame 109:14982.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/grid-17", slide: 412, figmaNode: "109:14982",
  family: "brand-guidelines", role: "gallery", shape: "row", theme: "light", chrome: false,
  use: "Tone scale with four example images",
  media: ["photo"], capacity: { items: 4, min: 4, max: 4 },
  slots: { images: 4, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "brand-guidelines/grid-17 — a caption, title, subtitle and paragraph over a scale from expressive to functional and a row of four tall images placed along it.",
  intent: {
    bestFor: ["placing examples on a scale, e.g. expressive to functional typography or imagery"],
    holds: "a caption, a title, a subtitle, a paragraph, the two ends of the scale and four images",
    itemChars: 240,
    avoid: ["more than four images"],
    feel: "visual",
    needs: ["4 images"],
  },
  schema: {
    caption: "string", title: "string", subtitle: "string", body: "string", from: "string — left end of the scale", to: "string — right end", images: "array of 4 urls",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Title", subtitle: "Subtitle", body: BR_LOREM, from: "Expressive", to: "Functional", images: [brPhoto(1), brPhoto(2), brPhoto(3), brPhoto(4)], caption: "Caption",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "36" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-br-tonehd reveal"><div class="hd"><p class="c">${esc(s.caption ?? "")}</p><p class="t">${esc(s.title ?? "")}</p><p class="s">${esc(s.subtitle ?? "")}</p></div><p class="b">${esc(s.body ?? "")}</p></div>
        <div class="v2f-br-tone reveal"><div><span>${esc(s.from ?? "")}</span><span>${esc(s.to ?? "")}</span></div><i></i></div>
        <div class="v2f-br-row reveal">${(s.images || []).slice(0, 4).map((i) => brImg(i, { cls: "grow" })).join("")}</div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
