// Template: marketing/text-06 — an eyebrow, a 60px headline and a paragraph at the left; three photos of different sizes scattered at the right, partly off the slide.
// Source Figma frame 110:30618.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/text-06", slide: 320, figmaNode: "110:30618",
  family: "marketing", role: "gallery", shape: "collage", theme: "light", chrome: false,
  use: "A heading and paragraph at the left, three scattered photos bleeding off the right",
  media: ["photo"], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 3, titles: 2, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "marketing/text-06 — an eyebrow, a 60px headline and a paragraph at the left; three photos of different sizes scattered at the right, partly off the slide.",
  intent: {
    bestFor: ["an observation about the market or audience illustrated by a looser collage of pictures"],
    holds: "an eyebrow, a headline of up to about 60 characters, a paragraph of up to about 300 characters and three photos",
    itemChars: 60,
    avoid: ["long headlines", "no photos"],
    feel: "visual",
    needs: ["3 photos"],
  },
  schema: {
    caption: "string", title: "string", body: "string — paragraph, line breaks kept", images: "array of 3 photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Market insights", title: "Describe a key observation about the market or audience",
    body: "Lorem ipsum dolor sit amet, consectetur\nadipiscing elit. Proin ipsum purus, feugiat vel dolor\nsed, malesuada lobortis urna. Proin a lectus ut\nnibh euismod egestas. Aenean non tincidunt ex, a\ndapibus sem. Curabitur efficitur accumsan mollis.\nDonec in auctor ligula, vitae commodo turpis.",
    images: [3, 4, 5].map((i) => mkPhoto(i)),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "13" },
    footer: MK_FOOTER,
  },
  render(s) {
    // Figma 110:30618 — no footer; photos placed on the slide in px.
    const im = s.images || [];
    const P = [[1031, -86, 768, 488], [1285, 491, 595, 378], [717, 841, 514, 378]];
    return `
      <div class="v2f-root v2f-bleed">
        <div class="v2f-bleed-layer reveal">
          ${P.map(([x, y, w, h], i) => `<div class="v2f-bleed-img" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;">${im[i] ? `<img src="${esc(im[i])}" alt="">` : ""}</div>`).join("")}
          <div class="v2f-mk-bcol" style="left:40px;top:40px;width:908px;height:1000px;">
            ${topBar(s.meta)}
            ${mkPageHead({ caption: s.caption, title: s.title, body: s.body }, { bottom: true })}
          </div>
        </div>
      </div>`;
  },
};
