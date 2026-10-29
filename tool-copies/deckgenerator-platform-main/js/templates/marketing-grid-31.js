// Template: marketing/grid-31 — an eyebrow, title and muted subtitle at the left; at the right a dashed ring with a round centre image and four channel labels, surrounded by eight small labelled clusters of example images.
// Source Figma frame 110:31271.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, mkPhonePost, mkPostCard, mkTick, mkCross, mkStepLine, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-31", slide: 351, figmaNode: "110:31271",
  family: "marketing", role: "diagram", shape: "diagram", theme: "light", chrome: false,
  use: "A 360° ring: a central image with four channels around it and eight touchpoints with their assets",
  media: ["photo"], capacity: { items: 8, min: 4, max: 8 },
  slots: { images: 21, titles: 2, subtitles: 1, body: 0, stats: 0, icons: 0 },
  description: "marketing/grid-31 — an eyebrow, title and muted subtitle at the left; at the right a dashed ring with a round centre image and four channel labels, surrounded by eight small labelled clusters of example images.",
  intent: {
    bestFor: ["showing how one campaign idea travels across eight touchpoints (press, social, web, in-store) around a central visual"],
    holds: "an eyebrow, a title, a subtitle, four channel labels (up to about 14 characters), one centre image and up to eight touchpoints with a label of up to about 12 characters and two or three images",
    itemChars: 12,
    avoid: ["more than eight touchpoints", "long labels"],
    feel: "visual",
    needs: ["about 20 images"],
  },
  schema: {
    caption: "string", title: "string", subtitle: "string", ring: "{top, left, right, bottom, image}", touchpoints: "array of up to 8 {label, images: string[]} — the clusters are placed around the ring in the order Influence, Press, OOH, Web, Instagram, TikTok, Newsletter, In-store",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Content", title: "Activation", subtitle: "360°",
    ring: { top: "CRM", left: "PR", right: "Digital", bottom: "Visual Merch", image: mkPhoto(2) },
    touchpoints: [["Influence", 3], ["Press", 2], ["OOH", 2], ["Web", 2], ["Instagram", 3], ["TikTok", 3], ["Newsletter", 2], ["In-store", 2]].map(([label, n], k) => ({ label, images: Array.from({ length: n }, (_, i) => mkPhoto(k + i)) })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "44" },
    footer: MK_FOOTER,
  },
  render(s) {
    // Figma 110:31271 — each cluster sits at a fixed spot of the 1308×808 chart.
    const SLOTS = [
      { x: 37, y: 337, w: [97, 97, 70], h: [121, 121, 121] }, { x: 121, y: 124, w: [121, 70], h: [121, 121] },
      { x: 123, y: 550, w: [121, 121], h: [121, 121] }, { x: 894, y: 550, w: [121, 121], h: [74, 74] },
      { x: 865, y: 124, w: [97, 97, 70], h: [121, 121, 121] }, { x: 946, y: 337, w: [70, 70, 70], h: [121, 121, 121] },
      { x: 505, y: 0, w: [97, 121], h: [121, 74] }, { x: 493, y: 659, w: [121, 121], h: [121, 121] },
    ];
    const tp = (s.touchpoints || []).slice(0, 8); const r = s.ring || {};
    const cl = tp.map((t, k) => { const sl = SLOTS[k]; return `<div class="cl" style="left:${sl.x}px;top:${sl.y}px"><p>${esc(t.label ?? "")}</p><div class="im">${sl.w.map((w, i) => mkImg((t.images || [])[i], { style: `flex:0 0 ${w}px;width:${w}px;height:${sl.h[i]}px;` })).join("")}</div></div>`; }).join("");
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-cs-cols reveal" style="gap:32px;">
          <div class="v2f-mk-lcol" style="flex:0 0 500px;">${mkPageHead({ caption: s.caption, title: s.title, subtitle: s.subtitle })}</div>
          <div class="v2f-mk-chart360">
            ${cl}
            <div class="ring"><span class="t">${esc(r.top ?? "")}</span><span class="l">${esc(r.left ?? "")}</span><span class="r">${esc(r.right ?? "")}</span><span class="b">${esc(r.bottom ?? "")}</span><div class="ci">${r.image ? `<img src="${esc(r.image)}" alt="">` : ""}</div></div>
          </div>
        </div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
