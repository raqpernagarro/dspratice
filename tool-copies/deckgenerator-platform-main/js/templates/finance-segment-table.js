// Template: finance/segment-table — eyebrow + bold title over a data table with
// grouped rows and dark "Total" summary bands. Light theme.
// Source Figma frame 110:18393 (finance/data-01).
import { frame } from "../frame.js";
import { finBoldHead, finTable } from "../finance-blocks.js";

const COLS = ["Q4 22", "Q1 23", "Q2 23", "Q3 23", "Q4 23", "Q1 24", "Q2 24", "Q3 24", "Q4 24"];
const cells = () => COLS.map((_, i) => (i % 2 ? "20 120,00 €" : "3 622,91 €"));
const totalCells = () => COLS.map((_, i) => (i % 2 ? "60 360,00 €" : "10 868,73 €"));

export default {
  name: "finance/segment-table",
  slide: 126,
  figmaNode: "110:18393",
  family: "finance",
  role: "table",
  shape: "table",
  theme: "light",
  chrome: false,
  use: "A grouped financial table where each group of metric rows is followed by a dark Total summary band.",
  media: [],
  capacity: { items: 8, min: 2, max: 10 },
  slots: { images: 0, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "finance/segment-table — bold header + a grouped data table with dark Total rows.",
  schema: {
    caption: "string — eyebrow", title: "string — bold title",
    columns: "array of period headers",
    rows: "array of { label, cells:[string], total:boolean }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Financials", title: "Segment Results",
    columns: COLS,
    rows: [
      { label: "Product 1", cells: cells() },
      { label: "Product 2", cells: cells() },
      { label: "Product 3", cells: cells() },
      { label: "Total", cells: totalCells(), total: true },
      { label: "Product family", cells: cells() },
      { label: "Product family", cells: cells() },
      { label: "Product family", cells: cells() },
      { label: "Total", cells: totalCells(), total: true },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "293" },
  },
  render(s) {
    const middle =
      finBoldHead({ caption: s.caption, title: s.title }) +
      `<div class="v2f-fin-tablewrap bottom reveal">${finTable({ columns: s.columns || [], rows: s.rows || [], hug: true })}</div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
