// Template: marketing/text-09 — an eyebrow and 60px title over three columns: a tinted card with a title, two 60px figures and a footnote, a tall photo, and a metric card above a photo.
// Source Figma frame 408:30076.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";
import { metricCard } from "../metric-blocks.js";

export default {
  name: "marketing/text-09", slide: 324, figmaNode: "408:30076",
  family: "marketing", role: "results", shape: "grid", theme: "light", chrome: false,
  use: "A market card with two figures, a photo and a metric card over a photo",
  media: ["photo"], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 2, titles: 3, subtitles: 0, body: 1, stats: 3, icons: 0 },
  description: "marketing/text-09 — an eyebrow and 60px title over three columns: a tinted card with a title, two 60px figures and a footnote, a tall photo, and a metric card above a photo.",
  intent: {
    bestFor: ["sizing a market: two headline figures with a one-line takeaway, plus a third figure and imagery"],
    holds: "an eyebrow, a title, a card title, two figures (label and value of up to about 12 characters), a one-line takeaway, one more metric and two photos",
    itemChars: 12,
    avoid: ["more than three figures", "long values"],
    feel: "visual",
    needs: ["2 photos"],
  },
  schema: {
    caption: "string", title: "string", card: "{title, stats: [{label, value}] (2), note}", metric: "{label, value}", images: "array of 2 photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Market insights", title: "Online Sales",
    card: { title: "Global Online Market", stats: [{ label: "Market Size", value: "$80B" }, { label: "Annual Growth Rate", value: "+9.5% YoY" }], note: "Shoppers research online before visiting a store." },
    metric: { label: "Online Shoppers", value: "50M" },
    images: [2, 5].map((i) => mkPhoto(i)),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "17" },
    footer: MK_FOOTER,
  },
  render(s) {
    const im = s.images || []; const c = s.card || {}; const m = s.metric || {};
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-mk-h108 reveal">${mkPageHead({ caption: s.caption, title: s.title })}</div>
        <div class="v2f-mk-3col reveal">
          <div class="c">${metricCard({ title: c.title, metrics: c.stats, description: c.note }, { layout: "multiple", cls: "v2f-mk-fillm" })}</div>
          <div class="c">${mkImg(im[0])}</div>
          <div class="c split">${mkMetric({ label: m.label, value: m.value }, { cls: "v2f-mk-fillm" })}${mkImg(im[1])}</div>
        </div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
