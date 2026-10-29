// Template: finance/stacked-bars-pct — eyebrow + bold title over a panelled
// stacked bar chart of percentage segments (e.g. expenses as % of revenue) with a
// legend. Light theme. Source Figma frame 110:18497 (finance/grid-07).
import { frame } from "../frame.js";
import { finBoldHead, finLegend, finStackedBars } from "../finance-blocks.js";

const Q = ["Q4 22", "Q1 23", "Q2 23", "Q3 23", "Q4 23", "Q1 24", "Q2 24", "Q3 24", "Q4 24"];
// [Cost of Revenue, R&D, Marketing & Sales, G&A] as %
const DATA = [
  [3, 10, 12, 14], [6, 11, 13, 15], [6, 11, 20, 20], [5, 11, 20, 20], [5, 11, 19, 31],
  [8, 13, 20, 28], [6, 13, 23, 32], [10, 13, 22, 31], [6, 13, 22, 40],
];

export default {
  name: "finance/stacked-bars-pct",
  slide: 127,
  figmaNode: "110:18497",
  family: "finance",
  role: "chart",
  shape: "stacked-bars",
  theme: "light",
  chrome: false,
  use: "A stacked bar chart of percentage composition per period (e.g. expense ratios), panelled with a legend.",
  media: [],
  capacity: { items: 9, min: 3, max: 12 },
  slots: { images: 0, titles: 1, body: 0, stats: 9, icons: 0 },
  description: "finance/stacked-bars-pct — bold header + a panelled stacked % bar chart with a legend.",
  intent: { bestFor: ["how the composition of a whole shifts across periods"], holds: "3–12 periods, each 100% split into the same parts", avoid: ["absolute values", "dates without values"], feel: "data", needs: ["percentages per part per period"] },
  schema: {
    caption: "string — eyebrow", title: "string — bold title",
    legend: "array of segment names",
    bars: "array of { label, segments:[{value, display}] }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Financials", title: "Expenses as a Percentage of Revenue",
    legend: ["Cost of Revenue", "Research & Development", "Marketing & Sales", "General & Administrative"],
    bars: Q.map((label, i) => ({
      label, segments: DATA[i].map((v) => ({ value: v, display: `${v} %` })),
    })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "294" },
  },
  render(s) {
    const middle =
      finBoldHead({ caption: s.caption, title: s.title }) +
      `<div class="v2f-fin-headlegend reveal">${finLegend(s.legend || [], { inline: true })}</div>` +
      `<div class="v2f-fin-tablewrap reveal"><div class="v2f-fin-panel">${finStackedBars(s.bars || [])}</div></div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
