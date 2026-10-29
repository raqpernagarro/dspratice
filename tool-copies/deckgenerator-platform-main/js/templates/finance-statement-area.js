// Template: finance/statement-area — a big-number statement over a filled area /
// line chart (point value labels + period axis). Light theme.
// Source Figma frame 110:18247 (finance/grid-04). Chart is schema-driven.
import { frame } from "../frame.js";
import { finHead, finArea, finCaption } from "../finance-blocks.js";

const Q = ["Q3 23", "Q4 23", "Q1 24", "Q2 24", "Q3 24", "Q4 24"];
const V = [10, 13, 14, 30, 23, 81];

export default {
  name: "finance/statement-area",
  slide: 121,
  figmaNode: "110:18247",
  family: "finance",
  role: "chart",
  shape: "area",
  theme: "light",
  chrome: false,
  use: "A headline growth metric in words, proven by a filled area / line chart of the trend over time.",
  media: [],
  capacity: { items: 6, min: 3, max: 8 },
  slots: { images: 0, titles: 1, body: 1, stats: 6, icons: 0 },
  description: "finance/statement-area — big-number statement + a filled area chart with point labels.",
  intent: { bestFor: ["a headline growth metric proven by its trend over time"], holds: "3–8 periods with a value each", avoid: ["categories such as industries or regions (not a time series)", "counts of clients or logos", "dates without values"], feel: "data", needs: ["a value per period"] },
  schema: {
    caption: "string — eyebrow",
    statement: "string — the headline metric in words",
    points: "array of { label, value:number }",
    chartCaption: "string — small caption under the chart",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Growth",
    statement: "Growth accelerated to\n81% year-over-year",
    points: Q.map((label, i) => ({ label, value: V[i] })),
    chartCaption:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "288" },
  },
  render(s) {
    const middle =
      finHead({ caption: s.caption, statement: s.statement }) +
      finArea(s.points || []) +
      finCaption(s.chartCaption);
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
