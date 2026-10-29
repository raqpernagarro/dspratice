// Template: pitch/text-09 — the market size: three nested circles (TAM, SAM, SOM), each
// explained, running off the right of the slide.
// Source Figma frame 110:37150.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/text-09", slide: 282, figmaNode: "110:37150",
  family: "pitch", role: "diagram", shape: "diagram", theme: "light", chrome: false,
  use: "A heading over three nested circles — total, serviceable and obtainable market — each with a short explanation.",
  media: [], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 0, titles: 4, subtitles: 0, body: 3, stats: 0, icons: 0 },
  description: "pitch/text-09 — heading + TAM/SAM/SOM nested circles.",
  intent: {
    bestFor: ["the size of the market in three layers: total, serviceable, obtainable"],
    holds: "an eyebrow, a title of up to about 30 characters, and exactly three layers of a short name and an explanation of up to about 90 characters",
    itemChars: 90,
    avoid: ["any other nesting (use pitch/grid-10 for overlaps)", "more or fewer than three layers"],
    feel: "visual",
    needs: [],
  },
  schema: {
    caption: "string", title: "string",
    layers: "array of 3 { title, body } — largest first (TAM, SAM, SOM)",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Business", title: "Total Addressable Market",
    layers: [
      { title: "TAM", body: "Explain the total potential\nrevenue if your product or\nservice could capture\n100% of the market." },
      { title: "SAM", body: "Explain the portion of TAM\nyour product or service can\ntarget based on features\nand market reach." },
      { title: "SOM", body: "Explain the realistic share\nof SAM a business can\ncapture considering\ncompetition and resources." },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "22" },
    footer: PT_FOOTER,
  },
  render(s) {
    const C = [[480, -282, 1644], [976, -34, 1148], [1424, 190, 700]];
    const ls = (s.layers || []).slice(0, 3);
    const circles = C.map(([x, y, d], i) => `<div class="c" style="left:${x}px;top:${y}px;width:${d}px;height:${d}px;"><div class="v2f-pt-tb"><p class="t">${esc(ls[i]?.title ?? "")}</p><p class="b">${esc(ls[i]?.body ?? "")}</p></div></div>`).join("");
    return `
      <div class="v2f-root v2f-g32 v2f-pt-bgroot">
        <div class="v2f-pt-bg reveal">${circles}</div>
        ${topBar(s.meta)}
        <div class="v2f-pt-over" style="flex:1 1 0;min-height:0;">${ptHead({ caption: s.caption, title: s.title }, { size: "h2" })}</div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
