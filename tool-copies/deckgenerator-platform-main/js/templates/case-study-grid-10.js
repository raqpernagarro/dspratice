// Template: case-study/grid-10 — a result over time, full width: a headline and
// an area chart on a dark card across the slide. Source Figma frame 110:40321.
import { topBar } from "../frame.js";
import { csHead, csAreaChart, csFooter, CS_FOOTER } from "../case-study-blocks.js";

export default {
  name: "case-study/grid-10", slide: 258, figmaNode: "110:40321",
  family: "case-study", role: "chart", shape: "single", theme: "light", chrome: false,
  use: "A headline over a full-width area chart of one series over time.",
  media: [], capacity: { items: 5, min: 3, max: 8 },
  slots: { images: 0, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "case-study/grid-10 — eyebrow + headline, full-width area chart on a dark card.",
  intent: {
    bestFor: ["one figure's growth over time that speaks for itself: customers, revenue, usage by quarter"],
    holds: "an eyebrow, a short headline, one series of 3–8 points (period label + value)",
    itemChars: 12,
    avoid: ["several series to compare", "a trend that needs explaining (use case-study/grid-09)", "three unrelated numbers (use case-study/data-04)"],
    feel: "data",
    needs: [],
  },
  schema: {
    caption: "string", title: "string",
    chart: "{ label, points: array of 3–8 { label, value } } — value is a number",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Results", title: "What achievements can you share?",
    chart: { label: "Customers", points: [
      { label: "Q320", value: 27 }, { label: "Q420", value: 124 },
      { label: "Q421", value: 375 }, { label: "Q422", value: 600 },
    ] },
    meta: { studio: "Product Studio", name: "Presentation Name", page: "23" },
    footer: CS_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${csHead({ caption: s.caption, title: s.title }, { maxWidth: 1200 })}
        <div class="v2f-cs-imgrow reveal">${csAreaChart(s.chart)}</div>
        ${csFooter(s.footer)}
      </div>`;
  },
};
