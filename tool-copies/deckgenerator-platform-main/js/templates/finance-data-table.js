// Template: finance/data-table — an eyebrow + bold title over a dense financial
// data table (row labels + a grid of period columns). Light theme.
// Source Figma frame 110:18904 (finance/data-03).
import { esc } from "../components.js";
import { frame } from "../frame.js";
import { finTable } from "../finance-blocks.js";

const COLS = ["Q4 22", "Q1 23", "Q2 23", "Q3 23", "Q4 23", "Q1 24", "Q2 24", "Q3 24", "Q4 24"];
const row = (label) => ({
  label,
  cells: COLS.map((_, i) => (i % 2 ? "20 120,00 €" : "3 622,91 €")),
});

export default {
  name: "finance/data-table",
  slide: 139,
  figmaNode: "110:18904",
  family: "finance",
  role: "table",
  shape: "table",
  theme: "light",
  chrome: false,
  use: "A dense appendix table: named metric rows across many period columns (e.g. RPO, stock-based compensation by quarter).",
  media: [],
  capacity: { items: 4, min: 1, max: 8 },
  slots: { images: 0, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "finance/data-table — eyebrow + bold title + a dense multi-column financial data table.",
  schema: {
    caption: "string — eyebrow", title: "string — bold title",
    columns: "array of string — period column headers",
    rows: "array of { label, cells:[string] }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Appendix", title: "Additional Metrics and Notes",
    columns: COLS,
    rows: ["Total RPO", "Short-Term RPO", "Long-Term RPO", "Stock-Based Compensation"].map(row),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "306" },
  },
  render(s) {
    const head = `<div class="v2f-fin-head reveal"><div class="v2f-fin-headmain">
      ${s.caption ? `<p class="v2f-caption">${esc(s.caption)}</p>` : ""}
      ${s.title ? `<p class="v2f-fin-tabletitle">${esc(s.title)}</p>` : ""}
    </div></div>`;
    const middle =
      head +
      `<div class="v2f-fin-tablewrap reveal">${finTable({ columns: s.columns || [], rows: s.rows || [] })}</div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
