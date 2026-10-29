// Template: finance/holdings-table — eyebrow + bold title over a wide holdings
// table (symbol, name, price … gain) with a bold summary row. Light theme.
// Source Figma frame 110:18750 (finance/data-02).
import { frame } from "../frame.js";
import { finBoldHead, finTable } from "../finance-blocks.js";

export default {
  name: "finance/holdings-table",
  slide: 135,
  figmaNode: "110:18750",
  family: "finance",
  role: "table",
  shape: "table",
  theme: "light",
  chrome: false,
  use: "A wide holdings / positions table — symbol, name and a row of numeric columns — closed by a bold portfolio summary row.",
  media: [],
  capacity: { items: 6, min: 2, max: 8 },
  slots: { images: 0, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "finance/holdings-table — bold header + a wide centred data table with a summary row.",
  schema: {
    caption: "string — eyebrow", title: "string — bold title",
    columns: "array of column headers", labelHead: "string — first-column header",
    rows: "array of { label, cells:[string], summary:boolean }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Financials", title: "Adjusted Gross Margin",
    labelHead: "Symbol",
    columns: ["Name", "Price", "Price Change", "% Change", "Shares", "Price Paid", "Cost Basis", "Market Value", "Gain"],
    rows: [
      { label: "AAPL", cells: ["Apple Inc.", "151,92 US$", "-2,73 US$", "-1,77 %", "120", "1 032,82 US$", "123 937,80 US$", "188 286,31 US$", "64 348,50 US$"] },
      { label: "FB", cells: ["Facebook, Inc.", "233,50 US$", "2,79 US$", "1,21 %", "50", "1 032,82 US$", "51 640,75 US$", "120 581,15 US$", "68 940,40 US$"] },
      { label: "NKE", cells: ["Nike, Inc.", "122,91 US$", "-2,42 US$", "-1,93 %", "20", "619,69 US$", "12 393,78 US$", "25 388,66 US$", "12 994,88 US$"] },
      { label: "BTC", cells: ["Bitcoin", "70 122,91 US$", "20 120 US$", "20 %", "-", "50 122,91 US$", "50 122,91 US$", "188 286,31 US$", "64 348,5 US$"] },
      { label: "ETH", cells: ["Ethereum", "3 622,91 US$", "1 023,42 US$", "11,4 %", "-", "3 022,91 US$", "3 022,91 US$", "25 388,66 US$", "12 994,88 US$"] },
      { label: "Portfolio", cells: ["", "", "", "", "", "", "187 972,33 US$", "344 256,12 US$", "146 283,78 US$"], summary: true },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "302" },
  },
  render(s) {
    const middle =
      finBoldHead({ caption: s.caption, title: s.title }) +
      `<div class="v2f-fin-tablewrap bottom reveal">${finTable({ columns: s.columns || [], rows: s.rows || [], align: "center", labelHead: s.labelHead, hug: true })}</div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
