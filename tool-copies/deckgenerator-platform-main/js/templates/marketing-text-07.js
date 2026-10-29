// Template: marketing/text-07 — an eyebrow, title and paragraph with two tinted metric cards underneath at the left, beside a large photo.
// Source Figma frame 110:30670.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/text-07", slide: 322, figmaNode: "110:30670",
  family: "marketing", role: "results", shape: "split", theme: "light", chrome: false,
  use: "A heading with two metric cards at the left, beside a large photo",
  media: ["photo"], capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 1, titles: 2, subtitles: 0, body: 1, stats: 2, icons: 0 },
  description: "marketing/text-07 — an eyebrow, title and paragraph with two tinted metric cards underneath at the left, beside a large photo.",
  intent: {
    bestFor: ["sizing a market with two headline figures next to an image"],
    holds: "an eyebrow, a title of 1–3 words, a paragraph of up to about 200 characters, two metrics (label and a value of up to about 12 characters) and a photo",
    itemChars: 12,
    avoid: ["more than two metrics", "long values"],
    feel: "visual",
    needs: ["a photo"],
  },
  schema: {
    caption: "string", title: "string", body: "string — paragraph, line breaks kept", metrics: "array of 2 {label, value}", image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Market insights", title: "Market size",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed\ndo eiusmod tempor incididunt ut labore et dolore magna\naliqua. Ut enim ad minim veniam, quis nostrud exercitation\nullamco laboris nisi ut aliquip ex ea commodo consequat.",
    metrics: [{ label: "Behavior", value: "40M total" }, { label: "Female", value: "100M total" }],
    image: mkPhoto(7),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "15" },
    footer: MK_FOOTER,
  },
  render(s) {
    const left = mkCol(s.meta, `
      <div class="v2f-mk-h244">${mkPageHead({ caption: s.caption, title: s.title, body: s.body }, { center: true })}</div>
      <div class="v2f-mk-mlist">${(s.metrics || []).slice(0, 2).map(mkMetric).join("")}</div>`, { width: 600 });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:32px;">${left}${mkImg(s.image)}</div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
