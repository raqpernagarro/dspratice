// Template: planning/data-02 — "Content Plan": a KPI × channel matrix of bulleted
// cells. Full-width. Source Figma frame 105:3450.
import { frame } from "../frame.js";
import { plBoldHead, plMatrix } from "../planning-blocks.js";

export default {
  name: "planning/data-02", slide: 170, figmaNode: "105:3450",
  family: "planning", role: "table", shape: "matrix", theme: "light", chrome: false,
  use: "A content / channel plan matrix: KPI rows against channel columns, each cell a short bulleted list.",
  media: [], capacity: { items: 6, min: 3, max: 7 },
  slots: { images: 0, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "planning/data-02 — bold head + a KPI × channel content-plan matrix.",
  schema: {
    caption: "string", title: "string",
    columns: "array of channel labels", rows: "array of { label, cells:[[bullets]] }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Content Plan",
    columns: ["Organic posts", "First email", "Second email", "Landing page", "Organic stories", "Offline media"],
    rows: Array(4).fill(0).map(() => ({ label: "KPI", cells: Array(6).fill(["Lorem ipsum", "Lorem ipsum", "Lorem ipsum"]) })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "73" },
  },
  render(s) {
    return frame(plBoldHead({ caption: s.caption, title: s.title }) +
      plMatrix({ columns: s.columns || [], rows: s.rows || [] }),
      { meta: s.meta, footer: s.footer });
  },
};
