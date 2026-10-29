// Template: strategy/data-03 — "Framework": a bold head over a framework table
// whose rows span a variable number of columns. Light theme.
// Source Figma frame 109:8856 (Strategy).
import { frame } from "../frame.js";
import { stBoldHead, stFramework } from "../strategy-blocks.js";

export default {
  name: "strategy/data-03",
  slide: 145,
  figmaNode: "109:8856",
  family: "strategy",
  role: "table",
  shape: "table",
  theme: "light",
  chrome: false,
  use: "A brand / strategy framework table: labelled rows that each span one wide cell or split into several columns (pillars), closing on a dense strip of topic markers.",
  media: [],
  capacity: { items: 6, min: 3, max: 8 },
  slots: { images: 0, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "strategy/data-03 — bold head + a framework table with variable column spans.",
  schema: {
    caption: "string — eyebrow", title: "string — bold title",
    rows: "array of { label, cells:[string], grow?:number, small?:boolean }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Subtitle", title: "Framework",
    rows: [
      { label: "Table cell", cells: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit."] },
      { label: "Mission", cells: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit."] },
      { label: "Positioning", cells: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit."] },
      {
        label: "Content typology", grow: 2.6,
        cells: ["Brand", "Product", "CSR", "People"].map((p) => ({
          title: p,
          text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.",
        })),
      },
      { label: "Objectives", grow: 1.1, cells: Array(4).fill("Lorem ipsum dolor sit amet.") },
      { label: "Topics", small: true, cells: Array(16).fill("x") },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "149" },
  },
  render(s) {
    const middle =
      stBoldHead({ caption: s.caption, title: s.title }) +
      stFramework({ rows: s.rows || [] });
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
