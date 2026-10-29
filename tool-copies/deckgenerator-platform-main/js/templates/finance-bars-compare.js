// Template: finance/bars-compare — a text column (title + bottom statement) beside a
// panel holding two small stacked bar charts split by a dashed rule. Light theme.
// Source Figma frame 110:18715 (finance/grid-14).
import { esc } from "../components.js";
import { footerBar } from "../frame.js";
import { finSplitLeft, finStackedBars } from "../finance-blocks.js";

const sub = (c = {}) => `
  <div class="v2f-fin-subchart">
    ${c.title ? `<p class="sh">${esc(c.title)}</p>` : ""}
    ${finStackedBars(c.bars || [])}
  </div>`;

export default {
  name: "finance/bars-compare",
  slide: 134,
  figmaNode: "110:18715",
  family: "finance",
  role: "chart",
  shape: "bars-compare",
  theme: "light",
  chrome: false,
  use: "A statement beside two small stacked bar charts side by side — comparing two related measures (e.g. cash from operations vs. adjusted free cash flow) over two periods.",
  media: [],
  capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 0, titles: 1, body: 1, stats: 8, icons: 0 },
  description: "finance/bars-compare — left text column + a panel with two dashed-divided stacked bar charts.",
  intent: { bestFor: ["two related measures, each over two periods"], holds: "2 small stacked bar charts with real values", avoid: ["dates or milestones", "a single measure", "non-numeric points"], feel: "data", needs: ["figures for two measures over two periods"] },
  schema: {
    caption: "string — eyebrow", title: "string",
    statement: "string — supporting line pinned to the bottom",
    charts: "array of 2 { title, bars:[{label, segments:[{value,display}]}] }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Financials", title: "Adjusted Free Cash Flow",
    statement: "We closed Q1 2023 with $480 million in cash, cash equivalents, and U.S. Treasury securities, maintaining a debt-free position. As of March 31, 2023, we also had $150 million in undrawn credit facilities readily available.",
    charts: [
      { title: "Cash from operations", bars: [
        { label: "Q4 23", segments: [{ value: 13, display: "$13M" }, { value: 15, display: "$15M" }] },
        { label: "Q4 24", segments: [{ value: 14, display: "$14M" }, { value: 16, display: "$16M" }] },
      ] },
      { title: "Adjusted free cash flow", bars: [
        { label: "Q4 23", segments: [{ value: 12, display: "$12M" }, { value: 14, display: "$14M" }] },
        { label: "Q4 24", segments: [{ value: 13, display: "$13M" }, { value: 15, display: "$15M" }] },
      ] },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "301" },
  },
  render(s) {
    return `<div class="v2f-root">
      <div class="v2f-fin-split reveal">
        ${finSplitLeft({ meta: s.meta, caption: s.caption, title: s.title, statement: s.statement })}
        <div class="v2f-fin-cpanel duo">${(s.charts || []).slice(0, 2).map(sub).join("")}</div>
      </div>
      ${footerBar(s.footer)}
    </div>`;
  },
};
