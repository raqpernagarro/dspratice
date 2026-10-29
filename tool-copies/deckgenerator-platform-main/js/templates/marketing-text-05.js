// Template: marketing/text-05 — (also covers Figma marketing/text-13, the same layout)   an eyebrow and a 60px insight at the left with four titled notes underneath, and a 2×2 block of photos at the right.
// Source Figma frame 110:30591.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/text-05", slide: 318, figmaNode: "110:30591",
  family: "marketing", role: "statement", shape: "split", theme: "light", chrome: false,
  use: "A column with a 60px insight and four short notes, beside four photos",
  media: ["photo"], capacity: { items: 4, min: 4, max: 4 },
  slots: { images: 4, titles: 6, subtitles: 0, body: 4, stats: 0, icons: 0 },
  description: "marketing/text-05 — an eyebrow and a 60px insight at the left with four titled notes underneath, and a 2×2 block of photos at the right.",
  intent: {
    bestFor: ["summing up the one insight that drives the project, with four supporting insights and imagery"],
    holds: "an eyebrow, an insight of up to about 70 characters, four notes with a title of 1–2 words and a sentence of up to about 150 characters, and four photos",
    itemChars: 150,
    avoid: ["more or fewer than four notes", "no photos"],
    feel: "visual",
    needs: ["4 photos"],
  },
  schema: {
    caption: "string", title: "string", notes: "array of 4 {title, body}", images: "array of 4 photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Market insights", title: "Summarize the most compelling insight driving the project",
    notes: [1, 2, 3, 4].map((i) => ({ title: `Insight ${i}`, body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam." })),
    images: [0, 1, 2, 3].map((i) => mkPhoto(i)),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "11" },
    footer: MK_FOOTER,
  },
  render(s) {
    const im = s.images || [];
    const left = mkCol(s.meta, `
      <div class="v2f-mk-fill">${mkPageHead({ caption: s.caption, title: s.title })}</div>
      <div class="v2f-mk-n22">${(s.notes || []).slice(0, 4).map(mkTextBlock).join("")}</div>`, { width: 904 });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:32px;">${left}
          <div class="v2f-mk-q4">${[0, 1, 2, 3].map((i) => mkImg(im[i])).join("")}</div>
        </div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
