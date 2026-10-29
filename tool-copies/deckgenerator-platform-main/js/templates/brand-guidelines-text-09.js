// Template: brand-guidelines/text-09 — a caption, title, subtitle and paragraph over a grey band holding five illustrations in a row that runs off both edges; staggered heights, or even with `even: true`.
// Source Figma frame 109:15041.
// Also covers brand-guidelines/text-10 (even heights) (same layout, another state).
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/text-09", slide: 413, figmaNode: "109:15041",
  family: "brand-guidelines", role: "gallery", shape: "row", theme: "light", chrome: false,
  use: "Illustration strip on a grey band",
  media: ["photo"], capacity: { items: 5, min: 3, max: 5 },
  slots: { images: 5, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "brand-guidelines/text-09 — a caption, title, subtitle and paragraph over a grey band holding five illustrations in a row that runs off both edges; staggered heights, or even with `even: true`.",
  intent: {
    bestFor: ["showing the illustration or graphic style"],
    holds: "a caption, a title, a subtitle, a paragraph of up to about 300 characters and three to five images",
    itemChars: 300,
    avoid: ["text-heavy content"],
    feel: "visual",
    needs: ["5 images"],
  },
  schema: {
    caption: "string", title: "string", subtitle: "string", body: "string", images: "array of up to 5 urls", even: "boolean — equal heights instead of the staggered arch",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Graphics", subtitle: "Illustrations", body: BR_LOREM, images: [brPhoto(1), brPhoto(2), brPhoto(3), brPhoto(4), brPhoto(5)], even: false, caption: "Design",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "37" },
    footer: BR_FOOTER,
  },
  render(s) {
    const hs = s.even ? [540, 540, 540, 540, 540] : [400, 540, 640, 540, 400];
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-br-ghd reveal"><div class="hd"><p class="c">${esc(s.caption ?? "")}</p><div><p class="t">${esc(s.title ?? "")}</p><p class="s">${esc(s.subtitle ?? "")}</p></div></div><p class="b">${esc(s.body ?? "")}</p></div>
        <div class="v2f-br-band reveal">${(s.images || []).slice(0, 5).map((i, k) => brImg(i, { style: `flex:0 0 450px;height:${hs[k]}px;` })).join("")}</div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
