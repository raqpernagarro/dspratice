// Template: finance/statement-bars — a big-number statement over a vertical bar
// chart (value labels above each bar, quarter axis below, caption). Light theme.
// Source Figma frame 110:18282 (finance/grid-05). Charts are schema-driven.
import { frame } from "../frame.js";
import { finHead, finBars, finCaption } from "../finance-blocks.js";

const Q = ["Q4 22", "Q1 23", "Q2 23", "Q3 23", "Q4 23", "Q1 24", "Q2 24", "Q3 24", "Q4 24"];
const V = [115, 109, 184, 250, 274, 317, 301, 299, 343];

export default {
  name: "finance/statement-bars",
  slide: 123,
  figmaNode: "110:18282",
  family: "finance",
  role: "chart",
  shape: "bars",
  theme: "light",
  chrome: false,
  use: "A headline metric stated in words, proven by a vertical bar chart of the trend across periods.",
  media: [],
  capacity: { items: 9, min: 4, max: 12 },
  slots: { images: 0, titles: 1, body: 1, stats: 9, icons: 0 },
  description: "finance/statement-bars — big-number statement + a vertical bar chart with value labels.",
  intent: { bestFor: ["a headline metric proven by its values across periods"], holds: "4–12 periods with a value each", avoid: ["dates without values", "risks or milestones"], feel: "data", needs: ["a value per period"] },
  schema: {
    caption: "string — eyebrow",
    statement: "string — the headline metric in words",
    bars: "array of { label, value:number, display }",
    chartCaption: "string — small caption under the chart",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Net income",
    statement: "Net income of $343 million",
    bars: Q.map((label, i) => ({ label, value: V[i], display: `$${V[i]}M` })),
    chartCaption:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "290" },
  },
  render(s) {
    const middle =
      finHead({ caption: s.caption, statement: s.statement }) +
      `<div class="v2f-fin-chartwrap reveal">${finBars(s.bars || [])}${finCaption(s.chartCaption)}</div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
