// Template: marketing/split-01 — a very wide photo at the left and, at the right, a 150px figure with a one-line caption under the header.
// Source Figma frame 110:30791.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";
import { metric } from "../metric-blocks.js";

export default {
  name: "marketing/split-01", slide: 331, figmaNode: "110:30791",
  family: "marketing", role: "results", shape: "split", theme: "light", chrome: false,
  use: "One huge figure with a caption beside a very wide photo",
  media: ["photo"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 0, subtitles: 0, body: 1, stats: 1, icons: 0 },
  description: "marketing/split-01 — a very wide photo at the left and, at the right, a 150px figure with a one-line caption under the header.",
  intent: {
    bestFor: ["the single number that sums up an audience or reach, with an image behind the story"],
    holds: "one figure of up to about 5 characters, a caption of up to about 60 characters and a photo",
    itemChars: 60,
    avoid: ["more than one figure", "long captions"],
    feel: "statement",
    needs: ["a photo"],
  },
  schema: {
    value: "string", text: "string", image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    value: "35M", text: "active social media followers across all platforms", image: mkPhoto(2),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "24" },
    footer: MK_FOOTER,
  },
  render(s) {
    const right = mkCol(s.meta, `${metric({ value: s.value, label: s.text }, { size: "large" })}`, { width: 700 });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:64px;">${mkImg(s.image)}${right}</div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
