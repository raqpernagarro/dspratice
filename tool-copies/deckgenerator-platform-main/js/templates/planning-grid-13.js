// Template: planning/grid-13 — "Output": a weekly output table with a dark band header
// and bulleted cells. Full-width. Source Figma frame 105:3416.
import { frame } from "../frame.js";
import { plBoldHead, plOutputTable } from "../planning-blocks.js";

export default {
  name: "planning/grid-13", slide: 169, figmaNode: "105:3416",
  family: "planning", role: "table", shape: "table", theme: "light", chrome: false,
  use: "A weekly output / deliverables table: columns per week, each cell a short bulleted list, under a dark banner.",
  media: [], capacity: { items: 6, min: 3, max: 8 },
  slots: { images: 0, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "planning/grid-13 — bold head + a weekly output table with bulleted cells.",
  schema: {
    caption: "string", title: "string",
    header: "array [left, right] dark band", columns: "array of week labels",
    rows: "array of { cells: [[bullets]] }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Output",
    header: ["Lorem ipsum", "Lorem ipsum"],
    columns: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
    rows: [
      { cells: Array(6).fill(["Lorem Ipsum", "Lorem Ipsum", "Lorem Ipsum"]) },
      { cells: Array(6).fill(["Lorem Ipsum", "Lorem Ipsum", "Lorem Ipsum"]) },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "72" },
  },
  render(s) {
    return frame(plBoldHead({ caption: s.caption, title: s.title }) +
      plOutputTable({ header: s.header || [], columns: s.columns || [], rows: s.rows || [] }),
      { meta: s.meta, footer: s.footer });
  },
};
