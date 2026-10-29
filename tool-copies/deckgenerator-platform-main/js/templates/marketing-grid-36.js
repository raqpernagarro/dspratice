// Template: marketing/grid-36 — a small header, five phones in a row each showing a screen, and under them a timeline with five numbered steps, each with a title and a sentence.
// Source Figma frame 110:31593.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, mkPhonePost, mkPostCard, mkTick, mkCross, mkStepLine, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-36", slide: 355, figmaNode: "110:31593",
  family: "marketing", role: "timeline", shape: "timeline", theme: "light", chrome: false,
  use: "A run of show: five phones across, each over a numbered step on a timeline",
  media: ["photo"], capacity: { items: 5, min: 5, max: 5 },
  slots: { images: 5, titles: 7, subtitles: 1, body: 5, stats: 0, icons: 0 },
  description: "marketing/grid-36 — a small header, five phones in a row each showing a screen, and under them a timeline with five numbered steps, each with a title and a sentence.",
  intent: {
    bestFor: ["the run of show of a mobile or social campaign in five steps (teaser to launch)"],
    holds: "a title and subtitle and five steps with a title of up to about 14 characters, a sentence of up to about 60 characters and a screen image",
    itemChars: 60,
    avoid: ["more or fewer than five steps", "no screen images"],
    feel: "visual",
    needs: ["5 images"],
  },
  schema: {
    title: "string", subtitle: "string", steps: "array of 5 {title, text, image}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Run of show", subtitle: "Campaign",
    steps: ["Teaser", "Early Access", "Preview", "Countdown", "Launch"].map((title, i) => ({ title, text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", image: mkPhoto(i) })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "48" },
    footer: MK_FOOTER,
  },
  render(s) {
    const st = (s.steps || []).slice(0, 5);
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${mkSmallHead({ title: s.title, subtitle: s.subtitle }, { mid: true, md: true })}
        <div class="v2f-mk-ros reveal">
          <div class="ph5">${st.map((x) => `<div class="c"><div class="mp"><div class="scr">${x.image ? `<img src="${esc(x.image)}" alt="">` : ""}</div><img class="frm" src="assets/pitch/mockup-phone.png" alt=""></div></div>`).join("")}</div>
          ${mkStepLine(st)}
        </div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
