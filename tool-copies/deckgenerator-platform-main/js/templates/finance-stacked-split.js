// Template: finance/stacked-split — a text column (with legend) beside a two-segment
// stacked bar chart in a panel. Light theme.
// Source Figma frame 110:18650 (finance/grid-12).
import { footerBar } from "../frame.js";
import { finSplitLeft, finStackedBars } from "../finance-blocks.js";

export default {
  name: "finance/stacked-split",
  slide: 132,
  figmaNode: "110:18650",
  family: "finance",
  role: "chart",
  shape: "stacked-split",
  theme: "light",
  chrome: false,
  use: "A narrative + legend on the left with a two-segment stacked bar chart on the right — total sales split by segment across periods.",
  media: [],
  capacity: { items: 4, min: 2, max: 6 },
  slots: { images: 0, titles: 1, body: 1, stats: 4, icons: 0 },
  description: "finance/stacked-split — left text column + legend + a right-panel 2-segment stacked bar chart.",
  intent: { bestFor: ["a total per period split into two segments, with a narrative"], holds: "2–6 periods, each split into two parts", avoid: ["a slide with no figures", "decisions, asks or next steps", "dates without values"], feel: "data", needs: ["two values per period"] },
  schema: {
    caption: "string — eyebrow", title: "string", subtitle: "string — muted 2nd line",
    legend: "array of segment names", body: "array of paragraph strings",
    bars: "array of { label, segments:[{value, display}] }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Financials", title: "Total sales", subtitle: "Q1 – Q4",
    legend: ["Segment 1", "Segment 2"],
    body: [
      "The bar chart illustrates our total sales progression from Q1 to Q4 across two key segments. We see a steady increase in revenue, with Segment 1 and Segment 2 both contributing to this upward trend. By Q4, total sales reached $440M, driven by strong performance across both segments. This consistent growth reflects the success of our strategies and the robust demand in the market.",
    ],
    bars: [
      { label: "Q1 24", segments: [{ value: 120, display: "$120M" }, { value: 140, display: "$140M" }] },
      { label: "Q2 24", segments: [{ value: 130, display: "$130M" }, { value: 150, display: "$150M" }] },
      { label: "Q3 24", segments: [{ value: 200, display: "$200M" }, { value: 200, display: "$200M" }] },
      { label: "Q4 24", segments: [{ value: 220, display: "$220M" }, { value: 220, display: "$220M" }] },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "299" },
  },
  render(s) {
    return `<div class="v2f-root">
      <div class="v2f-fin-split reveal">
        ${finSplitLeft({ meta: s.meta, caption: s.caption, title: s.title, subtitle: s.subtitle, legend: s.legend, body: s.body })}
        <div class="v2f-fin-cpanel">${finStackedBars(s.bars || [])}</div>
      </div>
      ${footerBar(s.footer)}
    </div>`;
  },
};
