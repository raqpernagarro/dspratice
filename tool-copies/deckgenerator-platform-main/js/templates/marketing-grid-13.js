// Template: marketing/grid-13 — an eyebrow, a title and a muted subtitle, then four columns each with a photo, a name and a sentence; `active` fades the other three.
// Source Figma frame 110:30843.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-13", slide: 334, figmaNode: "110:30843",
  family: "marketing", role: "gallery", shape: "row", theme: "light", chrome: false,
  use: "Four brands or examples side by side, with one optionally brought into focus",
  media: ["photo"], capacity: { items: 4, min: 4, max: 4 },
  slots: { images: 4, titles: 6, subtitles: 1, body: 4, stats: 0, icons: 0 },
  description: "marketing/grid-13 — an eyebrow, a title and a muted subtitle, then four columns each with a photo, a name and a sentence; `active` fades the other three.",
  intent: {
    bestFor: ["benchmarking four brands or examples one by one — repeat the slide with a different `active` to walk through them"],
    holds: "an eyebrow, a title, a subtitle and four items with a name of up to about 20 characters, a sentence of up to about 120 characters and a photo",
    itemChars: 120,
    avoid: ["more or fewer than four items", "no photos"],
    feel: "visual",
    needs: ["4 photos"],
  },
  schema: {
    caption: "string", title: "string", subtitle: "string", items: "array of 4 {title, body, image}", active: "number 0–3 — the item in focus; omit to show all four fully",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Content Strategy", title: "Benchmarks", subtitle: "Lorem ipsum",
    items: [1, 2, 3, 4].map((n) => ({ title: `Brand ${n}`, body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", image: mkPhoto(n) })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "27" },
    footer: MK_FOOTER,
  },
  render(s) {
    const it = (s.items || []).slice(0, 4); const a = Number.isInteger(s.active) ? s.active : null;
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-mk-h164 reveal"><div class="v2f-mk-ph center"><div class="hd">
          ${s.caption ? `<p class="v2f-cs-cap">${esc(s.caption)}</p>` : ""}<div><p class="v2f-cs-h2">${esc(s.title ?? "")}</p>${s.subtitle ? `<p class="v2f-cs-h3 v2f-cs-muted">${esc(s.subtitle)}</p>` : ""}</div></div></div></div>
        <div class="v2f-mk-4c reveal">${it.map((x, i) => `<div class="c${a !== null && a !== i ? " dim" : ""}">${mkImg(x.image)}<div class="tx"><p class="h">${esc(x.title ?? "")}</p><p class="b">${esc(x.body ?? "")}</p></div></div>`).join("")}</div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
