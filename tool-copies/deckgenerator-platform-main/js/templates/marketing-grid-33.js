// Template: marketing/grid-33 — an eyebrow and 60px title at the left; at the right a tinted panel with six images in different aspect ratios (4:5, 4:3, banner, 1:1, 16:9, 9:16), each labelled. No footer.
// Source Figma frame 110:31366.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, mkPhonePost, mkPostCard, mkTick, mkCross, mkStepLine, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-33", slide: 353, figmaNode: "110:31366",
  family: "marketing", role: "gallery", shape: "grid", theme: "light", chrome: false,
  use: "The same asset adapted to six formats on a tinted panel, each labelled",
  media: ["photo"], capacity: { items: 6, min: 6, max: 6 },
  slots: { images: 6, titles: 2, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "marketing/grid-33 — an eyebrow and 60px title at the left; at the right a tinted panel with six images in different aspect ratios (4:5, 4:3, banner, 1:1, 16:9, 9:16), each labelled. No footer.",
  intent: {
    bestFor: ["showing how a creative adapts across formats (feed, story, banner, video)"],
    holds: "an eyebrow, a title and six images with a format label of up to about 8 characters",
    itemChars: 8,
    avoid: ["more or fewer than six formats", "no images"],
    feel: "visual",
    needs: ["6 images"],
  },
  schema: {
    caption: "string", title: "string", formats: "array of 6 {label, image} in the order 4:5, 4:3, banner, 1:1, 16:9, 9:16 (shapes are fixed)",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Content", title: "Adaptation",
    formats: ["4:5", "4:3", "Banner", "1:1", "16:9", "9:16"].map((label, i) => ({ label, image: mkPhoto(i) })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "46" },
    footer: MK_FOOTER,
  },
  render(s) {
    const f = (s.formats || []).slice(0, 6);
    const one = (x = {}, ar) => `<div class="ly"><div class="v2f-imgbox v2f-cs-img" style="aspect-ratio:${ar};flex:none;width:100%;">${x.image ? `<img src="${esc(x.image)}" alt="">` : ""}</div><p>${esc(x.label ?? "")}</p></div>`;
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:24px;">
          ${mkCol(s.meta, `<div class="v2f-mk-fill">${mkPageHead({ caption: s.caption, title: s.title })}</div>`, { width: 442, logoOnly: true })}
          <div class="v2f-mk-adapt"><div class="c a">${one(f[0], "400/500")}${one(f[1], "4/3")}</div><div class="c a">${one(f[2], "300/100")}${one(f[3], "1/1")}${one(f[4], "16/9")}</div><div class="c">${one(f[5], "9/16")}</div></div>
        </div>
      </div>`;
  },
};
