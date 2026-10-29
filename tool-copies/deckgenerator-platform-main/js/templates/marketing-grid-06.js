// Template: marketing/grid-06 — an eyebrow, a 60px headline and a paragraph at the left; three stacked photos that run off the top and bottom at the right.
// Source Figma frame 110:30609.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-06", slide: 319, figmaNode: "110:30609",
  family: "marketing", role: "gallery", shape: "split", theme: "light", chrome: false,
  use: "A heading and paragraph at the left, three tall photos bleeding off the right edge",
  media: ["photo"], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 3, titles: 2, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "marketing/grid-06 — an eyebrow, a 60px headline and a paragraph at the left; three stacked photos that run off the top and bottom at the right.",
  intent: {
    bestFor: ["a single insight with three images to illustrate it"],
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
    caption: "Market insights", title: "Share a core insight that helps guide your project decisions",
    body: "Lorem ipsum dolor sit amet, consectetur\nadipiscing elit. Proin ipsum purus, feugiat vel dolor\nsed, malesuada lobortis urna. Proin a lectus ut\nnibh euismod egestas. Aenean non tincidunt ex, a\ndapibus sem. Curabitur efficitur accumsan mollis.\nDonec in auctor ligula, vitae commodo turpis.",
    images: [0, 1, 2].map((i) => mkPhoto(i)),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "12" },
    footer: MK_FOOTER,
  },
  render(s) {
    // Figma 110:30609 — no footer; the left column runs the full 1000px and the
    // three 904×488 photos are offset so they bleed off the top and bottom.
    const im = s.images || [];
    return `
      <div class="v2f-root v2f-bleed">
        <div class="v2f-bleed-layer reveal">
          <div class="v2f-mk-bcol" style="left:40px;top:40px;width:904px;height:1000px;">
            ${topBar(s.meta)}
            ${mkPageHead({ caption: s.caption, title: s.title, body: s.body }, { bottom: true })}
          </div>
          ${[[-216, 0], [296, 1], [808, 2]].map(([t, i]) => `<div class="v2f-bleed-img" style="left:976px;top:${t}px;width:904px;height:488px;">${im[i] ? `<img src="${esc(im[i])}" alt="">` : ""}</div>`).join("")}
        </div>
      </div>`;
  },
};
