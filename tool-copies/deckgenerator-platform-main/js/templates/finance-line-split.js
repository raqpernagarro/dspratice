// Template: finance/line-split — a text column (eyebrow + two-tone title + body)
// beside a two-line comparison chart in a panel. Light theme.
// Source Figma frame 110:18585 (finance/grid-09).
import { footerBar } from "../frame.js";
import { finSplitLeft, finLineChart } from "../finance-blocks.js";

export default {
  name: "finance/line-split",
  slide: 129,
  figmaNode: "110:18585",
  family: "finance",
  role: "chart",
  shape: "line-split",
  theme: "light",
  chrome: false,
  use: "A narrative on the left with a multi-line trend chart on the right — e.g. actual revenue vs. projection over several years.",
  media: [],
  capacity: { items: 2, min: 1, max: 3 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "finance/line-split — left text column + a right-panel multi-line chart.",
  intent: { bestFor: ["actual against plan or projection over several periods"], holds: "1–3 lines over the same periods", avoid: ["categories that are not time", "a single number"], feel: "data", needs: ["values per period for each line"] },
  schema: {
    caption: "string — eyebrow", title: "string — title", subtitle: "string — muted 2nd line",
    body: "array of paragraph strings",
    series: "array of { values:[number], color, width, dashed }",
    yTicks: "array of { value, label }", xLabels: "array of string",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Financials", title: "E-commerce", subtitle: "Total revenue",
    body: [
      "Over the past four years, our e-commerce segment has demonstrated strong and consistent growth. Starting from $0 million in Year 0, we have successfully scaled our operations, achieving $90 million in total revenue by Year 4. This growth trajectory highlights the effectiveness of our strategic initiatives, including market expansion, product diversification, and enhanced customer engagement.",
      "Our sustained upward trend, depicted by the solid black line, outpaces initial projections, indicating that our investments in technology and marketing have yielded substantial returns. As we continue to innovate and expand our e-commerce offerings, we are confident that this momentum will carry forward, driving even greater value for our stakeholders.",
    ],
    series: [
      { values: [0, 22, 45, 68, 90], color: "#010716", width: 2.5 },
      { values: [15, 18, 24, 45, 68], color: "#9aa0ab", width: 2.5 },
    ],
    yTicks: [
      { value: 0, label: "$0M" }, { value: 23, label: "$23M" }, { value: 45, label: "$45M" },
      { value: 68, label: "$68M" }, { value: 90, label: "$90M" },
    ],
    xLabels: ["Year 0", "Year 1", "Year 2", "Year 3", "Year 4"],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "296" },
  },
  render(s) {
    return `<div class="v2f-root">
      <div class="v2f-fin-split reveal">
        ${finSplitLeft({ meta: s.meta, caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body })}
        <div class="v2f-fin-cpanel">${finLineChart({ series: s.series || [], yTicks: s.yTicks || [], xLabels: s.xLabels || [] })}</div>
      </div>
      ${footerBar(s.footer)}
    </div>`;
  },
};
