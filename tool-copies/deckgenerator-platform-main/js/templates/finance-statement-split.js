// Template: finance/statement-split — a big-number statement (left) with a
// supporting paragraph (right), over a single horizontal stacked proportion bar
// with legend. Light theme. Source Figma frame 110:18269 (finance/split-01).
import { frame } from "../frame.js";
import { finHead, finProportion, finCaption } from "../finance-blocks.js";

export default {
  name: "finance/statement-split",
  slide: 122,
  figmaNode: "110:18269",
  family: "finance",
  role: "chart",
  shape: "proportion",
  theme: "light",
  chrome: false,
  use: "A headline metric in words with a supporting paragraph, plus a stacked proportion bar showing a split (e.g. revenue by channel).",
  media: [],
  capacity: { items: 4, min: 2, max: 5 },
  slots: { images: 0, titles: 1, body: 2, stats: 0, icons: 0 },
  description: "finance/statement-split — statement + intro + a horizontal stacked proportion bar with legend.",
  intent: { bestFor: ["a headline metric with the split of one whole beneath it"], holds: "2–5 parts that add up to one whole", avoid: ["values that are not parts of one whole", "separate measures side by side"], feel: "data", needs: ["a share per part"] },
  schema: {
    caption: "string — eyebrow",
    statement: "string — the headline metric in words",
    intro: "string — supporting paragraph (right)",
    legend: "array of string — segment labels",
    segments: "array of { value:number }",
    chartCaption: "string — small caption under the bar",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Revenue",
    statement: "Total revenue of $12.4 billion",
    intro:
      "Company X had a successful year in 2022, generating $12.4 billion in revenue, which is a significant increase from the previous year's earnings. The company's focus on innovation led to the development of innovative and high-quality products that met the needs and demands of its target audience.",
    legend: ["E-commerce", "Retail"],
    segments: [{ value: 20 }, { value: 80 }],
    chartCaption:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "289" },
  },
  render(s) {
    const middle =
      finHead({ caption: s.caption, statement: s.statement, intro: s.intro }) +
      `<div class="v2f-fin-prop reveal">${finProportion({
        legend: s.legend || [],
        segments: s.segments || [],
      })}${finCaption(s.chartCaption)}</div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
