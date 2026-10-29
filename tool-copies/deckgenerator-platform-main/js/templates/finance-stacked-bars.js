// Template: finance/stacked-bars — eyebrow + bold title over a stacked vertical
// bar chart ($ segments with a bold total above each bar) and a legend. Light theme.
// Source Figma frame 110:18316 (finance/grid-06). Chart is schema-driven.
import { frame } from "../frame.js";
import { finBoldHead, finLegend, finStackedBars, finCaption } from "../finance-blocks.js";

const Q = ["Q4 22", "Q1 23", "Q2 23", "Q3 23", "Q4 23", "Q1 24", "Q2 24", "Q3 24", "Q4 24"];
// [US&Canada, Europe, Asia-Pacific, Rest of World] per quarter, with totals
const DATA = [
  { t: "$115M", s: [27, 55, 15, 15] }, { t: "$109M", s: [36, 45, 12, 18] },
  { t: "$184M", s: [63, 80, 27, 14] }, { t: "$250M", s: [143, 48, 45, 14] },
  { t: "$274M", s: [132, 50, 74, 18] }, { t: "$317M", s: [152, 60, 90, 15] },
  { t: "$301M", s: [160, 50, 70, 19] }, { t: "$299M", s: [160, 50, 70, 19] },
  { t: "$343M", s: [155, 74, 90, 24] },
];

export default {
  name: "finance/stacked-bars",
  slide: 125,
  figmaNode: "110:18316",
  family: "finance",
  role: "chart",
  shape: "stacked-bars",
  theme: "light",
  chrome: false,
  use: "A stacked bar chart breaking each period's total into segments (e.g. revenue by geography), with the total called out above each bar.",
  media: [],
  capacity: { items: 9, min: 3, max: 12 },
  slots: { images: 0, titles: 1, body: 0, stats: 9, icons: 0 },
  description: "finance/stacked-bars — bold header + a stacked $ bar chart with per-bar totals and a legend.",
  intent: { bestFor: ["a total per period broken into its parts"], holds: "3–12 periods, each split into the same parts", avoid: ["dates without values", "a single total per period (use plain bars)", "risks or milestones"], feel: "data", needs: ["values per part per period"] },
  schema: {
    caption: "string — eyebrow", title: "string — bold title",
    legend: "array of segment names",
    bars: "array of { label, display (total), segments:[{value, display}] }",
    chartCaption: "string",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Revenue", title: "Revenue by User Geography",
    legend: ["US & Canada", "Europe", "Asia-Pacific", "Rest of World"],
    bars: Q.map((label, i) => ({
      label, display: DATA[i].t,
      segments: DATA[i].s.map((v) => ({ value: v, display: `$${v}M` })),
    })),
    chartCaption:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "292" },
  },
  render(s) {
    const middle =
      finBoldHead({ caption: s.caption, title: s.title }) +
      `<div class="v2f-fin-chartwrap reveal">${finLegend(s.legend || [], { inline: true })}${finStackedBars(s.bars || [], { showTotal: true })}${finCaption(s.chartCaption)}</div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
