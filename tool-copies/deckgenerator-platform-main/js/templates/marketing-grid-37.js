// Template: marketing/grid-37 — a small header, five columns of labelled example assets in different sizes, and under them a timeline with five numbered steps, each with a title and a sentence.
// Source Figma frame 110:31614.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, mkPhonePost, mkPostCard, mkTick, mkCross, mkStepLine, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-37", slide: 356, figmaNode: "110:31614",
  family: "marketing", role: "timeline", shape: "timeline", theme: "light", chrome: false,
  use: "A run of show with a labelled image per step (social, newsletter, website), over a numbered timeline",
  media: ["photo"], capacity: { items: 5, min: 5, max: 5 },
  slots: { images: 8, titles: 7, subtitles: 1, body: 5, stats: 0, icons: 0 },
  description: "marketing/grid-37 — a small header, five columns of labelled example assets in different sizes, and under them a timeline with five numbered steps, each with a title and a sentence.",
  intent: {
    bestFor: ["the run of show across channels — which asset runs in which step"],
    holds: "a title and subtitle, five steps with a title of up to about 14 characters and a sentence of up to about 60 characters, and eight labelled images (one or two per step)",
    itemChars: 60,
    avoid: ["more or fewer than five steps", "no images"],
    feel: "visual",
    needs: ["8 images"],
  },
  schema: {
    title: "string", subtitle: "string", steps: "array of 5 {title, text, assets: [{label, image}]} — 1, 1, 2, 1 and 2 assets; sizes are fixed per step",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Run of show", subtitle: "Campaign",
    steps: [["Teaser", ["Social"]], ["Early Access", ["Social"]], ["Preview", ["Newsletter", "Website"]], ["Countdown", ["Social"]], ["Launch", ["Social", "Newsletter"]]]
      .map(([title, a], i) => ({ title, text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", assets: a.map((label, j) => ({ label, image: mkPhoto(i + j) })) })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "49" },
    footer: MK_FOOTER,
  },
  render(s) {
    const st = (s.steps || []).slice(0, 5);
    const H = [[380], [264], [212, 148], [380], [212, 148]];
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${mkSmallHead({ title: s.title, subtitle: s.subtitle }, { mid: true, md: true })}
        <div class="v2f-mk-ros reveal">
          <div class="as5">${st.map((x, k) => `<div class="c"><div class="st">${(x.assets || []).slice(0, H[k].length).map((a, j) => `<div class="as"><p>${esc(a.label ?? "")}</p><div class="v2f-imgbox v2f-cs-img" style="flex:none;width:212px;height:${H[k][j]}px;">${a.image ? `<img src="${esc(a.image)}" alt="">` : ""}</div></div>`).join("")}</div></div>`).join("")}</div>
          ${mkStepLine(st)}
        </div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
