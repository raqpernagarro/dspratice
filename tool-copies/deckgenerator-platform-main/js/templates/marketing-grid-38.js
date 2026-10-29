// Template: marketing/grid-38 — an eyebrow, a 60px title and an explanatory line at the left, and three columns at the right each with a milestone name, a short description and a tall photo.
// Source Figma frame 110:31668.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-38", slide: 358, figmaNode: "110:31668",
  family: "marketing", role: "timeline", shape: "row", theme: "light", chrome: false,
  use: "A milestones headline beside three columns of milestone, description and photo",
  media: ["photo"], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 3, titles: 5, subtitles: 0, body: 4, stats: 0, icons: 0 },
  description: "marketing/grid-38 — an eyebrow, a 60px title and an explanatory line at the left, and three columns at the right each with a milestone name, a short description and a tall photo.",
  intent: {
    bestFor: ["the three milestones that mark project success, each with a picture of the outcome"],
    holds: "an eyebrow, a title, an explanatory line of up to about 90 characters and three milestones with a name of up to about 14 characters, a description of up to about 130 characters and a photo",
    itemChars: 130,
    avoid: ["more or fewer than three milestones", "no photos"],
    feel: "visual",
    needs: ["3 photos"],
  },
  schema: {
    caption: "string", title: "string", body: "string", milestones: "array of 3 {title, body, image}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "KPI / Goals", title: "Milestones", body: "Use this space to explain the overall milestone timeline and why it matters.",
    milestones: [1, 2, 3].map((n) => ({ title: `Milestone ${n}`, body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", image: mkPhoto(n) })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "51" },
    footer: MK_FOOTER,
  },
  render(s) {
    const m = (s.milestones || []).slice(0, 3);
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-cs-cols reveal" style="gap:24px;">
          <div class="v2f-mk-lcol" style="flex:0 0 600px;"><div class="v2f-mk-ph bottom" style="flex:1 1 0;"><div class="hd">${s.caption ? `<p class="v2f-cs-cap">${esc(s.caption)}</p>` : ""}<p class="v2f-cs-h2">${esc(s.title ?? "")}</p></div><p class="par md">${esc(s.body ?? "")}</p></div></div>
          <div class="v2f-mk-3ms">${m.map((x) => `<div class="ms"><p class="h">${esc(x.title ?? "")}</p><p class="b">${esc(x.body ?? "")}</p>${mkImg(x.image)}</div>`).join("")}</div>
        </div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
