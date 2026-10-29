// Template: marketing/grid-21 — a small header, then five centered figures at the middle of the slide with a 60px number and a 36px muted label each.
// Source Figma frame 110:30957.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";
import { metric } from "../metric-blocks.js";

export default {
  name: "marketing/grid-21", slide: 339, figmaNode: "110:30957",
  family: "marketing", role: "results", shape: "row", theme: "light", chrome: false,
  use: "Five big numbers in a row, each with a label",
  media: [], capacity: { items: 5, min: 3, max: 5 },
  slots: { images: 0, titles: 1, subtitles: 1, body: 0, stats: 5, icons: 0 },
  description: "marketing/grid-21 — a small header, then five centered figures at the middle of the slide with a 60px number and a 36px muted label each.",
  intent: {
    bestFor: ["an at-a-glance overview of volumes (assets, posts, weeks, reach)"],
    holds: "a title and subtitle and three to five figures with a value of up to about 8 characters and a label of up to about 28 characters",
    itemChars: 28,
    avoid: ["more than five figures", "long labels"],
    feel: "data",
    needs: [],
  },
  schema: {
    title: "string", subtitle: "string", metrics: "array of up to 5 {value, label}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Overview", subtitle: "Deliverables",
    metrics: [["68", "main assets"], ["25", "organic posts"], ["4-week", "paid campaign"], ["80%", "of people have this problem."], ["7", "pages on .com"]].map(([value, label]) => ({ value, label })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "32" },
    footer: MK_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${mkSmallHead({ title: s.title, subtitle: s.subtitle }, { mid: true, lg: true })}
        <div class="v2f-mk-5m reveal">${(s.metrics || []).slice(0, 5).map((m) => metric(m, { size: "medium", align: "center" })).join("")}</div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
