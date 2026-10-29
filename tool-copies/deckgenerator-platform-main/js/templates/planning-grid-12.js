// Template: planning/grid-12 — "Timeline": a full-year Gantt chart grouped by quarter.
// Full-width. Source Figma frame 105:3040.
import { frame } from "../frame.js";
import { plBoldHead, plGantt } from "../planning-blocks.js";

export default {
  name: "planning/grid-12", slide: 168, figmaNode: "105:3040",
  family: "planning", role: "timeline", shape: "gantt", theme: "light", chrome: false,
  use: "An annual Gantt: workstreams shown as bars across all twelve months, grouped by quarter.",
  media: [], capacity: { items: 8, min: 3, max: 12 },
  slots: { images: 0, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "planning/grid-12 — bold head + a 12-month Gantt grouped by quarter.",
  schema: {
    caption: "string", title: "string",
    columns: "array of 12 month labels", groups: "array of { label, span }",
    rows: "array of { label, start, span }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Timeline",
    columns: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    groups: [{ label: "Q1", span: 3 }, { label: "Q2", span: 3 }, { label: "Q3", span: 3 }, { label: "Q4", span: 3 }],
    // white content lanes separated by empty grey divider lanes ({}), first lane white
    rows: [
      { label: "Lorem ipsum", start: 0, span: 2 },
      {},
      { label: "Lorem ipsum", start: 1, span: 3 },
      {},
      { label: "Lorem ipsum", start: 3, span: 2 },
      {},
      { label: "Lorem ipsum", start: 3, span: 4 },
      {},
      { label: "Lorem ipsum", start: 6, span: 4 },
      {},
      { label: "Lorem ipsum", start: 9, span: 3 },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "71" },
  },
  render(s) {
    return frame(plBoldHead({ caption: s.caption, title: s.title }) +
      plGantt({ columns: s.columns || [], groups: s.groups || [], rows: s.rows || [] }),
      { meta: s.meta, footer: s.footer });
  },
};
