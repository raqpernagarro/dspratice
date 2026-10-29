// Template: finance/bars-duo-titled — eyebrow + bold title over two side-by-side
// bar-chart panels (small multiples). Light theme.
// Source Figma frame 110:18832 (finance/grid-15). Charts are schema-driven.
import { frame } from "../frame.js";
import { finBoldHead, finBarPanel } from "../finance-blocks.js";

export default {
  name: "finance/bars-duo-titled",
  slide: 136,
  figmaNode: "110:18832",
  family: "finance",
  role: "chart",
  shape: "duo",
  theme: "light",
  chrome: false,
  use: "A titled slide with two bar-chart panels side by side (small multiples) — the same measure across two cuts.",
  media: [],
  capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 0, titles: 1, body: 0, stats: 8, icons: 0 },
  description: "finance/bars-duo-titled — bold header + two panelled bar charts side by side.",
  intent: { bestFor: ["the same measure in two cuts, with a slide title"], holds: "2 panels of bars with real values", avoid: ["dates or milestones", "non-numeric points"], feel: "data", needs: ["two numeric series"] },
  schema: {
    caption: "string — eyebrow", title: "string — bold title",
    panels: "array of 2 { caption, title, bars:[{label,value,display}] }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Financials", title: "US business performance",
    panels: [
      { caption: "US business performance", title: "E-commerce revenue growth", bars: [
        { label: "Q1 24", value: 14, display: "14" }, { label: "Q2 24", value: 15, display: "15" },
        { label: "Q3 24", value: 20, display: "20" }, { label: "Q4 24", value: 20, display: "20" },
      ] },
      { caption: "US business performance", title: "E-commerce revenue growth", bars: [
        { label: "Q1 24", value: 14, display: "14" }, { label: "Q2 24", value: 15, display: "15" },
        { label: "Q3 24", value: 20, display: "20" }, { label: "Q4 24", value: 20, display: "20" },
      ] },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "303" },
  },
  render(s) {
    const middle =
      finBoldHead({ caption: s.caption, title: s.title }) +
      `<div class="v2f-fin-duo reveal">${(s.panels || []).slice(0, 2).map(finBarPanel).join("")}</div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
