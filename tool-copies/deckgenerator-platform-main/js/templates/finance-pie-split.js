// Template: finance/pie-split — a text column beside a pie chart (with legend) in
// a panel. Light theme. Source Figma frame 110:18610 (finance/grid-10).
import { footerBar } from "../frame.js";
import { finSplitLeft, finPie, finLegend } from "../finance-blocks.js";

export default {
  name: "finance/pie-split",
  slide: 130,
  figmaNode: "110:18610",
  family: "finance",
  role: "chart",
  shape: "pie-split",
  theme: "light",
  chrome: false,
  use: "A narrative on the left with a pie chart on the right — a revenue / share breakdown across a handful of partners or segments.",
  media: [],
  capacity: { items: 4, min: 2, max: 6 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "finance/pie-split — left text column + a right-panel pie chart with legend.",
  intent: { bestFor: ["shares of one whole across a few segments"], holds: "2–6 segments that add up to 100%", avoid: ["values that are not parts of one whole", "change over time"], feel: "data", needs: ["a share per segment"] },
  schema: {
    caption: "string — eyebrow", title: "string", subtitle: "string — muted 2nd line",
    body: "array of paragraph strings",
    segments: "array of { value:number }", legend: "array of segment names",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Financials", title: "Retail", subtitle: "Results",
    body: [
      "The chart illustrates the distribution of revenue among our top retail partners, highlighting the significant contribution from Retailer 4, which accounts for the majority share. This strong performance underscores the effectiveness of our strategic partnerships and the impact of our targeted retail strategies.",
      "Retailer 1, 2, and 3 also show substantial contributions, reflecting a well-balanced portfolio across our retail channels. This diversification ensures stability and resilience, allowing us to capitalize on various market opportunities.",
      "As we continue to strengthen these relationships, we anticipate further growth in each segment, driving overall revenue and expanding our market reach.",
    ],
    segments: [{ value: 15 }, { value: 12 }, { value: 18 }, { value: 55 }],
    legend: ["Retailer 1", "Retailer 2", "Retailer 3", "Retailer 4"],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "297" },
  },
  render(s) {
    return `<div class="v2f-root">
      <div class="v2f-fin-split reveal">
        ${finSplitLeft({ meta: s.meta, caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body })}
        <div class="v2f-fin-cpanelcol">
          <div class="v2f-fin-cpanel">${finPie(s.segments || [])}</div>
          ${finLegend(s.legend || [], { inline: true })}
        </div>
      </div>
      ${footerBar(s.footer)}
    </div>`;
  },
};
