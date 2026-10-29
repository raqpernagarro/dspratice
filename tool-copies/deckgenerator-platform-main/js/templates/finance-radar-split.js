// Template: finance/radar-split — a text column beside a radar / spider chart in a
// panel. Light theme. Source Figma frame 110:18629 (finance/grid-11).
import { footerBar } from "../frame.js";
import { finSplitLeft, finRadar } from "../finance-blocks.js";

export default {
  name: "finance/radar-split",
  slide: 131,
  figmaNode: "110:18629",
  family: "finance",
  role: "chart",
  shape: "radar-split",
  theme: "light",
  chrome: false,
  use: "A narrative on the left with a radar chart on the right — comparing performance across several products or dimensions at a glance.",
  media: [],
  capacity: { items: 8, min: 3, max: 10 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "finance/radar-split — left text column + a right-panel radar chart.",
  intent: { bestFor: ["scores across several dimensions, for one or two subjects"], holds: "3–10 dimensions on one scale", avoid: ["values on different scales", "change over time"], feel: "data", needs: ["a score per dimension"] },
  schema: {
    caption: "string — eyebrow", title: "string", subtitle: "string — muted 2nd line",
    body: "array of paragraph strings",
    axes: "array of axis names", values: "array of number (one per axis)",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Financials", title: "Best-selling products", subtitle: "US",
    body: [
      "The radar chart highlights the performance of our top eight products in the U.S. market, showcasing the significant market demand and customer preference for each. Product 3 emerges as the leader, demonstrating its strong appeal and robust sales, closely followed by Product 1 and Product 2, which also contribute substantially to our revenue.",
      "Products 5 and 7 show moderate performance, indicating areas for potential growth with targeted marketing efforts and strategic enhancements. Meanwhile, Products 4, 6, and 8, although performing at a lower level, represent niches with potential for expansion through new strategies and innovation.",
    ],
    axes: ["Product 1", "Product 2", "Product 3", "Product 4", "Product 5", "Product 6", "Product 7", "Product 8"],
    values: [62, 70, 95, 30, 85, 35, 45, 40],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "298" },
  },
  render(s) {
    return `<div class="v2f-root">
      <div class="v2f-fin-split reveal">
        ${finSplitLeft({ meta: s.meta, caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body })}
        <div class="v2f-fin-cpanel">${finRadar({ axes: s.axes || [], values: s.values || [] })}</div>
      </div>
      ${footerBar(s.footer)}
    </div>`;
  },
};
