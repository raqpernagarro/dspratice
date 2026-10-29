// Template: strategy/grid-04 — "Allocation": a left text column (head + line-style
// legend + body) beside a multi-line cost chart with phase dividers. Light theme.
// Source Figma frame 109:8899 (Strategy).
import { footerBar } from "../frame.js";
import { stTextCol, stLineChart } from "../strategy-blocks.js";

export default {
  name: "strategy/grid-04",
  slide: 146,
  figmaNode: "109:8899",
  family: "strategy",
  role: "chart",
  shape: "line-split",
  theme: "light",
  chrome: false,
  use: "A resource / cost allocation over time: a narrative + legend on the left, a multi-line trend chart with phase dividers on the right.",
  media: [],
  capacity: { items: 3, min: 1, max: 4 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "strategy/grid-04 — left text/legend column + a right multi-line chart with phase dividers.",
  intent: { bestFor: ["resource or cost allocation over time across phases"], holds: "1–4 lines over the same periods, with phase dividers", avoid: ["a single number", "categories that are not time"], feel: "data", needs: ["values per period"] },
  schema: {
    caption: "string — eyebrow", title: "string", subtitle: "string — muted 2nd line",
    legend: "array of { label, style: dashed|solid|bold }",
    body: "array of paragraph strings",
    series: "array of { values:[y…], dashed, bold, points:[{label}] }",
    yTicks: "array of { value, label }", xTicks: "array of { at:0..1, label }",
    phases: "array of { at:0..1, label }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Allocation", subtitle: "Subtitle",
    legend: [
      { label: "Cost X", style: "dashed" },
      { label: "Cost Y", style: "grey" },
      { label: "Cost Z", style: "bold" },
    ],
    body: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    ],
    series: [
      { values: [4100, 4150, 4250, 4600, 4900, 5150, 5300], dashed: true },
      { values: [2500, 2600, 2700, 2950, 3200, 3380, 3500], color: "#9aa0ab",
        points: [null, null, { label: "2700k" }, null, { label: "3200k" }, null, { label: "3500k" }] },
      { values: [500, 520, 600, 700, 850, 980, 1100], bold: true,
        points: [null, null, { label: "600k" }, null, { label: "850k" }, null, { label: "1100k" }] },
    ],
    yTicks: [
      { value: 0, label: "0" }, { value: 1000, label: "1000k" }, { value: 2000, label: "2000k" },
      { value: 3000, label: "3000k" }, { value: 4000, label: "4000k" }, { value: 5000, label: "5000k" },
    ],
    max: 5600,
    xTicks: [{ at: 0.16, label: "Y1" }, { at: 0.5, label: "Y2" }, { at: 0.83, label: "Y3" }],
    phases: [{ at: 0.33, label: "Phase 01" }, { at: 0.66, label: "Phase 02" }, { at: 1, label: "Phase 03" }],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "150" },
  },
  render(s) {
    return `<div class="v2f-root">
      <div class="v2f-st-split reveal">
        ${stTextCol({ meta: s.meta, caption: s.caption, title: s.title, subtitle: s.subtitle, legend: s.legend, body: s.body, side: "left" })}
        <div class="v2f-st-diagram">${stLineChart({ series: s.series || [], yTicks: s.yTicks || [], xTicks: s.xTicks || [], phases: s.phases || [], max: s.max })}</div>
      </div>
      ${footerBar(s.footer)}
    </div>`;
  },
};
