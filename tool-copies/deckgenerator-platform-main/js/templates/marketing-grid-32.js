// Template: marketing/grid-32 — an eyebrow and 60px title over five tinted cards, each labelled with a touchpoint and holding three or four example images in a different layout.
// Source Figma frame 110:31328.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, mkPhonePost, mkPostCard, mkTick, mkCross, mkStepLine, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-32", slide: 352, figmaNode: "110:31328",
  family: "marketing", role: "gallery", shape: "row", theme: "light", chrome: false,
  use: "Five touchpoint cards, each with its own arrangement of example images",
  media: ["photo"], capacity: { items: 5, min: 5, max: 5 },
  slots: { images: 12, titles: 6, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "marketing/grid-32 — an eyebrow and 60px title over five tinted cards, each labelled with a touchpoint and holding three or four example images in a different layout.",
  intent: {
    bestFor: ["a channel-by-channel look at the assets (web, app, CRM, social, digital media)"],
    holds: "an eyebrow, a title and five touchpoints with a label of up to about 16 characters and two or three images each",
    itemChars: 16,
    avoid: ["more or fewer than five touchpoints", "no images"],
    feel: "visual",
    needs: ["12 images"],
  },
  schema: {
    caption: "string", title: "string", touchpoints: "array of 5 {label, images: string[]} — 3, 2, 2, 5 and 2 images; layouts are fixed per card",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Content", title: "Touchpoints",
    touchpoints: [["Web", 3], ["App", 3], ["CRM", 2], ["Social", 5], ["Digital Media", 2]].map(([label, n], k) => ({ label, images: Array.from({ length: n }, (_, i) => mkPhoto(k + i)) })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "45" },
    footer: MK_FOOTER,
  },
  render(s) {
    const tp = (s.touchpoints || []).slice(0, 5);
    const I = (t, i, st = "") => mkImg((t.images || [])[i], { style: st });
    const lay = [
      (t) => `<div class="ims">${I(t, 0, "flex:0 0 376px;")}<div class="r2">${I(t, 1)}${I(t, 2)}</div></div>`,
      (t) => `<div class="ims"><div class="r2" style="flex:0 0 180px;">${I(t, 0)}${I(t, 1)}</div>${I(t, 2, "flex:0 0 240px;")}</div>`,
      (t) => `<div class="ims">${I(t, 0, "flex:0 0 275px;")}${I(t, 1, "flex:0 0 275px;")}</div>`,
      (t) => `<div class="c2"><div class="cc" style="padding-top:19px;">${I(t, 0, "flex:0 0 256px;")}${I(t, 1, "flex:0 0 256px;")}</div><div class="cc">${I(t, 2, "flex:0 0 180px;")}${I(t, 3, "flex:0 0 180px;")}${I(t, 4, "flex:0 0 180px;")}</div></div>`,
      (t) => `<div class="ims">${I(t, 0, "flex:0 0 240px;")}${I(t, 1, "flex:0 0 240px;")}</div>`,
    ];
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-mk-h108 reveal">${mkPageHead({ caption: s.caption, title: s.title })}</div>
        <div class="v2f-mk-5tp reveal">${tp.map((t, k) => `<div class="tp"><p class="l">${esc(t.label ?? "")}</p>${lay[k](t)}</div>`).join("")}</div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
