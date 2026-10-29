// Template: finance/bars-duo — two side-by-side bar-chart panels (small multiples),
// each with its own SectionHeader and an optional annotation. Light theme.
// Source Figma frame 110:18867 (finance/grid-16). Charts are schema-driven.
import { esc } from "../components.js";
import { frame } from "../frame.js";
import { finBars } from "../finance-blocks.js";

const panel = (p = {}) => `
  <div class="v2f-fin-panel">
    <div class="v2f-fin-panelhd">
      ${p.caption ? `<p class="ey">${esc(p.caption)}</p>` : ""}
      ${p.title ? `<p class="ti">${esc(p.title)}</p>` : ""}
    </div>
    ${finBars(p.bars || [], { inside: true, bracket: p.bracket || null })}
  </div>`;

export default {
  name: "finance/bars-duo",
  slide: 137,
  figmaNode: "110:18867",
  family: "finance",
  role: "chart",
  shape: "duo",
  theme: "light",
  chrome: false,
  use: "Two bar charts side by side (small multiples) — e.g. a commercial vs total view — each panelled with its own title.",
  media: [],
  capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 0, titles: 2, body: 0, stats: 8, icons: 0 },
  description: "finance/bars-duo — two panelled bar charts side by side, each with a SectionHeader.",
  intent: { bestFor: ["the same measure in two cuts, as two bar charts"], holds: "2 panels of bars with real values", avoid: ["dates or milestones", "non-numeric points"], feel: "data", needs: ["two numeric series"] },
  schema: {
    panels: "array of 2 { caption, title, bars:[{label,value,display}], bracket:{from,to,text} }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    panels: [
      {
        caption: "Customer count", title: "Commercial",
        bars: [
          { label: "Q1 24", value: 8, display: "8" },
          { label: "Q2 24", value: 12, display: "12" },
          { label: "Q3 24", value: 17, display: "17" },
          { label: "Q4 24", value: 18, display: "18" },
        ],
      },
      {
        caption: "Customer count", title: "Total",
        bracket: { from: 0, to: 2, text: "+100% YoY" },
        bars: [
          { label: "Q1 24", value: 10, display: "10" },
          { label: "Q2 24", value: 15, display: "15" },
          { label: "Q3 24", value: 20, display: "20" },
          { label: "Q4 24", value: 20, display: "20" },
        ],
      },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "304" },
  },
  render(s) {
    const middle = `<div class="v2f-fin-duo reveal">${(s.panels || []).slice(0, 2).map(panel).join("")}</div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
