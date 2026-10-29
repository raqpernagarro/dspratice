// Template: finance/dotted-line — eyebrow + bold title over a panelled dotted-line
// density chart (dots tracing a trend, with % labels at key points). Light theme.
// Source Figma frame 110:18564 (finance/grid-08).
import { frame } from "../frame.js";
import { finBoldHead, finDottedLine } from "../finance-blocks.js";

export default {
  name: "finance/dotted-line",
  slide: 128,
  figmaNode: "110:18564",
  family: "finance",
  role: "chart",
  shape: "dotted-line",
  theme: "light",
  chrome: false,
  use: "A dotted-line trend chart in a panel — a soft way to show a fairly flat metric (e.g. gross margin) holding steady over time.",
  media: [],
  capacity: { items: 6, min: 3, max: 8 },
  slots: { images: 0, titles: 1, body: 0, stats: 6, icons: 0 },
  description: "finance/dotted-line — bold header + a panelled dotted-line chart with point labels.",
  intent: { bestFor: ["a metric holding steady over time"], holds: "3–8 periods with a value each", avoid: ["a steep change (use a line or bar chart)", "dates without values", "categories that are not time"], feel: "data", needs: ["a value per period"] },
  schema: {
    caption: "string — eyebrow", title: "string — bold title",
    points: "array of { label, value:number, display }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Financials", title: "Adjusted Gross Margin",
    points: [
      { label: "Q3 23", value: 80, display: "80 %" },
      { label: "Q4 23", value: 80, display: "80 %" },
      { label: "Q1 24", value: 80, display: "80 %" },
      { label: "Q2 24", value: 82, display: "82 %" },
      { label: "Q3 24", value: 80, display: "80 %" },
      { label: "Q4 24", value: 81, display: "81 %" },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "295" },
  },
  render(s) {
    const middle =
      finBoldHead({ caption: s.caption, title: s.title }) +
      `<div class="v2f-fin-tablewrap reveal"><div class="v2f-fin-cpanel">${finDottedLine({ points: s.points || [] })}</div></div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
