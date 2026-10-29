// Template: marketing/text-08 — an eyebrow and 60px title over three columns: a dark card with a 60px statistic sentence, a tall photo, and a metric card above a photo.
// Source Figma frame 110:30680.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";
import { metricCard } from "../metric-blocks.js";

export default {
  name: "marketing/text-08", slide: 323, figmaNode: "110:30680",
  family: "marketing", role: "results", shape: "grid", theme: "light", chrome: false,
  use: "A dark statistic card, a photo and a metric card over a photo",
  media: ["photo"], capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 2, titles: 2, subtitles: 0, body: 1, stats: 2, icons: 0 },
  description: "marketing/text-08 — an eyebrow and 60px title over three columns: a dark card with a 60px statistic sentence, a tall photo, and a metric card above a photo.",
  intent: {
    bestFor: ["one striking statistic about a market or audience with a headline figure beside it and two photos"],
    holds: "an eyebrow, a title, a statistic of up to about 70 characters starting with its figure, one metric (label and value) and two photos",
    itemChars: 70,
    avoid: ["more than two figures", "long statistics"],
    feel: "visual",
    needs: ["2 photos"],
  },
  schema: {
    caption: "string", title: "string", stat: "{value, text}", metric: "{label, value}", images: "array of 2 photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Market insights", title: "Online Sales",
    stat: { value: "75%", text: "of users find current tools too complex to use effectively." },
    metric: { label: "Online Shoppers", value: "50M" },
    images: [2, 5].map((i) => mkPhoto(i)),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "16" },
    footer: MK_FOOTER,
  },
  render(s) {
    const im = s.images || []; const st = s.stat || {}; const m = s.metric || {};
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-mk-h108 reveal">${mkPageHead({ caption: s.caption, title: s.title })}</div>
        <div class="v2f-mk-3col reveal">
          <div class="c">${metricCard({ value: st.value, text: st.text }, { layout: "statement", tone: "t50", cls: "v2f-mk-fillm" })}</div>
          <div class="c">${mkImg(im[0])}</div>
          <div class="c split">${mkMetric({ label: m.label, value: m.value }, { cls: "v2f-mk-fillm" })}${mkImg(im[1])}</div>
        </div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
