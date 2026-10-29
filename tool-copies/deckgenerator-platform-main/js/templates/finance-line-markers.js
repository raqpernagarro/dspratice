// Template: finance/line-markers — a text column (title + bottom statement) beside
// a line chart with point markers and a faint trend line, in a panel. Light theme.
// Source Figma frame 110:18680 (finance/grid-13).
import { footerBar } from "../frame.js";
import { finSplitLeft, finLineChart } from "../finance-blocks.js";

export default {
  name: "finance/line-markers",
  slide: 133,
  figmaNode: "110:18680",
  family: "finance",
  role: "chart",
  shape: "line-markers",
  theme: "light",
  chrome: false,
  use: "A headline metric (title + a supporting statement) beside a line chart with labelled point markers and a trend line.",
  media: [],
  capacity: { items: 4, min: 2, max: 6 },
  slots: { images: 0, titles: 1, body: 1, stats: 4, icons: 0 },
  description: "finance/line-markers — left text column + a right-panel line chart with markers and a trend line.",
  intent: { bestFor: ["a headline metric proven by its trend over time"], holds: "2–6 periods with a value each", avoid: ["categories that are not time", "dates without values", "risks or milestones"], feel: "data", needs: ["a value per period"] },
  schema: {
    caption: "string — eyebrow", title: "string",
    statement: "string — supporting line pinned to the bottom",
    series: "array of { values, color, width, dashed, markers:[{label}] }",
    yTicks: "array of { value, label }", xLabels: "array of string",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Financials", title: "GAAP Operating Profitability",
    statement: "We achieved GAAP operating profitability from operations of $620 million.",
    series: [
      { values: [210, 347, 483, 620], color: "#c4c9d2", width: 1.5 },
      { values: [210, 300, 400, 620], color: "#010716", width: 2.5, markers: [
        { label: "$210M" }, { label: "$300M" }, { label: "$400M" }, { label: "$620M" },
      ] },
    ],
    yTicks: [
      { value: 175, label: "$175M" }, { value: 350, label: "$350M" },
      { value: 525, label: "$525M" }, { value: 700, label: "$700M" },
    ],
    xLabels: ["Q1", "Q2", "Q3", "Q4"],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "300" },
  },
  render(s) {
    return `<div class="v2f-root">
      <div class="v2f-fin-split reveal">
        ${finSplitLeft({ meta: s.meta, caption: s.caption, title: s.title, statement: s.statement })}
        <div class="v2f-fin-cpanel">${finLineChart({ series: s.series || [], yTicks: s.yTicks || [], xLabels: s.xLabels || [], max: 700 })}</div>
      </div>
      ${footerBar(s.footer)}
    </div>`;
  },
};
