// Template: marketing/grid-11 — an eyebrow and a three-line 60px headline, and three tinted cards at the bottom each with a label, a 100px figure and a sentence.
// Source Figma frame 110:30796.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";
import { metricCard } from "../metric-blocks.js";

export default {
  name: "marketing/grid-11", slide: 332, figmaNode: "110:30796",
  family: "marketing", role: "results", shape: "row", theme: "light", chrome: false,
  use: "A headline over three tinted cards with a large percentage each",
  media: [], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 3, stats: 3, icons: 0 },
  description: "marketing/grid-11 — an eyebrow and a three-line 60px headline, and three tinted cards at the bottom each with a label, a 100px figure and a sentence.",
  intent: {
    bestFor: ["the three numbers behind one audience insight"],
    holds: "an eyebrow, a headline of up to about 80 characters and three cards with a label, a figure of up to about 5 characters and a sentence of up to about 90 characters",
    itemChars: 90,
    avoid: ["more or fewer than three figures", "long headlines"],
    feel: "data",
    needs: [],
  },
  schema: {
    caption: "string", title: "string — line breaks kept", metrics: "array of 3 {label, value, text}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Audience", title: "Write a clear headline\nsummarizing the most important\ninsight about your audience",
    metrics: [{ label: "Behavior", value: "63%", text: "Shoppers research online before visiting a store." }, { label: "Scale", value: "45M", text: "New customers made their first-ever online purchase last year." }, { label: "Motivation", value: "22%", text: "Customers are willing to pay more for brands with fast delivery." }],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "25" },
    footer: MK_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-mk-fill reveal">${mkPageHead({ caption: s.caption, title: s.title })}</div>
        <div class="v2f-mk-3m reveal">${(s.metrics || []).slice(0, 3).map((m) => metricCard({ label: m.label, value: m.value, description: m.text }, { layout: "single", size: "large" })).join("")}</div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
